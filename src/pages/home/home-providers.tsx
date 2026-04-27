import type { ReactNode } from "react";

import { LogicalFoldersProvider } from "../../contexts/FoldersContext";
import { TasksProvider } from "../../contexts/TasksContext";

/**
 * Composes the providers that only the authenticated home experience needs.
 * Keeping them out of `main.tsx` prevents task ticks and folder mutations from
 * re-rendering the entire app (sign-in, oauth redirect, agreements pages).
 */
export function HomeProviders({ children }: { children: ReactNode }) {
  return (
    <LogicalFoldersProvider>
      <TasksProvider>{children}</TasksProvider>
    </LogicalFoldersProvider>
  );
}

export default HomeProviders;
