import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { detectRuntime, type RuntimeInfo } from "../services/runtime/tauri";

const defaultRuntime: RuntimeInfo = {
  kind: "browser",
  tauriAvailable: false,
  tauriVersion: "Not Available",
  appVersion: "unknown",
  platform: "unknown",
  via: "fallback",
};

const RuntimeContext = createContext<RuntimeInfo>(defaultRuntime);

export function RuntimeProvider({ children }: { children: ReactNode }) {
  const [runtime, setRuntime] = useState<RuntimeInfo>(defaultRuntime);

  useEffect(() => {
    let cancelled = false;

    detectRuntime().then((info) => {
      if (!cancelled) {
        setRuntime(info);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => runtime, [runtime]);

  return (
    <RuntimeContext.Provider value={value}>{children}</RuntimeContext.Provider>
  );
}

export function useRuntime() {
  return useContext(RuntimeContext);
}
