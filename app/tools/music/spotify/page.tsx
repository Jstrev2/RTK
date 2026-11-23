import type { Metadata } from "next";
import SpotifyCallback from "./spotify-callback";

export const metadata: Metadata = {
  title: "Saving to Spotify",
  robots: { index: false, follow: false }
};

export default function Page() {
  return <SpotifyCallback />;
}
