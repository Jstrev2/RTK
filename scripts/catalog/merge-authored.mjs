// Merge + validate the agent-authored brand JSON files into one catalog file.
// Usage: node scripts/catalog/merge-authored.mjs <dir-with-brand-json> [out-file]
import fs from "fs/promises";
import path from "path";

const USAGE = new Set(["daily_trainer", "long_run", "speed_work", "race_day", "recovery_runs"]);
const STRIKE = new Set(["heel", "midfoot", "forefoot"]);
const CADENCE = new Set(["low", "average", "high"]);
const TOE = new Set(["narrow", "standard", "wide", "extra_wide"]);
const CUSHION = new Set(["minimal", "moderate", "maximum"]);
const STABILITY = new Set(["neutral", "mild", "moderate", "motion_control"]);
const WEIGHT_RANGE = new Set(["lightweight", "heavyweight", "all"]);

const srcDir = process.argv[2];
const outFile = process.argv[3] ?? path.resolve("data", "shoe-models-authored.json");

if (!srcDir) {
  console.error("Usage: node scripts/catalog/merge-authored.mjs <dir> [out-file]");
  process.exit(1);
}

const errors = [];
const warnings = [];
const byKey = new Map();

const checkEnum = (file, key, field, value, allowed) => {
  if (!allowed.has(value)) {
    errors.push(`${file} ${key}: bad ${field} "${value}"`);
  }
};

const checkEnumArray = (file, key, field, values, allowed) => {
  if (!Array.isArray(values) || !values.length) {
    errors.push(`${file} ${key}: ${field} empty or not an array`);
    return;
  }
  for (const v of values) {
    if (!allowed.has(v)) errors.push(`${file} ${key}: bad ${field} entry "${v}"`);
  }
};

const files = (await fs.readdir(srcDir)).filter((f) => f.endsWith(".json"));
if (!files.length) {
  console.error(`No JSON files found in ${srcDir}`);
  process.exit(1);
}

for (const file of files) {
  const raw = await fs.readFile(path.join(srcDir, file), "utf8");
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    errors.push(`${file}: JSON parse error — ${e.message}`);
    continue;
  }
  if (!Array.isArray(parsed)) {
    errors.push(`${file}: expected top-level array`);
    continue;
  }

  for (const shoe of parsed) {
    const key = shoe.item_key ?? "(missing key)";

    if (!shoe.item_key || !/^[a-z0-9-]+$/.test(shoe.item_key)) {
      errors.push(`${file} ${key}: bad item_key`);
    }
    if (!shoe.name || !shoe.brand) {
      errors.push(`${file} ${key}: missing name/brand`);
      continue;
    }
    const lname = shoe.name.toLowerCase();
    const lbrand = shoe.brand.toLowerCase();
    if (!lname.startsWith(lbrand)) {
      warnings.push(`${file} ${key}: name doesn't start with brand ("${shoe.name}")`);
    }
    if (lname.startsWith(`${lbrand} ${lbrand}`)) {
      errors.push(`${file} ${key}: duplicated brand in name ("${shoe.name}")`);
    }

    if (!Number.isFinite(shoe.price) || shoe.price < 60 || shoe.price > 500) {
      errors.push(`${file} ${key}: implausible price ${shoe.price}`);
    }
    if (!Number.isFinite(shoe.stack) || shoe.stack < 10 || shoe.stack > 60) {
      errors.push(`${file} ${key}: implausible stack ${shoe.stack}`);
    }
    if (!Number.isFinite(shoe.drop) || shoe.drop < 0 || shoe.drop > 14) {
      errors.push(`${file} ${key}: implausible drop ${shoe.drop}`);
    }
    // Floor is 3oz, not 4: the lightest real racers (Adios Pro Evo 3, 97g) sit near 3.4oz.
    if (!Number.isFinite(shoe.weight_mens) || shoe.weight_mens < 3 || shoe.weight_mens > 14) {
      errors.push(`${file} ${key}: implausible weight_mens ${shoe.weight_mens}`);
    }
    if (!Number.isFinite(shoe.weight_womens) || shoe.weight_womens < 3 || shoe.weight_womens > 13) {
      errors.push(`${file} ${key}: implausible weight_womens ${shoe.weight_womens}`);
    }
    if (!shoe.description || shoe.description.length < 40) {
      errors.push(`${file} ${key}: description missing/too short`);
    }
    if (!Array.isArray(shoe.pros) || shoe.pros.length < 2) {
      errors.push(`${file} ${key}: needs >=2 pros`);
    }
    if (!Array.isArray(shoe.cons) || shoe.cons.length < 1) {
      errors.push(`${file} ${key}: needs >=1 con`);
    }
    if (!Number.isFinite(shoe.popularity) || shoe.popularity < 0 || shoe.popularity > 100) {
      errors.push(`${file} ${key}: bad popularity`);
    }
    if (![2024, 2025, 2026].includes(shoe.release_year)) {
      warnings.push(`${file} ${key}: release_year ${shoe.release_year} outside 2024-2026`);
    }
    if (shoe.product_url) {
      warnings.push(`${file} ${key}: product_url set (should be null) — dropping`);
      shoe.product_url = null;
    }

    checkEnumArray(file, key, "usage_types", shoe.usage_types, USAGE);
    checkEnumArray(file, key, "foot_strike", shoe.foot_strike, STRIKE);
    checkEnumArray(file, key, "cadence", shoe.cadence, CADENCE);
    checkEnum(file, key, "toe_box", shoe.toe_box, TOE);
    checkEnum(file, key, "cushion", shoe.cushion, CUSHION);
    checkEnum(file, key, "stability", shoe.stability, STABILITY);
    checkEnum(file, key, "weight_range", shoe.weight_range, WEIGHT_RANGE);
    if (JSON.stringify(shoe.surfaces) !== '["road"]') {
      warnings.push(`${file} ${key}: surfaces normalized to ["road"]`);
      shoe.surfaces = ["road"];
    }

    if (byKey.has(shoe.item_key)) {
      errors.push(`${file} ${key}: duplicate item_key across files`);
    } else {
      byKey.set(shoe.item_key, shoe);
    }
  }
}

const shoes = Array.from(byKey.values()).sort((a, b) =>
  a.brand === b.brand ? a.name.localeCompare(b.name) : a.brand.localeCompare(b.brand)
);

const brandCounts = {};
for (const s of shoes) brandCounts[s.brand] = (brandCounts[s.brand] ?? 0) + 1;

console.log(`Files: ${files.length}`);
console.log(`Shoes: ${shoes.length}`);
console.log("By brand:", JSON.stringify(brandCounts, null, 2));
if (warnings.length) {
  console.log(`\nWarnings (${warnings.length}):`);
  warnings.forEach((w) => console.log("  ~", w));
}
if (errors.length) {
  console.error(`\nERRORS (${errors.length}):`);
  errors.forEach((e) => console.error("  !", e));
  process.exit(1);
}

await fs.writeFile(outFile, JSON.stringify(shoes, null, 2));
console.log(`\nWrote ${shoes.length} shoes to ${outFile}`);
