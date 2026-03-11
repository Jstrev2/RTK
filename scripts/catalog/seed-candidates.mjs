/**
 * Promote high-confidence shoe candidates (discovered from Reddit) into the seed list.
 * Candidates with enough mentions are likely real shoes worth adding to the catalog.
 */
import "./common.mjs";
import { readJson, writeJson } from "./common.mjs";
import { createClient } from "@supabase/supabase-js";
import path from "path";

const MIN_MENTIONS = Number(process.env.CANDIDATE_MIN_MENTIONS ?? "3");

const slugify = (text) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const run = async () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log("Supabase credentials not configured, skipping candidate seeding");
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Fetch pending candidates with enough mentions
  const { data: candidates, error } = await supabase
    .from("shoe_candidates")
    .select("*")
    .eq("status", "pending")
    .gte("mention_count", MIN_MENTIONS)
    .order("mention_score", { ascending: false });

  if (error) {
    console.error("Failed to fetch candidates:", error.message);
    return;
  }

  if (!candidates?.length) {
    console.log(`No candidates with ${MIN_MENTIONS}+ mentions to promote`);
    return;
  }

  console.log(`Found ${candidates.length} candidates to promote`);

  const seedsPath = path.resolve("data", "shoe-seeds.json");
  let existing = [];
  try {
    existing = await readJson(seedsPath);
  } catch {
    existing = [];
  }
  const existingKeys = new Set(existing.map((s) => s.item_key));

  const newSeeds = [];
  const promoted = [];

  for (const candidate of candidates) {
    if (existingKeys.has(candidate.item_key)) {
      promoted.push(candidate.item_key); // Mark as promoted even if already exists
      continue;
    }

    newSeeds.push({
      item_key: candidate.item_key,
      name: candidate.name,
      brand: candidate.brand,
      release_date: null,
      release_year: null,
      source: "reddit-discovery"
    });
    existingKeys.add(candidate.item_key);
    promoted.push(candidate.item_key);
  }

  if (newSeeds.length > 0) {
    const merged = [...existing, ...newSeeds];
    await writeJson(seedsPath, merged);
    console.log(`Added ${newSeeds.length} new seeds from candidates (total: ${merged.length})`);
  }

  // Mark promoted candidates
  if (promoted.length > 0) {
    const { error: updateError } = await supabase
      .from("shoe_candidates")
      .update({ status: "approved" })
      .in("item_key", promoted);

    if (updateError) {
      console.error("Failed to update candidate status:", updateError.message);
    } else {
      console.log(`Marked ${promoted.length} candidates as approved`);
    }
  }
};

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
