import { Drive, DriveDetails, DriveSettings, DriveSpan } from "../Drive";
import { FetchGoogleAccessToken } from "../../services/google/google-auth";

export interface GoogleDriveSettings extends DriveSettings {}
export interface GoogleDriveDetails extends DriveDetails {}
export interface GoogleDriveSpan extends DriveSpan {}

export class GoogleDrive implements Drive {
  provider: string = "google-drive";
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

    this.drive_details = data.drive_details || {};

    this.drive_span = data.drive_span || {};

    Object.assign(this, data);
  }
}

export default GoogleDrive;
