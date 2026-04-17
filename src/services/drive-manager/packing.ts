import type { FileUploadPlanItem, PackingContext, UploadPlan } from "./types";

function rankCandidatesByPriority(context: PackingContext) {
  const priority = context.settings.drivePriority || [];
  const byDriveKey = new Map(
    context.candidates.map((candidate) => [candidate.driveKey, candidate]),
  );

  const prioritized = priority
    .map((driveKey) => byDriveKey.get(driveKey))
    .filter(Boolean) as typeof context.candidates;
  const fallback = context.candidates.filter(
    (candidate) => !priority.includes(candidate.driveKey),
  );

  return [...prioritized, ...fallback];
}

function planContainerPacking(
  context: PackingContext,
  items: FileUploadPlanItem[],
): UploadPlan {
  const placements: UploadPlan["placements"] = [];
  const ranked = [...context.candidates].sort(
    (left, right) => right.availableBytes - left.availableBytes,
  );

  for (const item of items) {
    const fit = ranked.find((candidate) => candidate.availableBytes >= item.size);
    if (!fit) {
      throw new Error(`No backend has enough space for ${item.fileName}`);
    }
    placements.push({
      fileToken: item.fileToken,
      backendId: fit.backendId,
      driveKey: fit.driveKey,
      bytes: item.size,
    });
  }

  return { placements };
}

function planFormPacking(context: PackingContext, items: FileUploadPlanItem[]): UploadPlan {
  const placements: UploadPlan["placements"] = [];
  const ranked = rankCandidatesByPriority(context);

  for (const item of items) {
    const fit = ranked.find((candidate) => candidate.availableBytes >= item.size);
    if (!fit) {
      throw new Error(`No backend has enough space for ${item.fileName}`);
    }
    placements.push({
      fileToken: item.fileToken,
      backendId: fit.backendId,
      driveKey: fit.driveKey,
      bytes: item.size,
    });
  }

  return { placements };
}

function planWaterVertical(context: PackingContext, items: FileUploadPlanItem[]): UploadPlan {
  const placements: UploadPlan["placements"] = [];
  const chunkSize = context.settings.chunkSizeBytes;
  const ranked = rankCandidatesByPriority(context);

  for (const item of items) {
    if (item.size <= chunkSize) {
      const fit = ranked.find((candidate) => candidate.availableBytes >= item.size);
      if (!fit) {
        throw new Error(`No backend has enough space for ${item.fileName}`);
      }
      placements.push({
        fileToken: item.fileToken,
        backendId: fit.backendId,
        driveKey: fit.driveKey,
        bytes: item.size,
      });
      continue;
    }

    const chunkCount = Math.ceil(item.size / chunkSize);
    let remaining = item.size;
    for (let chunkIndex = 0; chunkIndex < chunkCount; chunkIndex += 1) {
      const chunkBytes = Math.min(chunkSize, remaining);
      const fit = ranked.find((candidate) => candidate.availableBytes >= chunkBytes);
      if (!fit) {
        throw new Error(
          `No backend has enough space for chunk ${chunkIndex + 1} of ${item.fileName}`,
        );
      }
      placements.push({
        fileToken: item.fileToken,
        backendId: fit.backendId,
        driveKey: fit.driveKey,
        bytes: chunkBytes,
        chunkIndex,
        chunkCount,
      });
      remaining -= chunkBytes;
    }
  }

  return { placements };
}

function planWaterHorizontal(
  context: PackingContext,
  items: FileUploadPlanItem[],
): UploadPlan {
  const placements: UploadPlan["placements"] = [];
  const chunkSize = context.settings.chunkSizeBytes;
  const ranked = rankCandidatesByPriority(context);
  if (ranked.length === 0) {
    throw new Error("No backend drives are available");
  }

  for (const item of items) {
    if (item.size <= chunkSize) {
      const fit = ranked.find((candidate) => candidate.availableBytes >= item.size);
      if (!fit) {
        throw new Error(`No backend has enough space for ${item.fileName}`);
      }
      placements.push({
        fileToken: item.fileToken,
        backendId: fit.backendId,
        driveKey: fit.driveKey,
        bytes: item.size,
      });
      continue;
    }

    const chunkCount = Math.ceil(item.size / chunkSize);
    let remaining = item.size;
    for (let chunkIndex = 0; chunkIndex < chunkCount; chunkIndex += 1) {
      const chunkBytes = Math.min(chunkSize, remaining);
      const candidate = ranked[chunkIndex % ranked.length];
      if (candidate.availableBytes < chunkBytes) {
        throw new Error(
          `No backend has enough space for chunk ${chunkIndex + 1} of ${item.fileName}`,
        );
      }
      placements.push({
        fileToken: item.fileToken,
        backendId: candidate.backendId,
        driveKey: candidate.driveKey,
        bytes: chunkBytes,
        chunkIndex,
        chunkCount,
      });
      remaining -= chunkBytes;
    }
  }

  return { placements };
}

export function planPacking(context: PackingContext, items: FileUploadPlanItem[]): UploadPlan {
  switch (context.settings.mode) {
    case "container":
      return planContainerPacking(context, items);
    case "form":
      return planFormPacking(context, items);
    case "water-vertical":
      return planWaterVertical(context, items);
    case "water-horizontal":
      return planWaterHorizontal(context, items);
    default:
      return planContainerPacking(context, items);
  }
}
