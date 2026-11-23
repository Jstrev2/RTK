import { cache } from "react";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { allPhotos, photoForGuide } from "@/lib/photos";

export interface GuideSummary {
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image: string | null;
  author: string;
  tags: string[];
  published_at: string;
}

/** What a guide card needs on the client: no body, a photo picked on the server. */
export type GuideCard = {
  slug: string;
  title: string;
  excerpt: string | null;
  tags: string[];
  published_at: string;
  photo: { src: string; alt: string };
};

export type TopicChip = { tag: string; label: string; count: number };

/** The topics the guide index is organized by, in menu order. */
export const GUIDE_TOPICS: { tag: string; label: string; blurb: string }[] = [
  { tag: "shoes", label: "Shoes", blurb: "Choosing, fitting, rotating and replacing running shoes, with real prices and specs." },
  { tag: "fueling", label: "Fuel", blurb: "Gels, carbs per hour and how to practice race-day fueling." },
  { tag: "music", label: "Music", blurb: "Cadence, BPM and playlists that fit the run you're about to do." },
  { tag: "race-day", label: "Race day", blurb: "Pacing, shoes, fuel and logistics for the day it counts." },
  { tag: "training", label: "Training", blurb: "Easy runs, long runs, tempo work and the plans around them." },
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
  // "news" pieces keep their pages but stay off the index.
  return rows.filter((guide) => !guide.tags.map((tag) => tag.toLowerCase()).includes("news"));
});

export function guidesForTag(guides: GuideSummary[], tag: string) {
  return guides.filter((guide) => guide.tags.map((t) => t.toLowerCase()).includes(tag));
}

export function tagCounts(guides: GuideSummary[]) {
  const counts: Record<string, number> = {};
  for (const guide of guides) for (const tag of guide.tags) counts[tag.toLowerCase()] = (counts[tag.toLowerCase()] ?? 0) + 1;
  return counts;
}

/** Every running photo, for cards that need an alternative to their first pick. */
export function photoChoices(): { src: string; alt: string }[] {
  return allPhotos().map((photo) => ({ src: photo.src, alt: photo.alt }));
}

export function toCards(guides: GuideSummary[]): GuideCard[] {
  return guides.map((guide) => {
    const photo = photoForGuide(guide.tags, guide.slug);
    return {
      slug: guide.slug,
      title: guide.title,
      excerpt: guide.excerpt,
      tags: guide.tags.map((tag) => tag.toLowerCase()),
      published_at: guide.published_at,
      photo: { src: photo.src, alt: photo.alt }
    };
  });
}

/** Topic chips for the topics that have at least one guide, in menu order. */
export function topicChips(guides: GuideSummary[]): TopicChip[] {
  const counts = tagCounts(guides);
  return GUIDE_TOPICS.filter((topic) => (counts[topic.tag] ?? 0) > 0).map((topic) => ({
    tag: topic.tag,
    label: topic.label,
    count: counts[topic.tag]
  }));
}

/**
 * Every guide opens with a "**Short answer:** ..." paragraph
 * (CONTENT_VOICE.md). The page shows it as a callout above the body.
 */
export function splitShortAnswer(body: string): { shortAnswer: string | null; rest: string } {
  const trimmed = body.replace(/\r\n/g, "\n").trim();
  const match = trimmed.match(/^\*\*Short answer:\*\*\s*([\s\S]+?)(?:\n\s*\n|$)/);
  if (!match) return { shortAnswer: null, rest: trimmed };
  return { shortAnswer: match[1].trim(), rest: trimmed.slice(match[0].length).trim() };
}

export function readingMinutes(body: string) {
  return Math.max(1, Math.round(body.split(/\s+/).filter(Boolean).length / 230));
}
