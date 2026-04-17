import type { DriveReference } from "./Drive";

export type LogicalDrivePackingMode =
  | "container"
  | "form"
  | "water-vertical"
  | "water-horizontal";

export type LogicalDriveStatus = "active" | "partially_deleted";

export type ListingMergeMode = "combined" | "drive-priority";
export type ListingSortKey = "name" | "size" | "extension";
export type ListingSortDirection = "asc" | "desc";

export interface LogicalDriveListingSettings {
  mergeMode: ListingMergeMode;
  sortBy: ListingSortKey;
  sortDirection: ListingSortDirection;
}

export interface LogicalDrivePackingSettings {
  mode: LogicalDrivePackingMode;
  chunkSizeBytes: number;
  drivePriority: string[];
}

export interface LogicalPlacement extends DriveReference {
  driveKey: string;
  itemId: string;
  parentId?: string;
  rootFolderId: string;
}

export interface LogicalEntry {
  id: string;
  name: string;
  kind: "file" | "folder";
  parentId: string | null;
  size: number;
  mimeType?: string;
  extension?: string;
  corrupted?: boolean;
  duplicateCandidate?: boolean;
  createdAt: number;
  updatedAt: number;
  placements: LogicalPlacement[];
}

export interface LogicalFolderBackend extends DriveReference {
  backendId: string;
  driveKey: string;
  rootFolderId: string;
  usageLimitPercent: number;
}

export interface LogicalFolder {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  status?: LogicalDriveStatus;
  backends: LogicalFolderBackend[];
  packing?: LogicalDrivePackingSettings;
  listing?: LogicalDriveListingSettings;
  items: LogicalEntry[];
}

export const DEFAULT_CHUNK_SIZE_BYTES = 200 * 1024 * 1024;
export const MIN_CHUNK_SIZE_BYTES = 100 * 1024 * 1024;
export const MAX_CHUNK_SIZE_BYTES = 1024 * 1024 * 1024;

export function createDefaultPackingSettings(
  drivePriority: string[],
): LogicalDrivePackingSettings {
  return {
    mode: "container",
    chunkSizeBytes: DEFAULT_CHUNK_SIZE_BYTES,
    drivePriority,
  };
}

export function createDefaultListingSettings(): LogicalDriveListingSettings {
  return {
    mergeMode: "combined",
    sortBy: "name",
    sortDirection: "asc",
  };
}
