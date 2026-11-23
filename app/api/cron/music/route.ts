import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAuthorized } from "@/lib/ingest/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { runDailyMusicIngest } from "@/lib/music/ingest";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * The song library's own daily job (see vercel.json), so it gets a full
 * minute instead of whatever the shoe and fuel work leave in /api/cron/daily:
 * new chart and running-playlist songs with their BPM, BPM retries, and
 * Spotify ids for songs that don't have one yet.
 *
 * Same auth as the daily job: Vercel's scheduler (CRON_SECRET when set,
 * otherwise its user agent, throttled), or the ingest secret.
 */

let lastUnsecuredRun = 0;
const THROTTLE_MS = 10 * 60 * 1000;

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    const fromScheduler = (request.headers.get("user-agent") ?? "").startsWith("vercel-cron/");
    if (process.env.CRON_SECRET || !fromScheduler) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    if (Date.now() - lastUnsecuredRun < THROTTLE_MS) {
      return NextResponse.json({ ok: true, skipped: "ran recently" });
    }
    lastUnsecuredRun = Date.now();
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ ok: false, error: "Supabase not configured" }, { status: 500 });

  const music = await runDailyMusicIngest(supabase, 50_000).catch((error) => ({ ok: false, error: (error as Error).message }));
  if ("added" in music && music.added.length) {
    revalidatePath("/api/music/library");
    revalidatePath("/music");
  }
  return NextResponse.json({ ok: true, music });
}
