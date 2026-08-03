import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Privacy",
  description:
    "How Runner Toolkit collects, uses, and protects the information you enter — accounts, saved items, payments, and sensitive training details.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <div className="editorial-page">
      <section className="tool-hero container">
        <span className="eyebrow">Privacy</span>
        <h1>Your running information deserves restraint.</h1>
        <p>Last updated July 21, 2026.</p>
      </section>
      <section className="section container prose-block legal-copy">
        <h2>What we collect</h2>
        <p>Runner Toolkit processes the information you enter to create tool results. If you create an account, saved items and plan information may be associated with it. Payment details are handled by the payment provider and are not stored directly by Runner Toolkit.</p>
        <h2>How we use it</h2>
        <p>We use information to provide and improve the tools, save results you request, manage paid access, prevent abuse, and respond to support needs. We do not sell personal health information.</p>
        <h2>Sensitive information</h2>
        <p>Injury, symptom, and training-impact information can be sensitive. Provide only what is needed for the requested schedule preview. Do not use Runner Toolkit for emergency communication or to store medical records.</p>
        <h2>Third parties</h2>
        <p>Service providers may support authentication, data hosting, email, payments, and outbound retailer links. Their own policies govern information they receive. Commercial links are labeled.</p>
        <h2>Your choices</h2>
        <p>You may request access, correction, or deletion by emailing hello@runnertoolkit.com. Legal rights vary by location.</p>
        <p>This page is a plain-language product notice and should be reviewed by qualified privacy counsel before handling sensitive health information at scale.</p>
      </section>
    </div>
  );
}
