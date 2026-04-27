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
import type { Drive, DriveSettings } from "./Drive.tsx";
import { Session, emptySession } from "./Session.tsx";

import { SavePersistentSession } from "../services/browser/save-persistent-session.tsx";
import { toPersistedSession } from "../services/browser/save-persistent-session.tsx";
import { RetreivePersistentSession } from "../services/browser/retreive-persistent-session.tsx";
import { LogoutFromLocalStorage } from "../services/browser/logout.tsx";
import { SaveDrive } from "../services/browser/save-drive.tsx";
import {
  readRemoteSessionState,
  writeRemoteSessionState,
  type KnownSecondaryAccount,
} from "../services/app-storage.ts";
import {
  getDriveStorageKey,
  removeLocalStorageKey,
} from "../services/browser/storage.ts";
import {
  createDriveRefreshSecretKey,
  deleteSecret,
} from "../services/security/secret-storage.ts";

interface SessionContextType {
  session: Session;
  knownSecondaryAccounts: KnownSecondaryAccount[];

  setPrimaryDrive: (primaryDrive: Drive) => void;
  addSecondaryDrive: (newSecondaryDrive: Drive) => void;
  removeSecondaryDrive: (drive: Drive) => void;
  disconnectSecondaryDrive: (drive: Drive) => void;
  forgetKnownSecondaryAccount: (account: KnownSecondaryAccount) => void;
  updateDrive: (drive: Drive) => void;
  setDriveUsageLimit: (driveKey: string, usageLimitPercent: number) => void;
  refreshAllDriveDetails: () => Promise<void>;

  logout: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

const initializeSessionFromLocalStorage = (): Session =>
  RetreivePersistentSession();

interface PerDriveSettingsPayload extends DriveSettings {
  version: 1;
  updatedAt: number;
  usageLimitPercent: number;
}

function normalizeKnownSecondaryAccounts(
  accounts: KnownSecondaryAccount[],
): KnownSecondaryAccount[] {
  const deduped = new Map<string, KnownSecondaryAccount>();
  accounts.forEach((account) => {
    if (!account?.provider || !account?.email) {
      return;
    }
    deduped.set(
      createDriveKey(account.provider, account.email),
      {
        provider: account.provider,
        email: account.email,
      },
    );
  });
  return Array.from(deduped.values());
}

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSessionState] = useState<Session>(
    initializeSessionFromLocalStorage(),
  );
  const [knownSecondaryAccounts, setKnownSecondaryAccounts] = useState<
    KnownSecondaryAccount[]
  >(() =>
    normalizeKnownSecondaryAccounts(
      session.secondaryDrives.map((drive) => ({
        provider: drive.provider,
        email: drive.email,
      })),
    ),
  );
  const lastSyncedPersistedSession = useRef<string | null>(null);
  const syncingPersistedSession = useRef<string | null>(null);
  const hydratedKnownSecondaryRef = useRef<string | null>(null);

  const writePerDriveSettings = useCallback(
    async (drive: Drive, usageLimitPercent: number) => {
      const payload: PerDriveSettingsPayload = {
        version: 1,
        updatedAt: Date.now(),
        usageLimitPercent,
      };

      try {
        await drive.write_drive_settings(payload);
      } catch (error) {
        console.warn(`Unable to persist appdata settings for ${drive.email}`, error);
      }
    },
    [],
  );

  const readPerDriveSettings = useCallback(async (drive: Drive) => {
    try {
      const payload =
        await drive.read_drive_settings();
      const usageLimitPercent = Number(payload?.usageLimitPercent);
      if (!usageLimitPercent || Number.isNaN(usageLimitPercent)) {
        return null;
      }
      return usageLimitPercent;
    } catch (error) {
      console.warn(`Unable to read appdata settings for ${drive.email}`, error);
      return null;
    }
  }, []);

  useEffect(() => {
    setKnownSecondaryAccounts((prev) =>
      normalizeKnownSecondaryAccounts([
        ...prev,
        ...session.secondaryDrives.map((drive) => ({
          provider: drive.provider,
          email: drive.email,
        })),
      ]),
    );
  }, [session.secondaryDrives]);

  useEffect(() => {
    const primaryDrive = session.primaryDrive;
    if (!primaryDrive) {
      hydratedKnownSecondaryRef.current = null;
      setKnownSecondaryAccounts([]);
      return;
    }

    const primaryDriveKey = createDriveKey(primaryDrive.provider, primaryDrive.email);
    if (hydratedKnownSecondaryRef.current === primaryDriveKey) {
      return;
    }

    let cancelled = false;
    readRemoteSessionState(primaryDrive)
      .then((remoteState) => {
        if (cancelled) {
          return;
        }

        hydratedKnownSecondaryRef.current = primaryDriveKey;
        setKnownSecondaryAccounts((prev) =>
          normalizeKnownSecondaryAccounts([
            ...(remoteState.knownSecondaryAccounts || []),
            ...prev,
          ]),
        );
      })
      .catch((error) => {
        console.warn("Unable to hydrate known secondary drives", error);
      });

    return () => {
      cancelled = true;
    };
  }, [session.primaryDrive]);

  useEffect(() => {
    if (!session.primaryDrive) {
      lastSyncedPersistedSession.current = null;
      syncingPersistedSession.current = null;
      return;
    }

    const persistedSession = toPersistedSession(session);
    const mergedKnownSecondaryAccounts = normalizeKnownSecondaryAccounts([
      ...knownSecondaryAccounts,
      ...session.secondaryDrives.map((drive) => ({
        provider: drive.provider,
        email: drive.email,
      })),
    ]);
    const persistedSessionKey = JSON.stringify({
      persistedSession,
      mergedKnownSecondaryAccounts,
    });

    SavePersistentSession(session);

    // Don't write to remote storage until the initial hydration of known secondary
    // accounts has completed for this primary drive. Writing before hydration would
    // overwrite the stored list with an incomplete set, causing remembered-but-not-
    // connected drives to be lost after an OAuth redirect.
    const primaryDriveKey = createDriveKey(
      session.primaryDrive.provider,
      session.primaryDrive.email,
    );
    if (hydratedKnownSecondaryRef.current !== primaryDriveKey) {
      return;
    }

    if (
      lastSyncedPersistedSession.current === persistedSessionKey ||
      syncingPersistedSession.current === persistedSessionKey
    ) {
      return;
    }

    syncingPersistedSession.current = persistedSessionKey;
    void writeRemoteSessionState(session.primaryDrive, {
      session: persistedSession,
      knownSecondaryAccounts: mergedKnownSecondaryAccounts,
    })
      .then(() => {
        lastSyncedPersistedSession.current = persistedSessionKey;
      })
      .catch((error) => {
        console.warn("Unable to sync session app storage", error);
      })
      .finally(() => {
        if (syncingPersistedSession.current === persistedSessionKey) {
          syncingPersistedSession.current = null;
        }
      });
  }, [knownSecondaryAccounts, session]);

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

  const disconnectSecondaryDrive = useCallback((drive: Drive) => {
    removeSecondaryDrive(drive);
    removeLocalStorageKey(getDriveStorageKey(drive.provider, drive.email));
    void deleteSecret(createDriveRefreshSecretKey(drive.provider, drive.email)).catch(
      (error) => {
        console.warn(
          `Unable to clear refresh token for ${drive.provider}:${drive.email}`,
          error,
        );
      },
    );
  }, [removeSecondaryDrive]);

  const forgetKnownSecondaryAccount = useCallback((account: KnownSecondaryAccount) => {
    if (!account?.provider || !account?.email) {
      return;
    }

    setKnownSecondaryAccounts((prev) =>
      prev.filter(
        (existingAccount) =>
          createDriveKey(existingAccount.provider, existingAccount.email) !==
          createDriveKey(account.provider, account.email),
      ),
    );

    removeLocalStorageKey(getDriveStorageKey(account.provider, account.email));
    void deleteSecret(createDriveRefreshSecretKey(account.provider, account.email)).catch(
      (error) => {
        console.warn(
          `Unable to clear remembered refresh token for ${account.provider}:${account.email}`,
          error,
        );
      },
    );
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
      const allDrives = [
        ...(session.primaryDrive ? [session.primaryDrive] : []),
        ...session.secondaryDrives,
      ];
      const targetDrive = allDrives.find(
        (drive) => createDriveKey(drive.provider, drive.email) === driveKey,
      );
      if (!targetDrive) {
        return;
      }

      const nextDrive = Object.assign(
        Object.create(Object.getPrototypeOf(targetDrive)) as Drive,
        targetDrive,
        {
          drive_settings: {
            ...targetDrive.drive_settings,
            usageLimitPercent,
            allowed_space_usage_percent: usageLimitPercent,
          },
        },
      );

      SaveDrive(nextDrive);
      void writePerDriveSettings(nextDrive, usageLimitPercent);

      setSessionState((prev) => ({
        primaryDrive:
          prev.primaryDrive &&
          createDriveKey(prev.primaryDrive.provider, prev.primaryDrive.email) ===
            driveKey
            ? nextDrive
            : prev.primaryDrive,
        secondaryDrives: prev.secondaryDrives.map((drive) =>
          createDriveKey(drive.provider, drive.email) === driveKey
            ? nextDrive
            : drive,
        ),
      }));
    },
    [session.primaryDrive, session.secondaryDrives, writePerDriveSettings],
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
          const usageLimitPercent = await readPerDriveSettings(drive);
          if (usageLimitPercent) {
            drive.drive_settings = {
              ...drive.drive_settings,
              usageLimitPercent,
              allowed_space_usage_percent: usageLimitPercent,
            };
          }
          updateDrive(drive);
        } catch (error) {
          console.warn(`Unable to refresh drive details for ${drive.email}`, error);
        }
      }),
    );
  }, [
    readPerDriveSettings,
    session.primaryDrive,
    session.secondaryDrives,
    updateDrive,
  ]);

  const logout = useCallback(() => {
    setSessionState(emptySession);
    LogoutFromLocalStorage();
  }, []);

  const value = useMemo(
    () => ({
      session,
      knownSecondaryAccounts,
      setPrimaryDrive,
      addSecondaryDrive,
      removeSecondaryDrive,
      disconnectSecondaryDrive,
      forgetKnownSecondaryAccount,
      updateDrive,
      setDriveUsageLimit,
      refreshAllDriveDetails,
      logout,
    }),
    [
      session,
      knownSecondaryAccounts,
      setPrimaryDrive,
      addSecondaryDrive,
      removeSecondaryDrive,
      disconnectSecondaryDrive,
      forgetKnownSecondaryAccount,
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
