import type { MetadataRoute } from "next";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://runnertoolkit.com";

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
    { url: `${baseUrl}/tools/shoe-selector`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/tools/fueling`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/tools/music`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/tools/training-plans`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/rundown`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/tools/pace-calculator`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
  ];

  // Add individual shoe pages
  const shoePages: MetadataRoute.Sitemap = [];
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data: shoes } = await supabase
      .from("shoe_models")
      .select("item_key")
      .order("item_key") as { data: { item_key: string }[] | null };

    if (shoes) {
      for (const shoe of shoes) {
        shoePages.push({
          url: `${baseUrl}/shoes/${shoe.item_key}`,
          lastModified: new Date(),
          changeFrequency: "monthly",
          priority: 0.6,
        });
      }
    }
  }

  // Add article pages
  const articlePages: MetadataRoute.Sitemap = [];
  if (supabase) {
    const { data: articles } = await supabase
      .from("articles")
      .select("slug, published_at")
      .eq("is_published", true)
      .order("published_at", { ascending: false }) as { data: { slug: string; published_at: string }[] | null };

    if (articles) {
      for (const article of articles) {
        articlePages.push({
          url: `${baseUrl}/rundown/${article.slug}`,
          lastModified: new Date(article.published_at),
          changeFrequency: "monthly",
          priority: 0.7,
        });
      }
    }
  }

  return [...staticPages, ...shoePages, ...articlePages];
}
