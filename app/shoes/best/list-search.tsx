"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export type ListHub = { hub: string; note?: string; lists: { slug: string; title: string; count: number }[] };

/** Every "best of" list, filterable by typing ("stability", "wide", "Hoka"). */
export default function ListSearch({ hubs }: { hubs: ListHub[] }) {
  const [query, setQuery] = useState("");
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const shown = useMemo(
    () =>
      hubs
        .map((hub) => ({
          ...hub,
          lists: hub.lists.filter((list) => words.every((word) => `${hub.hub} ${list.title}`.toLowerCase().includes(word)))
        }))
        .filter((hub) => hub.lists.length),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hubs, query]
  );
  const total = shown.reduce((sum, hub) => sum + hub.lists.length, 0);

  return (
    <div>
      <div className="toolbar">
        <label className="search-bar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <span className="sr-only">Search the lists</span>
          <input
            type="search"
            placeholder="Search lists: wide, Hoka, budget..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </div>
      <p className="shoe-grid-count">
        <span>
          <b className="clock">{total}</b> lists
        </span>
      </p>
      {shown.length ? (
        shown.map((hub) => (
          <div key={hub.hub} className="shoe-section">
            <h2>{hub.hub}</h2>
            {hub.note ? <p className="fineprint-inline" style={{ margin: "0 0 12px" }}>{hub.note}</p> : null}
            <div className="compare-links">
              {hub.lists.map((list) => (
                <Link key={list.slug} className="chip" href={`/shoes/best/${list.slug}`}>
                  {list.title} <span className="clock">{list.count}</span>
                </Link>
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="empty">No list matches that. Try a shorter word.</div>
      )}
    </div>
  );
}
