import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

interface Article {
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  cover_image: string | null;
  author: string;
  tags: string[];
  published_at: string;
}

async function getArticle(slug: string): Promise<Article | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data } = await supabase
    .from("articles")
    .select("slug, title, excerpt, body, cover_image, author, tags, published_at")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  return data as Article | null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return { title: "Not Found" };

  return {
    title: article.title,
    description: article.excerpt ?? `${article.title} — The Rundown by Runner Toolkit`,
    openGraph: {
      title: article.title,
      description: article.excerpt ?? undefined,
      type: "article",
      publishedTime: article.published_at,
      authors: [article.author],
      ...(article.cover_image ? { images: [article.cover_image] } : {}),
    },
  };
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function renderBody(body: string) {
  // Split on double newlines for paragraphs, support ## headings and - lists
  const blocks = body.split(/\n\n+/);
  return blocks.map((block, i) => {
    const trimmed = block.trim();
    if (!trimmed) return null;

    if (trimmed.startsWith("## ")) {
      return (
        <h2 key={i} style={{ fontFamily: "var(--font-display), sans-serif", margin: "32px 0 12px" }}>
          {trimmed.slice(3)}
        </h2>
      );
    }

    if (trimmed.startsWith("### ")) {
      return (
        <h3 key={i} style={{ fontFamily: "var(--font-display), sans-serif", margin: "24px 0 8px" }}>
          {trimmed.slice(4)}
        </h3>
      );
    }

    // Check if the block is a list
    const lines = trimmed.split("\n");
    if (lines.every((l) => l.trim().startsWith("- "))) {
      return (
        <ul key={i} style={{ paddingLeft: "20px", margin: "12px 0", lineHeight: 1.8 }}>
          {lines.map((line, j) => (
            <li key={j}>{line.trim().slice(2)}</li>
          ))}
        </ul>
      );
    }

    return (
      <p key={i} style={{ lineHeight: 1.8, margin: "0 0 16px" }}>
        {trimmed}
      </p>
    );
  });
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    datePublished: article.published_at,
    author: { "@type": "Person", name: article.author },
    publisher: { "@type": "Organization", name: "Runner Toolkit" },
    ...(article.cover_image ? { image: article.cover_image } : {}),
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="container" style={{ maxWidth: "720px", margin: "0 auto" }}>
        <div className="tool-hero">
          <Link href="/rundown" className="brand-sub" style={{ display: "inline-block", marginBottom: "12px" }}>
            &larr; The Rundown
          </Link>
          <h1>{article.title}</h1>
          <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
            <span className="brand-sub">
              {article.author} &middot; {formatDate(article.published_at)}
            </span>
            {article.tags.map((tag) => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>
        </div>

        {article.cover_image && (
          <img
            src={article.cover_image}
            alt=""
            style={{
              width: "100%",
              borderRadius: "var(--radius-md)",
              marginBottom: "32px",
              maxHeight: "400px",
              objectFit: "cover",
            }}
          />
        )}

        <div className="section-tight">
          {renderBody(article.body)}
        </div>

        <div className="divider" />
        <div style={{ padding: "12px 0 48px" }}>
          <Link href="/rundown" className="btn btn-secondary">
            &larr; Back to The Rundown
          </Link>
        </div>
      </article>
    </div>
  );
}
