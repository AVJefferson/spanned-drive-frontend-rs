import GoogleDrive from ".";
import { useRuntime } from "../../contexts/runtime-context";

const sdriveBackendUrl = import.meta.env.VITE_SDRIVE_BACKEND_URL;
const sdriveBackendAuthToken = import.meta.env.VITE_SDRIVE_BACKEND_AUTH_TOKEN;

const sdriveBackendHeaders = {
  "Content-Type": "application/json",
  ...(sdriveBackendAuthToken
    ? { Authorization: `Bearer ${sdriveBackendAuthToken}` }
    : {}),
};

const runtime = useRuntime();

export async function sdriveBackendPost<T>(
  path: string,
  body: unknown,
): Promise<T> {
  const response = await fetch(`${sdriveBackendUrl}${path}`, {
    method: "POST",
    headers: sdriveBackendHeaders,
    body: JSON.stringify(body),
  });

  const json = (await response.json().catch(() => null)) as T;

  if (!response.ok) {
    throw new Error(
      `Backend request to ${path} failed with ${response.status}: ${JSON.stringify(json)}`,
    );
  }

  return json;
}

export async function tauriInvoke<T>(
  command: string,
  payload: any,
): Promise<T> {
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<T>(command, payload);
}

export async function tauriInvokeWithSdriveBackendFallback<T>(
  command: string,
  payload: any,
  fallbackPath: string,
): Promise<T> {
  if (runtime.kind === "tauri") {
    try {
      return await tauriInvoke<T>(command, payload);
    } catch (e) {
      console.warn(
        `Tauri command ${command} failed, falling back to backend:`,
        e,
      );
    }
  }

  return await sdriveBackendPost<T>(fallbackPath, payload);
}

export default tauriInvokeWithSdriveBackendFallback;
