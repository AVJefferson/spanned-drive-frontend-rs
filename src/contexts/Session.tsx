import { Drive } from "./Drive.tsx";

export interface Session {
  primaryDrive: Drive | null;
  secondaryDrives: Drive[];
}

export const emptySession: Session = {
  primaryDrive: null,
  secondaryDrives: [],
};