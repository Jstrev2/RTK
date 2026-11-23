import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { addDeezerTrack, addSpotifyTrack } from "@/lib/music/ingest";
import { SpotifyUnavailable } from "@/lib/music/sources";
import { toLibSong } from "@/lib/music/library";

/*
 * "Add a song": a signed-in runner picks any track from /api/music/find
 * (Spotify's catalog, or Deezer's while Spotify is unavailable). We match it
 * across both by ISRC, read its BPM (GetSongBPM, else the preview's beat),
 * store it for everyone and remember it as theirs.
 */
export const runtime = "nodejs";
export const maxDuration = 30;
export const dynamic = "force-dynamic";

const recent = new Map<string, number[]>();

export async function POST(request: Request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "The song library is offline." }, { status: 503 });

  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const { data: auth } = token ? await supabase.auth.getUser(token) : { data: { user: null } };
  const user = auth.user;
  if (!user) return NextResponse.json({ error: "Sign in to add songs." }, { status: 401 });

  // 30 adds an hour per runner is plenty, and keeps the BPM services happy.
  const now = Date.now();
  const times = (recent.get(user.id) ?? []).filter((t) => now - t < 3_600_000);
  if (times.length >= 30) return NextResponse.json({ error: "That's a lot of songs. Try again in a bit." }, { status: 429 });
  recent.set(user.id, [...times, now]);

  const body = (await request.json().catch(() => null)) as { spotifyId?: string; deezerId?: string | number } | null;
  const spotifyId = body?.spotifyId ?? "";
  const deezerId = String(body?.deezerId ?? "");
  if (!/^[0-9A-Za-z]{22}$/.test(spotifyId) && !/^\d{1,12}$/.test(deezerId)) {
    return NextResponse.json({ error: "That isn't a track we can look up." }, { status: 400 });
  }

  let result;
  try {
    result = spotifyId ? await addSpotifyTrack(supabase, spotifyId, user.id) : await addDeezerTrack(supabase, Number(deezerId), user.id);
  } catch (error) {
    if (error instanceof SpotifyUnavailable) {
      return NextResponse.json({ error: "Spotify is busy right now. Search again and pick the song from the other results." }, { status: 503 });
    }
    return NextResponse.json({ error: "Adding the song failed. Try again." }, { status: 500 });
  }
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 422 });
  const song = toLibSong({ ...result.row, deezer_id: result.row.deezer_id });
  if (!song) return NextResponse.json({ error: "We couldn't read a reliable BPM for that track." }, { status: 422 });
  if (result.created) revalidatePath("/api/music/library");
  return NextResponse.json({ song, created: result.created, source: result.row.bpm_source });
}
