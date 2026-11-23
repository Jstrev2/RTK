import type { ReactNode } from "react";
import JsonLd from "@/components/json-ld";
import { pageMetadata, SITE_URL } from "@/lib/seo";

const description =
  "Pick your race and finish time, from elite to walking pace. See when to take each gel, how many carbs an hour and how many to pack, with real products from every major brand.";

export const metadata = pageMetadata({
  title: "Fuel Finder: When to Take Gels for Your Race",
  description,
  path: "/tools/fueling"
});

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "Fuel Finder",
          url: `${SITE_URL}/tools/fueling`,
          description,
          applicationCategory: "HealthApplication",
          operatingSystem: "Any",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }
        }}
      />
      {children}
    </>
  );
}
