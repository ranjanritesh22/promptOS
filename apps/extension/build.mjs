/**
 * Extension build script (esbuild).
 *
 * Bundles the three entry points (content script, background worker, popup,
 * options) — each with @promptos/core inlined — and copies the static assets
 * (manifest, HTML, CSS, icons) into dist/. Pass --watch for incremental dev.
 */

import { build, context } from "esbuild";
import { cp, mkdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const outdir = resolve(root, "dist");
const watch = process.argv.includes("--watch");

const entryPoints = {
  content: resolve(root, "src/content/index.ts"),
  background: resolve(root, "src/background/index.ts"),
  popup: resolve(root, "src/popup/index.ts"),
  options: resolve(root, "src/options/index.ts"),
};

/** @type {import("esbuild").BuildOptions} */
const options = {
  entryPoints,
  outdir,
  bundle: true,
  format: "esm",
  target: ["chrome114"],
  platform: "browser",
  sourcemap: watch ? "inline" : false,
  minify: !watch,
  logLevel: "info",
};

async function copyStatic() {
  const publicDir = resolve(root, "public");
  await cp(publicDir, outdir, { recursive: true });
  await cp(resolve(root, "manifest.json"), resolve(outdir, "manifest.json"));
}

async function run() {
  await rm(outdir, { recursive: true, force: true });
  await mkdir(outdir, { recursive: true });

  if (watch) {
    const ctx = await context(options);
    await ctx.watch();
    await copyStatic();
    console.log("PromptOS extension: watching for changes…");
  } else {
    await build(options);
    await copyStatic();
    console.log(`PromptOS extension built → ${outdir}`);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
