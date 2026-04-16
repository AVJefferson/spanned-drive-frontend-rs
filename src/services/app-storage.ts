import type { Drive } from "../contexts/Drive";
import type { PersistedSession } from "../contexts/Session";
import type { LogicalFolder } from "../contexts/LogicalFolderTypes";
import {
  STORAGE_KEYS,
  readLocalStorageJson,
  writeLocalStorageJson,
} from "./browser/storage";

const APP_STORAGE_FILE = "sdrive-app-state.json";

export interface RemoteAppStorageState {
  version: 1;
  updatedAt: number;
  session: PersistedSession;
  logicalFolders: LogicalFolder[];
}

const EMPTY_REMOTE_STATE: RemoteAppStorageState = {
  version: 1,
  updatedAt: 0,
  session: {
    primaryDrive: null,
    secondaryDrives: [],
  },
  logicalFolders: [],
};

export function readRemoteAppStorageCache() {
  return readLocalStorageJson(STORAGE_KEYS.remoteAppStateCache, EMPTY_REMOTE_STATE);
}

export function writeRemoteAppStorageCache(value: RemoteAppStorageState) {
  return writeLocalStorageJson(STORAGE_KEYS.remoteAppStateCache, value);
}

export async function readRemoteAppStorage(primaryDrive: Drive | null) {
  if (!primaryDrive) {
    return readRemoteAppStorageCache();
  }

  try {
    const remote =
      (await primaryDrive.read_app_storage_json<RemoteAppStorageState>(
        APP_STORAGE_FILE,
      )) || EMPTY_REMOTE_STATE;

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
  const next: RemoteAppStorageState = {
    ...current,
    ...partial,
    version: 1,
    updatedAt: Date.now(),
    session: partial.session || current.session,
    logicalFolders: partial.logicalFolders || current.logicalFolders,
  };

  writeRemoteAppStorageCache(next);

  if (!primaryDrive) {
    return next;
  }

  try {
    await primaryDrive.write_app_storage_json(APP_STORAGE_FILE, next);
  } catch (error) {
    console.warn("Unable to persist app storage to primary drive", error);
  }

  return next;
}
