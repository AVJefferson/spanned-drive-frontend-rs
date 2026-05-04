import { Drive, JSX, OauthCallbackParams } from "..";
import { GoogleOauthCallback, GoogleOauthRedirect } from "./oauth";
import { googleDriveIcon } from "./icons";

export class GoogleDrive implements Drive {
  static provider = "google-drive";
  provider = GoogleDrive.provider;

  static providerLabel = "Google Drive";
  providerLabel = GoogleDrive.providerLabel;

  static providerIcon = googleDriveIcon;
  providerIcon = GoogleDrive.providerIcon;

  static oauthRedirect: (
    accountType: "primary" | "secondary",
    hint?: string,
  ) => void = GoogleOauthRedirect;

  static oauthCallback: (params: OauthCallbackParams) => Promise<boolean> =
    GoogleOauthCallback;

  email: string;

  refreshToken: string;
  refreshTime: number;

  constructor(data: Record<string, unknown>) {
    this.email = data.email as string;

    this.refreshToken = data.refreshToken as string;
    this.refreshTime = (data.refreshTime as number) || Date.now();
  }
}

export default GoogleDrive;
