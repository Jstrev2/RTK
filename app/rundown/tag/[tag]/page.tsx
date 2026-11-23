import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { pageMetadata } from "@/lib/seo";
import { GUIDE_TOPICS, getGuides, guidesForTag, photoChoices, toCards, topicChips } from "@/lib/guides";
import { photoForGuide } from "@/lib/photos";
import GuideBrowser from "../../guide-browser";

export const revalidate = 1800;

export async function generateStaticParams() {
  return [];
}

const TOOL_FOR: Record<string, { href: string; label: string }> = {
  shoes: { href: "/tools/shoe-selector", label: "Find my shoes" },
  gear: { href: "/tools/shoe-selector", label: "Find my shoes" },
  beginners: { href: "/tools/shoe-selector", label: "Find my shoes" },
  music: { href: "/tools/music", label: "Build my playlist" },
  fueling: { href: "/tools/fueling", label: "Plan my fuel" },
  nutrition: { href: "/tools/fueling", label: "Plan my fuel" },
  "race-day": { href: "/tools/fueling", label: "Plan my race fuel" },
  training: { href: "/tools/pace-calculator", label: "Work out my paces" }
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
  if (!guidesForTag(all, tag).length) notFound();
  const tool = TOOL_FOR[tag];
  const photo = photoForGuide([tag], tag);

  return (
    <div>
      <section className="page-hero on-photo rd-hero">
        <div className="photo-duo">
          <img src={photo.src} alt={photo.alt} fetchPriority="high" />
        </div>
        <div className="container">
          <Link href="/rundown" className="rd-back">All guides</Link>
          <h1>{topic.label} guides</h1>
          <p className="page-hero-sub">{topic.blurb}</p>
          {tool ? <Link className="btn btn-volt" href={tool.href}>{tool.label}</Link> : null}
        </div>
        <span className="photo-credit">
          Photo: <a href={photo.source} target="_blank" rel="noopener noreferrer">{photo.author}</a>, {photo.license}
        </span>
      </section>

      <section className="container">
        <GuideBrowser guides={toCards(all)} topics={topicChips(all)} photos={photoChoices()} initialTag={tag} />
      </section>
    </div>
  );
}
