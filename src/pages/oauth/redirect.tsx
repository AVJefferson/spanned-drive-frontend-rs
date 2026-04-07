import { useParams } from "react-router-dom";

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
    oauthParams: sessionStorage.getItem("oauth_params")
      ? JSON.parse(sessionStorage.getItem("oauth_params")!)
      : {},
  };

  const ProviderComponent = providers[`./providers/${provider}.tsx`]?.default;
  if (!ProviderComponent) return <h1>Provider not found</h1>;

  return ProviderComponent(params);
};

export default OauthRedirectPages;
