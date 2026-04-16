import { useParams } from "react-router-dom";
import { STORAGE_KEYS } from "../../services/browser/storage";

const providers: Record<string, any> = import.meta.glob("./providers/*.tsx", {
  eager: true,
});

const OauthRedirectPages = () => {
  const { provider } = useParams();
  if (!provider) return <h1>Invalid provider</h1>;

  // Fetch the params from the URL after ?
  const queryParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.substring(1));

  // Get all params as an object
  const params = {
    provider,
    queryParams: Object.fromEntries(queryParams.entries()),
    hashParams: Object.fromEntries(hashParams.entries()),
    oauthParams: localStorage.getItem(STORAGE_KEYS.oauthParams)
      ? JSON.parse(localStorage.getItem(STORAGE_KEYS.oauthParams)!)
      : {},
  };

  const ProviderComponent = providers[`./providers/${provider}.tsx`]?.default;
  if (!ProviderComponent) return <h1>Provider not found</h1>;

  return ProviderComponent(params);
};

export default OauthRedirectPages;
