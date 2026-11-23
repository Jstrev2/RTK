import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatFuelingSummary } from "@/lib/fueling";
import { pageMetadata } from "@/lib/seo";
import {
  RACES,
  TEMPERATURES,
  capitalize,
  findRace,
  finishSlug,
  finishTimesFor,
  fmtClock,
  getFuelGels,
  lineupsFor,
  parseFinishSlug,
  planFor,
  plural,
  statsFor,
  targetFor,
  type Gel,
  type Lineup,
  type Race
} from "@/lib/content/fuel";
import { Crumbs, Faq, FuelJsonLd, PlannerCta, type FaqItem } from "../../../_ui/fuel-ui";
import styles from "../../../fuel.module.css";

export const revalidate = 86400;
export const dynamicParams = true;

export async function generateStaticParams(): Promise<{ race: string; finish: string }[]> {
  return [];
}

type Params = { params: Promise<{ race: string; finish: string }> };

const resolve = async (raceSlug: string, finish: string) => {
  const race = findRace(raceSlug);
  const minutes = parseFinishSlug(finish);
  if (!race || minutes === null) return null;
  const gels = await getFuelGels();
  if (!finishTimesFor(race, gels).includes(minutes)) return null;
  const lineups = lineupsFor(race, minutes, gels);
  if (!lineups.length) return null;
  return { race, minutes, gels, lineups };
};

const gelLink = (gel: Gel) => <Link href={`/fuel/gels/${gel.key}`}>{gel.display}</Link>;

/** "a 3:30" but "an 8:00" or "an 11:00". */
const article = (text: string) => (/^(8|11|18)/.test(text) ? "an" : "a");

const BRACKET_COPY: Record<number, (target: number) => string> = {
  30: (t) => `Under 75 minutes the Fuel Planner's target is ${t}g an hour, the bottom of its scale`,
  55: (t) => `From 75 minutes to 2:30, ${t}g an hour covers it`,
  65: (t) => `From 2:30 to four hours the target is ${t}g an hour`,
  80: (t) => `Past four hours the planner wants ${t}g an hour`
};

function LineupCard({ lineup, steady }: { lineup: Lineup; steady: Lineup }) {
  const n = lineup.servings.length;
  const lateCount = lineup.late ? lineup.servings.filter((s) => s.gel.key === lineup.late?.key).length : 0;
  return (
    <div className={styles.lineup}>
      <span className="eyebrow">{lineup.title}</span>
      <h3>
        {lineup.late && lateCount === n ? (
          gelLink(lineup.late)
        ) : lineup.late ? (
          <>
            {gelLink(lineup.base)}, then {gelLink(lineup.late)}
          </>
        ) : (
          gelLink(lineup.base)
        )}
      </h3>
      <p>
        {lineup.id === "steady"
          ? n === 1
            ? `${lineup.base.carbs}g of carbs with ${lineup.base.sodiumMg}mg of sodium, the closest caffeine-free fit in our table for a target this low.`
            : `At ${lineup.base.carbs}g a serving every ${lineup.plan.gelIntervalMinutes} minutes it lands at ${lineup.rate}g an hour, the closest caffeine-free fit in our table, with sodium nearest the planner's mild-weather range.`
          : lineup.id === "caffeine" && lateCount === n
            ? `Swap the single serving for ${lineup.late?.display}: ${lineup.late?.carbs}g of carbs plus ${lineup.late?.caffeineMg}mg of caffeine for the last few miles.`
            : lineup.id === "caffeine"
            ? `The same plan with ${lineup.late?.display} (${lineup.late?.caffeineMg}mg) for the last ${lateCount === 1 ? "serving" : `${lateCount} servings`}, when a lift does the most good.`
            : `${plural(n, "serving")} instead of ${steady.servings.length}, at ${lineup.rate}g an hour. Bigger doses, so practice them on a long run first.`}
      </p>
      <ul>
        <li>
          {n === 1
            ? `1 serving, at ${fmtClock(lineup.servings[0].timeMinutes)}`
            : `${plural(n, "serving")}, one every ${lineup.plan.gelIntervalMinutes} min`}
        </li>
        <li>{n === 1 ? `${lineup.totalCarbs}g carbs` : `${lineup.totalCarbs}g carbs in all, ${lineup.rate}g an hour`}</li>
        <li>{lineup.totalCaffeine ? `${lineup.totalCaffeine}mg caffeine in all` : "No caffeine"}</li>
        <li>
          {n === 1
            ? `${lineup.servings[0].gel.sodiumMg}mg sodium`
            : `About ${lineup.sodiumPerHour}mg sodium an hour from the gels`}
        </li>
      </ul>
    </div>
  );
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { race: raceSlug, finish } = await params;
  const resolved = await resolve(raceSlug, finish);
  if (!resolved) return { title: "Plan not found" };
  const { race, minutes, lineups } = resolved;
  const steady = lineups[0];
  const clock = fmtClock(minutes);
  return pageMetadata({
    title: `${capitalize(race.label)} Fueling Plan for ${article(clock)} ${clock} Finish`,
    description: `How many gels for ${article(clock)} ${clock} ${race.label}: ${plural(steady.servings.length, "serving")} every ${steady.plan.gelIntervalMinutes} minutes for ${steady.plan.carbTargetPerHour}g of carbs an hour, three real gel lineups, and fluid and sodium by weather.`,
    path: `/fuel/plan/${race.slug}/${finishSlug(minutes)}`
  });
}

export default async function PlanPage({ params }: Params) {
  const { race: raceSlug, finish } = await params;
  const resolved = await resolve(raceSlug, finish);
  if (!resolved) notFound();
  const { race, minutes, gels, lineups } = resolved;
  const steady = lineups[0];
  const plan = steady.plan;
  const summary = formatFuelingSummary(plan);
  const target = plan.carbTargetPerHour;
  const clock = fmtClock(minutes);
  const name = race.label;
  const first = steady.servings[0];
  const last = steady.servings[steady.servings.length - 1];
  const stats = statsFor(gels);

  const slower = targetFor(minutes + 15);
  const faster = targetFor(minutes - 15);
  const times = finishTimesFor(race, gels);

  // A median-size gel can't always reach the target: servings never come closer than 20 minutes.
  const medianGel = gels
    .filter((g) => g.format === "gel" && g.carbs === Math.round(stats.carbs))
    .sort((a, b) => a.key.localeCompare(b.key))[0];
  const medianPlan = medianGel ? planFor(race, minutes, medianGel) : undefined;
  const medianRate = medianGel && medianPlan ? Math.round((medianGel.carbs * 60) / medianPlan.gelIntervalMinutes) : 0;
  const medianShort = medianGel && medianPlan && medianRate < target * 0.9;

  const weather = TEMPERATURES.map((temp) => {
    const p = planFor(race, minutes, steady.base, temp.id);
    return { ...temp, fluids: p.fluidsPerHour, sodium: p.sodiumPerHour };
  });
  const mildSodiumLow = Number(/^(\d+)/.exec(plan.sodiumPerHour)?.[1] ?? 0);

  const otherRaces = RACES.filter((r) => r.slug !== race.slug)
    .map((r) => {
      const options = finishTimesFor(r, gels);
      if (!options.length) return null;
      // Nearest finish time at a similar pace.
      const pace = minutes / race.miles;
      const wanted = pace * r.miles;
      const nearest = options.reduce((best, t) => (Math.abs(t - wanted) < Math.abs(best - wanted) ? t : best), options[0]);
      return { race: r, minutes: nearest };
    })
    .filter(Boolean) as { race: Race; minutes: number }[];

  const faq: FaqItem[] = [
    {
      q: `How many gels do I need for ${article(clock)} ${clock} ${name}?`,
      a: `${capitalize(plural(steady.servings.length, "serving"))} of a ${steady.base.carbs}g gel like ${steady.base.display}${
        steady.servings.length > 1 ? `, one every ${plan.gelIntervalMinutes} minutes` : ""
      }.${
        lineups.find((l) => l.id === "fewest")
          ? ` With a bigger gel such as ${lineups.find((l) => l.id === "fewest")?.base.display} it's ${lineups.find((l) => l.id === "fewest")?.servings.length}.`
          : ""
      } That's the Fuel Planner's schedule with its defaults, ending about a mile before the finish.`
    },
    {
      q: `How many carbs per hour for ${article(clock)} ${clock} ${name}?`,
      a: `The Fuel Planner targets ${target}g an hour for this finish, inside a ${plan.carbsPerHour} range. Runners new to fueling can start lower and build up on long runs.`
    },
    {
      q: `When should I take my first gel in ${article(clock)} ${clock} ${name}?`,
      a: first
        ? steady.servings.length === 1
          ? `At about ${fmtClock(first.timeMinutes)}, around mile ${first.mile.toFixed(1)}. It's the only serving the planner schedules for this finish.`
          : `At about ${fmtClock(first.timeMinutes)}, around mile ${first.mile.toFixed(1)}, on the ${steady.base.carbs}g schedule. Then every ${plan.gelIntervalMinutes} minutes, with the last at ${fmtClock(last.timeMinutes)} near mile ${last.mile.toFixed(1)}.`
        : "This plan has no scheduled serving."
    }
  ];

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Race fuel", path: "/fuel" },
    { name: `${capitalize(race.label)} in ${clock}`, path: `/fuel/plan/${race.slug}/${finishSlug(minutes)}` }
  ];

  return (
    <div>
      <FuelJsonLd crumbs={crumbs} faq={faq} />
      <section className="tool-hero container">
        <Crumbs crumbs={crumbs} />
        <span className="eyebrow">
          {capitalize(race.label)} fueling · {summary.pace}
        </span>
        <h1>
          Fueling a {clock} {name}
        </h1>
        <p className={styles.lede}>
          At {summary.pace}, {article(clock)} {clock} {name} gets {article(String(target))} {target}g-an-hour carb target from the Fuel Planner.
          {steady.servings.length === 1
            ? ` That's a single serving, at ${fmtClock(first.timeMinutes)} around mile ${first.mile.toFixed(1)}.`
            : ` With a ${steady.base.carbs}g gel that's ${steady.servings.length} servings, one every ${plan.gelIntervalMinutes} minutes, the last near mile ${last.mile.toFixed(1)}.`}
        </p>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <strong>{target}g</strong>
            <span>carbs an hour ({plan.carbsPerHour} range)</span>
          </div>
          <div className={styles.stat}>
            <strong>{steady.servings.length}</strong>
            <span>
              {steady.servings.length === 1 ? "serving" : "servings"} of a {steady.base.carbs}g gel
            </span>
          </div>
          <div className={styles.stat}>
            <strong>{fmtClock(first.timeMinutes)}</strong>
            <span>first serving, about mile {first.mile.toFixed(1)}</span>
          </div>
          <div className={styles.stat}>
            <strong>{plan.caloriesPerHour.toLocaleString("en-US")}</strong>
            <span>calories burned an hour at 155 lb</span>
          </div>
        </div>
      </section>

      <section className={`container ${styles.block}`}>
        <h2>{(BRACKET_COPY[target] ?? ((t: number) => `The target is ${t}g an hour`))(target)}</h2>
        <p>
          {target === 30
            ? `At this pace the only serving lands at ${fmtClock(first.timeMinutes)}, around mile ${first.mile.toFixed(1)}. Take it if you've practiced with it; a gel you've never tried isn't worth the gamble in a race this short.`
            : `You'll burn about ${plan.caloriesPerHour.toLocaleString("en-US")} calories an hour at 155 lb. No plan replaces that, and this one doesn't try: ${target}g of carbs is about ${target * 4} calories an hour, enough to top up the tank, not refill it.`}
          {slower !== target ? ` Finish 15 minutes slower and the target moves to ${slower}g.` : ""}
          {faster !== target && times.includes(minutes - 15) ? ` Run 15 minutes faster and it moves to ${faster}g.` : ""}
        </p>
        {medianShort && medianGel ? (
          <p>
            One catch: the planner never schedules servings closer than 20 minutes apart, so a median {medianGel.carbs}g
            gel tops out at {medianRate}g an hour here. The lineups below use bigger servings to close the gap.
          </p>
        ) : null}

        <div className={styles.timeline}>
          <div className={styles.step}>
            <span>Before</span>
            <div>
              <strong>Start fed and hydrated</strong>
              <p>A familiar pre-race meal. Race day isn&apos;t the day for a new product.</p>
            </div>
          </div>
          {steady.servings.map((serving, index) => (
            <div className={styles.step} key={serving.timeMinutes}>
              <span>{fmtClock(serving.timeMinutes)}</span>
              <div>
                <strong>
                  Serving {index + 1}: {serving.gel.display}
                </strong>
                <p>
                  About mile {serving.mile.toFixed(1)} · {serving.gel.carbs}g carbs
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={`container ${styles.block}`}>
        <h2>
          {lineups.length === 3 ? "Three" : lineups.length === 2 ? "Two" : "One"} real{" "}
          {lineups.length === 1 ? "lineup" : "lineups"} for {target}g an hour
        </h2>
        <p>
          Picked from the {gels.length} products in our table and run through the same schedule. Swap in anything
          with a similar carb count and the timing holds.
        </p>
        <div className={styles.cards}>
          {lineups.map((lineup) => (
            <LineupCard key={lineup.id} lineup={lineup} steady={steady} />
          ))}
        </div>
      </section>

      <section className={`container ${styles.block}`}>
        <h2>Fluid and sodium move with the weather, not the clock</h2>
        <p>
          These are the Fuel Planner&apos;s starting ranges per hour. Sweat rates vary a lot between runners, so
          treat them as a first guess to test on long runs, and don&apos;t force fluid you don&apos;t want.
          {steady.servings.length === 1
            ? ` In a race this short, the single serving of ${steady.base.display} adds ${steady.base.sodiumMg}mg of sodium.`
            : steady.sodiumPerHour < mildSodiumLow
            ? ` The ${steady.base.display} schedule supplies about ${steady.sodiumPerHour}mg of sodium an hour, so even in mild weather the rest comes from a drink or capsules.`
            : ` The ${steady.base.display} schedule already supplies about ${steady.sodiumPerHour}mg of sodium an hour.`}
        </p>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Conditions</th>
                <th className={styles.num}>Fluid an hour</th>
                <th className={styles.num}>Sodium an hour</th>
              </tr>
            </thead>
            <tbody>
              {weather.map((row) => (
                <tr key={row.id}>
                  <td>{row.label}</td>
                  <td className={styles.num}>{row.fluids}</td>
                  <td className={styles.num}>{row.sodium}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={`container ${styles.block}`}>
        <PlannerCta
          text={`Heavier or lighter than 155 lb, racing in heat, or already trained for more carbs? The Fuel Planner reworks this ${name} plan for you.`}
        />
      </section>

      <section className={`container ${styles.block}`}>
        <h2>Other {name} finish times</h2>
        <div className={styles.chips}>
          {times.map((t) => (
            <Link
              key={t}
              href={`/fuel/plan/${race.slug}/${finishSlug(t)}`}
              className={t === minutes ? `${styles.chip} ${styles.chipCurrent}` : styles.chip}
              aria-current={t === minutes ? "page" : undefined}
            >
              {fmtClock(t)}
            </Link>
          ))}
        </div>
        {otherRaces.length ? (
          <>
            <p style={{ marginTop: 18 }}>The same pace at other distances:</p>
            <div className={styles.chips}>
              {otherRaces.map(({ race: r, minutes: t }) => (
                <Link key={r.slug} className={styles.chip} href={`/fuel/plan/${r.slug}/${finishSlug(t)}`}>
                  {r.short} in {fmtClock(t)}
                </Link>
              ))}
            </div>
          </>
        ) : null}
      </section>

      <Faq title={`${capitalize(name)} fueling questions`} items={faq} />
    </div>
  );
}
