"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { finishSpotifySave, SpotifyRefused, type SaveResult } from "@/lib/music/spotify-export";
import { trackEvent } from "@/lib/analytics";

type State = { kind: "working" } | { kind: "done"; result: SaveResult } | { kind: "refused" } | { kind: "error"; message: string };

export default function SpotifyCallback() {
  const [state, setState] = useState<State>({ kind: "working" });
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    finishSpotifySave(new URLSearchParams(window.location.search))
      .then((result) => {
        setState({ kind: "done", result });
        trackEvent("music_spotify_saved", { tracks: result.added });
      })
      .catch((error: unknown) => {
        if (error instanceof SpotifyRefused) setState({ kind: "refused" });
        else setState({ kind: "error", message: (error as Error).message });
      });
  }, []);

  return (
    <main className="container" style={{ padding: "64px 0 96px", maxWidth: 720 }}>
      <span className="eyebrow">Music Finder</span>
      {state.kind === "working" && (
        <>
          <h1>Saving to Spotify...</h1>
          <p className="page-hero-sub">Making the playlist and adding your songs. This takes a few seconds.</p>
        </>
      )}
      {state.kind === "done" && (
        <>
          <h1>It&apos;s in your Spotify.</h1>
          <p className="page-hero-sub">
            &quot;{state.result.name}&quot; is saved as a private playlist with {state.result.added} songs.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a className="btn btn-flare" href={state.result.url} target="_blank" rel="noreferrer">
              Open in Spotify
            </a>
            <Link className="btn btn-ghost" href="/tools/music">
              Back to the Music Finder
            </Link>
          </div>
        </>
      )}
      {state.kind === "refused" && (
        <>
          <h1>Spotify said not yet.</h1>
          <p className="page-hero-sub">
            Spotify only lets a short list of accounts use new apps while they wait for review, and yours isn&apos;t on it yet. Your
            playlist is still there: copy the links and paste them into an empty Spotify playlist on a computer, or open each song.
          </p>
          <Link className="btn btn-flare" href="/tools/music?export=copy">
            Back to my playlist
          </Link>
        </>
      )}
      {state.kind === "error" && (
        <>
          <h1>That didn&apos;t work.</h1>
          <p className="page-hero-sub">{state.message}</p>
          <Link className="btn btn-flare" href="/tools/music?export=copy">
            Back to my playlist
          </Link>
        </>
      )}
    </main>
  );
}
