import {
  STORAGE_KEYS,
  readLocalStorageJson,
  writeLocalStorageJson,
} from "../storage/storage";
import type { TaskCheckpoint, TaskCheckpointMicrotask } from "./types";

function readCheckpoints() {
  return readLocalStorageJson<Record<string, TaskCheckpoint>>(
    STORAGE_KEYS.taskCheckpoints,
    {},
  );
}

function writeCheckpoints(checkpoints: Record<string, TaskCheckpoint>) {
  writeLocalStorageJson(STORAGE_KEYS.taskCheckpoints, checkpoints);
}

export function saveTaskCheckpoint(checkpoint: TaskCheckpoint) {
  const current = readCheckpoints();
  current[checkpoint.taskId] = {
    ...checkpoint,
    updatedAt: Date.now(),
  };
  writeCheckpoints(current);
}

export function removeTaskCheckpoint(taskId: string) {
  const current = readCheckpoints();
  if (!current[taskId]) {
    return;
  }
  delete current[taskId];
  writeCheckpoints(current);
}

export function listTaskCheckpoints() {
  return Object.values(readCheckpoints());
}

export function updateTaskCheckpointMicrotask(
  taskId: string,
  microtaskId: string,
  patch: Partial<TaskCheckpointMicrotask>,
) {
  const current = readCheckpoints();
  const existing = current[taskId];
  if (!existing) {
    return;
  }

  current[taskId] = {
    ...existing,
    updatedAt: Date.now(),
    microtasks: existing.microtasks.map((microtask) =>
      microtask.id === microtaskId ? { ...microtask, ...patch } : microtask,
    ),
  };
  writeCheckpoints(current);
}
