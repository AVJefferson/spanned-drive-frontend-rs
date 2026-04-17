import type { Drive, DriveReference } from "../contexts/Drive";
import type { PersistedSession } from "../contexts/Session";
import type { LogicalFolder } from "../contexts/LogicalFolderTypes";
import {
  STORAGE_KEYS,
  readLocalStorageJson,
  writeLocalStorageJson,
} from "./browser/storage";

const APP_STORAGE_FILE = "sdrive-app-state.json";

export interface KnownSecondaryAccount extends DriveReference {}

interface LegacyRemoteAppStorageState {
  version?: 2;
  updatedAt?: number;
  session?: PersistedSession;
  logicalFolders?: LogicalFolder[];
  knownSecondaryAccounts?: KnownSecondaryAccount[];
}

export interface RemoteAppStorageState {
  version: 3;
  updatedAt: number;
  session: PersistedSession;
  logicalFolders: LogicalFolder[];
  knownSecondaryAccounts: KnownSecondaryAccount[];
}

const EMPTY_REMOTE_STATE: RemoteAppStorageState = {
  version: 3,
  updatedAt: 0,
  session: {
    primaryDrive: null,
    secondaryDrives: [],
  },
  logicalFolders: [],
  knownSecondaryAccounts: [],
};

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
    deduped.set(`${provider}:${email}`.toLowerCase(), {
      provider,
      email,
    });
  });

  return Array.from(deduped.values());
}

function normalizeRemoteState(
  value:
    | Partial<RemoteAppStorageState>
    | LegacyRemoteAppStorageState
    | null
    | undefined,
): RemoteAppStorageState {
  const rawFolders = Array.isArray(value?.logicalFolders)
    ? value.logicalFolders
    : EMPTY_REMOTE_STATE.logicalFolders;

  return {
    version: 3,
    updatedAt: Number(value?.updatedAt || 0),
    session: value?.session || EMPTY_REMOTE_STATE.session,
    logicalFolders: rawFolders.map((folder) => ({
      ...folder,
      // Keep file tree local-only in v3 manifest.
      items: [],
    })),
    knownSecondaryAccounts: normalizeKnownSecondaryAccounts(
      value?.knownSecondaryAccounts,
    ),
  };
}

export function readRemoteAppStorageCache() {
  const cached = readLocalStorageJson<Partial<RemoteAppStorageState>>(
    STORAGE_KEYS.remoteAppStateCache,
    EMPTY_REMOTE_STATE,
  );
  return normalizeRemoteState(cached);
}

export function writeRemoteAppStorageCache(value: RemoteAppStorageState) {
  return writeLocalStorageJson(STORAGE_KEYS.remoteAppStateCache, value);
}

export async function readRemoteAppStorage(primaryDrive: Drive | null) {
  if (!primaryDrive) {
    return readRemoteAppStorageCache();
  }

  try {
    const remoteRaw =
      (await primaryDrive.read_app_storage_json<
        RemoteAppStorageState | LegacyRemoteAppStorageState
      >(
        APP_STORAGE_FILE,
      )) || EMPTY_REMOTE_STATE;
    const remote = normalizeRemoteState(remoteRaw);

    writeRemoteAppStorageCache(remote);
    return remote;
  } catch (error) {
    console.warn("Unable to read primary drive app storage, using cache", error);
    return readRemoteAppStorageCache();
  }
}

export async function mergeRemoteAppStorage(
  primaryDrive: Drive | null,
  partial: Partial<RemoteAppStorageState>,
) {
  const current = await readRemoteAppStorage(primaryDrive);
  const nextKnownSecondaryAccounts =
    partial.knownSecondaryAccounts !== undefined
      ? normalizeKnownSecondaryAccounts(partial.knownSecondaryAccounts)
      : normalizeKnownSecondaryAccounts(current.knownSecondaryAccounts);

  const next: RemoteAppStorageState = {
    ...current,
    ...partial,
    version: 3,
    updatedAt: Date.now(),
    session: partial.session || current.session,
    logicalFolders: (partial.logicalFolders || current.logicalFolders).map((folder) => ({
      ...folder,
      items: [],
    })),
    knownSecondaryAccounts: nextKnownSecondaryAccounts,
  };

  writeRemoteAppStorageCache(next);

  if (!primaryDrive) {
    return next;
  }

  await primaryDrive.write_app_storage_json(APP_STORAGE_FILE, next);

  return next;
}
