import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { syncGuides } from "@/lib/guide-sync";
import { submitToIndexNow } from "@/lib/indexnow";
import { SITE_URL } from "@/lib/seo";

/** Sync guides from GitHub, refresh their pages and tell search engines. */
export async function runGuideSync(): Promise<[Record<string, unknown>, { status: number }]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [{ ok: false, error: "Supabase not configured" }, { status: 500 }];

  const guides = await syncGuides(supabase);
  let indexNow: Awaited<ReturnType<typeof submitToIndexNow>> | null = null;
  const touched = [...guides.added, ...guides.updated];
  if (guides.ok && touched.length) {
    for (const slug of touched) revalidatePath(`/rundown/${slug}`);
    revalidatePath("/rundown");
    revalidatePath("/");
    revalidatePath("/sitemap.xml");
    indexNow = await submitToIndexNow([`${SITE_URL}/rundown`, ...touched.map((slug) => `${SITE_URL}/rundown/${slug}`)]).catch(() => null);
  }
  return [{ ok: guides.ok, guides, indexNow }, { status: guides.ok ? 200 : 500 }];
}
