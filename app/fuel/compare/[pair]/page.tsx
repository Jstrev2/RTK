import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { pageMetadata } from "@/lib/seo";
import {
  HALF,
  MARATHON,
  comparePairs,
  collectionsFor,
  getFuelGels,
  listJoin,
  neighboursOf,
  nonCarbCalories,
  pairSlug,
  parsePairSlug,
  planFor,
  ratePerHour,
  siblingOf,
  type Gel
} from "@/lib/content/fuel";
import { Crumbs, Faq, FuelJsonLd, PlannerCta, type FaqItem } from "../../_ui/fuel-ui";
import FuelBuyLinks from "../../_ui/fuel-buy-links";
import styles from "../../fuel.module.css";

export const revalidate = 86400;
export const dynamicParams = true;

export async function generateStaticParams(): Promise<{ pair: string }[]> {
  return [];
}

type Params = { params: Promise<{ pair: string }> };

const unitOf = (gel: Gel) => (gel.format === "chews" ? "package" : "packet");

/** Resolve a pair slug: the pair, the canonical slug, or null for a 404. */
const resolvePair = async (slug: string) => {
  const parsed = parsePairSlug(slug);
  if (!parsed) return null;
  const gels = await getFuelGels();
  const canonical = pairSlug(parsed.a, parsed.b);
  const pair = comparePairs(gels).get(canonical);
  if (!pair) return null;
  return { gels, pair, canonical };
};

type Point = { metric: "carbs" | "sodium" | "caffeine" | "calories"; weight: number };

const pointsFor = (a: Gel, b: Gel): Point[] =>
  (
    [
      { metric: "carbs", weight: Math.abs(a.carbs - b.carbs) / 4 },
      { metric: "sodium", weight: Math.abs(a.sodiumMg - b.sodiumMg) / 60 },
      { metric: "caffeine", weight: Math.abs(a.caffeineMg - b.caffeineMg) / 30 },
      { metric: "calories", weight: Math.abs(nonCarbCalories(a) - nonCarbCalories(b)) / 40 }
    ] as Point[]
  ).sort((x, y) => y.weight - x.weight);

/** "Maurten Gel 100 has 20mg less sodium", for every label number that differs. */
const gapsText = (a: Gel, b: Gel) => {
  const parts: string[] = [];
  const add = (diff: number, unit: string, metric: string) => {
    if (!diff) return;
    parts.push(`${Math.abs(diff)}${unit} ${diff > 0 ? "more" : "less"} ${metric}`);
  };
  add(b.carbs - a.carbs, "g", "carbs");
  add(b.sodiumMg - a.sodiumMg, "mg", "sodium");
  add(b.caffeineMg - a.caffeineMg, "mg", "caffeine");
  add(b.calories - a.calories, "", "calories");
  return parts.length ? `${b.display} has ${listJoin(parts)}` : "";
};

/** A verdict written from the label gaps and the planner's counts. */
const verdictFor = (a: Gel, b: Gel, gels: Gel[]) => {
  const m400a = planFor(MARATHON, 240, a);
  const m400b = planFor(MARATHON, 240, b);
  const na = m400a.schedule.length;
  const nb = m400b.schedule.length;
  const ra = ratePerHour(a, m400a);
  const rb = ratePerHour(b, m400b);
  const points = pointsFor(a, b);
  const top = points[0];

  const reasonsA: string[] = [];
  const reasonsB: string[] = [];
  const push = (forA: boolean, text: string) => (forA ? reasonsA : reasonsB).push(text);

  if (Math.abs(a.carbs - b.carbs) >= 3) {
    push(a.carbs > b.carbs, na !== nb ? "fewer packets to carry" : "more carbs in every packet");
    push(a.carbs < b.carbs, "a smaller dose each time");
  }
  if (Math.abs(a.sodiumMg - b.sodiumMg) >= 50) {
    push(a.sodiumMg > b.sodiumMg, "a hot race or a salty sweat");
    push(a.sodiumMg < b.sodiumMg, "sodium you already get from a drink or capsules");
  }
  if (a.caffeineMg !== b.caffeineMg) {
    if (a.caffeineMg === 0 || b.caffeineMg === 0) {
      push(a.caffeineMg > b.caffeineMg, "a caffeine lift in the late miles");
      push(a.caffeineMg < b.caffeineMg, "early servings, or a stomach that doesn't like caffeine");
    } else {
      push(a.caffeineMg > b.caffeineMg, "a bigger caffeine hit");
      push(a.caffeineMg < b.caffeineMg, "a gentler dose of caffeine");
    }
  }
  if (a.format !== b.format) {
    push(a.format === "chews", "chewing instead of squeezing");
    push(b.format === "chews", "something you can swallow without chewing");
  }

  const sibling = siblingOf(a, gels)?.key === b.key;
  let heading: string;
  const paragraphs: string[] = [];

  if (sibling) {
    const [plain, caf] = a.caffeineMg ? [b, a] : [a, b];
    heading = `Same ${plain.brand} base, and ${caf.caffeineMg}mg of caffeine is the difference`;
    paragraphs.push(
      `${plain.display} and ${caf.display} carry ${plain.carbs === caf.carbs ? `the same ${plain.carbs}g of carbs` : `${plain.carbs}g and ${caf.carbs}g of carbs`}, and ${plain.sodiumMg === caf.sodiumMg ? `the same ${plain.sodiumMg}mg of sodium` : `near-identical sodium (${plain.sodiumMg}mg and ${caf.sodiumMg}mg)`}. You don't have to pick one: start on ${plain.display} and switch to ${caf.display} for the last one or two servings.`
    );
    paragraphs.push(
      `A 4:00 marathon takes ${na === nb ? na : `${na} or ${nb}`} servings on the Fuel Planner's schedule. All of them caffeinated would be ${(Math.max(na, nb) * caf.caffeineMg).toLocaleString("en-US")}mg, a lot for one morning; two at the end is ${caf.caffeineMg * 2}mg.`
    );
  } else if (top.weight < 0.65) {
    heading = "On the label these two are close to the same gel";
    const gaps = gapsText(a, b);
    paragraphs.push(
      `${gaps ? `The gaps are small: ${gaps}. ` : "The label numbers match. "}${na === nb ? `Both come to ${na} servings` : `They come to ${na} and ${nb} servings`} for a 4:00 marathon, so pick on taste, texture and what your stomach has already tested on long runs.`
    );
  } else {
    const [hi, lo] =
      top.metric === "carbs"
        ? a.carbs > b.carbs ? [a, b] : [b, a]
        : top.metric === "sodium"
          ? a.sodiumMg > b.sodiumMg ? [a, b] : [b, a]
          : top.metric === "caffeine"
            ? a.caffeineMg > b.caffeineMg ? [a, b] : [b, a]
            : nonCarbCalories(a) > nonCarbCalories(b) ? [a, b] : [b, a];
    const nHi = hi.key === a.key ? na : nb;
    const nLo = hi.key === a.key ? nb : na;
    const rHi = hi.key === a.key ? ra : rb;
    const rLo = hi.key === a.key ? rb : ra;
    if (top.metric === "carbs") {
      heading = `${hi.display} carries ${hi.carbs - lo.carbs}g more per ${unitOf(hi)}`;
      paragraphs.push(
        nHi < nLo
          ? `That's ${nHi} servings for a 4:00 marathon instead of ${nLo}. Fewer servings means fewer stops to open a packet and less to carry, but each one is a bigger dose for your gut.`
          : `On a 4:00 marathon both come out at ${nHi} servings, but ${hi.display} delivers about ${rHi}g an hour to ${lo.display}'s ${rLo}g, against the planner's 80g target.`
      );
    } else if (top.metric === "sodium") {
      const sHi = Math.round((hi.sodiumMg * 60) / planFor(MARATHON, 240, hi).gelIntervalMinutes);
      const sLo = Math.round((lo.sodiumMg * 60) / planFor(MARATHON, 240, lo).gelIntervalMinutes);
      heading = `${hi.display} brings ${hi.sodiumMg - lo.sodiumMg}mg more sodium a ${unitOf(hi)}`;
      paragraphs.push(
        `On a 4:00 marathon rhythm that's about ${sHi}mg of sodium an hour from ${hi.display} and ${sLo}mg from ${lo.display}. The planner's starting range is ${m400a.sodiumPerHour} an hour in mild weather and ${planFor(MARATHON, 240, a, "hot").sodiumPerHour} in the heat, so the gap matters most on a warm day.`
      );
    } else if (top.metric === "caffeine") {
      heading =
        lo.caffeineMg === 0
          ? `Caffeine splits them: ${hi.caffeineMg}mg against none`
          : `${hi.display} has ${hi.caffeineMg - lo.caffeineMg}mg more caffeine`;
      paragraphs.push(
        `Taken for every serving of a 4:00 marathon, that's ${(nHi * hi.caffeineMg).toLocaleString("en-US")}mg from ${hi.display} and ${nLo * lo.caffeineMg}mg from ${lo.display}. Most of the time you'd save the caffeinated one for the last servings rather than run on it all morning.`
      );
    } else {
      heading = `${hi.display} gets ${nonCarbCalories(hi)} calories from something other than carbs`;
      paragraphs.push(
        `${hi.display} lists ${hi.calories} calories on ${hi.carbs}g of carbs, so fat or protein makes up the rest. ${lo.display} is ${lo.calories} calories, almost all carbohydrate. The denser one digests slower, which suits a long, easy effort more than marathon pace.`
      );
    }
    const second = points[1];
    if (second && second.weight >= 0.75) {
      if (second.metric === "sodium") {
        const salty = a.sodiumMg > b.sodiumMg ? a : b;
        const other = salty.key === a.key ? b : a;
        paragraphs.push(`Sodium differs too: ${salty.sodiumMg}mg against ${other.sodiumMg}mg.`);
      } else if (second.metric === "caffeine") {
        const caf = a.caffeineMg > b.caffeineMg ? a : b;
        const other = caf.key === a.key ? b : a;
        paragraphs.push(
          `Caffeine differs too: ${caf.caffeineMg}mg in ${caf.display} against ${other.caffeineMg ? `${other.caffeineMg}mg` : "none"} in ${other.display}.`
        );
      } else if (second.metric === "carbs") {
        const big = a.carbs > b.carbs ? a : b;
        const other = big.key === a.key ? b : a;
        paragraphs.push(`Carbs differ too: ${big.carbs}g against ${other.carbs}g.`);
      }
    }
  }

  return { heading, paragraphs, reasonsA, reasonsB, na, nb, ra, rb };
};

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { pair } = await params;
  const resolved = await resolvePair(pair);
  if (!resolved) return { title: "Comparison not found" };
  const [a, b] = resolved.pair;
  return pageMetadata({
    title: `${a.display} vs ${b.display}`,
    description: `${a.display} (${a.carbs}g carbs, ${a.sodiumMg}mg sodium, ${a.caffeineMg}mg caffeine) against ${b.display} (${b.carbs}g, ${b.sodiumMg}mg, ${b.caffeineMg}mg), with servings for a 4:00 marathon and which to pick.`,
    path: `/fuel/compare/${resolved.canonical}`
  });
}

export default async function ComparePage({ params }: Params) {
  const { pair } = await params;
  const resolved = await resolvePair(pair);
  if (!resolved) notFound();
  if (resolved.canonical !== pair) permanentRedirect(`/fuel/compare/${resolved.canonical}`);

  const { gels } = resolved;
  const [a, b] = resolved.pair;
  const verdict = verdictFor(a, b, gels);
  const h200a = planFor(HALF, 120, a).schedule.length;
  const h200b = planFor(HALF, 120, b).schedule.length;
  const m400a = planFor(MARATHON, 240, a);
  const m400b = planFor(MARATHON, 240, b);
  const sodiumHr = (gel: Gel, interval: number) => Math.round((gel.sodiumMg * 60) / interval);

  const rows: { label: string; a: string; b: string; better?: "a" | "b" }[] = [
    { label: "Carbs", a: `${a.carbs}g`, b: `${b.carbs}g`, better: a.carbs === b.carbs ? undefined : a.carbs > b.carbs ? "a" : "b" },
    { label: "Sodium", a: `${a.sodiumMg}mg`, b: `${b.sodiumMg}mg` },
    { label: "Caffeine", a: a.caffeineMg ? `${a.caffeineMg}mg` : "None", b: b.caffeineMg ? `${b.caffeineMg}mg` : "None" },
    { label: "Calories", a: `${a.calories}`, b: `${b.calories}` },
    { label: "Calories not from carbs", a: `${nonCarbCalories(a)}`, b: `${nonCarbCalories(b)}` },
    { label: "Format", a: a.format === "chews" ? "Chews" : "Gel", b: b.format === "chews" ? "Chews" : "Gel" },
    { label: "Servings, 2:00 half", a: `${h200a}`, b: `${h200b}` },
    { label: "Servings, 4:00 marathon", a: `${m400a.schedule.length}`, b: `${m400b.schedule.length}` },
    { label: "Carbs an hour, 4:00 marathon", a: `${verdict.ra}g`, b: `${verdict.rb}g` },
    {
      label: "Sodium an hour, 4:00 marathon",
      a: `${sodiumHr(a, m400a.gelIntervalMinutes)}mg`,
      b: `${sodiumHr(b, m400b.gelIntervalMinutes)}mg`
    }
  ];

  const moreA = neighboursOf(a, gels)
    .filter((g) => g.key !== b.key)
    .slice(0, 3);
  const moreB = neighboursOf(b, gels)
    .filter((g) => g.key !== a.key)
    .slice(0, 3);
  const shared = collectionsFor(gels).filter((c) => c.filter(a) && c.filter(b));

  const faq: FaqItem[] = [];
  if (a.carbs !== b.carbs) {
    const big = a.carbs > b.carbs ? a : b;
    const small = big.key === a.key ? b : a;
    faq.push({
      q: `Which has more carbs, ${a.display} or ${b.display}?`,
      a: `${big.display}, with ${big.carbs}g per ${unitOf(big)} against ${small.carbs}g. For a 4:00 marathon the Fuel Planner schedules ${planFor(MARATHON, 240, big).schedule.length} of ${big.display} or ${planFor(MARATHON, 240, small).schedule.length} of ${small.display}.`
    });
  }
  if (a.caffeineMg !== b.caffeineMg) {
    const caf = a.caffeineMg > b.caffeineMg ? a : b;
    const other = caf.key === a.key ? b : a;
    faq.push({
      q: `Which has more caffeine, ${a.display} or ${b.display}?`,
      a: `${caf.display} has ${caf.caffeineMg}mg per ${unitOf(caf)}; ${other.display} has ${other.caffeineMg ? `${other.caffeineMg}mg` : "none"}.`
    });
  }
  if (a.sodiumMg !== b.sodiumMg) {
    const salty = a.sodiumMg > b.sodiumMg ? a : b;
    const other = salty.key === a.key ? b : a;
    faq.push({
      q: `Which has more sodium, ${a.display} or ${b.display}?`,
      a: `${salty.display}, at ${salty.sodiumMg}mg against ${other.sodiumMg}mg per serving.`
    });
  }

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Race fuel", path: "/fuel" },
    { name: `${a.display} vs ${b.display}`, path: `/fuel/compare/${resolved.canonical}` }
  ];

  return (
    <div>
      <FuelJsonLd crumbs={crumbs} faq={faq} />
      <section className="tool-hero container">
        <Crumbs crumbs={crumbs} />
        <span className="eyebrow">Gel comparison</span>
        <h1>
          {a.display} vs {b.display}
        </h1>
        <p className={styles.lede}>{verdict.heading}.</p>
      </section>

      <section className={`container ${styles.block}`}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Per serving</th>
                <th>
                  <Link href={`/fuel/gels/${a.key}`}>{a.display}</Link>
                </th>
                <th>
                  <Link href={`/fuel/gels/${b.key}`}>{b.display}</Link>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label}>
                  <td>{row.label}</td>
                  <td className={row.better === "a" ? styles.better : undefined}>{row.a}</td>
                  <td className={row.better === "b" ? styles.better : undefined}>{row.b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Servings and hourly numbers come from the Fuel Planner&apos;s schedule with its defaults: mild weather,
          some fueling practice, the last serving about a mile from the finish.
        </p>
      </section>

      <section className={`container ${styles.block}`}>
        <h2>{verdict.heading}</h2>
        {verdict.paragraphs.map((text) => (
          <p key={text}>{text}</p>
        ))}
        {verdict.reasonsA.length ? (
          <p>
            Pick <Link href={`/fuel/gels/${a.key}`}>{a.display}</Link> for {verdict.reasonsA.slice(0, 3).join(", or ")}.
          </p>
        ) : null}
        {verdict.reasonsB.length ? (
          <p>
            Pick <Link href={`/fuel/gels/${b.key}`}>{b.display}</Link> for {verdict.reasonsB.slice(0, 3).join(", or ")}.
          </p>
        ) : null}
        {a.notes || b.notes ? (
          <p>
            From our catalog notes: {a.notes ? `${a.display}: ${a.notes}` : ""} {b.notes ? `${b.display}: ${b.notes}` : ""}
          </p>
        ) : null}
      </section>

      <section className={`container ${styles.block}`}>
        <h2>Other matchups worth a look</h2>
        <ul className={styles.alts}>
          {moreA.map((other) => (
            <li key={`a-${other.key}`}>
              <Link href={`/fuel/compare/${pairSlug(a.key, other.key)}`}>
                {a.display} vs {other.display}
              </Link>
            </li>
          ))}
          {moreB.map((other) => (
            <li key={`b-${other.key}`}>
              <Link href={`/fuel/compare/${pairSlug(b.key, other.key)}`}>
                {b.display} vs {other.display}
              </Link>
            </li>
          ))}
        </ul>
        {shared.length ? (
          <div className={styles.chips}>
            {shared.map((collection) => (
              <Link key={collection.slug} className={styles.chip} href={`/fuel/best/${collection.slug}`}>
                {collection.title}
              </Link>
            ))}
          </div>
        ) : null}
      </section>

      <section className={`container ${styles.block}`}>
        <h2>Where to buy them</h2>
        <p>{a.display}</p>
        <FuelBuyLinks name={a.name} brand={a.brand} label={a.display} disclosure={false} />
        <p style={{ marginTop: 18 }}>{b.display}</p>
        <FuelBuyLinks name={b.name} brand={b.brand} label={b.display} />
      </section>

      <Faq title="Quick answers" items={faq} />

      <section className={`container ${styles.block}`}>
        <PlannerCta text="Want to see either one on your own race? The Fuel Planner builds the schedule for your distance, finish time and weather." />
      </section>
    </div>
  );
}
