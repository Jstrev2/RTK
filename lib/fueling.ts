/*
 * Race fueling math. One function, planFuel(), turns a race, a finish time
 * and a product into a timeline of servings. The Fuel Finder, every
 * /fuel/plan page and every product page run it, so they always agree.
 *
 * The rules, in plain terms (sources: ACSM/IOC consensus on carbohydrate
 * during exercise; Jeukendrup 2014; Burke et al. 2011):
 *   - Under an hour, stored glycogen covers it. No fuel.
 *   - 60 to 75 minutes: one serving helps some runners; it's optional.
 *   - Longer: carbs at a steady rhythm to hit a target per hour that grows
 *     with time on your feet (30 to 65g standard), higher for a trained gut.
 *   - Walk-run pace (slower than 13:00 a mile): at most 45g an hour.
 *   - Nothing in the last 15 minutes: it won't reach your legs before the line.
 *   - Caffeine in the second half, about 3mg per kg (200mg for a 70kg runner), never 300mg+.
 */

export const FUEL_TYPES = ["gel", "chew", "drink", "bar", "electrolyte"] as const;
export type FuelType = (typeof FUEL_TYPES)[number];

export type FuelProduct = {
  key: string;
  brand: string;
  name: string;
  /** "GU Energy Gel": brand + name, for cards and timelines. */
  display: string;
  type: FuelType;
  carbs: number;
  caffeineMg: number;
  sodiumMg: number;
  calories: number;
  servingSize?: string;
  flavors: string[];
  priceUsd?: number;
  imageUrl?: string;
  productUrl?: string;
  notes?: string;
  releaseNote?: string;
};

export type Gut = "light" | "standard" | "trained";

export type RaceDef = {
  slug: string;
  label: string;
  short: string;
  miles: number;
  /** Slider range in minutes: roughly the world's best to a steady walk. */
  min: number;
  max: number;
  /** Where the slider starts. */
  start: number;
};

export const RACE_DEFS: RaceDef[] = [
  { slug: "5k", label: "5K", short: "5K", miles: 3.107, min: 13, max: 75, start: 28 },
  { slug: "10k", label: "10K", short: "10K", miles: 6.214, min: 27, max: 150, start: 55 },
  { slug: "half-marathon", label: "half marathon", short: "Half", miles: 13.109, min: 58, max: 240, start: 120 },
  { slug: "marathon", label: "marathon", short: "Marathon", miles: 26.219, min: 122, max: 480, start: 240 },
  { slug: "50k", label: "50K", short: "50K", miles: 31.069, min: 160, max: 600, start: 330 }
];

export const findRaceDef = (slug: string) => RACE_DEFS.find((race) => race.slug === slug);

/** Slider range for any distance: 4:30 a mile (elite) to 20:00 a mile (walking). */
export const rangeForMiles = (miles: number) => ({
  min: Math.max(10, Math.round(miles * 4.5)),
  max: Math.max(30, Math.round(miles * 20)),
  start: Math.round(miles * 10)
});

/** Only products with carbs can be scheduled; electrolyte tabs and caps can't fuel a race. */
export const isPlannable = (product: Pick<FuelProduct, "type" | "carbs">) =>
  product.type !== "electrolyte" && product.carbs >= 10;

export const NO_FUEL_UNDER = 60;
const OPTIONAL_UNDER = 75;
const LAST_WINDOW = 15;
const FIRST_NOT_BEFORE = 20;
const CAFFEINE_AIM = 200;
const WALK_PACE = 13;
const CAFFEINE_MAX = 300;

/** Grams of carbs an hour to aim for. */
export const carbTargetFor = (minutes: number, gut: Gut = "standard") => {
  const base = minutes < OPTIONAL_UNDER ? 30 : minutes < 120 ? 45 : minutes < 150 ? 55 : 65;
  if (gut === "light") return Math.max(30, base - 20);
  if (gut === "trained") return minutes < OPTIONAL_UNDER ? base : Math.min(100, base + 25);
  return base;
};

export type Serving = {
  /** Minutes after the start. */
  at: number;
  mile: number;
  product: FuelProduct;
};

export type FuelPlan = {
  minutes: number;
  miles: number;
  product: FuelProduct;
  /** Caffeinated product swapped in for the last servings, if any. */
  late?: FuelProduct;
  need: "none" | "optional" | "yes";
  target: number;
  servings: Serving[];
  /** Minutes between servings (0 when there is one or none). */
  every: number;
  /** Carbs an hour the timeline actually delivers. */
  carbsPerHour: number;
  /** Servings to carry: the timeline plus one spare once there are three or more. */
  pack: number;
  spare: number;
  totalCarbs: number;
  totalCaffeine: number;
  sodiumPerHour: number;
};

export function planFuel({
  minutes,
  miles,
  product,
  gut = "standard",
  target: forcedTarget,
  late
}: {
  minutes: number;
  miles: number;
  product: FuelProduct;
  gut?: Gut;
  target?: number;
  /** Swap the last servings for this caffeinated product (count chosen for about 200mg). */
  late?: FuelProduct;
}): FuelPlan {
  // Walk-run pace (slower than 13:00 a mile) burns more fat and less carbohydrate: cap the target at 45g.
  const target = forcedTarget ?? (minutes / miles > WALK_PACE ? Math.min(45, carbTargetFor(minutes, gut)) : carbTargetFor(minutes, gut));
  const need: FuelPlan["need"] = minutes < NO_FUEL_UNDER ? "none" : minutes < OPTIONAL_UNDER ? "optional" : "yes";
  const pace = minutes / miles;
  const times: number[] = [];

  if (need !== "none" && isPlannable(product)) {
    const cutoff = minutes - LAST_WINDOW;
    const interval = Math.max(12, (product.carbs / target) * 60);
    if (need === "optional") {
      times.push(Math.round(Math.min(interval, cutoff * 0.7)));
    } else {
      for (let t = Math.max(interval, FIRST_NOT_BEFORE); t <= cutoff + 0.5; t += interval) times.push(Math.round(t));
      if (!times.length) times.push(Math.round(cutoff * 0.7));
    }
  }

  const n = times.length;
  const lateCount =
    late && late.caffeineMg > 0 && n
      ? Math.max(1, Math.min(Math.ceil(n / 2), Math.floor(CAFFEINE_MAX / late.caffeineMg), Math.round(CAFFEINE_AIM / late.caffeineMg)))
      : 0;
  const servings: Serving[] = times.map((at, i) => ({
    at,
    mile: Math.round((at / pace) * 10) / 10,
    product: late && i >= n - lateCount ? late : product
  }));
  const hours = minutes / 60;
  const sum = (pick: (p: FuelProduct) => number) => servings.reduce((total, s) => total + pick(s.product), 0);
  return {
    minutes,
    miles,
    product,
    late: lateCount ? late : undefined,
    need,
    target,
    servings,
    every: n > 1 ? Math.round((times[n - 1] - times[0]) / (n - 1)) : 0,
    carbsPerHour: n ? Math.round(sum((p) => p.carbs) / hours) : 0,
    pack: n >= 3 ? n + 1 : n,
    spare: n >= 3 ? 1 : 0,
    totalCarbs: sum((p) => p.carbs),
    totalCaffeine: sum((p) => p.caffeineMg),
    sodiumPerHour: n ? Math.round(sum((p) => p.sodiumMg) / hours) : 0
  };
}

/** What a runner calls one serving of this kind of product. */
export const unitFor = (type: FuelType, count = 1) => {
  const one = type === "drink" ? "bottle" : type === "bar" ? "bar" : type === "chew" ? "serving" : type === "electrolyte" ? "dose" : "gel";
  return count === 1 ? one : `${one}s`;
};

/** "0:45", "3:05" clock for minutes after the start. */
export const clock = (minutes: number) => {
  const total = Math.round(minutes);
  return `${Math.floor(total / 60)}:${(total % 60).toString().padStart(2, "0")}`;
};

/** Finish time label: "45 min" under an hour, "3:30" from there. */
export const finishLabel = (minutes: number) => (minutes < 60 ? `${Math.round(minutes)} min` : clock(minutes));

export const paceLabel = (minutes: number, miles: number) => {
  const seconds = Math.round((minutes / miles) * 60);
  return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}/mi`;
};

export type FuelPick = { id: "classic" | "fewest" | "caffeine"; label: string; plan: FuelPlan };

const byKey = (a: FuelProduct, b: FuelProduct) => a.key.localeCompare(b.key);

/** The caffeinated gel closest in size to a base gel, same brand first. */
export const caffeinatedPartner = (base: FuelProduct, products: FuelProduct[]) =>
  products
    .filter((p) => p.caffeineMg > 0 && p.type === base.type && isPlannable(p) && Math.abs(p.carbs - base.carbs) <= 8)
    .sort(
      (a, b) =>
        Number(b.brand === base.brand) - Number(a.brand === base.brand) ||
        Math.abs(a.carbs - base.carbs) - Math.abs(b.carbs - base.carbs) ||
        Math.abs(a.caffeineMg - 75) - Math.abs(b.caffeineMg - 75) ||
        byKey(a, b)
    )[0];

/**
 * Three ways to fuel a race from the real catalog: the classic default, the
 * gel that needs the fewest packets, and the classic with caffeine in the
 * last servings. Pocket fuel only (gels and chews).
 */
export function picksFor({
  minutes,
  miles,
  products,
  defaultKey,
  gut = "standard"
}: {
  minutes: number;
  miles: number;
  products: FuelProduct[];
  defaultKey?: string;
  gut?: Gut;
}): FuelPick[] {
  const pocket = products.filter((p) => (p.type === "gel" || p.type === "chew") && isPlannable(p));
  if (!pocket.length || minutes < NO_FUEL_UNDER) return [];
  const plan = (product: FuelProduct, late?: FuelProduct) => planFuel({ minutes, miles, product, gut, late });

  const classic =
    pocket.find((p) => p.key === defaultKey) ??
    [...pocket]
      .filter((p) => p.caffeineMg === 0 && p.type === "gel")
      .sort((a, b) => Math.abs(a.carbs - 25) - Math.abs(b.carbs - 25) || byKey(a, b))[0] ??
    pocket[0];
  const base = plan(classic);
  const picks: FuelPick[] = [{ id: "classic", label: "The classic", plan: base }];

  const fewest = pocket
    .filter((p) => p.caffeineMg === 0 && p.type === "gel" && p.key !== classic.key && p.carbs <= 60)
    .sort((a, b) => b.carbs - a.carbs || a.sodiumMg - b.sodiumMg || byKey(a, b))[0];
  if (fewest) {
    const fewer = plan(fewest);
    if (fewer.servings.length < base.servings.length) picks.push({ id: "fewest", label: "Fewest to carry", plan: fewer });
  }

  const partner = caffeinatedPartner(classic, pocket);
  if (partner && base.servings.length) picks.push({ id: "caffeine", label: "Caffeine late", plan: plan(classic, partner) });
  return picks;
}

/** Plan page address part for a finish time: 225 -> "3-45". */
export const finishSlug = (minutes: number) =>
  `${Math.floor(minutes / 60)}-${(minutes % 60).toString().padStart(2, "0")}`;

/** Finish times with a /fuel/plan page: 15-minute steps across each race's slider range. */
export const planTimesFor = (race: RaceDef) => {
  const times: number[] = [];
  for (let t = Math.ceil(race.min / 15) * 15; t <= race.max; t += 15) {
    // The 5K only gets pages where the math gives a serving (walkers).
    if (race.slug === "5k" && t < NO_FUEL_UNDER) continue;
    times.push(t);
  }
  return times;
};
