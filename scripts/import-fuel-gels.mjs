import "./load-env.mjs";
import fs from "fs/promises";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const filePath = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve("data", "fuel-gels-curated.json");

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const normalizeArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  }
  if (!value) {
    return [];
  }
  return [value];
};

const normalizeRow = (item) => {
  const name = item.name?.trim();
  const brand = item.brand?.trim();
  if (!name || !brand) {
    return null;
  }
  return {
    item_key: item.item_key ?? slugify(`${brand} ${name}`),
    brand,
    name,
    carbs_g: item.carbs_g ?? null,
    caffeine_mg: item.caffeine_mg ?? null,
    sodium_mg: item.sodium_mg ?? null,
    calories: item.calories ?? null,
    flavors: normalizeArray(item.flavors),
    notes: item.notes ?? null,
    image_url: item.image_url ?? null,
    image_source: item.image_source ?? null,
    product_url: item.product_url ?? null,
    is_active: item.is_active ?? true,
    updated_at: new Date().toISOString()
  };
};

const chunk = (list, size) => {
  const batches = [];
  for (let i = 0; i < list.length; i += size) {
    batches.push(list.slice(i, i + size));
  }
  return batches;
};

const run = async () => {
  const raw = await fs.readFile(filePath, "utf8");
  const items = JSON.parse(raw);

  if (!Array.isArray(items) || items.length === 0) {
    console.error("No gel items found in file:", filePath);
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const normalized = items.map(normalizeRow).filter(Boolean);
  const deduped = new Map();

  for (const row of normalized) {
    deduped.set(row.item_key, row);
  }

  const rows = Array.from(deduped.values());
  const batches = chunk(rows, 200);

  for (const batch of batches) {
    const { error } = await supabase.from("fuel_gels").upsert(batch, {
      onConflict: "item_key"
    });

    if (error) {
      console.error("Upsert failed:", error.message);
      process.exit(1);
    }
  }

  console.log(`Imported ${rows.length} gels from ${filePath}.`);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
