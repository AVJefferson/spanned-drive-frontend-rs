export const STORAGE_KEYS = {
  session: "sdrive.session",
  settings: "sdrive.settings",
  primaryDrive: "sdrive.primary-drive",

  logicalFolders: "sdrive.logical-folders",
  tasks: "sdrive.tasks",
  taskCheckpoints: "sdrive.task-checkpoints",
  oauthParams: "sdrive.oauth-params",
  remoteSessionStateCache: "sdrive.remote-session-state-cache",
  remoteFoldersStateCache: "sdrive.remote-folders-state-cache",
} as const;

export function readLocalStorageJson<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    if (!value) {
      return fallback;
    }

    return JSON.parse(value) as T;
  } catch (error) {
    console.warn(`Unable to parse localStorage key "${key}"`, error);
    return fallback;
  }
}

export function writeLocalStorageJson<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
  return value;
}
