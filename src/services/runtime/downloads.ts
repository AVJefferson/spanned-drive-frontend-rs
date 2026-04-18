import { isTauriRuntime } from "../google/google-drive-http";

interface TauriRuntimeWindow extends Window {
  __TAURI_INTERNALS__?: unknown;
  __TAURI__?: unknown;
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
