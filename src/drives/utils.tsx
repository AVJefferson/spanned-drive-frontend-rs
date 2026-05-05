import { Drive, DriveReference } from "./index";
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
    refreshToken: undefined,
    accessToken: undefined,
    accessTokenExpiry: undefined,
  };
}

export function getLocalStorageDriveKey(driveRef: DriveReference) {
  return `drive.${encodeURIComponent(driveRef.provider)}::${encodeURIComponent(driveRef.email)}`;
}

export function getSecretStorageDriveKey(driveRef: DriveReference) {
  return `drive.refresh-token:${encodeURIComponent(driveRef.provider)}::${encodeURIComponent(driveRef.email)}`;
}

export async function getDrive(driveRef: DriveReference) {
  let drive = readLocalStorageJson<Drive>(
    getLocalStorageDriveKey(driveRef),
    driveRef,
  );

  drive.refreshToken = await getSecret("sdrive.drives", getSecretStorageDriveKey(driveRef));

  return drive;
}

export function saveDrive(drive: Drive) {
  if (drive.refreshToken) {
    setSecretWithBrowserFallback(
      "sdrive.drives",
      getSecretStorageDriveKey(drive),
      drive.refreshToken,
    );
    writeLocalStorageJson(
      getLocalStorageDriveKey(drive),
      sanitizeDriveSnapshot(drive),
    );
  } else {
    writeLocalStorageJson(getLocalStorageDriveKey(drive), drive);
  }
}
