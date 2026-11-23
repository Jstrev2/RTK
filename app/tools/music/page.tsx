import MusicFinder from "./music-finder";

/* The Music Finder. The Spotify client id is public (it appears in Spotify's own sign-in link). */
export default function Page() {
  return <MusicFinder spotifyClientId={process.env.SPOTIFY_CLIENT_ID ?? ""} />;
}
