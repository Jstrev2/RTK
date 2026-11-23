// Gate for the fuel catalog (data/fuel-catalog.json). The monthly fuel audit
// routine (scripts/catalog/ROUTINE-fuel.md) runs it on its own PR and merges
// only when it passes. No dependencies: runs on a bare checkout with any Node 18+.
//
//   node scripts/catalog/check-fuel.mjs                       (check the file)
//   node scripts/catalog/check-fuel.mjs --base base.json      (also check the change against main's copy)
//
// The rules and limits mirror lib/fuel-sync.ts, which enforces them again
// before anything reaches the database.
import { readFileSync } from "node:fs";

const arg = (flag) => {
  const index = process.argv.indexOf(flag);
  return index === -1 ? null : process.argv[index + 1];
};
const headPath = arg("--head") ?? "data/fuel-catalog.json";
const basePath = arg("--base");

const TYPES = ["gel", "chew", "drink", "bar", "electrolyte"];
const MIN_ROWS = 80;
const MAX_REMOVED = 12;
const MAX_ADDED = 40;

const problems = [];
const warnings = [];
const load = (file) => {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    problems.push(`${file}: not valid JSON (${error.message})`);
    return [];
  }
};
const isNum = (v) => typeof v === "number" && Number.isFinite(v);

const head = load(headPath);
if (!Array.isArray(head)) problems.push("catalog is not an array");
else {
  if (head.length < MIN_ROWS) problems.push(`only ${head.length} rows (minimum ${MIN_ROWS})`);
  const seen = new Set();
  const names = new Set();
  for (const row of head) {
    const key = row?.item_key;
    if (typeof key !== "string" || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(key)) {
      problems.push(`bad item_key: ${String(key)}`);
      continue;
    }
    if (seen.has(key)) problems.push(`duplicate item_key: ${key}`);
    seen.add(key);
    const fullName = `${row.brand} ${row.name}`.toLowerCase();
    if (names.has(fullName)) problems.push(`${key}: same brand and name as another row`);
    names.add(fullName);
    for (const field of ["brand", "name", "serving_size"]) {
      if (typeof row[field] !== "string" || !row[field].trim()) problems.push(`${key}: missing ${field}`);
    }
    if (typeof row.name === "string" && row.name.length > 70) problems.push(`${key}: name longer than 70 characters`);
    if (typeof row.name === "string" && typeof row.brand === "string" && row.name.toLowerCase().startsWith(row.brand.toLowerCase() + " ")) {
      problems.push(`${key}: name repeats the brand (write "${row.name.slice(row.brand.length + 1)}")`);
    }
    if (!TYPES.includes(row.product_type)) problems.push(`${key}: product_type must be one of ${TYPES.join(", ")}`);
    for (const field of ["carbs_g", "caffeine_mg", "sodium_mg", "calories"]) {
      if (!isNum(row[field])) problems.push(`${key}: ${field} must be a number`);
    }
    const carbs = Number(row.carbs_g);
    const kcal = Number(row.calories);
    if (carbs < 0 || carbs > 150) problems.push(`${key}: carbs_g ${carbs} out of range`);
    if (Number(row.caffeine_mg) < 0 || Number(row.caffeine_mg) > 300) problems.push(`${key}: caffeine_mg out of range`);
    if (Number(row.sodium_mg) < 0 || Number(row.sodium_mg) > 2000) problems.push(`${key}: sodium_mg out of range`);
    if (kcal < 0 || kcal > 600) problems.push(`${key}: calories out of range`);
    if (carbs >= 10 && kcal < carbs * 2.5) problems.push(`${key}: ${kcal} kcal is too few for ${carbs}g carbs`);
    if (row.product_type !== "electrolyte" && carbs < 10) problems.push(`${key}: under 10g carbs, so product_type must be electrolyte`);
    if (/caffein|\bcaf\b|espresso|coffee|\bcola\b/i.test(row.name ?? "") && row.caffeine_mg === 0 && !/decaf|free/i.test(row.name)) {
      warnings.push(`${key}: name suggests caffeine but caffeine_mg is 0`);
    }
    if (row.price_usd != null && (!isNum(row.price_usd) || row.price_usd <= 0 || row.price_usd > 25)) {
      problems.push(`${key}: price_usd must be a per-serving price in dollars or null`);
    }
    if (!Array.isArray(row.flavors) || row.flavors.some((f) => typeof f !== "string")) problems.push(`${key}: flavors must be a list of names`);
    if (typeof row.product_url !== "string" || !/^https:\/\//.test(row.product_url)) problems.push(`${key}: product_url must be an https link`);
    if (/amazon\.|rei\.com|walmart\.|runningwarehouse|fleetfeet/i.test(row.product_url ?? "")) {
      problems.push(`${key}: product_url must be the brand's own page, not a retailer`);
    }
    if (row.image_source != null && (typeof row.image_source !== "string" || !/^https:\/\//.test(row.image_source))) {
      problems.push(`${key}: image_source must be an https link or null`);
    }
    if (row.notes != null && (typeof row.notes !== "string" || row.notes.length > 200)) problems.push(`${key}: notes must be one short sentence`);
    if (row.release_note != null && (typeof row.release_note !== "string" || row.release_note.length > 60)) {
      problems.push(`${key}: release_note must be short text or null`);
    }
  }

  if (basePath) {
    const base = load(basePath);
    if (Array.isArray(base)) {
      const before = new Set(base.map((row) => row.item_key));
      const after = new Set(head.map((row) => row.item_key));
      const added = [...after].filter((key) => !before.has(key));
      const removed = [...before].filter((key) => !after.has(key));
      if (added.length > MAX_ADDED) problems.push(`adds ${added.length} products (limit ${MAX_ADDED} per change)`);
      if (removed.length > MAX_REMOVED) problems.push(`removes ${removed.length} products (limit ${MAX_REMOVED} per change)`);
      const baseByKey = new Map(base.map((row) => [row.item_key, row]));
      let changedNumbers = 0;
      for (const row of head) {
        const old = baseByKey.get(row.item_key);
        if (old && ["carbs_g", "caffeine_mg", "sodium_mg", "calories"].some((f) => old[f] !== row[f])) changedNumbers += 1;
      }
      if (changedNumbers > 25) problems.push(`changes nutrition on ${changedNumbers} products in one go (limit 25): split it up`);
      console.log(`Change: +${added.length} -${removed.length}, nutrition changed on ${changedNumbers}.`);
      if (added.length) console.log(`  added: ${added.join(", ")}`);
      if (removed.length) console.log(`  removed: ${removed.join(", ")}`);
    }
  }
}

for (const warning of warnings) console.log(`warning: ${warning}`);
if (problems.length) {
  console.error(`check-fuel: ${problems.length} problem(s)`);
  for (const problem of problems) console.error(`- ${problem}`);
  process.exit(1);
}
console.log(`check-fuel: OK (${Array.isArray(head) ? head.length : 0} products)`);
