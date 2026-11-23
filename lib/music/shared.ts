/*
 * Song library shapes and math shared by the Music Finder, the /music browse
 * pages and the API routes. Safe to import in the browser.
 */

export type EnergyLevel = 0 | 1 | 2 | 3;

/** One song, in the compact form the browser receives. */
export type LibSong = {
  id: string;
  /** title */
  t: string;
  /** artist */
  a: string;
  /** tempo (beats a minute) */
  b: number;
  /** energy 0 low .. 3 extreme */
  e: EnergyLevel;
  /** genre slugs */
  g: string[];
  /** cover: "d:<md5>" (Deezer), "s:<id>" (Spotify) or a full URL */
  i: string | null;
  /** Spotify track id */
  s: string | null;
  /** Deezer track id (for the 30-second preview) */
  d: number | null;
  /** popularity 0..100 */
  p: number;
  /** length in seconds */
  len?: number;
};

export const ENERGY_WORDS = ["Low", "Medium", "High", "Extreme"] as const;

export const GENRES: { slug: string; label: string }[] = [
  { slug: "pop", label: "Pop" },
  { slug: "hip-hop", label: "Hip-hop" },
  { slug: "rock", label: "Rock" },
  { slug: "electronic", label: "Electronic" },
  { slug: "r-and-b", label: "R&B" },
  { slug: "latin", label: "Latin" },
  { slug: "country", label: "Country" },
  { slug: "metal", label: "Metal" },
  { slug: "punk", label: "Punk" },
  { slug: "soul", label: "Soul & funk" },
  { slug: "folk", label: "Folk" },
  { slug: "reggae", label: "Reggae" },
  { slug: "christian", label: "Christian" },
  { slug: "jazz", label: "Jazz" },
  { slug: "blues", label: "Blues" },
  { slug: "world", label: "World" }
];

export const genreName = (slug: string) =>
  GENRES.find((g) => g.slug === slug)?.label ?? slug.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());

/* ---------- Covers ---------- */

export const packCover = (url: string | null) => {
  if (!url) return null;
  const deezer = url.match(/^https:\/\/cdn-images\.dzcdn\.net\/images\/cover\/([0-9a-f]{32})\//);
  if (deezer) return "d:" + deezer[1];
  const spotify = url.match(/^https:\/\/i\.scdn\.co\/image\/([0-9a-z]+)$/i);
  if (spotify) return "s:" + spotify[1];
  return url;
};

export const coverUrl = (code: string | null, size: 120 | 250 | 500 = 250) => {
  if (!code) return null;
  if (code.startsWith("d:")) return `https://cdn-images.dzcdn.net/images/cover/${code.slice(2)}/${size}x${size}-000000-80-0-0.jpg`;
  if (code.startsWith("s:")) return `https://i.scdn.co/image/${code.slice(2)}`;
  return code;
};

export const spotifyLink = (song: Pick<LibSong, "s" | "t" | "a">) =>
  song.s
    ? `https://open.spotify.com/track/${song.s}`
    : `https://open.spotify.com/search/${encodeURIComponent(`${song.t} ${song.a}`)}`;

/* ---------- Stride ---------- */

export const CADENCE_MIN = 140;
export const CADENCE_MAX = 200;

/** The step rate a song lines up with: on the beat, or two steps a beat. */
export const stepsFor = (bpm: number): { steps: number; half: boolean } | null => {
  if (bpm >= CADENCE_MIN && bpm <= CADENCE_MAX) return { steps: bpm, half: false };
  if (bpm * 2 >= CADENCE_MIN && bpm * 2 <= CADENCE_MAX) return { steps: bpm * 2, half: true };
  return null;
};

/*
 * Pace to cadence: about 162 steps a minute at 10:00 a mile, rising about 2.3
 * steps a minute for every 1 km/h faster (a fit to published cadence studies
 * of recreational runners). Height and stride move it a few steps either way,
 * which is why the finder has a "faster / slower songs" nudge.
 */
const KM_PER_MILE = 1.609344;
export const cadenceForPace = (secondsPerUnit: number, unit: "mi" | "km") => {
  const km = unit === "mi" ? KM_PER_MILE : 1;
  const kmh = (3600 * km) / secondsPerUnit;
  return Math.round(Math.min(192, Math.max(148, 140 + 2.3 * kmh)));
};

export const paceForCadence = (steps: number) => {
  const kmh = (steps - 140) / 2.3;
  if (kmh <= 0) return null;
  const mile = (3600 * KM_PER_MILE) / kmh;
  const km = 3600 / kmh;
  return { mile: clock(mile), km: clock(km) };
};

export const clock = (seconds: number) => {
  const rounded = Math.round(seconds / 5) * 5;
  return `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, "0")}`;
};

export const parsePace = (value: string) => {
  const match = value.trim().match(/^(\d{1,2})(?::(\d{1,2}))?$/);
  if (!match) return null;
  const seconds = Number(match[1]) * 60 + Number(match[2] ?? 0);
  return seconds >= 150 && seconds <= 1200 ? seconds : null;
};

/* ---------- Run types and effort ---------- */

export type RunType = "easy" | "long" | "tempo" | "intervals" | "race";
export type Feel = "easy" | "steady" | "hard" | "race";

export const RUN_TYPES: { id: RunType; label: string; feel: Feel; note: string }[] = [
  { id: "easy", label: "Easy run", feel: "easy", note: "Relaxed, chatty" },
  { id: "long", label: "Long run", feel: "steady", note: "Steady, builds late" },
  { id: "tempo", label: "Tempo", feel: "hard", note: "Comfortably hard" },
  { id: "intervals", label: "Intervals", feel: "hard", note: "Hard reps" },
  { id: "race", label: "Race", feel: "race", note: "All in" }
];

export const FEELS: { id: Feel; label: string; steps: number; energy: EnergyLevel; note: string }[] = [
  { id: "easy", label: "Easy", steps: 160, energy: 1, note: "Could chat the whole way" },
  { id: "steady", label: "Steady", steps: 166, energy: 2, note: "A few words at a time" },
  { id: "hard", label: "Hard", steps: 172, energy: 2, note: "Short phrases only" },
  { id: "race", label: "Race", steps: 178, energy: 3, note: "No talking" }
];

/** Energy the run wants, given how hard it feels. */
export const energyForFeel = (feel: Feel): EnergyLevel => FEELS.find((f) => f.id === feel)?.energy ?? 2;

/** Rough feel from a step rate, for runners who gave a pace. */
export const feelForSteps = (steps: number): Feel => (steps < 163 ? "easy" : steps < 169 ? "steady" : steps < 175 ? "hard" : "race");

/* ---------- Fit and playlist ---------- */

export type Slot = { steps: number; energy: EnergyLevel; phase: "warm" | "main" | "finish" };

export const fitOf = (song: LibSong, target: number) => {
  const match = stepsFor(song.b);
  if (!match) return null;
  return { ...match, off: Math.abs(match.steps - target) };
};

/** Two or three words on why a song suits its spot. */
export const whyItFits = (song: LibSong, slot: Slot) => {
  const fit = fitOf(song, slot.steps);
  if (!fit) return "Off stride";
  if (slot.phase === "finish" && song.e >= 2) return "Big finish";
  if (slot.phase === "warm" && song.e <= 1) return "Easy start";
  if (song.e === 3 && fit.off <= 2) return "Full send";
  if (fit.half) return fit.off <= 1 ? "Half-time lock" : "Half-time groove";
  if (fit.off <= 1) return "Right on stride";
  return "Near your stride";
};

const hash = (text: string, seed: number) => {
  let h = 2166136261 ^ seed;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
};

export const scoreSong = (song: LibSong, slot: Slot, options: { window: number; seed: number; genres: string[] }) => {
  const fit = fitOf(song, slot.steps);
  if (!fit || fit.off > options.window) return null;
  let score = 10 - fit.off * 1.2;
  score -= Math.abs(song.e - slot.energy) * 2.2;
  score += (song.p / 100) * 4;
  if (!fit.half) score += 0.6;
  if (options.genres.length && song.g.some((g) => options.genres.includes(g))) score += 3;
  score += hash(song.id, options.seed) * 2.5;
  return score;
};

export type PlaylistRequest = {
  steps: number;
  energy: EnergyLevel;
  minutes: number;
  genres: string[];
  runType: RunType;
  seed: number;
  exclude?: Set<string>;
};

export type PlaylistTrack = { song: LibSong; slot: Slot; why: string };
export type PlaylistPhase = { id: Slot["phase"]; label: string; note: string; steps: number; tracks: PlaylistTrack[] };

const PHASE_NAMES: Record<Slot["phase"], { label: string; note: string }> = {
  warm: { label: "Warm up", note: "A touch slower and calmer while you settle in." },
  main: { label: "Main set", note: "Locked to your stride." },
  finish: { label: "Finish", note: "Same stride, the loudest songs saved for last." }
};

/**
 * Build the playlist: warm-up (about a fifth), main set, finish (about a
 * sixth). Songs must line up with the slot's step rate (on the beat or
 * half-time); the window widens only if the library runs short. At most two
 * songs per artist.
 */
export const buildPlaylist = (library: LibSong[], request: PlaylistRequest): PlaylistPhase[] => {
  const averageSeconds = 215;
  const total = Math.max(4, Math.min(60, Math.round((request.minutes * 60) / averageSeconds)));
  const warmCount = request.minutes >= 20 ? Math.max(2, Math.round(total / 5)) : 0;
  const finishCount = Math.max(1, Math.round(total / 6));
  const mainCount = Math.max(1, total - warmCount - finishCount);
  const up = (e: number) => Math.min(3, e + 1) as EnergyLevel;
  const down = (e: number) => Math.max(0, e - 1) as EnergyLevel;
  const mainEnergy = request.energy;
  const plan: { phase: Slot["phase"]; count: number; slot: Slot }[] = [
    { phase: "warm", count: warmCount, slot: { phase: "warm", steps: request.steps - 4, energy: down(mainEnergy) } },
    { phase: "main", count: mainCount, slot: { phase: "main", steps: request.steps, energy: mainEnergy } },
    { phase: "finish", count: finishCount, slot: { phase: "finish", steps: request.steps + (request.runType === "easy" ? 0 : 2), energy: up(mainEnergy) } }
  ];

  const used = new Set<string>(request.exclude ?? []);
  const perArtist = new Map<string, number>();
  const genrePool = request.genres.length ? library.filter((s) => s.g.some((g) => request.genres.includes(g))) : library;
  const pool = genrePool.length >= total * 3 ? genrePool : library;

  return plan
    .filter((p) => p.count > 0)
    .map((p) => {
      const tracks: PlaylistTrack[] = [];
      for (const window of [3, 5, 8]) {
        if (tracks.length >= p.count) break;
        const ranked = pool
          .map((song) => ({ song, score: used.has(song.id) ? null : scoreSong(song, p.slot, { window, seed: request.seed, genres: request.genres }) }))
          .filter((x): x is { song: LibSong; score: number } => x.score !== null)
          .sort((a, b) => b.score - a.score);
        for (const { song } of ranked) {
          if (tracks.length >= p.count) break;
          const artist = song.a.toLowerCase();
          if ((perArtist.get(artist) ?? 0) >= 2 || used.has(song.id)) continue;
          used.add(song.id);
          perArtist.set(artist, (perArtist.get(artist) ?? 0) + 1);
          tracks.push({ song, slot: p.slot, why: whyItFits(song, p.slot) });
        }
      }
      if (p.phase === "finish") tracks.sort((a, b) => a.song.e - b.song.e);
      return { id: p.phase, ...PHASE_NAMES[p.phase], steps: p.slot.steps, tracks };
    });
};

/** Search the library by title or artist; best fit to the target first when one is given. */
export const searchSongs = (library: LibSong[], query: string, target?: number, limit = 30) => {
  const words = query
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return [];
  const hay = (s: LibSong) =>
    `${s.t} ${s.a}`
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "");
  return library
    .filter((song) => {
      const text = hay(song);
      return words.every((w) => text.includes(w));
    })
    .map((song) => {
      const fit = target ? fitOf(song, target) : null;
      const starts = hay(song).startsWith(words[0]) ? 1 : 0;
      // The song people mean comes first (popularity), then how well it fits the stride.
      const fitScore = target ? (fit && fit.off <= 3 ? 4 : 0) - (fit ? Math.min(fit.off, 20) : 24) / 4 : 0;
      return { song, rank: song.p / 5 + starts * 2 + fitScore };
    })
    .sort((a, b) => b.rank - a.rank)
    .slice(0, limit)
    .map((x) => x.song);
};
