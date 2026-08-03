import type { MetadataRoute } from "next";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://runnertoolkit.com";

  // No lastModified on static pages: stamping new Date() on every build marks
  // everything "just modified" and trains crawlers to ignore the field.
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "weekly", priority: 1.0 },
    { url: `${baseUrl}/premium`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/tools/training-plans`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/tools/shoe-selector`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/shoes`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/tools/fueling`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/tools/music`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/tools/attire-guide`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/rundown`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/tools/pace-calculator`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/methodology`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/terms`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const supabase = getSupabaseAdmin();

  // Only active shoes: the detail route 404s inactive item_keys, and a sitemap
  // full of 404s burns crawl trust.
  const shoePages: MetadataRoute.Sitemap = [];
  if (supabase) {
    const { data: shoes } = await supabase
      .from("shoe_models")
      .select("item_key, updated_at")
      .eq("is_active", true)
      .order("item_key") as { data: { item_key: string; updated_at: string | null }[] | null };

    if (shoes) {
      for (const shoe of shoes) {
        shoePages.push({
          url: `${baseUrl}/shoes/${shoe.item_key}`,
          ...(shoe.updated_at ? { lastModified: new Date(shoe.updated_at) } : {}),
          changeFrequency: "monthly",
          priority: 0.6,
        });
      }
    }
  }

  const articlePages: MetadataRoute.Sitemap = [];
  if (supabase) {
    const { data: articles } = await supabase
      .from("articles")
      .select("slug, published_at, updated_at")
      .eq("is_published", true)
      .order("published_at", { ascending: false }) as {
        data: { slug: string; published_at: string; updated_at: string | null }[] | null;
      };

    if (articles) {
      for (const article of articles) {
        articlePages.push({
          url: `${baseUrl}/rundown/${article.slug}`,
          lastModified: new Date(article.updated_at ?? article.published_at),
          changeFrequency: "monthly",
          priority: 0.7,
        });
      }
    }
  }

  return [...staticPages, ...shoePages, ...articlePages];
}
