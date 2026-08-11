import Link from "next/link";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "How Runner Toolkit Recommendations Work",
  description: "How Runner Toolkit creates explainable shoe, fuel, and injury-comeback recommendations—and the published research behind the Injury Rescue rules.",
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
    title: "Injury Rescue",
    copy: "A symptom check grades severity from walking tolerance, night pain, bone tenderness, hop tolerance, and how running actually feels. Structured rules then set rest, starting volume, and ramp rate. The schedule explains what changed and why, includes red-flag stops, and does not diagnose or treat a medical condition."
  }
];

const injurySources = [
  {
    area: "Bone stress injuries",
    note: "Rest-first management, graded return, and the hard rule that suspected stress fractures need imaging and clinician-managed timelines draw on Warden, Davis & Fredericson's work on bone stress injuries in runners (JOSPT, 2014) and subsequent return-to-run frameworks."
  },
  {
    area: "Achilles tendinopathy",
    note: "Keeping tolerable load rather than resting completely, with pain kept low and settling by the next morning, follows the pain-monitoring model studied by Silbernagel and colleagues (AJSM, 2007)."
  },
  {
    area: "Patellofemoral pain (runner's knee)",
    note: "Load management plus hip and quad strengthening reflects the JOSPT clinical practice guideline for patellofemoral pain (Willy et al., 2019)."
  },
  {
    area: "Hamstring and calf strains",
    note: "Progressive loading, delayed return to speed work, and re-injury caution follow the rehabilitation progressions described by Heiderscheit and colleagues for hamstring strain injury (JOSPT, 2010)."
  },
  {
    area: "Ankle sprains",
    note: "Early movement over immobilization and balance training to prevent recurrence reflect the international ankle consortium and clinical guideline consensus (Vuurberg et al., BJSM, 2018)."
  },
  {
    area: "Ramp rates and the return itself",
    note: "Conservative weekly volume increases, run-walk re-entry, and cutback logic follow widely used graded-exposure principles in running-injury rehabilitation. Where evidence is uncertain, the rules break toward caution on purpose."
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
        <span className="eyebrow">Where the injury rules come from</span>
        <h2 className="section-title">Conservative, literature-based — not &quot;physio-grade.&quot;</h2>
        <p>
          The Injury Rescue rules are built from published rehabilitation
          research and clinical guidelines, simplified into structured,
          deliberately cautious progressions. They are general information, not
          individualized clinical judgment — which is why red flags stop the
          tool instead of the tool talking past them.
        </p>
        <ul>
          {injurySources.map((source) => (
            <li key={source.area} style={{ marginBottom: "10px" }}>
              <strong>{source.area}.</strong> {source.note}
            </li>
          ))}
        </ul>
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
          practice and adjust. Injury Rescue changes a schedule; it does not
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
