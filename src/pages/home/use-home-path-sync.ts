import { useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";

export const HOME_TABS = ["files", "drives", "tasks", "account"] as const;
export type HomeTab = (typeof HOME_TABS)[number];

export const DEFAULT_HOME_TAB: HomeTab = "files";

function isValidHomeTab(value: string | null): value is HomeTab {
  return value !== null && (HOME_TABS as readonly string[]).includes(value);
}

/**
 * Two-way binding between the active home tab and the `?tab=` URL param.
 * The URL is the source of truth on first load and on back/forward navigation.
 */
export function useHomePathSync(
  selectedTab: HomeTab,
  setSelectedTab: (tab: HomeTab) => void,
) {
  const [searchParams, setSearchParams] = useSearchParams();
  const lastWrittenRef = useRef<HomeTab | null>(null);

  useEffect(() => {
    const raw = searchParams.get("tab");
    if (isValidHomeTab(raw)) {
      if (raw !== selectedTab) {
        setSelectedTab(raw);
      }
    }
  }, [searchParams, selectedTab, setSelectedTab]);

  useEffect(() => {
    const current = searchParams.get("tab");
    if (current === selectedTab) {
      lastWrittenRef.current = selectedTab;
      return;
    }
    if (lastWrittenRef.current === selectedTab) {
      return;
    }

    lastWrittenRef.current = selectedTab;
    setSearchParams(
      (params) => {
        const next = new URLSearchParams(params);
        next.set("tab", selectedTab);
        return next;
      },
      { replace: true },
    );
  }, [selectedTab, searchParams, setSearchParams]);

  const initialTab = useCallback((): HomeTab => {
    const raw = searchParams.get("tab");
    return isValidHomeTab(raw) ? raw : DEFAULT_HOME_TAB;
  }, [searchParams]);

  return { initialTab };
}
