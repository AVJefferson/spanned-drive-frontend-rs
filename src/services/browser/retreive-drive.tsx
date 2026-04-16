import { getDriveImplementation } from "../../contexts/Drive";
import { readDriveSnapshot } from "./storage";

export function RetreiveDrive(provider: string, email: string = "") {
  if (!provider || !email) {
    return null;
  }

  const DriveImplementation = getDriveImplementation(provider);
  const drive = readDriveSnapshot(provider, email);

  if (!DriveImplementation || !drive) {
    return null;
  }

  try {
    return new DriveImplementation(drive);
  } catch (error) {
    console.warn(`Unable to hydrate drive ${provider}:${email}`, error);
    return null;
  }
}
