import type { MetadataRoute } from "next";
import { cache } from "react";
import {
  buildFuelingPlan,
  suggestCarbTarget,
  type FuelingInputs,
  type FuelingPlan,
  type FuelingProduct
} from "@/lib/fueling";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { SITE_URL } from "@/lib/seo";

/*
 * Race fuel content: every number on /fuel pages comes from the fuel_gels
 * table or from lib/fueling.ts, the same math the Fuel Planner runs. Nothing
 * here invents a second set of fueling rules; it only picks inputs (the
 * planner's own defaults) and describes the outputs.
 */

// ---------- Gels ----------

export type Gel = FuelingProduct & {
  key: string;
  display: string;
  format: "gel" | "chews";
  brandSlug: string;
  caffeineMg: number;
  sodiumMg: number;
  imageUrl?: string;
};

type GelRow = {
  item_key: string;
  brand: string;
  name: string;
  carbs_g: number | null;
  caffeine_mg: number | null;
  sodium_mg: number | null;
  calories: number | null;
  notes: string | null;
  image_url: string | null;
  product_url: string | null;
};

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const BRAND_SHORT: Record<string, string> = { "Science in Sport": "SiS" };

const displayNameFor = (brand: string, name: string) => {
  const lowerName = name.toLowerCase();
  const brandFirst = brand.split(" ")[0].toLowerCase();
  const short = BRAND_SHORT[brand]?.toLowerCase();
  if (lowerName.startsWith(brandFirst) || (short && lowerName.startsWith(short))) {
    return name;
  }
  return `${brand} ${name}`;
};

// Same sanity bounds the Fuel Planner applies before it will schedule a
// product: the table also holds a few scraped news rows with no nutrition.
const isUsable = (gel: { carbs: number; calories: number; name: string }) =>
  gel.carbs >= 15 &&
  gel.carbs <= 50 &&
  gel.calories >= 60 &&
  gel.calories <= 250 &&
  gel.name.length <= 90;

const mapRow = (row: GelRow): Gel => {
  const name = String(row.name).trim();
  const brand = String(row.brand).trim();
  const notes = row.notes ? String(row.notes).trim() : undefined;
  const chews = /\bchews?\b/i.test(name) || /chew format/i.test(notes ?? "");
  return {
    id: row.item_key,
    key: row.item_key,
    name,
    brand,
    display: displayNameFor(brand, name),
    format: chews ? "chews" : "gel",
    brandSlug: slugify(brand),
    carbs: Number(row.carbs_g) || 0,
    calories: Number(row.calories) || 0,
    sodiumMg: Number(row.sodium_mg) || 0,
    caffeineMg: Number(row.caffeine_mg) || 0,
    notes,
    productUrl: row.product_url ?? undefined,
    imageUrl: row.image_url ?? undefined
  };
};

/** Active, usable gels, sorted by item_key. Throws on DB errors so ISR keeps the last good page. */
export const getFuelGels = cache(async (): Promise<Gel[]> => {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];
  const { data, error } = (await supabase
    .from("fuel_gels")
    .select(
      "item_key, brand, name, carbs_g, caffeine_mg, sodium_mg, calories, notes, image_url, product_url"
    )
    .eq("is_active", true)
    .order("item_key")) as { data: GelRow[] | null; error: { message: string } | null };
  if (error) {
    throw new Error(`Failed to load fuel_gels: ${error.message}`);
  }
  return (data ?? [])
    .filter((row) => row.item_key && row.name && row.brand)
    .map(mapRow)
    .filter(isUsable);
});

export const findGel = (gels: Gel[], key: string) => gels.find((gel) => gel.key === key);

// ---------- Formatting ----------

export const fmtClock = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (!h) return `${m} min`;
  return `${h}:${m.toString().padStart(2, "0")}`;
};

export const finishSlug = (minutes: number) =>
  `${Math.floor(minutes / 60)}-${(minutes % 60).toString().padStart(2, "0")}`;

export const parseFinishSlug = (slug: string) => {
  const match = /^(\d{1,2})-(\d{2})$/.exec(slug);
  if (!match) return null;
  const mins = Number(match[2]);
  if (mins >= 60) return null;
  return Number(match[1]) * 60 + mins;
};

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export const listJoin = (items: string[]) => {
  if (items.length <= 1) return items.join("");
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
};

export const median = (values: number[]) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

const round1 = (value: number) => Math.round(value * 10) / 10;

// ---------- Races and plans ----------

export type Race = {
  slug: string;
  label: string;
  short: string;
  miles: number;
  /** Finish times (minutes) that get a page, on 15-minute steps. */
  from: number;
  to: number;
};

/*
 * Windows run from roughly a fast amateur to a long walk-run. The 5K has no
 * pages: lib/fueling.ts schedules no serving for any 5K up to an hour (its
 * shortest gap is 45 minutes at that length and the last serving must come a
 * mile before the line). The 10K starts at 1:00 for the same reason.
 */
export const RACES: Race[] = [
  { slug: "5k", label: "5K", short: "5K", miles: 3.1, from: 0, to: -1 },
  { slug: "10k", label: "10K", short: "10K", miles: 6.2, from: 60, to: 120 },
  { slug: "half-marathon", label: "half marathon", short: "Half", miles: 13.1, from: 75, to: 210 },
  { slug: "marathon", label: "marathon", short: "Marathon", miles: 26.2, from: 150, to: 390 },
  { slug: "50k", label: "50K", short: "50K", miles: 31.1, from: 210, to: 480 }
];

export const findRace = (slug: string) => RACES.find((race) => race.slug === slug);

export const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

/** The Fuel Planner's starting assumptions; pages say so wherever numbers appear. */
export const PLANNER_DEFAULTS = {
  weightLbs: 155,
  experience: "some" as FuelingInputs["experience"],
  temperature: "moderate" as FuelingInputs["temperature"]
};

export const TEMPERATURES: { id: FuelingInputs["temperature"]; label: string }[] = [
  { id: "cool", label: "Cool (below about 50°F)" },
  { id: "moderate", label: "Mild" },
  { id: "warm", label: "Warm" },
  { id: "hot", label: "Hot" }
];

export const planFor = (
  race: Race,
  minutes: number,
  gel: Gel,
  temperature: FuelingInputs["temperature"] = PLANNER_DEFAULTS.temperature
): FuelingPlan =>
  buildFuelingPlan({
    distanceMiles: race.miles,
    distanceLabel: race.label,
    goalTimeMinutes: minutes,
    weightLbs: PLANNER_DEFAULTS.weightLbs,
    experience: PLANNER_DEFAULTS.experience,
    temperature,
    gelId: gel.id,
    gels: [gel]
  });

export const targetFor = (minutes: number) =>
  suggestCarbTarget(minutes, PLANNER_DEFAULTS.experience);

/** Carbs an hour while the schedule runs: one serving per interval. */
export const ratePerHour = (gel: Gel, plan: FuelingPlan) =>
  Math.round((gel.carbs * 60) / plan.gelIntervalMinutes);

const referenceGel = (gels: Gel[]) => {
  const mid = median(gels.map((gel) => gel.carbs));
  return [...gels].sort(
    (a, b) => Math.abs(a.carbs - mid) - Math.abs(b.carbs - mid) || a.key.localeCompare(b.key)
  )[0];
};

/** Finish times with a page: a serving has to fit in the plan for a median gel. */
export const finishTimesFor = (race: Race, gels: Gel[]) => {
  const ref = referenceGel(gels);
  if (!ref) return [];
  const times: number[] = [];
  for (let t = race.from; t <= race.to; t += 15) {
    if (planFor(race, t, ref).schedule.length > 0) times.push(t);
  }
  return times;
};

// ---------- Medians and neighbours ----------

export type GelStats = {
  carbs: number;
  sodium: number;
  caffeine: number;
  calories: number;
  caffeinatedCaffeine: number;
};

export const statsFor = (gels: Gel[]): GelStats => ({
  carbs: median(gels.map((gel) => gel.carbs)),
  sodium: median(gels.map((gel) => gel.sodiumMg)),
  caffeine: median(gels.map((gel) => gel.caffeineMg)),
  calories: median(gels.map((gel) => gel.calories)),
  caffeinatedCaffeine: median(gels.filter((gel) => gel.caffeineMg > 0).map((gel) => gel.caffeineMg))
});

// Scales chosen so a step of each counts about the same to a runner: 4g carbs,
// 60mg sodium, 30mg caffeine, 40 kcal.
const distance = (a: Gel, b: Gel) =>
  Math.sqrt(
    ((a.carbs - b.carbs) / 4) ** 2 +
      ((a.sodiumMg - b.sodiumMg) / 60) ** 2 +
      ((a.caffeineMg - b.caffeineMg) / 30) ** 2 +
      ((a.calories - b.calories) / 40) ** 2
  );

/** About five closest gels, at most two from the gel's own brand. */
export const neighboursOf = (gel: Gel, gels: Gel[], count = 5) => {
  const ranked = gels
    .filter((other) => other.key !== gel.key)
    .map((other) => ({ other, d: distance(gel, other) }))
    .sort((a, b) => a.d - b.d || a.other.key.localeCompare(b.other.key));
  const picks: Gel[] = [];
  let sameBrand = 0;
  for (const { other } of ranked) {
    if (other.brand === gel.brand) {
      if (sameBrand >= 2) continue;
      sameBrand += 1;
    }
    picks.push(other);
    if (picks.length === count) break;
  }
  return picks;
};

export const pairSlug = (a: string, b: string) => {
  const [first, second] = [a, b].sort();
  return `${first}-vs-${second}`;
};

export const parsePairSlug = (slug: string) => {
  const parts = slug.split("-vs-");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  return { a: parts[0], b: parts[1] };
};

/** Every comparison page: each gel paired with its neighbours and its caffeine sibling, deduplicated. */
export const comparePairs = (gels: Gel[]) => {
  const pairs = new Map<string, [Gel, Gel]>();
  for (const gel of gels) {
    const sibling = siblingOf(gel, gels);
    for (const other of [...neighboursOf(gel, gels), ...(sibling ? [sibling] : [])]) {
      const [first, second] = [gel, other].sort((x, y) => x.key.localeCompare(y.key));
      pairs.set(pairSlug(first.key, second.key), [first, second]);
    }
  }
  return pairs;
};

/** Pairs a gel already appears in, for linking from its page. */
export const pairsForGel = (gel: Gel, gels: Gel[]) =>
  Array.from(comparePairs(gels).entries())
    .filter(([, pair]) => pair[0].key === gel.key || pair[1].key === gel.key)
    .map(([slug, pair]) => ({ slug, other: pair[0].key === gel.key ? pair[1] : pair[0] }));

const CAFFEINE_WORDS = new Set(["caffeine", "caffeinated", "caf", "plus", "with"]);
const nameTokens = (gel: Gel) =>
  new Set(
    gel.name
      .toLowerCase()
      .replace(/[^a-z0-9 ]+/g, " ")
      .split(/\s+/)
      .filter((token) => token && !CAFFEINE_WORDS.has(token) && !/^\d+mg$/.test(token))
  );
const sameLine = (a: Gel, b: Gel) => {
  const [x, y] = [nameTokens(a), nameTokens(b)];
  const [small, big] = x.size <= y.size ? [x, y] : [y, x];
  return Array.from(small).every((token) => big.has(token));
};

/** The other caffeine level of the same product line, if the table has one. */
export const siblingOf = (gel: Gel, gels: Gel[]) =>
  gels
    .filter(
      (other) =>
        other.key !== gel.key &&
        other.brand === gel.brand &&
        sameLine(gel, other) &&
        Math.abs(other.carbs - gel.carbs) <= 3 &&
        Math.abs(other.sodiumMg - gel.sodiumMg) <= 10 &&
        Math.abs(other.calories - gel.calories) <= 10 &&
        (other.caffeineMg > 0) !== (gel.caffeineMg > 0)
    )
    .sort((a, b) => a.caffeineMg - b.caffeineMg || a.key.localeCompare(b.key))[0];

const signed = (value: number, unit: string) =>
  `${value > 0 ? "+" : value < 0 ? "-" : ""}${Math.abs(value)}${unit}`;

/** How another gel differs from this one, in label units. */
export const diffLine = (gel: Gel, other: Gel) => {
  const parts: string[] = [];
  const dc = other.carbs - gel.carbs;
  const ds = other.sodiumMg - gel.sodiumMg;
  const dk = other.caffeineMg - gel.caffeineMg;
  const dcal = other.calories - gel.calories;
  if (dc) parts.push(`${signed(dc, "g")} carbs`);
  if (Math.abs(ds) >= 5) parts.push(`${signed(ds, "mg")} sodium`);
  if (dk) parts.push(`${signed(dk, "mg")} caffeine`);
  if (Math.abs(dcal) >= 10) parts.push(`${signed(dcal, "")} kcal`);
  return parts.length ? parts.join(", ") : "the same label numbers";
};

/** Calories beyond the carbs (4 kcal per gram): fat or protein in the packet. */
export const nonCarbCalories = (gel: Gel) => Math.max(0, gel.calories - gel.carbs * 4);

// ---------- Lineups for a plan page ----------

export type Lineup = {
  id: "steady" | "caffeine" | "fewest";
  title: string;
  servings: { timeMinutes: number; mile: number; gel: Gel }[];
  base: Gel;
  late?: Gel;
  plan: FuelingPlan;
  rate: number;
  totalCarbs: number;
  totalCaffeine: number;
  sodiumPerHour: number;
};

const lineupFrom = (
  id: Lineup["id"],
  title: string,
  race: Race,
  minutes: number,
  base: Gel,
  late?: Gel,
  lateCount = 0
): Lineup => {
  const plan = planFor(race, minutes, base);
  const swapFrom = plan.schedule.length - lateCount;
  const servings = plan.schedule.map((step, index) => ({
    timeMinutes: step.timeMinutes,
    mile: step.mile,
    gel: late && index >= swapFrom ? late : base
  }));
  return {
    id,
    title,
    servings,
    base,
    late,
    plan,
    rate: ratePerHour(base, plan),
    totalCarbs: servings.reduce((sum, s) => sum + s.gel.carbs, 0),
    totalCaffeine: servings.reduce((sum, s) => sum + s.gel.caffeineMg, 0),
    sodiumPerHour: Math.round((base.sodiumMg * 60) / plan.gelIntervalMinutes)
  };
};

/**
 * Three ways to hit the planner's target from the real table:
 * the caffeine-free gel whose rhythm lands closest to the target, the same
 * plan with the last servings swapped for a caffeinated gel of the same size,
 * and the gel that gets there with the fewest packets.
 */
export const lineupsFor = (race: Race, minutes: number, gels: Gel[]): Lineup[] => {
  const target = targetFor(minutes);
  const scored = gels
    .map((gel) => {
      const plan = planFor(race, minutes, gel);
      const rate = ratePerHour(gel, plan);
      return { gel, plan, rate, gap: Math.abs(rate - target) };
    })
    .filter((row) => row.plan.schedule.length > 0);
  if (!scored.length) return [];

  // Among gels within 2g an hour of the best fit, prefer a mostly-carb gel
  // whose sodium lands nearest the middle of the planner's mild-weather range.
  const sodiumMid = (() => {
    const match = /^(\d+)-(\d+)/.exec(scored[0].plan.sodiumPerHour);
    return match ? (Number(match[1]) + Number(match[2])) / 2 : 400;
  })();
  const sodiumHr = (row: (typeof scored)[number]) => (row.gel.sodiumMg * 60) / row.plan.gelIntervalMinutes;
  const pickSteady = (pool: typeof scored) => {
    if (!pool.length) return undefined;
    const best = Math.min(...pool.map((row) => row.gap));
    return pool
      .filter((row) => row.gap <= best + 2)
      .sort(
        (a, b) =>
          Number(nonCarbCalories(a.gel) >= 20) - Number(nonCarbCalories(b.gel) >= 20) ||
          Math.abs(sodiumHr(a) - sodiumMid) - Math.abs(sodiumHr(b) - sodiumMid) ||
          a.gap - b.gap ||
          a.gel.key.localeCompare(b.gel.key)
      )[0];
  };
  const steady =
    pickSteady(scored.filter((row) => row.gel.caffeineMg === 0 && row.gel.format === "gel")) ??
    (pickSteady(scored) as (typeof scored)[number]);

  const lineups: Lineup[] = [
    lineupFrom("steady", "Closest to the target, no caffeine", race, minutes, steady.gel)
  ];

  const n = steady.plan.schedule.length;
  const lateCount = n >= 4 ? 2 : 1;
  const late = gels
    .filter(
      (gel) =>
        gel.caffeineMg > 0 &&
        gel.format === "gel" &&
        Math.abs(gel.carbs - steady.gel.carbs) <= 3
    )
    .sort(
      (a, b) =>
        Number(b.brand === steady.gel.brand) - Number(a.brand === steady.gel.brand) ||
        Math.abs(a.carbs - steady.gel.carbs) - Math.abs(b.carbs - steady.gel.carbs) ||
        Number(nonCarbCalories(a) >= 20) - Number(nonCarbCalories(b) >= 20) ||
        a.caffeineMg - b.caffeineMg ||
        a.key.localeCompare(b.key)
    )[0];
  if (late) {
    lineups.push(
      lineupFrom(
        "caffeine",
        n === 1 ? "One caffeinated serving" : lateCount === 1 ? "Caffeine in the last serving" : "Caffeine in the last two servings",
        race,
        minutes,
        steady.gel,
        late,
        lateCount
      )
    );
  }

  const fewest = scored
    .filter((row) => row.gel.key !== steady.gel.key && row.rate >= target * 0.85)
    .sort(
      (a, b) =>
        a.plan.schedule.length - b.plan.schedule.length ||
        a.gap - b.gap ||
        a.gel.caffeineMg - b.gel.caffeineMg ||
        Number(nonCarbCalories(a.gel) >= 20) - Number(nonCarbCalories(b.gel) >= 20) ||
        a.gel.key.localeCompare(b.gel.key)
    )[0];
  if (fewest && fewest.plan.schedule.length < n) {
    lineups.push(lineupFrom("fewest", "Fewest packets to carry", race, minutes, fewest.gel));
  }

  return lineups;
};

// ---------- Collections ----------

export type Collection = {
  slug: string;
  title: string;
  h1: string;
  kind: "trait" | "brand";
  filter: (gel: Gel) => boolean;
  sort: (a: Gel, b: Gel) => number;
  metric: "carbs" | "caffeine" | "sodium" | "calories";
};

const byKey = (a: Gel, b: Gel) => a.key.localeCompare(b.key);

const TRAIT_COLLECTIONS: Collection[] = [
  {
    slug: "caffeine-free-gels",
    title: "Caffeine-Free Energy Gels",
    h1: "Caffeine-free gels, ranked by carbs per packet",
    kind: "trait",
    filter: (gel) => gel.caffeineMg === 0,
    sort: (a, b) => b.carbs - a.carbs || byKey(a, b),
    metric: "carbs"
  },
  {
    slug: "caffeinated-gels",
    title: "Caffeinated Energy Gels",
    h1: "Every caffeinated gel we track, from a nudge to a double espresso",
    kind: "trait",
    filter: (gel) => gel.caffeineMg > 0,
    sort: (a, b) => a.caffeineMg - b.caffeineMg || byKey(a, b),
    metric: "caffeine"
  },
  {
    slug: "high-caffeine-gels",
    title: "High-Caffeine Energy Gels (75mg+)",
    h1: "High-caffeine gels: 75mg or more in one packet",
    kind: "trait",
    filter: (gel) => gel.caffeineMg >= 75,
    sort: (a, b) => b.caffeineMg - a.caffeineMg || byKey(a, b),
    metric: "caffeine"
  },
  {
    slug: "high-sodium-gels",
    title: "High-Sodium Energy Gels (100mg+)",
    h1: "High-sodium gels: 100mg or more per packet",
    kind: "trait",
    filter: (gel) => gel.sodiumMg >= 100,
    sort: (a, b) => b.sodiumMg - a.sodiumMg || byKey(a, b),
    metric: "sodium"
  },
  {
    slug: "high-carb-gels",
    title: "High-Carb Gels and Chews (40g+)",
    h1: "40 grams or more in one serving",
    kind: "trait",
    filter: (gel) => gel.carbs >= 40,
    sort: (a, b) => b.carbs - a.carbs || byKey(a, b),
    metric: "carbs"
  },
  {
    slug: "30g-carb-gels",
    title: "Energy Gels With 30g+ Carbs",
    h1: "Gels with 30 grams of carbs or more",
    kind: "trait",
    filter: (gel) => gel.carbs >= 30,
    sort: (a, b) => b.carbs - a.carbs || byKey(a, b),
    metric: "carbs"
  },
  {
    slug: "low-calorie-gels",
    title: "Low-Calorie Energy Gels (90 kcal or less)",
    h1: "Gels at 90 calories or less",
    kind: "trait",
    filter: (gel) => gel.calories <= 90,
    sort: (a, b) => a.calories - b.calories || b.carbs - a.carbs || byKey(a, b),
    metric: "calories"
  }
];

export const MIN_COLLECTION = 3;

export const collectionsFor = (gels: Gel[]): Collection[] => {
  const brands = new Map<string, string>();
  gels.forEach((gel) => brands.set(gel.brandSlug, gel.brand));
  const brandCollections: Collection[] = Array.from(brands.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([slug, brand]) => ({
      slug: `${slug}-gels`,
      title: `${brand} Gels Compared`,
      h1: `Every ${brand} gel we track, side by side`,
      kind: "brand" as const,
      filter: (gel: Gel) => gel.brandSlug === slug,
      sort: (a: Gel, b: Gel) => a.caffeineMg - b.caffeineMg || b.carbs - a.carbs || byKey(a, b),
      metric: "carbs" as const
    }));
  return [...TRAIT_COLLECTIONS, ...brandCollections].filter(
    (collection) => gels.filter(collection.filter).length >= MIN_COLLECTION
  );
};

export const findCollection = (gels: Gel[], slug: string) =>
  collectionsFor(gels).find((collection) => collection.slug === slug);

// ---------- Common reference points ----------

/** Finish times shown on every gel page. */
export const GEL_PAGE_TIMES: { race: string; minutes: number[] }[] = [
  { race: "half-marathon", minutes: [90, 120, 150] },
  { race: "marathon", minutes: [180, 210, 240, 270, 300] }
];

export const MARATHON = RACES.find((race) => race.slug === "marathon") as Race;
export const HALF = RACES.find((race) => race.slug === "half-marathon") as Race;

/** Packets for a 4:00 marathon, the reference count used across comparisons. */
export const marathonCount = (gel: Gel, minutes = 240) => planFor(MARATHON, minutes, gel).schedule.length;

// ---------- Sitemap ----------

export async function getFuelContentSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const gels = await getFuelGels();
  if (!gels.length) return [];
  const base = `${SITE_URL}/fuel`;
  const entries: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "weekly", priority: 0.7 }
  ];
  for (const race of RACES) {
    for (const minutes of finishTimesFor(race, gels)) {
      entries.push({
        url: `${base}/plan/${race.slug}/${finishSlug(minutes)}`,
        changeFrequency: "monthly",
        priority: 0.6
      });
    }
  }
  for (const gel of gels) {
    entries.push({ url: `${base}/gels/${gel.key}`, changeFrequency: "monthly", priority: 0.6 });
  }
  for (const collection of collectionsFor(gels)) {
    entries.push({ url: `${base}/best/${collection.slug}`, changeFrequency: "monthly", priority: 0.6 });
  }
  for (const slug of comparePairs(gels).keys()) {
    entries.push({ url: `${base}/compare/${slug}`, changeFrequency: "monthly", priority: 0.5 });
  }
  return entries;
}

export { round1 };
