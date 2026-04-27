import type { Drive } from "../drives/types";
import type {
  LogicalDriveListingSettings,
  LogicalDrivePackingSettings,
  LogicalEntry,
  LogicalFolder,
} from "../../contexts/FoldersContext";

export interface DriveCandidate {
  backendId: string;
  driveKey: string;
  drive: Drive;
  limitPercent: number;
  totalSpace: number;
  usedSpace: number;
  effectiveLimitBytes: number;
  availableBytes: number;
}

export interface FileUploadPlanItem {
  fileToken: string;
  fileName: string;
  size: number;
  mimeType?: string;
  parentId: string | null;
}

export interface PlannedPlacement {
  fileToken: string;
  backendId: string;
  driveKey: string;
  bytes: number;
  chunkIndex?: number;
  chunkCount?: number;
}

export interface UploadPlan {
  placements: PlannedPlacement[];
}

export interface QuotaReservation {
  driveKey: string;
  bytes: number;
  release: () => void;
}

export interface TaskCheckpointMicrotask {
  id: string;
  kind: string;
  status: "queued" | "running" | "completed" | "failed";
  error?: string;
}

export interface TaskCheckpoint {
  taskId: string;
  kind: string;
  resumability: "machine-bound" | "local-only";
  createdAt: number;
  updatedAt: number;
  microtasks: TaskCheckpointMicrotask[];
}

export interface ListingQuery {
  logicalFolder: LogicalFolder;
  parentId: string | null;
  pageToken?: string;
  pageSize?: number;
  settings: LogicalDriveListingSettings;
}

export interface ListingResultEntry extends LogicalEntry {
  extension?: string;
  corrupted?: boolean;
  duplicateCandidate?: boolean;
}

export interface ListingResultPage {
  entries: ListingResultEntry[];
  nextPageToken?: string;
  sourceDriveKey: string;
}

export interface ListingFetchResult {
  pages: ListingResultPage[];
  mergedEntries: ListingResultEntry[];
  hasMore: boolean;
}

export interface PackingContext {
  logicalFolder: LogicalFolder;
  settings: LogicalDrivePackingSettings;
  candidates: DriveCandidate[];
}
