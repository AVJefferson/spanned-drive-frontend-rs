import { GOOGLE_OAUTH_REDIRECT_URI } from "./google-constants";

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

  // Use state to pass a random Nonce for CSRF protection and to maintain any necessary state between the request and callback. The state also helps understand if the login attempt was for primary or secondary
  let nonce = crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
  url += `&state=${state}~${nonce}`;

  // Use PKCE Flow for public facing client application.
  url += "&code_challenge_method=S256";
  // 1. Generate Verifier (Using a more URL-safe approach to avoid encoding issues)
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const verifierArray = crypto.getRandomValues(new Uint8Array(64));
  const codeVerifier = Array.from(verifierArray)
    .map((x) => charset[x % charset.length])
    .join("");

  // 2. SHA-256 Hashing (Required for S256 method)
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);

  crypto.subtle.digest("SHA-256", data).then((hashBuffer) => {
    // 3. Base64URL Encode the HASH
    const codeChallenge = btoa(
      String.fromCharCode(...new Uint8Array(hashBuffer)),
    )
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    url += `&code_challenge=${codeChallenge}`;

    if (hint !== "") {
      url += `&hint=${hint}`;
    }

    localStorage.setItem(
      "oauth_params",
      JSON.stringify({
        provider: "google-drive",
        timestamp: Date.now(),
        nonce: nonce,
        verifier: codeVerifier,
        challenge: codeChallenge,
      }),
    );

    window.location.href = url;
  });
}

export default GoogleOauthRedirect;
