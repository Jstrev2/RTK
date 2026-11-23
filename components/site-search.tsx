"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SearchHit, SearchResults } from "@/lib/search";

const LABELS: Record<SearchHit["kind"], string> = { shoe: "Shoes", song: "Songs", fuel: "Fuel", guide: "Guides" };

export function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

/** Header search: shoes, songs, fuel and guides as you type; Enter opens /search. */
export default function SiteSearch({ onNavigate, initial = "" }: { onNavigate?: () => void; initial?: string }) {
  const router = useRouter();
  const [q, setQ] = useState(initial);
  const [results, setResults] = useState<SearchResults | null>(null);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults(null);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`, { signal: controller.signal });
        setResults(await res.json());
        setOpen(true);
      } catch {
        // typing again cancels the last request
      }
    }, 180);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q]);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (box.current && !box.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const hits = results ? (Object.keys(LABELS) as SearchHit["kind"][]).filter((k) => results[k]?.length) : [];
  const done = () => {
    setOpen(false);
    setQ("");
    onNavigate?.();
  };

  return (
    <div className="site-search" ref={box}>
      <form
        className="search-bar"
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          if (q.trim().length < 2) return;
          router.push(`/search?q=${encodeURIComponent(q.trim())}`);
          done();
        }}
      >
        <SearchIcon />
        <input
          type="search"
          placeholder="Search shoes, songs, gels, guides"
          aria-label="Search Runner Toolkit"
          value={q}
          onChange={(event) => setQ(event.target.value)}
          onFocus={() => results && setOpen(true)}
          onKeyDown={(event) => event.key === "Escape" && setOpen(false)}
        />
      </form>
      {open && results ? (
        <div className="site-search-results" role="listbox">
          {hits.length === 0 ? <p className="site-search-empty">Nothing for “{q}” yet.</p> : null}
          {hits.map((kind) => (
            <div key={kind} className="site-search-group">
              <span className="eyebrow">{LABELS[kind]}</span>
              {results[kind].map((hit) => {
                const external = hit.href.startsWith("http");
                const inner = (
                  <>
                    <span className="site-search-thumb">
                      {hit.image ? <img src={hit.image} alt="" loading="lazy" /> : <span>{hit.title.slice(0, 1)}</span>}
                    </span>
                    <span className="site-search-text">
                      <strong>{hit.title}</strong>
                      <small>{hit.sub}</small>
                    </span>
                  </>
                );
                return external ? (
                  <a key={hit.href + hit.title} href={hit.href} target="_blank" rel="noopener noreferrer" className="site-search-hit" onClick={done}>
                    {inner}
                  </a>
                ) : (
                  <Link key={hit.href} href={hit.href} className="site-search-hit" onClick={done}>
                    {inner}
                  </Link>
                );
              })}
            </div>
          ))}
          {hits.length ? (
            <Link href={`/search?q=${encodeURIComponent(q.trim())}`} className="site-search-all" onClick={done}>
              See all results for “{q}” →
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
