import type { MetadataRoute } from "next";
import { cache } from "react";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { SITE_URL } from "@/lib/seo";

/*
 * Running music content pages, generated from the live music_songs table.
 *
 * Facts about the data that shape every page (checked November 2026):
 * - About a third of the rows (the ones pulled from Spotify searches) have no
 *   BPM, no genre, and default energy/workout tags. These pages only use songs
 *   with a measured BPM, and borrow a Spotify track id from the Spotify copy of
 *   the same song when there is one.
 * - The energy and workout tags on BPM rows were derived from the raw BPM at
 *   import (under 120 is "low"/"warm_up", 120 to 139 "medium"/"easy_run" and so
 *   on). Pages say so instead of presenting them as independent judgments.
 * - Almost no songs carry votes, so votes only break ties.
 */

export const MIN_SONGS = 8;
export const TABLE_LIMIT = 50;
export const CADENCE_MIN = 140;
export const CADENCE_MAX = 200;
const PAGE_SIZE = 1000;

export type Energy = "low" | "medium" | "high" | "extreme";

export type MusicSong = {
  id: string;
  title: string;
  artist: string;
  artistSlugs: string[];
  bpm: number;
  genres: string[];
  energy: Energy;
  workouts: string[];
  spotifyId: string | null;
  netVotes: number;
  /** How many tracks by this artist came from the Spotify running-song searches. */
  pull: number;
};

export type RankedSong = MusicSong & {
  steps: number | null;
  halfTime: boolean;
};

type SongRow = {
  id: string;
  title: string | null;
  artist: string | null;
  bpm: number | null;
  genre: string[] | null;
  energy: string | null;
  workout: string[] | null;
  spotify_id: string | null;
  upvotes: number | null;
  downvotes: number | null;
  source: string | null;
};

/* ---------- Labels and slugs ---------- */

const GENRES: Record<string, { slug: string; label: string }> = {
  rock: { slug: "rock", label: "Rock" },
  pop: { slug: "pop", label: "Pop" },
  electronic: { slug: "electronic", label: "Electronic" },
  jazz: { slug: "jazz", label: "Jazz" },
  folk: { slug: "folk", label: "Folk" },
  punk: { slug: "punk", label: "Punk" },
  "heavy metal": { slug: "metal", label: "Metal" },
  metal: { slug: "metal", label: "Metal" },
  soul: { slug: "soul", label: "Soul" },
  rap: { slug: "hip-hop", label: "Hip-hop" },
  "hip hop": { slug: "hip-hop", label: "Hip-hop" },
  "hip-hop": { slug: "hip-hop", label: "Hip-hop" },
  country: { slug: "country", label: "Country" },
  classical: { slug: "classical", label: "Classical" },
  funk: { slug: "funk", label: "Funk" },
  blues: { slug: "blues", label: "Blues" },
  "r&b": { slug: "r-and-b", label: "R&B" },
  reggae: { slug: "reggae", label: "Reggae" },
  latin: { slug: "latin", label: "Latin" },
  world: { slug: "world", label: "World" },
  "new age": { slug: "new-age", label: "New age" }
};

const genreLabels = new Map<string, string>(Object.values(GENRES).map((g) => [g.slug, g.label]));

export const genreLabel = (slug: string) =>
  genreLabels.get(slug) ?? slug.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());

export type WorkoutInfo = {
  slug: string;
  tag: string;
  label: string;
  /** Step-rate window this kind of run usually sits in, used for ranking. */
  low: number;
  high: number;
  /** Energy rank the run wants: 0 low, 1 medium, 2 high, 3 extreme. */
  energy: number;
};

export const WORKOUTS: WorkoutInfo[] = [
  { slug: "warm-up", tag: "warm_up", label: "Warm-up", low: 140, high: 160, energy: 0 },
  { slug: "easy-run", tag: "easy_run", label: "Easy run", low: 150, high: 165, energy: 1 },
  { slug: "long-run", tag: "long_run", label: "Long run", low: 155, high: 170, energy: 1 },
  { slug: "tempo-run", tag: "tempo_run", label: "Tempo run", low: 165, high: 180, energy: 2 },
  { slug: "intervals", tag: "speed_work", label: "Intervals", low: 175, high: 190, energy: 3 },
  { slug: "finish-kick", tag: "finish_kick", label: "Finish kick", low: 175, high: 195, energy: 3 }
];

const workoutByTag = new Map(WORKOUTS.map((w) => [w.tag, w]));
export const workoutBySlug = (slug: string) => WORKOUTS.find((w) => w.slug === slug);

const energyRank: Record<Energy, number> = { low: 0, medium: 1, high: 2, extreme: 3 };
export const energyLabel = (energy: Energy) => energy.charAt(0).toUpperCase() + energy.slice(1);

/** Kids' and lullaby cover acts: in the builder's catalog, but nobody's running music. */
const EXCLUDED_ARTISTS = new Set([
  "unknown",
  "kidz-bop",
  "kidz-bop-kids",
  "rockabye-baby",
  "twinkle-twinkle-little-rock-star",
  "sweet-little-band"
]);

export const slugify = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const spotifyUrl = (song: { spotifyId: string | null; title: string; artist: string }) =>
  song.spotifyId
    ? "https://open.spotify.com/track/" + song.spotifyId
    : "https://open.spotify.com/search/" + encodeURIComponent(song.title + " " + song.artist);

/* ---------- Cadence math ---------- */

/** Step rate a song's beat lines up with: on the beat, or two steps per beat (half-time). */
export const stepRate = (bpm: number): { steps: number; halfTime: boolean } | null => {
  if (bpm >= CADENCE_MIN && bpm <= CADENCE_MAX) return { steps: bpm, halfTime: false };
  if (bpm * 2 >= CADENCE_MIN && bpm * 2 <= CADENCE_MAX) return { steps: bpm * 2, halfTime: true };
  return null;
};

/*
 * Pace to cadence. Our working assumption, stated on every pace page: about 162
 * steps a minute at 10:00 a mile, rising about 2.3 steps a minute for every
 * 1 km/h faster, with a window of 6 either side for height and stride.
 */
const CADENCE_AT_ZERO = 140;
const CADENCE_PER_KMH = 2.3;
export const PACE_WINDOW = 6;
const KM_PER_MILE = 1.609344;

export const cadenceForSpeed = (kmh: number) => CADENCE_AT_ZERO + CADENCE_PER_KMH * kmh;
export const speedForCadence = (steps: number) => (steps - CADENCE_AT_ZERO) / CADENCE_PER_KMH;

export const formatPace = (seconds: number) => {
  const rounded = Math.round(seconds / 5) * 5;
  const minutes = Math.floor(rounded / 60);
  return minutes + ":" + String(rounded % 60).padStart(2, "0");
};

export type PaceInfo = {
  slug: string;
  unit: "mile" | "km";
  seconds: number;
  label: string;
  otherLabel: string;
  center: number;
  low: number;
  high: number;
};

const makePace = (unit: "mile" | "km", seconds: number): PaceInfo => {
  const km = unit === "mile" ? KM_PER_MILE : 1;
  const kmh = (3600 * km) / seconds;
  const center = cadenceForSpeed(kmh);
  const minutes = Math.floor(seconds / 60);
  const secs = String(seconds % 60).padStart(2, "0");
  const otherSeconds = unit === "mile" ? seconds / KM_PER_MILE : seconds * KM_PER_MILE;
  return {
    slug: `${minutes}-${secs}-min-${unit}`,
    unit,
    seconds,
    label: unit === "mile" ? `${minutes}:${secs} a mile` : `${minutes}:${secs} per km`,
    otherLabel: unit === "mile" ? `${formatPace(otherSeconds)} per km` : `${formatPace(otherSeconds)} a mile`,
    center: Math.round(center),
    low: Math.round(center - PACE_WINDOW),
    high: Math.round(center + PACE_WINDOW)
  };
};

const ALL_PACES: PaceInfo[] = [
  ...Array.from({ length: 15 }, (_, i) => makePace("mile", 360 + i * 30)),
  ...Array.from({ length: 9 }, (_, i) => makePace("km", 240 + i * 30))
];

// A pace whose step window matches an earlier one would list exactly the same
// songs, so only the first (miles before km, fast before slow) gets a page and
// the others point to it.
export const PACES: PaceInfo[] = ALL_PACES.filter(
  (pace, i) => ALL_PACES.findIndex((other) => other.low === pace.low && other.high === pace.high) === i
);

export const KM_PACES = ALL_PACES.filter((pace) => pace.unit === "km").map((pace) => ({
  ...pace,
  target: PACES.find((other) => other.low === pace.low && other.high === pace.high)?.slug ?? pace.slug
}));

/** The published pace slug a duplicate pace slug should redirect to, if any. */
export const paceAlias = (slug: string) => {
  const pace = ALL_PACES.find((p) => p.slug === slug);
  if (!pace || PACES.includes(pace)) return null;
  return PACES.find((other) => other.low === pace.low && other.high === pace.high)?.slug ?? null;
};

/** Pace that matches a step rate under the assumption, when it falls inside our pace pages' span. */
export const paceForSteps = (steps: number) => {
  const kmh = speedForCadence(steps);
  const mileSeconds = (3600 * KM_PER_MILE) / kmh;
  if (kmh <= 0 || mileSeconds > 13 * 60 + 15 || mileSeconds < 5 * 60 + 45) return null;
  return { mile: formatPace(mileSeconds), km: formatPace(3600 / kmh) };
};

export const GENRE_RANGES: [number, number][] = [
  [140, 150],
  [150, 160],
  [160, 170],
  [170, 180],
  [180, 190],
  [190, 200]
];
export const rangeSlug = ([low, high]: [number, number]) => `${low}-${high}-bpm`;

/* ---------- Loading ---------- */

const normalizeKey = (title: string, artist: string) => {
  const t = title
    .toLowerCase()
    .replace(/\s*[([].*?[)\]]/g, "")
    .replace(/\s+-\s+.*$/, "")
    .replace(/[^a-z0-9]+/g, "");
  const a = artist.split(", ")[0].toLowerCase().replace(/[^a-z0-9]+/g, "");
  return t + "|" + a;
};

const fetchRows = async (): Promise<SongRow[]> => {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  const rows: SongRow[] = [];
  // Supabase caps a select at 1000 rows, so page through the table.
  for (let from = 0; from < 50_000; from += PAGE_SIZE) {
    const { data, error } = (await supabase
      .from("music_songs")
      .select("id, title, artist, bpm, genre, energy, workout, spotify_id, upvotes, downvotes, source")
      .order("id")
      .range(from, from + PAGE_SIZE - 1)) as { data: SongRow[] | null; error: { message: string } | null };
    // Throw rather than return a partial catalog: a failed revalidation keeps
    // the last good page instead of turning it into a 404.
    if (error) throw new Error("music_songs query failed: " + error.message);
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < PAGE_SIZE) break;
  }
  return rows;
};

export type MusicCatalog = {
  songs: MusicSong[];
  totalRows: number;
  withoutBpm: number;
};

const buildCatalog = (rows: SongRow[]): MusicCatalog => {
  const spotifyIds = new Map<string, string>();
  const pullByArtist = new Map<string, number>();
  for (const row of rows) {
    if (!row.title || !row.artist) continue;
    if (row.spotify_id) {
      const key = normalizeKey(row.title, row.artist);
      if (!spotifyIds.has(key)) spotifyIds.set(key, row.spotify_id);
    }
    if (row.source === "spotify") {
      for (const name of row.artist.split(", ")) {
        const slug = slugify(name);
        pullByArtist.set(slug, (pullByArtist.get(slug) ?? 0) + 1);
      }
    }
  }

  const byKey = new Map<string, MusicSong>();
  let withoutBpm = 0;
  for (const row of rows) {
    if (!row.title || !row.artist) continue;
    if (row.bpm == null || row.bpm <= 0) {
      withoutBpm += 1;
      continue;
    }
    const names = row.source === "spotify" ? row.artist.split(", ") : [row.artist];
    const artistSlugs = names.map(slugify).filter(Boolean);
    if (!artistSlugs.length || artistSlugs.some((slug) => EXCLUDED_ARTISTS.has(slug))) continue;

    const genres: string[] = [];
    for (const raw of row.genre ?? []) {
      const known = GENRES[raw.toLowerCase()];
      const slug = known?.slug ?? slugify(raw);
      if (!slug) continue;
      if (!genres.includes(slug)) genres.push(slug);
    }

    const energy = (["low", "medium", "high", "extreme"] as const).includes(row.energy as Energy)
      ? (row.energy as Energy)
      : "medium";
    const key = normalizeKey(row.title, row.artist);
    const song: MusicSong = {
      id: row.id,
      title: row.title.trim(),
      artist: row.artist.trim(),
      artistSlugs,
      bpm: Math.round(row.bpm),
      genres,
      energy,
      workouts: (row.workout ?? [])
        .map((tag) => workoutByTag.get(tag)?.slug)
        .filter((slug): slug is string => Boolean(slug)),
      spotifyId: row.spotify_id ?? spotifyIds.get(key) ?? null,
      netVotes: (row.upvotes ?? 0) - (row.downvotes ?? 0),
      pull: Math.max(...artistSlugs.map((slug) => pullByArtist.get(slug) ?? 0))
    };

    // Keep one copy per song: the one with votes, then the one with a track link.
    const existing = byKey.get(key);
    if (
      !existing ||
      song.netVotes > existing.netVotes ||
      (song.netVotes === existing.netVotes && song.spotifyId && !existing.spotifyId)
    ) {
      byKey.set(key, existing ? { ...song, genres: song.genres.length ? song.genres : existing.genres } : song);
    }
  }

  return {
    songs: [...byKey.values()],
    totalRows: rows.length,
    withoutBpm
  };
};

/** One database read per request, shared by generateMetadata and the page. */
export const getMusicCatalog = cache(async (): Promise<MusicCatalog> => buildCatalog(await fetchRows()));

/* ---------- Selections ---------- */

const tieBreak = (a: RankedSong, b: RankedSong) =>
  b.netVotes - a.netVotes ||
  b.pull - a.pull ||
  Number(Boolean(b.spotifyId)) - Number(Boolean(a.spotifyId)) ||
  a.title.localeCompare(b.title);

const withSteps = (song: MusicSong): RankedSong => {
  const match = stepRate(song.bpm);
  return { ...song, steps: match?.steps ?? null, halfTime: match?.halfTime ?? false };
};

/** Songs for one step rate: on the beat, or half-time within one step of it. */
export const songsForBpm = (songs: MusicSong[], target: number): RankedSong[] =>
  songs
    .filter((song) => song.bpm === target || Math.abs(song.bpm * 2 - target) <= 1)
    .map((song) => ({ ...song, steps: song.bpm === target ? target : song.bpm * 2, halfTime: song.bpm !== target }))
    .sort(
      (a, b) =>
        Number(a.halfTime) - Number(b.halfTime) ||
        energyRank[b.energy] - energyRank[a.energy] ||
        tieBreak(a, b)
    );

export const songsInStepWindow = (songs: MusicSong[], low: number, high: number, center: number) =>
  songs
    .map(withSteps)
    .filter((song) => song.steps !== null && song.steps >= low && song.steps <= high)
    .sort(
      (a, b) =>
        Math.abs((a.steps ?? 0) - center) - Math.abs((b.steps ?? 0) - center) ||
        Number(a.halfTime) - Number(b.halfTime) ||
        tieBreak(a, b)
    );

export const songsForGenre = (songs: MusicSong[], genre: string) =>
  songs
    .filter((song) => song.genres.includes(genre))
    .map(withSteps)
    .filter((song) => song.steps !== null)
    .sort(
      (a, b) =>
        Number(a.halfTime) - Number(b.halfTime) ||
        energyRank[b.energy] - energyRank[a.energy] ||
        tieBreak(a, b)
    );

export const songsForWorkout = (songs: MusicSong[], workout: WorkoutInfo) => {
  const center = (workout.low + workout.high) / 2;
  const distance = (song: RankedSong) =>
    song.steps === null
      ? 1000
      : song.steps < workout.low
        ? workout.low - song.steps
        : song.steps > workout.high
          ? song.steps - workout.high
          : 0;
  return songs
    .filter((song) => song.workouts.includes(workout.slug))
    .map(withSteps)
    .sort(
      (a, b) =>
        distance(a) - distance(b) ||
        Math.abs(energyRank[a.energy] - workout.energy) - Math.abs(energyRank[b.energy] - workout.energy) ||
        Math.abs((a.steps ?? 0) - center) - Math.abs((b.steps ?? 0) - center) ||
        tieBreak(a, b)
    );
};

export const songsForArtist = (songs: MusicSong[], artist: string) =>
  songs
    .filter((song) => song.artistSlugs.includes(artist))
    .map(withSteps)
    .sort((a, b) => a.bpm - b.bpm || a.title.localeCompare(b.title));

/* ---------- The index of every publishable page ---------- */

export type MusicIndex = {
  bpms: { bpm: number; count: number }[];
  paces: (PaceInfo & { count: number })[];
  genres: { slug: string; label: string; count: number; ranges: { slug: string; range: [number, number]; count: number }[] }[];
  workouts: (WorkoutInfo & { count: number })[];
  artists: { slug: string; name: string; count: number }[];
};

const buildIndex = (catalog: MusicCatalog): MusicIndex => {
  const { songs } = catalog;

  const bpms: MusicIndex["bpms"] = [];
  for (let bpm = CADENCE_MIN; bpm <= CADENCE_MAX; bpm += 1) {
    const count = songsForBpm(songs, bpm).length;
    if (count >= MIN_SONGS) bpms.push({ bpm, count });
  }

  const paces = PACES.map((pace) => ({
    ...pace,
    count: songsInStepWindow(songs, pace.low, pace.high, pace.center).length
  })).filter((pace) => pace.count >= MIN_SONGS);

  const genreSlugs = [...new Set(songs.flatMap((song) => song.genres))];
  const genres = genreSlugs
    .map((slug) => {
      const list = songsForGenre(songs, slug);
      return {
        slug,
        label: genreLabel(slug),
        count: list.length,
        ranges: GENRE_RANGES.map((range) => ({
          slug: rangeSlug(range),
          range,
          count: list.filter((song) => (song.steps ?? 0) >= range[0] && (song.steps ?? 0) <= range[1]).length
        })).filter((entry) => entry.count >= MIN_SONGS)
      };
    })
    .filter((genre) => genre.count >= MIN_SONGS)
    .sort((a, b) => b.count - a.count);

  const workouts = WORKOUTS.map((workout) => ({
    ...workout,
    count: songs.filter((song) => song.workouts.includes(workout.slug)).length
  })).filter((workout) => workout.count >= MIN_SONGS);

  const artistCounts = new Map<string, { name: string; count: number }>();
  for (const song of songs) {
    const names = song.artistSlugs.length > 1 ? song.artist.split(", ") : [song.artist];
    song.artistSlugs.forEach((slug, index) => {
      const entry = artistCounts.get(slug) ?? { name: names[index] ?? song.artist, count: 0 };
      entry.count += 1;
      artistCounts.set(slug, entry);
    });
  }
  const artists = [...artistCounts.entries()]
    .filter(([slug, entry]) => slug && entry.count >= MIN_SONGS && !EXCLUDED_ARTISTS.has(slug))
    .map(([slug, entry]) => ({ slug, name: entry.name, count: entry.count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  return { bpms, paces, genres, workouts, artists };
};

export const getMusicIndex = cache(async (): Promise<MusicIndex> => buildIndex(await getMusicCatalog()));

/* ---------- Sitemap ---------- */

export const musicPaths = (index: MusicIndex) => [
  "/music",
  ...index.bpms.map((entry) => `/music/bpm/${entry.bpm}`),
  ...index.paces.map((pace) => `/music/pace/${pace.slug}`),
  ...index.genres.flatMap((genre) => [
    `/music/genre/${genre.slug}`,
    ...genre.ranges.map((range) => `/music/genre/${genre.slug}/${range.slug}`)
  ]),
  ...index.workouts.map((workout) => `/music/workout/${workout.slug}`),
  ...index.artists.map((artist) => `/music/artist/${artist.slug}`)
];

export async function getMusicContentSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  let index: MusicIndex;
  try {
    index = await getMusicIndex();
  } catch (error) {
    console.error("music sitemap entries skipped:", error);
    return [];
  }
  if (!index.bpms.length) return [];
  return musicPaths(index).map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "weekly",
    priority: path === "/music" ? 0.7 : 0.5
  }));
}

/* ---------- Text helpers for the data-written copy ---------- */

export const fmt = (value: number) => value.toLocaleString("en-US");

export const plural = (count: number, one: string, many = one + "s") =>
  `${fmt(count)} ${count === 1 ? one : many}`;

export const listWords = (items: string[]) => {
  if (items.length <= 1) return items.join("");
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
};

export const topGenres = (songs: MusicSong[], limit = 3) => {
  const counts = new Map<string, number>();
  for (const song of songs) for (const genre of song.genres) counts.set(genre, (counts.get(genre) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([slug, count]) => ({ slug, label: genreLabel(slug), count }));
};

export const songName = (song: MusicSong) => `"${song.title}" by ${song.artist}`;

export const median = (values: number[]) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
};
