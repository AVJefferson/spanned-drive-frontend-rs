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
} from "../services/storage/local-storage";

export type ThemePreference = "light" | "dark" | "system";

export interface AppSettings {
  theme: ThemePreference;
  setAppSettings: (settings: Partial<AppSettings>) => void;
}

const defaultSettings: AppSettings = {
  theme: "system",
  setAppSettings: (settings: Partial<AppSettings>) => {
    console.warn("setSettings called before SettingsProvider is initialized", {
      settings,
    });
  },
};

const initializeSettingsFromLocalStorage = (): AppSettings =>
  readLocalStorageJson(STORAGE_KEYS.settings, defaultSettings);

const SettingsContext = createContext<AppSettings>(defaultSettings);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(
    initializeSettingsFromLocalStorage(),
  );

  useEffect(() => {
    writeLocalStorageJson(STORAGE_KEYS.settings, settings);
  }, [settings]);

  const value = useMemo<AppSettings>(
    () => ({
      ...settings,
      setAppSettings: (newSettings: Partial<AppSettings>) => {
        setSettings((current) => ({
          ...current,
          ...newSettings,
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
