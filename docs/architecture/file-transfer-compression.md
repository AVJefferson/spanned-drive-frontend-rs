# File Transfer Compression Decision Note

## Current State

- Uploads use Drive multipart uploads with raw file bytes from the browser file handle.
- Downloads stream raw bytes per file from provider placements.
- Tauri bridge path currently performs full-body base64 transfer across JS <-> Rust commands.

## Compression Options Considered

### 1) Pre-archive workflow (user zips before upload)

- Pros: zero app complexity, lowest runtime risk.
- Cons: poor UX for drag-and-drop cloud-drive parity, no automatic structure handling.
- Recommendation: keep as a fallback workflow.

### 2) Client-side archive packaging for folder downloads

- Pros: single artifact for folder download, easier browser behavior vs many file prompts.
- Cons: archive format support needs dependency/runtime support; high memory use for large trees.
- Recommendation: use a guarded pilot before default enablement.

### 3) Stream compression during upload/download transport

- Pros: can reduce network payload for compressible data.
- Cons: not equivalent to archive semantics, and currently blocked by base64 bridge behavior on Tauri.
- Recommendation: defer until transport layer supports stream-first transfers.

### 4) Server-assisted compression/proxying

- Pros: central control, can offload heavy CPU/memory.
- Cons: architecture expansion and privacy/security implications for user file content.
- Recommendation: not in current milestone.

## Pilot Implemented

- Feature flag: `VITE_ENABLE_DOWNLOAD_GZIP_PILOT=true`.
- When enabled and downloading multiple files/folders, the app builds a compressed `.sdrivebundle.gz` manifest:
  - includes relative path + MIME type + base64 file payloads,
  - uses browser `CompressionStream("gzip")` when available,
  - falls back to uncompressed manifest blob if compression stream is unavailable.
- Default behavior remains unchanged when flag is off.

## Rollout and Rollback

- Rollout: opt-in via env flag for desktop/web test builds.
- Validation:
  - verify bundle creation time and memory with nested folders,
  - verify Tauri destination writes and browser save behavior,
  - compare bundle size reduction for text-heavy and media-heavy sets.
- Rollback: disable flag with no data migration required.
