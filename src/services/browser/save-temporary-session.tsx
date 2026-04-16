import { Session } from "../../contexts/Session.tsx";
import { extractSessionData } from "./utils.tsx";

export default function SaveTemporarySession(session: Session) {
  const sessionStorageSessionData = {
    primaryDrive: extractSessionData(session.primaryDrive),
    secondaryDrives: session.secondaryDrives.map(extractSessionData),
  };

  sessionStorage.setItem("session", JSON.stringify(sessionStorageSessionData));

  return session;
}

export { SaveTemporarySession };
