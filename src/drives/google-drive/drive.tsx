import GoogleDrive from ".";
import { DriveSnapshot } from "..";
import tauriInvokeWithSdriveBackendFallback from "./client";

export async function setAsPrimary(this: GoogleDrive): Promise<boolean> {
  const accessToken = await this.getAccessToken?.();
  if (!accessToken) throw new Error("No access token");

  try {
    return await tauriInvokeWithSdriveBackendFallback<boolean>(
      "set_as_primary",
      { access_token: accessToken },
      `/drive/${GoogleDrive.provider}/set_as_primary`,
    );
  } catch {
    console.error("Error setting as primary");
    return false;
  }
}

export async function getSecondaryDrives(
  this: GoogleDrive,
): Promise<DriveSnapshot[]> {
  const accessToken = await this.getAccessToken?.();
  if (!accessToken) throw new Error("No access token");

  try {
    return await tauriInvokeWithSdriveBackendFallback<DriveSnapshot[]>(
      "get_secondary_drives",
      { access_token: accessToken },
      `/drive/${GoogleDrive.provider}/get_secondary_drives`,
    );
  } catch {
    console.error("Error getting secondary drives");
    return [];
  }
}

export async function createSecondaryDrive(
  this: GoogleDrive,
  secondaryDrive: DriveSnapshot,
): Promise<boolean> {
  const accessToken = await this.getAccessToken?.();
  if (!accessToken) throw new Error("No access token");

  try {
    return await tauriInvokeWithSdriveBackendFallback<boolean>(
      "create_secondary_drive",
      { access_token: accessToken, secondary_drive: secondaryDrive },
      `/drive/${GoogleDrive.provider}/create_secondary_drive`,
    );
  } catch {
    console.error("Error creating secondary drive");
    return false;
  }
}

const drive = {
  setAsPrimary,
  getSecondaryDrives,
  createSecondaryDrive,
};
export default drive;
