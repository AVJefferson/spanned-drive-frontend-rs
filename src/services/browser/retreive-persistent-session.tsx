import { Session, emptySession } from "../../contexts/Session.tsx";
import { Drive, Drives } from "../../contexts/Drive.tsx";
import { RetreiveDrive } from "./retreive-drive.tsx";

export function RetreivePersistentSession(): Session {
  const localDataSessionStr = localStorage.getItem("session");

  if (localDataSessionStr) {
    try {
      const localDataSession = JSON.parse(localDataSessionStr);
      if (!localDataSession.primaryDrive) return emptySession;

      let primaryDrive: Drive = RetreiveDrive(
        localDataSession.primaryDrive.provider,
        localDataSession.primaryDrive.email,
      );
      if (!primaryDrive) return emptySession;

      let secondaryDrives = [];
      if (localDataSession.secondaryDrives)
        secondaryDrives = localDataSession.secondaryDrives.map((sd: any) => {
          let drive = RetreiveDrive(sd.provider, sd.email);
          if (drive) return drive;

          return new Drives[sd.provider]({
            email: sd.email,
          });
        });

      return {
        primaryDrive,
        secondaryDrives,
      };
    } catch (e) {
      console.error("Failed to parse session from localStorage:", e);
      return emptySession;
    }
  }

  return emptySession;
}
