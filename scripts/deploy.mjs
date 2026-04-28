// deploy using deno

import { copy, emptyDir } from "jsr:@std/fs";
import { join, resolve } from "jsr:@std/path";

async function ensurePathExists(targetPath, label) {
  try {
    await Deno.stat(targetPath);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      throw new Error(`${label} path does not exist: ${targetPath}`);
    }
    throw error;
  }
}

async function copyDistContents(distPath, targetPath) {
  const entries = [];
  for await (const entry of Deno.readDir(distPath)) {
    entries.push(entry);
  }

  if (entries.length === 0) {
    throw new Error(
      "Build output is empty. Run your build script before deploying.",
    );
  }

  await Promise.all(
    entries.map((entry) =>
      copy(join(distPath, entry.name), join(targetPath, entry.name), {
        overwrite: true,
      }),
    ),
  );
}

async function main() {
  const targetDirectory = Deno.env.get("DEPLOY_TARGET_DIR");
  if (!targetDirectory) {
    throw new Error(
      "DEPLOY_TARGET_DIR is required. Example: DEPLOY_TARGET_DIR=/var/www/sdrive deno run -A scripts/deploy.mjs",
    );
  }

  const projectRoot = resolve(import.meta.dirname, "..");
  const distPath = join(projectRoot, "dist");
  const resolvedTarget = resolve(targetDirectory);

  await ensurePathExists(distPath, "dist");
  await emptyDir(resolvedTarget);
  await copyDistContents(distPath, resolvedTarget);

  console.log(`Deploy complete: ${distPath} -> ${resolvedTarget}`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Deploy failed: ${message}`);
  Deno.exit(1);
});
