import "./common.mjs";
import { spawn } from "child_process";
import path from "path";

const runStep = (label, args) =>
  new Promise((resolve, reject) => {
    console.log(`\n--- ${label} ---`);
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
  const skipSeeds = process.env.SHOE_SEEDS_SKIP === "true";
  const skipDiscovery = process.env.SHOE_DISCOVERY_SKIP === "true";
  const strictValidation = process.env.SHOE_VALIDATE_STRICT !== "false";

  // Step 1: Build seed list from multiple sources
  if (!skipSeeds) {
    // 1a: SoleReview release calendar (primary)
    await runStep("build-shoe-seeds (SoleReview)", [
      path.join(base, "build-shoe-seeds.mjs")
    ]);

    // 1b: RunRepeat shoe database
    try {
      await runStep("seed-runrepeat", [path.join(base, "seed-runrepeat.mjs")]);
    } catch (err) {
      console.warn("RunRepeat seeding failed (non-fatal):", err.message);
    }

    // 1c: Running Warehouse catalog
    try {
      await runStep("seed-running-warehouse", [path.join(base, "seed-running-warehouse.mjs")]);
    } catch (err) {
      console.warn("Running Warehouse seeding failed (non-fatal):", err.message);
    }

    // 1d: Promote Reddit-discovered candidates
    try {
      await runStep("seed-candidates", [path.join(base, "seed-candidates.mjs")]);
    } catch (err) {
      console.warn("Candidate promotion failed (non-fatal):", err.message);
    }
  }

  // Step 2: Discover product URLs for seeds
  if (!skipDiscovery) {
    const discoverScript = process.env.SERPAPI_API_KEY
      ? "discover-shoes.mjs"
      : "discover-shoes-free.mjs";
    await runStep("discover-shoes", [path.join(base, discoverScript)]);
  }

  // Step 3: Enrich discovered shoes with specs from product pages
  await runStep("enrich-shoes", [path.join(base, "enrich-shoes.mjs")]);

  // Step 4: Validate enriched data
  await runStep("validate-shoes", [
    path.join(base, "validate-shoes.mjs"),
    "--strict",
    strictValidation ? "true" : "false"
  ]);

  // Step 5: Import into Supabase
  await runStep("import-shoes", [
    path.resolve("scripts", "import-shoe-models.mjs"),
    path.resolve("data", "shoe-models-curated.json")
  ]);

  console.log("\nShoe catalog pipeline completed.");
};

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
