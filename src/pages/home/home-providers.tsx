import type { ReactNode } from "react";

import { ErrorBoundary } from "../../components/error-boundary";

/**
 * Wraps the home shell with home-only providers/boundaries so a render failure
 * inside the authenticated experience does not blow away the rest of the app.
 */
export function HomeProviders({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      title="Home view crashed"
      message="The home view failed to render. Try again or reload the app."
    >
      {children}
    </ErrorBoundary>
  );
}

export default HomeProviders;
