import type { MetadataRoute } from "next";
import { cache } from "react";
import { getLibrary } from "@/lib/music/library";
import { CADENCE_MAX, CADENCE_MIN, GENRES, clock, genreName, stepsFor, type LibSong } from "@/lib/music/shared";
import { SITE_URL } from "@/lib/seo";

/*
 * The /music browse pages, generated from the live song library
 * (lib/music/library.ts: every song with a trusted BPM and a cover).
 * Each page is a cover grid and two sentences; the Music Finder does the rest.
 * A page needs MIN_SONGS songs or it 404s.
 */

export const MIN_SONGS = 8;
/** Songs sent to a page's grid (it shows 24, then "Show all", and filters all of them). */
const GRID = 150;

export type MusicPageModel = {
  path: string;
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  h1: string;
  lines: [string, string];
  songs: LibSong[];
  /** Target step rate for the grid's fit labels and the finder link. */
  steps: number | null;
  toolHref: string;
  toolLabel: string;
  crumbs: { name: string; path: string }[];
  related: { heading: string; links: { href: string; label: string }[] }[];
};

export const slugify = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const fmt = (value: number) => value.toLocaleString("en-US");

const byPopularity = (a: LibSong, b: LibSong) => b.p - a.p || a.t.localeCompare(b.t);

/** Songs whose stride lands within `window` steps of a target, most popular first. */
const nearStride = (songs: LibSong[], target: number, window: number) =>
  songs
    .filter((song) => {
      const fit = stepsFor(song.b);
      return fit && Math.abs(fit.steps - target) <= window;
    })
    .sort(byPopularity);

/* ---------- Paces ---------- */

const KM_PER_MILE = 1.609344;
export const PACE_WINDOW = 4;

export type PaceInfo = { slug: string; unit: "mile" | "km"; seconds: number; label: string; otherLabel: string; center: number; low: number; high: number };

const makePace = (unit: "mile" | "km", seconds: number): PaceInfo => {
  const kmh = (3600 * (unit === "mile" ? KM_PER_MILE : 1)) / seconds;
  const center = Math.round(140 + 2.3 * kmh);
  const minutes = Math.floor(seconds / 60);
  const secs = String(seconds % 60).padStart(2, "0");
  const other = unit === "mile" ? seconds / KM_PER_MILE : seconds * KM_PER_MILE;
  return {
    slug: `${minutes}-${secs}-min-${unit}`,
    unit,
    seconds,
    label: unit === "mile" ? `${minutes}:${secs} a mile` : `${minutes}:${secs} per km`,
    otherLabel: unit === "mile" ? `${clock(other)} per km` : `${clock(other)} a mile`,
    center,
    low: center - PACE_WINDOW,
    high: center + PACE_WINDOW
  };
};

const ALL_PACES: PaceInfo[] = [
  ...Array.from({ length: 15 }, (_, i) => makePace("mile", 360 + i * 30)),
  ...Array.from({ length: 9 }, (_, i) => makePace("km", 240 + i * 30))
];

/** One page per distinct step rate (miles first); the others redirect to it. */
export const PACES: PaceInfo[] = ALL_PACES.filter((pace, i) => ALL_PACES.findIndex((o) => o.center === pace.center) === i);

export const paceAlias = (slug: string) => {
  const pace = ALL_PACES.find((p) => p.slug === slug);
  if (!pace || PACES.includes(pace)) return null;
  return PACES.find((o) => o.center === pace.center)?.slug ?? null;
};

/* ---------- Run types ---------- */

export type WorkoutInfo = { slug: string; label: string; run: string; steps: number; minEnergy: number; maxEnergy: number; line: string };

export const WORKOUTS: WorkoutInfo[] = [
  { slug: "warm-up", label: "Warm-up", run: "easy", steps: 156, minEnergy: 0, maxEnergy: 1, line: "Calm songs a touch under an easy stride, for the first ten minutes." },
  { slug: "easy-run", label: "Easy run", run: "easy", steps: 162, minEnergy: 1, maxEnergy: 2, line: "Relaxed songs on an easy stride, around 160 steps a minute." },
  { slug: "long-run", label: "Long run", run: "long", steps: 165, minEnergy: 1, maxEnergy: 2, line: "Steady songs that hold a long-run stride without wearing you out." },
  { slug: "tempo-run", label: "Tempo run", run: "tempo", steps: 172, minEnergy: 2, maxEnergy: 3, line: "Driving songs for comfortably hard running, around 172 steps a minute." },
  { slug: "intervals", label: "Intervals", run: "intervals", steps: 178, minEnergy: 2, maxEnergy: 3, line: "Loud, fast songs for hard reps at 175 steps a minute and up." },
  { slug: "finish-kick", label: "Finish kick", run: "race", steps: 182, minEnergy: 3, maxEnergy: 3, line: "The loudest songs in the library on a sprinting stride." }
];

export const workoutBySlug = (slug: string) => WORKOUTS.find((w) => w.slug === slug);

const workoutSongs = (songs: LibSong[], w: WorkoutInfo) =>
  nearStride(
    songs.filter((s) => s.e >= w.minEnergy && s.e <= w.maxEnergy),
    w.steps,
    4
  );

/* ---------- Index ---------- */

export type MusicIndex = {
  total: number;
  bpms: { bpm: number; count: number }[];
  paces: (PaceInfo & { count: number })[];
  workouts: (WorkoutInfo & { count: number; covers: string[] })[];
  genres: { slug: string; label: string; count: number; covers: string[] }[];
  artists: { slug: string; name: string; count: number }[];
  popular: LibSong[];
};

const songsForBpm = (songs: LibSong[], target: number) =>
  songs.filter((s) => s.b === target || Math.abs(s.b * 2 - target) <= 1).sort(byPopularity);

const songsForGenre = (songs: LibSong[], genre: string) => songs.filter((s) => s.g.includes(genre) && stepsFor(s.b)).sort(byPopularity);

const artistGroups = (songs: LibSong[]) => {
  const groups = new Map<string, { name: string; songs: LibSong[] }>();
  for (const song of songs) {
    const slug = slugify(song.a);
    if (!slug) continue;
    const group = groups.get(slug) ?? { name: song.a, songs: [] };
    group.songs.push(song);
    groups.set(slug, group);
  }
  return groups;
};

const coversOf = (songs: LibSong[], n = 4) => [...new Set(songs.map((s) => s.i).filter((c): c is string => Boolean(c)))].slice(0, n);

export const getMusicIndex = cache(async (): Promise<MusicIndex> => {
  const songs = await getLibrary();
  const bpms: MusicIndex["bpms"] = [];
  for (let bpm = CADENCE_MIN; bpm <= CADENCE_MAX; bpm += 1) {
    const count = songsForBpm(songs, bpm).length;
    if (count >= MIN_SONGS) bpms.push({ bpm, count });
  }
  const paces = PACES.map((p) => ({ ...p, count: nearStride(songs, p.center, PACE_WINDOW).length })).filter((p) => p.count >= MIN_SONGS);
  const workouts = WORKOUTS.map((w) => {
    const list = workoutSongs(songs, w);
    return { ...w, count: list.length, covers: coversOf(list) };
  }).filter((w) => w.count >= MIN_SONGS);
  const genres = GENRES.map((g) => {
    const list = songsForGenre(songs, g.slug);
    return { ...g, count: list.length, covers: coversOf(list) };
  })
    .filter((g) => g.count >= MIN_SONGS)
    .sort((a, b) => b.count - a.count);
  const artists = [...artistGroups(songs).entries()]
    .map(([slug, g]) => ({ slug, name: g.name, count: g.songs.length }))
    .filter((a) => a.count >= 5)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  const popular = songs.filter((s) => stepsFor(s.b)).slice(0, 24);
  return { total: songs.length, bpms, paces, workouts, genres, artists, popular };
});

/* ---------- Pages ---------- */

const HUB = { name: "Running songs", path: "/music" };

const finderLink = (params: Record<string, string | number>) =>
  "/tools/music?" + new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString();

const relatedPaces = (index: MusicIndex, near: number) => ({
  heading: "By pace",
  links: index.paces
    .filter((p) => p.unit === "mile")
    .sort((a, b) => Math.abs(a.center - near) - Math.abs(b.center - near))
    .slice(0, 6)
    .sort((a, b) => a.seconds - b.seconds)
    .map((p) => ({ href: `/music/pace/${p.slug}`, label: p.label }))
});

const relatedWorkouts = (index: MusicIndex, except?: string) => ({
  heading: "By run",
  links: index.workouts.filter((w) => w.slug !== except).map((w) => ({ href: `/music/workout/${w.slug}`, label: w.label }))
});

const relatedGenres = (index: MusicIndex, except?: string) => ({
  heading: "By genre",
  links: index.genres
    .filter((g) => g.slug !== except)
    .slice(0, 10)
    .map((g) => ({ href: `/music/genre/${g.slug}`, label: g.label }))
});

export async function getBpmPage(raw: string): Promise<MusicPageModel | null> {
  const bpm = Number(raw);
  if (!Number.isInteger(bpm) || bpm < CADENCE_MIN || bpm > CADENCE_MAX) return null;
  const songs = songsForBpm(await getLibrary(), bpm);
  if (songs.length < MIN_SONGS) return null;
  const index = await getMusicIndex();
  const half = songs.filter((s) => s.b !== bpm).length;
  const pace = index.paces.find((p) => p.unit === "mile" && Math.abs(p.center - bpm) <= 1);
  return {
    path: `/music/bpm/${bpm}`,
    metaTitle: `${bpm} BPM Running Songs: ${fmt(songs.length)} Songs for ${bpm} Steps a Minute`,
    metaDescription: `${fmt(songs.length)} popular songs that land on ${bpm} steps a minute, with cover art and previews. Build a ${bpm} BPM running playlist in one tap.`,
    eyebrow: "Songs by BPM",
    h1: `${bpm} BPM running songs`,
    lines: [
      `${fmt(songs.length)} songs whose beat lands on ${bpm} steps a minute${half ? `, ${fmt(half)} of them half-time songs near ${Math.round(bpm / 2)} BPM (a beat every two steps)` : ""}.`,
      pace ? `That's about the stride of a ${pace.label} runner.` : "Not sure of your stride? The Music Finder works it out from how the run feels."
    ],
    songs: songs.slice(0, GRID),
    steps: bpm,
    toolHref: finderLink({ steps: bpm }),
    toolLabel: `Build a ${bpm} BPM playlist`,
    crumbs: [HUB, { name: `${bpm} BPM`, path: `/music/bpm/${bpm}` }],
    related: [
      {
        heading: "Nearby BPM",
        links: index.bpms.filter((b) => b.bpm !== bpm && Math.abs(b.bpm - bpm) <= 5).map((b) => ({ href: `/music/bpm/${b.bpm}`, label: `${b.bpm} BPM` }))
      },
      relatedPaces(index, bpm)
    ]
  };
}

export async function getPacePage(slug: string): Promise<MusicPageModel | null> {
  const pace = PACES.find((p) => p.slug === slug);
  if (!pace) return null;
  const songs = nearStride(await getLibrary(), pace.center, PACE_WINDOW);
  if (songs.length < MIN_SONGS) return null;
  const index = await getMusicIndex();
  const minutes = Math.floor(pace.seconds / 60);
  const secs = String(pace.seconds % 60).padStart(2, "0");
  const title = pace.unit === "mile" ? `${minutes}:${secs} Mile` : `${minutes}:${secs}/km`;
  return {
    path: `/music/pace/${pace.slug}`,
    metaTitle: `Running Songs for a ${title} Pace (${pace.center} Steps a Minute)`,
    metaDescription: `${fmt(songs.length)} songs that fit a ${pace.label} pace (${pace.otherLabel}), about ${pace.center} steps a minute. Cover art, previews and a playlist builder.`,
    eyebrow: "Songs by pace",
    h1: `Songs for a ${pace.label} pace`,
    lines: [
      `At ${pace.label} (${pace.otherLabel}) most runners take about ${pace.center} steps a minute, so these ${fmt(songs.length)} songs land between ${pace.low} and ${pace.high}.`,
      "Long legs run a few steps lower, short legs a few higher: nudge it in the Music Finder."
    ],
    songs: songs.slice(0, GRID),
    steps: pace.center,
    toolHref: finderLink({ pace: `${minutes}:${secs}`, unit: pace.unit === "km" ? "km" : "mi" }),
    toolLabel: "Build this playlist",
    crumbs: [HUB, { name: pace.label, path: `/music/pace/${pace.slug}` }],
    related: [relatedPaces(index, pace.center), relatedWorkouts(index)]
  };
}

export async function getWorkoutPage(slug: string): Promise<MusicPageModel | null> {
  const workout = workoutBySlug(slug);
  if (!workout) return null;
  const songs = workoutSongs(await getLibrary(), workout);
  if (songs.length < MIN_SONGS) return null;
  const index = await getMusicIndex();
  return {
    path: `/music/workout/${workout.slug}`,
    metaTitle: `${workout.label} Songs: ${fmt(songs.length)} Running Songs Matched to the Run`,
    metaDescription: `${workout.line} ${fmt(songs.length)} songs with cover art and previews, ready to build into a playlist.`,
    eyebrow: "Songs by run",
    h1: `${workout.label} songs`,
    lines: [workout.line, `${fmt(songs.length)} songs fit; here are the most popular. The Music Finder builds the whole run, warm-up to finish.`],
    songs: songs.slice(0, GRID),
    steps: workout.steps,
    toolHref: finderLink({ run: workout.run, steps: workout.steps }),
    toolLabel: `Build a ${workout.label.toLowerCase()} playlist`,
    crumbs: [HUB, { name: workout.label, path: `/music/workout/${workout.slug}` }],
    related: [relatedWorkouts(index, workout.slug), relatedGenres(index)]
  };
}

export async function getGenrePage(slug: string): Promise<MusicPageModel | null> {
  if (!GENRES.some((g) => g.slug === slug)) return null;
  const songs = songsForGenre(await getLibrary(), slug);
  if (songs.length < MIN_SONGS) return null;
  const index = await getMusicIndex();
  const label = genreName(slug);
  const steps = songs.map((s) => stepsFor(s.b)!.steps).sort((a, b) => a - b);
  const mid = steps[Math.floor(steps.length / 2)];
  return {
    path: `/music/genre/${slug}`,
    metaTitle: `${label} Running Songs with BPM: ${fmt(songs.length)} Songs`,
    metaDescription: `${fmt(songs.length)} ${label.toLowerCase()} songs for running, each with its BPM and the stride it fits. Cover art, previews and a playlist builder.`,
    eyebrow: "Songs by genre",
    h1: `${label} running songs`,
    lines: [
      `${fmt(songs.length)} ${label.toLowerCase()} songs with a beat you can run to; the middle of the pack lands on ${mid} steps a minute.`,
      "Filter by stride below, or let the Music Finder pick the ones that fit your run."
    ],
    songs: songs.slice(0, GRID),
    steps: null,
    toolHref: finderLink({ genre: slug }),
    toolLabel: `Build a ${label.toLowerCase()} playlist`,
    crumbs: [HUB, { name: label, path: `/music/genre/${slug}` }],
    related: [relatedGenres(index, slug), relatedWorkouts(index)]
  };
}

export async function getArtistPage(slug: string): Promise<MusicPageModel | null> {
  const group = artistGroups(await getLibrary()).get(slug);
  if (!group || group.songs.length < 5) return null;
  const songs = [...group.songs].sort(byPopularity);
  const fits = songs.filter((s) => stepsFor(s.b));
  const index = await getMusicIndex();
  return {
    path: `/music/artist/${slug}`,
    metaTitle: `${group.name} Songs for Running, with BPM`,
    metaDescription: `${fmt(songs.length)} ${group.name} songs with their BPM and the running stride each one fits. Cover art, previews and a playlist builder.`,
    eyebrow: "Songs by artist",
    h1: `${group.name} for running`,
    lines: [
      `${fmt(songs.length)} ${group.name} songs in our library, ${fmt(fits.length)} of them on a running stride.`,
      "Tap a cover for a preview, or search any song in the Music Finder to swap it into your playlist."
    ],
    songs: songs.slice(0, GRID),
    steps: null,
    toolHref: "/tools/music",
    toolLabel: "Open the Music Finder",
    crumbs: [HUB, { name: group.name, path: `/music/artist/${slug}` }],
    related: [
      {
        heading: "More artists",
        links: index.artists
          .filter((a) => a.slug !== slug)
          .slice(0, 12)
          .map((a) => ({ href: `/music/artist/${a.slug}`, label: a.name }))
      }
    ]
  };
}

/* ---------- Sitemap ---------- */

export const musicPaths = (index: MusicIndex) => [
  "/music",
  ...index.paces.map((p) => `/music/pace/${p.slug}`),
  ...index.workouts.map((w) => `/music/workout/${w.slug}`),
  ...index.genres.map((g) => `/music/genre/${g.slug}`),
  ...index.bpms.map((b) => `/music/bpm/${b.bpm}`),
  ...index.artists.map((a) => `/music/artist/${a.slug}`)
];

export async function getMusicContentSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  let index: MusicIndex;
  try {
    index = await getMusicIndex();
  } catch (error) {
    console.error("music sitemap entries skipped:", error);
    return [];
  }
  if (!index.total) return [];
  return musicPaths(index).map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "weekly",
    priority: path === "/music" ? 0.7 : 0.5
  }));
}
