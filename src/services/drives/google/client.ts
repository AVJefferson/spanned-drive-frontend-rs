/**
 * google-backend-client.ts
 *
 * Typed wrappers around the spanned-drive backend Google Drive proxy routes.
 * All calls include the backend auth token.  Used in browser (non-Tauri) mode
 * so that CORS-blocked Google API calls are transparently forwarded via the
 * backend.
 */

import type {
  DriveDetails,
  DriveItemMetadata,
  DriveListChildrenResponse,
  DriveUploadResult,
} from "../types";

const backendUrl = import.meta.env.VITE_SDRIVE_BACKEND_URL as string;
const backendAuthToken = import.meta.env
  .VITE_SDRIVE_BACKEND_AUTH_TOKEN as string;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildBackendHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (backendAuthToken) {
    headers["Authorization"] = `Bearer ${backendAuthToken}`;
  }
  return headers;
}

async function backendPost<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${backendUrl}${path}`, {
    method: "POST",
    headers: buildBackendHeaders(),
    body: JSON.stringify(body),
  });

  const json = (await response.json().catch(() => null)) as T;

  if (!response.ok) {
    throw new Error(
      `Backend request to ${path} failed with ${response.status}: ${JSON.stringify(json)}`,
    );
  }

  return json;
}

/** Maps raw drive-item JSON from the backend to `DriveItemMetadata`. */
function mapItem(raw: Record<string, unknown>): DriveItemMetadata {
  return {
    id: String(raw.id || ""),
    name: String(raw.name || ""),
    mimeType: String(raw.mimeType || "application/octet-stream"),
    size: raw.size != null ? Number(raw.size) : undefined,
    parents: Array.isArray(raw.parents)
      ? (raw.parents.filter(Boolean) as string[])
      : [],
    modifiedTime: raw.modifiedTime != null ? String(raw.modifiedTime) : undefined,
    webViewLink: raw.webViewLink != null ? String(raw.webViewLink) : undefined,
    webContentLink:
      raw.webContentLink != null ? String(raw.webContentLink) : undefined,
    thumbnailLink:
      raw.thumbnailLink != null ? String(raw.thumbnailLink) : undefined,
    isFolder: Boolean(raw.isFolder),
  };
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

export interface BackendProfile {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  picture: string;
}

export async function backendFetchProfile(
  access_token: string,
): Promise<BackendProfile> {
  return backendPost<BackendProfile>("/profile/google", { access_token });
}

// ---------------------------------------------------------------------------
// Drive metadata
// ---------------------------------------------------------------------------

export async function backendDriveAbout(
  access_token: string,
): Promise<DriveDetails> {
  return backendPost<DriveDetails>("/drive/google-drive/drive_about", {
    access_token,
  });
}

export async function backendListChildren(
  access_token: string,
  parent_id: string,
  _options?: { pageToken?: string; pageSize?: number },
): Promise<DriveListChildrenResponse> {
  // The backend returns a flat array of items (no pagination yet).
  const raw = await backendPost<Record<string, unknown>[]>(
    "/drive/google-drive/list_children",
    { access_token, parent_id },
  );

  const items = Array.isArray(raw) ? raw.map(mapItem) : [];
  return { items };
}

export async function backendFileMetadata(
  access_token: string,
  file_id: string,
): Promise<DriveItemMetadata> {
  const raw = await backendPost<Record<string, unknown>>(
    "/drive/google-drive/file_metadata",
    { access_token, file_id },
  );
  return mapItem(raw);
}

export async function backendCreateFolder(
  access_token: string,
  name: string,
  parent_id: string,
): Promise<DriveItemMetadata> {
  const raw = await backendPost<Record<string, unknown>>(
    "/drive/google-drive/create_folder",
    { access_token, name, parent_id },
  );
  return mapItem(raw);
}

/** Upload uses multipart/form-data so the binary file data is passed correctly. */
export async function backendUploadFile(
  access_token: string,
  file: File,
  parent_id: string,
): Promise<DriveUploadResult> {
  const formData = new FormData();
  formData.append("access_token", access_token);
  formData.append("parent_id", parent_id);
  formData.append("file", file);

  // Do NOT set Content-Type; the browser sets it with the correct boundary.
  const headers: Record<string, string> = {};
  if (backendAuthToken) {
    headers["Authorization"] = `Bearer ${backendAuthToken}`;
  }

  const response = await fetch(`${backendUrl}/drive/google-drive/upload_file`, {
    method: "POST",
    headers,
    body: formData,
  });

  const json = (await response.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;

  if (!response.ok) {
    throw new Error(
      `Backend upload_file failed with ${response.status}: ${JSON.stringify(json)}`,
    );
  }

  return mapItem(json!);
}

export async function backendDeleteItem(
  access_token: string,
  file_id: string,
): Promise<void> {
  await backendPost<boolean>("/drive/google-drive/delete_item", {
    access_token,
    file_id,
  });
}

export async function backendCopyItem(
  access_token: string,
  file_id: string,
  parent_id: string,
  name?: string,
): Promise<DriveItemMetadata> {
  const raw = await backendPost<Record<string, unknown>>(
    "/drive/google-drive/copy_item",
    { access_token, file_id, parent_id, ...(name != null ? { name } : {}) },
  );
  return mapItem(raw);
}

/** Download a Drive file; returns a Blob (binary data streamed from backend). */
export async function backendDownloadFile(
  access_token: string,
  file_id: string,
): Promise<Blob> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (backendAuthToken) {
    headers["Authorization"] = `Bearer ${backendAuthToken}`;
  }

  const response = await fetch(`${backendUrl}/drive/google-drive/download_file`, {
    method: "POST",
    headers,
    body: JSON.stringify({ access_token, file_id }),
  });

  if (!response.ok) {
    throw new Error(`Backend download_file failed with ${response.status}`);
  }

  return response.blob();
}

// ---------------------------------------------------------------------------
// AppData (state files) — browser routing
// ---------------------------------------------------------------------------

export async function backendGetAppdataByName(
  access_token: string,
  file_name: string,
): Promise<string | null> {
  return backendPost<string | null>(
    "/drive/google-drive/get_appdata_file_by_name",
    { access_token, file_name },
  );
}

export async function backendSetAppdataByName(
  access_token: string,
  file_name: string,
  content: string,
): Promise<boolean> {
  return backendPost<boolean>(
    "/drive/google-drive/set_appdata_file_by_name",
    { access_token, file_name, content },
  );
}

// ---------------------------------------------------------------------------
// Logical folders
// ---------------------------------------------------------------------------

export interface BackendLogicalFolder {
  file_id: string;
  name: string;
  drives: string[][];
}

export async function backendGetLogicalFolders(
  access_token: string,
): Promise<BackendLogicalFolder[]> {
  return backendPost<BackendLogicalFolder[]>(
    "/drive/google-drive/get_logical_folders",
    { access_token },
  );
}

export async function backendSetLogicalFolder(
  access_token: string,
  new_logical_folder_name: string,
  drives: string[][],
): Promise<boolean> {
  return backendPost<boolean>("/drive/google-drive/set_logical_folder", {
    access_token,
    new_logical_folder_name,
    drives,
  });
}

// ---------------------------------------------------------------------------
// Secondary drives
// ---------------------------------------------------------------------------

export interface BackendSecondaryDrive {
  file_id: string;
  provider: string;
  email: string;
}

export async function backendGetSecondaryDrives(
  access_token: string,
): Promise<BackendSecondaryDrive[]> {
  return backendPost<BackendSecondaryDrive[]>(
    "/drive/google-drive/get_secondary_drives",
    { access_token },
  );
}

export async function backendSetSecondaryDrive(
  access_token: string,
  new_secondary_drive_email: string,
  drive_provider: string,
): Promise<boolean> {
  return backendPost<boolean>("/drive/google-drive/set_secondary_drive", {
    access_token,
    new_secondary_drive_email,
    drive_provider,
  });
}

// ---------------------------------------------------------------------------
// Primary marker
// ---------------------------------------------------------------------------

export async function backendGetPrimaryFileId(
  access_token: string,
): Promise<string | null> {
  return backendPost<string | null>("/drive/google-drive/get_primary_file_id", {
    access_token,
  });
}

export async function backendSetAsPrimary(
  access_token: string,
): Promise<boolean> {
  return backendPost<boolean>("/drive/google-drive/set_as_primary", {
    access_token,
  });
}
