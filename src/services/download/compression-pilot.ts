export function compressionPilotEnabled() {
  return String(import.meta.env.VITE_ENABLE_DOWNLOAD_GZIP_PILOT || "").toLowerCase() === "true";
}

export async function gzipBlob(blob: Blob): Promise<Blob> {
  if (typeof CompressionStream === "undefined") {
    return blob;
  }

  const compressionStream = new CompressionStream("gzip");
  const compressedStream = blob.stream().pipeThrough(compressionStream);
  return new Response(compressedStream).blob();
}

export async function blobToBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}
