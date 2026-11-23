import { cache } from "react";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export interface GuideSummary {
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image: string | null;
  author: string;
  tags: string[];
  published_at: string;
}

/** The topics the guide index is organized by, in menu order. */
export const GUIDE_TOPICS: { tag: string; label: string; blurb: string }[] = [
  { tag: "shoes", label: "Shoes", blurb: "Choosing, fitting, rotating and replacing running shoes, with real prices and specs." },
  { tag: "music", label: "Music", blurb: "Cadence, BPM and playlists that fit the run you are about to do." },
  { tag: "fueling", label: "Fuel", blurb: "Gels, carbs per hour, hydration and how to practice race-day fueling." },
  { tag: "training", label: "Training", blurb: "Easy runs, long runs, tempo work and the plans around them." },
  { tag: "race-day", label: "Race day", blurb: "Pacing, shoes, fuel and logistics for the day it counts." },
  { tag: "beginners", label: "Beginners", blurb: "Where to start: first shoes, first plans, first races." },
  { tag: "nutrition", label: "Nutrition", blurb: "What to eat before, during and after running." },
  { tag: "gear", label: "Gear", blurb: "Clothing, headphones and the rest of the kit." }
];

export const getGuides = cache(async (): Promise<GuideSummary[]> => {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];
  const rows: GuideSummary[] = [];
  // Page past PostgREST's 1,000-row cap: the routine adds guides every day.
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("articles")
      .select("slug, title, excerpt, cover_image, author, tags, published_at")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .range(from, from + 999);
    if (error) throw new Error(`Failed to load guides: ${error.message}`);
    rows.push(...((data as GuideSummary[]) ?? []));
    if (!data || data.length < 1000) break;
  }
  return rows.filter((guide) => !guide.tags.map((tag) => tag.toLowerCase()).includes("news"));
});

export function guidesForTag(guides: GuideSummary[], tag: string) {
  return guides.filter((guide) => guide.tags.map((t) => t.toLowerCase()).includes(tag));
}
