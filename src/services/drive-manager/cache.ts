import type { ListingResultPage } from "./types";

interface ListingCacheValue {
  writtenAt: number;
  ttlMs: number;
  page: ListingResultPage;
}

const memoryCache = new Map<string, ListingCacheValue>();
const DEFAULT_TTL_MS = 30_000;

function toCacheKey(parts: {
  logicalFolderId: string;
  parentId: string | null;
  backendDriveKey: string;
  pageToken?: string;
}) {
  return [
    parts.logicalFolderId,
    parts.parentId || "root",
    parts.backendDriveKey,
    parts.pageToken || "first",
  ].join("::");
}

export function writeListingCache(
  keyParts: {
    logicalFolderId: string;
    parentId: string | null;
    backendDriveKey: string;
    pageToken?: string;
  },
  page: ListingResultPage,
  ttlMs = DEFAULT_TTL_MS,
) {
  memoryCache.set(toCacheKey(keyParts), {
    writtenAt: Date.now(),
    ttlMs,
    page,
  });
}

export function readListingCache(keyParts: {
  logicalFolderId: string;
  parentId: string | null;
  backendDriveKey: string;
  pageToken?: string;
}) {
  const value = memoryCache.get(toCacheKey(keyParts));
  if (!value) {
    return null;
  }
  if (Date.now() - value.writtenAt > value.ttlMs) {
    memoryCache.delete(toCacheKey(keyParts));
    return null;
  }
  return value.page;
}

export function invalidateListingCacheForParent(
  logicalFolderId: string,
  parentId: string | null,
) {
  const prefix = `${logicalFolderId}::${parentId || "root"}::`;
  Array.from(memoryCache.keys()).forEach((key) => {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
    }
  });
}
