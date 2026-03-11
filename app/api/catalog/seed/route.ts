import { NextResponse } from "next/server";
import { isAuthorized } from "@/lib/ingest/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const maxDuration = 60;

const slugify = (text: string) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

type Seed = {
  item_key: string;
  name: string;
  brand: string;
  release_date: string | null;
  release_year: number | null;
  source: string;
};

/**
 * Fetch the current shoe_models and generate seeds for any that aren't yet tracked.
 * Also checks shoe_candidates for promoted entries.
 * This is the serverless equivalent of the file-based seed scripts.
 */
async function generateSeeds(supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>): Promise<Seed[]> {
  const seeds: Seed[] = [];

  // Source 1: All active shoe_models (ensures DB is the source of truth)
  const { data: shoes } = await supabase
    .from("shoe_models")
    .select("item_key, name, brand, release_date, release_year")
    .eq("is_active", true);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (shoes) {
    for (const shoe of shoes as any[]) {
      seeds.push({
        item_key: shoe.item_key,
        name: shoe.name,
        brand: shoe.brand,
        release_date: shoe.release_date,
        release_year: shoe.release_year,
        source: "shoe_models",
      });
    }
  }

  // Source 2: Approved candidates from Reddit discovery
  const { data: candidates } = await supabase
    .from("shoe_candidates")
    .select("item_key, name, brand")
    .eq("status", "approved");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (candidates) {
    const existingKeys = new Set(seeds.map((s) => s.item_key));
    for (const c of candidates as any[]) {
      if (!existingKeys.has(c.item_key)) {
        seeds.push({
          item_key: c.item_key,
          name: c.name,
          brand: c.brand ?? "",
          release_date: null,
          release_year: null,
          source: "reddit-discovery",
        });
      }
    }
  }

  return seeds;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ ok: false, error: "Supabase not configured" }, { status: 500 });
    }

    const seeds = await generateSeeds(supabase);

    return NextResponse.json({
      ok: true,
      seedCount: seeds.length,
      sources: {
        shoe_models: seeds.filter((s) => s.source === "shoe_models").length,
        reddit: seeds.filter((s) => s.source === "reddit-discovery").length,
      },
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
