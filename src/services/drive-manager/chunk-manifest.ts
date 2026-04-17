import type { Drive } from "../../contexts/Drive";

const CHUNK_MANIFEST_FILE = ".sdrive-chunks.json";

export interface ChunkManifestItem {
  logicalPath: string;
  fileName: string;
  chunkCount: number;
  chunks: Array<{
    index: number;
    driveKey: string;
    itemId: string;
    bytes: number;
  }>;
  updatedAt: number;
}

interface ChunkManifestEnvelope {
  version: 1;
  updatedAt: number;
  items: ChunkManifestItem[];
}

const EMPTY_MANIFEST: ChunkManifestEnvelope = {
  version: 1,
  updatedAt: 0,
  items: [],
};

export async function readChunkManifest(
  drive: Drive,
): Promise<ChunkManifestEnvelope> {
  const existing =
    (await drive.read_app_storage_json<ChunkManifestEnvelope>(CHUNK_MANIFEST_FILE)) ||
    EMPTY_MANIFEST;
  return {
    version: 1,
    updatedAt: Number(existing.updatedAt || 0),
    items: Array.isArray(existing.items) ? existing.items : [],
  };
}

export async function upsertChunkManifestItem(
  drive: Drive,
  item: ChunkManifestItem,
) {
  const current = await readChunkManifest(drive);
  const nextItems = current.items.filter(
    (existing) =>
      !(
        existing.logicalPath === item.logicalPath &&
        existing.fileName === item.fileName
      ),
  );
  nextItems.push(item);
  await drive.write_app_storage_json(CHUNK_MANIFEST_FILE, {
    version: 1,
    updatedAt: Date.now(),
    items: nextItems,
  } satisfies ChunkManifestEnvelope);
}
