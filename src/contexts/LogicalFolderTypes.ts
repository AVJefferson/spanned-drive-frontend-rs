import type { DriveReference } from "./Drive";

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
  createdAt: number;
  updatedAt: number;
  placements: LogicalPlacement[];
}

export interface LogicalFolderBackend extends DriveReference {
  driveKey: string;
  rootFolderId: string;
  usageLimitPercent: number;
}

export interface LogicalFolder {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  backends: LogicalFolderBackend[];
  items: LogicalEntry[];
}
