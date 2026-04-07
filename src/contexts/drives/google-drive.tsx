import { Drive, DriveSettings } from "../Drive.tsx";
import { FetchGoogleAccessToken } from "../../services/google/googleAuth.ts";

export interface GoogleDriveSettings extends DriveSettings {}

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

  drive_settings: GoogleDriveSettings;

  fetch_access_token = async () => {
    if (!this.refresh_token) return;
    return await FetchGoogleAccessToken(this.refresh_token);
  };

  constructor(data: Partial<GoogleDrive>) {
    this.email = data.email || "";

    this.refresh_token = data.refresh_token || "";
    this.acquired_at = data.acquired_at || Date.now();

    this.drive_settings = data.drive_settings || {
      allowed_space_usage_percent: 80,
    };

    Object.assign(this, data);
  }
}

export default GoogleDrive;
