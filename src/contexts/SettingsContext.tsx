import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  STORAGE_KEYS,
  readLocalStorageJson,
  writeLocalStorageJson,
} from "../services/browser/storage";

export type ThemePreference = "light" | "dark" | "system";

export interface AppSettings {
  theme: ThemePreference;
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: "system",
};

interface SettingsContextValue {
  settings: AppSettings;
  setTheme: (theme: ThemePreference) => void;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(
  undefined,
);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() =>
    readLocalStorageJson(STORAGE_KEYS.settings, DEFAULT_SETTINGS),
  );

  useEffect(() => {
    writeLocalStorageJson(STORAGE_KEYS.settings, settings);
  }, [settings]);

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      setTheme: (theme) => {
        setSettings((current) => ({
          ...current,
          theme,
        }));
      },
    }),
    [settings],
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within SettingsProvider");
  }

  return context;
}
