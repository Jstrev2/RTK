/*
 * The outside music sources, each with its own pace limit.
 *
 * - Deezer's public API (no key): charts, playlists, track details with ISRC,
 *   cover art and 30-second previews. 50 requests per 5 seconds per IP.
 * - Spotify's Web API with client credentials: search (including by ISRC) and
 *   album art. Audio features and recommendations are closed to new apps.
 * - GetSongBPM (api.getsong.co): tempos for the songs it knows. Its terms ask
 *   for a visible link to getsongbpm.com wherever its data shows.
 */

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Spaces out calls to one host: each call starts at least `gapMs` after the previous one. */
const pacer = (gapMs: number) => {
  let next = 0;
  return async () => {
    const now = Date.now();
    const wait = Math.max(0, next - now);
    next = Math.max(now, next) + gapMs;
    if (wait) await sleep(wait);
  };
};

const deezerPace = pacer(115);
// Spotify keeps apps in development mode on a small quota: on November 23,
// 2026 about 700 searches at 10 a second earned a 23-hour lockout. Stay slow.
const spotifyPace = pacer(700);
const getsongPace = pacer(1250);

const fetchJson = async (url: string, init: RequestInit = {}, timeoutMs = 12000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    const text = await response.text();
    let body: unknown = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = null;
    }
    return { status: response.status, headers: response.headers, body };
  } finally {
    clearTimeout(timer);
  }
};

/* ---------- Deezer ---------- */

export type DeezerTrack = {
  id: number;
  title: string;
  title_short?: string;
  title_version?: string;
  isrc?: string;
  duration?: number;
  rank?: number;
  bpm?: number;
  preview?: string;
  release_date?: string;
  explicit_lyrics?: boolean;
  readable?: boolean;
  artist: { id: number; name: string };
  contributors?: { id: number; name: string; role?: string }[];
  album?: { id: number; title: string; cover_xl?: string; cover_big?: string; cover_medium?: string; genre_id?: number };
};

export async function deezer<T = unknown>(path: string): Promise<T | null> {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    await deezerPace();
    try {
      const { status, body } = await fetchJson("https://api.deezer.com" + path);
      const error = (body as { error?: { code?: number; message?: string } } | null)?.error;
      if (error) {
        // Code 4 is Deezer's "quota exceeded": wait out the 5-second window.
        if (error.code === 4) {
          await sleep(5500);
          continue;
        }
        return null;
      }
      if (status >= 500) {
        await sleep(1000 * (attempt + 1));
        continue;
      }
      return body as T;
    } catch {
      await sleep(1000 * (attempt + 1));
    }
  }
  return null;
}

/** Deezer chart genres we read, with the site's genre slug for each. */
export const DEEZER_CHARTS: { id: number; genre: string | null }[] = [
  { id: 0, genre: null },
  { id: 132, genre: "pop" },
  { id: 116, genre: "hip-hop" },
  { id: 113, genre: "electronic" },
  { id: 106, genre: "electronic" },
  { id: 152, genre: "rock" },
  { id: 85, genre: "rock" },
  { id: 165, genre: "r-and-b" },
  { id: 122, genre: "latin" },
  { id: 197, genre: "latin" },
  { id: 84, genre: "country" },
  { id: 464, genre: "metal" },
  { id: 169, genre: "soul" },
  { id: 466, genre: "folk" },
  { id: 144, genre: "reggae" },
  { id: 186, genre: "christian" }
];

/** Deezer album genre ids to the site's genre slugs. Kids, classical and soundtracks are left out. */
export const DEEZER_GENRES: Record<number, string> = {
  132: "pop",
  116: "hip-hop",
  113: "electronic",
  106: "electronic",
  152: "rock",
  85: "rock",
  165: "r-and-b",
  122: "latin",
  197: "latin",
  67: "latin",
  71: "latin",
  84: "country",
  464: "metal",
  169: "soul",
  466: "folk",
  144: "reggae",
  129: "jazz",
  153: "blues",
  186: "christian",
  2: "world",
  75: "world",
  81: "world",
  16: "world"
};

/** Deezer genres whose albums are not running music. */
export const DEEZER_SKIP_GENRES = new Set([95, 98, 173]);

/** Search terms for runners' playlists on Deezer. */
export const PLAYLIST_TERMS = [
  "running",
  "run",
  "workout",
  "cardio",
  "marathon",
  "tempo run",
  "cardio hits",
  "jogging",
  "running hits",
  "running motivation",
  "gym",
  "treadmill",
  "half marathon",
  "5k"
];

export const deezerChart = async (genreId: number, limit = 300) =>
  (await deezer<{ data: DeezerTrack[] }>(`/chart/${genreId}/tracks?limit=${limit}`))?.data ?? [];

export type DeezerPlaylist = { id: number; title: string; nb_tracks: number; user?: { name: string } };

export const deezerSearchPlaylists = async (term: string, max = 150) => {
  const found: DeezerPlaylist[] = [];
  for (let index = 0; index < max; index += 100) {
    const page = await deezer<{ data: DeezerPlaylist[]; next?: string }>(
      `/search/playlist?q=${encodeURIComponent(term)}&limit=100&index=${index}`
    );
    if (!page?.data?.length) break;
    found.push(...page.data);
    if (!page.next) break;
  }
  return found.slice(0, max);
};

export const deezerPlaylistTracks = async (id: number, max = 200) => {
  const tracks: DeezerTrack[] = [];
  for (let index = 0; index < max; index += 100) {
    const page = await deezer<{ data: DeezerTrack[]; next?: string }>(`/playlist/${id}/tracks?limit=100&index=${index}`);
    if (!page?.data?.length) break;
    tracks.push(...page.data);
    if (!page.next) break;
  }
  return tracks;
};

export const deezerTrack = (id: number | string) => deezer<DeezerTrack>(`/track/${id}`);

export const deezerTrackByIsrc = (isrc: string) => deezer<DeezerTrack>(`/track/isrc:${encodeURIComponent(isrc)}`);

export const deezerAlbumGenres = async (albumId: number) => {
  const album = await deezer<{ genre_id?: number; genres?: { data?: { id: number }[] } }>(`/album/${albumId}`);
  if (!album) return null;
  const ids = album.genres?.data?.map((g) => g.id) ?? [];
  if (album.genre_id != null && !ids.includes(album.genre_id)) ids.unshift(album.genre_id);
  return ids;
};

/**
 * Plain search for "title artist". (Deezer's artist:"" track:"" filters
 * returned nothing in November 2026, so callers match title and artist
 * themselves.)
 */
export const deezerSearchTrack = async (title: string, artist: string) => {
  const q = `${title.replace(/\s*[([].*?[)\]]/g, "").replace(/\s+-\s+.*$/, "")} ${artist}`.replace(/"/g, "").trim();
  return (await deezer<{ data: DeezerTrack[] }>(`/search?limit=15&q=${encodeURIComponent(q)}`))?.data ?? [];
};

/* ---------- Spotify (client credentials) ---------- */

export type SpotifyTrack = {
  id: string;
  name: string;
  duration_ms: number;
  popularity?: number;
  explicit?: boolean;
  preview_url?: string | null;
  external_ids?: { isrc?: string };
  artists: { id: string; name: string }[];
  album: { id: string; name: string; images: { url: string; width: number; height: number }[]; release_date?: string };
};

let spotifyToken: { value: string; expires: number } | null = null;

const getSpotifyToken = async () => {
  if (spotifyToken && spotifyToken.expires > Date.now() + 60_000) return spotifyToken.value;
  const id = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!id || !secret) throw new Error("Spotify credentials are not set");
  const { status, body } = await fetchJson("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + Buffer.from(`${id}:${secret}`).toString("base64")
    },
    body: "grant_type=client_credentials"
  });
  const token = body as { access_token?: string; expires_in?: number } | null;
  if (status !== 200 || !token?.access_token) throw new Error(`Spotify token failed (${status})`);
  spotifyToken = { value: token.access_token, expires: Date.now() + (token.expires_in ?? 3600) * 1000 };
  return spotifyToken.value;
};

/** Spotify has locked the app out for a while (a long 429). Callers stop and try another day. */
export class SpotifyUnavailable extends Error {
  constructor(public until: number) {
    super(`Spotify is rate limiting this app until ${new Date(until).toISOString()}`);
  }
}

let spotifyBlockedUntil = 0;
export const spotifyAvailable = () => Date.now() >= spotifyBlockedUntil;

export async function spotify<T = unknown>(path: string): Promise<T | null> {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    if (!spotifyAvailable()) throw new SpotifyUnavailable(spotifyBlockedUntil);
    await spotifyPace();
    const token = await getSpotifyToken();
    try {
      const { status, headers, body } = await fetchJson("https://api.spotify.com/v1" + path, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (status === 429) {
        const retry = Number(headers.get("retry-after") ?? "2");
        // A long lockout is not worth waiting out: remember it and stop.
        if (retry > 30) {
          spotifyBlockedUntil = Date.now() + retry * 1000;
          throw new SpotifyUnavailable(spotifyBlockedUntil);
        }
        await sleep((retry + 1) * 1000);
        continue;
      }
      if (status === 401) {
        spotifyToken = null;
        continue;
      }
      if (status >= 500) {
        await sleep(1000 * (attempt + 1));
        continue;
      }
      if (status !== 200) return null;
      return body as T;
    } catch (error) {
      if (error instanceof SpotifyUnavailable) throw error;
      await sleep(1000 * (attempt + 1));
    }
  }
  return null;
}

export const spotifySearchTracks = async (query: string, limit = 10) =>
  (await spotify<{ tracks: { items: SpotifyTrack[] } }>(
    `/search?type=track&market=US&limit=${limit}&q=${encodeURIComponent(query)}`
  ))?.tracks.items ?? [];

export const spotifyTrackByIsrc = async (isrc: string) => {
  const items = await spotifySearchTracks(`isrc:${isrc}`, 5);
  return items.find((item) => item.external_ids?.isrc?.toUpperCase() === isrc.toUpperCase()) ?? items[0] ?? null;
};

export const spotifyTrack = (id: string) => spotify<SpotifyTrack>(`/tracks/${encodeURIComponent(id)}?market=US`);

export const spotifyImage = (track: SpotifyTrack) => {
  const images = [...(track.album.images ?? [])].sort((a, b) => b.width - a.width);
  return images.find((image) => image.width <= 640)?.url ?? images[0]?.url ?? null;
};

/* ---------- GetSongBPM ---------- */

type GetSongHit = { id: string; title: string; tempo: string | number; uri?: string; artist: { name: string } };

const looseKey = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\s*[([].*?[)\]]/g, "")
    .replace(/\s+-\s+.*$/, "")
    .replace(/\bfeat\.?\b.*$/, "")
    .replace(/^the\s+/, "")
    .replace(/[^a-z0-9]+/g, "");

const getSongSearch = async (params: string) => {
  const key = process.env.GETSONGBPM_API_KEY;
  if (!key) return null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await getsongPace();
    try {
      const { status, body } = await fetchJson(`https://api.getsong.co/search/?api_key=${key}&${params}`);
      if (status === 429 || status >= 500) {
        await sleep(5000 * (attempt + 1));
        continue;
      }
      const search = (body as { search?: GetSongHit[] | { error?: string } } | null)?.search;
      return Array.isArray(search) ? search : [];
    } catch {
      await sleep(2000);
    }
  }
  return null;
};

export type GetSongMatch = { bpm: number; uri: string | null };

/**
 * GetSongBPM's tempo for a song, only when both the title and one of the
 * artists match. Returns undefined when the service could not be reached
 * (try again later) and null when it doesn't know the song.
 */
export async function getSongBpm(title: string, artists: string[], options: { thorough?: boolean } = {}): Promise<GetSongMatch | null | undefined> {
  const titleKey = looseKey(title);
  const artistKeys = artists.map(looseKey).filter(Boolean);
  if (!titleKey || !artistKeys.length) return null;
  // A remix or other version can have its own tempo: only accept GetSongBPM's
  // entry when it names the same kind of version.
  const variant = title.match(/\b(remix|rework|bootleg|flip|version|mix|vip|live|acoustic)\b/i)?.[1]?.toLowerCase();
  const pick = (hits: GetSongHit[]) => {
    for (const hit of hits) {
      const tempo = Number(hit.tempo);
      if (!tempo || tempo < 40 || tempo > 250) continue;
      if (looseKey(hit.title) !== titleKey) continue;
      if (variant && !hit.title.toLowerCase().includes(variant)) continue;
      if (!variant && /\b(remix|live|acoustic)\b/i.test(hit.title)) continue;
      const hitArtist = looseKey(hit.artist?.name ?? "");
      if (!artistKeys.some((a) => a === hitArtist || (a.length > 3 && hitArtist.includes(a)) || (hitArtist.length > 3 && a.includes(hitArtist)))) continue;
      return { bpm: tempo, uri: hit.uri ?? null };
    }
    return null;
  };
  const cleanTitle = title.replace(/\s*[([].*?[)\]]/g, "").replace(/\s+-\s+.*$/, "").trim();
  const both = await getSongSearch(
    `type=both&lookup=${encodeURIComponent(`song:${cleanTitle}artist:${artists[0]}`)}`
  );
  if (both === null) return undefined;
  const first = pick(both);
  if (first) return first;
  // The title-only search costs a second call; the backfill skips it for speed.
  if (options.thorough === false) return null;
  const songs = await getSongSearch(`type=song&lookup=${encodeURIComponent(cleanTitle)}`);
  if (songs === null) return undefined;
  return pick(songs);
}
