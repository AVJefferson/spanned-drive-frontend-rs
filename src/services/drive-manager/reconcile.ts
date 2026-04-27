import type { LogicalEntry } from "../../contexts/FoldersContext";
import type { ListingResultEntry } from "./types";

export interface ChunkManifestRef {
  path: string;
  chunkCount: number;
  chunkIndex: number;
  driveKey: string;
}

export function mergeEntriesByPath(
  entries: ListingResultEntry[],
  chunkRefs: ChunkManifestRef[],
): ListingResultEntry[] {
  const chunkRefByPath = new Map<string, ChunkManifestRef[]>();
  chunkRefs.forEach((chunkRef) => {
    const current = chunkRefByPath.get(chunkRef.path) || [];
    current.push(chunkRef);
    chunkRefByPath.set(chunkRef.path, current);
  });

  const grouped = new Map<string, ListingResultEntry[]>();
  entries.forEach((entry) => {
    const key = `${entry.parentId || "root"}::${entry.name}::${entry.kind}`;
    const current = grouped.get(key) || [];
    current.push(entry);
    grouped.set(key, current);
  });

  const merged: ListingResultEntry[] = [];
  grouped.forEach((group, key) => {
    const chunkRefsForPath = chunkRefByPath.get(key) || [];
    if (chunkRefsForPath.length === 0) {
      group.forEach((entry) =>
        merged.push({
          ...entry,
          duplicateCandidate: group.length > 1,
        }),
      );
      return;
    }

    const expectedCount = Math.max(...chunkRefsForPath.map((item) => item.chunkCount));
    const actualCount = chunkRefsForPath.length;
    if (actualCount >= expectedCount) {
      merged.push({
        ...group[0],
        duplicateCandidate: false,
        corrupted: false,
      });
      return;
    }

    merged.push({
      ...group[0],
      duplicateCandidate: false,
      corrupted: true,
    });
  });

  return merged;
}

export function classifyRemoteDeletion(
  _previousEntry: LogicalEntry,
  currentChunkCount: number,
  expectedChunkCount: number,
) {
  if (expectedChunkCount <= 1 && currentChunkCount === 0) {
    return "deleted-complete";
  }
  if (expectedChunkCount > 1 && currentChunkCount < expectedChunkCount) {
    return "corrupted";
  }
  return "healthy";
}
