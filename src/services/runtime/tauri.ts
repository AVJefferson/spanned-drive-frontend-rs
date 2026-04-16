export interface RuntimeInfo {
  kind: "browser" | "tauri";
  tauriAvailable: boolean;
  platform: string;
  via: "probe" | "fallback";
}

export async function detectRuntime(): Promise<RuntimeInfo> {
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    const result = await invoke<{
      platform: string;
      runtime: string;
      tauri: boolean;
    }>("runtime_environment");

    return {
      kind: result?.tauri ? "tauri" : "browser",
      tauriAvailable: Boolean(result?.tauri),
      platform: result?.platform || "unknown",
      via: "probe",
    };
  } catch {
    return {
      kind: "browser",
      tauriAvailable: false,
      platform: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
      via: "fallback",
    };
  }
}
