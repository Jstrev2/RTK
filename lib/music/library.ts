import { cache } from "react";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { packCover, type EnergyLevel, type LibSong } from "./shared";
import { audienceMarket, genreSlug } from "./catalog-rules";

/*
 * The playable library: every song with a trusted BPM and a cover. Read once
 * per request on the server (pages) and served compact to the Music Finder
 * through /api/music/library (cached at the edge for an hour).
 */

type Row = {
  id: string;
  title: string;
  artist: string;
  bpm: number | null;
  genre: string[] | null;
  energy: string | null;
  spotify_id: string | null;
  deezer_id: number | null;
  image_url: string | null;
  popularity: number | null;
  bpm_source: string | null;
  album: string | null;
  duration_ms: number | null;
  upvotes: number | null;
  downvotes: number | null;
  isrc: string | null;
};

const ENERGY: Record<string, EnergyLevel> = { low: 0, medium: 1, high: 2, extreme: 3 };

/**
 * Deezer rank (0..1,000,000) to 0..100, spread so chart songs land in the 70s
 * to 90s. Deezer's rank leans French (its biggest market), so songs registered
 * outside the site's audience markets count for three quarters.
 */
const popularityScore = (rank: number | null, votes: number, isrc: string | null) => {
  if (!rank) return Math.max(0, Math.min(100, 30 + votes * 5));
  const local = audienceMarket(isrc) ? 1 : 0.75;
  return Math.max(0, Math.min(100, Math.round(Math.pow(rank / 1_000_000, 1.6) * 100 * local) + votes * 5));
};

export const toLibSong = (row: Row): LibSong | null => {
  if (!row.bpm || !row.title || !row.artist) return null;
  const genres = [...new Set((row.genre ?? []).map(genreSlug).filter(Boolean))];
  return {
    id: row.id,
    t: row.title,
    a: row.artist,
    b: row.bpm,
    e: ENERGY[row.energy ?? "medium"] ?? 1,
    g: genres,
    i: packCover(row.image_url),
    s: row.spotify_id,
    d: row.deezer_id ? Number(row.deezer_id) : null,
    p: popularityScore(row.popularity, (row.upvotes ?? 0) - (row.downvotes ?? 0), row.isrc),
    ...(row.duration_ms ? { len: Math.round(row.duration_ms / 1000) } : {})
  };
};

export const LIB_COLUMNS = "id,title,artist,bpm,genre,energy,spotify_id,deezer_id,image_url,popularity,bpm_source,album,duration_ms,upvotes,downvotes,isrc";

export async function readLibrary(): Promise<LibSong[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];
  const rows: Row[] = [];
  for (let from = 0; from < 100_000; from += 1000) {
    const { data, error } = await supabase
      .from("music_songs")
      .select(LIB_COLUMNS)
      .not("bpm", "is", null)
      .not("image_url", "is", null)
      .order("id")
      .range(from, from + 999);
    // A failed read throws so a cached page keeps its last good copy.
    if (error) throw new Error("music_songs read failed: " + error.message);
    if (!data?.length) break;
    rows.push(...(data as unknown as Row[]));
    if (data.length < 1000) break;
  }
  return rows
    .map(toLibSong)
    .filter((song): song is LibSong => Boolean(song))
    .sort((a, b) => b.p - a.p);
}

/** One read per server request, shared by metadata and page. */
export const getLibrary = cache(readLibrary);
