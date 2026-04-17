import type { Drive } from "../../contexts/Drive";
import { getDriveStorageKey, writeLocalStorageJson } from "./storage";
import {
  createDriveRefreshSecretKey,
  setSecret,
} from "../security/secret-storage";

function sanitizeDriveSnapshot(drive: Drive) {
  const snapshot = {
    ...drive,
    refresh_token: "",
    access_token: undefined,
    expires_in: undefined,
  };

  return snapshot;
}

export function SaveDrive(drive: Drive) {
  const refreshSecretKey = createDriveRefreshSecretKey(drive.provider, drive.email);
  void setSecret(refreshSecretKey, drive.refresh_token || "").catch((error) => {
    console.warn(
      `Unable to persist secure refresh token for ${drive.provider}:${drive.email}`,
      error,
    );
  });

  writeLocalStorageJson(
    getDriveStorageKey(drive.provider, drive.email),
    sanitizeDriveSnapshot(drive),
  );
  return drive;
}
