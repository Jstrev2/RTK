import { NextResponse } from "next/server";
import { isAuthorized } from "@/lib/ingest/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Triggers shoe import from shoe_models data already in Supabase.
 * This route is mainly a health check / status endpoint for the catalog pipeline.
 * The actual heavy import is done by `scripts/import-shoe-models.mjs`.
 */
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ ok: false, error: "Supabase not configured" }, { status: 500 });
    }

    const { count: totalShoes } = await supabase
      .from("shoe_models")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    const { count: candidates } = await supabase
      .from("shoe_candidates")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    const { count: mentions } = await supabase
      .from("catalog_mentions")
      .select("*", { count: "exact", head: true })
      .eq("item_type", "shoe");

    return NextResponse.json({
      ok: true,
      stats: {
        activeShoes: totalShoes ?? 0,
        pendingCandidates: candidates ?? 0,
        trackedMentions: mentions ?? 0,
      },
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
