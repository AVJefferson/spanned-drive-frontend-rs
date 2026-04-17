import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { Drive } from "./Drive";
import type {
  LogicalEntry,
  LogicalFolder,
  LogicalFolderBackend,
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
  return {
    ...folder,
    backends: Array.isArray(folder.backends) ? folder.backends : [],
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
      if (
        !existing ||
        (normalizedFolder.updatedAt || 0) >= (existing.updatedAt || 0)
      ) {
        merged.set(normalizedFolder.id, normalizedFolder);
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

  useEffect(() => {
    if (
      !session.primaryDrive ||
      !hydratedDriveKey ||
      hydratedDriveKey !==
        createDriveKey(session.primaryDrive.provider, session.primaryDrive.email)
    ) {
      return;
    }

    void mergeRemoteAppStorage(session.primaryDrive, {
      logicalFolders,
    });
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
        backends,
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
      setLogicalFolders((current) =>
        current.map((folder) => {
          if (folder.id !== logicalFolderId) {
            return folder;
          }

          const nextFolder = updater(folder);
          return {
            ...nextFolder,
            updatedAt: Date.now(),
            items: sortEntries(nextFolder.items || []),
          };
        }),
      );
    },
    [],
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
      getLogicalFolder,
    }),
    [logicalFolders, isReady, createLogicalFolder, replaceLogicalFolder, getLogicalFolder],
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
