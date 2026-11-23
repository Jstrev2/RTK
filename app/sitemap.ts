import type { MetadataRoute } from "next";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { GUIDE_TOPICS } from "@/lib/guides";
import { getShoeContentSitemapEntries } from "@/lib/content/shoes";
import { getMusicContentSitemapEntries } from "@/lib/content/music";
import { getFuelContentSitemapEntries } from "@/lib/content/fuel";

export const revalidate = 21600;

type Entries = MetadataRoute.Sitemap;

// A generator that fails (database hiccup) drops out of this sitemap rather
// than taking the whole file down.
async function safe(load: () => Promise<Entries>): Promise<Entries> {
  try {
    return await load();
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<Entries> {
  const baseUrl = "https://runnertoolkit.com";

  // No lastModified on static pages: stamping new Date() on every build marks
  // everything "just modified" and trains crawlers to ignore the field.
  const staticPages: Entries = [
    { url: baseUrl, changeFrequency: "daily", priority: 1.0 },
    { url: `${baseUrl}/tools/shoe-selector`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/tools/music`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/tools/fueling`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/rundown`, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/shoes`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/tools/pace-calculator`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/tools/attire-guide`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/methodology`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/about`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/terms`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const supabase = getSupabaseAdmin();

  // Only active shoes: the detail route 404s inactive item_keys, and a sitemap
  // full of 404s burns crawl trust.
  const shoePages = await safe(async () => {
    if (!supabase) return [];
    const { data } = (await supabase
      .from("shoe_models")
      .select("item_key, updated_at")
      .eq("is_active", true)
      .order("item_key")) as { data: { item_key: string; updated_at: string | null }[] | null };
    return (data ?? []).map((shoe) => ({
      url: `${baseUrl}/shoes/${shoe.item_key}`,
      ...(shoe.updated_at ? { lastModified: new Date(shoe.updated_at) } : {}),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));
  });

  const guidePages = await safe(async () => {
    if (!supabase) return [];
    const rows: { slug: string; published_at: string; updated_at: string | null; tags: string[] }[] = [];
    for (let from = 0; ; from += 1000) {
      const { data } = (await supabase
        .from("articles")
        .select("slug, published_at, updated_at, tags")
        .eq("is_published", true)
        .order("published_at", { ascending: false })
        .range(from, from + 999)) as { data: typeof rows | null };
      rows.push(...(data ?? []));
      if (!data || data.length < 1000) break;
    }
    const usedTags = new Set(rows.flatMap((row) => row.tags.map((tag) => tag.toLowerCase())));
    return [
      ...rows.map((article) => ({
        url: `${baseUrl}/rundown/${article.slug}`,
        lastModified: new Date(article.updated_at ?? article.published_at),
        changeFrequency: "monthly" as const,
        priority: 0.7,
      })),
      ...GUIDE_TOPICS.filter((topic) => usedTags.has(topic.tag)).map((topic) => ({
        url: `${baseUrl}/rundown/tag/${topic.tag}`,
        changeFrequency: "daily" as const,
        priority: 0.6,
      })),
    ];
  });

  // Data pages generated from the database. Each generator includes its hub.
  const [shoeContent, musicContent, fuelContent] = await Promise.all([
    safe(getShoeContentSitemapEntries),
    safe(getMusicContentSitemapEntries),
    safe(getFuelContentSitemapEntries),
  ]);

  return [...staticPages, ...shoePages, ...guidePages, ...shoeContent, ...musicContent, ...fuelContent];
}
