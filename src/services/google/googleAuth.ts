export function FetchGoogleAccessToken(refresh_token: string): Promise<any> {
  const url = "https://oauth2.googleapis.com/token";
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      client_secret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
      refresh_token: refresh_token,
      grant_type: "refresh_token",
    }),
  })
    .then((response) => response.json())
    .catch((error) => {
      console.error("Error refreshing access token:", error);
      return {};
    });
}
