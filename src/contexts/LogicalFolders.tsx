import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type { Drive } from "./Drive";
import type {
  LogicalEntry,
  LogicalFolder,
  LogicalFolderBackend,
  LogicalDriveListingSettings,
  LogicalDrivePackingSettings,
} from "./LogicalFolderTypes";
import {
  createDefaultListingSettings,
  createDefaultPackingSettings,
  MAX_CHUNK_SIZE_BYTES,
  MIN_CHUNK_SIZE_BYTES,
} from "./LogicalFolderTypes";
import { useSession } from "./SessionContext";
import { mergeRemoteAppStorage, readRemoteAppStorage } from "../services/app-storage";
import { getOrCreateGoogleDriveFolderInParent } from "../services/google/google-drive-files";
import {
  STORAGE_KEYS,
  readLocalStorageJson,
  writeLocalStorageJson,
} from "../services/browser/storage";
import { createDriveKey, createId } from "../utils/ids";

interface LogicalFoldersContextValue {
  logicalFolders: LogicalFolder[];
  isReady: boolean;
  createLogicalFolder: (name: string, drives: Drive[]) => Promise<LogicalFolder>;
  replaceLogicalFolder: (
    logicalFolderId: string,
    updater: (folder: LogicalFolder) => LogicalFolder,
  ) => void;
  removeLogicalFolder: (logicalFolderId: string) => void;
  deleteLogicalFolder: (
    logicalFolderId: string,
    mode: "forget" | "delete-all",
  ) => Promise<{ success: boolean; failedBackends: string[] }>;
  updateLogicalFolderSettings: (
    logicalFolderId: string,
    settings: {
      packing?: Partial<LogicalDrivePackingSettings>;
      listing?: Partial<LogicalDriveListingSettings>;
    },
  ) => void;
  getLogicalFolder: (logicalFolderId: string) => LogicalFolder | undefined;
}

const LogicalFoldersContext = createContext<
  LogicalFoldersContextValue | undefined
>(undefined);

function normalizeLogicalEntry(entry: LogicalEntry): LogicalEntry {
  return {
    ...entry,
    parentId: entry.parentId ?? null,
    placements: Array.isArray(entry.placements) ? entry.placements : [],
  };
}

function normalizeLogicalFolder(folder: LogicalFolder): LogicalFolder {
  const drivePriority = (folder.backends || []).map((backend) => backend.driveKey);
  const rawChunkSize = Number(folder.packing?.chunkSizeBytes);
  const chunkSizeBytes = Number.isFinite(rawChunkSize)
    ? Math.min(Math.max(rawChunkSize, MIN_CHUNK_SIZE_BYTES), MAX_CHUNK_SIZE_BYTES)
    : createDefaultPackingSettings(drivePriority).chunkSizeBytes;

  return {
    ...folder,
    status:
      folder.status === "partially_deleted" ? "partially_deleted" : "active",
    backends: Array.isArray(folder.backends)
      ? folder.backends.map((backend) => ({
          ...backend,
          backendId:
            backend.backendId ||
            `${backend.driveKey}:${backend.rootFolderId || "root"}`,
        }))
      : [],
    packing: {
      ...createDefaultPackingSettings(drivePriority),
      ...folder.packing,
      chunkSizeBytes,
    },
    listing: {
      ...createDefaultListingSettings(),
      ...folder.listing,
    },
    items: Array.isArray(folder.items)
      ? sortEntries(folder.items.map(normalizeLogicalEntry))
      : [],
  };
}

function mergeLogicalFolders(
  localFolders: LogicalFolder[],
  remoteFolders: LogicalFolder[],
) {
  const merged = new Map<string, LogicalFolder>();

  [...localFolders, ...remoteFolders]
    .filter((folder): folder is LogicalFolder => Boolean(folder?.id))
    .forEach((folder) => {
      const normalizedFolder = normalizeLogicalFolder(folder);
      const existing = merged.get(folder.id);
      const hasEntries = normalizedFolder.items.length > 0;
      const existingHasEntries = (existing?.items || []).length > 0;
      if (
        !existing ||
        (normalizedFolder.updatedAt || 0) >= (existing.updatedAt || 0)
      ) {
        merged.set(normalizedFolder.id, {
          ...normalizedFolder,
          // v3 remote manifest no longer persists file trees.
          items:
            hasEntries || !existingHasEntries
              ? normalizedFolder.items
              : existing?.items || [],
        });
      }
    });

  return Array.from(merged.values()).sort((left, right) =>
    left.name.localeCompare(right.name),
  );
}

async function resolveLogicalRootParent(drive: Drive) {
  if (drive.provider !== "google-drive") {
    return "root";
  }

  const container = await getOrCreateGoogleDriveFolderInParent(
    drive,
    "root",
    ".spanneddrive",
  );
  return container.id;
}

async function createBackendRoots(name: string, drives: Drive[]) {
  const results = await Promise.all(
    drives.map(async (drive): Promise<LogicalFolderBackend> => {
      const rootParentId = await resolveLogicalRootParent(drive);
      const rootFolder = await drive.create_folder(
        `SDrive · ${name}`,
        rootParentId,
      );

      return {
        backendId: createId("logical-backend"),
        provider: drive.provider,
        email: drive.email,
        driveKey: createDriveKey(drive.provider, drive.email),
        rootFolderId: rootFolder.id,
        usageLimitPercent:
          Number(
            drive.drive_settings.usageLimitPercent ??
              drive.drive_settings.allowed_space_usage_percent,
          ) || 85,
      };
    }),
  );

  return results;
}

function sortEntries(entries: LogicalEntry[]) {
  return [...entries].sort((left, right) => {
    if (left.kind !== right.kind) {
      return left.kind === "folder" ? -1 : 1;
    }

    return left.name.localeCompare(right.name);
  });
}

export function LogicalFoldersProvider({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const [logicalFolders, setLogicalFolders] = useState<LogicalFolder[]>(() =>
    mergeLogicalFolders(
      [],
      readLocalStorageJson(STORAGE_KEYS.logicalFolders, [] as LogicalFolder[]),
    ),
  );
  const [hydratedDriveKey, setHydratedDriveKey] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    writeLocalStorageJson(STORAGE_KEYS.logicalFolders, logicalFolders);
  }, [logicalFolders]);

  useEffect(() => {
    if (!session.primaryDrive) {
      setIsReady(true);
      setHydratedDriveKey(null);
      return;
    }

    const currentDriveKey = createDriveKey(
      session.primaryDrive.provider,
      session.primaryDrive.email,
    );

    if (hydratedDriveKey === currentDriveKey) {
      setIsReady(true);
      return;
    }

    let cancelled = false;
    setIsReady(false);

    readRemoteAppStorage(session.primaryDrive)
      .then((remoteState) => {
        if (cancelled) {
          return;
        }

        setLogicalFolders((current) =>
          mergeLogicalFolders(current, remoteState.logicalFolders || []),
        );
        setHydratedDriveKey(currentDriveKey);
        setIsReady(true);
      })
      .catch(() => {
        if (!cancelled) {
          setHydratedDriveKey(currentDriveKey);
          setIsReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [hydratedDriveKey, session.primaryDrive]);

  const lastSyncedManifestRef = useRef<string | null>(null);
  const pendingSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (
      !session.primaryDrive ||
      !hydratedDriveKey ||
      hydratedDriveKey !==
        createDriveKey(session.primaryDrive.provider, session.primaryDrive.email)
    ) {
      return;
    }

    // The remote v3 manifest never persists item trees, so signature
    // ignores `items` to avoid re-syncing on every live-listing refresh.
    const manifestSignature = JSON.stringify(
      logicalFolders
        .map((folder) => ({
          id: folder.id,
          name: folder.name,
          createdAt: folder.createdAt,
          updatedAt: folder.updatedAt,
          status: folder.status,
          backends: folder.backends,
          packing: folder.packing,
          listing: folder.listing,
        }))
        .sort((left, right) => left.id.localeCompare(right.id)),
    );

    if (lastSyncedManifestRef.current === manifestSignature) {
      return;
    }

    if (pendingSyncTimerRef.current) {
      clearTimeout(pendingSyncTimerRef.current);
    }

    const driveSnapshot = session.primaryDrive;
    pendingSyncTimerRef.current = setTimeout(() => {
      pendingSyncTimerRef.current = null;
      lastSyncedManifestRef.current = manifestSignature;
      void mergeRemoteAppStorage(driveSnapshot, {
        logicalFolders,
      }).catch((error) => {
        // Allow next change to retry by clearing the cached signature.
        lastSyncedManifestRef.current = null;
        console.warn("Unable to sync logical folders to app storage", error);
      });
    }, 1500);

    return () => {
      if (pendingSyncTimerRef.current) {
        clearTimeout(pendingSyncTimerRef.current);
        pendingSyncTimerRef.current = null;
      }
    };
  }, [hydratedDriveKey, logicalFolders, session.primaryDrive]);

  const createLogicalFolder = useCallback(
    async (name: string, drives: Drive[]) => {
      const uniqueDrives = drives.filter(
        (drive, index) =>
          drives.findIndex(
            (candidate) =>
              createDriveKey(candidate.provider, candidate.email) ===
              createDriveKey(drive.provider, drive.email),
          ) === index,
      );

      const backends = await createBackendRoots(name, uniqueDrives);
      const now = Date.now();
      const logicalFolder: LogicalFolder = {
        id: createId("logical-folder"),
        name,
        createdAt: now,
        updatedAt: now,
        status: "active",
        backends,
        packing: createDefaultPackingSettings(backends.map((backend) => backend.driveKey)),
        listing: createDefaultListingSettings(),
        items: [],
      };

      setLogicalFolders((current) =>
        mergeLogicalFolders(current, [logicalFolder]),
      );

      return logicalFolder;
    },
    [],
  );

  const replaceLogicalFolder = useCallback(
    (
      logicalFolderId: string,
      updater: (folder: LogicalFolder) => LogicalFolder,
    ) => {
      setLogicalFolders((current) => {
        let changed = false;
        const next = current.map((folder) => {
          if (folder.id !== logicalFolderId) {
            return folder;
          }

          const nextFolder = updater(folder);
          if (nextFolder === folder) {
            return folder;
          }

          changed = true;
          const next: LogicalFolder = {
            ...nextFolder,
            updatedAt: Date.now(),
            status:
              nextFolder.status === "partially_deleted"
                ? "partially_deleted"
                : "active",
            items: sortEntries(nextFolder.items || []),
          };
          return next;
        });

        return changed ? next : current;
      });
    },
    [],
  );

  const removeLogicalFolder = useCallback((logicalFolderId: string) => {
    setLogicalFolders((current) =>
      current.filter((folder) => folder.id !== logicalFolderId),
    );
  }, []);

  const getDriveByKey = useCallback(
    (driveKey: string) => {
      const allDrives = [
        ...(session.primaryDrive ? [session.primaryDrive] : []),
        ...session.secondaryDrives,
      ];
      return allDrives.find(
        (drive) => createDriveKey(drive.provider, drive.email) === driveKey,
      );
    },
    [session.primaryDrive, session.secondaryDrives],
  );

  const updateLogicalFolderSettings = useCallback(
    (
      logicalFolderId: string,
      settings: {
        packing?: Partial<LogicalDrivePackingSettings>;
        listing?: Partial<LogicalDriveListingSettings>;
      },
    ) => {
      replaceLogicalFolder(logicalFolderId, (folder) => {
        const drivePriority = (folder.backends || []).map((backend) => backend.driveKey);
        const rawChunkSize = Number(
          settings.packing?.chunkSizeBytes ?? folder.packing?.chunkSizeBytes,
        );
        const chunkSizeBytes = Number.isFinite(rawChunkSize)
          ? Math.min(Math.max(rawChunkSize, MIN_CHUNK_SIZE_BYTES), MAX_CHUNK_SIZE_BYTES)
          : createDefaultPackingSettings(drivePriority).chunkSizeBytes;

        return {
          ...folder,
          packing: {
            ...createDefaultPackingSettings(drivePriority),
            ...folder.packing,
            ...(settings.packing || {}),
            chunkSizeBytes,
          },
          listing: {
            ...createDefaultListingSettings(),
            ...folder.listing,
            ...(settings.listing || {}),
          },
        };
      });
    },
    [replaceLogicalFolder],
  );

  const deleteLogicalFolder = useCallback(
    async (logicalFolderId: string, mode: "forget" | "delete-all") => {
      const folder = logicalFolders.find((item) => item.id === logicalFolderId);
      if (!folder) {
        return { success: false, failedBackends: [] };
      }

      if (mode === "forget") {
        removeLogicalFolder(logicalFolderId);
        return { success: true, failedBackends: [] };
      }

      const failedBackends: string[] = [];
      for (const backend of folder.backends || []) {
        const drive = getDriveByKey(backend.driveKey);
        if (!drive) {
          failedBackends.push(backend.driveKey);
          continue;
        }

        try {
          await drive.delete_item(backend.rootFolderId);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          // Already-removed roots should not block logical drive deletion.
          if (
            !message.includes("404") &&
            !message.includes("notFound") &&
            !message.includes("File not found")
          ) {
            failedBackends.push(backend.driveKey);
          }
        }
      }

      if (failedBackends.length === 0) {
        removeLogicalFolder(logicalFolderId);
        return { success: true, failedBackends: [] };
      }

      replaceLogicalFolder(logicalFolderId, (existingFolder) => ({
        ...existingFolder,
        status: "partially_deleted",
      }));
      return { success: false, failedBackends };
    },
    [getDriveByKey, logicalFolders, removeLogicalFolder, replaceLogicalFolder],
  );

  const getLogicalFolder = useCallback(
    (logicalFolderId: string) =>
      logicalFolders.find((folder) => folder.id === logicalFolderId),
    [logicalFolders],
  );

  const value = useMemo<LogicalFoldersContextValue>(
    () => ({
      logicalFolders,
      isReady,
      createLogicalFolder,
      replaceLogicalFolder,
      removeLogicalFolder,
      deleteLogicalFolder,
      updateLogicalFolderSettings,
      getLogicalFolder,
    }),
    [
      logicalFolders,
      isReady,
      createLogicalFolder,
      replaceLogicalFolder,
      removeLogicalFolder,
      deleteLogicalFolder,
      updateLogicalFolderSettings,
      getLogicalFolder,
    ],
  );

  return (
    <LogicalFoldersContext.Provider value={value}>
      {children}
    </LogicalFoldersContext.Provider>
  );
}

export function useLogicalFolders() {
  const context = useContext(LogicalFoldersContext);
  if (!context) {
    throw new Error(
      "useLogicalFolders must be used within LogicalFoldersProvider",
    );
  }

  return context;
}
