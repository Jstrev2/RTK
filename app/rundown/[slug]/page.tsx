import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import JsonLd from "@/components/json-ld";
import { SITE_URL } from "@/lib/seo";

export const revalidate = 3600;

// Paths render on demand and are then cached for the revalidate window.
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  return [];
}

interface Article {
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  cover_image: string | null;
  author: string;
  tags: string[];
  published_at: string;
  updated_at: string | null;
}

// cache() dedupes the query between generateMetadata and the page render.
const getArticle = cache(async (slug: string): Promise<Article | null> => {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("articles")
    .select("slug, title, excerpt, body, cover_image, author, tags, published_at, updated_at")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  // Throw on infrastructure errors so ISR keeps the last good page instead
  // of caching a 404 over a live article.
  if (error) {
    throw new Error(`Failed to load article ${slug}: ${error.message}`);
  }
  return (data as Article | null) ?? null;
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return { title: "Not Found" };

  const description = article.excerpt ?? `${article.title} — Runner Guides by Runner Toolkit`;
  const image = article.cover_image ?? "/og.jpg";

  return {
    title: article.title,
    description,
    alternates: { canonical: `/rundown/${slug}` },
    openGraph: {
      title: article.title,
      description,
      type: "article",
      url: `/rundown/${slug}`,
      siteName: "Runner Toolkit",
      publishedTime: article.published_at,
      ...(article.updated_at ? { modifiedTime: article.updated_at } : {}),
      authors: [article.author],
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description,
      images: [image],
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

// Renders [label](href) links and **bold** inside a text block.
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const pattern = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = pattern.exec(text))) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    if (match[1] && match[2]) {
      const href = match[2];
      // "//host/..." is protocol-relative (external), not an internal path.
      parts.push(
        href.startsWith("/") && !href.startsWith("//") ? (
          <Link key={`${keyPrefix}-${index}`} href={href}>
            {match[1]}
          </Link>
        ) : (
          <a
            key={`${keyPrefix}-${index}`}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
          >
            {match[1]}
          </a>
        )
      );
    } else if (match[3]) {
      parts.push(<strong key={`${keyPrefix}-${index}`}>{match[3]}</strong>);
    }
    last = match.index + match[0].length;
    index += 1;
  }

  if (last < text.length) {
    parts.push(text.slice(last));
  }
  return parts;
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
          {renderInline(trimmed.slice(3), `h2-${i}`)}
        </h2>
      );
    }

    if (trimmed.startsWith("### ")) {
      return (
        <h3 key={i} style={{ fontFamily: "var(--font-display), sans-serif", margin: "24px 0 8px" }}>
          {renderInline(trimmed.slice(4), `h3-${i}`)}
        </h3>
      );
    }

    // Check if the block is a list
    const lines = trimmed.split("\n");
    if (lines.every((l) => l.trim().startsWith("- "))) {
      return (
        <ul key={i} style={{ paddingLeft: "20px", margin: "12px 0", lineHeight: 1.8 }}>
          {lines.map((line, j) => (
            <li key={j}>{renderInline(line.trim().slice(2), `li-${i}-${j}`)}</li>
          ))}
        </ul>
      );
    }

    return (
      <p key={i} style={{ lineHeight: 1.8, margin: "0 0 16px" }}>
        {renderInline(trimmed, `p-${i}`)}
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

  const pageUrl = `${SITE_URL}/rundown/${article.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    ...(article.excerpt ? { description: article.excerpt } : {}),
    datePublished: article.published_at,
    dateModified: article.updated_at ?? article.published_at,
    mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
    author: { "@type": "Person", name: article.author },
    publisher: {
      "@type": "Organization",
      name: "Runner Toolkit",
      logo: { "@type": "ImageObject", url: `${SITE_URL}/icon.svg` },
    },
    ...(article.cover_image ? { image: article.cover_image } : {}),
  };

  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Runner Guides", item: `${SITE_URL}/rundown` },
      { "@type": "ListItem", position: 3, name: article.title },
    ],
  };

  return (
    <div>
      <JsonLd data={jsonLd} />
      <JsonLd data={breadcrumbs} />

      <article className="container" style={{ maxWidth: "720px", margin: "0 auto" }}>
        <div className="tool-hero">
          <Link href="/rundown" className="brand-sub" style={{ display: "inline-block", marginBottom: "12px" }}>
            &larr; Runner Guides
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
            alt={article.title}
            width={720}
            height={405}
            decoding="async"
            style={{
              width: "100%",
              height: "auto",
              aspectRatio: "16 / 9",
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
            &larr; Back to Runner Guides
          </Link>
        </div>
      </article>
    </div>
  );
}
