import "./common.mjs";
import { spawn } from "child_process";
import path from "path";

const runStep = (label, args) =>
  new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { stdio: "inherit" });
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`${label} failed with code ${code}`));
      } else {
        resolve();
      }
    });
  });

const run = async () => {
  const base = path.resolve("scripts", "catalog");
  const discoverScript = process.env.SERPAPI_API_KEY
    ? "discover-attire.mjs"
    : "discover-attire-free.mjs";
  await runStep("discover-attire", [path.join(base, discoverScript)]);
  await runStep("enrich-attire", [path.join(base, "enrich-attire.mjs")]);
  await runStep("validate-attire", [path.join(base, "validate-attire.mjs"), "--strict", "true"]);
  await runStep("import-attire", [
    path.resolve("scripts", "import-attire-items.mjs"),
    path.resolve("data", "attire-items-curated.json")
  ]);
  await runStep("upload-attire-images", [
    path.resolve("scripts", "upload-attire-images.mjs")
  ]);
  console.log("Attire pipeline completed.");
};

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
