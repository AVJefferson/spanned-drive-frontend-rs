import { access, cp, mkdir, readdir, rm } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

async function ensurePathExists(targetPath, label) {
  try {
    await access(targetPath, fsConstants.F_OK);
  } catch {
    throw new Error(`${label} path does not exist: ${targetPath}`);
  }
}

async function clearDirectory(targetPath) {
  await mkdir(targetPath, { recursive: true });
  const existingEntries = await readdir(targetPath);

  await Promise.all(
    existingEntries.map((entry) =>
      rm(path.join(targetPath, entry), {
        recursive: true,
        force: true,
      }),
    ),
  );
}

async function copyDistContents(distPath, targetPath) {
  const entries = await readdir(distPath);
  if (entries.length === 0) {
    throw new Error("Build output is empty. Run `npm run build` before deploying.");
  }

  await Promise.all(
    entries.map((entry) =>
      cp(path.join(distPath, entry), path.join(targetPath, entry), {
        recursive: true,
      }),
    ),
  );
}

async function main() {
  const targetDirectory = process.env.DEPLOY_TARGET_DIR;
  if (!targetDirectory) {
    throw new Error(
      "DEPLOY_TARGET_DIR is required. Example: DEPLOY_TARGET_DIR=/var/www/sdrive npm run deploy",
    );
  }

  const currentFilePath = fileURLToPath(import.meta.url);
  const projectRoot = path.resolve(path.dirname(currentFilePath), "..");
  const distPath = path.join(projectRoot, "dist");
  const resolvedTarget = path.resolve(targetDirectory);

  await ensurePathExists(distPath, "dist");
  await clearDirectory(resolvedTarget);
  await copyDistContents(distPath, resolvedTarget);

  console.log(`Deploy complete: ${distPath} -> ${resolvedTarget}`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Deploy failed: ${message}`);
  process.exit(1);
});
