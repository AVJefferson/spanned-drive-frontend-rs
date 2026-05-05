import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export interface RuntimeInfo {
  kind: "browser" | "tauri";
  wrapperVersion: string;
  appVersion: string;
  platform: string;
  via: "probe" | "fallback";
}

const defaultRuntime: RuntimeInfo = {
  kind: "browser",
  wrapperVersion: "Not Available",
  appVersion: import.meta.env.VITE_APP_VERSION || "unknown",
  platform: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
  via: "fallback",
};

export function isTauriRuntime(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return "__TAURI_INTERNALS__" in window || "__TAURI__" in window;
}

export async function detectRuntime(): Promise<RuntimeInfo> {
  try {
    if (isTauriRuntime()) {
      const { invoke } = await import("@tauri-apps/api/core");
      return {
        ...(await invoke<RuntimeInfo>("runtime_environment")),
        via: "probe",
        kind: "tauri",
      };
    }
  } catch {
    return defaultRuntime;
  }
  return defaultRuntime;
}

const RuntimeContext = createContext<RuntimeInfo>(defaultRuntime);

export function RuntimeProvider({ children }: { children: ReactNode }) {
  const [runtime, setRuntime] = useState<RuntimeInfo>(defaultRuntime);

  useEffect(() => {
    let isCurrent = true;

    async function load() {
      const info = await detectRuntime();
      if (isCurrent) setRuntime(info);
    }

    load();
    return () => {
      isCurrent = false;
    };
  }, []);

  const value = useMemo(() => runtime, [runtime]);

  return (
    <RuntimeContext.Provider value={value}>{children}</RuntimeContext.Provider>
  );
}

export function useRuntime(): RuntimeInfo {
  return useContext(RuntimeContext);
}
