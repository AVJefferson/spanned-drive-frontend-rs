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

  if (!provider) return <h1>Invalid Provider</h1>;

  const DriveImplementation = getDriveImplementation(provider);
  if (!DriveImplementation?.oauthCallback) {
    return <h1>Provider not found</h1>;
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
    false,
  );
  if (oauthParamsOnce) {
    return <h1>OAuth callback already processed</h1>;
  }
  writeLocalStorageJson(STORAGE_KEYS.oauthParams + "-once", true);

  DriveImplementation.oauthCallback(params).then((result) => {
    writeLocalStorageJson(STORAGE_KEYS.oauthParams + "-once", false);
    if (
      !result.success ||
      !result.provider ||
      !result.email ||
      !result.refreshToken
    )
      navigate("/error?error=OAuth Callback Failed. Please try again.");
    else {
      session.setPrimaryDrive(
        result.provider,
        result.email,
        result.refreshToken,
      );
      navigate("/");
    }
  });

  return <h1>Please wait while we are processing OAuth callback...</h1>;
};

export default OauthRedirectPages;
