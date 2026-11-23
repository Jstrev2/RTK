// Runs a TypeScript music script with the app's own lib/ code:
//   node scripts/music/run.mjs backfill [stage]
//   node scripts/music/run.mjs validate-tempo
// It bundles scripts/music/<name>.ts with esbuild (resolving "@/..." through
// tsconfig) into .tmp/music/ and runs it with .env.local loaded.
import "../load-env.mjs";
import { build } from "esbuild";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const name = process.argv[2];
if (!name) {
  console.error("usage: node scripts/music/run.mjs <script> [args]");
  process.exit(1);
}
// One file per run, so two scripts started together never share a bundle.
const outfile = path.join(root, ".tmp", "music", "build", `${name}-${process.pid}.mjs`);
await build({
  entryPoints: [path.join(root, "scripts", "music", `${name}.ts`)],
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node20",
  packages: "external",
  outfile,
  logLevel: "warning",
  tsconfig: path.join(root, "tsconfig.json")
});
process.argv.splice(2, 1);
await import(pathToFileURL(outfile).href);
