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
  : path.resolve("data", "music-songs-discovered.json");

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

const defaultEnergy = (bpm) => {
  if (!bpm) {
    return "medium";
  }
  if (bpm >= 175) {
    return "extreme";
  }
  if (bpm >= 155) {
    return "high";
  }
  if (bpm >= 120) {
    return "medium";
  }
  return "low";
};

const normalizeRow = (item) => {
  const title = item.title?.trim();
  const artist = item.artist?.trim();
  if (!title || !artist) {
    return null;
  }
  const bpm = item.bpm ? Number(item.bpm) : null;
  const energy = item.energy ?? defaultEnergy(bpm);
  return {
    item_key: item.item_key ?? slugify(`${artist} ${title}`),
    spotify_id: item.spotify_id ?? null,
    source: item.source ?? null,
    title,
    artist,
    bpm,
    genre: normalizeArray(item.genre),
    energy,
    workout: normalizeArray(item.workout),
    submitted_date: item.submitted_date ?? new Date().toISOString().slice(0, 10),
    upvotes: item.upvotes ?? 0,
    downvotes: item.downvotes ?? 0,
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
    console.error("No songs found in file:", filePath);
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const normalized = items
    .map(normalizeRow)
    .filter(Boolean);

  const deduped = [];
  const seen = new Set();

  for (const row of normalized) {
    const key = row.item_key;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    deduped.push(row);
  }

  const batches = chunk(deduped, 200);

  for (const batch of batches) {
    const { error } = await supabase.from("music_songs").upsert(batch, {
      onConflict: "item_key"
    });

    if (error) {
      console.error("Upsert failed:", error.message);
      process.exit(1);
    }
  }

  console.log(`Imported ${deduped.length} songs from ${filePath}.`);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
