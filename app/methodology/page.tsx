import Link from "next/link";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "How Runner Toolkit Recommendations Work",
  description: "How Runner Toolkit creates explainable shoe, music, fuel, and adaptive training recommendations.",
  path: "/methodology",
});

const methods = [
  {
    number: "01",
    title: "Shoes",
    copy: "We match the intended run, preferred ride, fit and width needs, weekly volume, budget, and known preferences against the current catalog. Retailer relationships do not affect the ranking."
  },
  {
    number: "02",
    title: "Music",
    copy: "We use workout type, energy, genre, and tempo to narrow the catalog. BPM is one useful signal, not a claim that every runner must match every footfall to a beat."
  },
  {
    number: "03",
    title: "Fuel",
    copy: "We turn distance, expected duration, conditions, a user-selected carbohydrate target, and product nutrition data into an adjustable schedule. The output shows ranges and assumptions so it can be practiced."
  },
  {
    number: "04",
    title: "Adaptive Training",
    copy: "Structured rules set the allowable changes to training load and timing. The schedule explains what changed and why, includes red-flag stops, and does not diagnose or treat a medical condition."
  }
];

export default function MethodologyPage() {
  return (
    <div className="editorial-page">
      <section className="tool-hero container">
        <span className="eyebrow">Methodology</span>
        <h1>Recommendations should make sense when you read them.</h1>
        <p>
          Runner Toolkit narrows decisions using the details you provide. We
          show the reasons, assumptions, and tradeoffs instead of hiding behind
          a score.
        </p>
      </section>

      <section className="section container methodology-grid">
        {methods.map((method) => (
          <article key={method.title} className="method-card">
            <span>{method.number}</span>
            <h2>{method.title}</h2>
            <p>{method.copy}</p>
          </article>
        ))}
      </section>

      <section className="section container prose-block">
        <span className="eyebrow">Commercial independence</span>
        <h2 className="section-title">Recommend first. Monetize second.</h2>
        <p>
          Runner Toolkit may earn a commission when a user buys through a shoe
          or fuel link. Availability and commission never improve a product’s
          recommendation. We show multiple retailers when possible and label
          commercial links clearly.
        </p>
        <span className="eyebrow">Important limits</span>
        <h2 className="section-title">A tool is not a fitting, diagnosis, or prescription.</h2>
        <p>
          Shoe results are a shortlist worth trying. Fuel results are a plan to
          practice and adjust. Adaptive Training changes a schedule; it does not
          identify or treat an injury. Seek qualified professional guidance for
          medical concerns, persistent pain, red flags, or individual nutrition needs.
        </p>
        <div className="button-row">
          <Link className="btn btn-primary" href="/#tools">Choose a tool</Link>
          <Link className="btn btn-secondary" href="/about">About Runner Toolkit</Link>
        </div>
      </section>
    </div>
  );
}
