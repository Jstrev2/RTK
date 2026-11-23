import type { ReactNode } from "react";
import JsonLd from "@/components/json-ld";
import { pageMetadata, SITE_URL } from "@/lib/seo";

const description =
  "Pick the run and how hard it feels (or your pace). Get a playlist of popular songs whose beat matches your stride, with previews, swaps, any song you add, and a save to Spotify.";

export const metadata = pageMetadata({
  title: "Music Finder: Running Playlists Matched to Your Stride",
  description,
  path: "/tools/music",
});

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "Music Finder",
          url: `${SITE_URL}/tools/music`,
          description,
          applicationCategory: "HealthApplication",
          operatingSystem: "Any",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        }}
      />
      {children}
    </>
  );
}
