# Tauri + React + Typescript

This template should help get you started developing with Tauri, React and Typescript in Vite.

## Development

- Start dev server: `npm run dev`
- Build web assets: `npm run build`

## Deploy

The deploy script is environment-driven and works across Linux/macOS/CI runners.

- Required variable: `DEPLOY_TARGET_DIR`
- Example: `DEPLOY_TARGET_DIR=/var/www/sdrive npm run deploy`

`npm run deploy` performs:
- typecheck + Vite build
- target directory cleanup
- recursive copy of `dist` contents into `DEPLOY_TARGET_DIR`

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
