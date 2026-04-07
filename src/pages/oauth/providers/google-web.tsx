const decodeJWT = (token: string) => {
  try {
    // Get the middle part (payload)
    const base64Url = token.split(".")[1];
    // Convert Base64URL to standard Base64
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    // Decode and parse JSON
    return JSON.parse(window.atob(base64));
  } catch (e) {
    console.error("Invalid JWT", e);
    return null;
  }
};

export function FetchGoogleWebAccessTokenAndRefreshToken(
  code: string,
  codeVerifier: string,
) {
  let url = "https://oauth2.googleapis.com/token";
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      client_secret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
      code: code,
      code_verifier: codeVerifier,

      grant_type: "authorization_code",
      redirect_uri: import.meta.env.VITE_GOOGLE_REDIRECT_URI,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      data.user = decodeJWT(data.id_token);
      localStorage.setItem(
        `account_google_${data.user.email}`,
        JSON.stringify(data),
      );
      return true;
    })
    .catch((error) => {
      console.error("Error fetching access token:", error);
      return false;
    });
}

export default function GoogleWebRedirect(params: any) {
  // Validate the query parameters and handle the OAuth redirect logic here.
  if (
    !params?.oauthParams?.timestamp ||
    !params?.oauthParams?.nonce ||
    !params?.oauthParams?.provider ||
    !params?.oauthParams?.verifier
  ) {
    return (
      <div>
        <h1>Error: Oauth dosent seem to be valid</h1>
        <p>Please try signing in again.</p>
      </div>
    );
  }

  if (
    !params?.queryParams?.state ||
    !params?.queryParams?.iss ||
    !params?.queryParams?.code ||
    !params?.queryParams?.scope ||
    !params?.queryParams?.authuser ||
    !params?.queryParams?.prompt
  )
    return (
      <div>
        <h1>Error: Missing required parameters</h1>
        <p>
          Missing one or more required parameters for Google OAuth redirect.
        </p>
      </div>
    );

  if (
    params?.provider !== "google-web" &&
    params.oauthParams.provider !== "google-web"
  ) {
    return <h1>Provider Mismatch. Something has gone wrong!!!</h1>;
  }

  //   if (
  //     params.oauthParams.timestamp &&
  //     Date.now() - params.oauthParams.timestamp > 5 * 60 * 1000 // 5 minutes
  //   ) {
  //     return (
  //       <div>
  //         <h1>Error: OAuth session expired</h1>
  //         <p>Your OAuth session has expired. Please try signing in again.</p>
  //       </div>
  //     );
  //   }

  if (params.queryParams.iss !== "https://accounts.google.com")
    return (
      <div>
        <h1>Error: Invalid issuer</h1>
        <p>Expected issuer: https://accounts.google.com</p>
        <p>Received issuer: {params.queryParams.iss}</p>
        <p>
          Your account might be at risk. Please check your account activity.
        </p>
        <p>If you feel this is a mistake, please contact us.</p>
      </div>
    );

  if (params.queryParams.state !== params.oauthParams.nonce) {
    return (
      <div>
        <h1>Error: Invalid state parameter</h1>
        <p>Expected state: {params.oauthParams.nonce}</p>
        <p>Received state: {params.queryParams.state}</p>
        <p>
          This could be a CSRF attack. Please do not proceed and contact support
          immediately.
        </p>
      </div>
    );
  }

  // Required scopes for the application
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
    return (
      <div>
        <h1>Error: Missing required scopes</h1>
        <p>
          The following required scopes are missing from the OAuth response:
        </p>
        <ul>
          {missingScopes.map((scope) => (
            <li key={scope}>
              {scope.split("https://www.googleapis.com/auth/")[1] || scope}
            </li>
          ))}
        </ul>
        <p>
          Please ensure you grant all required permissions and try signing in
          again.
        </p>
      </div>
    );
  }

  FetchGoogleWebAccessTokenAndRefreshToken(
    params.queryParams.code,
    params.oauthParams.verifier,
  ).then((success) => {
    if (success) {
      localStorage.set;
      window.location.href = "/";
    } else {
    }
  });

  return (
    <div>
      <h1>Google Web Redirect ... </h1>
    </div>
  );
}
