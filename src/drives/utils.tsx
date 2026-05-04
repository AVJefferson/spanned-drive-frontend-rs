import { Drive } from "./index";
import {
  setSecretWithBrowserFallback,
  getSecret,
} from "../services/storage/secret-storage";
import {
  readLocalStorageJson,
  writeLocalStorageJson,
} from "../services/storage/local-storage";

export function sanitizeDriveSnapshot(drive: Drive) {
  return {
    ...drive,
    refresh_token: "",
    access_token: undefined,
    expires_in: undefined,
  };
}

function getDriveStorageKey(provider: string, email: string) {
  return `drive.refresh-token:${encodeURIComponent(provider)}::${encodeURIComponent(email)}`;
}

export async function getDrive(provider: string, email: string) {
  const secretKey = getDriveStorageKey(provider, email);
  let drive = readLocalStorageJson<Drive>(secretKey, { provider, email });

  try {
    const refreshToken = getSecret("sdrive.drives", secretKey);
    if (refreshToken) {
      drive.refreshToken = await refreshToken;
    }
  } catch {}

  return drive;
}

export function saveDrive(drive: Drive) {
  const secretKey = getDriveStorageKey(drive.provider, drive.email);

  if (drive.refreshToken) {
    setSecretWithBrowserFallback(
      "sdrive.drives",
      secretKey,
      drive.refreshToken,
    );
    writeLocalStorageJson(secretKey, sanitizeDriveSnapshot(drive));
  } else {
    writeLocalStorageJson(secretKey, sanitizeDriveSnapshot(drive));
  }
}
