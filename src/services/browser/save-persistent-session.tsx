import type { Session, PersistedSession } from "../../contexts/Session";
import { STORAGE_KEYS, writeLocalStorageJson } from "./storage";

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

export default function SavePersistentSession(session: Session) {
  writeLocalStorageJson(STORAGE_KEYS.session, toPersistedSession(session));
  return session;
}

export { SavePersistentSession };
