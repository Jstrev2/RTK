/*
 * Rules shared by the ingest, the backfill and the pages: what counts as junk,
 * how two rows are the same song, and how a tempo and a preview's intensity
 * become a step rate, an energy level and workout tags.
 */

export type Energy = "low" | "medium" | "high" | "extreme";

/** Kids' and lullaby acts, karaoke, cover and "workout remix" factories. */
const JUNK_ARTIST =
  /kidz bop|rockabye baby|twinkle twinkle little rock star|sweet little band|lullab|karaoke|string quartet|8-bit|8 bit|tribute|richard cheese|hayseed dixie|leo moracchioli|postmodern jukebox|iron horse|piano dreamers|the piano guys|vitamin string|midnite string|countdown kids|kids music|children'?s|nursery|cover band|the covers|workout|fitness|cardio\b|aerobic|gym (music|hits|workout|motivation)|running (music|songs|hits|workout|club|crew|playlist|trax|mix)|power music|spinning|\bbpm\b|top hits|hit crew|party hit|dj tone|chill hits|the fitness|baby lullaby|music for|sleep music|sleep sounds|white noise|meditation|relaxing|study music/i;

const JUNK_TITLE =
  /karaoke|in the style of|originally performed|made famous|tribute to|\binstrumental\b|\bbpm\b|workout (mix|remix|version|edit)|lullab|8-bit|\bsped up\b|\bslowed\b|nightcore|\breverb\b|[([-]\s*(acoustic )?cover\b|\bmegamix\b|\bmashup\b|\bmedley\b/i;

export const isJunkArtist = (artist: string) => JUNK_ARTIST.test(artist);
export const isJunkTitle = (title: string) => JUNK_TITLE.test(title);
export const isJunk = (title: string, artist: string) => isJunkArtist(artist) || isJunkTitle(title);

/** Same song, whatever the release: title without brackets or "- Remastered", first artist. */
export const songKey = (title: string, artist: string) => {
  const t = title
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s*[([].*?[)\]]/g, "")
    .replace(/\s+-\s+.*$/, "")
    .replace(/[^a-z0-9]+/g, "");
  const a = artist
    .split(/,|&| feat\.? | x | and /i)[0]
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/^the\s+/, "")
    .replace(/[^a-z0-9]+/g, "");
  return t + "|" + a;
};

/** Title alone, for spotting covers of the same song. */
export const titleKey = (title: string) => songKey(title, "x").split("|")[0];

/* ---------- Tempo and steps ---------- */

export const CADENCE_MIN = 140;
export const CADENCE_MAX = 200;

/**
 * A detected tempo is only known up to a factor of two (a drummer's 170 can be
 * heard as 85). Fold analysis tempos into 70..180: anything slower is doubled,
 * anything faster halved. GetSongBPM's tempos are stored as they come.
 */
export const foldTempo = (bpm: number) => {
  let value = bpm;
  while (value < 70) value *= 2;
  while (value > 180) value /= 2;
  return value;
};

/** The step rate a tempo lines up with: on the beat, or two steps a beat. */
export const stepRate = (bpm: number): { steps: number; halfTime: boolean } | null => {
  if (bpm >= CADENCE_MIN && bpm <= CADENCE_MAX) return { steps: bpm, halfTime: false };
  if (bpm * 2 >= CADENCE_MIN && bpm * 2 <= CADENCE_MAX) return { steps: bpm * 2, halfTime: true };
  return null;
};

/*
 * Energy from a preview's intensity (lib/music/tempo.ts). The cut points split
 * the November 2026 library into roughly a fifth low, a third medium, a third
 * high and the loudest eighth extreme.
 */
export const ENERGY_CUTS = { medium: 0.55, high: 0.63, extreme: 0.685 };

export const energyFromIntensity = (intensity: number): Energy =>
  intensity >= ENERGY_CUTS.extreme
    ? "extreme"
    : intensity >= ENERGY_CUTS.high
      ? "high"
      : intensity >= ENERGY_CUTS.medium
        ? "medium"
        : "low";

/** Workout tags from the step rate and energy (the step windows are the workout pages'). */
export const workoutTags = (bpm: number | null, energy: Energy | null) => {
  const match = bpm ? stepRate(bpm) : null;
  if (!match) return [];
  const steps = match.steps;
  const level = energy === "extreme" ? 3 : energy === "high" ? 2 : energy === "medium" ? 1 : 0;
  const tags: string[] = [];
  if (steps <= 160 && level <= 1) tags.push("warm_up");
  if (steps >= 150 && steps <= 168 && level <= 2) tags.push("easy_run");
  if (steps >= 155 && steps <= 172 && level >= 1) tags.push("long_run");
  if (steps >= 164 && steps <= 182 && level >= 1) tags.push("tempo_run");
  if (steps >= 174 && level >= 2) tags.push("speed_work");
  if (steps >= 174 && level >= 3) tags.push("finish_kick");
  return tags;
};

/* ---------- Genres ---------- */

export const GENRE_LABELS: Record<string, string> = {
  pop: "Pop",
  "hip-hop": "Hip-hop",
  rock: "Rock",
  electronic: "Electronic",
  "r-and-b": "R&B",
  latin: "Latin",
  country: "Country",
  metal: "Metal",
  punk: "Punk",
  soul: "Soul & funk",
  funk: "Funk",
  folk: "Folk",
  reggae: "Reggae",
  jazz: "Jazz",
  blues: "Blues",
  christian: "Christian",
  world: "World",
  classical: "Classical",
  "new-age": "New age"
};

/** Old free-text genre tags to slugs. */
export const genreSlug = (raw: string) => {
  const value = raw.toLowerCase().trim();
  const known: Record<string, string> = {
    "heavy metal": "metal",
    rap: "hip-hop",
    "hip hop": "hip-hop",
    "r&b": "r-and-b",
    "new age": "new-age",
    dance: "electronic",
    edm: "electronic",
    alternative: "rock",
    indie: "rock"
  };
  return known[value] ?? value.replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
};

/*
 * Who the library is for. Deezer's playlists and popularity lean French
 * (November 2026: of the playlist-only tracks, more came from France than
 * from the US), while runnertoolkit.com's readers are mostly in English-
 * speaking countries. A track from a runners' playlist gets in when its ISRC
 * was registered in one of these markets (the first two letters; QM, QZ, QT,
 * DG, TC and the like are US registrars), or when its artist is on the US
 * charts or already in the library. Chart songs always get in.
 */
const AUDIENCE_MARKETS = /^(US|GB|UK|CA|AU|NZ|IE|QM|QZ|QT|QN|QJ|QY|DG|TC|GX|CB|SE|NO|DK|NL|FI|JM|ZA)/i;

/** Registered in one of the audience markets (unknown counts as yes). */
export const audienceMarket = (isrc: string | null | undefined) => !isrc || AUDIENCE_MARKETS.test(isrc);

export const fitsAudience = (isrc: string | null | undefined, charted: boolean, artistKnown: boolean) =>
  charted || artistKnown || !isrc || AUDIENCE_MARKETS.test(isrc);

/** First artist only, for "is this artist known" checks. */
export const artistKey = (artist: string) => songKey("x", artist).split("|")[1];
