import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { pageMetadata } from "@/lib/seo";
import {
  GEL_PAGE_TIMES,
  MARATHON,
  collectionsFor,
  findGel,
  findRace,
  finishSlug,
  fmtClock,
  getFuelGels,
  listJoin,
  neighboursOf,
  nonCarbCalories,
  pairSlug,
  planFor,
  plural,
  ratePerHour,
  siblingOf,
  statsFor,
  targetFor,
  diffLine,
  type Gel,
  type GelStats
} from "@/lib/content/fuel";
import { Crumbs, Faq, FuelJsonLd, PlannerCta, type FaqItem } from "../../_ui/fuel-ui";
import FuelBuyLinks from "../../_ui/fuel-buy-links";
import styles from "../../fuel.module.css";

export const revalidate = 86400;
export const dynamicParams = true;

export async function generateStaticParams(): Promise<{ item_key: string }[]> {
  return [];
}

type Params = { params: Promise<{ item_key: string }> };

const unitOf = (gel: Gel) => (gel.format === "chews" ? "package" : "packet");

const caffeineText = (gel: Gel) => (gel.caffeineMg ? `${gel.caffeineMg}mg of caffeine` : "no caffeine");

/** The one fact that sets this gel apart from the table, as a full sentence. */
const standoutSentence = (gel: Gel, gels: Gel[], stats: GelStats) => {
  const others = gels.filter((other) => other.key !== gel.key);
  const total = others.length;
  const above = (pick: (g: Gel) => number) => others.filter((o) => pick(o) > pick(gel)).length;
  const below = (pick: (g: Gel) => number) => others.filter((o) => pick(o) < pick(gel)).length;

  const candidates = [
    { metric: "carbs", score: Math.abs(gel.carbs - stats.carbs) / 4 },
    { metric: "sodium", score: Math.abs(gel.sodiumMg - stats.sodium) / 60 },
    { metric: "caffeine", score: Math.abs(gel.caffeineMg - stats.caffeine) / 30 },
    { metric: "calories", score: Math.abs(gel.calories - stats.calories) / 40 }
  ].sort((a, b) => b.score - a.score);

  const top = candidates[0];
  if (top.score < 0.4) {
    return `On the label it sits close to the middle of the ${total + 1} products we track: the median is ${stats.carbs}g of carbs, ${stats.sodium}mg of sodium and ${stats.calories} calories.`;
  }
  if (top.metric === "carbs") {
    const more = above((g) => g.carbs);
    if (gel.carbs > stats.carbs) {
      return more === 0
        ? `Nothing in our table of ${total + 1} carries more carbs per serving.`
        : `Only ${more} of the other ${total} products we track ${more === 1 ? "carries" : "carry"} more carbs per serving.`;
    }
    return `It's one of the smaller servings we track: ${plural(below((g) => g.carbs), "product")} of ${total} others carry less, against a median of ${stats.carbs}g.`;
  }
  if (top.metric === "sodium") {
    if (gel.sodiumMg > stats.sodium) {
      const more = above((g) => g.sodiumMg);
      return more === 0
        ? `That's the most sodium of the ${total + 1} products we track, against a median of ${stats.sodium}mg.`
        : `That's more sodium than ${below((g) => g.sodiumMg)} of the other ${total} products we track, against a median of ${stats.sodium}mg.`;
    }
    return gel.sodiumMg === 0
      ? `It has no sodium at all, where the median product we track has ${stats.sodium}mg.`
      : `Sodium is light: the median product we track has ${stats.sodium}mg.`;
  }
  if (top.metric === "caffeine") {
    const more = above((g) => g.caffeineMg);
    return more === 0
      ? `No product in our table has more caffeine per serving.`
      : `Only ${more} of the other ${total} products we track ${more === 1 ? "has" : "have"} more caffeine per serving.`;
  }
  const nonCarb = nonCarbCalories(gel);
  if (gel.calories > stats.calories) {
    return nonCarb >= 20
      ? `It's calorie-dense for its carbs: about ${nonCarb} of the ${gel.calories} calories come from something other than carbohydrate.`
      : `At ${gel.calories} calories it sits above the ${stats.calories}-calorie median.`;
  }
  return `At ${gel.calories} calories it's one of the lighter servings we track (median ${stats.calories}).`;
};

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { item_key } = await params;
  const gels = await getFuelGels();
  const gel = findGel(gels, item_key);
  if (!gel) return { title: "Gel not found" };
  const n = planFor(MARATHON, 240, gel).schedule.length;
  return pageMetadata({
    title: `${gel.display}: Carbs, Caffeine and How Many for a Marathon`,
    description: `${gel.display} has ${gel.carbs}g carbs, ${gel.sodiumMg}mg sodium and ${caffeineText(gel)} per ${unitOf(gel)}. A 4:00 marathon takes ${n}; see counts for other finish times and the closest alternatives.`,
    path: `/fuel/gels/${gel.key}`
  });
}

export default async function GelPage({ params }: Params) {
  const { item_key } = await params;
  const gels = await getFuelGels();
  const gel = findGel(gels, item_key);
  if (!gel) notFound();

  const stats = statsFor(gels);
  const unit = unitOf(gel);
  const neighbours = neighboursOf(gel, gels);
  const sibling = siblingOf(gel, gels);
  const collections = collectionsFor(gels).filter((collection) => collection.filter(gel));

  const rows = GEL_PAGE_TIMES.flatMap(({ race: raceSlug, minutes }) => {
    const race = findRace(raceSlug);
    if (!race) return [];
    return minutes.map((m) => {
      const plan = planFor(race, m, gel);
      return { race, minutes: m, plan, rate: ratePerHour(gel, plan), target: targetFor(m) };
    });
  });
  const at = (raceSlug: string, m: number) => rows.find((r) => r.race.slug === raceSlug && r.minutes === m);
  const m400 = at("marathon", 240);
  const m330 = at("marathon", 210);
  const m430 = at("marathon", 270);
  const h200 = at("half-marathon", 120);

  const medianGel = gels
    .filter((g) => g.carbs === stats.carbs || Math.abs(g.carbs - stats.carbs) <= 0.5)
    .sort((a, b) => a.key.localeCompare(b.key))[0];
  const medianCount = medianGel ? planFor(MARATHON, 240, medianGel).schedule.length : undefined;

  const bigger = gels
    .filter((g) => g.carbs >= 30 && g.format === "gel" && g.key !== gel.key && g.caffeineMg === 0)
    .sort((a, b) => Math.abs(a.sodiumMg - gel.sodiumMg) - Math.abs(b.sodiumMg - gel.sodiumMg) || a.key.localeCompare(b.key))[0];

  const caffeinated = gels.filter((g) => g.caffeineMg > 0);
  const brandCaffeinated = caffeinated.filter((g) => g.brand === gel.brand);
  const closestCaffeinated = gel.caffeineMg
    ? undefined
    : [...caffeinated].sort(
        (a, b) =>
          Math.abs(a.carbs - gel.carbs) - Math.abs(b.carbs - gel.carbs) ||
          a.caffeineMg - b.caffeineMg ||
          a.key.localeCompare(b.key)
      )[0];

  // Header and copy for the count section, written from the 4:00 numbers.
  let countHeading = "";
  let countCopy = "";
  if (m400) {
    const cmp =
      medianCount === undefined || medianCount === m400.plan.schedule.length
        ? "the same as the median gel"
        : m400.plan.schedule.length < medianCount
          ? `${medianCount - m400.plan.schedule.length} fewer than a median ${stats.carbs}g gel`
          : `${m400.plan.schedule.length - medianCount} more than a median ${stats.carbs}g gel`;
    countHeading = `${plural(m400.plan.schedule.length, unit)} for a 4:00 marathon, ${cmp}`;
    if (m400.rate < m400.target * 0.9) {
      countCopy = `From four hours on, the Fuel Planner aims for ${m400.target}g of carbs an hour. Its shortest gap between servings is ${m400.plan.gelIntervalMinutes} minutes, so a ${gel.carbs}g ${unit} tops out at ${m400.rate}g an hour. Getting the rest means a carb drink alongside it`;
    } else {
      countCopy = `At a 4:00 finish the rhythm is one every ${m400.plan.gelIntervalMinutes} minutes, which works out to ${m400.rate}g an hour against the planner's ${m400.target}g target.`;
    }
  }

  const caffeineHeading = gel.caffeineMg
    ? `${gel.caffeineMg}mg a ${unit} adds up over a long race`
    : "No caffeine, so it works for every serving";

  const nonCarb = nonCarbCalories(gel);
  const sodiumHr = m400 ? Math.round((gel.sodiumMg * 60) / m400.plan.gelIntervalMinutes) : 0;

  const faq: FaqItem[] = [];
  if (m330 && m400 && m430) {
    faq.push({
      q: `How many ${gel.display} do I need for a marathon?`,
      a: `${m330.plan.schedule.length} for a 3:30 finish, ${m400.plan.schedule.length} for 4:00 and ${m430.plan.schedule.length} for 4:30. That's the Fuel Planner's schedule with its default settings (mild weather, some fueling practice), with the last serving about a mile before the finish.`
    });
  }
  const halfRows = rows.filter((r) => r.race.slug === "half-marathon");
  if (halfRows.length) {
    faq.push({
      q: `How many ${gel.display} for a half marathon?`,
      a: `${listJoin(halfRows.map((r) => `${r.plan.schedule.length} at ${fmtClock(r.minutes)}`))}. The planner's target is ${halfRows[0].target}g an hour under 2:30 and ${targetFor(150)}g from 2:30 on.`
    });
  }
  faq.push({
    q: `Does ${gel.display} have caffeine?`,
    a: gel.caffeineMg
      ? `Yes, ${gel.caffeineMg}mg per ${unit}.${sibling ? ` ${sibling.display} is the same product without it.` : ""}`
      : `No.${sibling ? ` ${sibling.display} is the caffeinated version, with ${sibling.caffeineMg}mg.` : ""}`
  });
  faq.push({
    q: `How much sodium is in ${gel.display}?`,
    a: `${gel.sodiumMg}mg per ${unit}, against a median of ${stats.sodium}mg across the ${gels.length} products we track.${
      m400 ? ` At a 4:00 marathon rhythm that's about ${sodiumHr}mg an hour from the gels alone.` : ""
    }`
  });

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Race fuel", path: "/fuel" },
    { name: gel.display, path: `/fuel/gels/${gel.key}` }
  ];

  return (
    <div>
      <FuelJsonLd crumbs={crumbs} faq={faq} />
      <section className="tool-hero container">
        <Crumbs crumbs={crumbs} />
        <span className="eyebrow">{gel.brand}{gel.format === "chews" ? " · chews" : ""}</span>
        <h1>{gel.display}</h1>
        <p className={styles.lede}>
          {gel.carbs}g of carbs, {gel.sodiumMg}mg of sodium, {caffeineText(gel)} and {gel.calories} calories in
          one {unit}. {standoutSentence(gel, gels, stats)}
        </p>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <strong>{gel.carbs}g</strong>
            <span>carbs (median {stats.carbs}g)</span>
          </div>
          <div className={styles.stat}>
            <strong>{gel.sodiumMg}mg</strong>
            <span>sodium (median {stats.sodium}mg)</span>
          </div>
          <div className={styles.stat}>
            <strong>{gel.caffeineMg}mg</strong>
            <span>caffeine ({caffeinated.length} of {gels.length} products have any)</span>
          </div>
          <div className={styles.stat}>
            <strong>{gel.calories}</strong>
            <span>calories (median {stats.calories})</span>
          </div>
        </div>
      </section>

      <section className={`container ${styles.block}`}>
        <h2>{countHeading}</h2>
        <p>
          {countCopy}
          {m400 && m400.rate < m400.target * 0.9 ? (
            bigger ? (
              <>
                , or a bigger gel like <Link href={`/fuel/gels/${bigger.key}`}>{bigger.display}</Link> ({bigger.carbs}g).
              </>
            ) : (
              "."
            )
          ) : null}
        </p>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Race and finish</th>
                <th className={styles.num}>Servings</th>
                <th className={styles.num}>Every</th>
                <th className={styles.num}>Carbs an hour</th>
                <th className={styles.num}>Planner target</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.race.slug}-${row.minutes}`}>
                  <td>
                    <Link href={`/fuel/plan/${row.race.slug}/${finishSlug(row.minutes)}`}>
                      {row.race.short} in {fmtClock(row.minutes)}
                    </Link>
                  </td>
                  <td className={styles.num}>{row.plan.schedule.length}</td>
                  <td className={styles.num}>{row.plan.gelIntervalMinutes} min</td>
                  <td className={styles.num}>{row.rate}g</td>
                  <td className={styles.num}>{row.target}g</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {h200 ? (
          <p>
            Counts assume the planner&apos;s defaults: a 155 lb runner with some fueling practice in mild
            weather, first serving at {h200.plan.gelIntervalMinutes} minutes for a 2:00 half, last one about a
            mile from the finish.
          </p>
        ) : null}
      </section>

      <section className={`container ${styles.block}`}>
        <h2>{caffeineHeading}</h2>
        {gel.caffeineMg ? (
          <>
            <p>
              {gel.caffeineMg >= stats.caffeinatedCaffeine
                ? `That's at or above the ${stats.caffeinatedCaffeine}mg median of the ${caffeinated.length} caffeinated products we track.`
                : `That's under the ${stats.caffeinatedCaffeine}mg median of the ${caffeinated.length} caffeinated products we track.`}
              {m400
                ? ` A 4:00 marathon has ${m400.plan.schedule.length} servings on the planner's schedule. Take this for every one and you'd swallow ${(
                    m400.plan.schedule.length * gel.caffeineMg
                  ).toLocaleString("en-US")}mg before counting your morning coffee. Our race plans put caffeine in the last one or two servings instead, which keeps it to ${
                    gel.caffeineMg
                  } to ${gel.caffeineMg * 2}mg.`
                : ""}
            </p>
            {sibling ? (
              <p>
                For the early servings, <Link href={`/fuel/gels/${sibling.key}`}>{sibling.display}</Link> is the
                same {unit} without the caffeine, so the switch costs you nothing in carbs.
              </p>
            ) : null}
          </>
        ) : (
          <p>
            You can take it from the first serving to the last without thinking about a caffeine total.
            {sibling ? (
              <>
                {" "}If you want a lift late in the race,{" "}
                <Link href={`/fuel/gels/${sibling.key}`}>{sibling.display}</Link> is the same {unit} with{" "}
                {sibling.caffeineMg}mg; <Link href={`/fuel/compare/${pairSlug(gel.key, sibling.key)}`}>the side-by-side</Link>{" "}
                shows nothing else changes.
              </>
            ) : closestCaffeinated ? (
              <>
                {" "}
                {brandCaffeinated.length
                  ? `${gel.brand}'s caffeinated ${brandCaffeinated.length === 1 ? "option" : "options"}, ${listJoin(
                      brandCaffeinated.map((g) => `${g.display} (${g.carbs}g, ${g.caffeineMg}mg)`)
                    )}, ${brandCaffeinated.length === 1 ? "isn't" : "aren't"} a straight swap on carbs.`
                  : `${gel.brand} doesn't make a caffeinated version in our table.`}{" "}
                The closest caffeinated match on carbs is{" "}
                <Link href={`/fuel/gels/${closestCaffeinated.key}`}>{closestCaffeinated.display}</Link> (
                {closestCaffeinated.carbs}g, {closestCaffeinated.caffeineMg}mg).
              </>
            ) : null}
          </p>
        )}
      </section>

      <section className={`container ${styles.block}`}>
        <h2>
          {nonCarb >= 20
            ? `${nonCarb} of its calories aren't carbs`
            : gel.sodiumMg >= 150
              ? "Enough sodium to matter on a warm day"
              : gel.sodiumMg <= 15
                ? "Plan your sodium somewhere else"
                : `What else is in the ${unit}`}
        </h2>
        <p>
          {nonCarb >= 20
            ? `Carbs account for about ${gel.carbs * 4} of the ${gel.calories} calories, so the rest comes from fat or protein. Fat and protein digest slower than sugar, which suits an easy ultra pace better than a marathon effort.`
            : gel.carbs * 4 >= gel.calories
              ? `All ${gel.calories} calories come from its ${gel.carbs}g of carbs.`
              : `Nearly every calorie is carbohydrate: ${gel.carbs}g works out to about ${gel.carbs * 4} of the ${gel.calories}.`}{" "}
          {m400
            ? gel.sodiumMg === 0
              ? `There's no sodium in it, so all of the planner's ${m400.plan.sodiumPerHour} an hour starting range (mild weather) has to come from a drink or capsules.`
              : `On the 4:00 marathon rhythm the ${gel.format === "chews" ? "chews" : "gels"} alone supply about ${sodiumHr}mg of sodium an hour. The planner's starting range is ${m400.plan.sodiumPerHour} in mild weather, so ${
                  sodiumHr >= 300 ? "this covers most of it on its own." : "the rest has to come from a drink or capsules."
                }`
            : ""}
        </p>
        {gel.notes ? <p>From our catalog notes: {gel.notes}</p> : null}
      </section>

      <section className={`container ${styles.block}`}>
        <h2>The closest alternatives on the label</h2>
        <p>
          Matched on carbs, sodium, caffeine and calories, with at most two from {gel.brand}. Each links to a
          side-by-side.
        </p>
        <ul className={styles.alts}>
          {neighbours.map((other) => (
            <li key={other.key}>
              <Link href={`/fuel/gels/${other.key}`}>{other.display}</Link>: {diffLine(gel, other)}.{" "}
              <Link href={`/fuel/compare/${pairSlug(gel.key, other.key)}`}>
                Compare with {gel.display}
              </Link>
            </li>
          ))}
        </ul>
        {collections.length ? (
          <>
            <p>It also shows up in these lists:</p>
            <div className={styles.chips}>
              {collections.map((collection) => (
                <Link key={collection.slug} className={styles.chip} href={`/fuel/best/${collection.slug}`}>
                  {collection.title}
                </Link>
              ))}
            </div>
          </>
        ) : null}
      </section>

      <section className={`container ${styles.block}`}>
        <h2>Where to buy it</h2>
        <FuelBuyLinks name={gel.name} brand={gel.brand} label={gel.display} />
      </section>

      <Faq title={`${gel.display} questions, answered from the label`} items={faq} />

      <section className={`container ${styles.block}`}>
        <PlannerCta
          text={`Racing hot, chasing a different finish time, or mixing products? Pick ${gel.display} in the Fuel Planner and it redraws the schedule for your day.`}
        />
      </section>
    </div>
  );
}
