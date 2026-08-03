// Sync a curated song list into music_songs: insert missing songs, backfill
// null BPMs, and purge karaoke/cover junk. Matching folds accents, punctuation,
// and featured-artist credits so "APT. — ROSÉ & Bruno Mars" matches an existing
// "APT. — ROSE & Bruno Mars" row instead of duplicating it.
// Usage: node scripts/sync-music-songs.mjs <wf-output.json> <songs-all.json> [--write]
import "./load-env.mjs";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const [, , wfPath, songsPath, writeFlag] = process.argv;
const WRITE = writeFlag === "--write";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const wf = JSON.parse(fs.readFileSync(wfPath, "utf8"));
const existing = JSON.parse(fs.readFileSync(songsPath, "utf8"));

const GENRES = new Set(["pop", "rock", "hip-hop", "electronic", "country"]);
const ENERGIES = new Set(["low", "medium", "high", "extreme"]);
const WORKOUTS = new Set(["easy_run", "long_run", "tempo_run", "speed_work", "finish_kick"]);

const fold = (s) =>
  String(s)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
const leadArtist = (a) => fold(a).split(/feat\.|ft\.|featuring|,|&|\bwith\b/)[0];
const baseTitle = (t) => fold(t).replace(/\(feat[^)]*\)|\[feat[^\]]*\]/g, "");
const key = (t, a) => (baseTitle(t) + "|" + leadArtist(a)).replace(/[^a-z0-9|]/g, "");

let songs = (wf.music?.merged || []).map((s) => ({ ...s }));
const qa = wf.music?.qa || { corrections: [], removals: [] };

const corrections = new Map((qa.corrections || []).map((c) => [key(c.title, c.artist), Math.round(c.bpm)]));
// Removals target one exact spelling among near-duplicates (e.g. "ROSE" vs the
// kept "ROSÉ"), so the removal key must preserve accents — folding them would
// delete both variants.
const rawKey = (t, a) => (String(t) + "|" + String(a)).toLowerCase().replace(/[^\p{L}\p{N}|]/gu, "");
const removals = new Set((qa.removals || []).map((r) => rawKey(r.title, r.artist)));
songs = songs.filter((s) => !removals.has(rawKey(s.title, s.artist)));

// Known DB near-duplicates that key() cannot see (different edit/credit spellings).
const SKIP_INSERT = new Set([key("Don't You Worry Child", "Swedish House Mafia feat. John Martin")]);
let corrected = 0;
for (const s of songs) {
  const fix = corrections.get(key(s.title, s.artist));
  if (fix && fix !== s.bpm) { s.bpm = fix; corrected++; }
}

const clean = [];
const rejected = [];
const seenKeys = new Set();
for (const s of songs) {
  const row = {
    title: String(s.title).trim(),
    artist: String(s.artist).trim(),
    bpm: Number.isFinite(s.bpm) && s.bpm >= 50 && s.bpm <= 220 ? Math.round(s.bpm) : null,
    genre: (Array.isArray(s.genre) ? s.genre : []).filter((g) => GENRES.has(g)),
    energy: ENERGIES.has(s.energy) ? s.energy : "medium",
    workout: (Array.isArray(s.workout) ? s.workout : []).filter((w) => WORKOUTS.has(w))
  };
  const k = key(row.title, row.artist);
  if (!row.title || !row.artist || row.bpm === null || !row.genre.length || !row.workout.length || seenKeys.has(k)) {
    rejected.push({ title: s.title, artist: s.artist, bpm: s.bpm, dupKey: seenKeys.has(k) });
    continue;
  }
  seenKeys.add(k);
  clean.push(row);
}

const existingByKey = new Map();
for (const r of existing) {
  const k = key(r.title, r.artist);
  if (!existingByKey.has(k)) existingByKey.set(k, r);
}
const toInsert = [];
const toFillBpm = [];
for (const row of clean) {
  const k = key(row.title, row.artist);
  const ex = existingByKey.get(k);
  if (!ex) {
    if (!SKIP_INSERT.has(k)) toInsert.push(row);
  } else if (ex.bpm === null) toFillBpm.push({ id: ex.id, bpm: row.bpm, title: ex.title });
}

console.log(JSON.stringify({
  merged: (wf.music?.merged || []).length,
  afterQaRemovals: songs.length,
  qaCorrectionsApplied: corrected,
  cleanRows: clean.length,
  rejectedRows: rejected.length,
  alreadyInDb: clean.length - toInsert.length,
  toInsert: toInsert.length,
  bpmBackfills: toFillBpm.length
}, null, 2));
if (rejected.length) console.error("rejected sample:", JSON.stringify(rejected.slice(0, 6)));
console.error("insert sample:", JSON.stringify(toInsert.slice(0, 3).map((s) => s.title + " — " + s.artist)));

if (!WRITE) { console.error("DRY RUN — pass --write to apply"); process.exit(0); }

const junkFilter = "title.ilike.*karaoke*,artist.ilike.*karaoke*,artist.ilike.*tribute*,artist.ilike.*cover*";
const { data: junk, error: junkErr } = await supabase.from("music_songs").select("id,title,artist").or(junkFilter);
if (junkErr) { console.error("junk select failed:", junkErr.message); process.exit(1); }
if (junk.length > 0 && junk.length <= 25) {
  const { error } = await supabase.from("music_songs").delete().in("id", junk.map((j) => j.id));
  if (error) { console.error("junk delete failed:", error.message); process.exit(1); }
  console.error(`deleted ${junk.length} karaoke/cover junk rows`);
} else {
  console.error(`junk count ${junk.length} outside expected range — skipped deletion`);
}

for (let i = 0; i < toInsert.length; i += 200) {
  const batch = toInsert.slice(i, i + 200);
  const { error } = await supabase.from("music_songs").insert(batch);
  if (error) { console.error("insert failed at batch", i / 200, ":", error.message); process.exit(1); }
}
console.error(`inserted ${toInsert.length} songs`);

let filled = 0;
for (const f of toFillBpm) {
  const { error } = await supabase.from("music_songs").update({ bpm: f.bpm }).eq("id", f.id).is("bpm", null);
  if (!error) filled++;
  else console.error("bpm fill failed for", f.title, ":", error.message);
}
console.error(`backfilled bpm on ${filled} rows`);
console.error("DONE");
