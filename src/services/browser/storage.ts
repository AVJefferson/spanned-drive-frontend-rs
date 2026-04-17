export const STORAGE_KEYS = {
  session: "sdrive.session",
  settings: "sdrive.settings",
  logicalFolders: "sdrive.logical-folders",
  tasks: "sdrive.tasks",
  taskCheckpoints: "sdrive.task-checkpoints",
  oauthParams: "sdrive.oauth-params",
  remoteAppStateCache: "sdrive.remote-app-state-cache",
} as const;

const DRIVE_STORAGE_PREFIX = "sdrive.drive.";
const LEGACY_DRIVE_STORAGE_PREFIX = "drive-";
const SECRET_STORAGE_PREFIX = "sdrive.secret.";

export function getDriveStorageKey(provider: string, email: string) {
  return `${DRIVE_STORAGE_PREFIX}${encodeURIComponent(provider)}::${encodeURIComponent(email)}`;
}

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

export function removeLocalStorageKey(key: string) {
  localStorage.removeItem(key);
}

export function readDriveSnapshot(provider: string, email: string) {
  const primaryKey = getDriveStorageKey(provider, email);
  const fallbackKey = `${LEGACY_DRIVE_STORAGE_PREFIX}${provider}-${email}`;

  const raw =
    localStorage.getItem(primaryKey) ?? localStorage.getItem(fallbackKey);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch (error) {
    console.warn(`Unable to parse drive snapshot for ${provider}:${email}`, error);
    return null;
  }
}

export function clearSessionScopedStorage() {
  const keysToDelete: string[] = [];

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key) {
      continue;
    }

    if (
      key.startsWith(DRIVE_STORAGE_PREFIX) ||
      key.startsWith(LEGACY_DRIVE_STORAGE_PREFIX) ||
      key.startsWith(SECRET_STORAGE_PREFIX) ||
      key === STORAGE_KEYS.session ||
      key === STORAGE_KEYS.logicalFolders ||
      key === STORAGE_KEYS.tasks ||
      key === STORAGE_KEYS.taskCheckpoints ||
      key === STORAGE_KEYS.oauthParams ||
      key === STORAGE_KEYS.remoteAppStateCache ||
      key === "session"
    ) {
      keysToDelete.push(key);
    }
  }

  keysToDelete.forEach((key) => localStorage.removeItem(key));
  sessionStorage.clear();
}

export function listStoredDriveReferences() {
  const drives = new Map<string, { provider: string; email: string }>();

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key) {
      continue;
    }

    if (key.startsWith(DRIVE_STORAGE_PREFIX)) {
      const encoded = key.slice(DRIVE_STORAGE_PREFIX.length);
      const [provider, email] = encoded.split("::");
      if (!provider || !email) {
        continue;
      }

      const decoded = {
        provider: decodeURIComponent(provider),
        email: decodeURIComponent(email),
      };
      drives.set(`${decoded.provider}:${decoded.email}`.toLowerCase(), decoded);
    }

  }

  return Array.from(drives.values());
}
