const backendUrl = import.meta.env.VITE_SDRIVE_BACKEND_URL;
const backendAuthToken = import.meta.env.VITE_SDRIVE_BACKEND_AUTH_TOKEN;

function createBackendHeaders() {
  return {
    "Content-Type": "application/json",
    ...(backendAuthToken
      ? { Authorization: `Bearer ${backendAuthToken}` }
      : {}),
  };
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const json = (await response.json().catch(() => ({}))) as T;

  if (!response.ok) {
    throw new Error(
      `Google auth request failed with ${response.status}: ${JSON.stringify(json)}`,
    );
  }

  return json;
}

export interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  id_token?: string;
}

export async function FetchGoogleAccessToken(
  refresh_token: string,
): Promise<GoogleTokenResponse> {
  const url = `${backendUrl}/token/google-drive/access_token`;
  const response = await fetch(url, {
    method: "POST",
    headers: createBackendHeaders(),
    body: JSON.stringify({
      refresh_token,
    }),
  });

  return parseJsonResponse<GoogleTokenResponse>(response);
}

export async function FetchGoogleWebAccessTokenAndRefreshToken(
  code: string,
  codeVerifier: string,
): Promise<GoogleTokenResponse> {
  const url = `${backendUrl}/token/google-drive/refresh_token`;
  const response = await fetch(url, {
    method: "POST",
    headers: createBackendHeaders(),
    body: JSON.stringify({
      code,
      code_verifier: codeVerifier,
      redirect_uri: import.meta.env.VITE_GOOGLE_REDIRECT_URI,
    }),
  });

  return parseJsonResponse<GoogleTokenResponse>(response);
}
