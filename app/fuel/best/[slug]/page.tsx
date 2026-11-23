import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { pageMetadata } from "@/lib/seo";
import {
  MARATHON,
  RACES,
  collectionsFor,
  comparePairs,
  findCollection,
  getFuelGels,
  listJoin,
  marathonCount,
  median,
  planFor,
  plural,
  ratePerHour,
  statsFor,
  type Collection,
  type Gel
} from "@/lib/content/fuel";
import { Crumbs, Faq, FuelJsonLd, GelTable, PlannerCta, type FaqItem } from "../../_ui/fuel-ui";
import styles from "../../fuel.module.css";

export const revalidate = 86400;
export const dynamicParams = true;

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  return [];
}

type Params = { params: Promise<{ slug: string }> };

const value = (gel: Gel, metric: Collection["metric"]) =>
  metric === "carbs" ? gel.carbs : metric === "caffeine" ? gel.caffeineMg : metric === "sodium" ? gel.sodiumMg : gel.calories;

const unitFor = (metric: Collection["metric"]) =>
  metric === "carbs" ? "g of carbs" : metric === "calories" ? " calories" : `mg of ${metric}`;

/** "7" or "7 to 11". */
const span = (lo: number, hi: number) => (lo === hi ? `${lo}` : `${lo} to ${hi}`);

const resolve = async (slug: string) => {
  const gels = await getFuelGels();
  const collection = findCollection(gels, slug);
  if (!collection) return null;
  const members = gels.filter(collection.filter).sort(collection.sort);
  return { gels, collection, members };
};

const sodiumHour = (gel: Gel) => {
  const plan = planFor(MARATHON, 240, gel);
  return Math.round((gel.sodiumMg * 60) / plan.gelIntervalMinutes);
};

/** Heading and copy written from the list itself. */
const storyFor = (collection: Collection, members: Gel[], gels: Gel[]) => {
  const stats = statsFor(gels);
  const counts = members.map((g) => marathonCount(g));
  const minCount = Math.min(...counts);
  const maxCount = Math.max(...counts);
  const fewest = members.filter((g) => marathonCount(g) === minCount).sort((a, b) => b.carbs - a.carbs || a.key.localeCompare(b.key))[0];
  const medianAll = gels.find((g) => g.carbs === Math.round(stats.carbs) && g.format === "gel");
  const medianCount = medianAll ? marathonCount(medianAll) : undefined;
  const mild = planFor(MARATHON, 240, members[0]).sodiumPerHour;
  const hot = planFor(MARATHON, 240, members[0], "hot").sodiumPerHour;
  const mildLow = Number(/^(\d+)/.exec(mild)?.[1] ?? 0);
  const paragraphs: string[] = [];
  let heading = "";

  switch (collection.slug) {
    case "caffeine-free-gels": {
      const salty = [...members].sort((a, b) => b.sodiumMg - a.sodiumMg || a.key.localeCompare(b.key))[0];
      heading = `${fewest.display} gets a 4:00 marathon done in ${minCount} servings`;
      paragraphs.push(
        `That's the fewest on this list, thanks to ${fewest.carbs}g a serving. A median ${stats.carbs}g gel takes ${medianCount ?? "more"}. The trade is a bigger dose each time, which your stomach should meet on a long run before it meets it in a race.`
      );
      paragraphs.push(
        `If sodium matters more than packet count, ${salty.display} carries ${salty.sodiumMg}mg, the most of any caffeine-free option here.`
      );
      break;
    }
    case "caffeinated-gels": {
      const low = members[0];
      const high = members[members.length - 1];
      heading = `Caffeine runs from ${low.caffeineMg}mg to ${high.caffeineMg}mg a serving`;
      paragraphs.push(
        `"Caffeinated" covers a ${Math.round(high.caffeineMg / low.caffeineMg)}x spread, so the number on the label matters more than the word. Two late servings of ${high.display} is ${high.caffeineMg * 2}mg; two of ${low.display} is ${low.caffeineMg * 2}mg.`
      );
      paragraphs.push(
        `The median caffeinated product we track has ${stats.caffeinatedCaffeine}mg. Count your morning coffee in the same total.`
      );
      break;
    }
    case "high-caffeine-gels": {
      const top = members[0];
      const n = marathonCount(top);
      heading = `${plural(members.length, "product")} at ${Math.min(...members.map((g) => g.caffeineMg))}mg or more, and one or two is the dose`;
      paragraphs.push(
        `Take ${top.display} for all ${n} servings of a 4:00 marathon and you'd be at ${(n * top.caffeineMg).toLocaleString("en-US")}mg. Used for the last two servings it's ${top.caffeineMg * 2}mg, which is how our race plans use caffeine.`
      );
      break;
    }
    case "high-sodium-gels": {
      const covering = members.filter((g) => sodiumHour(g) >= mildLow);
      const top = members[0];
      heading = `${top.display} supplies about ${sodiumHour(top)}mg of sodium an hour`;
      const mildHigh = Number(/-(\d+)/.exec(mild)?.[1] ?? 0);
      const over = members.filter((g) => sodiumHour(g) > mildHigh);
      paragraphs.push(
        `That's on a 4:00 marathon rhythm. The Fuel Planner's starting range is ${mild} an hour in mild weather and ${hot} in the heat. ${
          covering.length === members.length
            ? "At three servings an hour, every gel here reaches the low end of the mild range on its own."
            : covering.length
              ? `${covering.length} of them reach the low end of the mild range on their own; the rest still want a sports drink.`
              : "None of them gets there alone, so plan on a sports drink too."
        }${
          over.length
            ? ` ${over.length > 3 ? `${over.length} of them, led by ${over[0].display},` : listJoin(over.map((g) => g.display))} ${over.length === 1 ? "goes" : "go"} past the top of it, which only pays off on a hot day or if you sweat a lot of salt.`
            : ""
        }`
      );
      paragraphs.push(`For scale, the median product we track has ${stats.sodium}mg.`);
      break;
    }
    case "high-carb-gels":
    case "30g-carb-gels": {
      const fiftyK = RACES.find((r) => r.slug === "50k");
      const chews = members.filter((g) => g.format === "chews");
      heading = `${span(minCount, maxCount)} servings for a 4:00 marathon${
        medianCount ? `, against ${medianCount} for a median ${stats.carbs}g gel` : ""
      }`;
      paragraphs.push(
        `Bigger servings mean fewer stops and fewer wrappers, and they're how you get near the planner's 80g an hour past four hours, since it never schedules servings closer than 20 minutes apart.${
          chews.length ? ` ${listJoin(chews.map((g) => g.display))} ${chews.length === 1 ? "is a chew" : "are chews"}, not gels: you eat them over a few minutes instead of in one squeeze.` : ""
        }`
      );
      if (fiftyK) {
        const p = planFor(fiftyK, 360, fewest);
        paragraphs.push(
          `On a 6:00 50K, ${fewest.display} works out to ${p.schedule.length} servings at ${ratePerHour(fewest, p)}g an hour.`
        );
      }
      break;
    }
    case "low-calorie-gels": {
      const rates = members.map((g) => ratePerHour(g, planFor(MARATHON, 240, g)));
      heading = `Lighter servings mean more of them: ${span(minCount, maxCount)} for a 4:00 marathon`;
      paragraphs.push(
        `Every product here has ${Math.max(...members.map((g) => g.carbs))}g of carbs or less. Past four hours that caps you at ${Math.max(...rates)}g an hour against the planner's 80g, because servings never come closer than 20 minutes apart. They suit a half marathon, where the target is 55g, better than a slow marathon.`
      );
      break;
    }
    default: {
      const carbs = members.map((g) => g.carbs);
      const caf = members.filter((g) => g.caffeineMg > 0);
      const brand = members[0].brand;
      const lo = Math.min(...carbs);
      const hi = Math.max(...carbs);
      heading =
        lo === hi
          ? `Every ${brand} product here carries ${lo}g of carbs`
          : `${brand} runs from ${lo}g to ${hi}g of carbs a serving`;
      paragraphs.push(
        caf.length
          ? `${caf.length} of the ${members.length} ${caf.length === 1 ? "has" : "have"} caffeine: ${listJoin(
              caf.map((g) => `${g.display} at ${g.caffeineMg}mg`)
            )}. Sodium ${
              Math.min(...members.map((g) => g.sodiumMg)) === Math.max(...members.map((g) => g.sodiumMg))
                ? `is ${members[0].sodiumMg}mg across the line`
                : `runs from ${Math.min(...members.map((g) => g.sodiumMg))}mg to ${Math.max(...members.map((g) => g.sodiumMg))}mg`
            }, against a ${stats.sodium}mg median for everything we track.`
          : `None of them has caffeine. Sodium runs from ${Math.min(...members.map((g) => g.sodiumMg))}mg to ${Math.max(
              ...members.map((g) => g.sodiumMg)
            )}mg, against a ${stats.sodium}mg median for everything we track.`
      );
      paragraphs.push(
        `For a 4:00 marathon the line takes ${span(minCount, maxCount)} servings on the Fuel Planner's schedule.`
      );
    }
  }
  return { heading, paragraphs };
};

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const resolved = await resolve(slug);
  if (!resolved) return { title: "List not found" };
  const { collection, members } = resolved;
  const values = members.map((g) => value(g, collection.metric));
  return pageMetadata({
    title: collection.title,
    description: `${collection.kind === "brand" ? `${members[0].brand}: ` : ""}${plural(members.length, "product")} compared on carbs, sodium, caffeine and calories, ${
      Math.min(...values) === Math.max(...values)
        ? `all at ${values[0]}${unitFor(collection.metric)}`
        : `from ${Math.min(...values)} to ${Math.max(...values)}${unitFor(collection.metric)}`
    }, with how many each takes for a 4:00 marathon.`,
    path: `/fuel/best/${collection.slug}`
  });
}

export default async function CollectionPage({ params }: Params) {
  const { slug } = await params;
  const resolved = await resolve(slug);
  if (!resolved) notFound();
  const { gels, collection, members } = resolved;
  const values = members.map((g) => value(g, collection.metric));
  const story = storyFor(collection, members, gels);
  const memberKeys = new Set(members.map((g) => g.key));
  const pairs = Array.from(comparePairs(gels).entries())
    .filter(([, [a, b]]) => memberKeys.has(a.key) && memberKeys.has(b.key))
    .slice(0, 8);
  const others = collectionsFor(gels).filter((c) => c.slug !== collection.slug);
  const traitOthers = others.filter((c) => c.kind === "trait");
  const brandOthers = others.filter((c) => c.kind === "brand");

  const topBy = (pick: (g: Gel) => number) =>
    [...members].sort((a, b) => pick(b) - pick(a) || a.key.localeCompare(b.key))[0];
  const mostCarbs = topBy((g) => g.carbs);
  const counts = members.map((g) => marathonCount(g));
  const faq: FaqItem[] = [
    {
      q:
        collection.kind === "brand"
          ? `Which ${members[0].brand} gel has the most carbs?`
          : `Which of these has the most carbs per serving?`,
      a: `${mostCarbs.display}, with ${mostCarbs.carbs}g. It takes ${marathonCount(mostCarbs)} servings for a 4:00 marathon on the Fuel Planner's schedule.`
    },
    {
      q:
        collection.kind === "brand"
          ? `How many ${members[0].brand} gels do I need for a marathon?`
          : `How many of these do I need for a marathon?`,
      a: `For a 4:00 finish, ${span(Math.min(...counts), Math.max(...counts))}${
        Math.min(...counts) === Math.max(...counts) ? "" : " depending on the product"
      }, using the planner's defaults (mild weather, some fueling practice). Faster runners need fewer: a 3:30 takes ${span(
        Math.min(...members.map((g) => planFor(MARATHON, 210, g).schedule.length)),
        Math.max(...members.map((g) => planFor(MARATHON, 210, g).schedule.length))
      )}.`
    }
  ];

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Race fuel", path: "/fuel" },
    { name: collection.title, path: `/fuel/best/${collection.slug}` }
  ];

  return (
    <div>
      <FuelJsonLd crumbs={crumbs} faq={faq} />
      <section className="tool-hero container">
        <Crumbs crumbs={crumbs} />
        <span className="eyebrow">{collection.title}</span>
        <h1>{collection.h1}</h1>
        <p className={styles.lede}>
          {members.length} of the {gels.length} products we track qualify,{" "}
          {Math.min(...values) === Math.max(...values)
            ? `all at ${values[0]}${unitFor(collection.metric)} a serving.`
            : `from ${Math.min(...values)} to ${Math.max(...values)}${unitFor(collection.metric)} a serving (median ${median(values)}).`}
        </p>
      </section>

      <section className={`container ${styles.block}`}>
        <h2>{story.heading}</h2>
        {story.paragraphs.map((text) => (
          <p key={text}>{text}</p>
        ))}
        <GelTable gels={members} />
        <p>
          Servings come from the Fuel Planner&apos;s schedule with its defaults: mild weather, some fueling
          practice, the last serving about a mile from the finish.
        </p>
      </section>

      {pairs.length ? (
        <section className={`container ${styles.block}`}>
          <h2>The closest calls on this list</h2>
          <ul className={styles.alts}>
            {pairs.map(([pairSlugValue, [a, b]]) => (
              <li key={pairSlugValue}>
                <Link href={`/fuel/compare/${pairSlugValue}`}>
                  {a.display} vs {b.display}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className={`container ${styles.block}`}>
        <h2>Other ways to sort the table</h2>
        <div className={styles.chips}>
          {traitOthers.map((c) => (
            <Link key={c.slug} className={styles.chip} href={`/fuel/best/${c.slug}`}>
              {c.title}
            </Link>
          ))}
        </div>
        <div className={styles.chips}>
          {brandOthers.map((c) => (
            <Link key={c.slug} className={styles.chip} href={`/fuel/best/${c.slug}`}>
              {c.title}
            </Link>
          ))}
        </div>
      </section>

      <Faq title="Quick answers" items={faq} />

      <section className={`container ${styles.block}`}>
        <PlannerCta text="Found one to try? The Fuel Planner builds a schedule around it for your race, finish time and weather." />
      </section>
    </div>
  );
}
