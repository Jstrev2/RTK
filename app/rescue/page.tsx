import JsonLd from "@/components/json-ld";
import { pageMetadata } from "@/lib/seo";
import RescueClient from "./rescue-client";

export const metadata = pageMetadata({
  title: "Can I Still Make My Race? Free Injury Comeback Calculator",
  description:
    "Injured mid-training? Answer a short symptom check and get an honest verdict on your race — plus a rebuilt week-by-week comeback schedule that works with any training plan.",
  path: "/rescue"
});

export default function RescuePage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "Runner Toolkit Injury Rescue",
          url: "https://runnertoolkit.com/rescue",
          applicationCategory: "HealthApplication",
          operatingSystem: "Web",
          description:
            "A conservative, literature-based calculator that tells injured runners whether their goal race is still realistic and rebuilds the remaining weeks of any training plan around a graded return to running.",
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
            description: "Free race verdict and symptom check"
          }
        }}
      />
      <RescueClient />
    </>
  );
}
