import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useMemo,
  useRef,
} from "react";

import { createDriveKey } from "../utils/ids";
import type { Drive } from "./Drive.tsx";
import { Session, emptySession } from "./Session.tsx";

import { SavePersistentSession } from "../services/browser/save-persistent-session.tsx";
import { toPersistedSession } from "../services/browser/save-persistent-session.tsx";
import { RetreivePersistentSession } from "../services/browser/retreive-persistent-session.tsx";
import { LogoutFromLocalStorage } from "../services/browser/logout.tsx";
import { SaveDrive } from "../services/browser/save-drive.tsx";
import { mergeRemoteAppStorage } from "../services/app-storage.ts";

interface SessionContextType {
  session: Session;

  setPrimaryDrive: (primaryDrive: Drive) => void;
  addSecondaryDrive: (newSecondaryDrive: Drive) => void;
  removeSecondaryDrive: (drive: Drive) => void;
  updateDrive: (drive: Drive) => void;
  setDriveUsageLimit: (driveKey: string, usageLimitPercent: number) => void;
  refreshAllDriveDetails: () => Promise<void>;

  logout: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

const initializeSessionFromLocalStorage = (): Session =>
  RetreivePersistentSession();

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSessionState] = useState<Session>(
    initializeSessionFromLocalStorage(),
  );
  const lastSyncedPersistedSession = useRef<string | null>(null);

  useEffect(() => {
    if (!session.primaryDrive) {
      lastSyncedPersistedSession.current = null;
      return;
    }

    const persistedSession = toPersistedSession(session);
    const persistedSessionKey = JSON.stringify(persistedSession);

    SavePersistentSession(session);

    if (lastSyncedPersistedSession.current === persistedSessionKey) {
      return;
    }

    lastSyncedPersistedSession.current = persistedSessionKey;
    void mergeRemoteAppStorage(session.primaryDrive, { session: persistedSession });
  }, [session]);

  const setPrimaryDrive = useCallback((primaryDrive: Drive) => {
    setSessionState((prev) => {
      // preserve existing primary
      if (!primaryDrive) return prev;

      const newSession: Session = {
        primaryDrive: primaryDrive,
        secondaryDrives:
          prev.primaryDrive &&
          createDriveKey(prev.primaryDrive.provider, prev.primaryDrive.email) ===
            createDriveKey(primaryDrive.provider, primaryDrive.email)
            ? prev.secondaryDrives
            : [],
      };

      SaveDrive(primaryDrive);
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
      SaveDrive(newSecondaryDrive);
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

  const updateDrive = useCallback((drive: Drive) => {
    SaveDrive(drive);
    setSessionState((prev) => {
      if (!prev.primaryDrive) {
        return prev;
      }

      if (
        createDriveKey(prev.primaryDrive.provider, prev.primaryDrive.email) ===
        createDriveKey(drive.provider, drive.email)
      ) {
        return {
          ...prev,
          primaryDrive: drive,
        };
      }

      return {
        ...prev,
        secondaryDrives: prev.secondaryDrives.map((existingDrive) =>
          createDriveKey(existingDrive.provider, existingDrive.email) ===
          createDriveKey(drive.provider, drive.email)
            ? drive
            : existingDrive,
        ),
      };
    });
  }, []);

  const setDriveUsageLimit = useCallback(
    (driveKey: string, usageLimitPercent: number) => {
      setSessionState((prev) => {
        const updateSelectedDrive = (drive: Drive) => {
          if (createDriveKey(drive.provider, drive.email) !== driveKey) {
            return drive;
          }

          const nextDrive = {
            ...drive,
            drive_settings: {
              ...drive.drive_settings,
              usageLimitPercent,
              allowed_space_usage_percent: usageLimitPercent,
            },
          } as Drive;
          SaveDrive(nextDrive);
          return nextDrive;
        };

        return {
          primaryDrive: prev.primaryDrive
            ? updateSelectedDrive(prev.primaryDrive)
            : null,
          secondaryDrives: prev.secondaryDrives.map(updateSelectedDrive),
        };
      });
    },
    [],
  );

  const refreshAllDriveDetails = useCallback(async () => {
    const drives = [
      ...(session.primaryDrive ? [session.primaryDrive] : []),
      ...session.secondaryDrives,
    ];

    await Promise.all(
      drives.map(async (drive) => {
        try {
          await drive.refresh_drive_details();
          updateDrive(drive);
        } catch (error) {
          console.warn(`Unable to refresh drive details for ${drive.email}`, error);
        }
      }),
    );
  }, [session.primaryDrive, session.secondaryDrives, updateDrive]);

  const logout = useCallback(() => {
    setSessionState(emptySession);
    LogoutFromLocalStorage();
  }, []);

  const value = useMemo(
    () => ({
      session,
      setPrimaryDrive,
      addSecondaryDrive,
      removeSecondaryDrive,
      updateDrive,
      setDriveUsageLimit,
      refreshAllDriveDetails,
      logout,
    }),
    [
      session,
      setPrimaryDrive,
      addSecondaryDrive,
      removeSecondaryDrive,
      updateDrive,
      setDriveUsageLimit,
      refreshAllDriveDetails,
      logout,
    ],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
};
