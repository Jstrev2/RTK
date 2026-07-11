import type { Shoe } from "./data";

/** Row shape returned by Supabase shoe_models table. */
export type DbShoe = {
  id: string;
  item_key: string;
  name: string;
  brand: string;
  price: number | null;
  usage_types: string[];
  foot_strike: string[];
  cadence: string[];
  toe_box: string | null;
  cushion: string | null;
  stability: string | null;
  surfaces: string[];
  weight_range: string | null;
  stack: number | null;
  drop: number | null;
  weight_mens: number | null;
  weight_womens: number | null;
  description: string | null;
  pros: string[];
  cons: string[];
  popularity: number;
  release_date: string | null;
  release_year: number | null;
  product_url: string | null;
  retailer_url: string | null;
  is_active: boolean;
};

/** Map a Supabase shoe_models row to the Shoe type used by the UI. */
export const mapDbShoe = (row: DbShoe): Shoe => {
  const currentYear = new Date().getFullYear();
  return {
    id: row.item_key,
    name: row.name,
    brand: row.brand,
    price: row.price ?? 0,
    usageTypes: row.usage_types ?? [],
    footStrike: row.foot_strike ?? [],
    cadence: row.cadence ?? [],
    toeBox: (row.toe_box as Shoe["toeBox"]) ?? "standard",
    cushion: (row.cushion as Shoe["cushion"]) ?? "moderate",
    stability: (row.stability as Shoe["stability"]) ?? "neutral",
    surfaces: row.surfaces ?? [],
    weightRange: (row.weight_range as Shoe["weightRange"]) ?? "all",
    stack: row.stack ?? 0,
    drop: row.drop ?? 0,
    weightMens: row.weight_mens ?? 0,
    weightWomens: row.weight_womens ?? 0,
    description: row.description ?? "",
    pros: row.pros ?? [],
    cons: row.cons ?? [],
    popularity: row.popularity ?? 0,
    isNew: row.release_year != null && row.release_year >= currentYear,
    release: row.release_year?.toString(),
    releaseDate: row.release_date ?? undefined,
    releaseYear: row.release_year ?? undefined,
    productUrl: row.product_url ?? undefined,
  };
};

/** Strip a leading brand from a shoe name so titles never read "Adidas adidas ...". */
export const displayName = (shoe: { name: string; brand: string }) => {
  const name = shoe.name.trim();
  const brand = shoe.brand.trim();
  if (name.toLowerCase().startsWith(brand.toLowerCase())) {
    return name;
  }
  return `${brand} ${name}`;
};

export type Pronation =
  | "neutral"
  | "mild_overpronation"
  | "severe_overpronation"
  | "not_sure";

export type Mileage = "under_15" | "15_to_35" | "over_35" | "";

export type ShoeInput = {
  usageTypes: string[];
  footStrike: string;
  pronation: Pronation;
  cushion: string; // "" = no preference
  toeBox: string;
  mileage: Mileage;
  budget?: number;
  weight?: number;
  /** Legacy fields kept for compatibility with saved sessions. */
  cadence?: string;
  stability?: string;
  surfaces?: string[];
};

export type ScoredShoe = Shoe & {
  score: number;
  reasons: string[];
};

const labelOverrides: Record<string, string> = {
  daily_trainer: "daily training",
  long_run: "long runs",
  speed_work: "speed work",
  race_day: "race day",
  trail_running: "trail running",
  recovery_runs: "recovery runs",
  motion_control: "motion control",
  extra_wide: "extra wide",
  midfoot: "midfoot",
  forefoot: "forefoot",
  heel: "heel"
};

export const prettyLabel = (value: string) => {
  const mapped = labelOverrides[value];
  if (mapped) {
    return mapped.charAt(0).toUpperCase() + mapped.slice(1);
  }
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

/** Family key for grouping shoe versions: "Hoka Bondi 9" and "Hoka Bondi 10" share one. */
export const modelFamily = (name: string) =>
  name
    .toLowerCase()
    .replace(/\s+(v?\d+(\.\d+)?)$/i, "")
    .trim();

const matchRatio = (selected: string[], available: string[]) => {
  if (!selected.length) {
    return 0;
  }
  const matches = selected.filter((item) => available.includes(item));
  return matches.length / selected.length;
};

/**
 * How well a shoe's stability level serves a runner's pronation pattern.
 * Returns 0..1. A neutral runner is fine in mild-stability shoes; a severe
 * overpronator in a neutral shoe is a genuine mismatch.
 */
const stabilityFit = (pronation: Pronation, stability: string): number => {
  switch (pronation) {
    case "neutral":
      if (stability === "neutral") return 1;
      if (stability === "mild") return 0.8;
      if (stability === "moderate") return 0.4;
      return 0.2; // motion control is overkill
    case "mild_overpronation":
      if (stability === "mild") return 1;
      if (stability === "moderate") return 0.9;
      if (stability === "neutral") return 0.45;
      return 0.6; // motion control: more than needed but works
    case "severe_overpronation":
      if (stability === "motion_control") return 1;
      if (stability === "moderate") return 0.85;
      if (stability === "mild") return 0.35;
      return 0; // neutral shoe, real mismatch
    default:
      return 0.6; // not sure: mild flat credit, no shoe punished hard
  }
};

const cushionFit = (preference: string, cushion: string): number => {
  if (!preference) return 0.6; // no preference: flat credit
  if (preference === cushion) return 1;
  // Adjacent levels get partial credit; opposite ends get none.
  const order = ["minimal", "moderate", "maximum"];
  const distance = Math.abs(order.indexOf(preference) - order.indexOf(cushion));
  return distance === 1 ? 0.45 : 0;
};

const mileageFit = (mileage: Mileage, shoe: Shoe): number => {
  if (!mileage) return 0.6;
  const isDurableTrainer =
    shoe.usageTypes.includes("daily_trainer") ||
    shoe.usageTypes.includes("recovery_runs");
  const isRacer = shoe.usageTypes.includes("race_day");
  switch (mileage) {
    case "over_35":
      // High mileage: durable trainers shine, pure racers are a supplement.
      if (isDurableTrainer) return 1;
      if (isRacer && shoe.usageTypes.length === 1) return 0.3;
      return 0.7;
    case "15_to_35":
      return isDurableTrainer || shoe.usageTypes.includes("long_run") ? 1 : 0.7;
    case "under_15":
      // Low mileage: versatility matters more than durability.
      return shoe.usageTypes.length >= 2 ? 1 : 0.75;
    default:
      return 0.6;
  }
};

const budgetFit = (budget: number | undefined, price: number): number => {
  if (!budget || !price) return 0.6;
  if (price <= budget * 0.8) return 1; // comfortable headroom
  if (price <= budget) return 0.75;
  return 0; // over budget (also hard-filtered in UI)
};

const weightFit = (shoe: Shoe, weight?: number) => {
  if (!weight) return 0.6;
  if (shoe.weightRange === "all") return 0.8;
  if (shoe.weightRange === "heavyweight" && weight >= 185) return 1;
  if (shoe.weightRange === "lightweight" && weight <= 140) return 1;
  if (shoe.weightRange === "heavyweight" && weight < 140) return 0.4;
  return 0.6;
};

const WEIGHTS = {
  usage: 30,
  stability: 25,
  cushion: 15,
  footStrike: 10,
  mileage: 8,
  toeBox: 5,
  budget: 4,
  weight: 3
};

export const scoreShoe = (shoe: Shoe, input: ShoeInput): ScoredShoe => {
  const usage = input.usageTypes.length
    ? matchRatio(input.usageTypes, shoe.usageTypes)
    : 0.6;
  const stability = stabilityFit(input.pronation ?? "not_sure", shoe.stability);
  const cushion = cushionFit(input.cushion ?? "", shoe.cushion);
  const footStrike =
    !input.footStrike || input.footStrike === "not_sure"
      ? 0.6
      : shoe.footStrike.includes(input.footStrike)
      ? 1
      : 0.2;
  const mileage = mileageFit(input.mileage ?? "", shoe);
  const toeBox =
    !input.toeBox || input.toeBox === "standard"
      ? 0.6
      : shoe.toeBox === input.toeBox
      ? 1
      : shoe.toeBox === "extra_wide" && input.toeBox === "wide"
      ? 0.8
      : 0.1;
  const budget = budgetFit(input.budget, shoe.price);
  const weight = weightFit(shoe, input.weight);

  const raw =
    usage * WEIGHTS.usage +
    stability * WEIGHTS.stability +
    cushion * WEIGHTS.cushion +
    footStrike * WEIGHTS.footStrike +
    mileage * WEIGHTS.mileage +
    toeBox * WEIGHTS.toeBox +
    budget * WEIGHTS.budget +
    weight * WEIGHTS.weight;

  const score = Math.min(100, Math.round(raw));

  const reasons: string[] = [];

  if (input.usageTypes.length && usage >= 0.99) {
    reasons.push(
      `Built for ${input.usageTypes.map((u) => labelOverrides[u] ?? u).join(" and ")}`
    );
  } else if (input.usageTypes.length && usage >= 0.5) {
    reasons.push("Covers most of the runs you picked");
  }

  if (input.pronation === "mild_overpronation" && stability >= 0.9) {
    reasons.push("Right amount of support for mild overpronation");
  } else if (input.pronation === "severe_overpronation" && stability >= 0.85) {
    reasons.push("Strong support for overpronation");
  } else if (input.pronation === "neutral" && stability >= 0.8) {
    reasons.push("Clean neutral ride");
  } else if (
    input.pronation === "severe_overpronation" &&
    stability === 0
  ) {
    reasons.push("Caution: neutral shoe, no support for overpronation");
  }

  if (input.cushion && cushion === 1) {
    reasons.push(`${prettyLabel(shoe.cushion)} cushion, exactly what you asked for`);
  }

  if (
    input.footStrike &&
    input.footStrike !== "not_sure" &&
    footStrike === 1
  ) {
    reasons.push(`Works well for ${labelOverrides[input.footStrike] ?? input.footStrike} strikers`);
  }

  if (input.mileage === "over_35" && mileage === 1) {
    reasons.push("Durable enough for high weekly mileage");
  }

  if (input.toeBox && input.toeBox !== "standard" && toeBox >= 0.8) {
    reasons.push(`${prettyLabel(shoe.toeBox)} toe box fits your foot shape`);
  }

  if (input.budget && budget === 1) {
    reasons.push(`Comfortably inside your $${input.budget} budget`);
  }

  return {
    ...shoe,
    score,
    reasons: reasons.slice(0, 3)
  };
};
