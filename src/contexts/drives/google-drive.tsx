import { Drive, DriveSettings } from "../Drive";
import { FetchGoogleAccessToken } from "../../services/google/google-auth";

export interface GoogleDriveSettings extends DriveSettings {
  config_file_version?: string;
  config_file_id?: string;

  upload_settings: (forced: boolean) => Promise<any>;
  download_settings: (forced: boolean) => Promise<any>;
  sync_settings: (forced: boolean) => Promise<any>;
}

export class GoogleDriveConfig implements DriveSettings {
  config_file_version: string = "1.0.0";
  allowed_space_usage_percent: number = 80;

  upload_settings = async (forced: boolean = false) => {
    //mutex the file and then upload then remove mutex
  };

  constructor(data: Partial<GoogleDriveSettings>) {
    Object.assign(this, data);
  }
}

export class GoogleDrive implements Drive {
  provider: string = "google-drive";
  email: string;

  isPrimary?: boolean;
  isSecondary?: boolean;

  parent_drive?: string;
  associated_drives?: string[];

  refresh_token: string;
  acquired_at: number;
  scope?: string;

  access_token?: string;
  expires_in?: number;

  total_space?: number;
  used_space?: number;

  user?: {
    name?: string;
    picture?: string;
    sub?: string;
  };

  drive_settings: GoogleDriveConfig;

  fetch_access_token = async () => {
    if (!this.refresh_token) return;
    return await FetchGoogleAccessToken(this.refresh_token);
  };

  constructor(data: Partial<GoogleDrive>) {
    this.email = data.email || "";

    this.refresh_token = data.refresh_token || "";
    this.acquired_at = data.acquired_at || Date.now();

    this.drive_settings =
      data.drive_settings ||
      new GoogleDriveConfig({
        allowed_space_usage_percent: 80,
      });

    Object.assign(this, data);
  }
}

export default GoogleDrive;
