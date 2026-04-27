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
