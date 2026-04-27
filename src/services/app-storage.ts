import type { Drive, DriveReference } from "./drives/types";
import type { LogicalFolder } from "../contexts/FoldersContext";
import {
  STORAGE_KEYS,
  readLocalStorageJson,
  writeLocalStorageJson,
} from "./storage/storage";

// ---------------------------------------------------------------------------
// File name constants
//
// We deliberately avoid the legacy `sdrive-session.json` and
// `sdrive-folders.json` filenames. Known secondary accounts now use the
// dedicated backend registry (`get_secondary_drives` / `set_secondary_drive`).
// Rich logical-folder metadata lives in `sdrive-logical-folders.json`, written
// through `set_appdata_file_by_name` with the heartbeat lock helper below.
// ---------------------------------------------------------------------------

const LOGICAL_FOLDERS_FILE = "sdrive-logical-folders.json";
const LOGICAL_FOLDERS_LOCK_FILE = "sdrive-logical-folders.lock.json";

// Secondary drive refresh tokens are mirrored into the primary drive's
// appdata so the user can re-attach all secondary drives by signing back in
// with just the primary. The file lives in the primary drive's app-private
// scope (e.g. Google Drive's `appDataFolder`), accessible only via OAuth
// tokens for this application.
const SECONDARY_CREDENTIALS_FILE = "sdrive-secondary-credentials.json";
const SECONDARY_CREDENTIALS_LOCK_FILE =
  "sdrive-secondary-credentials.lock.json";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface KnownSecondaryAccount extends DriveReference {}

export interface StoredSecondaryCredential extends DriveReference {
  refresh_token: string;
  updatedAt: number;
}

export interface RemoteSecondaryCredentialsState {
  version: 1;
  updatedAt: number;
  credentials: StoredSecondaryCredential[];
}

export interface RemoteFoldersState {
  version: 3;
  updatedAt: number;
  logicalFolders: LogicalFolder[];
}

interface WriteLock {
  lockId: string;
  acquiredAt: number;
}

// ---------------------------------------------------------------------------
// Empty states
// ---------------------------------------------------------------------------

const EMPTY_FOLDERS_STATE: RemoteFoldersState = {
  version: 3,
  updatedAt: 0,
  logicalFolders: [],
};

// ---------------------------------------------------------------------------
// Lock constants
//
// Heartbeat keeps the lock fresh while the writer is active, so the stale
// threshold only kicks in when the writer process has died (crashed tab,
// network failure mid-write, etc.). Verify delay covers Drive's eventual
// consistency window.
// ---------------------------------------------------------------------------

const LOCK_HEARTBEAT_MS = 10_000;
const LOCK_STALE_MS = 30_000;
const LOCK_VERIFY_DELAY_MS = 400;
const MAX_LOCK_RETRIES = 8;
const LOCK_RETRY_BASE_MS = 250;

// ---------------------------------------------------------------------------
// Normalization helpers
// ---------------------------------------------------------------------------

function normalizeKnownSecondaryAccounts(
  accounts: unknown,
): KnownSecondaryAccount[] {
  if (!Array.isArray(accounts)) {
    return [];
  }

  const deduped = new Map<string, KnownSecondaryAccount>();
  accounts.forEach((item) => {
    if (!item || typeof item !== "object") {
      return;
    }
    const provider = String((item as { provider?: unknown }).provider || "").trim();
    const email = String((item as { email?: unknown }).email || "").trim();
    if (!provider || !email) {
      return;
    }
    deduped.set(`${provider}:${email}`.toLowerCase(), { provider, email });
  });

  return Array.from(deduped.values());
}

function normalizeFoldersState(
  value: Partial<RemoteFoldersState> | null | undefined,
): RemoteFoldersState {
  const rawFolders = Array.isArray(value?.logicalFolders)
    ? value.logicalFolders
    : EMPTY_FOLDERS_STATE.logicalFolders;

  return {
    version: 3,
    updatedAt: Number(value?.updatedAt || 0),
    logicalFolders: rawFolders.map((folder) => ({
      ...folder,
      // Keep file tree local-only in the remote manifest.
      items: [],
    })),
  };
}

// ---------------------------------------------------------------------------
// Local cache helpers (folders)
// ---------------------------------------------------------------------------

export function readRemoteFoldersStateCache(): RemoteFoldersState {
  const cached = readLocalStorageJson<Partial<RemoteFoldersState>>(
    STORAGE_KEYS.remoteFoldersStateCache,
    EMPTY_FOLDERS_STATE,
  );
  return normalizeFoldersState(cached);
}

export function writeRemoteFoldersStateCache(value: RemoteFoldersState) {
  return writeLocalStorageJson(STORAGE_KEYS.remoteFoldersStateCache, value);
}

// ---------------------------------------------------------------------------
// Lock primitives (heartbeat-based)
// ---------------------------------------------------------------------------

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface LockHandle {
  lockId: string;
  release: () => Promise<void>;
}

async function acquireRemoteLock(
  drive: Drive,
  lockFile: string,
): Promise<LockHandle> {
  for (let attempt = 0; attempt < MAX_LOCK_RETRIES; attempt++) {
    if (attempt > 0) {
      await delay(LOCK_RETRY_BASE_MS * 2 ** (attempt - 1));
    }

    // A live lock means another writer is heartbeating. Skip and retry.
    const existing = await drive.read_app_storage_json<WriteLock | null>(lockFile);
    if (existing && Date.now() - existing.acquiredAt < LOCK_STALE_MS) {
      continue;
    }

    const lockId = crypto.randomUUID();
    await drive.write_app_storage_json<WriteLock>(lockFile, {
      lockId,
      acquiredAt: Date.now(),
    });

    // Drive is eventually-consistent; wait then verify our claim survived.
    await delay(LOCK_VERIFY_DELAY_MS);
    const verified = await drive.read_app_storage_json<WriteLock | null>(lockFile);
    if (verified?.lockId !== lockId) {
      continue;
    }

    // Heartbeat keeps `acquiredAt` fresh so other writers see this lock as
    // alive. If the writer crashes, the heartbeat stops and the stale-lock
    // threshold takes over within `LOCK_STALE_MS`.
    let released = false;
    const heartbeat = setInterval(() => {
      if (released) return;
      void drive
        .write_app_storage_json<WriteLock>(lockFile, {
          lockId,
          acquiredAt: Date.now(),
        })
        .catch((error) => {
          console.warn(`Lock heartbeat failed for ${lockFile}`, error);
        });
    }, LOCK_HEARTBEAT_MS);

    const release = async () => {
      if (released) return;
      released = true;
      clearInterval(heartbeat);
      try {
        await drive.delete_app_storage_json(lockFile);
      } catch (error) {
        console.warn(`Unable to release remote lock ${lockFile}`, error);
        // Fallback: blank the lock so the next writer doesn't see a stale
        // claim while the stale-lock timer is still running.
        try {
          await drive.write_app_storage_json<null>(lockFile, null);
        } catch {
          // Best-effort; the stale-lock timeout will eventually unblock.
        }
      }
    };

    return { lockId, release };
  }

  throw new Error(
    `Unable to acquire remote lock on ${lockFile} after ${MAX_LOCK_RETRIES} attempts`,
  );
}

/**
 * Run `mutator` while holding a heartbeat lock on `lockFile`. The mutator
 * receives the latest committed value of `dataFile` and returns the value to
 * persist. The lock is always released (and deleted) on completion.
 *
 * The flow guarantees the lock-read-verify-write pattern:
 *   1. Acquire lock (heartbeat keeps it alive while we work)
 *   2. Re-read `dataFile` so the mutator sees the freshest committed state
 *   3. Mutator decides whether to overwrite (it can return the unchanged
 *      `latest` to abort the write)
 *   4. Write the result, then release+delete the lock
 */
export async function updateRemoteJson<T>(
  drive: Drive,
  dataFile: string,
  lockFile: string,
  mutator: (latest: T | null) => T | null | Promise<T | null>,
): Promise<T | null> {
  const lock = await acquireRemoteLock(drive, lockFile);
  try {
    const latest = await drive.read_app_storage_json<T>(dataFile);
    const next = await mutator(latest);
    if (next === null || next === latest) {
      // Mutator chose not to overwrite (e.g. nothing changed, or remote is
      // newer than our payload).
      return latest;
    }
    await drive.write_app_storage_json<T>(dataFile, next);
    return next;
  } finally {
    await lock.release();
  }
}

// ---------------------------------------------------------------------------
// Known secondary accounts (dedicated backend registry)
// ---------------------------------------------------------------------------

export async function readKnownSecondaryAccounts(
  primaryDrive: Drive | null,
): Promise<KnownSecondaryAccount[]> {
  if (!primaryDrive) {
    return [];
  }
  try {
    const entries = await primaryDrive.list_known_secondary_accounts();
    return normalizeKnownSecondaryAccounts(entries);
  } catch (error) {
    console.warn("Unable to read known secondary accounts", error);
    return [];
  }
}

export async function registerKnownSecondaryAccount(
  primaryDrive: Drive | null,
  account: KnownSecondaryAccount,
): Promise<void> {
  if (!primaryDrive || !account?.provider || !account?.email) {
    return;
  }
  try {
    await primaryDrive.register_known_secondary_account({
      provider: account.provider,
      email: account.email,
    });
  } catch (error) {
    console.warn(
      `Unable to register secondary account ${account.provider}:${account.email}`,
      error,
    );
  }
}

// ---------------------------------------------------------------------------
// Logical folders (single appdata file with heartbeat-locked writes)
// ---------------------------------------------------------------------------

export async function readRemoteFoldersState(
  primaryDrive: Drive | null,
): Promise<RemoteFoldersState> {
  if (!primaryDrive) {
    return readRemoteFoldersStateCache();
  }

  try {
    const raw = await primaryDrive.read_app_storage_json<Partial<RemoteFoldersState>>(
      LOGICAL_FOLDERS_FILE,
    );
    const normalized = normalizeFoldersState(raw);
    writeRemoteFoldersStateCache(normalized);
    return normalized;
  } catch (error) {
    console.warn("Unable to read remote folders state, using cache", error);
    return readRemoteFoldersStateCache();
  }
}

export async function writeRemoteFoldersState(
  primaryDrive: Drive | null,
  partial: Partial<RemoteFoldersState>,
): Promise<RemoteFoldersState> {
  if (!primaryDrive) {
    const current = readRemoteFoldersStateCache();
    const next: RemoteFoldersState = {
      version: 3,
      updatedAt: Date.now(),
      logicalFolders: (partial.logicalFolders ?? current.logicalFolders).map(
        (folder) => ({ ...folder, items: [] }),
      ),
    };
    writeRemoteFoldersStateCache(next);
    return next;
  }

  const result = await updateRemoteJson<RemoteFoldersState>(
    primaryDrive,
    LOGICAL_FOLDERS_FILE,
    LOGICAL_FOLDERS_LOCK_FILE,
    (latest) => {
      const latestNormalized = normalizeFoldersState(latest);
      const incoming = (partial.logicalFolders ?? latestNormalized.logicalFolders).map(
        (folder) => ({ ...folder, items: [] }),
      );

      // Pre-write verification: only overwrite if our payload is at least as
      // fresh as what's on the server. Otherwise drop our write so the more
      // recent remote state wins.
      const incomingMostRecent = incoming.reduce(
        (max, folder) => Math.max(max, Number(folder.updatedAt) || 0),
        0,
      );
      const remoteMostRecent = (latestNormalized.logicalFolders || []).reduce(
        (max, folder) => Math.max(max, Number(folder.updatedAt) || 0),
        0,
      );
      if (incomingMostRecent > 0 && incomingMostRecent < remoteMostRecent) {
        return latest;
      }

      return {
        version: 3,
        updatedAt: Date.now(),
        logicalFolders: incoming,
      };
    },
  );

  const merged = normalizeFoldersState(result);
  writeRemoteFoldersStateCache(merged);
  return merged;
}

/**
 * Best-effort mirror of a newly created logical folder into the dedicated
 * backend registry (`set_logical_folder`). The registry stores only
 * `{name, drives}`; rich settings (packing, listing, status, root folder ids)
 * remain in the locked appdata file above. The dedicated endpoint is no-op-
 * if-exists, so this is safe to call repeatedly.
 */
export async function mirrorLogicalFolderToRegistry(
  primaryDrive: Drive | null,
  folder: LogicalFolder,
): Promise<void> {
  if (!primaryDrive) {
    return;
  }
  const drives = (folder.backends || []).map((backend) => [
    backend.provider,
    backend.email,
    backend.rootFolderId,
  ]);
  if (drives.length === 0) {
    return;
  }
  try {
    await primaryDrive.register_logical_folder(folder.name, drives);
  } catch (error) {
    console.warn(
      `Unable to mirror logical folder "${folder.name}" to registry`,
      error,
    );
  }
}

// ---------------------------------------------------------------------------
// Secondary drive credentials (refresh tokens mirrored on primary appdata)
// ---------------------------------------------------------------------------

function normalizeSecondaryCredentials(
  value: Partial<RemoteSecondaryCredentialsState> | null | undefined,
): RemoteSecondaryCredentialsState {
  const raw = Array.isArray(value?.credentials) ? value.credentials : [];
  const deduped = new Map<string, StoredSecondaryCredential>();
  raw.forEach((entry) => {
    if (!entry || typeof entry !== "object") {
      return;
    }
    const provider = String(
      (entry as { provider?: unknown }).provider || "",
    ).trim();
    const email = String((entry as { email?: unknown }).email || "").trim();
    const refresh_token = String(
      (entry as { refresh_token?: unknown }).refresh_token || "",
    );
    if (!provider || !email || !refresh_token) {
      return;
    }
    const updatedAt = Number((entry as { updatedAt?: unknown }).updatedAt) || 0;
    deduped.set(`${provider}:${email}`.toLowerCase(), {
      provider,
      email,
      refresh_token,
      updatedAt,
    });
  });

  return {
    version: 1,
    updatedAt: Number(value?.updatedAt) || 0,
    credentials: Array.from(deduped.values()),
  };
}

export async function readRemoteSecondaryCredentials(
  primaryDrive: Drive | null,
): Promise<StoredSecondaryCredential[]> {
  if (!primaryDrive) {
    return [];
  }
  try {
    const raw = await primaryDrive.read_app_storage_json<
      Partial<RemoteSecondaryCredentialsState>
    >(SECONDARY_CREDENTIALS_FILE);
    return normalizeSecondaryCredentials(raw).credentials;
  } catch (error) {
    console.warn("Unable to read remote secondary credentials", error);
    return [];
  }
}

export async function upsertRemoteSecondaryCredential(
  primaryDrive: Drive | null,
  credential: { provider: string; email: string; refresh_token: string },
): Promise<void> {
  if (
    !primaryDrive ||
    !credential?.provider ||
    !credential?.email ||
    !credential?.refresh_token
  ) {
    return;
  }
  try {
    await updateRemoteJson<RemoteSecondaryCredentialsState>(
      primaryDrive,
      SECONDARY_CREDENTIALS_FILE,
      SECONDARY_CREDENTIALS_LOCK_FILE,
      (latest) => {
        const normalized = normalizeSecondaryCredentials(latest);
        const existing = normalized.credentials.find(
          (entry) =>
            entry.provider === credential.provider &&
            entry.email === credential.email,
        );
        if (existing && existing.refresh_token === credential.refresh_token) {
          // Nothing changed; skip the write.
          return latest;
        }
        const filtered = normalized.credentials.filter(
          (entry) =>
            !(
              entry.provider === credential.provider &&
              entry.email === credential.email
            ),
        );
        return {
          version: 1,
          updatedAt: Date.now(),
          credentials: [
            ...filtered,
            {
              provider: credential.provider,
              email: credential.email,
              refresh_token: credential.refresh_token,
              updatedAt: Date.now(),
            },
          ],
        };
      },
    );
  } catch (error) {
    console.warn(
      `Unable to mirror secondary credential for ${credential.provider}:${credential.email}`,
      error,
    );
  }
}

export async function removeRemoteSecondaryCredential(
  primaryDrive: Drive | null,
  reference: { provider: string; email: string },
): Promise<void> {
  if (!primaryDrive || !reference?.provider || !reference?.email) {
    return;
  }
  try {
    await updateRemoteJson<RemoteSecondaryCredentialsState>(
      primaryDrive,
      SECONDARY_CREDENTIALS_FILE,
      SECONDARY_CREDENTIALS_LOCK_FILE,
      (latest) => {
        const normalized = normalizeSecondaryCredentials(latest);
        const next = normalized.credentials.filter(
          (entry) =>
            !(
              entry.provider === reference.provider &&
              entry.email === reference.email
            ),
        );
        if (next.length === normalized.credentials.length) {
          return latest;
        }
        return {
          version: 1,
          updatedAt: Date.now(),
          credentials: next,
        };
      },
    );
  } catch (error) {
    console.warn(
      `Unable to remove secondary credential for ${reference.provider}:${reference.email}`,
      error,
    );
  }
}
