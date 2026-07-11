import "./load-env.mjs";
import fs from "fs/promises";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing Supabase env vars.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const run = async () => {
  const all = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("shoe_models")
      .select("*")
      .range(from, from + pageSize - 1);
    if (error) {
      console.error("Fetch failed:", error.message);
      process.exit(1);
    }
    all.push(...(data ?? []));
    if (!data || data.length < pageSize) break;
  }

  const stamp = new Date().toISOString().split("T")[0];
  const outDir = path.resolve("data", "backups");
  await fs.mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, `shoe-models-backup-${stamp}.json`);
  await fs.writeFile(outPath, JSON.stringify(all, null, 2));
  console.log(`Backed up ${all.length} shoe_models rows to ${outPath}`);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
