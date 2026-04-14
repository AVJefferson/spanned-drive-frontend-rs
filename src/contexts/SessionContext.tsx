import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";

import { Drive } from "./Drive.tsx";
import { Session, emptySession } from "./Session.tsx";

import { SavePersistentSession } from "../services/browser/save-persistent-session.tsx";
import { RetreivePersistentSession } from "../services/browser/retreive-persistent-session.tsx";
import { LogoutFromLocalStorage } from "../services/browser/logout.tsx";

interface SessionContextType {
  session: Session;
  sessionIsInitialised: Promise<void>;

  setPrimaryDrive: (primaryDrive: Drive) => void;
  addSecondaryDrive: (newSecondaryDrive: Drive) => void;
  removeSecondaryDrive: (drive: Drive) => void;

  logout: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

const initializeSessionFromLocalStorage = (): Session =>
  RetreivePersistentSession();

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSessionState] = useState<Session>(emptySession);

  useEffect(() => {
    console.log("new session", { session });
    if (session && session.primaryDrive) {
      SavePersistentSession(session);
    }
  }, [session]);

  useEffect(() => {
    setSessionState(initializeSessionFromLocalStorage());
  }, []);

  const setPrimaryDrive = useCallback((primaryDrive: Drive) => {
    setSessionState((prev) => {
      // preserve existing primary
      if (!primaryDrive) return prev;

      const newSession: Session = {
        primaryDrive: primaryDrive,
        secondaryDrives: [], // Temp set as empty. Gets filled async
      };

      return newSession;
    });
  }, []);

  const addSecondaryDrive = useCallback((newSecondaryDrive: Drive) => {
    setSessionState((prev) => {
      if (!prev) return emptySession;
      if (!prev.primaryDrive) return prev;

      if (!newSecondaryDrive) return prev;

      if (
        prev.primaryDrive &&
        prev.primaryDrive.provider === newSecondaryDrive.provider &&
        prev.primaryDrive.email === newSecondaryDrive.email
      ) {
        // cannot add drive as secondary if it is already primary
        return prev;
      }

      const existingIndex = prev.secondaryDrives.findIndex(
        (d) =>
          d.email === newSecondaryDrive.email &&
          d.provider === newSecondaryDrive.provider,
      );

      const newSecondaryDrives = [...prev.secondaryDrives];

      if (existingIndex >= 0) {
        newSecondaryDrives[existingIndex] = newSecondaryDrive;
      } else {
        newSecondaryDrives.push(newSecondaryDrive);
      }

      const newSession = {
        ...prev,
        secondaryDrives: newSecondaryDrives,
      };
      return newSession;
    });
  }, []);

  const removeSecondaryDrive = useCallback((drive: Drive) => {
    setSessionState((prev) => {
      if (!prev) return emptySession;
      if (!prev.primaryDrive) return prev;

      if (!drive) return prev;

      if (
        prev.primaryDrive &&
        prev.primaryDrive.email === drive.email &&
        prev.primaryDrive.provider === drive.provider
      ) {
        // Cannot Remove primary Drive using removeSecondaryDrive()
        return prev;
      }

      const newSecondaryDrives = prev.secondaryDrives.filter(
        (sd) => sd.email !== drive.email || sd.provider !== drive.provider,
      );

      const newSession = {
        ...prev,
        secondaryDrives: newSecondaryDrives,
      };
      return newSession;
    });
  }, []);

  const logout = useCallback(() => {
    setSessionState(emptySession);
    LogoutFromLocalStorage();
  }, []);

  return (
    <SessionContext.Provider
      value={{
        session,
        sessionIsInitialised,

        setPrimaryDrive,
        addSecondaryDrive,
        removeSecondaryDrive,

        logout,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
};
