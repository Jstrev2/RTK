import { NextResponse } from "next/server";
import { runGuideSync } from "@/lib/guide-publish";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * Publishes whatever guides are on GitHub's main branch. The guide-writing
 * routine calls this right after it merges, so new guides go live in
 * seconds; the daily cron runs the same sync as a fallback.
 *
 * Open to anyone on purpose (the routine holds no secrets): it reads one
 * fixed file from the public repo, only adds or updates articles that are
 * in that file, never removes one, and runs at most once every two minutes.
 */

let lastRun = 0;
const THROTTLE_MS = 2 * 60 * 1000;

// GET as well as POST, so a caller that can only fetch pages can trigger it.
export const GET = POST;

export async function POST() {
  if (Date.now() - lastRun < THROTTLE_MS) {
    return NextResponse.json({ ok: true, skipped: "ran recently" });
  }
  lastRun = Date.now();
  return NextResponse.json(...(await runGuideSync()));
}
