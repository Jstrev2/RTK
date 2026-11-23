"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ENERGY_WORDS, coverUrl, genreName, spotifyLink, stepsFor, type LibSong } from "@/lib/music/shared";
import styles from "./song-grid.module.css";

const slug = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const PlayIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
    <path d="M8 5.5v13l11-6.5z" />
  </svg>
);
const PauseIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
    <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
  </svg>
);

/** Cards shown before "Show all": enough to scan, short enough on a phone. */
const SHOW_FIRST = 24;

const BANDS: { id: string; label: string; low: number; high: number }[] = [
  { id: "easy", label: "Easy 150-164", low: 150, high: 164 },
  { id: "steady", label: "Steady 165-171", low: 165, high: 171 },
  { id: "fast", label: "Fast 172-180", low: 172, high: 180 },
  { id: "sprint", label: "Sprint 181+", low: 181, high: 200 }
];

/** A useful filter: only offer chips that leave at least a few songs. */
const useful = <T,>(items: T[], count: (item: T) => number, total: number) => items.filter((i) => count(i) >= 3 && count(i) < total);

/**
 * Cover-art grid for the /music pages: tap a cover for a 30-second preview,
 * filter by text, stride band or genre.
 */
export default function SongGrid({ songs, steps, artistPages = [], first = SHOW_FIRST }: { songs: LibSong[]; steps?: number | null; artistPages?: string[]; first?: number }) {
  const linked = new Set(artistPages);
  const [query, setQuery] = useState("");
  const [band, setBand] = useState<string | null>(null);
  const [genre, setGenre] = useState<string | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => () => audio.current?.pause(), []);

  const stepsOf = (s: LibSong) => stepsFor(s.b)?.steps ?? 0;
  const bands = useful(BANDS, (b) => songs.filter((s) => stepsOf(s) >= b.low && stepsOf(s) <= b.high).length, songs.length);
  const genres = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of songs) for (const g of s.g) counts.set(g, (counts.get(g) ?? 0) + 1);
    return [...counts.entries()]
      .filter(([, n]) => n >= 3 && n < songs.length)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([g]) => g);
  }, [songs]);

  const shown = songs.filter((s) => {
    if (query && !`${s.t} ${s.a}`.toLowerCase().includes(query.toLowerCase())) return false;
    const b = BANDS.find((x) => x.id === band);
    if (b && !(stepsOf(s) >= b.low && stepsOf(s) <= b.high)) return false;
    if (genre && !s.g.includes(genre)) return false;
    return true;
  });

  const toggle = (song: LibSong) => {
    if (!song.d) {
      window.open(spotifyLink(song), "_blank", "noopener");
      return;
    }
    if (!audio.current) audio.current = new Audio();
    if (playing === song.id) {
      audio.current.pause();
      setPlaying(null);
      return;
    }
    audio.current.src = `/api/music/preview/${song.d}`;
    audio.current.onended = () => setPlaying(null);
    audio.current.play().then(
      () => setPlaying(song.id),
      () => setPlaying(null)
    );
  };

  return (
    <div>
      {songs.length > 12 ? (
        <div className="toolbar">
          <label className="search-bar">
            <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4" />
            </svg>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter by song or artist" aria-label="Filter songs" />
          </label>
          {bands.length || genres.length ? (
            <div className="chips">
              {bands.map((b) => (
                <button key={b.id} type="button" className="chip" aria-pressed={band === b.id} onClick={() => setBand(band === b.id ? null : b.id)}>
                  {b.label}
                </button>
              ))}
              {genres.map((g) => (
                <button key={g} type="button" className="chip" aria-pressed={genre === g} onClick={() => setGenre(genre === g ? null : g)}>
                  {genreName(g)}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
      {shown.length !== songs.length ? <p className={styles.count}>{shown.length} of {songs.length} songs</p> : null}
      {shown.length ? (
        <ul className={styles.grid} style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {shown.slice(0, showAll ? undefined : first).map((song, index) => {
            const fit = stepsFor(song.b);
            const cover = coverUrl(song.i, 250);
            return (
              <li key={song.id} className={styles.card}>
                <button type="button" className={styles.art} onClick={() => toggle(song)} aria-label={playing === song.id ? `Pause ${song.t}` : `Play a preview of ${song.t}`}>
                  {cover ? <img src={cover} alt={`${song.t} cover`} loading={index < 8 ? "eager" : "lazy"} width={250} height={250} /> : null}
                  <span className={styles.rank}>{String(index + 1).padStart(2, "0")}</span>
                  <span className={styles.play}>{playing === song.id ? <PauseIcon /> : <PlayIcon />}</span>
                </button>
                <div className={styles.body}>
                  <span className={styles.title} title={song.t}>
                    {song.t}
                  </span>
                  <span className={styles.artist}>{linked.has(slug(song.a)) ? <Link href={`/music/artist/${slug(song.a)}`} prefetch={false}>{song.a}</Link> : song.a}</span>
                  <div className={styles.stats}>
                    <span className="split">
                      <b>{song.b}</b> BPM
                    </span>
                    {fit?.half ? (
                      <span className="split">
                        <b>{fit.steps}</b> steps
                      </span>
                    ) : null}
                    <span className="split">{ENERGY_WORDS[song.e]}</span>
                  </div>
                </div>
                <div className={styles.foot}>
                  <span>{steps && fit ? (Math.abs(fit.steps - steps) <= 1 ? "On stride" : `${fit.steps > steps ? "+" : ""}${fit.steps - steps} steps`) : fit ? `${fit.steps} steps` : "Off stride"}</span>
                  <a href={spotifyLink(song)} target="_blank" rel="noreferrer">
                    Spotify
                  </a>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="empty">No songs match. Clear a filter.</p>
      )}
      {!showAll && shown.length > first ? (
        <p className={styles.more}>
          <button type="button" className="btn" onClick={() => setShowAll(true)}>
            Show all {shown.length} songs
          </button>
        </p>
      ) : null}
    </div>
  );
}
