# Spanned Drive Frontend

- Framework: `Tauri + React`
- Language: `Typescript`
- Build Tool: `Vite`
- Runtime: `Deno`

## Development

- Start dev server: `clear && set -a && source .env && set +a && deno task dev`
- Build web assets: `clear && set -a && source .env && set +a && deno task build`

## Environment Variables

- VITE_APP_BASE_NAME: The base Url (after the domain) for the app. Example: `VITE_APP_BASE_NAME=sdrive` if the app is hosted at `https://a.b.c/sdrive`

- VITE_APP_VERSION: The version of the app. Example: `VITE_APP_VERSION=0.1.0`
- VITE_REDIRECT_URI: The redirect uri for the app. Example: `VITE_REDIRECT_URI=http://localhost:1420/oauth/redirect`
- VITE_SDRIVE_BACKEND_URL: The url of the drive backend. Example: `VITE_SDRIVE_BACKEND_URL=http://localhost:3000`
- VITE_SDRIVE_BACKEND_AUTH_TOKEN: The auth token for the drive backend. Example: `VITE_SDRIVE_BACKEND_AUTH_TOKEN=test`
- VITE_GOOGLE_CLIENT_ID: The client id for the google oauth. Example: `VITE_GOOGLE_CLIENT_ID=client-id`

## Deploy

The deploy script is environment-driven and works across Linux/macOS/CI runners.

- Required variable: `DEPLOY_TARGET_DIR`
- Example: `DEPLOY_TARGET_DIR=/var/www/sdrive deno task deploy`
- Note: All environment variables for building the app must be set in the environment.

`deno task deploy` performs:

- typecheck + Vite build
- target directory cleanup
- recursive copy of `dist` contents into `DEPLOY_TARGET_DIR`

### Docker (DHI Apache)

Minimal non-root Apache serves prebuilt `dist/`.

1. `docker login dhi.io`
2. Build web assets (env vars set): `deno task build`
3. Start a profile:
   - Dev (host `dist/` volume, live): `docker compose --profile dev -f docker/docker-compose.yml up --build` → `http://localhost:4000`
   - Stg (host `dist/` volume, live): `docker compose --profile stg -f docker/docker-compose.yml up --build` → `http://localhost:4001`
   - Prd (`dist/` baked into image): `docker compose --profile prd -f docker/docker-compose.yml up --build` → `http://localhost:4002`

Dev/stg remount host `dist/` read-only — rebuild assets on host, no image rebuild. Prd needs `--build` after each new `dist/` for security bake-in.

## Architecture Notes

- [State ownership and boundaries](docs/architecture/state-ownership.md)
- [Storage security model](docs/architecture/storage-security.md)

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
