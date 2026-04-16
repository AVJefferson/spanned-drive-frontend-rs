import type { Session } from "../../contexts/Session";
import { emptySession } from "../../contexts/Session";
import { RetreiveDrive } from "./retreive-drive";
import { STORAGE_KEYS, readLocalStorageJson } from "./storage";

export function RetreivePersistentSession(): Session {
  const persisted = readLocalStorageJson<{
    primaryDrive?: { provider?: string; email?: string } | null;
    secondaryDrives?: { provider?: string; email?: string }[];
  }>(STORAGE_KEYS.session, readLocalStorageJson("session", {}));

  if (!persisted?.primaryDrive?.provider || !persisted.primaryDrive.email) {
    return emptySession;
  }

  const primaryDrive = RetreiveDrive(
    persisted.primaryDrive.provider,
    persisted.primaryDrive.email,
  );

  if (!primaryDrive) {
    return emptySession;
  }

  const secondaryDrives = (persisted.secondaryDrives || [])
    .map((drive) =>
      drive.provider && drive.email
        ? RetreiveDrive(drive.provider, drive.email)
        : null,
    )
    .filter((drive): drive is NonNullable<typeof drive> => Boolean(drive));

  return {
    primaryDrive,
    secondaryDrives,
  };
}
