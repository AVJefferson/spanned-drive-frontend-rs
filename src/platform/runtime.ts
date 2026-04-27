// Host-environment abstractions: detect Tauri vs browser, plus native I/O.

export interface RuntimeInfo {
  kind: "browser" | "tauri";
  tauriAvailable: boolean;
  tauriVersion: string;
  appVersion: string;
  platform: string;
  via: "probe" | "fallback";
}

interface TauriRuntimeWindow extends Window {
  __TAURI_INTERNALS__?: unknown;
  __TAURI__?: unknown;
}

/** True when running inside the Tauri webview (not a normal browser tab). */
export function isTauriRuntime(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return "__TAURI_INTERNALS__" in window || "__TAURI__" in window;
}

export async function detectRuntime(): Promise<RuntimeInfo> {
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    const result = await invoke<{
      platform: string;
      runtime: string;
      tauri: boolean;
      tauriVersion?: string;
      appVersion?: string;
    }>("runtime_environment");

    return {
      kind: result?.tauri ? "tauri" : "browser",
      tauriAvailable: Boolean(result?.tauri),
      platform: result?.platform || "unknown",
      tauriVersion: result?.tauriVersion || "Not Available",
      appVersion: result?.appVersion || "Not Available",
      via: "probe",
    };
  } catch {
    return {
      kind: "browser",
      tauriAvailable: false,
      platform: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
      tauriVersion: "Not Available",
      appVersion: "Not Available",
      via: "fallback",
    };
  }
}

function normalizePath(path: string) {
  return path.replace(/\\/g, "/");
}

export function supportsNativeDownloadDestination() {
  if (typeof window === "undefined") {
    return false;
  }

  const runtimeWindow = window as TauriRuntimeWindow;
  return (
    isTauriRuntime() &&
    (Boolean(runtimeWindow.__TAURI_INTERNALS__) || Boolean(runtimeWindow.__TAURI__))
  );
}

export async function chooseDownloadDirectory(): Promise<string | null> {
  if (!supportsNativeDownloadDestination()) {
    return null;
  }

  const { invoke } = await import("@tauri-apps/api/core");
  const selectedPath = await invoke<string | null>("choose_download_directory");
  return selectedPath ? normalizePath(selectedPath) : null;
}

export async function writeDownloadFile(
  destinationPath: string,
  blob: Blob,
): Promise<void> {
  const { invoke } = await import("@tauri-apps/api/core");
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  const encoded = btoa(binary);
  await invoke("write_download_file", {
    destinationPath: normalizePath(destinationPath),
    bytesBase64: encoded,
  });
}
