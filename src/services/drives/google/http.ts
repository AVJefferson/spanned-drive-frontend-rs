import { invoke } from "@tauri-apps/api/core";

/** True when running inside the Tauri webview (not a normal browser tab). */
export function isTauriRuntime(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return "__TAURI_INTERNALS__" in window || "__TAURI__" in window;
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    const sub = bytes.subarray(i, i + chunk);
    binary += String.fromCharCode.apply(
      null,
      sub as unknown as number[],
    );
  }
  return btoa(binary);
}

function base64ToUint8Array(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    out[i] = bin.charCodeAt(i);
  }
  return out;
}

async function bodyToUint8Array(
  body: BodyInit | null | undefined,
): Promise<Uint8Array | undefined> {
  if (body == null) {
    return undefined;
  }
  if (typeof body === "string") {
    return new TextEncoder().encode(body);
  }
  if (body instanceof Blob) {
    return new Uint8Array(await body.arrayBuffer());
  }
  if (body instanceof ArrayBuffer) {
    return new Uint8Array(body);
  }
  if (ArrayBuffer.isView(body)) {
    return new Uint8Array(
      body.buffer,
      body.byteOffset,
      body.byteLength,
    );
  }
  throw new Error("Unsupported body type for Tauri Google Drive HTTP");
}

type TauriGoogleDriveHttpResponse = {
  status: number;
  headers: Record<string, string>;
  bodyBase64: string;
};

/**
 * Same as `fetch` for Google APIs, but when running under Tauri the request is
 * executed in Rust so browser CORS does not apply.
 */
export async function googleDriveFetch(
  input: string | URL,
  init?: RequestInit,
): Promise<Response> {
  const url = typeof input === "string" ? input : input.toString();

  if (!isTauriRuntime()) {
    return fetch(url, init);
  }

  const method = init?.method ?? "GET";
  const headers: Record<string, string> = {};
  if (init?.headers) {
    new Headers(init.headers).forEach((value, key) => {
      headers[key] = value;
    });
  }

  const bodyBytes = await bodyToUint8Array(
    init?.body as BodyInit | null | undefined,
  );
  const bodyBase64 =
    bodyBytes !== undefined && bodyBytes.length > 0
      ? uint8ToBase64(bodyBytes)
      : undefined;

  const result = await invoke<TauriGoogleDriveHttpResponse>(
    "google_drive_http_request",
    {
      request: {
        method,
        url,
        headers,
        bodyBase64,
      },
    },
  );

  const payload = base64ToUint8Array(result.bodyBase64);
  const contiguous =
    payload.byteOffset === 0 && payload.byteLength === payload.buffer.byteLength
      ? payload
      : payload.slice();
  return new Response(contiguous.buffer as ArrayBuffer, {
    status: result.status,
    headers: new Headers(result.headers),
  });
}
