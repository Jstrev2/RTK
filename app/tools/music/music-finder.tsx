"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { SignupCard } from "@/components/account-gate";
import { useAuth } from "@/components/auth-provider";
import { trackEvent } from "@/lib/analytics";
import { getSupabaseClient } from "@/lib/supabase-client";
import {
  ENERGY_WORDS,
  FEELS,
  GENRES,
  RUN_TYPES,
  buildPlaylist,
  cadenceForPace,
  coverUrl,
  energyForFeel,
  feelForSteps,
  fitOf,
  paceForCadence,
  parsePace,
  scoreSong,
  searchSongs,
  spotifyLink,
  whyItFits,
  type EnergyLevel,
  type Feel,
  type LibSong,
  type PlaylistPhase,
  type RunType,
  type Slot
} from "@/lib/music/shared";
import { startSpotifySave } from "@/lib/music/spotify-export";
import styles from "./finder.module.css";

/* ---------- Icons ---------- */

const Svg = ({ d, fill = false }: { d: string; fill?: boolean }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill={fill ? "currentColor" : "none"} stroke={fill ? "none" : "currentColor"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const PlayIcon = () => <Svg fill d="M8 5.5v13l11-6.5z" />;
const PauseIcon = () => <Svg fill d="M7 5h4v14H7zM13 5h4v14h-4z" />;
const SwapIcon = () => <Svg d="M7 7h11l-3-3M17 17H6l3 3" />;
const CloseIcon = () => <Svg d="M6 6l12 12M18 6L6 18" />;
const OpenIcon = () => <Svg d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />;
const SearchIcon = () => <Svg d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4" />;

/* ---------- State ---------- */

type Inputs = {
  runType: RunType;
  mode: "pace" | "feel";
  pace: string;
  unit: "mi" | "km";
  feel: Feel;
  minutes: number;
  genres: string[];
  nudge: number;
  seed: number;
};

const DEFAULTS: Inputs = { runType: "easy", mode: "feel", pace: "10:00", unit: "mi", feel: "easy", minutes: 30, genres: [], nudge: 0, seed: 1 };
const STORE = "rtk-music-finder-v3";
const LENGTHS = [20, 30, 45, 60, 90, 120];
const RUN_ENERGY: Record<RunType, EnergyLevel> = { easy: 1, long: 1, tempo: 2, intervals: 3, race: 3 };

type SavedPhase = { id: PlaylistPhase["id"]; label: string; note: string; steps: number; tracks: { id: string; slot: Slot; why: string }[] };

const savePhases = (phases: PlaylistPhase[]): SavedPhase[] =>
  phases.map((p) => ({ ...p, tracks: p.tracks.map((t) => ({ id: t.song.id, slot: t.slot, why: t.why })) }));

const loadPhases = (saved: SavedPhase[], byId: Map<string, LibSong>): PlaylistPhase[] =>
  saved.map((p) => ({
    ...p,
    tracks: p.tracks.flatMap((t) => {
      const song = byId.get(t.id);
      return song ? [{ song, slot: t.slot, why: t.why }] : [];
    })
  }));

const ADDED = "rtk-music-added";
const readAdded = (): LibSong[] => {
  try {
    return JSON.parse(localStorage.getItem(ADDED) ?? "[]") as LibSong[];
  } catch {
    return [];
  }
};
const rememberAdded = (song: LibSong) => {
  try {
    localStorage.setItem(ADDED, JSON.stringify([song, ...readAdded().filter((s) => s.id !== song.id)].slice(0, 50)));
  } catch {
    /* storage blocked */
  }
};

const minutesOf = (phases: PlaylistPhase[]) => Math.round(phases.flatMap((p) => p.tracks).reduce((sum, t) => sum + (t.song.len ?? 215), 0) / 60);

type FoundTrack = { source: "spotify" | "deezer"; id: string; title: string; artist: string; album: string; image: string | null; seconds: number; songId: string | null };

/* ---------- Component ---------- */

export default function MusicFinder({ spotifyClientId }: { spotifyClientId: string }) {
  const { user, supabaseAvailable, loading: authLoading } = useAuth();
  const signedIn = Boolean(user) || !supabaseAvailable;

  const [library, setLibrary] = useState<LibSong[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [inputs, setInputs] = useState<Inputs>(DEFAULTS);
  const [phases, setPhases] = useState<PlaylistPhase[]>([]);
  const [ready, setReady] = useState(false);
  const [swap, setSwap] = useState<{ phase: number; index: number } | null>(null);
  const [swapQuery, setSwapQuery] = useState("");
  const [panel, setPanel] = useState<"library" | "spotify" | null>(null);
  const [query, setQuery] = useState("");
  const [spotifyResults, setFoundTracks] = useState<FoundTrack[]>([]);
  const [spotifyBusy, setSpotifyBusy] = useState("");
  const [message, setMessage] = useState("");
  const [playing, setPlaying] = useState<string | null>(null);
  const [mySongs, setMySongs] = useState<string[]>([]);
  const [allGenres, setAllGenres] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);
  const skipBuild = useRef(false);

  const libraryLoaded = library !== null;
  const byId = useMemo(() => new Map((library ?? []).map((s) => [s.id, s])), [library]);

  // Target stride from what the runner told us.
  const paceSeconds = parsePace(inputs.pace);
  const baseSteps =
    inputs.mode === "pace" && paceSeconds ? cadenceForPace(paceSeconds, inputs.unit) : FEELS.find((f) => f.id === inputs.feel)!.steps;
  const steps = Math.max(145, Math.min(195, baseSteps + inputs.nudge));
  const feel = inputs.mode === "pace" ? feelForSteps(steps) : inputs.feel;
  const energy = Math.max(energyForFeel(feel), RUN_ENERGY[inputs.runType]) as EnergyLevel;
  const pace = paceForCadence(steps);

  /* Load the library and whatever the runner had before. */
  useEffect(() => {
    let active = true;
    fetch("/api/music/library")
      .then((r) => r.json())
      .then((data: { songs?: LibSong[] }) => {
        if (!active) return;
        if (!data.songs?.length) setLoadError("The song library didn't load. Refresh to try again.");
        // Songs added here in the last while may not be in the cached library yet.
        const songs = data.songs ?? [];
        const have = new Set(songs.map((s) => s.id));
        setLibrary([...readAdded().filter((s) => !have.has(s.id)), ...songs]);
      })
      .catch(() => active && setLoadError("The song library didn't load. Refresh to try again."));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!library || ready) return;
    const params = new URLSearchParams(window.location.search);
    let next = { ...DEFAULTS };
    let saved: SavedPhase[] | null = null;
    try {
      const raw = localStorage.getItem(STORE);
      if (raw) {
        const parsed = JSON.parse(raw) as { inputs?: Inputs; phases?: SavedPhase[] };
        if (parsed.inputs) next = { ...next, ...parsed.inputs };
        if (parsed.phases) saved = parsed.phases;
      }
    } catch {
      /* storage blocked */
    }
    // Links from the /music pages preset the stride, run or genre.
    const fromLink = ["steps", "pace", "run", "genre", "feel"].some((k) => params.has(k));
    if (fromLink) {
      saved = null;
      const run = params.get("run") as RunType | null;
      if (run && RUN_TYPES.some((r) => r.id === run)) next = { ...next, runType: run, feel: RUN_TYPES.find((r) => r.id === run)!.feel, mode: "feel" };
      const f = params.get("feel") as Feel | null;
      if (f && FEELS.some((x) => x.id === f)) next = { ...next, feel: f, mode: "feel" };
      const p = params.get("pace");
      if (p && parsePace(p)) next = { ...next, mode: "pace", pace: p, unit: params.get("unit") === "km" ? "km" : "mi" };
      const s = Number(params.get("steps"));
      if (s >= 145 && s <= 195) {
        const nearest = FEELS.reduce((best, x) => (Math.abs(x.steps - s) < Math.abs(best.steps - s) ? x : best));
        next = { ...next, mode: "feel", feel: nearest.id, nudge: s - nearest.steps };
      }
      const g = params.get("genre");
      if (g && GENRES.some((x) => x.slug === g)) next = { ...next, genres: [g] };
    }
    if (params.get("export") === "copy") setMessage("Spotify wouldn't take the playlist directly. Copy the links below and paste them into an empty Spotify playlist on a computer (Ctrl+V or Cmd+V), or open each song.");
    if (saved) {
      const restored = loadPhases(saved, new Map(library.map((s) => [s.id, s])));
      if (restored.some((p) => p.tracks.length)) {
        skipBuild.current = true;
        setPhases(restored);
      }
    }
    setInputs(next);
    setReady(true);
  }, [library, ready]);

  /* Rebuild when the run changes. */
  useEffect(() => {
    if (!library || !ready) return;
    if (skipBuild.current) {
      skipBuild.current = false;
      return;
    }
    setPhases(
      buildPlaylist(library, { steps, energy, minutes: inputs.minutes, genres: inputs.genres, runType: inputs.runType, seed: inputs.seed })
    );
    setSwap(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // Rebuild on the run's settings only: a song added to the library must not reshuffle the list.
  }, [libraryLoaded, ready, steps, energy, inputs.minutes, inputs.genres, inputs.runType, inputs.seed]);

  /* Remember the run and the playlist (it has to survive the trip to Spotify). */
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORE, JSON.stringify({ inputs, phases: savePhases(phases) }));
    } catch {
      /* storage blocked */
    }
  }, [inputs, phases, ready]);

  /* Songs this runner added. */
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase || !user) return;
    supabase
      .from("user_songs")
      .select("song_id")
      .order("created_at", { ascending: false })
      .then(({ data }) => setMySongs(((data ?? []) as { song_id: string }[]).map((r) => r.song_id)));
  }, [user]);

  const set = <K extends keyof Inputs>(key: K, value: Inputs[K]) => setInputs((prev) => ({ ...prev, [key]: value }));

  /* ---------- Preview audio ---------- */

  const togglePlay = useCallback(
    (song: LibSong) => {
      if (!song.d) {
        window.open(spotifyLink(song), "_blank", "noopener");
        return;
      }
      if (!audio.current) audio.current = new Audio();
      const player = audio.current;
      if (playing === song.id) {
        player.pause();
        setPlaying(null);
        return;
      }
      player.src = `/api/music/preview/${song.d}`;
      player.onended = () => setPlaying(null);
      player.play().then(
        () => setPlaying(song.id),
        () => setPlaying(null)
      );
      trackEvent("music_preview", { song: song.t });
    },
    [playing]
  );

  useEffect(() => () => audio.current?.pause(), []);

  /* ---------- Edits ---------- */

  const inPlaylist = useMemo(() => new Set(phases.flatMap((p) => p.tracks.map((t) => t.song.id))), [phases]);

  const replaceTrack = (phaseIndex: number, index: number, song: LibSong) => {
    setPhases((prev) =>
      prev.map((p, pi) =>
        pi !== phaseIndex ? p : { ...p, tracks: p.tracks.map((t, ti) => (ti === index ? { song, slot: t.slot, why: whyItFits(song, t.slot) } : t)) }
      )
    );
    setSwap(null);
    setSwapQuery("");
    trackEvent("music_swap", { song: song.t });
  };

  const removeTrack = (phaseIndex: number, index: number) =>
    setPhases((prev) => prev.map((p, pi) => (pi !== phaseIndex ? p : { ...p, tracks: p.tracks.filter((_, ti) => ti !== index) })));

  const addToMain = (song: LibSong) => {
    setPhases((prev) => {
      const target = prev.findIndex((p) => p.id === "main");
      const at = target >= 0 ? target : 0;
      return prev.map((p, pi) => {
        if (pi !== at) return p;
        const slot: Slot = p.tracks[0]?.slot ?? { phase: "main", steps, energy };
        return { ...p, tracks: [...p.tracks, { song, slot, why: whyItFits(song, slot) }] };
      });
    });
    setMessage(`Added "${song.t}" to the main set.`);
  };

  /* Best swaps for one spot: songs on that stride, not already in the list. */
  const swapChoices = (slot: Slot, text: string) => {
    if (!library) return [];
    if (text.trim()) return searchSongs(library, text, slot.steps, 25).filter((s) => !inPlaylist.has(s.id));
    return library
      .map((song) => ({ song, score: inPlaylist.has(song.id) ? null : scoreSong(song, slot, { window: 3, seed: inputs.seed + 7, genres: inputs.genres }) }))
      .filter((x): x is { song: LibSong; score: number } => x.score !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12)
      .map((x) => x.song);
  };

  /* ---------- Add from Spotify ---------- */

  useEffect(() => {
    if (panel !== "spotify" || query.trim().length < 2) {
      setFoundTracks([]);
      return;
    }
    const timer = setTimeout(() => {
      fetch(`/api/music/find?q=${encodeURIComponent(query.trim())}`)
        .then((r) => r.json())
        .then((data: { results?: FoundTrack[] }) => setFoundTracks(data.results ?? []))
        .catch(() => setFoundTracks([]));
    }, 300);
    return () => clearTimeout(timer);
  }, [panel, query]);

  const addFromSpotify = async (result: FoundTrack) => {
    const supabase = getSupabaseClient();
    const session = supabase ? (await supabase.auth.getSession()).data.session : null;
    // Already in the library: drop it in now, and still record it as theirs.
    if (result.songId && byId.has(result.songId)) {
      addToMain(byId.get(result.songId)!);
      if (session) {
        fetch("/api/music/add", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify(result.source === "spotify" ? { spotifyId: result.id } : { deezerId: result.id })
        })
          .then(() => setMySongs((prev) => [result.songId!, ...prev.filter((id) => id !== result.songId)]))
          .catch(() => undefined);
      }
      return;
    }
    if (!session) {
      setMessage("Sign in to add songs.");
      return;
    }
    setSpotifyBusy(result.id);
    setMessage(`Finding the BPM of "${result.title}"...`);
    try {
      const response = await fetch("/api/music/add", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify(result.source === "spotify" ? { spotifyId: result.id } : { deezerId: result.id })
      });
      const data = (await response.json()) as { song?: LibSong; error?: string; source?: string };
      if (!response.ok || !data.song) {
        setMessage(data.error ?? "That song couldn't be added.");
        return;
      }
      const song = data.song;
      setLibrary((prev) => (prev && !prev.some((s) => s.id === song.id) ? [song, ...prev] : prev));
      rememberAdded(song);
      setMySongs((prev) => [song.id, ...prev.filter((id) => id !== song.id)]);
      addToMain(song);
      const fit = fitOf(song, steps);
      setMessage(
        `Added "${song.t}" at ${song.b} BPM${fit ? (fit.off <= 3 ? ", right on your stride." : `, ${fit.off} steps off your stride.`) : ", which doesn't line up with a running stride, but it's yours."}`
      );
      trackEvent("music_add_song", { source: data.source ?? "" });
    } catch {
      setMessage("That song couldn't be added. Try again.");
    } finally {
      setSpotifyBusy("");
    }
  };

  /* ---------- Export ---------- */

  const allTracks = phases.flatMap((p) => p.tracks);
  const playlistName = `${RUN_TYPES.find((r) => r.id === inputs.runType)!.label} · ${steps} steps · Runner Toolkit`;

  const saveToSpotify = async () => {
    const tracks = allTracks.map((t) => ({ id: t.song.s, title: t.song.t, artist: t.song.a }));
    if (!spotifyClientId || !tracks.length) {
      setMessage("Spotify saving isn't available right now. Copy the links instead.");
      return;
    }
    trackEvent("music_spotify_start", { tracks: tracks.length });
    await startSpotifySave(spotifyClientId, {
      name: playlistName,
      description: `${inputs.minutes} minutes at about ${steps} steps a minute. Built at runnertoolkit.com/tools/music`,
      tracks
    });
  };

  const copy = async (kind: "list" | "links") => {
    const text =
      kind === "links"
        ? allTracks.map((t) => spotifyLink(t.song)).join("\n")
        : allTracks.map((t, i) => `${i + 1}. ${t.song.t} - ${t.song.a} (${t.song.b} BPM)`).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setMessage(
        kind === "links"
          ? "Copied. In Spotify on a computer, make a new playlist, click into it and paste (Ctrl+V or Cmd+V): every song drops in."
          : "Copied the song list."
      );
      trackEvent("music_copy", { kind });
    } catch {
      setMessage("Your browser blocked copying. Select the list and copy it by hand.");
    }
  };

  /* ---------- Render ---------- */

  const genreCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of library ?? []) for (const g of s.g) counts.set(g, (counts.get(g) ?? 0) + 1);
    return counts;
  }, [library]);

  // Genres with enough songs to fill a playlist, biggest first.
  const genreChoices = GENRES.filter((g) => (genreCounts.get(g.slug) ?? 0) >= 25).sort((a, b) => (genreCounts.get(b.slug) ?? 0) - (genreCounts.get(a.slug) ?? 0));

  const libraryResults = panel === "library" && library ? searchSongs(library, query, steps, 20) : [];
  const mySongList = mySongs.map((id) => byId.get(id)).filter((s): s is LibSong => Boolean(s));

  const trackRow = (phaseIndex: number, index: number, t: PlaylistPhase["tracks"][number]) => {
    const song = t.song;
    const cover = coverUrl(song.i, 120);
    const isSwap = swap?.phase === phaseIndex && swap.index === index;
    const fit = fitOf(song, t.slot.steps);
    return (
      <li key={song.id + index} className={styles.track}>
        <button
          type="button"
          className={styles.cover}
          onClick={() => togglePlay(song)}
          data-playing={playing === song.id}
          aria-label={playing === song.id ? `Pause ${song.t}` : `Play a preview of ${song.t}`}
        >
          {cover ? <img src={cover} alt="" loading="lazy" width={56} height={56} /> : null}
          <span className={styles.coverPlay}>{playing === song.id ? <PauseIcon /> : <PlayIcon />}</span>
        </button>
        <div className={styles.trackText}>
          <span className={styles.trackTitle}>{song.t}</span>
          <span className={styles.trackArtist}>{song.a}</span>
          <div className={styles.trackMeta}>
            <span className={styles.why}>{t.why}</span>
            <span className="split">
              <b>{song.b}</b> BPM
            </span>
            {fit?.half ? (
              <span className="split">
                <b>{fit.steps}</b> steps
              </span>
            ) : null}
          </div>
        </div>
        <div className={styles.trackActions}>
          <button type="button" className={styles.icon} onClick={() => { setSwap(isSwap ? null : { phase: phaseIndex, index }); setSwapQuery(""); }} aria-label={`Swap ${song.t}`} title="Swap">
            <SwapIcon />
          </button>
          <a className={styles.icon} href={spotifyLink(song)} target="_blank" rel="noreferrer" aria-label={`Open ${song.t} in Spotify`} title="Open in Spotify">
            <OpenIcon />
          </a>
          <button type="button" className={styles.icon} onClick={() => removeTrack(phaseIndex, index)} aria-label={`Remove ${song.t}`} title="Remove">
            <CloseIcon />
          </button>
        </div>
        {isSwap ? (
          <div className={styles.swapPanel}>
            <label className="search-bar">
              <SearchIcon />
              <input
                autoFocus
                value={swapQuery}
                onChange={(e) => setSwapQuery(e.target.value)}
                placeholder="Search our library by song or artist"
                aria-label="Search for a song to swap in"
              />
            </label>
            <p className={styles.hint}>{swapQuery ? "Closest to your stride first." : `Best fits at ${t.slot.steps} steps a minute:`}</p>
            <ul className={styles.picks}>
              {swapChoices(t.slot, swapQuery).map((choice) => (
                <PickRow key={choice.id} song={choice} target={t.slot.steps} onPick={() => replaceTrack(phaseIndex, index, choice)} action="Use" />
              ))}
            </ul>
          </div>
        ) : null}
      </li>
    );
  };

  const phaseBlock = (phase: PlaylistPhase, phaseIndex: number, rows?: number) => (
    <section key={phase.id} className={styles.phase} aria-label={phase.label}>
      <div className={styles.phaseHead}>
        <h3>{phase.label}</h3>
        <span className="split">
          <b>{phase.steps}</b> steps/min
        </span>
        <p>{phase.note}</p>
      </div>
      <ol className={styles.tracks}>{phase.tracks.slice(0, rows ?? phase.tracks.length).map((t, i) => trackRow(phaseIndex, i, t))}</ol>
    </section>
  );

  return (
    <main className="container">
      <header className={styles.hero}>
        <span className="eyebrow">Free tool</span>
        <h1>Music Finder</h1>
        <p className="page-hero-sub">Tell us the run. We&apos;ll find songs whose beat lands on your stride, with cover art, previews and a one-tap save to Spotify.</p>
        <p className={styles.hint}>
          Or <Link href="/music" className="text-link">browse every song by pace, run and genre</Link>.
        </p>
      </header>

      <div className={styles.layout}>
        <aside className={`panel ${styles.controls}`} aria-label="Your run">
          <div className={styles.group}>
            <span className="label">What run?</span>
            <div className="chips">
              {RUN_TYPES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className="chip"
                  aria-pressed={inputs.runType === r.id}
                  onClick={() => setInputs((prev) => ({ ...prev, runType: r.id, feel: prev.mode === "feel" ? r.feel : prev.feel, nudge: 0 }))}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.group}>
            <div className={styles.groupHead}>
              <span className="label">How fast?</span>
              <div className={styles.segment} role="group" aria-label="Pace or feel">
                <button type="button" aria-pressed={inputs.mode === "feel"} onClick={() => setInputs((p) => ({ ...p, mode: "feel", nudge: 0 }))}>
                  By feel
                </button>
                <button type="button" aria-pressed={inputs.mode === "pace"} onClick={() => setInputs((p) => ({ ...p, mode: "pace", nudge: 0 }))}>
                  My pace
                </button>
              </div>
            </div>
            {inputs.mode === "feel" ? (
              <div className={styles.feels}>
                {FEELS.map((f) => (
                  <button key={f.id} type="button" className={styles.feel} aria-pressed={inputs.feel === f.id} onClick={() => setInputs((p) => ({ ...p, feel: f.id, nudge: 0 }))}>
                    <strong>{f.label}</strong>
                    <span>{f.note}</span>
                  </button>
                ))}
              </div>
            ) : (
              <>
                <div className={styles.paceRow}>
                  <input
                    className="input"
                    inputMode="numeric"
                    value={inputs.pace}
                    onChange={(e) => setInputs((p) => ({ ...p, pace: e.target.value, nudge: 0 }))}
                    aria-label="Usual pace, minutes:seconds"
                    placeholder="10:00"
                  />
                  <div className={styles.segment} role="group" aria-label="Unit">
                    <button type="button" aria-pressed={inputs.unit === "mi"} onClick={() => set("unit", "mi")}>
                      per mile
                    </button>
                    <button type="button" aria-pressed={inputs.unit === "km"} onClick={() => set("unit", "km")}>
                      per km
                    </button>
                  </div>
                </div>
                <p className={styles.hint}>{paceSeconds ? "Your usual pace for this run. Rough is fine." : "Type it like 9:30."}</p>
              </>
            )}
          </div>

          <div className={styles.stride} aria-live="polite">
            <span className={styles.strideNumber}>{steps}</span>
            <span className={styles.strideText}>
              <b>steps a minute</b>, about where most runners land{inputs.mode === "feel" && pace ? ` at ${pace.mile} a mile` : ""}. Songs at <b>{steps}</b> or <b>{Math.round(steps / 2)}</b> BPM fit.
            </span>
            <span className={styles.nudge}>
              <button type="button" onClick={() => set("nudge", inputs.nudge + 3)} aria-label="Faster songs" title="Faster songs">
                +
              </button>
              <button type="button" onClick={() => set("nudge", inputs.nudge - 3)} aria-label="Slower songs" title="Slower songs">
                −
              </button>
            </span>
          </div>

          <div className={styles.group}>
            <span className="label">How long?</span>
            <div className="chips">
              {LENGTHS.map((m) => (
                <button key={m} type="button" className="chip" aria-pressed={inputs.minutes === m} onClick={() => set("minutes", m)}>
                  {m < 60 ? `${m} min` : `${m / 60} hr`}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.group}>
            <div className={styles.groupHead}>
              <span className="label">Genres</span>
              <span className={styles.hint}>{inputs.genres.length ? <button type="button" className="text-button" onClick={() => set("genres", [])}>Any genre</button> : "Optional"}</span>
            </div>
            <div className="chips">
              {genreChoices.filter((g, i) => allGenres || i < 6 || inputs.genres.includes(g.slug)).map((g) => (
                <button
                  key={g.slug}
                  type="button"
                  className="chip"
                  aria-pressed={inputs.genres.includes(g.slug)}
                  onClick={() => set("genres", inputs.genres.includes(g.slug) ? inputs.genres.filter((x) => x !== g.slug) : [...inputs.genres, g.slug])}
                >
                  {g.label}
                </button>
              ))}
              {!allGenres && genreChoices.length > 6 ? (
                <button type="button" className="chip" onClick={() => setAllGenres(true)}>
                  +{genreChoices.length - 6} more
                </button>
              ) : null}
            </div>
          </div>
        </aside>

        <section aria-label="Your playlist">
          <div className={styles.listHead}>
            <h2>Your playlist</h2>
            <div className={styles.listStats}>
              <span className="split">
                <b>{allTracks.length}</b> songs
              </span>
              <span className="split">
                <b>{minutesOf(phases)}</b> min
              </span>
              <span className="split">
                <b>{ENERGY_WORDS[energy]}</b> energy
              </span>
            </div>
          </div>

          <div className={styles.actions}>
            <button type="button" className="btn btn-sm" onClick={() => set("seed", inputs.seed + 1)} disabled={!library}>
              New mix
            </button>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => { setPanel(panel === "library" ? null : "library"); setQuery(""); }} aria-expanded={panel === "library"}>
              Find a song
            </button>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => { setPanel(panel === "spotify" ? null : "spotify"); setQuery(""); }} aria-expanded={panel === "spotify"}>
              Add any song
            </button>
          </div>

          {panel ? (
            <div className={styles.addPanel}>
              <h3>{panel === "library" ? "Search our library" : "Add any song"}</h3>
              {panel === "spotify" && !user && supabaseAvailable ? (
                <SignupCard unlocks="add your own songs" tool="music" />
              ) : (
                <>
                  <label className="search-bar">
                    <SearchIcon />
                    <input
                      autoFocus
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={panel === "library" ? `Search ${library ? library.length.toLocaleString() : ""} songs by title or artist` : "Search any song, artist or album"}
                      aria-label={panel === "library" ? "Search our song library" : "Search any song"}
                    />
                  </label>
                  {panel === "spotify" ? (
                    <p className={styles.hint}>We read its BPM (GetSongBPM, or the beat of its preview), add it to the library and drop it in your playlist.</p>
                  ) : null}
                  {panel === "library" && !query && mySongList.length ? (
                    <>
                      <p className={styles.hint}>Songs you added:</p>
                      <ul className={styles.picks}>
                        {mySongList.slice(0, 8).map((s) => (
                          <PickRow key={s.id} song={s} target={steps} onPick={() => addToMain(s)} action="Add" disabled={inPlaylist.has(s.id)} />
                        ))}
                      </ul>
                    </>
                  ) : null}
                  <ul className={styles.picks}>
                    {panel === "library"
                      ? libraryResults.map((s) => <PickRow key={s.id} song={s} target={steps} onPick={() => addToMain(s)} action="Add" disabled={inPlaylist.has(s.id)} />)
                      : spotifyResults.map((r) => (
                          <li key={r.source + r.id} className={styles.pick}>
                            {r.image ? <img src={r.image} alt="" loading="lazy" /> : <span className={styles.noCover} />}
                            <span className={styles.pickText}>
                              <b>{r.title}</b>
                              <span>{r.artist}</span>
                            </span>
                            <button type="button" className="btn btn-sm btn-flare" disabled={Boolean(spotifyBusy)} onClick={() => addFromSpotify(r)}>
                              {spotifyBusy === r.id ? "Reading..." : "Add"}
                            </button>
                          </li>
                        ))}
                  </ul>
                  {panel === "library" && query && !libraryResults.length ? (
                    <p className={styles.hint}>
                      Not in our library yet.{" "}
                      <button type="button" className="text-button" onClick={() => setPanel("spotify")}>
                        Add it from the full catalog
                      </button>
                    </p>
                  ) : null}
                </>
              )}
            </div>
          ) : null}

          {message ? <p className={`form-message ${styles.message}`}>{message}</p> : null}
          {loadError ? <p className="empty">{loadError}</p> : null}

          {!library && !loadError ? (
            <div className={styles.tracks} aria-busy="true">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className={styles.skeleton} />
              ))}
            </div>
          ) : null}

          {library && phases.length ? (
            signedIn ? (
              <>
                {phases.map((phase, i) => phaseBlock(phase, i))}
                <div className="panel-dark">
                  <h3>Take it with you</h3>
                  <div className={styles.actions} style={{ marginBottom: 0 }}>
                    <button type="button" className="btn btn-volt" onClick={saveToSpotify}>
                      Save to Spotify
                    </button>
                    <button type="button" className="btn btn-ghost" style={{ color: "#fff", borderColor: "#fff" }} onClick={() => copy("links")}>
                      Copy Spotify links
                    </button>
                    <button type="button" className="btn btn-ghost" style={{ color: "#fff", borderColor: "#fff" }} onClick={() => copy("list")}>
                      Copy song list
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                {phaseBlock(phases[0], 0)}
                {phases[1] ? <div className={styles.teaser}>{phaseBlock(phases[1], 1, 2)}</div> : null}
                <div className="wall">
                  {authLoading ? <div className="account-gate account-gate-loading" aria-busy="true" /> : <SignupCard unlocks={`the other ${allTracks.length - phases[0].tracks.length} songs and save them to Spotify`} tool="music" />}
                </div>
              </>
            )
          ) : null}

          <p className={styles.credit}>
            BPM from <a href="https://getsongbpm.com" target="_blank" rel="noreferrer">GetSongBPM</a> where it knows the song, otherwise read from the beat of the song&apos;s preview. Covers and previews from Deezer.
          </p>
          <details className="fineprint">
            <summary>How this works</summary>
            <p>
              Your pace or effort sets a step rate (about 162 steps a minute at 10:00 a mile, a little higher as you speed up). Songs fit when
              their beat lands on that rate, or every other step for half-time songs. Use + and − if the songs feel rushed or sluggish: everyone&apos;s
              stride is a few steps different.
            </p>
            <p>The warm-up runs a touch slower and calmer, the finish saves the loudest songs. No more than two songs by one artist.</p>
          </details>
        </section>
      </div>
    </main>
  );
}

function PickRow({ song, target, onPick, action, disabled }: { song: LibSong; target: number; onPick: () => void; action: string; disabled?: boolean }) {
  const fit = fitOf(song, target);
  const cover = coverUrl(song.i, 120);
  return (
    <li className={styles.pick}>
      {cover ? <img src={cover} alt="" loading="lazy" width={40} height={40} /> : <span className={styles.noCover} />}
      <span className={styles.pickText}>
        <b>{song.t}</b>
        <span>
          {song.a} · {song.b} BPM · {fit ? (fit.off <= 3 ? "fits" : `${fit.off} steps off`) : "off stride"}
        </span>
      </span>
      <button type="button" className="btn btn-sm" onClick={onPick} disabled={disabled}>
        {disabled ? "In list" : action}
      </button>
    </li>
  );
}
