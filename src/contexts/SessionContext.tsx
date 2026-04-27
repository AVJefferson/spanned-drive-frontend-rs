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
import type { Drive, DriveReference, DriveSettings, DriveSnapshot } from "../services/drives/types";

export interface Session {
  primaryDrive: DriveSnapshot | null;
  secondaryDrives: DriveSnapshot[];
}

export const emptySession: Session = {
  primaryDrive: null,
  secondaryDrives: [],
};

export interface PersistedSession {
  primaryDrive: DriveReference | null;
  secondaryDrives: DriveReference[];
}

import {
  retreivePersistentSession,
  savePersistentSession,
  toPersistedSession,
} from "../services/storage/session";
import { logoutFromLocalStorage } from "../services/storage/lifecycle";
import { saveDrive } from "../services/storage/drive";
import {
  readKnownSecondaryAccounts,
  registerKnownSecondaryAccount,
  readRemoteSecondaryCredentials,
  upsertRemoteSecondaryCredential,
  removeRemoteSecondaryCredential,
  type KnownSecondaryAccount,
} from "../services/app-storage";
import {
  getDriveStorageKey,
  removeLocalStorageKey,
} from "../services/storage/storage";
import {
  createDriveRefreshSecretKey,
  deleteSecret,
  setSecret,
} from "../platform/secret-storage";
import { getDriveImplementation } from "../services/drives/registry";

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
  retreivePersistentSession();

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
  const hydratedSecondaryCredentialsRef = useRef<string | null>(null);
  // Tracks the latest primary drive so stable useCallback mutators can mirror
  // refresh-token changes to the primary drive's appdata without redefining
  // (and re-broadcasting) on every session change.
  const primaryDriveRef = useRef<Drive | null>(null);
  useEffect(() => {
    primaryDriveRef.current = session.primaryDrive;
  }, [session.primaryDrive]);

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
    readKnownSecondaryAccounts(primaryDrive)
      .then((remoteAccounts) => {
        if (cancelled) {
          return;
        }

        hydratedKnownSecondaryRef.current = primaryDriveKey;
        setKnownSecondaryAccounts((prev) =>
          normalizeKnownSecondaryAccounts([
            ...(remoteAccounts || []),
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
    // Depend on stable driveKey, not the drive object ref. Ref changes during
    // drive details refresh would otherwise cancel this hydrate read.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    session.primaryDrive
      ? createDriveKey(session.primaryDrive.provider, session.primaryDrive.email)
      : null,
  ]);

  // Auto-restore secondary drives from credentials mirrored on the primary
  // drive's appdata. Runs once per primary drive sign-in: reads the encrypted
  // credentials file, restores each refresh token to local secret storage,
  // and adds the corresponding drive instance to the session.
  useEffect(() => {
    const primaryDrive = session.primaryDrive;
    if (!primaryDrive) {
      hydratedSecondaryCredentialsRef.current = null;
      return;
    }

    const primaryDriveKey = createDriveKey(
      primaryDrive.provider,
      primaryDrive.email,
    );
    if (hydratedSecondaryCredentialsRef.current === primaryDriveKey) {
      return;
    }
    hydratedSecondaryCredentialsRef.current = primaryDriveKey;

    let cancelled = false;
    void readRemoteSecondaryCredentials(primaryDrive)
      .then(async (credentials) => {
        if (cancelled || credentials.length === 0) {
          return;
        }

        const restored: Drive[] = [];
        for (const credential of credentials) {
          // Don't restore the primary as a secondary of itself.
          if (
            credential.provider === primaryDrive.provider &&
            credential.email === primaryDrive.email
          ) {
            continue;
          }

          const DriveImplementation = getDriveImplementation(credential.provider);
          if (!DriveImplementation) {
            console.warn(
              `No drive implementation registered for ${credential.provider}; skipping auto-restore`,
            );
            continue;
          }

          try {
            // Restore the refresh token to local secret storage so the
            // hydrated drive (and any cold-start retreiveDrive call) can use
            // it via getSecret().
            await setSecret(
              createDriveRefreshSecretKey(credential.provider, credential.email),
              credential.refresh_token,
            );

            const drive = new DriveImplementation({
              email: credential.email,
              provider: credential.provider,
              refresh_token: credential.refresh_token,
              acquired_at: Date.now(),
              drive_settings: {
                usageLimitPercent: 85,
                allowed_space_usage_percent: 85,
              },
              drive_details: {
                totalSpace: 0,
                usedSpace: 0,
                freeSpace: 0,
              },
              drive_span: {},
            });

            try {
              await drive.refresh_drive_details();
            } catch (error) {
              console.warn(
                `Auto-restored ${credential.provider}:${credential.email} but unable to refresh details`,
                error,
              );
            }

            saveDrive(drive);
            restored.push(drive);
          } catch (error) {
            console.warn(
              `Unable to auto-restore secondary drive ${credential.provider}:${credential.email}`,
              error,
            );
          }
        }

        if (cancelled || restored.length === 0) {
          return;
        }

        setSessionState((prev) => {
          if (!prev.primaryDrive) {
            return prev;
          }
          // De-dupe against already-present primary/secondary drives.
          const present = new Set<string>();
          present.add(
            createDriveKey(prev.primaryDrive.provider, prev.primaryDrive.email),
          );
          prev.secondaryDrives.forEach((drive) =>
            present.add(createDriveKey(drive.provider, drive.email)),
          );

          const additions = restored.filter(
            (drive) => !present.has(createDriveKey(drive.provider, drive.email)),
          );
          if (additions.length === 0) {
            return prev;
          }
          return {
            ...prev,
            secondaryDrives: [...prev.secondaryDrives, ...additions],
          };
        });
      })
      .catch((error) => {
        console.warn("Unable to hydrate secondary drive credentials", error);
        hydratedSecondaryCredentialsRef.current = null;
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    session.primaryDrive
      ? createDriveKey(session.primaryDrive.provider, session.primaryDrive.email)
      : null,
  ]);

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

    // The active session lives only in localStorage; we no longer mirror it to
    // a single bespoke remote file. Cross-device discovery of accounts the
    // user has connected is delegated to the dedicated backend registry
    // (`get_secondary_drives` / `set_secondary_drive`), populated below in
    // `addSecondaryDrive`.
    savePersistentSession(session);

    // Don't push to the remote registry until the initial hydration of known
    // secondary accounts has completed for this primary drive; otherwise we'd
    // try to re-register entries we haven't yet read back.
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
    const primaryDriveSnapshot = session.primaryDrive;
    void Promise.all(
      mergedKnownSecondaryAccounts.map((account) =>
        registerKnownSecondaryAccount(primaryDriveSnapshot, account),
      ),
    )
      .then(() => {
        lastSyncedPersistedSession.current = persistedSessionKey;
      })
      .finally(() => {
        if (syncingPersistedSession.current === persistedSessionKey) {
          syncingPersistedSession.current = null;
        }
      });

    // Backfill: any currently-attached secondary drive that still has its
    // refresh token in memory should be mirrored to the primary drive's
    // appdata. Newly-added drives also flow through here; the upsert is a
    // no-op when the stored token already matches.
    session.secondaryDrives.forEach((secondary) => {
      if (!secondary.refresh_token) return;
      void upsertRemoteSecondaryCredential(primaryDriveSnapshot, {
        provider: secondary.provider,
        email: secondary.email,
        refresh_token: secondary.refresh_token,
      });
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

      saveDrive(primaryDrive);
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
      saveDrive(newSecondaryDrive);

      // Mirror the refresh token to the primary drive's appdata so the user
      // can re-attach this secondary drive automatically on the next sign-in
      // with their primary account.
      if (newSecondaryDrive.refresh_token) {
        void upsertRemoteSecondaryCredential(prev.primaryDrive, {
          provider: newSecondaryDrive.provider,
          email: newSecondaryDrive.email,
          refresh_token: newSecondaryDrive.refresh_token,
        });
      }

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
    void removeRemoteSecondaryCredential(primaryDriveRef.current, {
      provider: drive.provider,
      email: drive.email,
    });
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
    void removeRemoteSecondaryCredential(primaryDriveRef.current, {
      provider: account.provider,
      email: account.email,
    });
  }, []);

  const updateDrive = useCallback((drive: Drive) => {
    saveDrive(drive);
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

      saveDrive(nextDrive);
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

    const refreshed = await Promise.all(
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
          saveDrive(drive);
          return drive;
        } catch (error) {
          console.warn(`Unable to refresh drive details for ${drive.email}`, error);
          return drive;
        }
      }),
    );

    // Batch all drive updates into a single state replacement so dependent
    // hydrate effects (folders, known secondaries) don't get cancelled by N
    // intermediate ref changes.
    setSessionState((prev) => {
      const byKey = new Map(
        refreshed.map((drive) => [createDriveKey(drive.provider, drive.email), drive]),
      );
      const nextPrimary =
        prev.primaryDrive &&
        byKey.get(createDriveKey(prev.primaryDrive.provider, prev.primaryDrive.email));
      return {
        primaryDrive: nextPrimary || prev.primaryDrive,
        secondaryDrives: prev.secondaryDrives.map(
          (drive) =>
            byKey.get(createDriveKey(drive.provider, drive.email)) || drive,
        ),
      };
    });
  }, [
    readPerDriveSettings,
    session.primaryDrive,
    session.secondaryDrives,
  ]);

  const logout = useCallback(() => {
    setSessionState(emptySession);
    logoutFromLocalStorage();
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
