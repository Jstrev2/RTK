import type { ReactNode } from "react";
import JsonLd from "@/components/json-ld";
import { pageMetadata, SITE_URL } from "@/lib/seo";

const description =
  "Tell us what you run, the ride and fit you prefer, and your budget. Get a short, explainable list of road running shoes worth trying.";

export const metadata = pageMetadata({
  title: "Running Shoe Finder: Match Shoes to How You Run",
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
