import "./load-env.mjs";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BPM_API_KEY = process.env.GETSONGBPM_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing Supabase env vars.");
  process.exit(1);
}

if (!BPM_API_KEY) {
  console.error("Missing GETSONGBPM_API_KEY env var.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const normalize = (str) => str.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();

// Strip feat/remix/from suffixes to get clean title for search
const cleanTitle = (title) =>
  title.replace(/\s*[\(\[].*?[\)\]]/g, "")  // remove parenthetical
       .replace(/\s*-\s*(feat|ft|from|edit|remix|version|remaster|deluxe|live|radio|single|extended|original).*$/i, "")
       .trim();

const searchBpm = async (title, artist) => {
  const clean = cleanTitle(title);
  const url = `https://api.getsong.co/search/?api_key=${BPM_API_KEY}&type=song&lookup=${encodeURIComponent(clean)}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 429) {
        console.log("  Rate limited, waiting 10s...");
        await sleep(10000);
        return searchBpm(title, artist);
      }
      console.log(`  API error ${res.status} for "${title}"`);
      return null;
    }

    const data = await res.json();
    const results = Array.isArray(data.search) ? data.search : [];
    if (results.length === 0) return null;

    const artistNorm = normalize(artist);
    const titleNorm = normalize(clean);

    // 1st pass: match both title and artist
    for (const r of results) {
      const rArtist = normalize(r.artist?.name ?? "");
      const rTitle = normalize(r.title ?? "");
      const tempo = parseInt(r.tempo, 10);
      if (!tempo || tempo <= 0) continue;

      // Check if artist overlaps (first word or significant substring)
      const artistMatch = artistNorm.includes(rArtist) || rArtist.includes(artistNorm)
        || artistNorm.split(" ").some(w => w.length > 3 && rArtist.includes(w));
      const titleMatch = rTitle.includes(titleNorm) || titleNorm.includes(rTitle);

      if (titleMatch && artistMatch) return tempo;
    }

    // 2nd pass: match title only, take first result with tempo
    for (const r of results) {
      const rTitle = normalize(r.title ?? "");
      const tempo = parseInt(r.tempo, 10);
      if (!tempo || tempo <= 0) continue;
      if (rTitle.includes(titleNorm) || titleNorm.includes(rTitle)) return tempo;
    }

    // 3rd pass: just take first result with a tempo
    for (const r of results) {
      const tempo = parseInt(r.tempo, 10);
      if (tempo && tempo > 0) return tempo;
    }

    return null;
  } catch (err) {
    console.log(`  Fetch error for "${title}": ${err.message}`);
    return null;
  }
};

const classifyEnergy = (bpm) => {
  if (bpm >= 175) return "extreme";
  if (bpm >= 155) return "high";
  if (bpm >= 120) return "medium";
  return "low";
};

const classifyWorkout = (bpm) => {
  const workouts = [];
  if (bpm >= 170) workouts.push("speed_work");
  if (bpm >= 150 && bpm < 180) workouts.push("tempo_run");
  if (bpm >= 120 && bpm < 160) workouts.push("easy_run");
  if (bpm >= 155) workouts.push("finish_kick");
  if (bpm >= 130 && bpm < 170) workouts.push("long_run");
  if (bpm < 120) workouts.push("warm_up");
  return workouts.length ? workouts : ["easy_run"];
};

const run = async () => {
  // Fetch songs without BPM
  const { data: songs, error } = await supabase
    .from("music_songs")
    .select("item_key, title, artist, bpm")
    .is("bpm", null);

  if (error) {
    console.error("Fetch error:", error.message);
    process.exit(1);
  }

  console.log(`Found ${songs.length} songs without BPM. Looking up via GetSongBPM API...`);

  let matched = 0;
  let missed = 0;

  for (let i = 0; i < songs.length; i++) {
    const song = songs[i];
    const bpm = await searchBpm(song.title, song.artist);

    if (bpm) {
      const { error } = await supabase
        .from("music_songs")
        .update({
          bpm,
          energy: classifyEnergy(bpm),
          workout: classifyWorkout(bpm),
          updated_at: new Date().toISOString()
        })
        .eq("item_key", song.item_key);

      if (error) {
        console.log(`  DB error for "${song.title}": ${error.message}`);
      } else {
        matched++;
      }
      console.log(`  [${i + 1}/${songs.length}] "${song.title}" → ${bpm} BPM`);
    } else {
      missed++;
      console.log(`  [${i + 1}/${songs.length}] "${song.title}" → not found`);
    }

    // Rate limit: ~2 requests/sec
    await sleep(500);
  }

  console.log(`\nDone. Matched: ${matched}, Not found: ${missed}`);

  // Final stats
  const { count: withBpm } = await supabase
    .from("music_songs")
    .select("*", { count: "exact", head: true })
    .not("bpm", "is", null);

  const { count: total } = await supabase
    .from("music_songs")
    .select("*", { count: "exact", head: true });

  console.log(`Total songs with BPM: ${withBpm}/${total}`);
};

run().catch((err) => { console.error(err); process.exit(1); });
