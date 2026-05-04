import { GoogleDrive } from ".";
import { tauriInvokeWithSdriveBackendFallback } from "./client";

export interface GoogleUserProfile {
  email: string;
  name?: string;
  picture?: string;
  sub?: string;
}

export async function getUserProfile(
  accessToken: string,
): Promise<GoogleUserProfile> {
  const response =
    await tauriInvokeWithSdriveBackendFallback<GoogleUserProfile>(
      "get_google_profile",
      { accessToken },
      `/profile/${GoogleDrive.provider}`,
    );

  return response;
}
