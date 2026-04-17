import type { Drive } from "../../contexts/Drive";
import type { LogicalFolder } from "../../contexts/LogicalFolderTypes";
import { readListingCache, writeListingCache } from "./cache";
import { mergeEntriesByPath } from "./reconcile";
import type {
  ListingFetchResult,
  ListingResultEntry,
  ListingResultPage,
  ListingQuery,
} from "./types";
import { createId } from "../../utils/ids";

function sortEntries(
  entries: ListingResultEntry[],
  settings: LogicalFolder["listing"],
) {
  const sortBy = settings?.sortBy || "name";
  const sortDirection = settings?.sortDirection || "asc";
  const factor = sortDirection === "asc" ? 1 : -1;

  return [...entries].sort((left, right) => {
    if (sortBy === "size") {
      const delta = (left.size || 0) - (right.size || 0);
      if (delta !== 0) {
        return delta * factor;
      }
    } else if (sortBy === "extension") {
      const leftExt = left.extension || "";
      const rightExt = right.extension || "";
      const extDelta = leftExt.localeCompare(rightExt);
      if (extDelta !== 0) {
        return extDelta * factor;
      }
    }

    return left.name.localeCompare(right.name) * factor;
  });
}

function toListingEntry(
  parentId: string | null,
  driveKey: string,
  provider: string,
  email: string,
  rootFolderId: string,
  item: Awaited<ReturnType<Drive["list_children"]>>["items"][number],
): ListingResultEntry {
  const extension = item.name.includes(".")
    ? item.name.split(".").slice(-1)[0].toLowerCase()
    : "";
  return {
    id: createId("listing-entry"),
    name: item.name,
    kind: item.isFolder ? "folder" : "file",
    parentId,
    size: Number(item.size || 0),
    mimeType: item.mimeType,
    createdAt: Date.now(),
    updatedAt: item.modifiedTime ? Date.parse(item.modifiedTime) : Date.now(),
    extension,
    placements: [
      {
        driveKey,
        provider,
        email,
        itemId: item.id,
        rootFolderId,
      },
    ],
  };
}

async function fetchBackendPage({
  logicalFolderId,
  parentId,
  drive,
  backend,
  pageToken,
  pageSize,
}: {
  logicalFolderId: string;
  parentId: string | null;
  drive: Drive;
  backend: LogicalFolder["backends"][number];
  pageToken?: string;
  pageSize?: number;
}): Promise<ListingResultPage> {
  const cached = readListingCache({
    logicalFolderId,
    parentId,
    backendDriveKey: backend.driveKey,
    pageToken,
  });
  if (cached) {
    return cached;
  }

  const response = await drive.list_children(
    parentId ? parentId : backend.rootFolderId,
    { pageToken, pageSize },
  );

  const page: ListingResultPage = {
    sourceDriveKey: backend.driveKey,
    nextPageToken: response.nextPageToken,
    entries: response.items.map((item) =>
      toListingEntry(
        parentId,
        backend.driveKey,
        backend.provider,
        backend.email,
        backend.rootFolderId,
        item,
      ),
    ),
  };

  writeListingCache(
    {
      logicalFolderId,
      parentId,
      backendDriveKey: backend.driveKey,
      pageToken,
    },
    page,
  );
  return page;
}

export async function fetchLogicalFolderListing({
  logicalFolder,
  parentId,
  settings,
  pageToken,
  pageSize,
  getDriveByKey,
}: ListingQuery & { getDriveByKey: (driveKey: string) => Drive | undefined }): Promise<ListingFetchResult> {
  const backends =
    settings.mergeMode === "drive-priority"
      ? [...logicalFolder.backends].sort((left, right) =>
          (logicalFolder.packing?.drivePriority || []).indexOf(left.driveKey) -
          (logicalFolder.packing?.drivePriority || []).indexOf(right.driveKey),
        )
      : logicalFolder.backends;

  const pages: ListingResultPage[] = [];
  for (const backend of backends) {
    const drive = getDriveByKey(backend.driveKey);
    if (!drive) {
      continue;
    }
    // For drive-priority view, backend pages are fetched in order and concatenated.
    const page = await fetchBackendPage({
      logicalFolderId: logicalFolder.id,
      parentId,
      drive,
      backend,
      pageToken,
      pageSize,
    });
    pages.push(page);
    if (settings.mergeMode === "drive-priority") {
      break;
    }
  }

  const flattened = pages.flatMap((page) => page.entries);
  const mergedEntries = sortEntries(mergeEntriesByPath(flattened, []), settings);
  const hasMore = pages.some((page) => Boolean(page.nextPageToken));

  return {
    pages,
    mergedEntries,
    hasMore,
  };
}
