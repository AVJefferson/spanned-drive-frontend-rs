import type { Drive } from "../drives/types";
import type {
  PersistedSession,
  Session,
} from "../../contexts/SessionContext";
import { emptySession } from "../../contexts/SessionContext";
import { retreiveDrive } from "./drive";
import { STORAGE_KEYS, readLocalStorageJson, writeLocalStorageJson } from "./storage";

function extractSessionData(drive: Drive | null) {
  if (!drive) return null;
  return {
    provider: drive.provider,
    email: drive.email,
    access_token: drive.access_token,
    expires_in: drive.expires_in,
    acquired_at: drive.acquired_at,
    user: drive.user,
    drive_settings: drive.drive_settings,
    drive_details: drive.drive_details,
  };
}

export function toPersistedSession(session: Session): PersistedSession {
  return {
    primaryDrive: session.primaryDrive
      ? {
          email: session.primaryDrive.email,
          provider: session.primaryDrive.provider,
        }
      : null,
    secondaryDrives: session.secondaryDrives.map((drive) => ({
      email: drive.email,
      provider: drive.provider,
    })),
  };
}

export function savePersistentSession(session: Session) {
  writeLocalStorageJson(STORAGE_KEYS.session, toPersistedSession(session));
  return session;
}

export function saveTemporarySession(session: Session) {
  const sessionStorageSessionData = {
    primaryDrive: extractSessionData(session.primaryDrive),
    secondaryDrives: session.secondaryDrives.map(extractSessionData),
  };

  sessionStorage.setItem("session", JSON.stringify(sessionStorageSessionData));
  return session;
}

export function retreivePersistentSession(): Session {
  const persisted = readLocalStorageJson<{
    primaryDrive?: { provider?: string; email?: string } | null;
    secondaryDrives?: { provider?: string; email?: string }[];
  }>(STORAGE_KEYS.session, readLocalStorageJson("session", {}));

  if (!persisted?.primaryDrive?.provider || !persisted.primaryDrive.email) {
    return emptySession;
  }

  const primaryDrive = retreiveDrive(
    persisted.primaryDrive.provider,
    persisted.primaryDrive.email,
  );

  if (!primaryDrive) {
    return emptySession;
  }

  const secondaryDrives = (persisted.secondaryDrives || [])
    .map((drive) =>
      drive.provider && drive.email
        ? retreiveDrive(drive.provider, drive.email)
        : null,
    )
    .filter((drive): drive is NonNullable<typeof drive> => Boolean(drive));

  return {
    primaryDrive,
    secondaryDrives,
  };
}
