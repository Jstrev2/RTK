import type { ReactNode } from "react";
import JsonLd from "@/components/json-ld";
import { pageMetadata, SITE_URL } from "@/lib/seo";

const description =
  "Three taps: what you run, how it should feel and what your feet need. Get your top 3 road running shoes, with photos and one plain reason each.";

export const metadata = pageMetadata({
  title: "Running Shoe Finder: Your Top 3 Shoes in Three Taps",
  description,
  path: "/tools/shoe-selector",
});

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "Running Shoe Finder",
          url: `${SITE_URL}/tools/shoe-selector`,
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
