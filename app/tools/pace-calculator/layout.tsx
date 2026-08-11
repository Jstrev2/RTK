import type { ReactNode } from "react";
import JsonLd from "@/components/json-ld";
import { pageMetadata, SITE_URL } from "@/lib/seo";

const description =
  "Calculate running pace, predict finish times, and get mile-by-mile splits for 5K, 10K, half marathon, marathon, and ultras. Free, no account needed.";

export const metadata = pageMetadata({
  title: "Running Pace Calculator: Race Times & Mile Splits",
  description,
  path: "/tools/pace-calculator",
});

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "Running Pace Calculator",
          url: `${SITE_URL}/tools/pace-calculator`,
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
