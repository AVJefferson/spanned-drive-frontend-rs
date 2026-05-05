import { isTauriRuntime } from "../../contexts/runtime-context";
import { readLocalStorageJson, writeLocalStorageJson } from "./local-storage";
import { invoke } from "@tauri-apps/api/core";

async function invokeSecret<T>(
  command: string,
  payload: Record<string, unknown>,
): Promise<T> {
  try {
    return await invoke<T>(command, payload);
  } catch {
    throw new Error(`Failed to invoke secret storage command: ${command}`);
  }
}

export async function setSecret(
  service: string,
  key: string,
  value: string,
): Promise<boolean> {
  service = service.toLowerCase();
  key = encodeURIComponent(key);
  if (isTauriRuntime()) {
    try {
      return await invokeSecret<boolean>("set_secret", {
        service,
        key,
        value,
      });
    } catch (e) {
      return false;
    }
  } else {
    return false;
  }
}

export async function setSecretWithBrowserFallback(
  service: string,
  key: string,
  value: string,
): Promise<boolean> {
  service = service.toLowerCase();
  key = encodeURIComponent(key);
  if (isTauriRuntime() && (await setSecret(service, key, value))) {
    return true;
  }

  console.warn(
    `Unable to persist secret in secure storage for key "${key}", using fallback storage.`,
  );
  writeLocalStorageJson(`secret--${service}--${key}`, value);
  return false;
}

export async function getSecret(service: string, key: string) {
  service = service.toLowerCase();
  key = encodeURIComponent(key);
  try {
    return await invokeSecret<string>("get_secret", {
      service,
      key,
    });
  } catch (e) {
    console.warn(`Failed to get secret from secure storage for key "${key}".`);
    let value = readLocalStorageJson<string>(`secret--${service}--${key}`, "");
    if (!value) {
      return "";
    }
    return value;
  }
}
