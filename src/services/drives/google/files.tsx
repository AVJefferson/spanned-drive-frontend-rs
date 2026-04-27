import type {
  Drive,
  DriveListChildrenResponse,
  DriveItemMetadata,
  DriveUploadResult,
} from "../types";

import { googleDriveFetch } from "./http";

const GOOGLE_DRIVE_API = "https://www.googleapis.com/drive/v3";
const GOOGLE_UPLOAD_API = "https://www.googleapis.com/upload/drive/v3/files";
const FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";

function buildMultipartBody(metadata: Record<string, unknown>, data: Blob) {
  const boundary = `sdrive-${crypto.randomUUID()}`;
  const delimiter = `--${boundary}`;
  const closeDelimiter = `--${boundary}--`;
  const body = new Blob([
    `${delimiter}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`,
    `${delimiter}\r\nContent-Type: ${data.type || "application/octet-stream"}\r\n\r\n`,
    data,
    `\r\n${closeDelimiter}`,
  ]);

  return {
    body,
    contentType: `multipart/related; boundary=${boundary}`,
  };
}

async function authorizedFetch<T>(
  drive: Drive,
  url: string,
  init?: RequestInit,
): Promise<T> {
  const accessToken = await drive.fetch_access_token();
  const response = await googleDriveFetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init?.headers || {}),
    },
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const json = (await response.json().catch(() => ({}))) as T;

  if (!response.ok) {
    throw new Error(
      `Google Drive request failed with ${response.status}: ${JSON.stringify(json)}`,
    );
  }

  return json;
}

function mapDriveItem(item: Record<string, unknown>): DriveItemMetadata {
  return {
    id: String(item.id || ""),
    name: String(item.name || ""),
    mimeType: String(item.mimeType || "application/octet-stream"),
    size: item.size ? Number(item.size) : undefined,
    parents: Array.isArray(item.parents)
      ? (item.parents.filter(Boolean) as string[])
      : [],
    modifiedTime: item.modifiedTime ? String(item.modifiedTime) : undefined,
    webViewLink: item.webViewLink ? String(item.webViewLink) : undefined,
    webContentLink: item.webContentLink
      ? String(item.webContentLink)
      : undefined,
    thumbnailLink: item.thumbnailLink ? String(item.thumbnailLink) : undefined,
    isFolder: item.mimeType === FOLDER_MIME_TYPE,
  };
}

export async function listGoogleDriveChildren(
  drive: Drive,
  parentId: string,
  options?: { pageToken?: string; pageSize?: number },
): Promise<DriveListChildrenResponse> {
  const query = encodeURIComponent(
    `'${parentId}' in parents and trashed = false`,
  );

  const response = await authorizedFetch<{
    files?: Record<string, unknown>[];
    nextPageToken?: string;
  }>(
    drive,
    `${GOOGLE_DRIVE_API}/files?q=${query}&fields=${encodeURIComponent(
      "nextPageToken,files(id,name,mimeType,size,parents,modifiedTime,webViewLink,webContentLink,thumbnailLink)",
    )}&orderBy=folder,name_natural&pageSize=${Math.max(
      1,
      Math.min(options?.pageSize || 100, 1000),
    )}${options?.pageToken ? `&pageToken=${encodeURIComponent(options.pageToken)}` : ""}`,
  );

  return {
    items: (response.files || []).map(mapDriveItem),
    nextPageToken: response.nextPageToken,
  };
}

export async function fetchGoogleDriveFileMetadata(
  drive: Drive,
  fileId: string,
): Promise<DriveItemMetadata> {
  const fields = encodeURIComponent(
    "id,name,mimeType,size,parents,modifiedTime,webViewLink,webContentLink,thumbnailLink",
  );
  const item = await authorizedFetch<Record<string, unknown>>(
    drive,
    `${GOOGLE_DRIVE_API}/files/${encodeURIComponent(fileId)}?fields=${fields}`,
  );

  return mapDriveItem(item);
}

export async function createGoogleDriveFolder(
  drive: Drive,
  name: string,
  parentId: string,
): Promise<DriveItemMetadata> {
  const item = await authorizedFetch<Record<string, unknown>>(
    drive,
    `${GOOGLE_DRIVE_API}/files`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        mimeType: FOLDER_MIME_TYPE,
        parents: [parentId],
      }),
    },
  );

  return mapDriveItem(item);
}

export async function getOrCreateGoogleDriveFolderInParent(
  drive: Drive,
  parentId: string,
  name: string,
): Promise<DriveItemMetadata> {
  const existingFolderPage = await listGoogleDriveChildren(drive, parentId);
  const existingFolders = existingFolderPage.items.filter(
    (entry) => entry.isFolder && entry.name === name,
  );

  if (existingFolders.length > 0) {
    return existingFolders.sort((left, right) =>
      left.id.localeCompare(right.id),
    )[0];
  }

  return createGoogleDriveFolder(drive, name, parentId);
}

export async function uploadGoogleDriveFile(
  drive: Drive,
  file: File,
  parentId: string,
): Promise<DriveUploadResult> {
  const { body, contentType } = buildMultipartBody(
    {
      name: file.name,
      parents: [parentId],
    },
    file,
  );

  const item = await authorizedFetch<Record<string, unknown>>(
    drive,
    `${GOOGLE_UPLOAD_API}?uploadType=multipart`,
    {
      method: "POST",
      headers: {
        "Content-Type": contentType,
      },
      body,
    },
  );

  return mapDriveItem(item);
}

export async function deleteGoogleDriveItem(drive: Drive, fileId: string) {
  await authorizedFetch<void>(
    drive,
    `${GOOGLE_DRIVE_API}/files/${encodeURIComponent(fileId)}`,
    {
      method: "DELETE",
    },
  );
}

export async function copyGoogleDriveItem(
  drive: Drive,
  fileId: string,
  parentId: string,
  name?: string,
): Promise<DriveItemMetadata> {
  const item = await authorizedFetch<Record<string, unknown>>(
    drive,
    `${GOOGLE_DRIVE_API}/files/${encodeURIComponent(fileId)}/copy`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...(name ? { name } : {}),
        parents: [parentId],
      }),
    },
  );

  return mapDriveItem(item);
}

export async function downloadGoogleDriveFileBlob(
  drive: Drive,
  fileId: string,
): Promise<Blob> {
  const accessToken = await drive.fetch_access_token();
  const response = await googleDriveFetch(
    `${GOOGLE_DRIVE_API}/files/${encodeURIComponent(fileId)}?alt=media`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to download file ${fileId}`);
  }

  return response.blob();
}

type AppStorageFileEntry = { id: string; name: string; modifiedTime?: string };

async function findGoogleAppStorageFile(
  drive: Drive,
  key: string,
): Promise<{ canonical: AppStorageFileEntry | null; duplicates: AppStorageFileEntry[] }> {
  const query = encodeURIComponent(
    `name = '${key.replace(/'/g, "\\'")}'  and trashed = false`,
  );
  const fields = encodeURIComponent("files(id,name,modifiedTime)");
  const response = await authorizedFetch<{
    files?: AppStorageFileEntry[];
  }>(
    drive,
    `${GOOGLE_DRIVE_API}/files?spaces=appDataFolder&q=${query}&fields=${fields}&orderBy=modifiedTime+desc`,
  );

  const [canonical = null, ...duplicates] = response.files || [];
  return { canonical, duplicates };
}

export async function readGoogleAppStorageJson<T>(
  drive: Drive,
  key: string,
): Promise<T | null> {
  const { canonical: file } = await findGoogleAppStorageFile(drive, key);
  if (!file?.id) {
    return null;
  }

  const accessToken = await drive.fetch_access_token();
  const response = await googleDriveFetch(
    `${GOOGLE_DRIVE_API}/files/${encodeURIComponent(file.id)}?alt=media`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to read app storage file ${key}`);
  }

  return (await response.json()) as T;
}

export async function writeGoogleAppStorageJson<T>(
  drive: Drive,
  key: string,
  value: T,
) {
  const { canonical: existingFile, duplicates } = await findGoogleAppStorageFile(drive, key);
  const payload = new Blob([JSON.stringify(value, null, 2)], {
    type: "application/json",
  });
  const { body, contentType } = buildMultipartBody(
    existingFile
      ? {}
      : {
          name: key,
          parents: ["appDataFolder"],
        },
    payload,
  );

  const method = existingFile ? "PATCH" : "POST";
  const url = existingFile
    ? `${GOOGLE_UPLOAD_API}/${encodeURIComponent(existingFile.id)}?uploadType=multipart`
    : `${GOOGLE_UPLOAD_API}?uploadType=multipart`;

  await authorizedFetch<Record<string, unknown>>(drive, url, {
    method,
    headers: {
      "Content-Type": contentType,
    },
    body,
  });

  // Silently delete any duplicate appData files (Tauri-only; best-effort).
  for (const dup of duplicates) {
    void authorizedFetch<void>(
      drive,
      `${GOOGLE_DRIVE_API}/files/${encodeURIComponent(dup.id)}`,
      { method: "DELETE" },
    ).catch(() => {});
  }
}

export async function deleteGoogleAppStorageJson(
  drive: Drive,
  key: string,
): Promise<void> {
  const { canonical, duplicates } = await findGoogleAppStorageFile(drive, key);
  const targets = [canonical, ...duplicates].filter(
    (entry): entry is AppStorageFileEntry => Boolean(entry?.id),
  );

  await Promise.all(
    targets.map((entry) =>
      authorizedFetch<void>(
        drive,
        `${GOOGLE_DRIVE_API}/files/${encodeURIComponent(entry.id)}`,
        { method: "DELETE" },
      ).catch(() => {}),
    ),
  );
}

// ---------------------------------------------------------------------------
// Dedicated registries (mirror of backend appdata.rs filename scheme)
//
// These helpers replicate the Rust backend's secondary-drive / logical-folder
// appData storage so Tauri-runtime drives can talk to the same registry the
// browser-runtime backend produces. Filename encodings MUST stay byte-for-byte
// compatible with `external_systems/google/helpers.rs`.
// ---------------------------------------------------------------------------

const SECONDARY_DRIVE_PREFIX = "sdrive---secondary-drive---";
const LOGICAL_FOLDER_PREFIX = "sdrive---logical-folder---";

function encodeEmailForFilename(email: string): string {
  return email.replace(/@/g, "__at__").replace(/\./g, "__dot__");
}

function decodeEmailFromFilename(encoded: string): string {
  return encoded.replace(/__at__/g, "@").replace(/__dot__/g, ".");
}

function encodeDriveNameForFilename(name: string): string {
  return name
    .replace(/@/g, "__at__")
    .replace(/\./g, "__dot__")
    .replace(/\//g, "__slash__")
    .replace(/\\/g, "__backslash__")
    .replace(/ /g, "__space__");
}

function decodeDriveNameFromFilename(encoded: string): string {
  return encoded
    .replace(/__at__/g, "@")
    .replace(/__dot__/g, ".")
    .replace(/__slash__/g, "/")
    .replace(/__backslash__/g, "\\")
    .replace(/__space__/g, " ");
}

function secondaryDriveFilename(
  primaryEmailEncoded: string,
  provider: string,
  secondaryEmailEncoded: string,
): string {
  return `${SECONDARY_DRIVE_PREFIX}${primaryEmailEncoded}---${provider}---${secondaryEmailEncoded}.json`;
}

function logicalFolderFilename(
  primaryEmailEncoded: string,
  folderNameEncoded: string,
): string {
  return `${LOGICAL_FOLDER_PREFIX}${primaryEmailEncoded}---${folderNameEncoded}.json`;
}

async function listAppDataFilesByQuery(
  drive: Drive,
  query: string,
): Promise<AppStorageFileEntry[]> {
  const fields = encodeURIComponent("files(id,name,modifiedTime)");
  const response = await authorizedFetch<{ files?: AppStorageFileEntry[] }>(
    drive,
    `${GOOGLE_DRIVE_API}/files?spaces=appDataFolder&q=${encodeURIComponent(query)}&fields=${fields}`,
  );
  return response.files || [];
}

export interface GoogleSecondaryDriveEntry {
  file_id: string;
  provider: string;
  email: string;
}

export async function listGoogleSecondaryDrives(
  drive: Drive,
): Promise<GoogleSecondaryDriveEntry[]> {
  const primaryEnc = encodeEmailForFilename(drive.email);
  const files = await listAppDataFilesByQuery(
    drive,
    `name contains '${SECONDARY_DRIVE_PREFIX}${primaryEnc}---'`,
  );

  const results: GoogleSecondaryDriveEntry[] = [];
  for (const file of files) {
    if (!file?.id || !file.name) continue;
    const stripped = file.name
      .replace(SECONDARY_DRIVE_PREFIX, "")
      .replace(`${primaryEnc}---`, "")
      .replace(/\.json$/, "");
    const sepIndex = stripped.indexOf("---");
    if (sepIndex <= 0) continue;
    const provider = stripped.slice(0, sepIndex);
    const emailEnc = stripped.slice(sepIndex + 3);
    if (!provider || !emailEnc) continue;
    results.push({
      file_id: file.id,
      provider,
      email: decodeEmailFromFilename(emailEnc),
    });
  }
  return results;
}

export async function setGoogleSecondaryDrive(
  drive: Drive,
  provider: string,
  secondaryEmail: string,
): Promise<void> {
  const primaryEnc = encodeEmailForFilename(drive.email);
  const fileName = secondaryDriveFilename(
    primaryEnc,
    provider,
    encodeEmailForFilename(secondaryEmail),
  );

  const { canonical } = await findGoogleAppStorageFile(drive, fileName);
  if (canonical) {
    return; // No-op-if-exists, matching backend behavior.
  }

  await writeGoogleAppStorageJson(drive, fileName, { new_file: true });
}

export interface GoogleLogicalFolderEntry {
  file_id: string;
  name: string;
  drives: string[][];
}

export async function listGoogleLogicalFolders(
  drive: Drive,
): Promise<GoogleLogicalFolderEntry[]> {
  const primaryEnc = encodeEmailForFilename(drive.email);
  const files = await listAppDataFilesByQuery(
    drive,
    `name contains '${LOGICAL_FOLDER_PREFIX}${primaryEnc}---'`,
  );

  const results: GoogleLogicalFolderEntry[] = [];
  for (const file of files) {
    if (!file?.id || !file.name) continue;
    const stripped = file.name
      .replace(LOGICAL_FOLDER_PREFIX, "")
      .replace(`${primaryEnc}---`, "")
      .replace(/\.json$/, "");
    const folderName = decodeDriveNameFromFilename(stripped);

    let drives: string[][] = [];
    try {
      const accessToken = await drive.fetch_access_token();
      const response = await googleDriveFetch(
        `${GOOGLE_DRIVE_API}/files/${encodeURIComponent(file.id)}?alt=media`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (response.ok) {
        const json = (await response.json()) as { drives?: unknown };
        if (Array.isArray(json?.drives)) {
          drives = json.drives.filter(
            (entry): entry is string[] => Array.isArray(entry),
          );
        }
      }
    } catch {
      // Best-effort; leave `drives` empty if read fails.
    }

    results.push({ file_id: file.id, name: folderName, drives });
  }
  return results;
}

export async function setGoogleLogicalFolder(
  drive: Drive,
  folderName: string,
  drives: string[][],
): Promise<void> {
  const primaryEnc = encodeEmailForFilename(drive.email);
  const fileName = logicalFolderFilename(
    primaryEnc,
    encodeDriveNameForFilename(folderName),
  );

  const { canonical } = await findGoogleAppStorageFile(drive, fileName);
  if (canonical) {
    return; // No-op-if-exists, matching backend behavior.
  }

  await writeGoogleAppStorageJson(drive, fileName, {
    new_file: true,
    drives,
  });
}
