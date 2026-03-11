import "./common.mjs";
import path from "path";
import { readJson } from "./common.mjs";
import { requiredGelFields } from "./config.mjs";

const getArgValue = (flag) => {
  const idx = process.argv.findIndex((arg) => arg === flag);
  if (idx === -1) {
    return null;
  }
  return process.argv[idx + 1] ?? null;
};

const isEmpty = (value) => {
  if (value == null) {
    return true;
  }
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  if (typeof value === "string") {
    return value.trim().length === 0;
  }
  return false;
};

const run = async () => {
  const inputPath =
    getArgValue("--input") || path.resolve("data", "fuel-gels-curated.json");
  const strict = getArgValue("--strict") === "true";

  const items = await readJson(inputPath);
  if (!Array.isArray(items)) {
    console.error("Input must be an array.");
    process.exit(1);
  }

  const missing = [];

  for (const item of items) {
    const missingFields = requiredGelFields.filter((field) => isEmpty(item[field]));
    if (missingFields.length) {
      missing.push({
        name: item.name,
        brand: item.brand,
        missing: missingFields
      });
    }
  }

  if (missing.length) {
    console.log(`Missing required fields on ${missing.length} gels.`);
    for (const entry of missing.slice(0, 15)) {
      console.log(`- ${entry.brand} ${entry.name}: ${entry.missing.join(", ")}`);
    }
    if (strict) {
      process.exit(1);
    }
  } else {
    console.log("All gels have required fields.");
  }
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
