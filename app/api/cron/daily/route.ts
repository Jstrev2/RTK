import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { isAuthorized } from "@/lib/ingest/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { syncShoeCatalog } from "@/lib/catalog-sync";
import { fillMissingShoeImages } from "@/lib/ingest/shoe-images";
import { runGuideSync } from "@/lib/guide-publish";
import { submitToIndexNow } from "@/lib/indexnow";
import { SITE_URL } from "@/lib/seo";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * The one scheduled job (see vercel.json). Each day it:
 *   1. syncs the shoe catalog from GitHub into the database,
 *   2. gives a few active shoes without a photo one (lib/ingest/shoe-images),
 *      so a shoe the catalog adds shows its picture within a day or two,
 *   3. tells search engines about any shoe pages that changed,
 *   4. publishes any guides on GitHub that are not live yet,
 *   5. as a side effect, touches the database so Supabase's free tier never
 *      pauses the project for inactivity.
 *
 * Auth: when CRON_SECRET is set in Vercel, Vercel's scheduler sends it and
 * nothing else gets in. Until it is set, the scheduler's user agent is
 * accepted instead. That header can be spoofed, which is why the job is safe
 * to run by anyone: it reads one fixed file, only writes differences, and
 * refuses large changes. The throttle keeps a spoofer from running up usage.
 */

let lastUnsecuredRun = 0;
const THROTTLE_MS = 10 * 60 * 1000;

export async function GET(request: Request) {
  const authorized = isAuthorized(request);
  if (!authorized) {
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
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Supabase not configured" }, { status: 500 });
  }

  const dryRun = authorized && new URL(request.url).searchParams.get("dry") === "1";

  try {
    const catalog = await syncShoeCatalog(supabase, { dryRun });

    // New shoes arrive without a photo; fetch a few each day (about 20 s).
    const images = dryRun
      ? { skipped: "dry run" }
      : await fillMissingShoeImages(supabase, { limit: 3, budgetMs: 20000 }).catch((error) => ({
          error: (error as Error).message
        }));
    const pictured = "stored" in images ? images.stored : [];

    const synced = catalog.ok ? [...catalog.added, ...catalog.updated, ...catalog.reactivated, ...catalog.deactivated] : [];
    const touched = [...new Set([...synced, ...pictured])];
    let indexNow: Awaited<ReturnType<typeof submitToIndexNow>> | null = null;
    if (!dryRun && touched.length) {
      // Refresh the cached pages now rather than waiting out the ISR window,
      // then let search engines know.
      for (const key of touched) revalidatePath(`/shoes/${key}`);
      revalidateTag("shoes");
      revalidatePath("/shoes");
      revalidatePath("/sitemap.xml");
      indexNow = await submitToIndexNow([
        `${SITE_URL}/shoes`,
        ...touched.map((key) => `${SITE_URL}/shoes/${key}`)
      ]);
    }

    // Guides publish themselves when the writing routine merges; this is the
    // fallback in case its call to /api/guides/sync didn't land.
    const [guides] = dryRun ? [{ skipped: "dry run" }] : await runGuideSync().catch((error) => [{ ok: false, error: (error as Error).message }]);

    return NextResponse.json({ ok: catalog.ok, catalog, images, indexNow, guides }, { status: catalog.ok ? 200 : 500 });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
