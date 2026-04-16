import type { Drive } from "../../contexts/Drive";
import { getDriveStorageKey, writeLocalStorageJson } from "./storage";

export function SaveDrive(drive: Drive) {
  writeLocalStorageJson(getDriveStorageKey(drive.provider, drive.email), drive);
  return drive;
}
