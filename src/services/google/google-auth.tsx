const backendUrl = import.meta.env.VITE_SDRIVE_BACKEND_URL;
const authHeader = `Bearer ${import.meta.env.VITE_SDRIVE_BACKEND_AUTH_TOKEN}`

export function FetchGoogleAccessToken(refresh_token: string): Promise<any> {
  const url = `${backendUrl}/token/google-drive/access_token`;
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
    },
    body: JSON.stringify({
      refresh_token: refresh_token,
    }),
  })
    .then((response) => response.json())
    .catch((error) => {
      console.error("Error refreshing access token:", error);
      return {};
    });
}

export function FetchGoogleWebAccessTokenAndRefreshToken(
  code: string,
  codeVerifier: string,
): Promise<any> {
  const url = `${backendUrl}/token/google-drive/refresh_token`;
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
    },
    body: JSON.stringify({
      code: code,
      code_verifier: codeVerifier,
      redirect_uri: import.meta.env.VITE_GOOGLE_REDIRECT_URI,
    }),
  })
    .then((response) => response.json())
    .catch((error) => {
      console.error("Error fetching access token:", error);
      return {};
    });
}
