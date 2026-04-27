import { useParams } from "react-router-dom";
import { STORAGE_KEYS } from "../../services/storage/storage";
import { getDriveImplementation } from "../../services/drives/registry";

const OauthRedirectPages = () => {
  const { provider } = useParams();
  if (!provider) return <h1>Invalid provider</h1>;

  const DriveImplementation = getDriveImplementation(provider);
  if (!DriveImplementation?.oauth_callback) {
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

  const Callback = DriveImplementation.oauth_callback;
  return <Callback params={params} />;
};

export default OauthRedirectPages;
