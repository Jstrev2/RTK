import "./load-env.mjs";
import fs from "fs/promises";
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

const parseRow = (line) => {
  // Match: ('key', 'name', 'brand', 'category', 'gender', price, ARRAY[...], ARRAY[...], ARRAY[...], true)
  const match = line.match(/^\('([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*(\d+|NULL),\s*ARRAY\[([^\]]*)\],\s*ARRAY\[([^\]]*)\],\s*ARRAY\[([^\]]*)\],\s*(true|false)\)/);
  if (!match) return null;

  const parseArray = (str) => str.split(",").map(s => s.trim().replace(/^'|'$/g, "")).filter(Boolean);

  return {
    item_key: match[1],
    name: match[2],
    brand: match[3].replace(/''/g, "'"),
    category: match[4],
    gender: match[5],
    price: match[6] === "NULL" ? null : Number(match[6]),
    personas: parseArray(match[7]),
    weather: parseArray(match[8]),
    features: parseArray(match[9]),
    is_active: match[10] === "true"
  };
};

const run = async () => {
  const sql = await fs.readFile("data/attire-seed.sql", "utf8");
  const lines = sql.split("\n");
  const rows = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("('")) {
      const row = parseRow(trimmed.replace(/[,;]$/, ""));
      if (row) rows.push(row);
    }
  }

  console.log(`Parsed ${rows.length} attire items.`);

  // Batch upsert
  const batchSize = 50;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase.from("attire_items").upsert(batch, { onConflict: "item_key" });
    if (error) {
      console.error(`Batch ${i / batchSize + 1} error:`, error.message);
    } else {
      console.log(`Batch ${i / batchSize + 1}: ${batch.length} items`);
    }
  }

  console.log("Done.");
};

run().catch((err) => { console.error(err); process.exit(1); });
