import { getDriveImplementation } from "../../contexts/Drive";
import { readDriveSnapshot } from "./storage";
import { SaveDrive } from "./save-drive";

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
    const hydratedDrive = new DriveImplementation(drive);

    // Migrate legacy snapshots that still include plaintext tokens.
    if ((drive as { refresh_token?: string }).refresh_token) {
      SaveDrive(hydratedDrive);
    }

    return hydratedDrive;
  } catch (error) {
    console.warn(`Unable to hydrate drive ${provider}:${email}`, error);
    return null;
  }
}
