"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import SongGrid from "@/components/music/song-grid";
import { searchSongs, type LibSong } from "@/lib/music/shared";
import styles from "../music.module.css";

/** Search the whole library from the /music hub. The library loads on first focus. */
export default function MusicSearch({ total, artistPages }: { total: number; artistPages: string[] }) {
  const [query, setQuery] = useState("");
  const [library, setLibrary] = useState<LibSong[] | null>(null);
  const loading = useRef(false);

  const load = () => {
    if (loading.current) return;
    loading.current = true;
    fetch("/api/music/library")
      .then((r) => r.json())
      .then((data: { songs?: LibSong[] }) => setLibrary(data.songs ?? []))
      .catch(() => setLibrary([]));
  };

  useEffect(() => {
    if (query) load();
  }, [query]);

  const results = library && query.trim() ? searchSongs(library, query, undefined, 48) : [];

  return (
    <div className={styles.searchWrap}>
      <label className="search-bar">
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4" />
        </svg>
        <input
          type="search"
          value={query}
          onFocus={load}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${total.toLocaleString("en-US")} songs by title or artist`}
          aria-label="Search running songs"
        />
      </label>
      {query.trim() ? (
        <div className={styles.results}>
          {!library ? (
            <p className="empty">Loading the library...</p>
          ) : results.length ? (
            <SongGrid songs={results} artistPages={artistPages} />
          ) : (
            <p className="empty">
              Not in the library yet. <Link href="/tools/music" className="text-link">Add it in the Music Finder</Link> and we&apos;ll read its BPM.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
