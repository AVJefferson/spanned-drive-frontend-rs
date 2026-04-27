import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../../../contexts/SessionContext";
import { getDriveImplementation } from "../registry";
import { FetchGoogleWebAccessTokenAndRefreshToken } from "./auth";
import { saveDrive } from "../../storage/drive";
import { backendFetchProfile } from "./client";
import {
  STORAGE_KEYS,
  removeLocalStorageKey,
} from "../../storage/storage";
import type { OauthCallbackParams } from "../types";

const GOOGLE_DRIVE_PROVIDER = "google-drive";

export default function GoogleWebRedirect({ params }: { params: OauthCallbackParams }) {
  const { setPrimaryDrive, addSecondaryDrive } = useSession();
  const navigate = useNavigate();
  const [errorNode, setErrorNode] = useState<React.ReactNode | null>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

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
      setErrorNode(
        <div>
          <h1>Error: OAuth context is missing</h1>
          <p>Please try signing in again.</p>
        </div>,
      );
      return;
    }

    if (
      !params?.queryParams?.state ||
      !params?.queryParams?.iss ||
      !params?.queryParams?.code ||
      !params?.queryParams?.scope
    ) {
      setErrorNode(
        <div>
          <h1>Error: Missing required parameters</h1>
          <p>Google did not return the full OAuth callback payload.</p>
        </div>,
      );
      return;
    }

    if (
      params?.provider !== GOOGLE_DRIVE_PROVIDER &&
      oauthParams.provider !== GOOGLE_DRIVE_PROVIDER
    ) {
      setErrorNode(<h1>Provider mismatch</h1>);
      return;
    }

    if (params.queryParams.iss !== "https://accounts.google.com") {
      setErrorNode(
        <div>
          <h1>Error: Invalid issuer</h1>
          <p>Expected issuer: https://accounts.google.com</p>
          <p>Received issuer: {params.queryParams.iss}</p>
        </div>,
      );
      return;
    }

    const stateParts = params.queryParams.state.split("~");
    const accountType = stateParts[0];
    const nonceFromState = stateParts[1];

    if (nonceFromState !== oauthParams.nonce) {
      setErrorNode(
        <div>
          <h1>Error: Invalid state parameter</h1>
          <p>Please try signing in again.</p>
        </div>,
      );
      return;
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
      setErrorNode(
        <div>
          <h1>Error: Missing required scopes</h1>
          <p>Please approve all requested permissions and try again.</p>
        </div>,
      );
      return;
    }

    FetchGoogleWebAccessTokenAndRefreshToken(
      params.queryParams.code,
      oauthParams.verifier,
    )
      .then(async (data) => {
        if (!data?.access_token) {
          throw new Error("Missing Google token response");
        }

        const user = await backendFetchProfile(data.access_token);
        if (!user?.email) {
          throw new Error("Unable to determine Google account email");
        }

        const DriveImplementation = getDriveImplementation(GOOGLE_DRIVE_PROVIDER);
        if (!DriveImplementation) {
          throw new Error("GoogleDrive implementation is not registered");
        }
        const drive = new DriveImplementation({
          email: user.email,
          refresh_token: data.refresh_token || "",
          acquired_at: Date.now(),
          scope: data.scope?.split(" ") || [],
          access_token: data.access_token,
          expires_in: data.expires_in,
          user: {
            name: user.name,
            picture: user.picture,
            sub: user.sub,
          },
          drive_settings: {
            usageLimitPercent: 85,
            allowed_space_usage_percent: 85,
          },
          drive_details: {
            totalSpace: 0,
            usedSpace: 0,
            freeSpace: 0,
          },
          drive_span: {},
        });

        try {
          await drive.refresh_drive_details();
        } catch (error) {
          console.warn("Drive details refresh failed during login", error);
        }

        saveDrive(drive);
        removeLocalStorageKey(STORAGE_KEYS.oauthParams);

        if (accountType === "primary") {
          setPrimaryDrive(drive);
        } else if (accountType === "secondary") {
          addSecondaryDrive(drive);
        } else {
          throw new Error("Invalid account type in OAuth state");
        }

        navigate("/");
      })
      .catch((error) => {
        console.error(error);
        navigate("/error?error=Oauth%20Failed");
      });
  }, [params, navigate, setPrimaryDrive, addSecondaryDrive]);

  if (errorNode) {
    return (
      <>
        <div>{errorNode}</div>
        <div>
          <button type="button" onClick={() => navigate("/")}>
            Go back
          </button>
        </div>
      </>
    );
  }

  return (
    <div>
      <h1>Connecting your Google Drive...</h1>
    </div>
  );
}
