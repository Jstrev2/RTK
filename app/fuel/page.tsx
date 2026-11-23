import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import {
  MARATHON,
  RACES,
  collectionsFor,
  finishSlug,
  finishTimesFor,
  fmtClock,
  getFuelGels,
  planFor,
  statsFor,
  targetFor
} from "@/lib/content/fuel";
import { Crumbs, Faq, FuelJsonLd, GelTable, PlannerCta, type FaqItem } from "./_ui/fuel-ui";
import styles from "./fuel.module.css";

export const revalidate = 86400;

export const metadata: Metadata = pageMetadata({
  title: "Race Fuel: Gel Counts, Fueling Plans and Gel Comparisons",
  description:
    "How many gels for your race and finish time, worked out with the Fuel Planner's math, plus label numbers for every energy gel we track and side-by-side comparisons.",
  path: "/fuel"
});

export default async function FuelHubPage() {
  const gels = await getFuelGels();
  const stats = statsFor(gels);
  const brands = new Set(gels.map((g) => g.brand));
  const caffeinated = gels.filter((g) => g.caffeineMg > 0);
  const byKey = [...gels].sort((a, b) => a.display.localeCompare(b.display));
  const collections = collectionsFor(gels);
  const fiveK = RACES.find((r) => r.slug === "5k");
  const medianGel = gels
    .filter((g) => g.format === "gel" && g.carbs === Math.round(stats.carbs))
    .sort((a, b) => a.key.localeCompare(b.key))[0];
  const counts = medianGel ? [210, 240, 270].map((m) => ({ m, n: planFor(MARATHON, m, medianGel).schedule.length })) : [];

  const most = (pick: (g: (typeof gels)[number]) => number) =>
    [...gels].sort((a, b) => pick(b) - pick(a) || a.key.localeCompare(b.key))[0];
  const mostCarbs = gels.length ? most((g) => g.carbs) : undefined;
  const mostSodium = gels.length ? most((g) => g.sodiumMg) : undefined;
  const mostCaffeine = gels.length ? most((g) => g.caffeineMg) : undefined;

  const topCaffeineTies = mostCaffeine ? gels.filter((g) => g.caffeineMg === mostCaffeine.caffeineMg).length : 0;

  const faq: FaqItem[] = [];
  if (medianGel && counts.length) {
    faq.push({
      q: "How many gels do I need for a marathon?",
      a: `With a ${medianGel.carbs}g gel, the median size we track: ${counts
        .map(({ m, n }) => `${n} for a ${fmtClock(m)}`)
        .join(", ")}. That's the Fuel Planner's schedule at its defaults, with the last serving about a mile before the finish.`
    });
  }
  faq.push({
    q: "How many carbs per hour should I take in a race?",
    a: `The Fuel Planner starts at ${targetFor(60)}g an hour for efforts under 75 minutes, ${targetFor(120)}g up to 2:30, ${targetFor(
      180
    )}g up to four hours and ${targetFor(300)}g beyond that, for a runner with some fueling practice. Build up to it on long runs.`
  });
  if (fiveK) {
    faq.push({
      q: "Do I need a gel for a 5K?",
      a: "No. The planner schedules nothing for any 5K finish up to an hour: the race is over before the first serving would be due."
    });
  }

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Race fuel", path: "/fuel" }
  ];

  return (
    <div>
      <FuelJsonLd crumbs={crumbs} faq={faq} />
      <section className="tool-hero container">
        <Crumbs crumbs={crumbs} />
        <span className="eyebrow">Race fuel</span>
        <h1>How many gels, which ones, and when</h1>
        <p className={styles.lede}>
          We track {gels.length} gels and chews from {brands.size} brands. Every count on these pages comes from
          the same math as the <Link className={styles.inlineLink} href="/tools/fueling">Fuel Planner</Link>, so
          a 3:45 marathon here gets the same answer it gets there.
        </p>
      </section>

      <section className={`container ${styles.block}`}>
        <h2>Start with your race and finish time</h2>
        <p>
          Each plan gives the carb target, when each serving lands, three lineups from real products and the
          fluid and sodium ranges by weather.
        </p>
        <div>
          {RACES.map((race) => {
            const times = finishTimesFor(race, gels);
            return (
              <div className={styles.raceRow} key={race.slug}>
                <strong>{race.short}</strong>
                {times.length ? (
                  <div className={styles.chips}>
                    {times.map((t) => (
                      <Link key={t} className={styles.chip} href={`/fuel/plan/${race.slug}/${finishSlug(t)}`}>
                        {fmtClock(t)}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p>
                    No plan needed. At any 5K finish up to an hour the planner schedules no serving, because the
                    race ends before the first one is due. Start fed and race.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className={`container ${styles.block}`}>
        <h2>The median gel is {stats.carbs}g of carbs and {stats.sodium}mg of sodium</h2>
        <p>
          {caffeinated.length} of the {gels.length} have caffeine, with a median of {stats.caffeinatedCaffeine}mg
          among those that do.
          {mostCarbs ? (
            <>
              {" "}The biggest serving is <Link href={`/fuel/gels/${mostCarbs.key}`}>{mostCarbs.display}</Link> at{" "}
              {mostCarbs.carbs}g
            </>
          ) : null}
          {mostSodium ? (
            <>
              , the saltiest is <Link href={`/fuel/gels/${mostSodium.key}`}>{mostSodium.display}</Link> at{" "}
              {mostSodium.sodiumMg}mg
            </>
          ) : null}
          {mostCaffeine ? (
            <>
              {" "}and the most caffeine is {mostCaffeine.caffeineMg}mg, in{" "}
              <Link href={`/fuel/gels/${mostCaffeine.key}`}>{mostCaffeine.display}</Link>
              {topCaffeineTies > 1 ? ` and ${topCaffeineTies - 1} other${topCaffeineTies > 2 ? "s" : ""}.` : "."}
            </>
          ) : null}
        </p>
        <div className={styles.chips}>
          {collections.map((c) => (
            <Link key={c.slug} className={styles.chip} href={`/fuel/best/${c.slug}`}>
              {c.title}
            </Link>
          ))}
        </div>
      </section>

      <section className={`container ${styles.block}`}>
        <h2>Every product, with its count for a 4:00 marathon</h2>
        <p>Open any one for finish-time counts, caffeine math and the closest alternatives.</p>
        <GelTable gels={byKey} />
      </section>

      <Faq title="Race fuel questions" items={faq} />

      <section className={`container ${styles.block}`}>
        <PlannerCta text="Your weight, your weather, your finish time: the Fuel Planner turns any of these pages into your own schedule." />
      </section>
    </div>
  );
}
