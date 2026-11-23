import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DEEZER_CHARTS,
  DEEZER_GENRES,
  DEEZER_SKIP_GENRES,
  PLAYLIST_TERMS,
  deezerAlbumGenres,
  deezerChart,
  deezerPlaylistTracks,
  deezerSearchPlaylists,
  deezerSearchTrack,
  deezerTrack,
  deezerTrackByIsrc,
  getSongBpm,
  spotifyImage,
  spotifyTrack,
  spotifyTrackByIsrc,
  spotifyAvailable,
  SpotifyUnavailable,
  type DeezerTrack,
  type SpotifyTrack
} from "./sources";
import { tempoFromPreview, type TempoResult } from "./tempo";
import { artistKey, energyFromIntensity, fitsAudience, foldTempo, isJunk, songKey, workoutTags, type Energy } from "./catalog-rules";

/*
 * Keeps the song library current. Used three ways:
 *   - the daily cron (runDailyMusicIngest, small batches inside a time budget),
 *   - "Add a song" in the Music Finder (addSpotifyTrack),
 *   - the local backfill (scripts/music/backfill.ts), which runs the same
 *     steps over the whole library.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Db = SupabaseClient<any, any, any>;

export type SongRow = {
  id: string;
  title: string;
  artist: string;
  bpm: number | null;
  genre: string[] | null;
  energy: string | null;
  workout: string[] | null;
  spotify_id: string | null;
  item_key: string | null;
  source: string | null;
  isrc: string | null;
  deezer_id: number | null;
  image_url: string | null;
  preview_url: string | null;
  album: string | null;
  duration_ms: number | null;
  popularity: number | null;
  bpm_source: string | null;
  bpm_checked_at: string | null;
  added_by: string | null;
  upvotes: number | null;
  downvotes: number | null;
};

export const SONG_COLUMNS =
  "id,title,artist,bpm,genre,energy,workout,spotify_id,item_key,source,isrc,deezer_id,image_url,preview_url,album,duration_ms,popularity,bpm_source,bpm_checked_at,added_by,upvotes,downvotes";

/** A playlist track the daily job finds must be at least this popular on Deezer (0..1,000,000). */
export const MIN_RANK_DAILY = 750_000;

export const coverFor = (track: DeezerTrack) => track.album?.cover_big ?? track.album?.cover_xl ?? track.album?.cover_medium ?? null;

export const genresFor = (genreIds: number[] | null | undefined) => {
  const slugs: string[] = [];
  for (const id of genreIds ?? []) {
    const slug = DEEZER_GENRES[id];
    if (slug && !slugs.includes(slug)) slugs.push(slug);
  }
  return slugs;
};

export const rowFromDeezer = (track: DeezerTrack, genres: string[], source: string) => ({
  title: track.title.trim(),
  artist: track.artist.name.trim(),
  isrc: track.isrc ? track.isrc.toUpperCase() : null,
  deezer_id: track.id,
  album: track.album?.title ?? null,
  image_url: coverFor(track),
  preview_url: track.preview || null,
  duration_ms: track.duration ? track.duration * 1000 : null,
  popularity: track.rank ?? null,
  genre: genres,
  source,
  item_key: `deezer-${track.id}`
});

/* ---------- Tempo ---------- */

export type TempoDecision = {
  bpm: number | null;
  bpm_source: "getsongbpm" | "analysis" | "unreadable";
  energy: Energy | null;
  analysis: TempoResult | null;
  getsong: number | null;
};

export async function analyzePreview(previewUrl: string | null | undefined) {
  if (!previewUrl) return null;
  try {
    return await tempoFromPreview(previewUrl);
  } catch (error) {
    console.warn("preview tempo failed:", (error as Error).message);
    return null;
  }
}

/**
 * BPM for one song: GetSongBPM when it knows the song by this artist, the
 * preview's beat otherwise, nothing when neither can be trusted.
 * `undefined` means GetSongBPM could not be reached and the song should be
 * tried again later.
 */
export async function decideTempo(
  song: { title: string; artists: string[]; preview: string | null | undefined },
  options: { getsong?: boolean; knownBpm?: number | null } = {}
): Promise<TempoDecision | undefined> {
  const analysis = await analyzePreview(song.preview);
  if (analysis && process.env.MUSIC_DEBUG) console.log("tempo", song.title, analysis);
  let getsong: number | null = options.knownBpm ?? null;
  if (getsong == null && options.getsong !== false) {
    const match = await getSongBpm(song.title, song.artists);
    if (match === undefined) return undefined;
    getsong = match?.bpm ?? null;
  }
  const energy = analysis ? energyFromIntensity(analysis.intensity) : null;
  if (getsong) return { bpm: Math.round(getsong), bpm_source: "getsongbpm", energy, analysis, getsong };
  if (analysis && analysis.trusted) {
    return { bpm: Math.round(foldTempo(analysis.bpm)), bpm_source: "analysis", energy, analysis, getsong };
  }
  return { bpm: null, bpm_source: "unreadable", energy, analysis, getsong };
}

export const tempoUpdate = (decision: TempoDecision, existingEnergy?: string | null) => {
  const energy = decision.energy ?? ((existingEnergy as Energy | null) || "medium");
  return {
    bpm: decision.bpm,
    bpm_source: decision.bpm_source,
    bpm_checked_at: new Date().toISOString(),
    energy,
    workout: workoutTags(decision.bpm, energy)
  };
};

/* ---------- Discovery ---------- */

export type Candidate = {
  track: DeezerTrack;
  chartGenres: string[];
  charted: boolean;
  playlists: number;
};

export const addCandidate = (map: Map<number, Candidate>, track: DeezerTrack, from: { chartGenre?: string | null; chart?: boolean }) => {
  if (!track?.id || track.readable === false) return;
  const entry = map.get(track.id) ?? { track, chartGenres: [], charted: false, playlists: 0 };
  if (from.chart) {
    entry.charted = true;
    if (from.chartGenre && !entry.chartGenres.includes(from.chartGenre)) entry.chartGenres.push(from.chartGenre);
  } else {
    entry.playlists += 1;
  }
  map.set(track.id, entry);
};

/**
 * Whether a discovered track is popular enough for the library. Everything on
 * a chart gets in. From playlists: carried by 4+ runners' playlists and fairly
 * popular, or by 3+ and popular. (The November 2026 read of 1,824 playlists
 * found 55,873 tracks; this keeps about 8,400 with the charts.) The daily job
 * reads only three playlists, so there one playlist is enough for a hit.
 */
export const worthAdding = (candidate: Candidate, mode: "backfill" | "daily" = "backfill") => {
  const rank = candidate.track.rank ?? 0;
  if (isJunk(candidate.track.title, candidate.track.artist.name)) return false;
  if ((candidate.track.duration ?? 0) < 90 || (candidate.track.duration ?? 0) > 600) return false;
  if (candidate.charted) return true;
  if (mode === "daily") return rank >= MIN_RANK_DAILY;
  return (candidate.playlists >= 4 && rank >= 400_000) || (candidate.playlists >= 3 && rank >= 650_000);
};

export async function discoverCharts(map: Map<number, Candidate>, chartIds?: number[]) {
  for (const chart of DEEZER_CHARTS) {
    if (chartIds && !chartIds.includes(chart.id)) continue;
    for (const track of await deezerChart(chart.id)) addCandidate(map, track, { chart: true, chartGenre: chart.genre });
  }
}

export async function discoverPlaylists(
  map: Map<number, Candidate>,
  options: { terms?: string[]; perTerm?: number; seen?: Set<number>; deadline?: number } = {}
) {
  const seen = options.seen ?? new Set<number>();
  for (const term of options.terms ?? PLAYLIST_TERMS) {
    const playlists = await deezerSearchPlaylists(term, options.perTerm ?? 150);
    for (const playlist of playlists) {
      if (options.deadline && Date.now() > options.deadline) return seen;
      if (seen.has(playlist.id)) continue;
      seen.add(playlist.id);
      if (playlist.nb_tracks < 10 || playlist.nb_tracks > 400) continue;
      for (const track of await deezerPlaylistTracks(playlist.id)) addCandidate(map, track, {});
    }
  }
  return seen;
}

const albumGenreCache = new Map<number, number[] | null>();

/** Full Deezer record plus its album's genres (one extra call per new album). */
export async function deezerDetails(id: number, knownGenres: string[] = []) {
  const track = await deezerTrack(id);
  if (!track || !track.title || !track.artist) return null;
  let genres = knownGenres;
  let skip = false;
  if (track.album?.id) {
    let ids = albumGenreCache.get(track.album.id);
    if (ids === undefined) {
      ids = await deezerAlbumGenres(track.album.id);
      albumGenreCache.set(track.album.id, ids);
    }
    if (ids?.length && DEEZER_SKIP_GENRES.has(ids[0])) skip = true;
    if (!genres.length) genres = genresFor(ids);
    else for (const g of genresFor(ids)) if (!genres.includes(g)) genres = [...genres, g];
  }
  return { track, genres, skip };
}

/* ---------- Library lookups ---------- */

export async function loadLibrary(db: Db, columns = SONG_COLUMNS): Promise<SongRow[]> {
  const rows: SongRow[] = [];
  for (let from = 0; from < 100_000; from += 1000) {
    const { data, error } = await db.from("music_songs").select(columns).order("id").range(from, from + 999);
    if (error) throw new Error("music_songs read failed: " + error.message);
    if (!data?.length) break;
    rows.push(...(data as unknown as SongRow[]));
    if (data.length < 1000) break;
  }
  return rows;
}

export const libraryIndex = (rows: SongRow[]) => {
  const byIsrc = new Map<string, SongRow>();
  const byDeezer = new Map<number, SongRow>();
  const byKey = new Map<string, SongRow>();
  const bySpotify = new Map<string, SongRow>();
  for (const row of rows) {
    if (row.isrc) byIsrc.set(row.isrc.toUpperCase(), row);
    if (row.deezer_id) byDeezer.set(Number(row.deezer_id), row);
    if (row.spotify_id) bySpotify.set(row.spotify_id, row);
    const key = songKey(row.title, row.artist);
    const existing = byKey.get(key);
    if (!existing || (row.popularity ?? 0) > (existing.popularity ?? 0)) byKey.set(key, row);
  }
  return { byIsrc, byDeezer, byKey, bySpotify };
};

/* ---------- Spotify mapping ---------- */

export async function spotifyFor(row: Pick<SongRow, "isrc" | "title" | "artist">) {
  if (!row.isrc) return null;
  return spotifyTrackByIsrc(row.isrc);
}

/** Spotify id lookup that gives undefined (instead of throwing) while Spotify has the app locked out. */
export async function spotifyOrSkip(row: Pick<SongRow, "isrc" | "title" | "artist">) {
  try {
    return await spotifyFor(row);
  } catch (error) {
    if (error instanceof SpotifyUnavailable) return undefined;
    throw error;
  }
}

/** Store a Spotify id (and Spotify's cover when we have none). A clash means a duplicate song row. */
export async function saveSpotify(db: Db, row: SongRow, track: SpotifyTrack | null) {
  const update: Record<string, unknown> = { spotify_id: track?.id ?? null };
  if (track && !row.image_url) update.image_url = spotifyImage(track);
  if (!track) return { ok: true, matched: false };
  const { error } = await db.from("music_songs").update(update).eq("id", row.id);
  if (error) {
    if (error.code === "23505") return { ok: false, duplicate: true, matched: true };
    return { ok: false, matched: true, error: error.message };
  }
  return { ok: true, matched: true };
}

/* ---------- Insert ---------- */

/** Insert one Deezer track, unless the library already has it. Returns the stored row. */
export async function insertDeezerTrack(
  db: Db,
  index: ReturnType<typeof libraryIndex>,
  track: DeezerTrack,
  genres: string[],
  source: string,
  extra: Record<string, unknown> = {}
): Promise<{ row: SongRow; created: boolean } | null> {
  const isrc = track.isrc?.toUpperCase();
  const existing =
    (isrc && index.byIsrc.get(isrc)) || index.byDeezer.get(track.id) || index.byKey.get(songKey(track.title, track.artist.name));
  if (existing) return { row: existing, created: false };
  const record = { ...rowFromDeezer(track, genres, source), ...extra };
  const { data, error } = await db.from("music_songs").insert(record).select(SONG_COLUMNS).single();
  if (error || !data) return null;
  const row = data as unknown as SongRow;
  if (row.isrc) index.byIsrc.set(row.isrc, row);
  index.byDeezer.set(track.id, row);
  index.byKey.set(songKey(row.title, row.artist), row);
  return { row, created: true };
}

/* ---------- The daily job ---------- */

export type DailyMusicReport = {
  ok: boolean;
  added: string[];
  bpm: { checked: number; found: number };
  spotify: { checked: number; found: number };
  playlistsRead: number;
  error?: string;
};

/**
 * Small, time-boxed pass for the daily cron:
 *   1. read today's global chart plus two genre charts and three runners'
 *      playlists (rotating by day), and add the popular tracks we lack;
 *   2. find BPM for songs that have none yet (newest first);
 *   3. look up Spotify ids for songs that have an ISRC but no Spotify id.
 * Each step stops when the budget runs out; tomorrow carries on.
 */
export async function runDailyMusicIngest(db: Db, budgetMs = 25_000): Promise<DailyMusicReport> {
  const deadline = Date.now() + budgetMs;
  const report: DailyMusicReport = { ok: true, added: [], bpm: { checked: 0, found: 0 }, spotify: { checked: 0, found: 0 }, playlistsRead: 0 };
  try {
    const day = Math.floor(Date.now() / 86_400_000);
    const charts = DEEZER_CHARTS.filter((_, i) => i > 0);
    const chartIds = [0, charts[day % charts.length].id, charts[(day + 7) % charts.length].id];

    const candidates = new Map<number, Candidate>();
    await discoverCharts(candidates, chartIds);
    const term = PLAYLIST_TERMS[day % PLAYLIST_TERMS.length];
    const seen = new Set<number>();
    const playlists = await deezerSearchPlaylistsSafe(term);
    for (const playlist of playlists.slice((day * 3) % Math.max(1, playlists.length - 3)).slice(0, 3)) {
      if (Date.now() > deadline - 15_000) break;
      if (seen.has(playlist.id)) continue;
      seen.add(playlist.id);
      for (const track of await deezerPlaylistTracks(playlist.id)) addCandidate(candidates, track, {});
      report.playlistsRead += 1;
    }

    const library = await loadLibrary(db, "id,title,artist,isrc,deezer_id,spotify_id,popularity");
    const index = libraryIndex(library);
    const knownArtists = new Set(library.map((row) => artistKey(row.artist)));
    for (const c of candidates.values()) if (c.charted) knownArtists.add(artistKey(c.track.artist.name));
    const fresh = [...candidates.values()]
      .filter((c) => !index.byDeezer.has(c.track.id) && !index.byKey.has(songKey(c.track.title, c.track.artist.name)))
      .filter((c) => worthAdding(c, "daily"))
      .sort((a, b) => Number(b.charted) - Number(a.charted) || (b.track.rank ?? 0) - (a.track.rank ?? 0));

    // New songs: details, tempo from the preview (GetSongBPM is slow, so the
    // daily job leaves it to step 2 on a later day), Spotify id.
    for (const candidate of fresh) {
      if (Date.now() > deadline - 10_000) break;
      const details = await deezerDetails(candidate.track.id, candidate.chartGenres);
      if (!details || details.skip) continue;
      if (!fitsAudience(details.track.isrc, candidate.charted, knownArtists.has(artistKey(details.track.artist.name)))) continue;
      const decision = await decideTempo(
        { title: details.track.title, artists: [details.track.artist.name], preview: details.track.preview },
        { getsong: false }
      );
      const tempo = decision && decision.bpm_source !== "unreadable" ? tempoUpdate(decision) : { bpm_source: null };
      const inserted = await insertDeezerTrack(db, index, details.track, details.genres, candidate.charted ? "deezer-chart" : "deezer-playlist", tempo);
      if (inserted?.created) {
        report.added.push(`${inserted.row.title} - ${inserted.row.artist}`);
        if (inserted.row.isrc && Date.now() < deadline - 5_000) {
          const match = await spotifyOrSkip(inserted.row);
          if (match !== undefined) await saveSpotify(db, inserted.row, match);
        }
      }
    }

    // Step 2: songs still without a checked BPM (new adds whose preview
    // analysis was unsure, songs added by runners, anything that failed).
    if (Date.now() < deadline - 6_000) {
      const { data } = await db
        .from("music_songs")
        .select(SONG_COLUMNS)
        .is("bpm_source", null)
        .order("popularity", { ascending: false, nullsFirst: false })
        .limit(8);
      for (const row of (data ?? []) as unknown as SongRow[]) {
        if (Date.now() > deadline - 5_000) break;
        report.bpm.checked += 1;
        const preview = row.deezer_id ? (await deezerTrack(row.deezer_id))?.preview : row.preview_url;
        const decision = await decideTempo({ title: row.title, artists: [row.artist], preview });
        if (!decision) break;
        if (decision.bpm) report.bpm.found += 1;
        await db.from("music_songs").update(tempoUpdate(decision, row.energy)).eq("id", row.id);
      }
    }

    // Step 3: Spotify ids. Songs Spotify doesn't carry stay without one, so
    // the window moves through the list a little further each day.
    if (Date.now() < deadline - 3_000 && spotifyAvailable()) {
      const { count } = await db
        .from("music_songs")
        .select("id", { count: "exact", head: true })
        .is("spotify_id", null)
        .not("isrc", "is", null);
      const offset = count ? (day * 20) % count : 0;
      const { data } = await db
        .from("music_songs")
        .select(SONG_COLUMNS)
        .is("spotify_id", null)
        .not("isrc", "is", null)
        .order("popularity", { ascending: false, nullsFirst: false })
        .range(offset, offset + 19);
      for (const row of (data ?? []) as unknown as SongRow[]) {
        if (Date.now() > deadline - 2_000) break;
        const match = await spotifyOrSkip(row);
        if (match === undefined) break;
        report.spotify.checked += 1;
        const saved = await saveSpotify(db, row, match);
        if (saved.matched) report.spotify.found += 1;
      }
    }
  } catch (error) {
    report.ok = false;
    report.error = (error as Error).message;
  }
  return report;
}

const deezerSearchPlaylistsSafe = async (term: string) => {
  try {
    return await deezerSearchPlaylists(term, 100);
  } catch {
    return [];
  }
};

/* ---------- Add a song (Music Finder) ---------- */

export type AddedSong = { row: SongRow; created: boolean };

/**
 * A runner picked a Spotify track. Find it on Deezer by ISRC (cover art,
 * preview), resolve its BPM, store it, and remember it for this runner.
 */
export async function addSpotifyTrack(db: Db, spotifyId: string, userId: string | null): Promise<AddedSong | { error: string }> {
  const track = await spotifyTrack(spotifyId);
  if (!track) return { error: "Spotify could not find that track." };

  const remember = async (row: SongRow) => {
    if (userId) await db.from("user_songs").upsert({ user_id: userId, song_id: row.id }, { onConflict: "user_id,song_id" });
  };

  const { data: bySpotify } = await db.from("music_songs").select(SONG_COLUMNS).eq("spotify_id", track.id).maybeSingle();
  if (bySpotify && (bySpotify as unknown as SongRow).bpm) {
    await remember(bySpotify as unknown as SongRow);
    return { row: bySpotify as unknown as SongRow, created: false };
  }
  const isrc = track.external_ids?.isrc?.toUpperCase() ?? null;
  if (isrc) {
    const { data: byIsrc } = await db.from("music_songs").select(SONG_COLUMNS).eq("isrc", isrc).maybeSingle();
    const row = byIsrc as unknown as SongRow | null;
    if (row && row.bpm) {
      if (!row.spotify_id) await db.from("music_songs").update({ spotify_id: track.id }).eq("id", row.id);
      await remember(row);
      return { row: { ...row, spotify_id: row.spotify_id ?? track.id }, created: false };
    }
  }

  // Deezer by ISRC first; failing that, the same title by the same artist.
  const deezerMatch =
    (isrc ? await deezerTrackByIsrc(isrc) : null) ??
    (await deezerSearchTrack(track.name, track.artists[0]?.name ?? "")).find(
      (hit) => songKey(hit.title, hit.artist.name) === songKey(track.name, track.artists[0]?.name ?? "")
    ) ??
    null;
  const artists = track.artists.map((a) => a.name);
  const decision = await decideTempo({
    title: track.name,
    artists,
    preview: deezerMatch?.preview || track.preview_url
  });
  if (!decision || !decision.bpm) {
    return { error: "We couldn't read a reliable BPM for that track, so it isn't added. Try another version of the song." };
  }

  let genres: string[] = [];
  if (deezerMatch?.album?.id) genres = genresFor(await deezerAlbumGenres(deezerMatch.album.id));

  const record = {
    title: track.name,
    artist: artists[0],
    isrc,
    deezer_id: deezerMatch?.id ?? null,
    album: track.album.name,
    image_url: spotifyImage(track) ?? (deezerMatch ? coverFor(deezerMatch) : null),
    preview_url: deezerMatch?.preview || track.preview_url || null,
    duration_ms: track.duration_ms,
    popularity: deezerMatch?.rank ?? null,
    genre: genres,
    spotify_id: track.id,
    source: "user",
    item_key: `spotify-${track.id}`,
    added_by: userId,
    ...tempoUpdate(decision)
  };

  // The song may already exist without a BPM (or under its ISRC): update it.
  const existingId = await (async () => {
    if (bySpotify) return (bySpotify as unknown as SongRow).id;
    if (isrc) {
      const { data } = await db.from("music_songs").select("id").eq("isrc", isrc).maybeSingle();
      if (data) return (data as { id: string }).id;
    }
    return null;
  })();

  const query = existingId
    ? db.from("music_songs").update({ ...record, item_key: undefined, source: undefined, added_by: undefined }).eq("id", existingId)
    : db.from("music_songs").insert(record);
  const { data, error } = await query.select(SONG_COLUMNS).single();
  if (error || !data) return { error: "Saving the song failed: " + (error?.message ?? "unknown error") };
  const row = data as unknown as SongRow;
  await remember(row);
  return { row, created: !existingId };
}

/**
 * The same as addSpotifyTrack, starting from a Deezer track. Used when the
 * runner picked a result from Deezer's search (Spotify's search is the first
 * choice, but Spotify rate-limits apps in development mode hard).
 */
export async function addDeezerTrack(db: Db, deezerId: number, userId: string | null): Promise<AddedSong | { error: string }> {
  const remember = async (row: SongRow) => {
    if (userId) await db.from("user_songs").upsert({ user_id: userId, song_id: row.id }, { onConflict: "user_id,song_id" });
  };
  const track = await deezerTrack(deezerId);
  if (!track || !track.title || !track.artist) return { error: "Deezer could not find that track." };
  const isrc = track.isrc?.toUpperCase() ?? null;

  const existing = await (async () => {
    const { data } = await db.from("music_songs").select(SONG_COLUMNS).eq("deezer_id", track.id).maybeSingle();
    if (data) return data as unknown as SongRow;
    if (!isrc) return null;
    const { data: byIsrc } = await db.from("music_songs").select(SONG_COLUMNS).eq("isrc", isrc).maybeSingle();
    return (byIsrc as unknown as SongRow | null) ?? null;
  })();
  if (existing?.bpm) {
    await remember(existing);
    return { row: existing, created: false };
  }

  const artists = [track.artist.name, ...(track.contributors ?? []).map((c) => c.name)].filter((v, i, a) => a.indexOf(v) === i);
  const decision = await decideTempo({ title: track.title, artists, preview: track.preview });
  if (!decision || !decision.bpm) {
    return { error: "We couldn't read a reliable BPM for that track, so it isn't added. Try another version of the song." };
  }
  let genres: string[] = [];
  if (track.album?.id) genres = genresFor(await deezerAlbumGenres(track.album.id));
  const spotify = isrc ? await spotifyOrSkip({ isrc, title: track.title, artist: track.artist.name }).catch(() => undefined) : undefined;

  const record = {
    ...rowFromDeezer(track, genres, "user"),
    spotify_id: spotify?.id ?? null,
    added_by: userId,
    ...tempoUpdate(decision)
  };
  const query = existing
    ? db.from("music_songs").update({ ...record, item_key: undefined, source: undefined, added_by: undefined }).eq("id", existing.id)
    : db.from("music_songs").insert(record);
  let result = await query.select(SONG_COLUMNS).single();
  // Another row may already hold that Spotify id (the same song under another release).
  if (result.error?.code === "23505" && record.spotify_id) {
    const retry = { ...record, spotify_id: null };
    result = await (existing
      ? db.from("music_songs").update({ ...retry, item_key: undefined, source: undefined, added_by: undefined }).eq("id", existing.id)
      : db.from("music_songs").insert(retry)
    )
      .select(SONG_COLUMNS)
      .single();
  }
  if (result.error || !result.data) return { error: "Saving the song failed: " + (result.error?.message ?? "unknown error") };
  const row = result.data as unknown as SongRow;
  await remember(row);
  return { row, created: !existing };
}
