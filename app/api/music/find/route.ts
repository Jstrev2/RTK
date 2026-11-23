import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { deezer, spotifyAvailable, spotifyImage, spotifySearchTracks, type DeezerTrack } from "@/lib/music/sources";

/*
 * Search for "Add any song": Spotify's catalog first (client credentials),
 * Deezer's when Spotify is unavailable (it rate-limits apps in development
 * mode for hours at a time). Each result says whether our library already
 * has it with a BPM.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type FindResult = {
  source: "spotify" | "deezer";
  id: string;
  title: string;
  artist: string;
  album: string;
  image: string | null;
  seconds: number;
  songId: string | null;
};

const fromSpotify = async (q: string): Promise<FindResult[] | null> => {
  if (!spotifyAvailable()) return null;
  try {
    const items = await spotifySearchTracks(q, 10);
    return items.map((t) => ({
      source: "spotify",
      id: t.id,
      title: t.name,
      artist: t.artists.map((a) => a.name).join(", "),
      album: t.album.name,
      image: spotifyImage(t),
      seconds: Math.round(t.duration_ms / 1000),
      songId: null
    }));
  } catch {
    return null;
  }
};

const fromDeezer = async (q: string): Promise<FindResult[]> => {
  const page = await deezer<{ data: DeezerTrack[] }>(`/search?limit=10&q=${encodeURIComponent(q)}`);
  return (page?.data ?? []).map((t) => ({
    source: "deezer",
    id: String(t.id),
    title: t.title,
    artist: t.artist.name,
    album: t.album?.title ?? "",
    image: t.album?.cover_medium ?? t.album?.cover_big ?? null,
    seconds: t.duration ?? 0,
    songId: null
  }));
};

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2 || q.length > 120) return NextResponse.json({ results: [] });
  try {
    const results = (await fromSpotify(q)) ?? (await fromDeezer(q));
    const supabase = getSupabaseAdmin();
    if (supabase && results.length) {
      const column = results[0].source === "spotify" ? "spotify_id" : "deezer_id";
      const { data } = await supabase.from("music_songs").select("id,spotify_id,deezer_id,bpm").in(column, results.map((r) => r.id)).not("bpm", "is", null);
      const known = new Map(((data ?? []) as { id: string; spotify_id: string | null; deezer_id: number | null }[]).map((row) => [String(column === "spotify_id" ? row.spotify_id : row.deezer_id), row.id]));
      for (const r of results) r.songId = known.get(r.id) ?? null;
    }
    return NextResponse.json({ results }, { headers: { "Cache-Control": "public, s-maxage=600" } });
  } catch (error) {
    return NextResponse.json({ results: [], error: (error as Error).message }, { status: 502 });
  }
}
