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

export type ShoeInput = {
  usageTypes: string[];
  footStrike: string;
  cadence: string;
  toeBox: string;
  cushion: string;
  stability: string;
  surfaces: string[];
  weight?: number;
};

export type ScoredShoe = Shoe & {
  score: number;
  reasons: string[];
};

const labelOverrides: Record<string, string> = {
  daily_trainer: "Daily trainer",
  long_run: "Long run",
  speed_work: "Speed work",
  race_day: "Race day",
  trail_running: "Trail running",
  recovery_runs: "Recovery runs",
  trail_groomed: "Trail (groomed)",
  trail_technical: "Trail (technical)",
  motion_control: "Motion control",
  extra_wide: "Extra wide",
  midfoot: "Midfoot",
  forefoot: "Forefoot",
  heel: "Heel"
};

const prettyLabel = (value: string) => {
  if (labelOverrides[value]) {
    return labelOverrides[value];
  }
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const matchRatio = (selected: string[], available: string[]) => {
  if (!selected.length) {
    return 0;
  }
  const matches = selected.filter((item) => available.includes(item));
  return matches.length / selected.length;
};

const weightMatchScore = (shoe: Shoe, weight?: number) => {
  if (!weight) {
    return 0;
  }
  if (shoe.weightRange === "all") {
    return 5;
  }
  if (shoe.weightRange === "heavyweight" && weight >= 185) {
    return 5;
  }
  if (shoe.weightRange === "lightweight" && weight <= 140) {
    return 5;
  }
  return 0;
};

export const scoreShoe = (shoe: Shoe, input: ShoeInput): ScoredShoe => {
  const usageScore = 25 * matchRatio(input.usageTypes, shoe.usageTypes);
  const footStrikeScore =
    input.footStrike === "not_sure" || !input.footStrike
      ? 10
      : shoe.footStrike.includes(input.footStrike)
      ? 20
      : 0;
  const cushionScore = input.cushion && shoe.cushion === input.cushion ? 15 : 0;
  const stabilityScore =
    input.stability && shoe.stability === input.stability ? 20 : 0;
  const surfaceScore = 15 * matchRatio(input.surfaces, shoe.surfaces);
  const cadenceScore =
    input.cadence === "not_sure" || !input.cadence
      ? 2.5
      : shoe.cadence.includes(input.cadence)
      ? 5
      : 0;
  const toeBoxScore =
    input.toeBox && input.toeBox !== "standard" && shoe.toeBox === input.toeBox ? 10 : 0;
  const weightScore = weightMatchScore(shoe, input.weight);

  const baseScore =
    usageScore +
    footStrikeScore +
    cushionScore +
    stabilityScore +
    surfaceScore +
    cadenceScore +
    toeBoxScore +
    weightScore;

  const score = Math.min(100, Math.round(baseScore));

  const reasons: string[] = [];

  if (usageScore > 0 && input.usageTypes.length) {
    reasons.push(
      `Usage match: ${input.usageTypes.map(prettyLabel).join(", ")}`
    );
  }
  if (footStrikeScore >= 20 && input.footStrike && input.footStrike !== "not_sure") {
    reasons.push(`Foot strike: ${prettyLabel(input.footStrike)}`);
  }
  if (cushionScore > 0) {
    reasons.push(`Cushion: ${prettyLabel(input.cushion)}`);
  }
  if (stabilityScore > 0) {
    reasons.push(`Support: ${prettyLabel(input.stability)}`);
  }
  if (surfaceScore > 0 && input.surfaces.length) {
    reasons.push(
      `Surface match: ${input.surfaces.map(prettyLabel).join(", ")}`
    );
  }
  if (cadenceScore > 0 && input.cadence && input.cadence !== "not_sure") {
    reasons.push(`Cadence: ${prettyLabel(input.cadence)}`);
  }
  if (toeBoxScore > 0) {
    reasons.push(`Toe box: ${prettyLabel(input.toeBox)}`);
  }
  if (weightScore > 0) {
    reasons.push("Weight range supported");
  }

  return {
    ...shoe,
    score,
    reasons: reasons.slice(0, 3)
  };
};
