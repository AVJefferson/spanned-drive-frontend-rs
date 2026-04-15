import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../../../contexts/SessionContext";
import { GoogleDrive } from "../../../contexts/drives/google-drive";
import { FetchGoogleWebAccessTokenAndRefreshToken } from "../../../services/google/google-auth";
import { SaveDrive } from "../../../services/browser/save-drive";

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

export default function GoogleWebRedirect(params: any) {
  const { setPrimaryDrive, addSecondaryDrive } = useSession();
  const navigate = useNavigate();
  const [errorNode, setErrorNode] = useState<React.ReactNode | null>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    if (
      !params?.oauthParams?.timestamp ||
      !params?.oauthParams?.nonce ||
      !params?.oauthParams?.provider ||
      !params?.oauthParams?.verifier
    ) {
      setErrorNode(
        <div>
          <h1>Error: Oauth dosent seem to be valid</h1>
          <p>Please try signing in again.</p>
        </div>,
      );
      return;
    }

    if (
      !params?.queryParams?.state ||
      !params?.queryParams?.iss ||
      !params?.queryParams?.code ||
      !params?.queryParams?.scope ||
      !params?.queryParams?.authuser ||
      !params?.queryParams?.prompt
    ) {
      setErrorNode(
        <div>
          <h1>Error: Missing required parameters</h1>
          <p>
            Missing one or more required parameters for Google OAuth redirect.
          </p>
        </div>,
      );
      return;
    }

    if (
      params?.provider !== "google-drive" &&
      params.oauthParams.provider !== "google-drive"
    ) {
      setErrorNode(<h1>Provider Mismatch. Something has gone wrong!!!</h1>);
      return;
    }

    if (params.queryParams.iss !== "https://accounts.google.com") {
      setErrorNode(
        <div>
          <h1>Error: Invalid issuer</h1>
          <p>Expected issuer: https://accounts.google.com</p>
          <p>Received issuer: {params.queryParams.iss}</p>
          <p>
            Your account might be at risk. Please check your account activity.
          </p>
          <p>If you feel this is a mistake, please contact us.</p>
        </div>,
      );
      return;
    }

    const isPrimaryDrive = params.queryParams.state.split("~")[0] === "primary";
    const isSecondaryDrive =
      params.queryParams.state.split("~")[0] === "secondary";

    const nonceFromState = params.queryParams.state.split("~")[1];

    if (nonceFromState !== params.oauthParams.nonce) {
      setErrorNode(
        <div>
          <h1>Error: Invalid state parameter</h1>
          <p>Expected state: {params.oauthParams.nonce}</p>
          <p>Received state: {nonceFromState}</p>
          <p>
            This could be a CSRF attack. Please do not proceed and contact
            support immediately.
          </p>
        </div>,
      );
      return;
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
      setErrorNode(
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
        </div>,
      );
      return;
    }

    FetchGoogleWebAccessTokenAndRefreshToken(
      params.queryParams.code,
      params.oauthParams.verifier,
    ).then((data) => {
      if (data && data.access_token) {
        data.user = decodeJWT(data.id_token);

        const drive = new GoogleDrive({
          email: data.user.email,

          refresh_token: data.refresh_token,
          acquired_at: Date.now(),
          scope: data.scope.split(" "),

          access_token: data.access_token,
          expires_in: data.expires_in,

          user: {
            name: data.user.name,
            picture: data.user.picture,
            sub: data.user.sub,
          },

          drive_settings: {
            allowed_space_usage_percent: 80,
          },

          drive_details: {
            isPrimaryDrive: isPrimaryDrive,
            isSecondaryDrive: !isSecondaryDrive,

            total_space: 0,
            used_space: 0,
            free_space: 0,
          },

          drive_span: {},
        });

        SaveDrive(drive);
        localStorage.removeItem("oauth_params");

        if (isPrimaryDrive) {
          setPrimaryDrive(drive);
        } else if (isSecondaryDrive) {
          addSecondaryDrive(drive);
        } else {
          navigate("/error?error=Oauth%20Failed%20due%20to%20invalid%20state");
          return <div></div>;
        }

        navigate("/");
      } else {
        navigate("/error?error=Oauth%20Failed");
      }
    });
  }, [params, navigate, setPrimaryDrive, addSecondaryDrive]);

  if (errorNode) {
    return errorNode;
  }

  return (
    <div>
      <h1>Google Web Redirect ... Processing</h1>
    </div>
  );
}
