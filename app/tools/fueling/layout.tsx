import type { ReactNode } from "react";
import JsonLd from "@/components/json-ld";
import { pageMetadata, SITE_URL } from "@/lib/seo";

const description =
  "Turn distance, expected time, and conditions into a practical carbohydrate schedule, hydration starting point, and short list of products to practice.";

export const metadata = pageMetadata({
  title: "Race Fuel Planner — Running Gel & Carb Schedule Calculator",
  description,
  path: "/tools/fueling",
});

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "Race Fuel Planner",
          url: `${SITE_URL}/tools/fueling`,
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
