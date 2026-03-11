import type { Metadata } from "next";
import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const metadata: Metadata = {
  title: "The Rundown — Running News & Guides",
  description:
    "The latest running news, gear reviews, training tips, and race-day strategies from Runner Toolkit.",
  openGraph: {
    title: "The Rundown — Running News & Guides",
    description:
      "The latest running news, gear reviews, training tips, and race-day strategies from Runner Toolkit.",
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

  return (data as Article[]) ?? [];
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
    <div>
      <section className="container tool-hero">
        <span className="pill">The Rundown</span>
        <h1>Running news, guides &amp; deep dives</h1>
        <p className="section-lede">
          Gear breakdowns, training strategies, race-day tips, and everything
          in between.
        </p>
      </section>

      <section className="section container">
        {articles.length === 0 ? (
          <div className="card card-outline" style={{ textAlign: "center", padding: "48px 20px" }}>
            <p style={{ fontSize: "1.1rem", marginBottom: "8px" }}>
              <strong>First articles dropping soon.</strong>
            </p>
            <p style={{ color: "var(--ink-2)" }}>
              Check back shortly — we&apos;re working on some good stuff.
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
