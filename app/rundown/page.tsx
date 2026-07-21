import type { Metadata } from "next";
import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const metadata: Metadata = {
  title: "Runner Guides — Shoes, Music, Fuel, and Training",
  description:
    "Practical guides that help runners choose shoes, build playlists, practice fueling, and use a training plan well.",
  openGraph: {
    title: "Runner Guides",
    description:
      "Practical guidance connected to the tools runners use.",
    type: "website",
  },
};

interface Article {
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image: string | null;
  author: string;
  tags: string[];
  published_at: string;
}

async function getArticles(): Promise<Article[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  const { data } = await supabase
    .from("articles")
    .select("slug, title, excerpt, cover_image, author, tags, published_at")
    .eq("is_published", true)
    .order("published_at", { ascending: false });

  return ((data as Article[]) ?? []).filter((article) =>
    !article.tags.map((tag) => tag.toLowerCase()).includes("news")
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function RundownPage() {
  const articles = await getArticles();

  return (
    <div className="editorial-page">
      <section className="container tool-hero">
        <span className="eyebrow">Runner Guides</span>
        <h1>Use the answer well.</h1>
        <p className="section-lede">
          Practical guidance for choosing shoes, building a playlist,
          practicing fuel, and making a training plan work in the real world.
        </p>
      </section>

      <section className="section container">
        {articles.length === 0 ? (
          <div className="card card-outline" style={{ textAlign: "center", padding: "48px 20px" }}>
            <p style={{ fontSize: "1.1rem", marginBottom: "8px" }}>
              <strong>Focused runner guides are on the way.</strong>
            </p>
            <p style={{ color: "var(--ink-2)" }}>
              In the meantime, start with one of the free tools.
            </p>
          </div>
        ) : (
          <div className="grid grid-2">
            {articles.map((article) => (
              <Link
                key={article.slug}
                href={`/rundown/${article.slug}`}
                className="card card-accent"
              >
                {article.cover_image && (
                  <img
                    src={article.cover_image}
                    alt=""
                    className="catalog-image"
                    style={{ marginBottom: "12px" }}
                  />
                )}
                <div className="stack">
                  <div>
                    <strong style={{ fontSize: "1.15rem" }}>{article.title}</strong>
                    {article.excerpt && (
                      <p style={{ color: "var(--ink-2)", margin: "6px 0 0", lineHeight: 1.6 }}>
                        {article.excerpt}
                      </p>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                    <span className="brand-sub">{formatDate(article.published_at)}</span>
                    {article.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
