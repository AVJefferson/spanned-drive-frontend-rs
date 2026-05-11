import GoogleDrive from ".";
import tauriInvokeWithSdriveBackendFallback from "./client";

export async function getLogicalFolders(this: GoogleDrive): Promise<string[]> {
  const accessToken = await this.getAccessToken?.();
  if (!accessToken) throw new Error("No access token");

  try {
    return await tauriInvokeWithSdriveBackendFallback<string[]>(
      "get_logical_folders",
      { access_token: accessToken },
      `/drive/${GoogleDrive.provider}/get_logical_folders`,
    );
  } catch {
    console.error("Error getting logical folders");
    return [];
  }
}

export async function createLogicalFolder(
  this: GoogleDrive,
  name: string,
): Promise<string> {
  const accessToken = await this.getAccessToken?.();
  if (!accessToken) throw new Error("No access token");

  try {
    return await tauriInvokeWithSdriveBackendFallback<string>(
      "create_logical_folder",
      { access_token: accessToken, name },
      `/drive/${GoogleDrive.provider}/set_logical_folder`,
    );
  } catch {
    console.error("Error creating logical folder");
    return "";
  }
}

export async function deleteLogicalFolder(
  this: GoogleDrive,
  id: string,
): Promise<void> {
  const accessToken = await this.getAccessToken?.();
  if (!accessToken) throw new Error("No access token");

  try {
    await tauriInvokeWithSdriveBackendFallback<string>(
      "delete_logical_folder",
      { access_token: accessToken, id },
      `/drive/${GoogleDrive.provider}/set_logical_folder`,
    );
  } catch {
    console.error("Error deleting logical folder");
    return;
  }
}

export async function renameLogicalFolder(
  this: GoogleDrive,
  id: string,
  name: string,
): Promise<void> {
  const accessToken = await this.getAccessToken?.();
  if (!accessToken) throw new Error("No access token");

  try {
    await tauriInvokeWithSdriveBackendFallback<string>(
      "rename_logical_folder",
      { access_token: accessToken, id, name },
      `/drive/${GoogleDrive.provider}/set_logical_folder`,
    );
  } catch {
    console.error("Error renaming logical folder");
    return;
  }
}

const logicalFolder = {
  getLogicalFolders,
  createLogicalFolder,
  deleteLogicalFolder,
  renameLogicalFolder,
};
export default logicalFolder;
