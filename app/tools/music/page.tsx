"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import SaveButton from "@/components/save-button";
import { songs as initialSongs, type Song } from "@/lib/data";
import { getSupabaseClient } from "@/lib/supabase-client";

const workoutOptions = [
  {
    id: "easy_run",
    label: "Easy run",
    description: "Relaxed and conversational"
  },
  {
    id: "long_run",
    label: "Long run",
    description: "Steady energy that lasts"
  },
  {
    id: "tempo_run",
    label: "Tempo",
    description: "Controlled, focused pressure"
  },
  {
    id: "speed_work",
    label: "Intervals",
    description: "Hard reps and recoveries"
  },
  {
    id: "race_day",
    label: "Race",
    description: "Commit and keep building"
  }
];

const energyArcOptions = [
  {
    id: "steady",
    label: "Keep me steady",
    description: "Consistent energy with no wild swings."
  },
  {
    id: "build",
    label: "Build as I go",
    description: "Calm start, stronger middle, biggest finish."
  },
  {
    id: "push",
    label: "High from the gun",
    description: "Urgent, loud, and ready to work."
  }
];

const genreOptions = ["all", "pop", "rock", "hip-hop", "electronic", "country"];
const bpmRanges = [
  { id: "all", label: "Let the workout decide" },
  { id: "90-119", label: "90-119 BPM" },
  { id: "120-139", label: "120-139 BPM" },
  { id: "140-159", label: "140-159 BPM" },
  { id: "160-179", label: "160-179 BPM" },
  { id: "180+", label: "180+ BPM" }
];

const discoveryOptions = [
  { id: "trusted", label: "Crowd favorites" },
  { id: "balanced", label: "Favorites + discoveries" },
  { id: "fresh", label: "Surprise me" }
];

const phaseDefinitions = [
  {
    id: "warm",
    label: "Ease in",
    description: "Find rhythm without spending the finish."
  },
  {
    id: "work",
    label: "Lock in",
    description: "The main working block."
  },
  {
    id: "finish",
    label: "Finish strong",
    description: "Save the biggest lift for the end."
  }
];

const energyRank: Record<Song["energy"], number> = {
  low: 0,
  medium: 1,
  high: 2,
  extreme: 3
};

const sessionKey = "music-builder-state-v2";
const averageTrackMinutes = 3.6;
const maxCatalogResults = 16;

type Workout = "easy_run" | "long_run" | "tempo_run" | "speed_work" | "race_day";
type EnergyArc = "steady" | "build" | "push";
type Discovery = "trusted" | "balanced" | "fresh";
type PhaseId = "warm" | "work" | "finish";

type SongRow = {
  id: string;
  title: string;
  artist: string;
  spotify_id: string | null;
  bpm: number | null;
  genre: string[] | null;
  energy: string | null;
  workout: string[] | null;
  submitted_date: string | null;
  created_at: string | null;
  upvotes: number | null;
  downvotes: number | null;
};

type PlaylistTrack = Song & {
  phase: PhaseId;
  startMinute: number;
};

type PlaylistPhase = {
  id: PhaseId;
  label: string;
  description: string;
  startMinute: number;
  endMinute: number;
  tracks: PlaylistTrack[];
};

const validEnergies = new Set(["low", "medium", "high", "extreme"]);

const normalizeEnergy = (value?: string | null): Song["energy"] => {
  if (value && validEnergies.has(value)) return value as Song["energy"];
  return "medium";
};

const mapSongRow = (row: SongRow): Song => ({
  id: row.id,
  title: row.title,
  artist: row.artist,
  spotifyId: row.spotify_id,
  bpm: row.bpm ?? null,
  genre: row.genre ?? [],
  energy: normalizeEnergy(row.energy),
  workout: row.workout ?? [],
  submittedDate:
    row.submitted_date ??
    row.created_at?.slice(0, 10) ??
    new Date().toISOString().slice(0, 10),
  upvotes: row.upvotes ?? 0,
  downvotes: row.downvotes ?? 0
});

const stableHash = (value: string) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
};

const matchesBpmRange = (bpm: number | null, range: string) => {
  if (range === "all") return true;
  if (bpm === null) return false;
  if (range === "180+") return bpm >= 180;
  const [minimum, maximum] = range.split("-").map(Number);
  return bpm >= minimum && bpm <= maximum;
};

const spotifyUrl = (song: Song) => {
  if (song.spotifyId) return "https://open.spotify.com/track/" + song.spotifyId;
  return (
    "https://open.spotify.com/search/" +
    encodeURIComponent(song.title + " " + song.artist)
  );
};

const workoutTags = (workout: Workout) => {
  if (workout === "race_day") {
    return ["speed_work", "tempo_run", "finish_kick", "long_run"];
  }
  return [workout];
};

const phaseTargets = (workout: Workout, arc: EnergyArc) => {
  if (arc === "push") return [2, 3, 3];
  if (arc === "build") return [1, 2, 3];
  if (workout === "easy_run") return [1, 1, 2];
  if (workout === "long_run") return [1, 2, 2];
  if (workout === "speed_work") return [1, 3, 2];
  return [1, 2, 2];
};

const scoreSong = ({
  song,
  workout,
  desiredEnergy,
  discovery,
  phaseIndex,
  shuffleSeed
}: {
  song: Song;
  workout: Workout;
  desiredEnergy: number;
  discovery: Discovery;
  phaseIndex: number;
  shuffleSeed: number;
}) => {
  const tags = workoutTags(workout);
  const workoutMatch = tags.some((tag) => song.workout.includes(tag));
  const energyDistance = Math.abs(energyRank[song.energy] - desiredEnergy);
  const netVotes = song.upvotes - song.downvotes;
  const noise =
    (stableHash(song.id + "-" + phaseIndex + "-" + shuffleSeed) % 1000) / 1000;

  let score = workoutMatch ? 40 : 0;
  score += 30 - energyDistance * 13;

  if (discovery === "trusted") {
    score += Math.min(35, Math.max(-10, netVotes * 0.12));
    score += noise * 2;
  } else if (discovery === "fresh") {
    score += noise * 35;
    score += Math.min(8, Math.max(0, netVotes * 0.02));
  } else {
    score += Math.min(20, Math.max(-5, netVotes * 0.06));
    score += noise * 12;
  }

  return score;
};

const formatTime = (minutes: number) => {
  if (minutes < 60) return minutes + " min";
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? hours + "h " + remainder + "m" : hours + "h";
};

const formatMinuteMark = (minutes: number) => {
  const rounded = Math.max(0, Math.round(minutes));
  const hours = Math.floor(rounded / 60);
  const mins = rounded % 60;
  if (!hours) return String(mins);
  return hours + ":" + mins.toString().padStart(2, "0");
};

const dedupeSongs = (songs: Song[]) => {
  const seen = new Set<string>();
  return songs.filter((song) => {
    const key = (song.title + "-" + song.artist).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export default function MusicToolsPage() {
  const [songs, setSongs] = useState<Song[]>(initialSongs);
  const [workout, setWorkout] = useState<Workout>("easy_run");
  const [duration, setDuration] = useState(45);
  const [energyArc, setEnergyArc] = useState<EnergyArc>("build");
  const [genre, setGenre] = useState("all");
  const [bpmRange, setBpmRange] = useState("all");
  const [discovery, setDiscovery] = useState<Discovery>("balanced");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [catalogShowAll, setCatalogShowAll] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogGenre, setCatalogGenre] = useState("all");
  const [catalogEnergy, setCatalogEnergy] = useState("all");
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const [copyStatus, setCopyStatus] = useState("");
  const [songStatus, setSongStatus] = useState<"idle" | "loading" | "error">("idle");
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(sessionKey);
      if (raw) {
        const saved = JSON.parse(raw);
        if (typeof saved.workout === "string") setWorkout(saved.workout);
        if (typeof saved.duration === "number") setDuration(saved.duration);
        if (typeof saved.energyArc === "string") setEnergyArc(saved.energyArc);
        if (typeof saved.genre === "string") setGenre(saved.genre);
        if (typeof saved.bpmRange === "string") setBpmRange(saved.bpmRange);
        if (typeof saved.discovery === "string") setDiscovery(saved.discovery);
        if (typeof saved.advancedOpen === "boolean") setAdvancedOpen(saved.advancedOpen);
        if (typeof saved.catalogOpen === "boolean") setCatalogOpen(saved.catalogOpen);
      }
    } catch {
      window.sessionStorage.removeItem(sessionKey);
    } finally {
      setRestored(true);
    }
  }, []);

  useEffect(() => {
    if (!restored) return;
    window.sessionStorage.setItem(
      sessionKey,
      JSON.stringify({
        workout,
        duration,
        energyArc,
        genre,
        bpmRange,
        discovery,
        advancedOpen,
        catalogOpen
      })
    );
  }, [
    restored,
    workout,
    duration,
    energyArc,
    genre,
    bpmRange,
    discovery,
    advancedOpen,
    catalogOpen
  ]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    let active = true;
    setSongStatus("loading");
    supabase
      .from("music_songs")
      .select(
        "id, title, artist, spotify_id, bpm, genre, energy, workout, submitted_date, created_at, upvotes, downvotes"
      )
      .order("submitted_date", { ascending: false, nullsFirst: false })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setSongStatus("error");
          return;
        }
        if (data?.length) {
          setSongs(dedupeSongs((data as SongRow[]).map(mapSongRow)));
        }
        setSongStatus("idle");
      });
    return () => {
      active = false;
    };
  }, []);

  const playlist = useMemo<PlaylistPhase[]>(() => {
    const uniqueSongs = dedupeSongs(songs);
    const filteredPool = uniqueSongs.filter((song) => {
      const genreMatch = genre === "all" || song.genre.includes(genre);
      const bpmMatch = matchesBpmRange(song.bpm, bpmRange);
      return genreMatch && bpmMatch;
    });
    const pool = filteredPool.length >= 6 ? filteredPool : uniqueSongs;
    const requestedTracks = Math.max(
      6,
      Math.min(50, Math.ceil(duration / averageTrackMinutes))
    );
    const availableTracks = Math.min(requestedTracks, pool.length);
    const warmCount = Math.max(1, Math.round(availableTracks * 0.2));
    const finishCount = Math.max(1, Math.round(availableTracks * 0.2));
    const workCount = Math.max(1, availableTracks - warmCount - finishCount);
    const phaseCounts = [warmCount, workCount, finishCount];
    const targets = phaseTargets(workout, energyArc);
    const used = new Set<string>();
    let consumedTracks = 0;

    return phaseDefinitions.map((phase, phaseIndex) => {
      const count = phaseCounts[phaseIndex];
      const candidates = pool
        .filter((song) => !used.has(song.id))
        .map((song) => ({
          song,
          score: scoreSong({
            song,
            workout,
            desiredEnergy: targets[phaseIndex],
            discovery,
            phaseIndex,
            shuffleSeed
          })
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, count);

      const phaseStart = (consumedTracks / availableTracks) * duration;
      const tracks = candidates.map(({ song }, index) => {
        used.add(song.id);
        return {
          ...song,
          phase: phase.id as PhaseId,
          startMinute:
            ((consumedTracks + index) / availableTracks) * duration
        };
      });
      consumedTracks += tracks.length;
      const phaseEnd = (consumedTracks / availableTracks) * duration;

      return {
        id: phase.id as PhaseId,
        label: phase.label,
        description: phase.description,
        startMinute: phaseStart,
        endMinute: phaseEnd,
        tracks
      };
    });
  }, [
    songs,
    workout,
    duration,
    energyArc,
    genre,
    bpmRange,
    discovery,
    shuffleSeed
  ]);

  const playlistTracks = useMemo(
    () => playlist.flatMap((phase) => phase.tracks),
    [playlist]
  );

  const catalogSongs = useMemo(() => {
    const needle = catalogSearch.trim().toLowerCase();
    return dedupeSongs(songs)
      .filter((song) => {
        const searchMatch =
          !needle ||
          song.title.toLowerCase().includes(needle) ||
          song.artist.toLowerCase().includes(needle);
        const genreMatch =
          catalogGenre === "all" || song.genre.includes(catalogGenre);
        const energyMatch =
          catalogEnergy === "all" || song.energy === catalogEnergy;
        return searchMatch && genreMatch && energyMatch;
      })
      .sort(
        (a, b) =>
          b.upvotes - b.downvotes - (a.upvotes - a.downvotes) ||
          b.submittedDate.localeCompare(a.submittedDate)
      );
  }, [songs, catalogSearch, catalogGenre, catalogEnergy]);

  const resetBuilder = () => {
    setWorkout("easy_run");
    setDuration(45);
    setEnergyArc("build");
    setGenre("all");
    setBpmRange("all");
    setDiscovery("balanced");
    setAdvancedOpen(false);
    setShuffleSeed(0);
    setCopyStatus("");
  };

  const copyPlaylist = async () => {
    const text = [
      "Runner Toolkit - " +
        workoutOptions.find((option) => option.id === workout)?.label +
        " - " +
        formatTime(duration),
      "",
      ...playlist.flatMap((phase) => [
        phase.label.toUpperCase() +
          " (" +
          formatMinuteMark(phase.startMinute) +
          "-" +
          formatMinuteMark(phase.endMinute) +
          " min)",
        ...phase.tracks.map(
          (song, index) =>
            String(index + 1) + ". " + song.title + " - " + song.artist
        ),
        ""
      ])
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus("Playlist copied");
    } catch {
      setCopyStatus("Copy failed - select tracks from the list");
    }
  };

  const firstSpotifyTrack = playlistTracks[0];

  return (
    <main className="tool-page tool-page-music music-builder-simple">
      <section className="tool-hero container music-tool-hero">
        <span className="eyebrow">Free Running Music Builder</span>
        <h1>Make the playlist fit the workout.</h1>
        <p>
          Choose the run, how long it lasts, and how the energy should move.
          Get a phased soundtrack from the first easy minutes to the final push.
        </p>
      </section>

      <section className="container music-builder-layout" aria-labelledby="music-builder-title">
        <div className="music-builder-card">
          <div className="music-card-heading">
            <div>
              <span className="music-step-count">3 quick choices</span>
              <h2 id="music-builder-title">Shape this run</h2>
            </div>
            <button className="text-button" type="button" onClick={resetBuilder}>
              Reset
            </button>
          </div>

          <fieldset className="music-question">
            <legend><span>1</span> What is the workout?</legend>
            <div className="music-workout-grid">
              {workoutOptions.map((option) => (
                <button
                  key={option.id}
                  className={
                    workout === option.id
                      ? "music-choice music-choice-selected"
                      : "music-choice"
                  }
                  type="button"
                  aria-pressed={workout === option.id}
                  onClick={() => {
                    setWorkout(option.id as Workout);
                    setShuffleSeed(0);
                  }}
                >
                  <strong>{option.label}</strong>
                  <span>{option.description}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="music-question">
            <legend><span>2</span> How long are you running?</legend>
            <div className="music-duration-row">
              {[30, 45, 60, 90].map((value) => (
                <button
                  key={value}
                  className={
                    duration === value
                      ? "music-duration music-duration-selected"
                      : "music-duration"
                  }
                  type="button"
                  aria-pressed={duration === value}
                  onClick={() => setDuration(value)}
                >
                  {value} min
                </button>
              ))}
              <label>
                <input
                  type="number"
                  min="20"
                  max="240"
                  value={duration}
                  onChange={(event) =>
                    setDuration(
                      Math.max(20, Math.min(240, Number(event.target.value) || 20))
                    )
                  }
                />
                <span>custom</span>
              </label>
            </div>
          </fieldset>

          <fieldset className="music-question">
            <legend><span>3</span> How should the energy move?</legend>
            <div className="music-energy-grid">
              {energyArcOptions.map((option) => (
                <button
                  key={option.id}
                  className={
                    energyArc === option.id
                      ? "music-choice music-choice-selected"
                      : "music-choice"
                  }
                  type="button"
                  aria-pressed={energyArc === option.id}
                  onClick={() => {
                    setEnergyArc(option.id as EnergyArc);
                    setShuffleSeed(0);
                  }}
                >
                  <strong>{option.label}</strong>
                  <span>{option.description}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <div className="music-refine-row">
            <button
              className="btn btn-ghost"
              type="button"
              aria-expanded={advancedOpen}
              onClick={() => setAdvancedOpen((open) => !open)}
            >
              {advancedOpen ? "Hide fine-tuning" : "Fine-tune this playlist"}
            </button>
            <span>Genre and BPM are optional.</span>
          </div>

          {advancedOpen && (
            <div className="music-advanced-panel">
              <label>
                Genre
                <select value={genre} onChange={(event) => setGenre(event.target.value)}>
                  {genreOptions.map((option) => (
                    <option key={option} value={option}>
                      {option === "all" ? "Mix genres" : option}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                BPM preference
                <select
                  value={bpmRange}
                  onChange={(event) => setBpmRange(event.target.value)}
                >
                  {bpmRanges.map((option) => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </select>
              </label>
              <label>
                Discovery
                <select
                  value={discovery}
                  onChange={(event) => setDiscovery(event.target.value as Discovery)}
                >
                  {discoveryOptions.map((option) => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </select>
              </label>
            </div>
          )}
        </div>

        <div className="music-playlist-card" aria-live="polite">
          <div className="music-playlist-heading">
            <div>
              <span className="eyebrow">Your run soundtrack</span>
              <h2>
                {workoutOptions.find((option) => option.id === workout)?.label}
                {" · "}
                {formatTime(duration)}
              </h2>
            </div>
            <span className="music-live-pill">
              {songStatus === "loading" ? "Refreshing catalog" : playlistTracks.length + " tracks"}
            </span>
          </div>

          <div className="music-phase-bar" aria-hidden="true">
            {playlist.map((phase) => (
              <span
                key={phase.id}
                className={"music-phase-segment music-phase-" + phase.id}
                style={{
                  flexGrow: Math.max(1, phase.tracks.length)
                }}
              >
                {phase.label}
              </span>
            ))}
          </div>

          <div className="music-phase-list">
            {playlist.map((phase) => (
              <section className={"music-phase-block music-phase-block-" + phase.id} key={phase.id}>
                <div className="music-phase-heading">
                  <div>
                    <span>
                      {formatMinuteMark(phase.startMinute)}-
                      {formatMinuteMark(phase.endMinute)} min
                    </span>
                    <h3>{phase.label}</h3>
                  </div>
                  <p>{phase.description}</p>
                </div>
                <ol>
                  {phase.tracks.map((song) => (
                    <li key={song.id}>
                      <span className="music-track-time">
                        {formatMinuteMark(song.startMinute)}
                      </span>
                      <div>
                        <strong>{song.title}</strong>
                        <span>{song.artist}</span>
                      </div>
                      <span className="music-track-bpm">
                        {song.bpm ? song.bpm + " BPM" : song.energy}
                      </span>
                      <a
                        href={spotifyUrl(song)}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={"Open " + song.title + " by " + song.artist + " in Spotify"}
                      >
                        Spotify
                      </a>
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </div>

          <div className="music-playlist-actions">
            <button className="btn btn-primary" type="button" onClick={copyPlaylist}>
              {copyStatus || "Copy full playlist"}
            </button>
            {firstSpotifyTrack && (
              <a
                className="btn btn-secondary"
                href={spotifyUrl(firstSpotifyTrack)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open in Spotify
              </a>
            )}
            <button
              className="btn btn-ghost"
              type="button"
              onClick={() => {
                setShuffleSeed((seed) => seed + 1);
                setCopyStatus("");
              }}
            >
              Give me another mix
            </button>
          </div>

          <div className="music-safety-note">
            Set the playlist before moving. Keep volume low enough to hear traffic,
            race instructions, and other people around you.
          </div>
        </div>
      </section>

      {songStatus === "error" && (
        <div className="container form-message music-load-message">
          The live catalog could not refresh, so the playlist is using the built-in
          starter tracks.
        </div>
      )}

      <section className="container music-browse-toggle">
        <div>
          <span className="eyebrow">Want to choose every track?</span>
          <h2>Browse the full song catalog</h2>
          <p>Search, inspect BPM, and save individual tracks only when you want that control.</p>
        </div>
        <button
          className="btn btn-secondary"
          type="button"
          aria-expanded={catalogOpen}
          onClick={() => setCatalogOpen((open) => !open)}
        >
          {catalogOpen ? "Hide catalog" : "Browse all " + songs.length.toLocaleString() + " tracks"}
        </button>
      </section>

      {catalogOpen && (
        <section className="container music-catalog" aria-labelledby="music-catalog-title">
          <div className="music-catalog-heading">
            <div>
              <h2 id="music-catalog-title">All tracks</h2>
              <p>{catalogSongs.length.toLocaleString()} tracks match these filters.</p>
            </div>
            <button
              className="text-button"
              type="button"
              onClick={() => {
                setCatalogSearch("");
                setCatalogGenre("all");
                setCatalogEnergy("all");
              }}
            >
              Clear filters
            </button>
          </div>

          <div className="music-catalog-filters">
            <label>
              Search
              <input
                type="search"
                value={catalogSearch}
                placeholder="Song or artist"
                onChange={(event) => setCatalogSearch(event.target.value)}
              />
            </label>
            <label>
              Genre
              <select
                value={catalogGenre}
                onChange={(event) => setCatalogGenre(event.target.value)}
              >
                {genreOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === "all" ? "All genres" : option}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Energy
              <select
                value={catalogEnergy}
                onChange={(event) => setCatalogEnergy(event.target.value)}
              >
                <option value="all">All energy levels</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="extreme">Extreme</option>
              </select>
            </label>
          </div>

          <div className="music-catalog-list">
            {(catalogShowAll
              ? catalogSongs
              : catalogSongs.slice(0, maxCatalogResults)
            ).map((song) => (
              <article key={song.id}>
                <div className="music-catalog-title">
                  <strong>{song.title}</strong>
                  <span>{song.artist}</span>
                </div>
                <div className="music-catalog-tags">
                  <span>{song.bpm ? song.bpm + " BPM" : "BPM pending"}</span>
                  <span>{song.energy} energy</span>
                  {song.genre.slice(0, 2).map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
                <div className="music-catalog-actions">
                  <a
                    className="btn btn-xs btn-secondary"
                    href={spotifyUrl(song)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Spotify
                  </a>
                  <SaveButton
                    itemType="song"
                    itemId={song.id}
                    label={song.title + " - " + song.artist}
                    metadata={{ artist: song.artist, bpm: song.bpm }}
                  />
                </div>
              </article>
            ))}
          </div>

          {catalogSongs.length > maxCatalogResults && (
            <button
              className="btn btn-ghost"
              type="button"
              onClick={() => setCatalogShowAll((show) => !show)}
            >
              {catalogShowAll
                ? "Show top tracks"
                : "Show all " + catalogSongs.length.toLocaleString()}
            </button>
          )}
        </section>
      )}

      <section className="container next-step-card music-next-step">
        <div>
          <span className="eyebrow">Going longer?</span>
          <h2>Give the playlist a fuel plan.</h2>
          <p>Turn the same duration into a practical carbohydrate and hydration schedule.</p>
        </div>
        <Link className="btn btn-primary" href="/tools/fueling">
          Plan my fuel
        </Link>
      </section>

      <section className="container music-method-note">
        <strong>The playlist follows the workout, not a universal perfect cadence.</strong>
        <p>
          Workout tags, energy, BPM when available, community preference, and your
          discovery setting shape the order. Track duration is estimated, so use
          Spotify to make final timing adjustments.
        </p>
        <span>
          BPM data includes contributions from{" "}
          <a href="https://getsongbpm.com" target="_blank" rel="noopener noreferrer">
            GetSongBPM
          </a>.
        </span>
      </section>
    </main>
  );
}
