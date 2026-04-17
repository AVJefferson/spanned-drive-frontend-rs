import type {
  Drive,
  DriveDetails,
  DriveItemMetadata,
  DriveSettings,
  DriveSpan,
  DriveUploadResult,
} from "../Drive";
import { FetchGoogleAccessToken } from "../../services/google/google-auth";
import { fetchGoogleDriveAbout } from "../../services/google/google-drive-about";
import {
  copyGoogleDriveItem,
  createGoogleDriveFolder,
  deleteGoogleDriveItem,
  fetchGoogleDriveFileMetadata,
  listGoogleDriveChildren,
  readGoogleAppStorageJson,
  uploadGoogleDriveFile,
  writeGoogleAppStorageJson,
} from "../../services/google/google-drive-files";
import { GoogleOauthRedirect } from "../../services/google/google-oauth-signin";
import { SaveDrive } from "../../services/browser/save-drive";
import {
  createDriveRefreshSecretKey,
  getSecret,
  setSecret,
} from "../../services/security/secret-storage";
import type { JSX } from "react";

export interface GoogleDriveSettings extends DriveSettings {
  usageLimitPercent?: number;
}

export interface GoogleDriveDetails extends DriveDetails {}
export interface GoogleDriveSpan extends DriveSpan {}

const ACCESS_TOKEN_SKEW_MS = 60_000;
const PER_DRIVE_SETTINGS_KEY = "sdrive-per-drive-settings.json";

function GoogleIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export class GoogleDrive implements Drive {
  static provider = "google-drive";
  static provider_label = "Google Drive";

  provider = GoogleDrive.provider;
  providerLabel = GoogleDrive.provider_label;
  provider_icon = () => <GoogleIcon />;

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

    SaveDrive(this);

    return this.access_token || null;
  }

  async refresh_drive_details(): Promise<DriveDetails> {
    this.drive_details = await fetchGoogleDriveAbout(this);
    SaveDrive(this);
    return this.drive_details;
  }

  async get_item_metadata(itemId: string): Promise<DriveItemMetadata> {
    return fetchGoogleDriveFileMetadata(this, itemId);
  }

  async create_folder(name: string, parentId: string): Promise<DriveItemMetadata> {
    return createGoogleDriveFolder(this, name, parentId);
  }

  async upload_file(file: File, parentId: string): Promise<DriveUploadResult> {
    return uploadGoogleDriveFile(this, file, parentId);
  }

  async list_children(
    parentId: string,
    options?: { pageToken?: string; pageSize?: number },
  ) {
    return listGoogleDriveChildren(this, parentId, options);
  }

  async delete_item(itemId: string) {
    await deleteGoogleDriveItem(this, itemId);
  }

  async copy_item(itemId: string, parentId: string, name?: string) {
    return copyGoogleDriveItem(this, itemId, parentId, name);
  }

  async read_drive_settings() {
    return readGoogleAppStorageJson<DriveSettings | null>(
      this,
      PER_DRIVE_SETTINGS_KEY,
    );
  }

  async write_drive_settings(settings: DriveSettings) {
    await writeGoogleAppStorageJson(this, PER_DRIVE_SETTINGS_KEY, settings);
  }

  async read_app_storage_json<T>(key: string): Promise<T | null> {
    return readGoogleAppStorageJson<T>(this, key);
  }

  async write_app_storage_json<T>(key: string, value: T): Promise<void> {
    await writeGoogleAppStorageJson(this, key, value);
  }
}

export default GoogleDrive;
