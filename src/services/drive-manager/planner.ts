import type { LogicalFolder } from "../../contexts/LogicalFolderTypes";
import { buildDriveCandidates } from "./quota-guard";
import { planPacking } from "./packing";
import type { FileUploadPlanItem, UploadPlan } from "./types";
import type { Drive } from "../../contexts/Drive";
import { createId } from "../../utils/ids";
import { planPackingInWorker } from "./worker-client";

function getRelativePath(file: File) {
  return (file as File & { webkitRelativePath?: string }).webkitRelativePath || "";
}

function parentPathFromRelativePath(relativePath: string) {
  const parts = relativePath.split("/").filter(Boolean);
  if (parts.length <= 1) {
    return "";
  }
  return parts.slice(0, -1).join("/");
}

export function toUploadPlanItems(
  files: File[],
  parentId: string | null,
): FileUploadPlanItem[] {
  return files
    .map((file) => {
      const relativePath = getRelativePath(file);
      return {
        fileToken: createId("upload-file"),
        fileName: file.name,
        size: file.size,
        mimeType: file.type || "application/octet-stream",
        parentId,
        relativePath,
      };
    })
    .sort((left, right) => {
      // Keep folder boundaries clustered before splitting file content.
      const leftParent = parentPathFromRelativePath(left.relativePath);
      const rightParent = parentPathFromRelativePath(right.relativePath);
      if (leftParent === rightParent) {
        return left.fileName.localeCompare(right.fileName);
      }
      return leftParent.localeCompare(rightParent);
    })
    .map((item) => ({
      fileToken: item.fileToken,
      fileName: item.fileName,
      size: item.size,
      mimeType: item.mimeType,
      parentId: item.parentId,
    }));
}

export function planUploadPlacements({
  logicalFolder,
  files,
  parentId,
  getDriveByKey,
}: {
  logicalFolder: LogicalFolder;
  files: File[];
  parentId: string | null;
  getDriveByKey: (driveKey: string) => Drive | undefined;
}): { plan: UploadPlan; fileTokenByName: Map<string, string> } {
  const items = toUploadPlanItems(files, parentId);
  const candidates = buildDriveCandidates(logicalFolder, getDriveByKey);
  const plan = planPacking(
    {
      logicalFolder,
      settings: logicalFolder.packing!,
      candidates,
    },
    items,
  );

  const fileTokenByName = new Map(items.map((item) => [item.fileName, item.fileToken]));
  return {
    plan,
    fileTokenByName,
  };
}

export async function planUploadPlacementsInWorker({
  logicalFolder,
  files,
  parentId,
  getDriveByKey,
}: {
  logicalFolder: LogicalFolder;
  files: File[];
  parentId: string | null;
  getDriveByKey: (driveKey: string) => Drive | undefined;
}): Promise<UploadPlan> {
  const items = toUploadPlanItems(files, parentId);
  const candidates = buildDriveCandidates(logicalFolder, getDriveByKey);
  return planPackingInWorker(
    {
      logicalFolder,
      settings: logicalFolder.packing!,
      candidates,
    },
    items,
  );
}
