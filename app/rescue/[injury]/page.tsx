import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/json-ld";
import { pageMetadata, SITE_URL } from "@/lib/seo";
import {
  getInjuryBySlug,
  injuries,
  injurySlug,
  INJURY_PHRASES,
  MEDICAL_DISCLAIMER,
  type Injury
} from "@/lib/injuries";
import { SAMPLE_DESCRIPTION, sampleSchedule, severityRows, type SeverityRow } from "@/lib/injury-pages";

// One page per injury profile, fully static: the numbers come from the
// calculator engine at build time, so there is nothing to keep up to date.
export const dynamicParams = false;

export function generateStaticParams() {
  return injuries.map((injury) => ({ injury: injurySlug(injury.id) }));
}

type Props = { params: Promise<{ injury: string }> };

const plural = (count: number, unit: string) => `${count} ${unit}${count === 1 ? "" : "s"}`;

const shortName = (injury: Injury) => injury.name.replace(/ \(.*\)$/, "");

function buildFaq(injury: Injury, rows: SeverityRow[]) {
  const { phrase } = INJURY_PHRASES[injury.id];
  const [mild, moderate, severe] = rows;
  const firstSwap = injury.crossTraining[0].toLowerCase();

  if (injury.requiresMedicalClearance) {
    return [
      {
        q: `Can I still run my race with ${phrase}?`,
        a: `Not on a plan you manage yourself. A suspected or confirmed stress fracture needs imaging and a clinician-run timeline, and our calculator never green-lights a race on one. If the date is close, the realistic options are deferring your entry or picking a later race.`
      },
      {
        q: `How long am I off running with ${phrase}?`,
        a: `Our template starts at ${mild.restDays} days with no impact and stretches to ${severe.restDays} for a severe case, followed by ${mild.returnWeeks} to ${severe.returnWeeks} weeks of graded return. The real number depends on which bone it is and what the imaging shows, so your clinician's timeline wins over ours.`
      },
      {
        q: "What can I do to keep fitness while it heals?",
        a: `Whatever you're cleared for. ${injury.crossTraining[0]} is the usual starting point, then ${injury.crossTraining.slice(1).join(" and ").toLowerCase()}. Eat enough: bone healing is hungry, and under-fueling slows it.`
      },
      {
        q: "When is it urgent?",
        a: injury.redFlags
      }
    ];
  }

  return [
    {
      q: `Can I still run a marathon with ${phrase}?`,
      a: `Often, yes. What decides it is runway: about ${plural(mild.minWeeks ?? 0, "week")} before race day for a mild case, ${mild.minWeeks === moderate.minWeeks ? "the same" : plural(moderate.minWeeks ?? 0, "week")} for a moderate one, and ${plural(severe.minWeeks ?? 0, "week")} when it's severe. The same counts apply to a half marathon or a 10K. With less time than that, a shorter distance or a later race is the better call.`
    },
    {
      q: `How long should I stop running with ${phrase}?`,
      a: `On our conservative timeline: ${plural(mild.restDays, "day")} for a mild case, ${plural(moderate.restDays, "day")} for a moderate one, ${plural(severe.restDays, "day")} when it's severe. That's time off running, not time off training: the first-choice swap is ${firstSwap}.`
    },
    {
      q: "When can I do speed work and long runs again?",
      a: `Later than you'd like. In a moderate case, speed work stays out for the first ${plural(moderate.speedAfterWeeks, "week")} of the return and full-length long runs for the first ${plural(moderate.longRunAfterWeeks, "week")}. Easy miles come back first, starting near ${moderate.startPercent}% of your old weekly volume.`
    },
    {
      q: "How much slower will I race?",
      a:
        moderate.paceCost === mild.paceCost
          ? `Plan on roughly ${mild.paceCost} seconds per mile off your original goal after a mild or moderate case, and about ${severe.paceCost} after a severe one. It's an estimate built from the time off, so let your first few easy runs correct it.`
          : `Plan on roughly ${moderate.paceCost} seconds per mile off your original goal after a moderate case and about ${mild.paceCost} after a mild one. It's an estimate built from the time off, so let your first few easy runs correct it.`
    },
    {
      q: "When should I get it looked at?",
      a: injury.redFlags
    }
  ];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { injury: slug } = await params;
  const injury = getInjuryBySlug(slug);
  if (!injury) return {};
  const { phrase, title } = INJURY_PHRASES[injury.id];
  return pageMetadata({
    title: `Can I Run My Race With ${title}? Comeback Timeline`,
    description: injury.requiresMedicalClearance
      ? `Why ${phrase} takes the race decision out of your hands, what a typical return to running looks like, and what to ask your clinician. Free comeback calculator.`
      : `How long to stop running with ${phrase}, how many weeks you need before race day, and a week-by-week return-to-running schedule. Free calculator for your own timeline.`,
    path: `/rescue/${injurySlug(injury.id)}`
  });
}

export default async function InjuryPage({ params }: Props) {
  const { injury: slug } = await params;
  const injury = getInjuryBySlug(slug);
  if (!injury) notFound();

  const { phrase, alias } = INJURY_PHRASES[injury.id];
  const rows = severityRows(injury);
  const [mild, , severe] = rows;
  const sample = sampleSchedule(injury);
  const faq = buildFaq(injury, rows);
  const path = `/rescue/${injurySlug(injury.id)}`;
  const calculatorHref = `/rescue?injury=${injurySlug(injury.id)}`;
  const gated = Boolean(injury.requiresMedicalClearance);

  return (
    <div className="tool-page tool-page-training">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Runner Toolkit", item: SITE_URL },
                { "@type": "ListItem", position: 2, name: "Injury Rescue", item: `${SITE_URL}/rescue` },
                { "@type": "ListItem", position: 3, name: shortName(injury), item: `${SITE_URL}${path}` }
              ]
            },
            {
              "@type": "FAQPage",
              mainEntity: faq.map((item) => ({
                "@type": "Question",
                name: item.q,
                acceptedAnswer: { "@type": "Answer", text: item.a }
              }))
            }
          ]
        }}
      />

      <section className="tool-hero container">
        <span className="eyebrow">
          <Link href="/rescue">Injury Rescue</Link> · {shortName(injury)}
        </span>
        <h1>Can I still run my race with {phrase}?</h1>
        <p>
          {injury.summary}
          {alias ? ` Also called ${alias}.` : ""}
        </p>
        <p>
          {gated
            ? "This is the one injury where the answer isn't about your training plan. It needs a diagnosis first."
            : "Whether your race survives it comes down to two things: how irritated it is today, and how many weeks you have left."}
        </p>
        <div className="button-row">
          <Link className="btn btn-primary" href={calculatorHref}>
            Check my race (free)
          </Link>
          <Link className="btn btn-secondary" href="/methodology">
            Where the numbers come from
          </Link>
        </div>
      </section>

      <section className="section container">
        <div className="stack" style={{ gap: "18px" }}>
          <h2 className="section-title">
            {gated
              ? "A stress fracture takes the race decision out of your hands"
              : `A mild case needs ${plural(mild.minWeeks ?? 0, "week")} of runway. A severe one needs ${severe.minWeeks ?? 0}.`}
          </h2>
          <p className="section-lede">
            {gated
              ? "The calculator never green-lights a race on a suspected or confirmed stress fracture. Running on one is how a six-week problem becomes a six-month one. What we can show you is the shape of a typical return, so you know what to ask about."
              : "Runway is whole weeks from today through race week, counted the way the calculator counts them: time off running, a graded return, then race week itself. With less than that, a shorter distance or a later race is the better call."}
          </p>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Grade</th>
                  <th>What it looks like</th>
                  <th>Off running</th>
                  <th>Graded return</th>
                  <th>Runway to race day</th>
                  <th>Rough pace cost</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.severity}>
                    <td><strong>{row.label}</strong></td>
                    <td>{row.looksLike}</td>
                    <td>{plural(row.restDays, "day")}</td>
                    <td>{plural(row.returnWeeks, "week")}, starting near {row.startPercent}% of your old volume</td>
                    <td>{row.minWeeks === null ? "Medical clearance first" : plural(row.minWeeks, "week")}</td>
                    <td>{gated ? "Set by your clinician" : `About ${row.paceCost} sec per mile`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="brand-sub">
            {gated
              ? "These are template numbers for the conversation with your clinician, not a schedule to start on your own."
              : "You don't pick the grade yourself. The calculator's six-question symptom check sorts you into one. The pace column is the rough price of the time off against your original goal, in seconds per mile."}
          </p>
        </div>
      </section>

      {sample ? (
        <section className="section container">
          <div className="stack" style={{ gap: "18px" }}>
            <h2 className="section-title">
              {sample.canRace
                ? `Ten weeks out, a moderate case costs you ${plural(sample.weeksBeforeRebuild, "week")} of normal training, not the race`
                : "Ten weeks out, the honest schedule is recovery, not a race"}
            </h2>
            <p className="section-lede">
              This is the calculator&apos;s real output for one runner: {SAMPLE_DESCRIPTION}, graded moderate. Your numbers will move it.
            </p>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Week</th>
                    <th>Phase</th>
                    <th>Running miles</th>
                    <th>Sessions</th>
                  </tr>
                </thead>
                <tbody>
                  {sample.weeks.map((week) => (
                    <tr key={week.weekNumber}>
                      <td><strong>{week.weekNumber}</strong></td>
                      <td>{week.phaseLabel}</td>
                      <td>{week.phase === "rest" ? "0" : week.hasRace ? `${week.miles} + race` : week.miles}</td>
                      <td>{week.sessions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="button-row">
              <Link className="btn btn-primary" href={calculatorHref}>
                Rebuild my own weeks
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      <section className="section container">
        <div className="stack" style={{ gap: "18px" }}>
          <h2 className="section-title">Time off running isn&apos;t time off training</h2>
          <div className="card card-outline">
            <div className="stack">
              <div className="grid grid-2">
                <div>
                  <span className="label">Skip for now</span>
                  <ul className="list">
                    {injury.avoid.map((item) => (
                      <li key={item} className="brand-sub">✗ {item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="label">Usually still workable</span>
                  <ul className="list">
                    {injury.safe.map((item) => (
                      <li key={item} className="brand-sub">✓ {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div>
                <span className="label">Cross-training, most useful first</span>
                <div className="tag-grid">
                  {injury.crossTraining.map((item) => (
                    <span key={item} className="tag">{item}</span>
                  ))}
                </div>
              </div>
              <div className="notice">
                <strong>See a professional if:</strong> {injury.redFlags}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section container prose-block">
        <h2>Questions runners ask about {phrase}</h2>
        {faq.map((item) => (
          <div key={item.q}>
            <h3>{item.q}</h3>
            <p>{item.a}</p>
          </div>
        ))}
      </section>

      <section className="section container">
        <div className="stack">
          <span className="label">Other injuries</span>
          <div className="tag-grid">
            {injuries
              .filter((other) => other.id !== injury.id)
              .map((other) => (
                <Link key={other.id} className="tag" href={`/rescue/${injurySlug(other.id)}`}>
                  {shortName(other)}
                </Link>
              ))}
          </div>
          <p className="brand-sub">{MEDICAL_DISCLAIMER}</p>
          <Link className="text-link" href="/methodology">
            How the comeback schedule is built: sources and methodology →
          </Link>
        </div>
      </section>
    </div>
  );
}
