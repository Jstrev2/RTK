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
    <div className="tool-page tool-page-training">
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
      {/* Hero and explainer live server-side so the page's h1 and pitch are
          in the static HTML; only the interactive calculator hydrates behind
          the useSearchParams Suspense boundary. */}
      <section className="tool-hero container">
        <span className="eyebrow">Free comeback calculator</span>
        <h1>Can I still make my race?</h1>
        <p>
          Injured mid-training? Answer the questions a professional would ask,
          describe the plan you were following — any plan, not just ours — and
          get an honest verdict on race day, with a rebuilt schedule to get you
          back to the start line.
        </p>
      </section>

      <RescueClient />

      <section className="section container prose-block">
        <h2>How the verdict works</h2>
        <p>
          The symptom check grades how irritated the tissue is — walking
          tolerance, night pain, bone tenderness, hop tolerance, and how running
          actually feels. That grade sets the rest period, the starting volume,
          and how fast the rebuild is allowed to ramp. Then we lay that timeline
          against the weeks you have left: if there&apos;s room to rest, rebuild,
          and still taper, your race is on. If there isn&apos;t, we say so — and
          show you what the honest alternative looks like.
        </p>
        <h2>It works with any plan</h2>
        <p>
          We don&apos;t need your PDF. Six numbers — distance, weeks to race,
          runs per week, recent mileage, peak week, long-run day — describe a
          plan&apos;s shape well enough to rebuild the remaining weeks around
          your recovery. Higdon, Garmin, Runna, your coach&apos;s spreadsheet:
          if you can describe it, we can rebuild it.
        </p>
        <h2>Deliberately conservative</h2>
        <p>
          Ties break toward caution. Bone-stress patterns escalate to imaging
          instead of a training plan. Some answers end with &quot;see a
          professional first&quot; — that refusal is part of the product, not a
          bug. The goal isn&apos;t to get you to the start line at any cost;
          it&apos;s to get you there ready to run.
        </p>
      </section>
    </div>
  );
}
