"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { CSSProperties } from "react";
import { songs as initialSongs, type Song } from "@/lib/data";
import SaveButton from "@/components/save-button";
import { useAuth } from "@/components/auth-provider";
import { getSupabaseClient } from "@/lib/supabase-client";

const genreOptions = ["all", "pop", "rock", "hip-hop", "electronic", "country"];
const energyOptions = ["all", "low", "medium", "high", "extreme"];
const workoutOptions = [
  { id: "all", label: "All workouts" },
  { id: "easy_run", label: "Easy runs" },
  { id: "tempo_run", label: "Tempo runs" },
  { id: "speed_work", label: "Speed work" },
  { id: "long_run", label: "Long runs" }
];
const bpmRanges = [
  { id: "all", label: "All BPM" },
  { id: "120-140", label: "120-140" },
  { id: "140-160", label: "140-160" },
  { id: "160-180", label: "160-180" },
  { id: "180+", label: "180+" }
];

const sortOptions = [
  { id: "popular", label: "Popular" },
  { id: "trending", label: "Trending" },
  { id: "new", label: "New" },
  { id: "bpm", label: "BPM" }
];

type SongRow = {
  id: string;
  title: string;
  artist: string;
  bpm: number | null;
  genre: string[] | null;
  energy: string | null;
  workout: string[] | null;
  submitted_date: string | null;
  created_at: string | null;
  upvotes: number | null;
  downvotes: number | null;
};

const energyValues = new Set(["low", "medium", "high", "extreme"]);

const normalizeEnergy = (value?: string | null): Song["energy"] => {
  if (value && energyValues.has(value)) {
    return value as Song["energy"];
  }
  return "medium";
};

const mapSongRow = (row: SongRow): Song => ({
  id: row.id,
  title: row.title,
  artist: row.artist,
  bpm: row.bpm ?? 150,
  genre: row.genre ?? [],
  energy: normalizeEnergy(row.energy),
  workout: row.workout ?? [],
  submittedDate:
    row.submitted_date ?? row.created_at?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
  upvotes: row.upvotes ?? 0,
  downvotes: row.downvotes ?? 0
});

export default function MusicToolsPage() {
  const { user, supabaseAvailable } = useAuth();
  const [songs, setSongs] = useState<Song[]>(initialSongs);
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [genre, setGenre] = useState("all");
  const [energy, setEnergy] = useState("all");
  const [bpmRange, setBpmRange] = useState("all");
  const [sortBy, setSortBy] = useState("popular");
  const [search, setSearch] = useState("");
  const [workoutFilter, setWorkoutFilter] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [songStatus, setSongStatus] = useState<"idle" | "loading" | "error">("idle");
  const [usingSampleData, setUsingSampleData] = useState(!supabaseAvailable);
  const [actionMessage, setActionMessage] = useState("");
  const [visibleCount, setVisibleCount] = useState(50);

  const [form, setForm] = useState({
    title: "",
    artist: "",
    bpm: "",
    genre: "pop",
    energy: "high",
    workout: "tempo_run"
  });

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setSongs(initialSongs);
      setUsingSampleData(true);
      return;
    }

    let active = true;
    setSongStatus("loading");

    supabase
      .from("music_songs")
      .select("id, title, artist, bpm, genre, energy, workout, submitted_date, created_at, upvotes, downvotes")
      .order("submitted_date", { ascending: false, nullsFirst: false })
      .then(({ data, error }) => {
        if (!active) {
          return;
        }
        if (error) {
          setSongStatus("error");
          setSongs(initialSongs);
          setUsingSampleData(true);
          return;
        }
        if (!data || data.length === 0) {
          setSongs([]);
          setUsingSampleData(false);
          setSongStatus("idle");
          return;
        }
        setSongs((data as SongRow[]).map(mapSongRow));
        setUsingSampleData(false);
        setSongStatus("idle");
      });

    return () => {
      active = false;
    };
  }, [supabaseAvailable]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase || !user || usingSampleData) {
      setVotes({});
      return;
    }

    let active = true;

    supabase
      .from("song_votes")
      .select("song_id, vote")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (!active) {
          return;
        }
        const voteMap = (data ?? []).reduce<Record<string, number>>((acc, item) => {
          acc[item.song_id] = item.vote;
          return acc;
        }, {});
        setVotes(voteMap);
      });

    return () => {
      active = false;
    };
  }, [user, supabaseAvailable, usingSampleData]);

  const netScore = (song: Song) => song.upvotes - song.downvotes;

  const handleVote = async (id: string, value: number) => {
    setActionMessage("");
    const allowLocal = !supabaseAvailable || usingSampleData;

    if (!allowLocal && !user) {
      setActionMessage("Sign in to vote on tracks.");
      return;
    }

    const prev = votes[id] ?? 0;
    const next = prev === value ? 0 : value;
    const upDelta = (prev === 1 ? -1 : 0) + (next === 1 ? 1 : 0);
    const downDelta = (prev === -1 ? -1 : 0) + (next === -1 ? 1 : 0);

    setVotes((current) => ({ ...current, [id]: next }));
    setSongs((songList) =>
      songList.map((song) => {
        if (song.id !== id) {
          return song;
        }
        return {
          ...song,
          upvotes: song.upvotes + upDelta,
          downvotes: song.downvotes + downDelta
        };
      })
    );

    const supabase = getSupabaseClient();
    if (allowLocal || !supabase || !user) {
      return;
    }

    const song = songs.find((item) => item.id === id);
    if (!song) {
      return;
    }
    const newUpvotes = Math.max(0, song.upvotes + upDelta);
    const newDownvotes = Math.max(0, song.downvotes + downDelta);

    if (next === 0) {
      await supabase.from("song_votes").delete().match({ user_id: user.id, song_id: id });
    } else {
      await supabase
        .from("song_votes")
        .upsert({ user_id: user.id, song_id: id, vote: next });
    }

    const { error } = await supabase
      .from("music_songs")
      .update({ upvotes: newUpvotes, downvotes: newDownvotes })
      .eq("id", id);

    if (error) {
      setActionMessage("Vote saved locally but failed to sync.");
    }
  };

  const filteredSongs = useMemo(() => {
    const matchesRange = (bpm: number) => {
      if (bpmRange === "all") {
        return true;
      }
      if (bpmRange === "180+") {
        return bpm >= 180;
      }
      const [min, max] = bpmRange.split("-").map(Number);
      return bpm >= min && bpm <= max;
    };

    const list = songs.filter((song) => {
      const genreMatch = genre === "all" || song.genre.includes(genre);
      const energyMatch = energy === "all" || song.energy === energy;
      const bpmMatch = matchesRange(song.bpm);
      const workoutMatch =
        workoutFilter === "all" || song.workout.includes(workoutFilter);
      const searchMatch =
        !search ||
        song.title.toLowerCase().includes(search.toLowerCase()) ||
        song.artist.toLowerCase().includes(search.toLowerCase());
      return genreMatch && energyMatch && bpmMatch && workoutMatch && searchMatch;
    });

    const sorted = [...list].sort((a, b) => {
      const scoreA = a.upvotes - a.downvotes;
      const scoreB = b.upvotes - b.downvotes;
      if (sortBy === "new") {
        return b.submittedDate.localeCompare(a.submittedDate);
      }
      if (sortBy === "bpm") {
        return b.bpm - a.bpm;
      }
      if (sortBy === "trending") {
        return scoreB - scoreA || b.submittedDate.localeCompare(a.submittedDate);
      }
      return scoreB - scoreA;
    });

    return sorted;
  }, [songs, genre, energy, bpmRange, sortBy, search, workoutFilter]);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(50);
  }, [genre, energy, bpmRange, sortBy, search, workoutFilter]);

  const visibleSongs = filteredSongs.slice(0, visibleCount);
  const hasMore = visibleCount < filteredSongs.length;

  const topByWorkout = useMemo(() => {
    return {
      easy: songs
        .filter((song) => song.workout.includes("easy_run"))
        .slice()
        .sort((a, b) => netScore(b) - netScore(a))
        .slice(0, 3),
      tempo: songs
        .filter((song) => song.workout.includes("tempo_run"))
        .slice()
        .sort((a, b) => netScore(b) - netScore(a))
        .slice(0, 3),
      speed: songs
        .filter((song) => song.workout.includes("speed_work"))
        .slice()
        .sort((a, b) => netScore(b) - netScore(a))
        .slice(0, 3)
    };
  }, [songs]);

  const handleSubmit = async () => {
    if (!form.title || !form.artist) {
      return;
    }

    const allowLocal = !supabaseAvailable || usingSampleData;
    if (!allowLocal && !user) {
      setActionMessage("Sign in to submit a song.");
      return;
    }

    const submittedDate = new Date().toISOString().slice(0, 10);
    const newSong: Song = {
      id: `song-${songs.length + 1}`,
      title: form.title,
      artist: form.artist,
      bpm: Number(form.bpm) || 150,
      genre: [form.genre],
      energy: form.energy as Song["energy"],
      workout: [form.workout],
      submittedDate,
      upvotes: 0,
      downvotes: 0
    };

    const supabase = getSupabaseClient();
    if (!allowLocal && supabase && user) {
      const { data, error } = await supabase
        .from("music_songs")
        .insert({
          title: form.title,
          artist: form.artist,
          bpm: Number(form.bpm) || null,
          genre: [form.genre],
          energy: form.energy,
          workout: [form.workout],
          submitted_by: user.id,
          submitted_date: submittedDate,
          upvotes: 0,
          downvotes: 0
        })
        .select("id, title, artist, bpm, genre, energy, workout, submitted_date, created_at, upvotes, downvotes")
        .single();

      if (error || !data) {
        setActionMessage("Unable to submit song right now.");
        return;
      }

      setSongs((current) => [mapSongRow(data as SongRow), ...current]);
    } else {
      setSongs((current) => [newSong, ...current]);
    }

    setForm({ title: "", artist: "", bpm: "", genre: "pop", energy: "high", workout: "tempo_run" });
  };

  const voteDisabled = supabaseAvailable && !usingSampleData && !user;
  const submitDisabled = supabaseAvailable && !usingSampleData && !user;

  return (
    <div>
      <section className="tool-hero container">
        <h1>Music Tools</h1>
        <p>
          Discover top running tracks, vote with the community, and build
          playlists for every pace.
        </p>
      </section>

      <section className="section container">
        <div className="stack">
          <div className="card">
            <div className="stack">
              <strong>Filters</strong>
              <div className="filter-bar">
                <div className="filter-group">
                  <span className="label">Search</span>
                  <input
                    className="input"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by song or artist"
                  />
                </div>
                <div className="filter-group">
                  <span className="label">Genre</span>
                  <select className="select" value={genre} onChange={(event) => setGenre(event.target.value)}>
                    {genreOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="filter-group">
                  <span className="label">BPM</span>
                  <select className="select" value={bpmRange} onChange={(event) => setBpmRange(event.target.value)}>
                    {bpmRanges.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="filter-group">
                  <span className="label">Sort</span>
                  <select className="select" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                    {sortOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="filter-actions">
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={() => setFiltersOpen((current) => !current)}
                  >
                    {filtersOpen ? "Hide all filters" : "Show all filters"}
                  </button>
                </div>
              </div>

              {filtersOpen ? (
                <div className="filter-panel">
                  <div className="filter-row">
                    <div className="filter-group">
                      <span className="label">Energy</span>
                      <select className="select" value={energy} onChange={(event) => setEnergy(event.target.value)}>
                        {energyOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="filter-group">
                      <span className="label">Best for</span>
                      <select className="select" value={workoutFilter} onChange={(event) => setWorkoutFilter(event.target.value)}>
                        {workoutOptions.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {!supabaseAvailable ? (
            <div className="notice">Demo mode: connect Supabase to save songs and votes.</div>
          ) : null}
          {supabaseAvailable && !user && !usingSampleData ? (
            <div className="notice">Sign in to submit songs and vote.</div>
          ) : null}
          {songStatus === "error" ? (
            <div className="notice">Unable to load songs from Supabase. Showing sample data.</div>
          ) : null}
          {actionMessage ? <div className="notice">{actionMessage}</div> : null}

          <div className="grid grid-2">
            <div className="stack">
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                <strong>Leaderboard</strong>
                <span className="badge">{filteredSongs.length} tracks</span>
              </div>
              <div className="card-grid">
                {filteredSongs.length === 0 ? (
                  <div className="card card-outline">
                    {supabaseAvailable && !usingSampleData ? "No songs yet. Be the first to submit." : "No songs match those filters yet."}
                  </div>
                ) : (
                  visibleSongs.map((song, index) => {
                    const score = song.upvotes - song.downvotes;
                    const userVote = votes[song.id] ?? 0;
                    return (
                      <div
                        key={song.id}
                        className="card fade-up"
                        style={{ "--delay": `${index * 0.04}s` } as CSSProperties}
                      >
                        <div className="stack">
                          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                            <div>
                              <strong>{song.title}</strong>
                              <div className="brand-sub">{song.artist}</div>
                            </div>
                            <span className="tag">{song.bpm} BPM</span>
                          </div>
                          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            {song.genre.map((item) => (
                              <span key={item} className="tag">
                                {item}
                              </span>
                            ))}
                            <span className="tag">{song.energy} energy</span>
                          </div>
                          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                            <button
                              className={`btn ${userVote === 1 ? "btn-primary" : "btn-secondary"}`}
                              type="button"
                              onClick={() => handleVote(song.id, 1)}
                              disabled={voteDisabled}
                            >
                              Upvote
                            </button>
                            <button
                              className={`btn ${userVote === -1 ? "btn-primary" : "btn-secondary"}`}
                              type="button"
                              onClick={() => handleVote(song.id, -1)}
                              disabled={voteDisabled}
                            >
                              Downvote
                            </button>
                            <span className="badge">Score {score}</span>
                            <SaveButton
                              itemType="song"
                              itemId={song.id}
                              label={`${song.title} - ${song.artist}`}
                              metadata={{ artist: song.artist, bpm: song.bpm }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              {hasMore && (
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => setVisibleCount((c) => c + 50)}
                >
                  Show more ({filteredSongs.length - visibleCount} remaining)
                </button>
              )}
            </div>

            <div className="stack">
              <div className="card card-accent">
                <div className="stack">
                  <strong>Submit a song</strong>
                  <div className="form-grid">
                    <div>
                      <span className="label">Song title</span>
                      <input
                        className="input"
                        value={form.title}
                        onChange={(event) => setForm({ ...form, title: event.target.value })}
                      />
                    </div>
                    <div>
                      <span className="label">Artist</span>
                      <input
                        className="input"
                        value={form.artist}
                        onChange={(event) => setForm({ ...form, artist: event.target.value })}
                      />
                    </div>
                    <div>
                      <span className="label">BPM (optional)</span>
                      <input
                        className="input"
                        value={form.bpm}
                        onChange={(event) => setForm({ ...form, bpm: event.target.value })}
                      />
                    </div>
                    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                      <div>
                        <span className="label">Genre</span>
                        <select className="select" value={form.genre} onChange={(event) => setForm({ ...form, genre: event.target.value })}>
                          {genreOptions.filter((option) => option !== "all").map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <span className="label">Energy</span>
                        <select className="select" value={form.energy} onChange={(event) => setForm({ ...form, energy: event.target.value })}>
                          {energyOptions.filter((option) => option !== "all").map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <span className="label">Best for</span>
                        <select className="select" value={form.workout} onChange={(event) => setForm({ ...form, workout: event.target.value })}>
                          <option value="easy_run">Easy run</option>
                          <option value="tempo_run">Tempo run</option>
                          <option value="speed_work">Speed work</option>
                          <option value="long_run">Long run</option>
                        </select>
                      </div>
                    </div>
                    <button className="btn btn-primary" type="button" onClick={handleSubmit} disabled={submitDisabled}>
                      Submit song
                    </button>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="stack">
                  <strong>Top songs by workout</strong>
                  <div className="stack">
                    <div>
                      <span className="badge">Easy runs (120-160 BPM)</span>
                      <ul className="list">
                        {topByWorkout.easy.map((song) => (
                          <li key={song.id}>
                            <strong>{song.title}</strong>
                            <span className="brand-sub"> — {song.artist} · {song.bpm} BPM</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span className="badge">Tempo runs (150-180 BPM)</span>
                      <ul className="list">
                        {topByWorkout.tempo.map((song) => (
                          <li key={song.id}>
                            <strong>{song.title}</strong>
                            <span className="brand-sub"> — {song.artist} · {song.bpm} BPM</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span className="badge">Speed work (170+ BPM)</span>
                      <ul className="list">
                        {topByWorkout.speed.map((song) => (
                          <li key={song.id}>
                            <strong>{song.title}</strong>
                            <span className="brand-sub"> — {song.artist} · {song.bpm} BPM</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <p style={{ fontSize: "0.75rem", color: "#888", marginTop: "1rem" }}>
                BPM data provided by{" "}
                <a href="https://getsongbpm.com" target="_blank" rel="noopener noreferrer" style={{ color: "#aaa" }}>
                  GetSongBPM
                </a>
              </p>
              <Link className="btn btn-ghost" href="/tools/fueling">
                Next tool: Fueling
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
