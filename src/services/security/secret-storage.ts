interface DriveSecretReference {
  provider: string;
  email: string;
}

const SECRET_KEY_PREFIX = "sdrive.secret.";
const DRIVE_REFRESH_SECRET_SCOPE = "drive.refresh-token";
const SERVICE_NAME = "spanned-drive-frontend-rs";

function hasTauriRuntime() {
  return (
    typeof window !== "undefined" &&
    ("__TAURI_INTERNALS__" in window || "__TAURI__" in window)
  );
}

function toFallbackStorageKey(secretKey: string) {
  return `${SECRET_KEY_PREFIX}${secretKey}`;
}

async function invokeSecret<T>(command: string, payload: Record<string, unknown>) {
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<T>(command, payload);
}

export function createDriveRefreshSecretKey(provider: string, email: string) {
  return `${DRIVE_REFRESH_SECRET_SCOPE}:${encodeURIComponent(provider)}::${encodeURIComponent(email)}`;
}

export async function setSecret(secretKey: string, value: string) {
  const fallbackStorageKey = toFallbackStorageKey(secretKey);
  if (!value) {
    return deleteSecret(secretKey);
  }

  localStorage.setItem(fallbackStorageKey, value);

  if (hasTauriRuntime()) {
    try {
      await invokeSecret("set_secret", {
        service: SERVICE_NAME,
        key: secretKey,
        value,
      });
    } catch (error) {
      console.warn(
        `Unable to persist secret in secure storage for key "${secretKey}", using fallback storage.`,
        error,
      );
    }
    return;
  }
}

export async function getSecret(secretKey: string): Promise<string | null> {
  const fallbackStorageKey = toFallbackStorageKey(secretKey);
  const fallbackValue = localStorage.getItem(fallbackStorageKey);

  if (hasTauriRuntime()) {
    try {
      const secureValue = await invokeSecret<string | null>("get_secret", {
        service: SERVICE_NAME,
        key: secretKey,
      });
      return secureValue || fallbackValue;
    } catch (error) {
      console.warn(
        `Unable to read secret from secure storage for key "${secretKey}", using fallback storage.`,
        error,
      );
      return fallbackValue;
    }
  }

  return fallbackValue;
}

export async function deleteSecret(secretKey: string) {
  const fallbackStorageKey = toFallbackStorageKey(secretKey);
  localStorage.removeItem(fallbackStorageKey);

  if (hasTauriRuntime()) {
    try {
      await invokeSecret("delete_secret", {
        service: SERVICE_NAME,
        key: secretKey,
      });
    } catch (error) {
      console.warn(
        `Unable to delete secret from secure storage for key "${secretKey}".`,
        error,
      );
    }
    return;
  }
}

export async function clearDriveRefreshSecrets(drives: DriveSecretReference[]) {
  await Promise.all(
    drives.map((drive) =>
      deleteSecret(createDriveRefreshSecretKey(drive.provider, drive.email)),
    ),
  );
}
