import { GoogleDrive } from ".";
import { getGoogleRefreshToken, revokeGoogleRefreshToken } from "./auth";
import { OauthCallbackParams, OauthCallbackResult } from "..";
import {
  STORAGE_KEYS,
  writeLocalStorageJson,
  removeLocalStorageKey,
} from "../../services/storage/local-storage";
import { getUserProfile } from "./profile";
import { saveDrive } from "../utils";

export const GOOGLE_OAUTH_URI = "https://accounts.google.com/o/oauth2/v2";

export function GoogleOauthRedirect(
  state: string = "primary",
  hint: string = "",
) {
  let url = `${GOOGLE_OAUTH_URI}/auth?client_id=${encodeURIComponent(import.meta.env.VITE_GOOGLE_CLIENT_ID)}&redirect_uri=${encodeURIComponent(GoogleDrive.redirectUri)}&response_type=code&prompt=consent&access_type=offline`;

  url +=
    "&scope=" +
    encodeURIComponent(
      "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile",
    );

  const nonce = crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
  url += `&state=${state}~${nonce}`;
  url += "&code_challenge_method=S256";

  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const verifierArray = crypto.getRandomValues(new Uint8Array(64));
  const codeVerifier = Array.from(verifierArray)
    .map((value) => charset[value % charset.length])
    .join("");

  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);

  crypto.subtle.digest("SHA-256", data).then((hashBuffer) => {
    const codeChallenge = btoa(
      String.fromCharCode(...new Uint8Array(hashBuffer)),
    )
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    url += `&code_challenge=${codeChallenge}`;

    if (hint !== "") {
      url += `&login_hint=${encodeURIComponent(hint)}`;
    }

    writeLocalStorageJson(STORAGE_KEYS.oauthParams, {
      provider: GoogleDrive.provider,
      timestamp: Date.now(),
      nonce,
      verifier: codeVerifier,
      challenge: codeChallenge,
    });

    window.location.href = url;
  });
}

export async function GoogleOauthLogout(token: string) {
  if (!token) {
    console.error("No token provided for Google logout");
    return;
  }

  await revokeGoogleRefreshToken(token)
    .then(() => {
      console.log("Google refresh token revoked successfully");
    })
    .catch((error) => {
      console.error("Failed to revoke Google refresh token:", error);
    });

  removeLocalStorageKey(STORAGE_KEYS.oauthParams);

  // Also remove stored keys for this drive. But cannot figure out the key from the token, hence need a drive reference that needs to be passed around instead
}

export async function GoogleOauthCallback(
  params: OauthCallbackParams,
): Promise<OauthCallbackResult> {
  console.log(
    "GoogleOauthCallback",
    { params },
    JSON.stringify(params, null, 2),
  );
  const oauthParams = params.oauthParams as {
    timestamp?: number;
    nonce?: string;
    provider?: string;
    verifier?: string;
  };

  if (
    !oauthParams?.timestamp ||
    !oauthParams?.nonce ||
    !oauthParams?.provider ||
    !oauthParams?.verifier
  ) {
    console.error("OAuth context is missing required parameters");
    return { success: false };
  }

  if (
    !params?.queryParams?.state ||
    !params?.queryParams?.iss ||
    !params?.queryParams?.code ||
    !params?.queryParams?.scope
  ) {
    console.error("OAuth callback is missing required parameters");
    return { success: false };
  }

  if (
    params?.provider !== GoogleDrive.provider &&
    oauthParams.provider !== GoogleDrive.provider
  ) {
    console.error("OAuth callback provider does not match expected provider");
    return { success: false };
  }

  if (params.queryParams.iss !== "https://accounts.google.com") {
    console.error("OAuth callback has an invalid issuer");
    return { success: false };
  }

  try {
    const stateParts = params.queryParams.state.split("~");
    const accountType = stateParts[0];
    const nonceFromState = stateParts[1];

    if (nonceFromState !== oauthParams.nonce) {
      console.error("OAuth callback has an invalid state parameter");
      return { success: false };
    }

    const requiredScopes = [
      "https://www.googleapis.com/auth/drive.file",
      "https://www.googleapis.com/auth/drive.appdata",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ];
    const providedScopes = params.queryParams.scope.split(" ");
    const missingScopes = requiredScopes.filter(
      (scope) => !providedScopes.includes(scope),
    );

    if (missingScopes.length > 0) {
      console.error("OAuth callback is missing required scopes");
      return { success: false };
    }

    return await getGoogleRefreshToken(
      params.queryParams.code,
      oauthParams.verifier,
    ).then(async (tokenResponse) => {
      console.log(
        "Google token response",
        { tokenResponse },
        { oauthParams },
        JSON.stringify(tokenResponse, null, 2),
      );
      if (!tokenResponse.refresh_token) {
        console.error("Missing Google token response");
        return { success: false };
      }

      const user = await getUserProfile(tokenResponse.access_token);
      if (!user?.email) {
        console.error("Unable to determine Google account email");
        return { success: false };
      }

      const drive = new GoogleDrive({
        email: user.email,
        refreshToken: tokenResponse.refresh_token,
      });

      saveDrive(drive);
      removeLocalStorageKey(STORAGE_KEYS.oauthParams);

      return {
        success: true,
        provider: GoogleDrive.provider,
        email: user.email,
        refreshToken: tokenResponse.refresh_token,
        accountType: accountType as "primary" | "secondary",
      };
    });
  } catch (error) {
    console.error("OAuth callback failed with error:", error);
    return { success: false };
  }
}


