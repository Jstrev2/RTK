import type { ReactNode } from "react";
import JsonLd from "@/components/json-ld";
import { pageMetadata, SITE_URL } from "@/lib/seo";

const description =
  "Choose the workout, duration, and energy arc to build a phased running playlist from warm-up through the final push.";

export const metadata = pageMetadata({
  title: "Running Playlist Builder: Music Matched to Your Workout",
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
          name: "Running Playlist Builder",
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
