import type { ReactNode } from "react";
import JsonLd from "@/components/json-ld";
import { pageMetadata, SITE_URL } from "@/lib/seo";

const description =
  "Browse complete free running plans from 5K to marathon. If an injury interrupts the plan, Injury Rescue rebuilds the remaining weeks around a careful return.";

export const metadata = pageMetadata({
  title: "Free Running Training Plans: 5K to Marathon",
  description,
  path: "/tools/training-plans",
});

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "Free Running Training Plans",
          url: `${SITE_URL}/tools/training-plans`,
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
