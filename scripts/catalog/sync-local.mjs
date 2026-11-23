/**
 * Applies the local data/shoe-models-authored.json to the database with the
 * same checks and limits as the daily cron (lib/catalog-sync.ts), without
 * waiting for the file to reach GitHub's main branch.
 *
 *   node scripts/catalog/sync-local.mjs --dry   show what would change
 *   node scripts/catalog/sync-local.mjs         apply it
 */
import "../load-env.mjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { syncShoeCatalog } from "../../lib/catalog-sync.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const rows = JSON.parse(fs.readFileSync(path.join(root, "data", "shoe-models-authored.json"), "utf8"));
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});
const result = await syncShoeCatalog(supabase, { dryRun: process.argv.includes("--dry"), rows });
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
