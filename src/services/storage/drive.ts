import type { Drive } from "../drives/types";
import { getDriveImplementation } from "../drives/registry";
import { getDriveStorageKey, readDriveSnapshot, writeLocalStorageJson } from "./storage";
import {
  createDriveRefreshSecretKey,
  setSecret,
} from "../../platform/secret-storage";

function sanitizeDriveSnapshot(drive: Drive) {
  return {
    ...drive,
    refresh_token: "",
    access_token: undefined,
    expires_in: undefined,
  };
}

export function saveDrive(drive: Drive) {
  const refreshSecretKey = createDriveRefreshSecretKey(drive.provider, drive.email);
  if (drive.refresh_token) {
    void setSecret(refreshSecretKey, drive.refresh_token).catch((error) => {
      console.warn(
        `Unable to persist secure refresh token for ${drive.provider}:${drive.email}`,
        error,
      );
    });
  }

  writeLocalStorageJson(
    getDriveStorageKey(drive.provider, drive.email),
    sanitizeDriveSnapshot(drive),
  );
  return drive;
}

export function retreiveDrive(provider: string, email: string = "") {
  if (!provider || !email) {
    return null;
  }

  const DriveImplementation = getDriveImplementation(provider);
  const drive = readDriveSnapshot(provider, email);

  if (!DriveImplementation || !drive) {
    return null;
  }

  try {
    const hydratedDrive = new DriveImplementation(drive);

    // Migrate legacy snapshots that still include plaintext tokens.
    if ((drive as { refresh_token?: string }).refresh_token) {
      saveDrive(hydratedDrive);
    }

    return hydratedDrive;
  } catch (error) {
    console.warn(`Unable to hydrate drive ${provider}:${email}`, error);
    return null;
  }
}
