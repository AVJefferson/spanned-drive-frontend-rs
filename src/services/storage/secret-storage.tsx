import { useRuntime } from "../../contexts/runtime-context";
import { readLocalStorageJson, writeLocalStorageJson } from "./local-storage";

const runtime = useRuntime();

async function invokeSecret<T>(
  command: string,
  payload: Record<string, unknown>,
) {
  const { invoke } = await import("@tauri-apps/api/core");
  try {
    return invoke<T>(command, payload);
  } catch {
    throw new Error(`Failed to invoke secret storage command: ${command}`);
  }
}

export async function setSecret(service: string, key: string, value: string) {
  if (runtime.kind === "tauri") {
    await invokeSecret("set_secret", {
      service,
      key,
      value,
    });
  } else {
    throw new Error("Secret storage is only supported in Tauri runtime");
  }
}

export async function setSecretWithBrowserFallback(
  service: string,
  key: string,
  value: string,
) {
  if (runtime.kind === "tauri") {
    await setSecret(service, key, value);
  } else {
    console.warn(
      `Unable to persist secret in secure storage for key "${key}", using fallback storage.`,
    );
    writeLocalStorageJson(`secret-${service}-${key}`, value);
  }
}

export async function getSecret(service: string, key: string) {
  if (runtime.kind === "tauri") {
    return await invokeSecret<string>("get_secret", {
      service,
      key,
    });
  } else {
    console.warn(
      `Unable to retrieve secret from secure storage for key "${key}", using fallback storage.`,
    );
    let value = readLocalStorageJson<string>(`secret-${service}-${key}`, "");
    if (!value) {
      throw new Error(
        `No secret found in fallback storage for key "${key}". This may be expected if the secret was previously stored in secure storage.`,
      );
    }
    return value;
  }
}
