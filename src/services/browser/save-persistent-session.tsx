import { Session } from "../../contexts/Session.tsx";
import { extractLocalData } from "./utils.tsx";

export default function SavePersistentSession(session: Session) {
  const sessionStorageSessionData = {
    primaryDrive: extractLocalData(session.primaryDrive),
    secondaryDrives: session.secondaryDrives.map(extractLocalData),
  };

  sessionStorage.setItem("session", JSON.stringify(sessionStorageSessionData));

  return session;
}

export { SavePersistentSession };
