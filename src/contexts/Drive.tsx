export interface DriveSettings {
  allowed_space_usage_percent?: number;
}
export interface Drive {
  provider: string;
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

  drive_settings?: DriveSettings;

  fetch_access_token: () => Promise<any>;
}

import { GoogleDrive } from "./drives/google-drive";

export const Drives: { [key: string]: any } = {
  "google-drive": GoogleDrive,
};
