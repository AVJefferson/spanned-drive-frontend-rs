# Storage Security Model

## Data classification

- Secrets
  - Drive refresh tokens.
  - Stored in secure storage (`secret-storage.ts`):
    - Tauri: OS keyring via Rust commands.
    - Browser fallback: namespaced local storage secret keys.
- Non-sensitive state
  - Session references (`provider`, `email`).
  - Logical folder manifests and task queue state.
  - Cached drive snapshots without tokens.

## Current behavior

- `SaveDrive()` strips `refresh_token` and `access_token` from snapshots before writing local storage.
- `GoogleDrive.fetch_access_token()` lazily restores refresh token from secure storage when needed.
- `RetreiveDrive()` migrates old snapshots that still contain plaintext refresh tokens.
- `LogoutFromLocalStorage()` clears session state and attempts secure secret cleanup.

## Contributor checklist

- Never persist OAuth access tokens or refresh tokens in plain local storage snapshots.
- Route all secret read/write/delete operations through `services/security/secret-storage.ts`.
- Keep local storage focused on cache and recoverable UI state.
- Treat remote app storage as non-secret synchronization data.

