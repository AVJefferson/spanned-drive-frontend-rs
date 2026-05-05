import GoogleDrive from ".";
import { tauriInvokeWithSdriveBackendFallback } from "./client";

export interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  id_token?: string;
}

export async function getGoogleRefreshToken(
  code: string,
  codeVerifier: string,
): Promise<GoogleTokenResponse> {
  const response =
    await tauriInvokeWithSdriveBackendFallback<GoogleTokenResponse>(
      "get_google_refresh_token",
      {
        code,
        code_verifier: codeVerifier,
        redirect_uri: GoogleDrive.redirectUri,
      },
      `/token/${GoogleDrive.provider}/refresh_token`,
    );

  return response;
}

export function revokeGoogleRefreshToken(token: string) {
  return tauriInvokeWithSdriveBackendFallback(
    "revoke_google_refresh_token",
    { token },
    `/token/${GoogleDrive.provider}/revoke_token`,
  );
}

export async function getGoogleAccessToken(
  refreshToken: string,
): Promise<GoogleTokenResponse> {
  const response =
    await tauriInvokeWithSdriveBackendFallback<GoogleTokenResponse>(
      "get_google_access_token",
      { refresh_token: refreshToken },
      `/token/${GoogleDrive.provider}/access_token`,
    );

  return response;
}
