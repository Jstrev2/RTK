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
    ? "discover-gels.mjs"
    : "discover-gels-free.mjs";
  await runStep("discover-gels", [path.join(base, discoverScript)]);
  await runStep("enrich-gels", [path.join(base, "enrich-gels.mjs")]);
  await runStep("validate-gels", [path.join(base, "validate-gels.mjs")]);
  await runStep("import-gels", [
    path.resolve("scripts", "import-fuel-gels.mjs"),
    path.resolve("data", "fuel-gels-curated.json")
  ]);
  console.log("Gels pipeline completed.");
};

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
