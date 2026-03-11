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

const inputFiles = process.argv.slice(2);
const filePaths = inputFiles.length
  ? inputFiles.map((file) => path.resolve(file))
  : [path.resolve("data", "shoe-models-complete.json")];

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const deriveItemKey = (item) => {
  if (item.item_key) {
    return item.item_key;
  }
  // Name typically already includes the brand (e.g. "Nike Pegasus 42"),
  // so just slugify the name to avoid double-brand keys.
  return slugify(item.name ?? "");
};

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
  const releaseDate = item.release_date ?? item.releaseDate ?? null;
  const releaseYear =
    item.release_year ??
    item.releaseYear ??
    (releaseDate ? new Date(releaseDate).getUTCFullYear() : null);

  return {
    item_key: deriveItemKey(item),
    name: item.name,
    brand: item.brand,
    price: item.price ?? null,
    usage_types: normalizeArray(item.usage_types ?? item.usageTypes),
    foot_strike: normalizeArray(item.foot_strike ?? item.footStrike),
    cadence: normalizeArray(item.cadence),
    toe_box: item.toe_box ?? item.toeBox ?? null,
    cushion: item.cushion ?? null,
    stability: item.stability ?? null,
    surfaces: normalizeArray(item.surfaces),
    weight_range: item.weight_range ?? item.weightRange ?? null,
    stack: item.stack ?? null,
    drop: item.drop ?? null,
    weight_mens: item.weight_mens ?? item.weightMens ?? null,
    weight_womens: item.weight_womens ?? item.weightWomens ?? null,
    description: item.description ?? null,
    pros: normalizeArray(item.pros),
    cons: normalizeArray(item.cons),
    popularity: item.popularity ?? 0,
    release_date: releaseDate,
    release_year: releaseYear,
    image_url: item.image_url ?? item.imageUrl ?? null,
    image_path: item.image_path ?? item.imagePath ?? null,
    image_source: item.image_source ?? item.imageSource ?? null,
    product_url: item.product_url ?? item.productUrl ?? null,
    retailer_url: item.retailer_url ?? item.retailerUrl ?? null,
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
  const items = [];

  for (const filePath of filePaths) {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      console.error("Expected an array of shoe models in file:", filePath);
      process.exit(1);
    }
    items.push(...parsed);
  }

  if (!items.length) {
    console.error("No shoe models found in files:", filePaths.join(", "));
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const normalized = items.map(normalizeRow).filter((row) => row.name && row.brand);
  const deduped = new Map();
  for (const row of normalized) {
    deduped.set(row.item_key, row);
  }

  const rows = Array.from(deduped.values());
  const batches = chunk(rows, 200);

  for (const batch of batches) {
    const { error } = await supabase.from("shoe_models").upsert(batch, {
      onConflict: "item_key"
    });

    if (error) {
      console.error("Upsert failed:", error.message);
      process.exit(1);
    }
  }

  console.log(`Imported ${rows.length} shoe models from ${filePaths.join(", ")}.`);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
