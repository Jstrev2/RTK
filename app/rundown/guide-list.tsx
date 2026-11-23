import Link from "next/link";
import { GUIDE_TOPICS, type GuideSummary } from "@/lib/guides";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export function TopicNav({ active, counts }: { active?: string; counts: Record<string, number> }) {
  return (
    <nav className="guide-topic-nav" aria-label="Guide topics">
      <Link href="/rundown" className={active ? undefined : "active"}>All guides</Link>
      {GUIDE_TOPICS.filter((topic) => (counts[topic.tag] ?? 0) > 0).map((topic) => (
        <Link key={topic.tag} href={`/rundown/tag/${topic.tag}`} className={active === topic.tag ? "active" : undefined}>
          {topic.label} <span>{counts[topic.tag]}</span>
        </Link>
      ))}
    </nav>
  );
}

export function GuideList({ guides }: { guides: GuideSummary[] }) {
  return (
    <div className="grid grid-2">
      {guides.map((article) => (
        <Link key={article.slug} href={`/rundown/${article.slug}`} className="card card-accent">
          <div className="stack">
            <div>
              <strong style={{ fontSize: "1.15rem" }}>{article.title}</strong>
              {article.excerpt && (
                <p style={{ color: "var(--ink-2)", margin: "6px 0 0", lineHeight: 1.6 }}>{article.excerpt}</p>
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
  );
}

export function tagCounts(guides: GuideSummary[]) {
  const counts: Record<string, number> = {};
  for (const guide of guides) for (const tag of guide.tags) counts[tag.toLowerCase()] = (counts[tag.toLowerCase()] ?? 0) + 1;
  return counts;
}
