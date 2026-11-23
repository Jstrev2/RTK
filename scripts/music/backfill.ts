/*
 * Local backfill for the song library (the daily cron does the same in small
 * batches). Run the stages in order; each resumes where it stopped.
 *
 *   node scripts/music/run.mjs backfill discover   Deezer charts + runners' playlists -> candidates
 *   node scripts/music/run.mjs backfill details    new candidates: Deezer record, genres, preview tempo
 *   node scripts/music/run.mjs backfill existing   rows already in the table: find them on Deezer, preview tempo
 *   node scripts/music/run.mjs backfill apply      write to music_songs (update, insert, remove junk and covers)
 *   node scripts/music/run.mjs backfill getsong    GetSongBPM for every song it might know (slow: ~1 a second)
 *   node scripts/music/run.mjs backfill spotify    Spotify ids by ISRC
 *   node scripts/music/run.mjs backfill report     counts
 *
 * Working files live in .tmp/music/.
 */
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import {
  DEEZER_CHARTS,
  deezerSearchTrack,
  spotifyAvailable,
  spotifyImage,
  deezerTrack,
  getSongBpm,
  type DeezerTrack
} from "../../lib/music/sources";
import {
  SONG_COLUMNS,
  addCandidate,
  analyzePreview,
  deezerDetails,
  discoverCharts,
  discoverPlaylists,
  loadLibrary,
  rowFromDeezer,
  saveSpotify,
  spotifyFor,
  worthAdding,
  type Candidate,
  type SongRow
} from "../../lib/music/ingest";
import { artistKey, energyFromIntensity, fitsAudience, foldTempo, isJunk, songKey, titleKey, workoutTags, genreSlug, type Energy } from "../../lib/music/catalog-rules";
import type { TempoResult } from "../../lib/music/tempo";

const dir = path.resolve(".tmp", "music");
fs.mkdirSync(dir, { recursive: true });
const file = (name: string) => path.join(dir, name);

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false }
});

const readJsonl = <T>(name: string): T[] =>
  fs.existsSync(file(name))
    ? fs
        .readFileSync(file(name), "utf8")
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line) as T)
    : [];
const appendJsonl = (name: string, value: unknown) => fs.appendFileSync(file(name), JSON.stringify(value) + "\n");

const pool = async <T>(items: T[], workers: number, fn: (item: T, i: number) => Promise<void>) => {
  let next = 0;
  let done = 0;
  const started = Date.now();
  await Promise.all(
    Array.from({ length: workers }, async () => {
      while (next < items.length) {
        const i = next++;
        try {
          await fn(items[i], i);
        } catch (error) {
          console.error("item failed:", (error as Error).message);
        }
        done += 1;
        if (done % 100 === 0) {
          const rate = done / ((Date.now() - started) / 1000);
          console.log(`  ${done}/${items.length} (${rate.toFixed(1)}/s, ~${Math.round((items.length - done) / rate / 60)} min left)`);
        }
      }
    })
  );
};

type Analysis = (Pick<TempoResult, "bpm" | "confidence" | "intensity" | "loudness" | "lowBpm"> & { trusted?: boolean }) | null;
const slimAnalysis = (a: TempoResult | null): Analysis =>
  a ? { bpm: a.bpm, confidence: Math.round(a.confidence * 1000) / 1000, lowBpm: a.lowBpm, trusted: a.trusted, intensity: a.intensity, loudness: a.loudness } : null;

type DetailLine = { id: number; track?: DeezerTrack; genres?: string[]; skip?: boolean; analysis?: Analysis; charted?: boolean; playlists?: number; missing?: boolean };
type ExistingLine = { rowId: string; track?: DeezerTrack; genres?: string[]; skip?: boolean; analysis?: Analysis; none?: boolean };

/* ---------- discover ---------- */

async function discover() {
  const map = new Map<number, Candidate>();
  console.log("Charts...");
  await discoverCharts(map);
  console.log(`  ${map.size} chart tracks`);
  console.log("Runners' playlists...");
  const seen = await discoverPlaylists(map);
  console.log(`  ${seen.size} playlists read, ${map.size} tracks in all`);
  const all = [...map.values()];
  fs.writeFileSync(file("candidates.json"), JSON.stringify(all));
  const chosen = all.filter((c) => worthAdding(c));
  const ranks = chosen.map((c) => c.track.rank ?? 0).sort((a, b) => a - b);
  console.log(`  ${chosen.length} worth adding (charted ${chosen.filter((c) => c.charted).length}); rank median ${ranks[Math.floor(ranks.length / 2)]}`);
}

/* ---------- details for new candidates ---------- */

async function details() {
  const all = JSON.parse(fs.readFileSync(file("candidates.json"), "utf8")) as Candidate[];
  const library = await loadLibrary(db, "id,deezer_id");
  const have = new Set(library.map((r) => Number(r.deezer_id)).filter(Boolean));
  const done = new Set(readJsonl<DetailLine>("details.jsonl").map((l) => l.id));
  // One per song: charted first, then most popular, so a song's best release wins.
  const keys = new Set<string>();
  const todo = all
    .filter((c) => worthAdding(c))
    .sort((a, b) => Number(b.charted) - Number(a.charted) || (b.track.rank ?? 0) - (a.track.rank ?? 0))
    .filter((c) => {
      const key = songKey(c.track.title, c.track.artist.name);
      if (keys.has(key)) return false;
      keys.add(key);
      return !have.has(c.track.id) && !done.has(c.track.id);
    });
  console.log(`Details for ${todo.length} tracks (${done.size} done before)`);
  await pool(todo, 6, async (candidate) => {
    const got = await deezerDetails(candidate.track.id, candidate.chartGenres);
    if (!got) {
      appendJsonl("details.jsonl", { id: candidate.track.id, missing: true });
      return;
    }
    const analysis = got.skip ? null : slimAnalysis(await analyzePreview(got.track.preview));
    appendJsonl("details.jsonl", {
      id: candidate.track.id,
      track: slimTrack(got.track),
      genres: got.genres,
      skip: got.skip,
      analysis,
      charted: candidate.charted,
      playlists: candidate.playlists
    });
  });
}

const slimTrack = (t: DeezerTrack): DeezerTrack => ({
  id: t.id,
  title: t.title,
  isrc: t.isrc,
  duration: t.duration,
  rank: t.rank,
  preview: t.preview,
  release_date: t.release_date,
  artist: { id: t.artist.id, name: t.artist.name },
  contributors: t.contributors?.map((c) => ({ id: c.id, name: c.name })),
  album: t.album
    ? { id: t.album.id, title: t.album.title, cover_big: t.album.cover_big, cover_xl: t.album.cover_xl, cover_medium: t.album.cover_medium }
    : undefined
});

/** Read the tempo again for detail lines made before the reader learned its low-band check. */
async function reanalyze() {
  const lines = readJsonl<DetailLine>("details.jsonl");
  const fixed = new Map(readJsonl<{ id: number; analysis: Analysis }>("details-fix.jsonl").map((l) => [l.id, l.analysis]));
  const todo = lines.filter((l) => l.track && !l.skip && (!l.analysis || l.analysis.trusted === undefined) && !fixed.has(l.id));
  console.log(`Reading ${todo.length} previews again`);
  await pool(todo, 6, async (line) => {
    const track = await deezerTrack(line.id);
    const analysis = slimAnalysis(await analyzePreview(track?.preview));
    fixed.set(line.id, analysis);
    appendJsonl("details-fix.jsonl", { id: line.id, analysis });
  });
  const merged = lines.map((l) => (fixed.has(l.id) ? { ...l, analysis: fixed.get(l.id) } : l));
  fs.writeFileSync(file("details.jsonl"), merged.map((l) => JSON.stringify(l)).join("\n") + "\n");
  console.log("Done.");
}

/* ---------- existing rows ---------- */

const loose = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/^the\s+/, "")
    .replace(/[^a-z0-9]+/g, "");

async function existing() {
  const rows = await loadLibrary(db);
  const done = new Set(readJsonl<ExistingLine>("existing.jsonl").map((l) => l.rowId));
  const todo = rows.filter((r) => !r.deezer_id && !done.has(r.id) && !isJunk(r.title, r.artist));
  console.log(`Matching ${todo.length} existing rows on Deezer (${done.size} done before)`);
  await pool(todo, 6, async (row) => {
    const firstArtist = row.source === "spotify" ? row.artist.split(", ")[0] : row.artist;
    const hits = await deezerSearchTrack(row.title.replace(/\s+-\s+.*$/, ""), firstArtist);
    const wantTitle = titleKey(row.title);
    const wantArtist = loose(firstArtist);
    const match = hits
      .filter((h) => titleKey(h.title) === wantTitle && (loose(h.artist.name) === wantArtist || loose(h.artist.name).includes(wantArtist) || wantArtist.includes(loose(h.artist.name))))
      .sort((a, b) => (b.rank ?? 0) - (a.rank ?? 0))[0];
    if (!match) {
      appendJsonl("existing.jsonl", { rowId: row.id, none: true });
      return;
    }
    const got = await deezerDetails(match.id);
    if (!got) {
      appendJsonl("existing.jsonl", { rowId: row.id, none: true });
      return;
    }
    const analysis = got.skip ? null : slimAnalysis(await analyzePreview(got.track.preview));
    appendJsonl("existing.jsonl", { rowId: row.id, track: slimTrack(got.track), genres: got.genres, skip: got.skip, analysis });
  });
}

/* ---------- apply ---------- */

const analysisTempo = (a: Analysis) => (a && a.trusted ? Math.round(foldTempo(a.bpm)) : null);

async function apply() {
  const dry = process.argv.includes("--dry");
  const rows = await loadLibrary(db);
  const byId = new Map(rows.map((r) => [r.id, r]));
  const existingLines = new Map(readJsonl<ExistingLine>("existing.jsonl").map((l) => [l.rowId, l]));
  const detailLines = readJsonl<DetailLine>("details.jsonl").filter((l) => l.track && !l.skip);

  const toDelete = new Set<string>();
  const updates = new Map<string, Record<string, unknown>>();
  const protectedRow = (r: SongRow) => Boolean(r.added_by) || (r.upvotes ?? 0) + (r.downvotes ?? 0) > 0;

  // Final picture of every song, to dedupe and find covers.
  type Final = { kind: "row"; id: string; title: string; artist: string; isrc: string | null; deezer: number | null; rank: number } | { kind: "new"; line: DetailLine; title: string; artist: string; isrc: string | null; deezer: number; rank: number };
  const finals: Final[] = [];

  for (const row of rows) {
    if (isJunk(row.title, row.artist) && !protectedRow(row)) {
      toDelete.add(row.id);
      continue;
    }
    if (row.deezer_id) {
      finals.push({ kind: "row", id: row.id, title: row.title, artist: row.artist, isrc: row.isrc, deezer: row.deezer_id, rank: row.popularity ?? 0 });
      continue;
    }
    const line = existingLines.get(row.id);
    if (!line || line.none || !line.track || line.skip || isJunk(line.track.title, line.track.artist.name)) {
      if (!protectedRow(row)) toDelete.add(row.id);
      continue;
    }
    const t = line.track;
    const genres = line.genres?.length ? line.genres : (row.genre ?? []).map(genreSlug);
    const merged = [...new Set([...(row.genre ?? []).map(genreSlug), ...genres])].filter(Boolean);
    const knownBpm = row.bpm && row.source !== "spotify" ? row.bpm : null;
    const energy: Energy = line.analysis ? energyFromIntensity(line.analysis.intensity) : ((row.energy as Energy) ?? "medium");
    const bpm = knownBpm ?? analysisTempo(line.analysis ?? null);
    const bpmSource = knownBpm ? (row.source === "getsongbpm" ? "getsongbpm" : "catalog") : bpm ? "analysis" : "unreadable";
    const base = rowFromDeezer(t, merged, row.source ?? "catalog");
    updates.set(row.id, {
      isrc: base.isrc,
      deezer_id: base.deezer_id,
      album: base.album,
      image_url: base.image_url,
      preview_url: base.preview_url,
      duration_ms: base.duration_ms,
      popularity: base.popularity,
      genre: merged,
      // Spotify-search rows carried "Artist, Artist" names; Deezer's primary artist is cleaner.
      ...(row.source === "spotify" ? { artist: base.artist } : {}),
      bpm,
      bpm_source: bpmSource,
      bpm_checked_at: new Date().toISOString(),
      energy,
      workout: workoutTags(bpm, energy)
    });
    finals.push({ kind: "row", id: row.id, title: row.title, artist: row.source === "spotify" ? base.artist : row.artist, isrc: base.isrc, deezer: t.id, rank: t.rank ?? 0 });
  }
  // Artists on the US charts or already in the library, for the audience rule.
  const knownArtists = new Set<string>();
  for (const c of JSON.parse(fs.readFileSync(file("candidates.json"), "utf8")) as Candidate[]) if (c.charted) knownArtists.add(artistKey(c.track.artist.name));
  for (const f of finals) knownArtists.add(artistKey(f.artist));
  let offAudience = 0;
  for (const line of detailLines) {
    const t = line.track!;
    if (isJunk(t.title, t.artist.name)) continue;
    if (!fitsAudience(t.isrc, Boolean(line.charted), knownArtists.has(artistKey(t.artist.name)))) {
      offAudience += 1;
      continue;
    }
    finals.push({ kind: "new", line, title: t.title, artist: t.artist.name, isrc: t.isrc?.toUpperCase() ?? null, deezer: t.id, rank: t.rank ?? 0 });
  }

  // Duplicates: same ISRC, same Deezer id, or same song key. Keep an existing
  // row over a new one (it may carry votes or saves), else the more popular.
  const keep = new Map<string, Final>();
  const dropFinal = (f: Final) => {
    if (f.kind === "row") {
      const row = byId.get(f.id)!;
      if (!protectedRow(row)) toDelete.add(f.id);
    }
  };
  const better = (a: Final, b: Final) => {
    if (a.kind !== b.kind) return a.kind === "row" ? a : b;
    return a.rank >= b.rank ? a : b;
  };
  const kept: Final[] = [];
  const claim = new Map<string, Final>();
  for (const f of finals.sort((a, b) => b.rank - a.rank)) {
    const keys = [f.isrc ? "i:" + f.isrc : null, f.deezer ? "d:" + f.deezer : null, "k:" + songKey(f.title, f.artist)].filter(Boolean) as string[];
    const clash = keys.map((k) => claim.get(k)).find(Boolean);
    if (clash) {
      const winner = better(clash, f);
      if (winner === f) {
        // Replace the earlier one.
        kept.splice(kept.indexOf(clash), 1);
        dropFinal(clash);
        kept.push(f);
        for (const k of keys) claim.set(k, f);
      } else {
        dropFinal(f);
      }
      continue;
    }
    kept.push(f);
    for (const k of keys) claim.set(k, f);
  }
  keep.clear();

  // Covers: the same title by another artist far less popular than a popular original.
  const byTitle = new Map<string, Final[]>();
  for (const f of kept) {
    const key = titleKey(f.title);
    byTitle.set(key, [...(byTitle.get(key) ?? []), f]);
  }
  const covers = new Set<Final>();
  for (const group of byTitle.values()) {
    if (group.length < 2) continue;
    const top = Math.max(...group.map((f) => f.rank));
    if (top < 500_000) continue;
    for (const f of group) if (f.rank < 400_000 && f.rank < top * 0.5) covers.add(f);
  }
  for (const f of covers) dropFinal(f);
  const final = kept.filter((f) => !covers.has(f));

  const newOnes = final.filter((f): f is Extract<Final, { kind: "new" }> => f.kind === "new");
  for (const id of toDelete) updates.delete(id);
  console.log(`Left out ${offAudience} playlist tracks from outside the audience markets.`);
  console.log(`Rows now ${rows.length}. Update ${updates.size}, delete ${toDelete.size} (covers ${covers.size}), insert ${newOnes.length}. Library after: ${final.length}`);
  if (dry) {
    const sample = [...toDelete].slice(0, 40).map((id) => `${byId.get(id)?.title} - ${byId.get(id)?.artist}`);
    console.log("delete sample:", sample);
    console.log("covers:", [...covers].slice(0, 30).map((f) => `${f.title} - ${f.artist} (${f.rank})`));
    return;
  }

  console.log("Deleting...");
  const deleteIds = [...toDelete];
  for (let i = 0; i < deleteIds.length; i += 200) {
    const { error } = await db.from("music_songs").delete().in("id", deleteIds.slice(i, i + 200));
    if (error) console.error("delete failed:", error.message);
  }
  console.log("Updating...");
  await pool([...updates.entries()], 8, async ([id, update]) => {
    const { error } = await db.from("music_songs").update(update).eq("id", id);
    if (error) console.error("update failed", id, error.message);
  });
  console.log("Inserting...");
  const pre = new Map(readJsonl<{ deezerId: number; bpm: number | null }>("getsong-pre.jsonl").map((l) => [l.deezerId, l.bpm]));
  const spotifyPre = new Map(readJsonl<{ deezerId: number; spotifyId: string | null; image: string | null }>("spotify-pre.jsonl").map((l) => [l.deezerId, l]));
  const records = newOnes.map(({ line }) => {
    const t = line.track!;
    const known = pre.get(t.id);
    const sp = spotifyPre.get(t.id);
    const base = rowFromDeezer(t, line.genres ?? [], line.charted ? "deezer-chart" : "deezer-playlist");
    const bpm = known ? Math.round(known) : analysisTempo(line.analysis ?? null);
    const energy: Energy = line.analysis ? energyFromIntensity(line.analysis.intensity) : "medium";
    return {
      ...base,
      spotify_id: sp?.spotifyId ?? null,
      image_url: base.image_url ?? sp?.image ?? null,
      bpm,
      bpm_source: known ? "getsongbpm" : bpm ? "analysis" : "unreadable",
      bpm_checked_at: new Date().toISOString(),
      energy,
      workout: workoutTags(bpm, energy)
    };
  });
  for (let i = 0; i < records.length; i += 200) {
    const { error } = await db.from("music_songs").insert(records.slice(i, i + 200));
    if (error) {
      // Fall back to one at a time so one clash doesn't lose the batch.
      for (const record of records.slice(i, i + 200)) {
        const single = await db.from("music_songs").insert(record);
        if (single.error && single.error.code !== "23505") console.error("insert failed", record.title, single.error.message);
      }
    }
  }
  console.log("Done.");
}

/* ---------- GetSongBPM ---------- */

/** GetSongBPM for the chosen candidates before they reach the table (runs beside `details`). */
async function getsongPre() {
  const all = JSON.parse(fs.readFileSync(file("candidates.json"), "utf8")) as Candidate[];
  const done = new Set(readJsonl<{ deezerId: number }>("getsong-pre.jsonl").map((l) => l.deezerId));
  const keys = new Set<string>();
  const todo = all
    .filter((c) => worthAdding(c))
    .sort((a, b) => Number(b.charted) - Number(a.charted) || (b.track.rank ?? 0) - (a.track.rank ?? 0))
    .filter((c) => {
      const key = songKey(c.track.title, c.track.artist.name);
      if (keys.has(key)) return false;
      keys.add(key);
      return !done.has(c.track.id);
    });
  console.log(`GetSongBPM for ${todo.length} candidates (${done.size} done before)`);
  let found = 0;
  for (const [i, c] of todo.entries()) {
    const match = await getSongBpm(c.track.title, [c.track.artist.name], { thorough: false });
    if (match === undefined) {
      console.log("GetSongBPM unreachable; stopping. Run again later.");
      return;
    }
    if (match) found += 1;
    appendJsonl("getsong-pre.jsonl", { deezerId: c.track.id, bpm: match?.bpm ?? null });
    if ((i + 1) % 250 === 0) console.log(`  ${i + 1}/${todo.length}, ${found} found`);
  }
  console.log(`Done: ${found} of ${todo.length} found.`);
}

async function getsong() {
  const rows = await loadLibrary(db);
  const tried = new Set(readJsonl<{ id: string }>("getsong.jsonl").map((l) => l.id));
  const preLines = readJsonl<{ deezerId: number; bpm: number | null }>("getsong-pre.jsonl");
  const preTried = new Set(preLines.map((l) => l.deezerId));
  // Hits the pre-lookup found after `apply` ran.
  const preHits = new Map(preLines.filter((l) => l.bpm).map((l) => [l.deezerId, l.bpm!]));
  let late = 0;
  for (const row of rows) {
    const bpm = row.deezer_id ? preHits.get(Number(row.deezer_id)) : undefined;
    if (!bpm || row.bpm_source === "getsongbpm" || row.bpm_source === "catalog") continue;
    const energy = (row.energy as Energy) ?? "medium";
    await db
      .from("music_songs")
      .update({ bpm: Math.round(bpm), bpm_source: "getsongbpm", bpm_checked_at: new Date().toISOString(), workout: workoutTags(Math.round(bpm), energy) })
      .eq("id", row.id);
    row.bpm_source = "getsongbpm";
    late += 1;
  }
  console.log(`Applied ${late} GetSongBPM tempos found before the rows existed.`);
  const todo = rows
    .filter((r) => r.bpm_source !== "getsongbpm" && r.bpm_source !== "catalog" && !tried.has(r.id) && !preTried.has(Number(r.deezer_id)))
    .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
  console.log(`GetSongBPM for ${todo.length} songs (${tried.size} tried before)`);
  let found = 0;
  let index = 0;
  for (const row of todo) {
    index += 1;
    const match = await getSongBpm(row.title, [row.artist], { thorough: false });
    if (match === undefined) {
      console.log("GetSongBPM unreachable; stopping. Run again later.");
      return;
    }
    appendJsonl("getsong.jsonl", { id: row.id, bpm: match?.bpm ?? null, analysisBpm: row.bpm_source === "analysis" ? row.bpm : null });
    if (match) {
      found += 1;
      const energy = (row.energy as Energy) ?? "medium";
      const bpm = Math.round(match.bpm);
      await db
        .from("music_songs")
        .update({ bpm, bpm_source: "getsongbpm", bpm_checked_at: new Date().toISOString(), workout: workoutTags(bpm, energy) })
        .eq("id", row.id);
    }
    if (index % 50 === 0) console.log(`  ${index}/${todo.length}, ${found} found`);
  }
  console.log(`Done: ${found} of ${todo.length} found.`);
}

/* ---------- Spotify ---------- */

/** Spotify ids by ISRC for the new candidates, before they reach the table. */
async function spotifyPre() {
  const done = new Set(readJsonl<{ deezerId: number }>("spotify-pre.jsonl").map((l) => l.deezerId));
  const todo = readJsonl<DetailLine>("details.jsonl").filter((l) => l.track?.isrc && !l.skip && !done.has(l.id));
  console.log(`Spotify ids for ${todo.length} candidates`);
  let found = 0;
  await pool(todo, 1, async (line) => {
    if (!spotifyAvailable()) return;
    const match = await spotifyFor({ isrc: line.track!.isrc!, title: line.track!.title, artist: line.track!.artist.name });
    if (match) found += 1;
    appendJsonl("spotify-pre.jsonl", { deezerId: line.id, spotifyId: match?.id ?? null, image: match ? spotifyImage(match) : null });
  });
  console.log(`Done: ${found} of ${todo.length}.`);
}

async function spotifyStage() {
  const rows = await loadLibrary(db);
  const todo = rows.filter((r) => r.isrc && !r.spotify_id);
  console.log(`Spotify ids for ${todo.length} songs`);
  let found = 0;
  let dupes = 0;
  const duplicates: string[] = [];
  await pool(todo, 1, async (row) => {
    if (!spotifyAvailable()) return;
    const match = await spotifyFor(row);
    const saved = await saveSpotify(db, row, match);
    if (saved.matched && saved.ok) found += 1;
    if ("duplicate" in saved && saved.duplicate) {
      dupes += 1;
      duplicates.push(row.id);
    }
  });
  // A clash means another row already holds that Spotify track: the same song twice.
  for (const id of duplicates) {
    const row = rows.find((r) => r.id === id)!;
    if (!row.added_by && !((row.upvotes ?? 0) + (row.downvotes ?? 0))) await db.from("music_songs").delete().eq("id", id);
  }
  console.log(`Done: ${found} matched, ${dupes} duplicates removed.${spotifyAvailable() ? "" : " Spotify locked the app out; run again tomorrow."}`);
}

/* ---------- report ---------- */

async function report() {
  const rows = await loadLibrary(db);
  const count = (f: (r: SongRow) => boolean) => rows.filter(f).length;
  const by = (f: (r: SongRow) => string) => {
    const m: Record<string, number> = {};
    for (const r of rows) m[f(r)] = (m[f(r)] ?? 0) + 1;
    return m;
  };
  console.log({
    rows: rows.length,
    withBpm: count((r) => Boolean(r.bpm)),
    bpmSource: by((r) => String(r.bpm_source)),
    source: by((r) => String(r.source)),
    spotify: count((r) => Boolean(r.spotify_id)),
    isrc: count((r) => Boolean(r.isrc)),
    image: count((r) => Boolean(r.image_url)),
    energy: by((r) => String(r.energy)),
    genres: by((r) => (r.genre ?? [])[0] ?? "none")
  });
}

const stage = process.argv[2];
const stages: Record<string, () => Promise<void>> = { discover, details, reanalyze, existing, apply, "getsong-pre": getsongPre, "spotify-pre": spotifyPre, getsong, spotify: spotifyStage, report };
if (!stages[stage]) {
  console.error("stages:", Object.keys(stages).join(", "));
  process.exit(1);
}
await stages[stage]();
void DEEZER_CHARTS;
void addCandidate;
void SONG_COLUMNS;
