interface DriveSecretReference {
  provider: string;
  email: string;
}

const SECRET_KEY_PREFIX = "sdrive.secret.";
const DRIVE_REFRESH_SECRET_SCOPE = "drive.refresh-token";
const SERVICE_NAME = "spanned-drive-frontend-rs";

function hasTauriRuntime() {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
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
  if (!value) {
    return deleteSecret(secretKey);
  }

  if (hasTauriRuntime()) {
    await invokeSecret("set_secret", {
      service: SERVICE_NAME,
      key: secretKey,
      value,
    });
    return;
  }

  localStorage.setItem(toFallbackStorageKey(secretKey), value);
}

export async function getSecret(secretKey: string): Promise<string | null> {
  if (hasTauriRuntime()) {
    return invokeSecret<string | null>("get_secret", {
      service: SERVICE_NAME,
      key: secretKey,
    });
  }

  return localStorage.getItem(toFallbackStorageKey(secretKey));
}

export async function deleteSecret(secretKey: string) {
  if (hasTauriRuntime()) {
    await invokeSecret("delete_secret", {
      service: SERVICE_NAME,
      key: secretKey,
    });
    return;
  }

  localStorage.removeItem(toFallbackStorageKey(secretKey));
}

export async function clearDriveRefreshSecrets(drives: DriveSecretReference[]) {
  await Promise.all(
    drives.map((drive) =>
      deleteSecret(createDriveRefreshSecretKey(drive.provider, drive.email)),
    ),
  );
}
