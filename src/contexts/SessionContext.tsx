import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";

import { Drive, Drives } from "./Drive.tsx";

export interface Session {
  primaryDrive: Drive | null;
  secondaryDrives: Drive[];
}

interface SessionContextType {
  session: Session;
  setPrimaryDrive: (primaryDrive: Drive) => void;
  addSecondaryDrive: (newSecondaryDrive: Drive) => void;
  removeDrive: (drive: Drive) => void;
  logout: () => void;

  isExpired: (drive: Drive | null) => boolean;
  populateSessionStorage: (drive: Drive | null) => Promise<void>;
}

const emptySession: Session = {
  primaryDrive: null,
  secondaryDrives: [],
};

const SessionContext = createContext<SessionContextType | undefined>(undefined);

const extractLocalData = (drive: Drive | null) => {
  if (!drive) return null;
  return {
    provider: drive.provider,
    email: drive.email,

    isPrimary: drive.isPrimary,
    isSecondary: drive.isSecondary,

    parent_drive: drive.parent_drive,
    associated_drives: drive.associated_drives,

    refresh_token: drive.refresh_token,
    scope: drive.scope,

    user: drive.user,

    drive_settings: drive.drive_settings,
  };
};

const extractSessionData = (drive: Drive | null) => {
  if (!drive) return null;
  return {
    provider: drive.provider,
    email: drive.email,

    isPrimary: drive.isPrimary,
    isSecondary: drive.isSecondary,

    parent_drive: drive.parent_drive,
    associated_drives: drive.associated_drives,

    access_token: drive.access_token,
    expires_in: drive.expires_in,
    acquired_at: drive.acquired_at,

    total_space: drive.total_space,
    used_space: drive.used_space,

    user: drive.user,
    drive_settings: drive.drive_settings,
  };
};

const persistLocalStorageSession = (newSession: Session) => {
  const localStorageSessionData = {
    primaryDrive: extractLocalData(newSession.primaryDrive),
    secondaryDrives: newSession.secondaryDrives.map(extractLocalData),
  };
  localStorage.setItem("session", JSON.stringify(localStorageSessionData));
};

const persistSessionStorageSession = (newSession: Session) => {
  const sessionStorageSessionData = {
    primaryDrive: extractSessionData(newSession.primaryDrive),
    secondaryDrives: newSession.secondaryDrives.map(extractSessionData),
  };

  sessionStorage.setItem("session", JSON.stringify(sessionStorageSessionData));
};

// TODO
// const syncSessionWithPrimaryDrive = (newSession: Session) => {};

const persistSession = (newSession: Session) => {
  persistLocalStorageSession(newSession);
  persistSessionStorageSession(newSession);

  // TODO
  // syncSessionWithPrimaryDrive(newSession);
};

const initializeSession = (): Session => {
  const localDataStr = localStorage.getItem("session");
  const sessionDataStr = sessionStorage.getItem("session");

  if (localDataStr) {
    try {
      const localData = JSON.parse(localDataStr);
      let sessionData = null;
      if (sessionDataStr) {
        try {
          sessionData = JSON.parse(sessionDataStr);
        } catch (e) {
          console.error("Failed to parse session from sessionStorage:", e);
        }
      }

      let primaryDrive: Drive = new Drives[localData.primaryDrive.provider](
        localData.primaryDrive,
      );

      if (
        primaryDrive &&
        sessionData?.primaryDrive &&
        sessionData.primaryDrive.email === primaryDrive.email &&
        sessionData.primaryDrive.provider === primaryDrive.provider
      ) {
        primaryDrive = new Drives[primaryDrive.provider]({
          ...primaryDrive,
          ...sessionData.primaryDrive,
        });
      }

      let secondaryDrives = [];
      if (localData.secondaryDrives)
        secondaryDrives = localData.secondaryDrives.map((ld: any) => {
          new Drives[ld.provider](ld);
        });

      if (sessionData?.secondaryDrives) {
        secondaryDrives = secondaryDrives.map((ld: any) => {
          const sd = sessionData.secondaryDrives.find(
            (s: any) => s.email === ld.email && s.provider === ld.provider,
          );
          return sd ? new Drives[ld.provider]({ ...ld, ...sd }) : ld;
        });
      }

      return {
        primaryDrive,
        secondaryDrives,
      };
    } catch (e) {
      console.error("Failed to parse session from localStorage:", e);
      localStorage.removeItem("session");
    }
  }

  return emptySession;
};

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSessionState] = useState<Session>(initializeSession);

  useEffect(() => {
    if (!session.primaryDrive) return;

    session.primaryDrive?.fetch_access_token?.().then((data: any) => {
      if (data && data.access_token && data.expires_in) {
        setSessionState((prev: Session) => {
          if (!prev.primaryDrive) return prev;

          let newSession: Session = {
            ...prev,
            primaryDrive: new Drives[prev.primaryDrive.provider]({
              ...prev.primaryDrive,
              access_token: data.access_token,
              expires_in: data.expires_in,
            }),
          };
          persistSession(newSession);
          return newSession;
        });
      }
    });

    //TODO: Fetch secondary drive details from googledrive/onedrive api
    // and update session with latest refresh tokens for secondary drives
  }, []);

  const setPrimaryDrive = useCallback((primaryDrive: Drive) => {
    setSessionState((prev) => {
      // preserve existing primary
      if (!primaryDrive) return prev;

      primaryDrive.isPrimary = true;
      primaryDrive.isSecondary = false;
      const newSession: Session = {
        primaryDrive: primaryDrive,
        secondaryDrives: [],
      };
      persistSession(newSession);
      return newSession;
    });
  }, []);

  const addSecondaryDrive = useCallback((newSecondaryDrive: Drive) => {
    setSessionState((prev) => {
      if (!newSecondaryDrive) return prev;
      if (
        prev.primaryDrive &&
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

      newSecondaryDrive.parent_drive = prev.primaryDrive?.email || undefined;
      newSecondaryDrive.isPrimary = false;
      newSecondaryDrive.isSecondary = true;

      const newSession = {
        ...prev,
        secondaryDrives: newSecondaryDrives,
      };
      persistSession(newSession);
      return newSession;
    });
  }, []);

  const removeDrive = useCallback((drive: Drive) => {
    setSessionState((prev) => {
      if (
        prev.primaryDrive?.email === drive.email &&
        prev.primaryDrive.provider === drive.provider
      ) {
        localStorage.removeItem("session");
        sessionStorage.removeItem("session");
        return emptySession;
      } else {
        const newSecondary = prev.secondaryDrives.filter(
          (d) => d.email !== drive.email || d.provider !== drive.provider,
        );
        const newSession = {
          ...prev,
          secondaryDrives: newSecondary,
        };
        persistSession(newSession);
        return newSession;
      }
    });
  }, []);

  const logout = useCallback(() => {
    setSessionState(emptySession);
    localStorage.removeItem("session");
    sessionStorage.removeItem("session");
  }, []);

  const isExpired = useCallback((drive: Drive | null) => {
    if (
      !drive ||
      !drive.refresh_token ||
      !drive.access_token ||
      !drive.expires_in ||
      !drive.acquired_at
    )
      return true;

    const expiryTime = drive.acquired_at + drive.expires_in * 1000;
    return Date.now() > expiryTime - 5 * 60 * 1000; // 5 minute buffer
  }, []);

  const populateSessionStorage = useCallback(
    async (targetDrive: Drive | null) => {
      const driveToUpdate = targetDrive || session.primaryDrive;
      if (!driveToUpdate || !driveToUpdate.refresh_token) {
        return;
      }

      let newAccessToken = null;
      let newExpiresIn = null;
      let newAcquiredAt = null;

      if (driveToUpdate.provider === "google-drive") {
        try {
          const data = await driveToUpdate.fetch_access_token?.();

          if (data && data.access_token) {
            newAccessToken = data.access_token;
            newExpiresIn = data.expires_in;
            newAcquiredAt = Date.now();
          } else {
            console.error("Failed to refresh token", data);
            return;
          }
        } catch (err) {
          console.error("Error calling fetchAccessToken", err);
          return;
        }
      }

      if (newAccessToken) {
        setSessionState((prev) => {
          let updatedPrimary = prev.primaryDrive;
          let updatedSecondary = [...prev.secondaryDrives];
          let didUpdate = false;

          if (
            updatedPrimary &&
            updatedPrimary.email === driveToUpdate.email &&
            updatedPrimary.provider === driveToUpdate.provider
          ) {
            updatedPrimary = new Drives[updatedPrimary.provider]({
              ...updatedPrimary,
              access_token: newAccessToken,
              expires_in: newExpiresIn as number,
              acquired_at: newAcquiredAt as number,
            });
            didUpdate = true;
          }

          const secondaryIndex = updatedSecondary.findIndex(
            (d) =>
              d.email === driveToUpdate.email &&
              d.provider === driveToUpdate.provider,
          );
          if (secondaryIndex >= 0) {
            updatedSecondary[secondaryIndex] = new Drives[
              updatedSecondary[secondaryIndex].provider
            ]({
              ...updatedSecondary[secondaryIndex],
              access_token: newAccessToken,
              expires_in: newExpiresIn as number,
              acquired_at: newAcquiredAt as number,
            });
            didUpdate = true;
          }

          if (didUpdate) {
            const newSession = {
              primaryDrive: updatedPrimary,
              secondaryDrives: updatedSecondary,
            };
            // Only update session storage with access tokens!
            persistSessionStorageSession(newSession);
            return newSession;
          }
          return prev;
        });
      }
    },
    [session.primaryDrive],
  );

  return (
    <SessionContext.Provider
      value={{
        session,
        setPrimaryDrive,
        addSecondaryDrive,
        removeDrive,

        logout,
        isExpired,

        populateSessionStorage,
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
