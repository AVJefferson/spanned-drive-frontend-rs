import { GOOGLE_OAUTH_REDIRECT_URI } from "./constants";
import {
  STORAGE_KEYS,
  writeLocalStorageJson,
} from "../../storage/storage";

export function GoogleOauthRedirect(
  state: string = "primary",
  hint: string = "",
) {
  let url = `${GOOGLE_OAUTH_REDIRECT_URI}?client_id=${encodeURIComponent(import.meta.env.VITE_GOOGLE_CLIENT_ID)}&redirect_uri=${encodeURIComponent(import.meta.env.VITE_GOOGLE_REDIRECT_URI)}&response_type=code&prompt=consent&access_type=offline`;

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
      provider: "google-drive",
      timestamp: Date.now(),
      nonce,
      verifier: codeVerifier,
      challenge: codeChallenge,
    });

    window.location.href = url;
  });
}

export default GoogleOauthRedirect;
