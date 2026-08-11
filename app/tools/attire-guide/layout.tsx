import type { ReactNode } from "react";
import JsonLd from "@/components/json-ld";
import { pageMetadata, SITE_URL } from "@/lib/seo";

const description =
  "What to wear for your run, free: outfit recommendations for any temperature, weather, and training style.";

export const metadata = pageMetadata({
  title: "What to Wear Running: Attire Guide by Temperature",
  description,
  path: "/tools/attire-guide",
});

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "Running Attire Guide",
          url: `${SITE_URL}/tools/attire-guide`,
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
