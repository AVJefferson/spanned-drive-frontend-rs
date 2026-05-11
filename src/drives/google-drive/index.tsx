import { Drive, OauthCallbackParams, OauthCallbackResult } from "..";
import { GoogleOauthCallback, GoogleOauthRedirect } from "./oauth";
import { googleDriveIcon } from "./icons";
import drive from "./drive";
import logicalFolder from "./logical-folder";
import { getAccessToken } from "./auth";

export class GoogleDrive implements Drive {
  static provider = "google-drive";
  provider = GoogleDrive.provider;

  static providerLabel = "Google Drive";
  providerLabel = GoogleDrive.providerLabel;

  static redirectUri = `${import.meta.env.VITE_REDIRECT_URI}/${GoogleDrive.provider}`;
  redirectUri = GoogleDrive.redirectUri;

  static providerIcon = googleDriveIcon;
  providerIcon = GoogleDrive.providerIcon;

  static oauthRedirect: (
    accountType: "primary" | "secondary",
    hint?: string,
  ) => void = GoogleOauthRedirect;
  oauthRedirect = GoogleOauthRedirect;

  static oauthCallback: (
    params: OauthCallbackParams,
  ) => Promise<OauthCallbackResult> = GoogleOauthCallback;
  oauthCallback = GoogleOauthCallback;

  email: string;

  refreshToken: string;
  refreshTime: number;

  accessToken?: string | undefined;
  accessTokenExpiry?: number | undefined;
  getAccessToken: (this: GoogleDrive, expires_in?: number) => Promise<string> =
    getAccessToken;

  logicalFolder = logicalFolder;
  drive = drive;

  constructor(data: Record<string, unknown>) {
    this.email = data.email as string;

    this.refreshToken = data.refreshToken as string;
    this.refreshTime = (data.refreshTime as number) || Date.now();
  }
}

export default GoogleDrive;
