import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { pageMetadata } from "@/lib/seo";
import { GUIDE_TOPICS, getGuides, guidesForTag } from "@/lib/guides";
import { GuideList, TopicNav, tagCounts } from "../../guide-list";

export const revalidate = 1800;

export async function generateStaticParams() {
  return [];
}

const TOOL_FOR: Record<string, { href: string; label: string }> = {
  shoes: { href: "/tools/shoe-selector", label: "Find my shoes" },
  gear: { href: "/tools/shoe-selector", label: "Find my shoes" },
  music: { href: "/tools/music", label: "Build my playlist" },
  fueling: { href: "/tools/fueling", label: "Plan my fuel" },
  nutrition: { href: "/tools/fueling", label: "Plan my fuel" },
  "race-day": { href: "/tools/fueling", label: "Plan my race fuel" }
};

export async function generateMetadata({ params }: { params: Promise<{ tag: string }> }): Promise<Metadata> {
  const { tag } = await params;
  const topic = GUIDE_TOPICS.find((t) => t.tag === tag);
  if (!topic) return { title: "Not Found" };
  return pageMetadata({
    title: `${topic.label} Guides for Runners`,
    description: topic.blurb,
    path: `/rundown/tag/${tag}`
  });
}

export default async function GuideTopicPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const topic = GUIDE_TOPICS.find((t) => t.tag === tag);
  if (!topic) notFound();
  const all = await getGuides();
  const guides = guidesForTag(all, tag);
  if (!guides.length) notFound();
  const tool = TOOL_FOR[tag];

  return (
    <div className="editorial-page">
      <section className="container tool-hero">
        <span className="eyebrow">Runner Guides · {topic.label}</span>
        <h1>{topic.label} guides</h1>
        <p className="section-lede">{topic.blurb}</p>
        {tool ? (
          <div className="button-row">
            <Link className="btn btn-primary" href={tool.href}>{tool.label}</Link>
          </div>
        ) : null}
      </section>
      <section className="section container">
        <TopicNav active={tag} counts={tagCounts(all)} />
        <GuideList guides={guides} />
      </section>
    </div>
  );
}
