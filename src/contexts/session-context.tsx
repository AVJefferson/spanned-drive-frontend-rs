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

import {
  STORAGE_KEYS,
  readLocalStorageJson,
  writeLocalStorageJson,
} from "../services/storage/local-storage";

export interface DriveSession {
  provider: string;
  email: string;
  refreshToken: string | undefined;
  refreshTime: number;
}

export interface Session {
  primaryDrive: DriveSession | undefined;
  secondaryDrives: DriveSession[] | undefined;

  setPrimaryDrive: (
    provider: string,
    email: string,
    refreshToken: string,
  ) => void;

  addSecondaryDrive: (
    provider: string,
    email: string,
    refreshToken: string | undefined,
    refreshTime: number | undefined,
  ) => void;

  removeSecondaryDrive: (provider: string, email: string) => void;

  getLoggedInSecondaryDrives: () => DriveSession[];
  getLoggedOutSecondaryDrives: () => DriveSession[];

  logoutSecondaryDrive: (provider: string, email: string) => void;
  logoutPrimaryDrive: () => void;
}

const defaultSession: Session = {
  primaryDrive: undefined,
  secondaryDrives: undefined,

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

const SessionContext = createContext<Session>(defaultSession);

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session>(
    initializeSessionFromLocalStorage(),
  );

  useEffect(() => {
    writeLocalStorageJson(STORAGE_KEYS.session, session);
  }, [session]);

  const setPrimaryDrive = useCallback(
    (provider: string, email: string, refreshToken: string) => {
      setSession((prev) => {
        if (!prev) return defaultSession;
        if (prev.primaryDrive) return prev;

        const newSession: Session = {
          ...prev,
          primaryDrive: {
            provider,
            email,
            refreshToken,
            refreshTime: Date.now(),
          },
        };

        return newSession;
      });
    },
    [],
  );

  const addSecondaryDrive = useCallback(
    (
      provider: string,
      email: string,
      refreshToken: string | undefined,
      refreshTime: number | undefined,
    ) => {
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
            refreshTime: refreshTime || Date.now(),
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
              refreshTime: refreshTime || Date.now(),
            },
          ];
        }

        const newSession: Session = {
          ...prev,
          secondaryDrives: newSecondaryDrives,
        };

        return newSession;
      });
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
    },
    [],
  );

  const logoutPrimaryDrive = useCallback(() => {
    setSession(defaultSession);
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
