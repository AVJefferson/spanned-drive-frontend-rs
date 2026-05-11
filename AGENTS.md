# AGENTS.md

## Cursor Cloud specific instructions

### Overview

Spanned Drive is a React + TypeScript + Vite frontend for a multi-Google Drive file manager. It also has a Tauri desktop app variant (optional for web dev). The backend (Axum/Rust) lives in a separate repo.

### Quick reference

- **Dev server:** `npm run dev` → port 1420
- **Type check (lint):** `npx tsc --noEmit`
- **Build:** `npm run build` (runs `tsc && vite build`)
- **Package manager:** npm (`package-lock.json`)

### Environment variables

The app reads Vite env vars from a `.env` file (git-ignored). Without these, the frontend renders but cannot authenticate or reach the backend:

- `VITE_SDRIVE_BACKEND_URL` — backend URL (e.g. `http://127.0.0.1:3000`)
- `VITE_SDRIVE_BACKEND_AUTH_TOKEN` — bearer token for backend
- `VITE_GOOGLE_CLIENT_ID` — Google OAuth client ID
- `VITE_GOOGLE_REDIRECT_URI` — OAuth redirect URI

### Notes

- No ESLint config exists; linting is TypeScript compiler only (`tsc --noEmit`).
- No test framework is configured (no vitest/jest/test files).
- No pre-commit hooks or lint-staged config.
- The Tauri desktop variant requires Rust toolchain and `@tauri-apps/cli`; not needed for web development.
- Vite dev server uses `strictPort: true` on 1420 — if that port is occupied, the server will fail instead of picking another port.
