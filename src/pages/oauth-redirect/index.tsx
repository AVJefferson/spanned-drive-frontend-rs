import { useNavigate, useParams } from "react-router-dom";
import { STORAGE_KEYS } from "../../services/storage/local-storage";
import { getDriveImplementation } from "../../drives";

export const OauthRedirectPages = () => {
  const { provider } = useParams();
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

  DriveImplementation.oauthCallback(params).then((result) => {
    if (!result) navigate("/error?error=OAuth Callback Failed. Please try again.");
    else navigate("/");
  });

  return <h1>Please wait while we are processing OAuth callback...</h1>;
};

export default OauthRedirectPages;
