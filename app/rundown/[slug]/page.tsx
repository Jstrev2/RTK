import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import JsonLd from "@/components/json-ld";
import { SITE_URL } from "@/lib/seo";
import { GUIDE_TOPICS, getGuides, photoChoices, readingMinutes, splitShortAnswer, toCards, topicChips } from "@/lib/guides";
import { photoForGuide } from "@/lib/photos";
import { GuideCards } from "../guide-browser";

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

  const description = article.excerpt ?? `${article.title}, from Runner Guides by Runner Toolkit`;
  const image = article.cover_image ?? photoForGuide(article.tags, article.slug).src;

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
    timeZone: "UTC",
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
          <a key={`${keyPrefix}-${index}`} href={href} target="_blank" rel="noopener noreferrer">
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

// The guide format (CONTENT_VOICE.md): paragraphs, ## and ### headings,
// "- " lists, links and bold.
function renderBody(body: string) {
  return body.split(/\n\s*\n/).map((block, i) => {
    const trimmed = block.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith("### ")) return <h3 key={i}>{renderInline(trimmed.slice(4), `h3-${i}`)}</h3>;
    if (trimmed.startsWith("## ")) return <h2 key={i}>{renderInline(trimmed.slice(3), `h2-${i}`)}</h2>;
    const lines = trimmed.split("\n");
    if (lines.every((line) => line.trim().startsWith("- "))) {
      return (
        <ul key={i}>
          {lines.map((line, j) => (
            <li key={j}>{renderInline(line.trim().slice(2), `li-${i}-${j}`)}</li>
          ))}
        </ul>
      );
    }
    return <p key={i}>{renderInline(trimmed, `p-${i}`)}</p>;
  });
}

const TOOL_CTA = [
  { tags: ["music"], href: "/tools/music", label: "Build my playlist", kicker: "Music Finder", title: "Get a playlist at your cadence", copy: "Songs at your BPM for the run and length you pick, each a tap from Spotify." },
  { tags: ["fueling", "nutrition"], href: "/tools/fueling", label: "Plan my fuel", kicker: "Fuel Finder", title: "Turn this into your fuel plan", copy: "How much to take and when, for your distance and finish time, with a packing list." },
  { tags: ["shoes", "gear", "beginners"], href: "/tools/shoe-selector", label: "Find my shoes", kicker: "Shoe Finder", title: "Find the shoes that fit your running", copy: "Four questions narrow hundreds of current road shoes to three, each with a reason." },
  { tags: ["race-day", "training"], href: "/tools/fueling", label: "Plan my race fuel", kicker: "Fuel Finder", title: "Plan race day", copy: "Work out your race fuel before the start line, then rehearse it on your long runs." }
];

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  const pageUrl = `${SITE_URL}/rundown/${article.slug}`;
  const tags = article.tags.map((tag) => tag.toLowerCase());
  const { shortAnswer, rest } = splitShortAnswer(article.body);
  const topics = GUIDE_TOPICS.filter((topic) => tags.includes(topic.tag));

  const allGuides = await getGuides().catch(() => []);
  const photo = photoForGuide(tags, article.slug);
  const related = allGuides
    .filter((guide) => guide.slug !== article.slug)
    .map((guide) => ({ guide, shared: guide.tags.filter((tag) => tags.includes(tag.toLowerCase())).length }))
    .filter((entry) => entry.shared > 0)
    .sort((a, b) => b.shared - a.shared || b.guide.published_at.localeCompare(a.guide.published_at))
    .slice(0, 3)
    .map((entry) => entry.guide);
  const tool = TOOL_CTA.find((cta) => cta.tags.some((tag) => tags.includes(tag)));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    ...(article.excerpt ? { description: article.excerpt } : {}),
    datePublished: article.published_at,
    dateModified: article.updated_at ?? article.published_at,
    mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
    author: { "@type": "Organization", name: article.author },
    publisher: {
      "@type": "Organization",
      name: "Runner Toolkit",
      logo: { "@type": "ImageObject", url: `${SITE_URL}/icon.svg` },
    },
    image: article.cover_image ?? `${SITE_URL}${photo.src}`,
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

      <header className="page-hero on-photo rd-article-hero">
        <div className="photo-duo">
          <img src={photo.src} alt={photo.alt} fetchPriority="high" />
        </div>
        <div className="container" style={{ paddingBottom: shortAnswer ? 56 : 0 }}>
          <Link href="/rundown" className="rd-back">&larr; Runner Guides</Link>
          <h1>{article.title}</h1>
          <div className="rd-meta">
            {topics.map((topic) => (
              <Link key={topic.tag} href={`/rundown/tag/${topic.tag}`}>{topic.label}</Link>
            ))}
            <span>{formatDate(article.published_at)}</span>
            {article.updated_at && formatDate(article.updated_at) !== formatDate(article.published_at) ? (
              <>
                <span aria-hidden="true">·</span>
                <span>Updated {formatDate(article.updated_at)}</span>
              </>
            ) : null}
            <span aria-hidden="true">·</span>
            <span>{readingMinutes(article.body)} min read</span>
          </div>
        </div>
        <span className="photo-credit">
          Photo: <a href={photo.source} target="_blank" rel="noopener noreferrer">{photo.author}</a>, {photo.license}
        </span>
      </header>

      <article className="rd-article">
        {shortAnswer ? (
          <aside className="rd-answer" aria-label="Short answer">
            <span className="eyebrow">Short answer</span>
            <p>{renderInline(shortAnswer, "answer")}</p>
          </aside>
        ) : null}

        <div className="rd-body">{renderBody(rest)}</div>

        {tool ? (
          <div className="panel-dark rd-tool">
            <div>
              <span className="eyebrow">{tool.kicker}</span>
              <h2>{tool.title}</h2>
              <p>{tool.copy}</p>
            </div>
            <Link className="btn btn-volt" href={tool.href}>{tool.label} &rarr;</Link>
          </div>
        ) : null}
      </article>

      {related.length ? (
        <section className="container rd-related" aria-labelledby="related-guides">
          <div className="section-head">
            <h2 id="related-guides">Keep reading</h2>
            <Link className="btn btn-sm" href="/rundown">All guides</Link>
          </div>
          <GuideCards guides={toCards(related)} topics={topicChips(allGuides)} photos={photoChoices()} />
        </section>
      ) : null}
    </div>
  );
}
