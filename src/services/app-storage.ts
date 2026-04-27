import type { Drive, DriveReference } from "./drives/types";
import type { PersistedSession } from "../contexts/SessionContext";
import type { LogicalFolder } from "../contexts/FoldersContext";
import {
  STORAGE_KEYS,
  readLocalStorageJson,
  writeLocalStorageJson,
} from "./storage/storage";

// ---------------------------------------------------------------------------
// File name constants
// ---------------------------------------------------------------------------

const SESSION_STORAGE_FILE = "sdrive-session.json";
const FOLDERS_STORAGE_FILE = "sdrive-folders.json";
const SESSION_LOCK_FILE = "sdrive-session.lock.json";
const FOLDERS_LOCK_FILE = "sdrive-folders.lock.json";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface KnownSecondaryAccount extends DriveReference {}

export interface RemoteSessionState {
  version: 1;
  updatedAt: number;
  session: PersistedSession;
  knownSecondaryAccounts: KnownSecondaryAccount[];
}

export interface RemoteFoldersState {
  version: 1;
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

const EMPTY_SESSION_STATE: RemoteSessionState = {
  version: 1,
  updatedAt: 0,
  session: { primaryDrive: null, secondaryDrives: [] },
  knownSecondaryAccounts: [],
};

const EMPTY_FOLDERS_STATE: RemoteFoldersState = {
  version: 1,
  updatedAt: 0,
  logicalFolders: [],
};

// ---------------------------------------------------------------------------
// Lock constants
// ---------------------------------------------------------------------------

const LOCK_STALE_MS = 30_000;
const LOCK_VERIFY_DELAY_MS = 400;
const MAX_LOCK_RETRIES = 6;
const LOCK_RETRY_BASE_MS = 200;

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

function normalizeSessionState(
  value: Partial<RemoteSessionState> | null | undefined,
): RemoteSessionState {
  return {
    version: 1,
    updatedAt: Number(value?.updatedAt || 0),
    session: value?.session || EMPTY_SESSION_STATE.session,
    knownSecondaryAccounts: normalizeKnownSecondaryAccounts(
      value?.knownSecondaryAccounts,
    ),
  };
}

function normalizeFoldersState(
  value: Partial<RemoteFoldersState> | null | undefined,
): RemoteFoldersState {
  const rawFolders = Array.isArray(value?.logicalFolders)
    ? value.logicalFolders
    : EMPTY_FOLDERS_STATE.logicalFolders;

  return {
    version: 1,
    updatedAt: Number(value?.updatedAt || 0),
    logicalFolders: rawFolders.map((folder) => ({
      ...folder,
      // Keep file tree local-only in the remote manifest.
      items: [],
    })),
  };
}

// ---------------------------------------------------------------------------
// Local cache helpers
// ---------------------------------------------------------------------------

export function readRemoteSessionStateCache(): RemoteSessionState {
  const cached = readLocalStorageJson<Partial<RemoteSessionState>>(
    STORAGE_KEYS.remoteSessionStateCache,
    EMPTY_SESSION_STATE,
  );
  return normalizeSessionState(cached);
}

export function writeRemoteSessionStateCache(value: RemoteSessionState) {
  return writeLocalStorageJson(STORAGE_KEYS.remoteSessionStateCache, value);
}

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
// Mutex helpers
// ---------------------------------------------------------------------------

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function acquireRemoteLock(drive: Drive, lockFile: string): Promise<string> {
  for (let attempt = 0; attempt < MAX_LOCK_RETRIES; attempt++) {
    if (attempt > 0) {
      await delay(LOCK_RETRY_BASE_MS * 2 ** (attempt - 1));
    }

    // Check for an existing live lock.
    const existing = await drive.read_app_storage_json<WriteLock | null>(lockFile);
    if (existing && (Date.now() - existing.acquiredAt) < LOCK_STALE_MS) {
      // Lock is held by another writer; retry.
      continue;
    }

    // Claim the lock.
    const lockId = crypto.randomUUID();
    await drive.write_app_storage_json<WriteLock>(lockFile, {
      lockId,
      acquiredAt: Date.now(),
    });

    // Wait for eventual consistency, then verify our lock is still in place.
    await delay(LOCK_VERIFY_DELAY_MS);
    const verified = await drive.read_app_storage_json<WriteLock | null>(lockFile);
    if (verified?.lockId === lockId) {
      return lockId;
    }
    // Lock was overwritten by a concurrent writer; retry.
  }

  throw new Error(
    `Unable to acquire remote lock on ${lockFile} after ${MAX_LOCK_RETRIES} attempts`,
  );
}

async function releaseRemoteLock(drive: Drive, lockFile: string): Promise<void> {
  try {
    await drive.delete_app_storage_json(lockFile);
  } catch (error) {
    console.warn(`Unable to release remote lock ${lockFile}`, error);
    // Fallback: blank out the lock so a future writer doesn't see a stale
    // claim if the delete failed.
    try {
      await drive.write_app_storage_json<null>(lockFile, null);
    } catch {
      // Best-effort; the stale-lock timeout will eventually unblock writers.
    }
  }
}

// ---------------------------------------------------------------------------
// Remote session state
// ---------------------------------------------------------------------------

export async function readRemoteSessionState(
  primaryDrive: Drive | null,
): Promise<RemoteSessionState> {
  if (!primaryDrive) {
    return readRemoteSessionStateCache();
  }

  try {
    const raw = await primaryDrive.read_app_storage_json<Partial<RemoteSessionState>>(
      SESSION_STORAGE_FILE,
    );
    const normalized = normalizeSessionState(raw);
    writeRemoteSessionStateCache(normalized);
    return normalized;
  } catch (error) {
    console.warn("Unable to read remote session state, using cache", error);
    return readRemoteSessionStateCache();
  }
}

export async function writeRemoteSessionState(
  primaryDrive: Drive | null,
  partial: Partial<RemoteSessionState>,
): Promise<RemoteSessionState> {
  if (!primaryDrive) {
    const current = readRemoteSessionStateCache();
    const next: RemoteSessionState = {
      version: 1,
      updatedAt: Date.now(),
      session: partial.session ?? current.session,
      knownSecondaryAccounts: normalizeKnownSecondaryAccounts(
        partial.knownSecondaryAccounts ?? current.knownSecondaryAccounts,
      ),
    };
    writeRemoteSessionStateCache(next);
    return next;
  }

  let lockId: string | null = null;
  try {
    lockId = await acquireRemoteLock(primaryDrive, SESSION_LOCK_FILE);

    // Re-read after acquiring the lock to get the latest committed state.
    const latest = await primaryDrive.read_app_storage_json<Partial<RemoteSessionState>>(
      SESSION_STORAGE_FILE,
    );
    const latestNormalized = normalizeSessionState(latest);

    const merged: RemoteSessionState = {
      version: 1,
      updatedAt: Date.now(),
      session: partial.session ?? latestNormalized.session,
      knownSecondaryAccounts: normalizeKnownSecondaryAccounts(
        partial.knownSecondaryAccounts ?? latestNormalized.knownSecondaryAccounts,
      ),
    };

    await primaryDrive.write_app_storage_json(SESSION_STORAGE_FILE, merged);
    writeRemoteSessionStateCache(merged);
    return merged;
  } finally {
    if (lockId !== null) {
      await releaseRemoteLock(primaryDrive, SESSION_LOCK_FILE);
    }
  }
}

// ---------------------------------------------------------------------------
// Remote folders state
// ---------------------------------------------------------------------------

export async function readRemoteFoldersState(
  primaryDrive: Drive | null,
): Promise<RemoteFoldersState> {
  if (!primaryDrive) {
    return readRemoteFoldersStateCache();
  }

  try {
    const raw = await primaryDrive.read_app_storage_json<Partial<RemoteFoldersState>>(
      FOLDERS_STORAGE_FILE,
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
      version: 1,
      updatedAt: Date.now(),
      logicalFolders: (partial.logicalFolders ?? current.logicalFolders).map(
        (folder) => ({ ...folder, items: [] }),
      ),
    };
    writeRemoteFoldersStateCache(next);
    return next;
  }

  let lockId: string | null = null;
  try {
    lockId = await acquireRemoteLock(primaryDrive, FOLDERS_LOCK_FILE);

    // Re-read after acquiring the lock to get the latest committed state.
    const latest = await primaryDrive.read_app_storage_json<Partial<RemoteFoldersState>>(
      FOLDERS_STORAGE_FILE,
    );
    const latestNormalized = normalizeFoldersState(latest);

    const merged: RemoteFoldersState = {
      version: 1,
      updatedAt: Date.now(),
      logicalFolders: (partial.logicalFolders ?? latestNormalized.logicalFolders).map(
        (folder) => ({ ...folder, items: [] }),
      ),
    };

    await primaryDrive.write_app_storage_json(FOLDERS_STORAGE_FILE, merged);
    writeRemoteFoldersStateCache(merged);
    return merged;
  } finally {
    if (lockId !== null) {
      await releaseRemoteLock(primaryDrive, FOLDERS_LOCK_FILE);
    }
  }
}
