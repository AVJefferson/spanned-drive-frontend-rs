import type { DriveReference, DriveSnapshot } from "./Drive.tsx";

export interface Session {
  primaryDrive: DriveSnapshot | null;
  secondaryDrives: DriveSnapshot[];
}

export const emptySession: Session = {
  primaryDrive: null,
  secondaryDrives: [],
};

export interface PersistedSession {
  primaryDrive: DriveReference | null;
  secondaryDrives: DriveReference[];
}
