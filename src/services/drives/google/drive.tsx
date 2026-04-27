import type {
  Drive,
  DriveDetails,
  DriveItemMetadata,
  DriveSettings,
  DriveSpan,
  DriveUploadResult,
} from "../types";
import { GoogleDriveIcon } from "../../../components/icons";
import { FetchGoogleAccessToken } from "./auth";
import { fetchGoogleDriveAbout } from "./about";
import {
  copyGoogleDriveItem,
  createGoogleDriveFolder,
  downloadGoogleDriveFileBlob,
  deleteGoogleDriveItem,
  fetchGoogleDriveFileMetadata,
  getOrCreateGoogleDriveFolderInParent,
  listGoogleDriveChildren,
  deleteGoogleAppStorageJson,
  listGoogleLogicalFolders,
  listGoogleSecondaryDrives,
  readGoogleAppStorageJson,
  setGoogleLogicalFolder,
  setGoogleSecondaryDrive,
  uploadGoogleDriveFile,
  writeGoogleAppStorageJson,
} from "./files";
import { GoogleOauthRedirect } from "./oauth";
import GoogleOauthCallback from "./oauth-callback";
import { saveDrive } from "../../storage/drive";
import {
  createDriveRefreshSecretKey,
  getSecret,
  setSecret,
} from "../../../platform/secret-storage";
import { isTauriRuntime } from "../../../platform/runtime";
import {
  backendDriveAbout,
  backendListChildren,
  backendFileMetadata,
  backendCreateFolder,
  backendUploadFile,
  backendDeleteItem,
  backendCopyItem,
  backendDownloadFile,
  backendGetAppdataByName,
  backendSetAppdataByName,
  backendGetSecondaryDrives,
  backendSetSecondaryDrive,
  backendGetLogicalFolders,
  backendSetLogicalFolder,
} from "./client";


export interface GoogleDriveSettings extends DriveSettings {
  usageLimitPercent?: number;
}

export interface GoogleDriveDetails extends DriveDetails {}
export interface GoogleDriveSpan extends DriveSpan {}

const ACCESS_TOKEN_SKEW_MS = 60_000;
const PER_DRIVE_SETTINGS_KEY = "sdrive-per-drive-settings.json";
const LOGICAL_ROOT_CONTAINER_NAME = ".spanneddrive";

export class GoogleDrive implements Drive {
  static provider = "google-drive";
  static provider_label = "Google Drive";
  static provider_icon = GoogleDriveIcon;
  static oauth_callback = GoogleOauthCallback;

  provider = GoogleDrive.provider;
  providerLabel = GoogleDrive.provider_label;
  provider_icon = GoogleDriveIcon;

  email: string;
  refresh_token: string;
  acquired_at: number;
  scope?: string[];
  access_token?: string;
  expires_in?: number;
  user?: {
    name?: string;
    picture?: string;
    sub?: string;
  };
  drive_settings: GoogleDriveSettings;
  drive_details: GoogleDriveDetails;
  drive_span: GoogleDriveSpan;

  static oauth_redirect = (props: {
    accountType: "primary" | "secondary";
    hint?: string;
  }) => {
    GoogleOauthRedirect(props.accountType, props?.hint || "");
  };

  constructor(data: Partial<GoogleDrive>) {
    this.email = data.email || "";
    this.refresh_token = data.refresh_token || "";
    this.acquired_at = data.acquired_at || 0;
    this.scope = data.scope || [];
    this.access_token = data.access_token;
    this.expires_in = data.expires_in;
    this.user = data.user;
    this.drive_settings = data.drive_settings || {
      usageLimitPercent: 85,
      allowed_space_usage_percent: 85,
    };
    this.drive_details = data.drive_details || {
      totalSpace: 0,
      usedSpace: 0,
      freeSpace: 0,
    };
    this.drive_span = data.drive_span || {};
  }

  private hasFreshAccessToken() {
    if (!this.access_token || !this.expires_in || !this.acquired_at) {
      return false;
    }

    const expiry = this.acquired_at + this.expires_in * 1000;
    return expiry - ACCESS_TOKEN_SKEW_MS > Date.now();
  }

  private refreshTokenSecretKey() {
    return createDriveRefreshSecretKey(this.provider, this.email);
  }

  private async resolveRefreshToken() {
    if (this.refresh_token) {
      return this.refresh_token;
    }

    const storedRefreshToken = await getSecret(this.refreshTokenSecretKey());
    if (!storedRefreshToken) {
      return "";
    }

    this.refresh_token = storedRefreshToken;
    return this.refresh_token;
  }

  async fetch_access_token() {
    if (this.hasFreshAccessToken()) {
      return this.access_token || null;
    }

    const refreshToken = await this.resolveRefreshToken();
    if (!refreshToken) {
      throw new Error(
        "Drive credentials are unavailable. Reconnect this drive to continue.",
      );
    }

    const tokenResponse = await FetchGoogleAccessToken(refreshToken);
    this.access_token = tokenResponse.access_token;
    this.expires_in = tokenResponse.expires_in;
    this.acquired_at = Date.now();

    if (tokenResponse.refresh_token && tokenResponse.refresh_token !== this.refresh_token) {
      this.refresh_token = tokenResponse.refresh_token;
      await setSecret(this.refreshTokenSecretKey(), this.refresh_token);
    }

    saveDrive(this);

    return this.access_token || null;
  }

  /** Resolves a fresh access token, throwing if unavailable. */
  private async resolveToken(): Promise<string> {
    const token = await this.fetch_access_token();
    if (!token) {
      throw new Error("Unable to obtain Google access token");
    }
    return token;
  }

  async refresh_drive_details(): Promise<DriveDetails> {
    if (!isTauriRuntime()) {
      const token = await this.resolveToken();
      this.drive_details = await backendDriveAbout(token);
      saveDrive(this);
      return this.drive_details;
    }
    this.drive_details = await fetchGoogleDriveAbout(this);
    saveDrive(this);
    return this.drive_details;
  }

  async get_item_metadata(itemId: string): Promise<DriveItemMetadata> {
    if (!isTauriRuntime()) {
      const token = await this.resolveToken();
      return backendFileMetadata(token, itemId);
    }
    return fetchGoogleDriveFileMetadata(this, itemId);
  }

  async create_folder(name: string, parentId: string): Promise<DriveItemMetadata> {
    if (!isTauriRuntime()) {
      const token = await this.resolveToken();
      return backendCreateFolder(token, name, parentId);
    }
    return createGoogleDriveFolder(this, name, parentId);
  }

  async upload_file(file: File, parentId: string): Promise<DriveUploadResult> {
    if (!isTauriRuntime()) {
      const token = await this.resolveToken();
      return backendUploadFile(token, file, parentId);
    }
    return uploadGoogleDriveFile(this, file, parentId);
  }

  async list_children(
    parentId: string,
    options?: { pageToken?: string; pageSize?: number },
  ) {
    if (!isTauriRuntime()) {
      const token = await this.resolveToken();
      return backendListChildren(token, parentId, options);
    }
    return listGoogleDriveChildren(this, parentId, options);
  }

  async delete_item(itemId: string) {
    if (!isTauriRuntime()) {
      const token = await this.resolveToken();
      await backendDeleteItem(token, itemId);
      return;
    }
    await deleteGoogleDriveItem(this, itemId);
  }

  async copy_item(itemId: string, parentId: string, name?: string) {
    if (!isTauriRuntime()) {
      const token = await this.resolveToken();
      return backendCopyItem(token, itemId, parentId, name);
    }
    return copyGoogleDriveItem(this, itemId, parentId, name);
  }

  async download_file(itemId: string) {
    if (!isTauriRuntime()) {
      const token = await this.resolveToken();
      return backendDownloadFile(token, itemId);
    }
    return downloadGoogleDriveFileBlob(this, itemId);
  }

  async read_drive_settings() {
    return this.read_app_storage_json<DriveSettings | null>(
      PER_DRIVE_SETTINGS_KEY,
    );
  }

  async write_drive_settings(settings: DriveSettings) {
    await this.write_app_storage_json(PER_DRIVE_SETTINGS_KEY, settings);
  }

  async read_app_storage_json<T>(key: string): Promise<T | null> {
    if (!isTauriRuntime()) {
      const token = await this.resolveToken();
      const raw = await backendGetAppdataByName(token, key);
      if (raw === null) return null;
      try {
        return JSON.parse(raw) as T;
      } catch {
        return null;
      }
    }
    return readGoogleAppStorageJson<T>(this, key);
  }

  async write_app_storage_json<T>(key: string, value: T): Promise<void> {
    if (!isTauriRuntime()) {
      const token = await this.resolveToken();
      await backendSetAppdataByName(token, key, JSON.stringify(value));
      return;
    }
    await writeGoogleAppStorageJson(this, key, value);
  }

  async delete_app_storage_json(key: string): Promise<void> {
    // Routes through the Google Drive API directly (works in both browser and
    // Tauri runtimes as long as an access token can be obtained). There is no
    // backend proxy endpoint for deleting appData files, so we issue the
    // DELETE call client-side. Best-effort: callers should treat failures as
    // non-fatal (e.g. lock-file cleanup).
    await deleteGoogleAppStorageJson(this, key);
  }

  async list_known_secondary_accounts() {
    if (!isTauriRuntime()) {
      const token = await this.resolveToken();
      const remote = await backendGetSecondaryDrives(token);
      return remote.map(({ provider, email }) => ({ provider, email }));
    }
    const direct = await listGoogleSecondaryDrives(this);
    return direct.map(({ provider, email }) => ({ provider, email }));
  }

  async register_known_secondary_account(account: {
    provider: string;
    email: string;
  }) {
    if (!isTauriRuntime()) {
      const token = await this.resolveToken();
      await backendSetSecondaryDrive(token, account.email, account.provider);
      return;
    }
    await setGoogleSecondaryDrive(this, account.provider, account.email);
  }

  async list_logical_folder_registry() {
    if (!isTauriRuntime()) {
      const token = await this.resolveToken();
      return backendGetLogicalFolders(token);
    }
    return listGoogleLogicalFolders(this);
  }

  async register_logical_folder(folder_name: string, drives: string[][]) {
    if (!isTauriRuntime()) {
      const token = await this.resolveToken();
      await backendSetLogicalFolder(token, folder_name, drives);
      return;
    }
    await setGoogleLogicalFolder(this, folder_name, drives);
  }

  /**
   * Logical-folder roots are nested inside a hidden `.spanneddrive/` container
   * so they don't clutter the user's drive root.
   */
  async resolve_logical_root_parent(): Promise<string> {
    const container = await getOrCreateGoogleDriveFolderInParent(
      this,
      "root",
      LOGICAL_ROOT_CONTAINER_NAME,
    );
    return container.id;
  }
}

export default GoogleDrive;

