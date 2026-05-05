import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useMemo,
} from "react";

import {
  STORAGE_KEYS,
  readLocalStorageJson,
  writeLocalStorageJson,
} from "../services/storage/local-storage";
import { getDrive } from "../drives/utils";

export interface DriveSession {
  provider: string;
  email: string;
  refreshToken: string | undefined;
  refreshTime: number | undefined;
}

function sanitizeDriveSession(drive: DriveSession) {
  return {
    ...drive,
    refreshToken: undefined,
    refreshTime: undefined,
  };
}

export interface Session {
  primaryDrive: DriveSession | undefined;
  secondaryDrives: DriveSession[];

  setPrimaryDrive: (
    provider: string,
    email: string,
    refreshToken: string | undefined,
  ) => void;

  addSecondaryDrive: (
    provider: string,
    email: string,
    refreshToken: string | undefined,
  ) => void;

  removeSecondaryDrive: (provider: string, email: string) => void;

  getLoggedInSecondaryDrives: () => DriveSession[];
  getLoggedOutSecondaryDrives: () => DriveSession[];

  logoutSecondaryDrive: (provider: string, email: string) => void;
  logoutPrimaryDrive: () => void;
}

function sanitizeSession(session: Session) {
  return {
    ...session,
    primaryDrive: session.primaryDrive
      ? sanitizeDriveSession(session.primaryDrive)
      : undefined,
    secondaryDrives: session.secondaryDrives
      ? session.secondaryDrives.map(sanitizeDriveSession)
      : [],
  };
}

const defaultSession: Session = {
  primaryDrive: undefined,
  secondaryDrives: [],

  setPrimaryDrive: () => {},
  addSecondaryDrive: () => {},
  removeSecondaryDrive: () => {},
  getLoggedInSecondaryDrives: () => [],
  getLoggedOutSecondaryDrives: () => [],
  logoutSecondaryDrive: () => {},
  logoutPrimaryDrive: () => {},
};

const initializeSessionFromLocalStorage = (): Session =>
  readLocalStorageJson(STORAGE_KEYS.session, defaultSession);

async function loadSessionDrives(session: Session): Promise<Session> {
  let newSession: Session = {
    ...session,
    primaryDrive: undefined,
    secondaryDrives: [],
  };

  if (
    session.primaryDrive &&
    session.primaryDrive.provider &&
    session.primaryDrive.email
  ) {
    let primaryDrive = await getDrive({
      provider: session.primaryDrive.provider,
      email: session.primaryDrive.email,
    });

    if (primaryDrive && primaryDrive.provider && primaryDrive.email) {
      newSession.primaryDrive = {
        provider: primaryDrive.provider,
        email: primaryDrive.email,
        refreshToken: primaryDrive.refreshToken || undefined,
        refreshTime: primaryDrive.refreshTime || undefined,
      };
    }
  }

  if (session.secondaryDrives) {
    newSession.secondaryDrives = [];
    for (const drive of session.secondaryDrives) {
      if (drive.provider && drive.email) {
        let secondaryDrive = await getDrive({
          provider: drive.provider,
          email: drive.email,
        });

        if (secondaryDrive && secondaryDrive.provider && secondaryDrive.email) {
          newSession.secondaryDrives.push({
            provider: secondaryDrive.provider,
            email: secondaryDrive.email,
            refreshToken: secondaryDrive.refreshToken || undefined,
            refreshTime: secondaryDrive.refreshTime || undefined,
          });
        }
      } else {
        newSession.secondaryDrives.push(drive);
      }
    }
  }

  return newSession;
}

const SessionContext = createContext<Session>(defaultSession);

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session>(
    initializeSessionFromLocalStorage(),
  );
  const [sessionChanged, setSessionChanged] = useState(1);

  useEffect(() => {
    let cancelled = false;
    writeLocalStorageJson(STORAGE_KEYS.session, sanitizeSession(session));
    loadSessionDrives(session).then((newSession) => {
      if (cancelled) return;
      console.log({ session, newSession });
      if (
        !newSession ||
        !newSession.primaryDrive ||
        !newSession.secondaryDrives
      )
        return;
      setSession(newSession);
    });

    return () => {
      cancelled = true;
    };
  }, [sessionChanged]);

  const setPrimaryDrive = useCallback(
    (provider: string, email: string, refreshToken: string | undefined) => {
      setSession((prev) => {
        if (!prev) return defaultSession;
        if (prev.primaryDrive) return prev;

        const newSession: Session = {
          ...prev,
          primaryDrive: {
            provider,
            email,
            refreshToken,
            refreshTime: refreshToken ? Date.now() : undefined,
          },
        };

        return newSession;
      });
      setSessionChanged(sessionChanged * -1);
    },
    [],
  );

  const addSecondaryDrive = useCallback(
    (provider: string, email: string, refreshToken: string | undefined) => {
      setSession((prev) => {
        if (!prev) return defaultSession;
        if (!prev.primaryDrive) return prev;
        if (!provider || !email) return prev;

        if (
          prev.primaryDrive.email === email &&
          prev.primaryDrive.provider === provider
        )
          return prev;

        const existingIndex = prev.secondaryDrives?.findIndex(
          (d) => d.email === email && d.provider === provider,
        );

        let newSecondaryDrives = prev.secondaryDrives || [];

        if (existingIndex !== undefined && existingIndex >= 0) {
          // Update existing drive
          newSecondaryDrives[existingIndex] = {
            provider,
            email,
            refreshToken,
            refreshTime: refreshToken ? Date.now() : undefined,
          };
        }

        if (existingIndex === undefined || existingIndex < 0) {
          // Add new drive
          newSecondaryDrives = [
            ...(prev.secondaryDrives || []),
            {
              provider,
              email,
              refreshToken,
              refreshTime: refreshToken ? Date.now() : undefined,
            },
          ];
        }

        const newSession: Session = {
          ...prev,
          secondaryDrives: newSecondaryDrives,
        };

        return newSession;
      });
      setSessionChanged(sessionChanged * -1);
    },
    [],
  );

  const removeSecondaryDrive = useCallback(
    (provider: string, email: string) => {
      setSession((prev) => {
        if (!prev) return defaultSession;
        if (!prev.primaryDrive) return prev;
        if (!provider || !email) return prev;

        const newSecondaryDrives = prev.secondaryDrives?.filter(
          (d) => !(d.email === email && d.provider === provider),
        );

        const newSession: Session = {
          ...prev,
          secondaryDrives: newSecondaryDrives,
        };

        return newSession;
      });
      setSessionChanged(sessionChanged * -1);
    },
    [],
  );

  const getLoggedInSecondaryDrives = () => {
    return session.secondaryDrives?.filter((d) => d.refreshToken) || [];
  };

  const getLoggedOutSecondaryDrives = () => {
    return session.secondaryDrives?.filter((d) => !d.refreshToken) || [];
  };

  const logoutSecondaryDrive = useCallback(
    (provider: string, email: string) => {
      setSession((prev) => {
        if (!prev) return defaultSession;
        if (!prev.primaryDrive) return prev;
        if (!provider || !email) return prev;

        const newSecondaryDrives = prev.secondaryDrives?.map((d) => {
          if (d.email === email && d.provider === provider) {
            return { ...d, refreshToken: undefined };
          }
          return d;
        });

        const newSession: Session = {
          ...prev,
          secondaryDrives: newSecondaryDrives,
        };

        return newSession;
      });
      setSessionChanged(sessionChanged * -1);
    },
    [],
  );

  const logoutPrimaryDrive = useCallback(() => {
    console.log("logout primary drive");
    writeLocalStorageJson(STORAGE_KEYS.primaryDrive, {
      provider: session.primaryDrive?.provider,
      email: session.primaryDrive?.email,
    });
    setSession(defaultSession);
    setSessionChanged(sessionChanged * -1);
    writeLocalStorageJson(STORAGE_KEYS.session, { defaultSession });
  }, []);

  const value = useMemo<Session>(
    () => ({
      ...session,
      setPrimaryDrive,
      addSecondaryDrive,
      removeSecondaryDrive,
      getLoggedInSecondaryDrives,
      getLoggedOutSecondaryDrives,
      logoutSecondaryDrive,
      logoutPrimaryDrive,
    }),
    [session, setPrimaryDrive, addSecondaryDrive, removeSecondaryDrive],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
};

export const useSession = () => {
  const session = useContext(SessionContext);
  if (session === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return session;
};
