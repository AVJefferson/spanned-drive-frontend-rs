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
import { useLogicalFolders } from "./LogicalFolders";
import type { LogicalEntry, LogicalFolder } from "./LogicalFolderTypes";
import { useSession } from "./SessionContext";
import {
  STORAGE_KEYS,
  readLocalStorageJson,
  writeLocalStorageJson,
} from "../services/browser/storage";
import { createDriveKey, createId } from "../utils/ids";

type TaskStatus = "queued" | "running" | "completed" | "failed";
type TaskKind = "upload" | "delete" | "copy" | "move";
type MicrotaskStatus = "queued" | "running" | "completed" | "failed";

interface EntrySeed {
  id: string;
  name: string;
  kind: "file" | "folder";
  parentId: string | null;
  size: number;
  mimeType?: string;
}

interface BaseMicrotask {
  id: string;
  status: MicrotaskStatus;
  title: string;
  error?: string;
}

interface CreateFolderMicrotask extends BaseMicrotask {
  kind: "create-folder";
  logicalFolderId: string;
  entry: EntrySeed;
}

interface UploadFileMicrotask extends BaseMicrotask {
  kind: "upload-file";
  logicalFolderId: string;
  entry: EntrySeed;
  fileToken: string;
}

interface DeletePlacementMicrotask extends BaseMicrotask {
  kind: "delete-placement";
  driveKey: string;
  provider: string;
  email: string;
  itemId: string;
  sizeDelta: number;
}

interface RemoveManifestMicrotask extends BaseMicrotask {
  kind: "remove-manifest";
  logicalFolderId: string;
  entryId: string;
}

interface CopyFileMicrotask extends BaseMicrotask {
  kind: "copy-file";
  logicalFolderId: string;
  sourceEntryId: string;
  entry: EntrySeed;
}

type TaskMicrotask =
  | CreateFolderMicrotask
  | UploadFileMicrotask
  | DeletePlacementMicrotask
  | RemoveManifestMicrotask
  | CopyFileMicrotask;

export interface TaskRecord {
  id: string;
  kind: TaskKind;
  title: string;
  status: TaskStatus;
  createdAt: number;
  updatedAt: number;
  progress: number;
  error?: string;
  microtasks: TaskMicrotask[];
}

interface TasksContextValue {
  tasks: TaskRecord[];
  enqueueUpload: (
    logicalFolderId: string,
    parentId: string | null,
    files: File[],
  ) => void;
  enqueueDelete: (logicalFolderId: string, entryId: string) => void;
  enqueueCopy: (
    logicalFolderId: string,
    entryId: string,
    destinationParentId: string | null,
  ) => void;
  enqueueMove: (
    logicalFolderId: string,
    entryId: string,
    destinationParentId: string | null,
  ) => void;
  retryTask: (taskId: string) => void;
  clearFinishedTasks: () => void;
}

const TasksContext = createContext<TasksContextValue | undefined>(undefined);

function getRelativePath(file: File) {
  return (file as File & { webkitRelativePath?: string }).webkitRelativePath || "";
}

function findEntry(logicalFolder: LogicalFolder, entryId: string) {
  return logicalFolder.items.find((entry) => entry.id === entryId);
}

function listChildEntries(logicalFolder: LogicalFolder, parentId: string | null) {
  return logicalFolder.items.filter((entry) => entry.parentId === parentId);
}

function collectSubtree(logicalFolder: LogicalFolder, entryId: string) {
  const descendants: LogicalEntry[] = [];
  const queue = [entryId];

  while (queue.length > 0) {
    const currentEntryId = queue.shift();
    if (!currentEntryId) {
      continue;
    }

    const entry = findEntry(logicalFolder, currentEntryId);
    if (!entry) {
      continue;
    }

    descendants.push(entry);
    listChildEntries(logicalFolder, entry.id).forEach((child) => queue.push(child.id));
  }

  return descendants;
}

function removeSubtree(logicalFolder: LogicalFolder, entryId: string) {
  const removableIds = new Set(collectSubtree(logicalFolder, entryId).map((entry) => entry.id));
  return logicalFolder.items.filter((entry) => !removableIds.has(entry.id));
}

function uniqueName(
  logicalFolder: LogicalFolder,
  parentId: string | null,
  desiredName: string,
  reservedNames: string[],
) {
  const usedNames = new Set([
    ...listChildEntries(logicalFolder, parentId).map((entry) => entry.name.toLowerCase()),
    ...reservedNames.map((name) => name.toLowerCase()),
  ]);

  if (!usedNames.has(desiredName.toLowerCase())) {
    return desiredName;
  }

  let counter = 1;
  let candidate = `${desiredName} (${counter})`;
  while (usedNames.has(candidate.toLowerCase())) {
    counter += 1;
    candidate = `${desiredName} (${counter})`;
  }

  return candidate;
}

function calculateProgress(microtasks: TaskMicrotask[]) {
  if (microtasks.length === 0) {
    return 100;
  }

  const completedCount = microtasks.filter(
    (microtask) => microtask.status === "completed",
  ).length;
  return Math.round((completedCount / microtasks.length) * 100);
}

function withUpdatedTask(task: TaskRecord, updater: (task: TaskRecord) => TaskRecord) {
  const nextTask = updater(task);
  return {
    ...nextTask,
    updatedAt: Date.now(),
    progress: calculateProgress(nextTask.microtasks),
  };
}

function updateDriveUsage(drive: Drive, delta: number) {
  const usedSpace = Number(drive.drive_details.usedSpace || 0) + delta;
  const totalSpace = Number(drive.drive_details.totalSpace || 0);

  return {
    ...drive,
    drive_details: {
      ...drive.drive_details,
      usedSpace: Math.max(usedSpace, 0),
      freeSpace: totalSpace
        ? Math.max(totalSpace - usedSpace, 0)
        : drive.drive_details.freeSpace,
    },
  } as Drive;
}

export function TasksProvider({ children }: { children: ReactNode }) {
  const { session, updateDrive } = useSession();
  const { logicalFolders, replaceLogicalFolder, getLogicalFolder } =
    useLogicalFolders();
  const [tasks, setTasks] = useState<TaskRecord[]>(() =>
    readLocalStorageJson(STORAGE_KEYS.tasks, [] as TaskRecord[]),
  );
  const runningRef = useRef(false);
  const fileRegistryRef = useRef(new Map<string, File>());
  const sessionRef = useRef(session);
  const logicalFoldersRef = useRef(logicalFolders);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    logicalFoldersRef.current = logicalFolders;
  }, [logicalFolders]);

  useEffect(() => {
    writeLocalStorageJson(STORAGE_KEYS.tasks, tasks);
  }, [tasks]);

  const getDriveByKey = useCallback((driveKey: string) => {
    const allDrives = [
      ...(sessionRef.current.primaryDrive ? [sessionRef.current.primaryDrive] : []),
      ...sessionRef.current.secondaryDrives,
    ];

    return allDrives.find(
      (drive) => createDriveKey(drive.provider, drive.email) === driveKey,
    );
  }, []);

  const chooseUploadDrive = useCallback(
    (logicalFolder: LogicalFolder, fileSize: number) => {
      const candidates = logicalFolder.backends
        .map((backend) => {
          const drive = getDriveByKey(backend.driveKey);
          if (!drive) {
            return null;
          }

          const totalSpace = Number(drive.drive_details.totalSpace || 0);
          const usedSpace = Number(drive.drive_details.usedSpace || 0);
          const limitPercent =
            Number(
              drive.drive_settings.usageLimitPercent ??
                drive.drive_settings.allowed_space_usage_percent ??
                backend.usageLimitPercent,
            ) || 85;

          const effectiveLimit = totalSpace ? (totalSpace * limitPercent) / 100 : 0;
          const available = totalSpace ? Math.max(effectiveLimit - usedSpace, 0) : 0;

          return {
            backend,
            drive,
            available,
          };
        })
        .filter(Boolean) as {
        backend: LogicalFolder["backends"][number];
        drive: Drive;
        available: number;
      }[];

      candidates.sort((left, right) => right.available - left.available);
      return candidates.find((candidate) => candidate.available >= fileSize) || null;
    },
    [getDriveByKey],
  );

  const applyCreateFolder = useCallback(
    async (microtask: CreateFolderMicrotask) => {
      const logicalFolder = logicalFoldersRef.current.find(
        (folder) => folder.id === microtask.logicalFolderId,
      );

      if (!logicalFolder) {
        throw new Error("Logical folder not found");
      }

      const existingEntry = findEntry(logicalFolder, microtask.entry.id);
      const placements = [...(existingEntry?.placements || [])];

      for (const backend of logicalFolder.backends) {
        if (placements.some((placement) => placement.driveKey === backend.driveKey)) {
          continue;
        }

        const drive = getDriveByKey(backend.driveKey);
        if (!drive) {
          throw new Error(`Drive ${backend.email} is not connected`);
        }

        const parentId =
          microtask.entry.parentId === null
            ? backend.rootFolderId
            : findEntry(logicalFolder, microtask.entry.parentId)?.placements.find(
                (placement) => placement.driveKey === backend.driveKey,
              )?.itemId;

        if (!parentId) {
          throw new Error("Unable to determine backend parent folder");
        }

        const createdFolder = await drive.create_folder(microtask.entry.name, parentId);
        placements.push({
          provider: backend.provider,
          email: backend.email,
          driveKey: backend.driveKey,
          itemId: createdFolder.id,
          parentId,
          rootFolderId: backend.rootFolderId,
        });
      }

      replaceLogicalFolder(microtask.logicalFolderId, (folder) => {
        const currentEntry = findEntry(folder, microtask.entry.id);
        const nextEntry: LogicalEntry = {
          id: microtask.entry.id,
          name: microtask.entry.name,
          kind: "folder",
          parentId: microtask.entry.parentId,
          size: 0,
          mimeType: "application/vnd.google-apps.folder",
          createdAt: currentEntry?.createdAt || Date.now(),
          updatedAt: Date.now(),
          placements,
        };

        return {
          ...folder,
          items: currentEntry
            ? folder.items.map((entry) => (entry.id === currentEntry.id ? nextEntry : entry))
            : [...folder.items, nextEntry],
        };
      });
    },
    [getDriveByKey, replaceLogicalFolder],
  );

  const applyUploadFile = useCallback(
    async (microtask: UploadFileMicrotask) => {
      const logicalFolder = logicalFoldersRef.current.find(
        (folder) => folder.id === microtask.logicalFolderId,
      );
      if (!logicalFolder) {
        throw new Error("Logical folder not found");
      }

      const existingEntry = findEntry(logicalFolder, microtask.entry.id);
      if (existingEntry?.placements?.length) {
        return;
      }

      const file = fileRegistryRef.current.get(microtask.fileToken);
      if (!file) {
        throw new Error(
          "The selected upload file is no longer available. Please retry the upload.",
        );
      }

      const selectedDrive = chooseUploadDrive(logicalFolder, file.size);
      if (!selectedDrive) {
        throw new Error("No backend drive has enough usable space for this upload");
      }

      const parentId =
        microtask.entry.parentId === null
          ? selectedDrive.backend.rootFolderId
          : findEntry(logicalFolder, microtask.entry.parentId)?.placements.find(
              (placement) => placement.driveKey === selectedDrive.backend.driveKey,
            )?.itemId;

      if (!parentId) {
        throw new Error("Unable to determine destination folder on the backend drive");
      }

      const uploadedFile = await selectedDrive.drive.upload_file(file, parentId);
      replaceLogicalFolder(microtask.logicalFolderId, (folder) => ({
        ...folder,
        items: [
          ...folder.items,
          {
            id: microtask.entry.id,
            name: microtask.entry.name,
            kind: "file",
            parentId: microtask.entry.parentId,
            size: microtask.entry.size,
            mimeType: microtask.entry.mimeType,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            placements: [
              {
                provider: selectedDrive.backend.provider,
                email: selectedDrive.backend.email,
                driveKey: selectedDrive.backend.driveKey,
                itemId: uploadedFile.id,
                parentId,
                rootFolderId: selectedDrive.backend.rootFolderId,
              },
            ],
          },
        ],
      }));

      updateDrive(updateDriveUsage(selectedDrive.drive, file.size));
    },
    [chooseUploadDrive, replaceLogicalFolder, updateDrive],
  );

  const applyDeletePlacement = useCallback(
    async (microtask: DeletePlacementMicrotask) => {
      const drive = getDriveByKey(microtask.driveKey);
      if (!drive) {
        return;
      }

      await drive.delete_item(microtask.itemId);
      if (microtask.sizeDelta !== 0) {
        updateDrive(updateDriveUsage(drive, -microtask.sizeDelta));
      }
    },
    [getDriveByKey, updateDrive],
  );

  const applyRemoveManifest = useCallback(
    async (microtask: RemoveManifestMicrotask) => {
      replaceLogicalFolder(microtask.logicalFolderId, (folder) => ({
        ...folder,
        items: removeSubtree(folder, microtask.entryId),
      }));
    },
    [replaceLogicalFolder],
  );

  const applyCopyFile = useCallback(
    async (microtask: CopyFileMicrotask) => {
      const logicalFolder = getLogicalFolder(microtask.logicalFolderId);
      if (!logicalFolder) {
        throw new Error("Logical folder not found");
      }

      const sourceEntry = findEntry(logicalFolder, microtask.sourceEntryId);
      if (!sourceEntry || sourceEntry.kind !== "file") {
        throw new Error("Source file is no longer available");
      }

      const sourcePlacement = sourceEntry.placements[0];
      if (!sourcePlacement) {
        throw new Error("Source file placement is missing");
      }

      const drive = getDriveByKey(sourcePlacement.driveKey);
      if (!drive) {
        throw new Error("The source drive is not connected");
      }

      const destinationParentId =
        microtask.entry.parentId === null
          ? logicalFolder.backends.find(
              (backend) => backend.driveKey === sourcePlacement.driveKey,
            )?.rootFolderId
          : findEntry(logicalFolder, microtask.entry.parentId)?.placements.find(
              (placement) => placement.driveKey === sourcePlacement.driveKey,
            )?.itemId;

      if (!destinationParentId) {
        throw new Error("Unable to locate the destination folder on the source drive");
      }

      const copiedFile = await drive.copy_item(
        sourcePlacement.itemId,
        destinationParentId,
        microtask.entry.name,
      );

      replaceLogicalFolder(microtask.logicalFolderId, (folder) => ({
        ...folder,
        items: [
          ...folder.items,
          {
            id: microtask.entry.id,
            name: microtask.entry.name,
            kind: "file",
            parentId: microtask.entry.parentId,
            size: sourceEntry.size,
            mimeType: sourceEntry.mimeType,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            placements: [
              {
                provider: sourcePlacement.provider,
                email: sourcePlacement.email,
                driveKey: sourcePlacement.driveKey,
                itemId: copiedFile.id,
                parentId: destinationParentId,
                rootFolderId: sourcePlacement.rootFolderId,
              },
            ],
          },
        ],
      }));

      updateDrive(updateDriveUsage(drive, sourceEntry.size));
    },
    [getDriveByKey, getLogicalFolder, replaceLogicalFolder, updateDrive],
  );

  const runMicrotask = useCallback(
    async (microtask: TaskMicrotask) => {
      switch (microtask.kind) {
        case "create-folder":
          await applyCreateFolder(microtask);
          return;
        case "upload-file":
          await applyUploadFile(microtask);
          return;
        case "delete-placement":
          await applyDeletePlacement(microtask);
          return;
        case "remove-manifest":
          await applyRemoveManifest(microtask);
          return;
        case "copy-file":
          await applyCopyFile(microtask);
          return;
      }
    },
    [
      applyCopyFile,
      applyCreateFolder,
      applyDeletePlacement,
      applyRemoveManifest,
      applyUploadFile,
    ],
  );

  const runNextTask = useCallback(async () => {
    if (runningRef.current) {
      return;
    }

    const task = tasks.find(
      (candidate) =>
        candidate.status === "queued" || candidate.status === "running",
    );

    if (!task) {
      return;
    }

    runningRef.current = true;

    try {
      setTasks((current) =>
        current.map((candidate) =>
          candidate.id === task.id
            ? withUpdatedTask(candidate, (activeTask) => ({
                ...activeTask,
                status: "running",
              }))
            : candidate,
        ),
      );

      for (const microtask of task.microtasks) {
        if (microtask.status === "completed") {
          continue;
        }

        setTasks((current) =>
          current.map((candidate) =>
            candidate.id === task.id
              ? withUpdatedTask(candidate, (activeTask) => ({
                  ...activeTask,
                  microtasks: activeTask.microtasks.map((activeMicrotask) =>
                    activeMicrotask.id === microtask.id
                      ? {
                          ...activeMicrotask,
                          status: "running",
                          error: undefined,
                        }
                      : activeMicrotask,
                  ),
                }))
              : candidate,
          ),
        );

        try {
          await runMicrotask(microtask);
          setTasks((current) =>
            current.map((candidate) =>
              candidate.id === task.id
                ? withUpdatedTask(candidate, (activeTask) => ({
                    ...activeTask,
                    microtasks: activeTask.microtasks.map((activeMicrotask) =>
                      activeMicrotask.id === microtask.id
                        ? {
                            ...activeMicrotask,
                            status: "completed",
                          }
                        : activeMicrotask,
                    ),
                  }))
                : candidate,
            ),
          );
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Task microtask failed";

          setTasks((current) =>
            current.map((candidate) =>
              candidate.id === task.id
                ? withUpdatedTask(candidate, (activeTask) => ({
                    ...activeTask,
                    status: "failed",
                    error: message,
                    microtasks: activeTask.microtasks.map((activeMicrotask) =>
                      activeMicrotask.id === microtask.id
                        ? {
                            ...activeMicrotask,
                            status: "failed",
                            error: message,
                          }
                        : activeMicrotask,
                    ),
                  }))
                : candidate,
            ),
          );

          runningRef.current = false;
          return;
        }
      }

      setTasks((current) =>
        current.map((candidate) =>
          candidate.id === task.id
            ? withUpdatedTask(candidate, (activeTask) => ({
                ...activeTask,
                status: "completed",
                error: undefined,
              }))
            : candidate,
        ),
      );
    } finally {
      runningRef.current = false;
    }
  }, [runMicrotask, tasks]);

  useEffect(() => {
    void runNextTask();
  }, [runNextTask, tasks]);

  const enqueueTask = useCallback((task: TaskRecord) => {
    setTasks((current) => [task, ...current]);
  }, []);

  const enqueueUpload = useCallback(
    (logicalFolderId: string, parentId: string | null, files: File[]) => {
      const logicalFolder = getLogicalFolder(logicalFolderId);
      if (!logicalFolder || files.length === 0) {
        return;
      }

      const folderIdByPath = new Map<string, string>();
      const reservedNamesByParent = new Map<string, string[]>();
      const microtasks: TaskMicrotask[] = [];

      const getReservedNames = (targetParentId: string | null) => {
        const key = targetParentId || "root";
        if (!reservedNamesByParent.has(key)) {
          reservedNamesByParent.set(key, []);
        }

        return reservedNamesByParent.get(key)!;
      };

      const registerFolderPath = (pathParts: string[]) => {
        let currentParentId = parentId;
        let accumulatedPath = "";

        pathParts.forEach((segment) => {
          accumulatedPath = accumulatedPath
            ? `${accumulatedPath}/${segment}`
            : segment;

          const existingFolderId = folderIdByPath.get(accumulatedPath);
          if (existingFolderId) {
            currentParentId = existingFolderId;
            return;
          }

          const existingFolder = listChildEntries(logicalFolder, currentParentId).find(
            (entry) => entry.kind === "folder" && entry.name === segment,
          );

          if (existingFolder) {
            folderIdByPath.set(accumulatedPath, existingFolder.id);
            currentParentId = existingFolder.id;
            return;
          }

          const reservedNames = getReservedNames(currentParentId);
          const name = uniqueName(logicalFolder, currentParentId, segment, reservedNames);
          reservedNames.push(name);

          const entryId = createId("logical-entry");
          folderIdByPath.set(accumulatedPath, entryId);
          microtasks.push({
            id: createId("microtask"),
            kind: "create-folder",
            status: "queued",
            title: `Create folder ${name}`,
            logicalFolderId,
            entry: {
              id: entryId,
              name,
              kind: "folder",
              parentId: currentParentId,
              size: 0,
              mimeType: "application/vnd.google-apps.folder",
            },
          });

          currentParentId = entryId;
        });

        return currentParentId;
      };

      files.forEach((file) => {
        const relativePath = getRelativePath(file);
        const pathParts = relativePath
          ? relativePath.split("/").filter(Boolean)
          : [file.name];
        const folderParts = pathParts.slice(0, -1);
        const parentFolderId =
          folderParts.length > 0 ? registerFolderPath(folderParts) : parentId;

        const desiredName = pathParts[pathParts.length - 1] || file.name;
        const reservedNames = getReservedNames(parentFolderId || null);
        const name = uniqueName(
          logicalFolder,
          parentFolderId || null,
          desiredName,
          reservedNames,
        );
        reservedNames.push(name);

        const fileToken = createId("upload-file");
        fileRegistryRef.current.set(fileToken, file);
        microtasks.push({
          id: createId("microtask"),
          kind: "upload-file",
          status: "queued",
          title: `Upload ${name}`,
          logicalFolderId,
          fileToken,
          entry: {
            id: createId("logical-entry"),
            name,
            kind: "file",
            parentId: parentFolderId || null,
            size: file.size,
            mimeType: file.type || "application/octet-stream",
          },
        });
      });

      enqueueTask({
        id: createId("task"),
        kind: "upload",
        title: `Upload ${files.length} item${files.length === 1 ? "" : "s"}`,
        status: "queued",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        progress: 0,
        microtasks,
      });
    },
    [enqueueTask, getLogicalFolder],
  );

  const buildDeleteTask = useCallback(
    (logicalFolderId: string, entryId: string) => {
      const logicalFolder = getLogicalFolder(logicalFolderId);
      if (!logicalFolder) {
        return null;
      }

      const subtree = collectSubtree(logicalFolder, entryId).sort((left, right) => {
        const leftDepth = collectSubtree(logicalFolder, left.id).length;
        const rightDepth = collectSubtree(logicalFolder, right.id).length;
        return rightDepth - leftDepth;
      });

      const microtasks: TaskMicrotask[] = [];
      subtree.forEach((entry) => {
        entry.placements.forEach((placement) => {
          microtasks.push({
            id: createId("microtask"),
            kind: "delete-placement",
            status: "queued",
            title: `Delete ${entry.name} from ${placement.email}`,
            driveKey: placement.driveKey,
            provider: placement.provider,
            email: placement.email,
            itemId: placement.itemId,
            sizeDelta: entry.kind === "file" ? entry.size : 0,
          });
        });
      });

      microtasks.push({
        id: createId("microtask"),
        kind: "remove-manifest",
        status: "queued",
        title: "Update logical folder",
        logicalFolderId,
        entryId,
      });

      const sourceEntry = findEntry(logicalFolder, entryId);
      return {
        id: createId("task"),
        kind: "delete" as const,
        title: `Delete ${sourceEntry?.name || "item"}`,
        status: "queued" as const,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        progress: 0,
        microtasks,
      };
    },
    [getLogicalFolder],
  );

  const enqueueDelete = useCallback(
    (logicalFolderId: string, entryId: string) => {
      const task = buildDeleteTask(logicalFolderId, entryId);
      if (task) {
        enqueueTask(task);
      }
    },
    [buildDeleteTask, enqueueTask],
  );

  const buildCopyMicrotasks = useCallback(
    (
      logicalFolder: LogicalFolder,
      entryId: string,
      destinationParentId: string | null,
    ) => {
      const subtree = collectSubtree(logicalFolder, entryId);
      const sourceRoot = findEntry(logicalFolder, entryId);
      if (!sourceRoot) {
        return [] as TaskMicrotask[];
      }

      const idMap = new Map<string, string>();
      const reservedNamesByParent = new Map<string, string[]>();

      const ensureReservedNames = (targetParentId: string | null) => {
        const key = targetParentId || "root";
        if (!reservedNamesByParent.has(key)) {
          reservedNamesByParent.set(key, []);
        }

        return reservedNamesByParent.get(key)!;
      };

      const microtasks: TaskMicrotask[] = [];
      subtree
        .sort((left, right) => (left.kind === right.kind ? 0 : left.kind === "folder" ? -1 : 1))
        .forEach((entry) => {
          const targetParentId =
            entry.id === sourceRoot.id
              ? destinationParentId
              : idMap.get(entry.parentId || "");
          const reservedNames = ensureReservedNames(targetParentId || null);
          const baseName =
            entry.id === sourceRoot.id &&
            targetParentId === sourceRoot.parentId
              ? `${entry.name} copy`
              : entry.name;
          const name = uniqueName(
            logicalFolder,
            targetParentId || null,
            baseName,
            reservedNames,
          );
          reservedNames.push(name);

          const newEntryId = createId("logical-entry");
          idMap.set(entry.id, newEntryId);

          if (entry.kind === "folder") {
            microtasks.push({
              id: createId("microtask"),
              kind: "create-folder",
              status: "queued",
              title: `Create folder ${name}`,
              logicalFolderId: logicalFolder.id,
              entry: {
                id: newEntryId,
                name,
                kind: "folder",
                parentId: targetParentId || null,
                size: 0,
                mimeType: entry.mimeType,
              },
            });
            return;
          }

          microtasks.push({
            id: createId("microtask"),
            kind: "copy-file",
            status: "queued",
            title: `Copy ${entry.name}`,
            logicalFolderId: logicalFolder.id,
            sourceEntryId: entry.id,
            entry: {
              id: newEntryId,
              name,
              kind: "file",
              parentId: targetParentId || null,
              size: entry.size,
              mimeType: entry.mimeType,
            },
          });
        });

      return microtasks;
    },
    [],
  );

  const enqueueCopy = useCallback(
    (
      logicalFolderId: string,
      entryId: string,
      destinationParentId: string | null,
    ) => {
      const logicalFolder = getLogicalFolder(logicalFolderId);
      if (!logicalFolder) {
        return;
      }

      const sourceEntry = findEntry(logicalFolder, entryId);
      if (!sourceEntry) {
        return;
      }

      enqueueTask({
        id: createId("task"),
        kind: "copy",
        title: `Copy ${sourceEntry.name}`,
        status: "queued",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        progress: 0,
        microtasks: buildCopyMicrotasks(logicalFolder, entryId, destinationParentId),
      });
    },
    [buildCopyMicrotasks, enqueueTask, getLogicalFolder],
  );

  const enqueueMove = useCallback(
    (
      logicalFolderId: string,
      entryId: string,
      destinationParentId: string | null,
    ) => {
      const logicalFolder = getLogicalFolder(logicalFolderId);
      if (!logicalFolder) {
        return;
      }

      const sourceEntry = findEntry(logicalFolder, entryId);
      if (!sourceEntry) {
        return;
      }

      const copyMicrotasks = buildCopyMicrotasks(
        logicalFolder,
        entryId,
        destinationParentId,
      );
      const deleteTask = buildDeleteTask(logicalFolderId, entryId);

      enqueueTask({
        id: createId("task"),
        kind: "move",
        title: `Move ${sourceEntry.name}`,
        status: "queued",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        progress: 0,
        microtasks: [...copyMicrotasks, ...(deleteTask?.microtasks || [])],
      });
    },
    [buildCopyMicrotasks, buildDeleteTask, enqueueTask, getLogicalFolder],
  );

  const retryTask = useCallback((taskId: string) => {
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? withUpdatedTask(task, (candidate) => ({
              ...candidate,
              status: "queued",
              error: undefined,
              microtasks: candidate.microtasks.map((microtask) =>
                microtask.status === "failed"
                  ? {
                      ...microtask,
                      status: "queued",
                      error: undefined,
                    }
                  : microtask,
              ),
            }))
          : task,
      ),
    );
  }, []);

  const clearFinishedTasks = useCallback(() => {
    setTasks((current) =>
      current.filter((task) => task.status !== "completed"),
    );
  }, []);

  const value = useMemo<TasksContextValue>(
    () => ({
      tasks,
      enqueueUpload,
      enqueueDelete,
      enqueueCopy,
      enqueueMove,
      retryTask,
      clearFinishedTasks,
    }),
    [
      tasks,
      enqueueUpload,
      enqueueDelete,
      enqueueCopy,
      enqueueMove,
      retryTask,
      clearFinishedTasks,
    ],
  );

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
}

export function useTasks() {
  const context = useContext(TasksContext);
  if (!context) {
    throw new Error("useTasks must be used within TasksProvider");
  }

  return context;
}
