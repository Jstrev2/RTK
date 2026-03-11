import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "..", ".env.local");
const env = fs.readFileSync(envPath, "utf8");
const vars = {};
for (const line of env.split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) vars[m[1].trim()] = m[2].trim();
}

const sb = createClient(vars.NEXT_PUBLIC_SUPABASE_URL, vars.SUPABASE_SERVICE_ROLE_KEY);

const { data, error } = await sb
  .from("shoe_models")
  .select("item_key, name, brand, release_date, release_year")
  .eq("is_active", true)
  .is("price", null)
  .is("description", null)
  .lte("release_date", "2026-03-04");

if (error) { console.error(error); process.exit(1); }

const seeds = data.map(s => ({
  name: s.name,
  brand: s.brand,
  item_key: s.item_key,
  release_date: s.release_date,
  release_year: s.release_year
}));

const outPath = path.resolve(__dirname, "..", "data", "skeleton-seeds.json");
fs.writeFileSync(outPath, JSON.stringify(seeds, null, 2));
console.log(`Exported ${seeds.length} skeleton seeds`);
seeds.forEach(s => console.log(`  ${s.brand} - ${s.name}`));
