import { Navigate } from "react-router-dom";

import { useSession } from "../../contexts/session-context";

import { Home } from "./home";
import { HomeProviders } from "./home-providers";

export function HomePage() {
  const session = useSession();

  if (!session.primaryDrive?.email) {
    return <Navigate to="/signin" replace />;
  }

  return (
    <HomeProviders>
      <Home />
    </HomeProviders>
  );
}

export default HomePage;
