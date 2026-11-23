// Apply the fuel catalog and its photos from this computer.
//
//   node scripts/fuel-catalog.mjs sync [--dry] [--big]   sync data/fuel-catalog.json (the local file) into fuel_gels
//   node scripts/fuel-catalog.mjs images [--all] [key ...] store official photos (missing ones, --all, or the keys given)
//
// The daily cron does both on its own from the file on GitHub's main; this is
// for the first load and for repairs. --big lifts the per-run add/remove
// limits (the first load adds the whole catalog at once).
// Runs the same TypeScript modules as the cron (Node 22.18+ strips the types).
import "./load-env.mjs";
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { syncFuelCatalog, FUEL_LIMITS } from "../lib/fuel-sync.ts";
import { fillFuelImages } from "../lib/fuel-images.ts";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});
const [command, ...rest] = process.argv.slice(2);
const flags = new Set(rest.filter((a) => a.startsWith("--")));
const keys = rest.filter((a) => !a.startsWith("--"));

if (command === "sync") {
  const file = JSON.parse(readFileSync(new URL("../data/fuel-catalog.json", import.meta.url), "utf8"));
  const limits = flags.has("--big") ? { ...FUEL_LIMITS, maxAdded: 1000, maxRemoved: 1000 } : FUEL_LIMITS;
  const result = await syncFuelCatalog(supabase, { file, dryRun: flags.has("--dry"), limits });
  console.log(JSON.stringify(result, null, 1));
  process.exitCode = result.ok ? 0 : 1;
} else if (command === "images") {
  let todo = keys;
  if (flags.has("--all")) {
    const { data } = await supabase.from("fuel_gels").select("item_key").eq("is_active", true);
    todo = data.map((r) => r.item_key);
  }
  const result = await fillFuelImages(supabase, { limit: 1000, keys: todo.length ? todo : undefined });
  console.log(`filled ${result.filled.length}, failed ${result.failed.length}`);
  for (const f of result.failed) console.log(`  ${f.key}: ${f.reason}`);
  process.exitCode = result.ok ? 0 : 1;
} else {
  console.error("usage: node scripts/fuel-catalog.mjs sync [--dry] [--big] | images [--all] [key ...]");
  process.exit(2);
}
