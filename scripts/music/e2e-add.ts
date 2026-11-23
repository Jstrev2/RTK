/*
 * End-to-end check of "Add a song" against the real APIs and a running site:
 * makes a throwaway account, searches through /api/music/find (Spotify, or
 * Deezer while Spotify is locked out),
 * adds the first result through /api/music/add, checks music_songs and
 * user_songs, then deletes the account (its user_songs go with it).
 *   BASE=http://127.0.0.1:3202 node scripts/music/run.mjs e2e-add "song query"
 */
import { createClient } from "@supabase/supabase-js";

const base = process.env.BASE ?? "http://127.0.0.1:3202";
const query = process.argv[2] ?? "Manchild Sabrina Carpenter";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const anon = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });

const email = `music-e2e-${Date.now()}@example.com`;
const password = `e2e-${Math.random().toString(36).slice(2)}A1`;
const { data: created, error: createError } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
if (createError || !created.user) throw new Error("could not create test user: " + createError?.message);
const userId = created.user.id;
try {
  const { data: session, error } = await anon.auth.signInWithPassword({ email, password });
  if (error || !session.session) throw new Error("sign in failed: " + error?.message);
  const token = session.session.access_token;

  const search = (await (await fetch(`${base}/api/music/find?q=${encodeURIComponent(query)}`)).json()) as {
    results: { source: string; id: string; title: string; artist: string; songId: string | null }[];
  };
  console.log("search:", search.results.slice(0, 3).map((r) => `[${r.source}] ${r.title} - ${r.artist}${r.songId ? " (in library)" : ""}`));
  const pick = search.results.find((r) => !r.songId) ?? search.results[0];
  if (!pick) throw new Error("no Spotify results");

  const started = Date.now();
  const response = await fetch(`${base}/api/music/add`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(pick.source === "spotify" ? { spotifyId: pick.id } : { deezerId: pick.id })
  });
  const added = (await response.json()) as { song?: { id: string; t: string; a: string; b: number; i: string | null; s: string | null; d: number | null }; created?: boolean; source?: string; error?: string };
  console.log(`add: ${response.status} in ${Date.now() - started} ms`, added);
  if (!added.song) throw new Error("add failed");

  const { data: row } = await admin.from("music_songs").select("id,title,artist,bpm,bpm_source,isrc,deezer_id,spotify_id,image_url,added_by,source").eq("id", added.song.id).single();
  console.log("music_songs row:", row);
  const { data: mine } = await admin.from("user_songs").select("song_id").eq("user_id", userId);
  console.log("user_songs:", mine);

  const unauth = await fetch(`${base}/api/music/add`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(pick.source === "spotify" ? { spotifyId: pick.id } : { deezerId: pick.id }) });
  console.log("without sign-in:", unauth.status);
} finally {
  await admin.auth.admin.deleteUser(userId);
  console.log("test account deleted");
}
