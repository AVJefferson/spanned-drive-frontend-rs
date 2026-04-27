import type { Drive, DriveDetails } from "../types";

import { googleDriveFetch } from "./http";

const GOOGLE_DRIVE_API = "https://www.googleapis.com/drive/v3";

async function authorizedRequest<T>(
  drive: Drive,
  path: string,
  init?: RequestInit,
) {
  const accessToken = await drive.fetch_access_token();
  const response = await googleDriveFetch(`${GOOGLE_DRIVE_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init?.headers || {}),
    },
  });

  const json = (await response.json().catch(() => ({}))) as T;

  if (!response.ok) {
    throw new Error(
      `Google Drive request failed with ${response.status}: ${JSON.stringify(json)}`,
    );
  }

  return json;
}

export async function fetchGoogleDriveAbout(
  drive: Drive,
): Promise<DriveDetails> {
  const about = await authorizedRequest<{
    storageQuota?: {
      limit?: string;
      usage?: string;
      usageInDrive?: string;
      usageInDriveTrash?: string;
    };
  }>(
    drive,
    "/about?fields=storageQuota",
  );

  const totalSpace = Number(about.storageQuota?.limit || 0);
  const usedSpace = Number(
    about.storageQuota?.usageInDrive || about.storageQuota?.usage || 0,
  );

  return {
    totalSpace,
    usedSpace,
    freeSpace: Math.max(totalSpace - usedSpace, 0),
    appDataUsage: Number(about.storageQuota?.usageInDriveTrash || 0),
    lastSyncedAt: Date.now(),
  };
}
