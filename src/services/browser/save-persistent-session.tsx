import { Session } from "../../contexts/Session.tsx";
import { extractLocalData } from "./utils.tsx";

export default function SavePersistentSession(session: Session) {
  const localStorageSessionData = {
    primaryDrive: extractLocalData(session.primaryDrive),
    secondaryDrives: session.secondaryDrives.map(extractLocalData),
  };

  localStorage.setItem("session", JSON.stringify(localStorageSessionData));

  return session;
}

export { SavePersistentSession };
