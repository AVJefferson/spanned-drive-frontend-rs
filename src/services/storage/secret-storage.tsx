import { useRuntime } from "../../contexts/runtime-context";
import { readLocalStorageJson, writeLocalStorageJson } from "./local-storage";
import { invoke } from "@tauri-apps/api/core";

const runtime = useRuntime();

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
  if (runtime.kind === "tauri") {
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
  if (runtime.kind === "tauri" && (await setSecret(service, key, value))) {
    return true;
  }

  console.warn(
    `Unable to persist secret in secure storage for key "${key}", using fallback storage.`,
  );
  writeLocalStorageJson(`secret--${service}--${key}`, value);
  return false;
}

export async function getSecret(service: string, key: string) {
  try {
    return await invokeSecret<string>("get_secret", {
      service,
      key,
    });
  } catch (e) {
    console.warn(`Failed to get secret from secure storage for key "${key}".`);
    let value = readLocalStorageJson<string>(`secret--${service}--${key}`, "");
    if (!value) {
      throw new Error(
        `No secret found in fallback storage for key "${key}". This may be expected if the secret was previously stored in secure storage.`,
      );
    }
    return value;
  }
}
