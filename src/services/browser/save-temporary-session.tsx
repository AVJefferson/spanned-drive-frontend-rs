import type { Session } from "../../contexts/Session";
import { extractSessionData } from "./utils";

export default function SaveTemporarySession(session: Session) {
  const sessionStorageSessionData = {
    primaryDrive: extractSessionData(session.primaryDrive),
    secondaryDrives: session.secondaryDrives.map(extractSessionData),
  };

  sessionStorage.setItem("session", JSON.stringify(sessionStorageSessionData));
  return session;
}

export { SaveTemporarySession };
