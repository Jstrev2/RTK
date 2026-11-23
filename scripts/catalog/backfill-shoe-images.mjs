/**
 * Gives every active shoe a product photo (see lib/ingest/shoe-images.ts).
 *
 *   node scripts/catalog/backfill-shoe-images.mjs            shoes without a photo
 *   node scripts/catalog/backfill-shoe-images.mjs --all      redo every shoe
 *   node scripts/catalog/backfill-shoe-images.mjs --only a,b just these item_keys
 *   node scripts/catalog/backfill-shoe-images.mjs --redo-poor  redo stored photos that are not a clean side view
 *   node scripts/catalog/backfill-shoe-images.mjs --dry      find, don't store
 *   node scripts/catalog/backfill-shoe-images.mjs --sources runningwarehouse,zappos
 *
 * Requests go one at a time with a pause between them. Results, including
 * every shoe it could not find, are written to data/shoe-image-report.json.
 * Node 23+ runs the TypeScript module directly.
 */
import "../load-env.mjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import {
  checkPhoto,
  DEFAULT_SOURCES,
  ensureImageBucket,
  findShoeImage,
  storeShoeImage
} from "../../lib/ingest/shoe-images.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const value = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : null;
};

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

let only = value("--only")?.split(",").map((s) => s.trim()).filter(Boolean);

if (flag("--redo-poor")) {
  // Stored photos that came out as a close-up (heel, outsole, laces) or on a
  // coloured backdrop get another try, this time picking among every photo
  // of the product.
  const { data: stored } = await supabase
    .from("shoe_models")
    .select("item_key,image_url")
    .eq("is_active", true)
    .not("image_url", "is", null)
    .limit(2000);
  only = [];
  for (const row of stored ?? []) {
    const response = await fetch(row.image_url).catch(() => null);
    if (!response?.ok) continue;
    const check = await checkPhoto(Buffer.from(await response.arrayBuffer())).catch(() => null);
    if (check && !check.sideView) only.push(row.item_key);
  }
  console.log(`${only.length} stored photos are not a clean side view: ${only.join(", ")}`);
  if (!only.length) process.exit(0);
}
const sources = value("--sources")?.split(",") ?? DEFAULT_SOURCES;
const dry = flag("--dry");

let query = supabase.from("shoe_models").select("item_key,name,brand,image_url").eq("is_active", true).order("item_key");
if (only) query = query.in("item_key", only);
else if (!flag("--all")) query = query.is("image_url", null);
const { data: shoes, error } = await query.limit(2000);
if (error) {
  console.error(error.message);
  process.exit(1);
}

console.log(`${shoes.length} shoes to do (${sources.join(", ")})${dry ? " [dry run]" : ""}`);
if (!dry) await ensureImageBucket(supabase);

const reportPath = path.join(root, "data", "shoe-image-report.json");
const report = fs.existsSync(reportPath) ? JSON.parse(fs.readFileSync(reportPath, "utf8")) : { found: {}, missing: {} };
const cache = new Map();

let stored = 0;
for (const [i, shoe] of shoes.entries()) {
  process.stdout.write(`[${i + 1}/${shoes.length}] ${shoe.name} ... `);
  try {
    const hit = await findShoeImage(shoe, { cache, sources, delayMs: 1100 });
    if (!hit) {
      console.log("not found");
      report.missing[shoe.item_key] = { name: shoe.name, tried: sources, at: new Date().toISOString() };
      continue;
    }
    console.log(`${hit.source}: ${hit.sourceTitle}`);
    if (dry) continue;
    const saved = await storeShoeImage(supabase, shoe, hit);
    stored++;
    delete report.missing[shoe.item_key];
    report.found[shoe.item_key] = { name: shoe.name, source: hit.source, title: hit.sourceTitle, page: hit.sourceUrl, bytes: saved.bytes };
  } catch (err) {
    console.log(`error: ${err.message}`);
    report.missing[shoe.item_key] = { name: shoe.name, error: err.message, at: new Date().toISOString() };
  }
  if ((i + 1) % 10 === 0) fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n");
}
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n");

const { count: total } = await supabase.from("shoe_models").select("*", { count: "exact", head: true }).eq("is_active", true);
const { count: withImage } = await supabase
  .from("shoe_models")
  .select("*", { count: "exact", head: true })
  .eq("is_active", true)
  .not("image_url", "is", null);
console.log(`\nStored ${stored}. Coverage: ${withImage}/${total} active shoes have a photo.`);
console.log(`Missing: ${Object.keys(report.missing).length} (see data/shoe-image-report.json)`);
