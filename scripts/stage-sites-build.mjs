import { cp, copyFile, mkdir, rm } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = resolve(projectRoot, "dist");
const workerSource = resolve(projectRoot, ".sites-bundle", "worker.js");
const assetsSource = resolve(projectRoot, ".open-next", "assets");

if (!distDir.startsWith(`${projectRoot}${sep}`)) {
  throw new Error("Refusing to stage outside the project directory.");
}

await rm(distDir, { recursive: true, force: true });
await mkdir(resolve(distDir, "server"), { recursive: true });
await mkdir(resolve(distDir, "client"), { recursive: true });
await copyFile(workerSource, resolve(distDir, "server", "index.js"));
await cp(assetsSource, resolve(distDir, "client"), { recursive: true });

console.log("Sites worker bundle staged in dist.");
