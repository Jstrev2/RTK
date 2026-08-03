import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Terms and Important Limitations",
  description:
    "The terms that govern Runner Toolkit's free tools and paid features, including medical, affiliate, and product-information limitations.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <div className="editorial-page">
      <section className="tool-hero container">
        <span className="eyebrow">Terms and limitations</span>
        <h1>Useful tools with clear boundaries.</h1>
        <p>Last updated July 21, 2026.</p>
      </section>
      <section className="section container prose-block legal-copy">
        <h2>General information</h2>
        <p>Runner Toolkit provides general educational and planning tools. Results depend on the information supplied and may be incomplete or unsuitable for an individual situation.</p>
        <h2>Not medical advice</h2>
        <p>Runner Toolkit does not diagnose, treat, cure, or prevent any condition and is not a substitute for a physician, physical therapist, registered dietitian, coach, or other qualified professional. Stop and seek appropriate help for urgent symptoms, red flags, persistent pain, or worsening symptoms.</p>
        <h2>Product and retailer information</h2>
        <p>Prices, availability, nutrition values, specifications, and product details can change. Confirm material information with the manufacturer or retailer before relying on it.</p>
        <h2>Affiliate disclosure</h2>
        <p>Runner Toolkit may earn a commission from qualifying purchases through labeled commercial links. That relationship does not change the price paid or the recommendation methodology.</p>
        <h2>Paid access</h2>
        <p>Paid features, billing intervals, renewals, and cancellation terms are shown at checkout. Contact hello@runnertoolkit.com for billing support.</p>
        <p>These terms require review by qualified counsel before commercial launch and are not a substitute for jurisdiction-specific legal terms.</p>
      </section>
    </div>
  );
}
