// Gate for the monthly catalog audit: the audit routine runs this on its own PR
// and only merges if it passes.
// Compares the PR's catalog against main's and exits non-zero if the change is
// malformed or suspiciously large. No dependencies: runs on a bare checkout.
//
//   node scripts/catalog/check-audit.mjs --base base.json --head data/shoe-models-authored.json
//
// The limits mirror lib/catalog-sync.ts, which enforces them again before
// anything is written to the database.
import { readFileSync } from "node:fs";

const arg = (flag) => {
  const index = process.argv.indexOf(flag);
  return index === -1 ? null : process.argv[index + 1];
};
const basePath = arg("--base");
const headPath = arg("--head");
if (!basePath || !headPath) {
  console.error("usage: check-audit.mjs --base <file> --head <file>");
  process.exit(2);
}

const MIN_ROWS = 250;
const MAX_REMOVED = 8;
const MAX_ADDED = 40;
const REQUIRED = ["item_key", "name", "brand", "price", "usage_types", "cushion", "stability", "description", "release_date", "release_year"];

const problems = [];
const load = (file) => {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    problems.push(`${file}: not valid JSON (${error.message})`);
    return [];
  }
};
const base = load(basePath);
const head = load(headPath);

if (!Array.isArray(head)) problems.push("catalog is not an array");
else {
  if (head.length < MIN_ROWS) problems.push(`only ${head.length} rows (minimum ${MIN_ROWS})`);
  const seen = new Set();
  const today = new Date().toISOString().slice(0, 10);
  for (const row of head) {
    const key = row?.item_key;
    if (typeof key !== "string" || !/^[a-z0-9-]+$/.test(key)) {
      problems.push(`bad item_key: ${String(key)}`);
      continue;
    }
    if (seen.has(key)) problems.push(`duplicate item_key: ${key}`);
    seen.add(key);
    for (const field of REQUIRED) {
      const value = row[field];
      if (value == null || value === "" || (Array.isArray(value) && !value.length)) {
        problems.push(`${key}: missing ${field}`);
      }
    }
    if (row.release_date && !/^\d{4}-\d{2}-\d{2}$/.test(row.release_date)) {
      problems.push(`${key}: bad release_date ${row.release_date}`);
    } else if (row.release_date && row.release_year !== Number(row.release_date.slice(0, 4))) {
      problems.push(`${key}: release_year does not match release_date`);
    }
    if (typeof row.price !== "number" || row.price < 40 || row.price > 600) {
      problems.push(`${key}: implausible price ${row.price}`);
    }
    // A shoe dated more than a year out is a rumour, not a release.
    if (row.release_date && row.release_date > `${Number(today.slice(0, 4)) + 1}${today.slice(4)}`) {
      problems.push(`${key}: release_date ${row.release_date} is more than a year away`);
    }
  }

  const baseKeys = new Set((Array.isArray(base) ? base : []).map((row) => row.item_key));
  const added = [...seen].filter((key) => !baseKeys.has(key));
  const removed = [...baseKeys].filter((key) => !seen.has(key));
  console.log(`rows: ${base.length} -> ${head.length}  (+${added.length} / -${removed.length})`);
  if (added.length) console.log("added:", added.join(", "));
  if (removed.length) console.log("removed:", removed.join(", "));
  if (added.length > MAX_ADDED) problems.push(`adds ${added.length} shoes (limit ${MAX_ADDED})`);
  if (removed.length > MAX_REMOVED) problems.push(`removes ${removed.length} shoes (limit ${MAX_REMOVED})`);
}

if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  for (const problem of problems.slice(0, 50)) console.error(" - " + problem);
  process.exit(1);
}
console.log("catalog audit check passed");
