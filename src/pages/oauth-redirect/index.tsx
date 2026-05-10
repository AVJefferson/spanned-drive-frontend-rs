import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  STORAGE_KEYS,
  readLocalStorageJson,
  writeLocalStorageJson,
} from "../../services/storage/local-storage";
import { getDriveImplementation } from "../../drives";
import { useSession } from "../../contexts/session-context";

export const OauthRedirectPages = () => {
  const { provider } = useParams();
  const session = useSession();
  const navigate = useNavigate();
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    if (!provider) {
      navigate("/error?error=Invalid Provider");
      return;
    }

    const DriveImplementation = getDriveImplementation(provider);
    if (!DriveImplementation?.oauthCallback) {
      navigate("/error?error=Provider not found");
      return;
    }

    const queryParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));

    const oauthParamsRaw = localStorage.getItem(STORAGE_KEYS.oauthParams);

    const params = {
      provider,
      queryParams: Object.fromEntries(queryParams.entries()),
      hashParams: Object.fromEntries(hashParams.entries()),
      oauthParams: oauthParamsRaw ? JSON.parse(oauthParamsRaw) : {},
    };

    const oauthParamsOnce = readLocalStorageJson(
      STORAGE_KEYS.oauthParams + "-once",
      0,
    );
    if (
      oauthParamsOnce &&
      oauthParamsOnce > Date.now() - 1000 * 60 * 5 /** 5 minutes */
    ) {
      navigate(
        "/error?error=OAuth Callback Already Processed. Please wait 5 minutes before trying again.",
      );
      return;
    }
    writeLocalStorageJson(STORAGE_KEYS.oauthParams + "-once", Date.now());

    DriveImplementation.oauthCallback(params).then((result) => {
      if (
        !result.success ||
        !result.provider ||
        !result.email ||
        !result.refreshToken
      ) {
        writeLocalStorageJson(STORAGE_KEYS.oauthParams + "-once", 0);
        navigate("/error?error=OAuth Callback Failed. Please try again.");
      } else {
        if (result.accountType === "primary") {
          session.setPrimaryDrive(
            result.provider,
            result.email,
            result.refreshToken,
          );
        } else {
          session.addSecondaryDrive(
            result.provider,
            result.email,
            result.refreshToken,
          );
        }
        navigate("/");
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <h1>Please wait while we are processing OAuth callback...</h1>;
};

export default OauthRedirectPages;
