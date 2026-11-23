"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { GuideCard, TopicChip } from "@/lib/guides";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
}

type PhotoChoice = { src: string; alt: string };

/**
 * Each card shows its guide's own photo unless one of the three cards before
 * it already does (the topic pools are small); then the next photo in the set.
 * Worked out on the list being shown, so a filtered grid doesn't repeat either.
 */
function pickPhotos(guides: GuideCard[], photos: PhotoChoice[]) {
  const recent: string[] = [];
  return guides.map((guide) => {
    let photo: PhotoChoice = guide.photo;
    let index = photos.findIndex((p) => p.src === photo.src);
    for (let step = 0; recent.includes(photo.src) && step < photos.length; step += 1) {
      index = (index + 1) % photos.length;
      photo = photos[index];
    }
    recent.push(photo.src);
    if (recent.length > 3) recent.shift();
    return photo;
  });
}

export function GuideCards({ guides, topics, photos = [] }: { guides: GuideCard[]; topics: TopicChip[]; photos?: PhotoChoice[] }) {
  const label = (tag: string) => topics.find((t) => t.tag === tag)?.label ?? tag;
  const picked = pickPhotos(guides, photos);
  return (
    <div className="rd-grid">
      {guides.map((guide, i) => {
        const tag = guide.tags.find((t) => topics.some((topic) => topic.tag === t)) ?? guide.tags[0];
        return (
          <Link key={guide.slug} href={`/rundown/${guide.slug}`} className="rd-card">
            <span className="rd-card-photo">
              <img src={picked[i].src} alt="" loading="lazy" />
              {tag ? <span className="rd-card-tag">{label(tag)}</span> : null}
            </span>
            <span className="rd-card-title">{guide.title}</span>
            {guide.excerpt ? <p className="rd-card-excerpt">{guide.excerpt}</p> : null}
            <span className="rd-card-meta">{formatDate(guide.published_at)}</span>
          </Link>
        );
      })}
    </div>
  );
}

/** Search box and topic chips over every guide; filters in place. */
export default function GuideBrowser({
  guides,
  topics,
  photos = [],
  initialTag = ""
}: {
  guides: GuideCard[];
  topics: TopicChip[];
  photos?: PhotoChoice[];
  initialTag?: string;
}) {
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState(initialTag);

  const shown = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    return guides.filter((guide) => {
      if (tag && !guide.tags.includes(tag)) return false;
      if (!words.length) return true;
      const text = `${guide.title} ${guide.excerpt ?? ""} ${guide.tags.join(" ")}`.toLowerCase();
      return words.every((word) => text.includes(word));
    });
  }, [guides, query, tag]);

  const active = topics.find((t) => t.tag === tag);

  return (
    <div className="rd-browser">
      <div className="rd-toolbar">
        <label className="search-bar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search guides: gels, heel drop, cadence..."
            aria-label="Search guides"
          />
        </label>
        <div className="chips rd-chips" role="group" aria-label="Filter by topic">
          <button type="button" className="chip" aria-pressed={!tag} onClick={() => setTag("")}>
            All <span className="rd-chip-count">{guides.length}</span>
          </button>
          {topics.map((topic) => (
            <button
              key={topic.tag}
              type="button"
              className="chip"
              aria-pressed={tag === topic.tag}
              onClick={() => setTag(tag === topic.tag ? "" : topic.tag)}
            >
              {topic.label} <span className="rd-chip-count">{topic.count}</span>
            </button>
          ))}
        </div>
      </div>

      <p className="rd-count" aria-live="polite">
        {shown.length} {shown.length === 1 ? "guide" : "guides"}
        {active ? ` on ${active.label.toLowerCase()}` : ""}
        {query.trim() ? ` matching "${query.trim()}"` : ""}
      </p>

      {shown.length ? (
        <GuideCards guides={shown} topics={topics} photos={photos} />
      ) : (
        <div className="empty">
          <p style={{ margin: "0 0 12px" }}>
            <strong>No guide matches that yet.</strong> New guides go up twice a day.
          </p>
          <button type="button" className="btn btn-sm" onClick={() => { setQuery(""); setTag(""); }}>
            Show all guides
          </button>
        </div>
      )}
    </div>
  );
}
