import { rankPopularity, type ShoeCard } from "./shoe-catalog";
import { applyFilters, EMPTY_FILTERS, toQuery, type GridFilters } from "./shoe-filters";

/**
 * The Shoe Finder's three taps (and an optional budget) turned into a pool of
 * shoes, the same pool the grid shows for "see all matches", ranked so the
 * top three are popular, fit the feel asked for, and are different models.
 */

export type FinderAnswers = {
  run: string; // a usage id, e.g. "long_run"
  feel: "" | "soft" | "balanced" | "fast";
  feet: "" | "none" | "support" | "wide";
  budget: number; // 0 = any
};

export type FinderPick = { shoe: ShoeCard; reason: string; badge: string };

export type FinderResult = {
  picks: FinderPick[];
  total: number;
  /** What had to be dropped to find anything, in plain words. */
  loosened: string | null;
  /** /shoes link with the same filters applied. */
  gridHref: string;
};

const FEEL_CUSHION: Record<string, string> = { soft: "maximum", balanced: "moderate" };

const RUN_PHRASE: Record<string, string> = {
  daily_trainer: "everyday miles",
  long_run: "long runs",
  speed_work: "fast workouts",
  race_day: "race day",
  recovery_runs: "easy days"
};

export function finderFilters(answers: FinderAnswers): GridFilters {
  return {
    ...EMPTY_FILTERS,
    use: answers.run,
    cushion: FEEL_CUSHION[answers.feel] ?? "",
    support: answers.feet === "support" ? "support" : "",
    wide: answers.feet === "wide",
    max: answers.budget,
    sort: answers.feel === "fast" ? "weight" : "popular"
  };
}

/** "Ghost 18" and "Ghost 17" are one family; only the best of them is picked. */
const family = (name: string) => name.toLowerCase().replace(/\s+(v?\d+(\.\d+)?)$/i, "").trim();

function score(shoe: ShoeCard, answers: FinderAnswers) {
  let total = rankPopularity(shoe) * 0.6;
  if (answers.run && shoe.uses[0] === answers.run) total += 10;
  if (answers.feel === "fast") {
    if (shoe.cushion !== "maximum" || shoe.uses.includes("race_day")) total += 12;
    if (shoe.weight) total += Math.min(12, Math.max(0, 11 - shoe.weight) * 2.5);
  }
  if (answers.feel === "soft" && shoe.stack) total += Math.min(10, Math.max(0, shoe.stack - 34));
  if ((answers.feet === "none" || !answers.feet) && shoe.support === "neutral") total += 6;
  // Newer versions edge out older ones at equal popularity.
  if (shoe.released) total += Math.min(6, Math.max(0, Number(shoe.released.slice(0, 4)) - 2022) * 1.5);
  return total;
}

function reasonFor(shoe: ShoeCard, answers: FinderAnswers): string {
  const ride =
    shoe.cushion === "maximum" ? "Soft, max-cushion ride" : shoe.cushion === "minimal" ? "Firm, fast ride" : "Balanced ride";
  const extras: string[] = [];
  if (shoe.support !== "neutral") extras.push(shoe.support === "mild" ? "light support" : "real support");
  if (shoe.toeBox === "wide" || shoe.toeBox === "extra_wide") extras.push("a roomy toe box");
  const use = RUN_PHRASE[answers.run] ?? RUN_PHRASE[shoe.uses[0]] ?? "running";
  const weight = answers.feel === "fast" && shoe.weight ? `, ${shoe.weight} oz` : "";
  return `${ride}${extras.length ? ` with ${extras.join(" and ")}` : ""}, made for ${use}${weight}.`;
}

export function runFinder(shoes: ShoeCard[], answers: FinderAnswers): FinderResult {
  const attempts: Array<{ filters: GridFilters; loosened: string | null }> = [];
  const full = finderFilters(answers);
  attempts.push({ filters: full, loosened: null });
  if (full.max) attempts.push({ filters: { ...full, max: 0 }, loosened: "Nothing fit your budget, so these go over it." });
  if (full.cushion) attempts.push({ filters: { ...full, max: 0, cushion: "" }, loosened: "Nothing fit every answer, so we let the feel vary." });
  attempts.push({ filters: { ...EMPTY_FILTERS, use: full.use }, loosened: "Nothing fit every answer, so these match the run type only." });

  for (const attempt of attempts) {
    const pool = applyFilters(shoes, attempt.filters);
    if (!pool.length) continue;
    const ranked = [...pool].sort((a, b) => score(b, answers) - score(a, answers));
    const seen = new Set<string>();
    const top: ShoeCard[] = [];
    for (const shoe of ranked) {
      const key = family(shoe.name);
      if (seen.has(key)) continue;
      seen.add(key);
      top.push(shoe);
      if (top.length === 3) break;
    }
    const cheapest = top.length > 1 ? top.reduce((a, b) => (b.price && b.price < a.price ? b : a)) : null;
    const lightest = top.length > 1 ? top.reduce((a, b) => (b.weight && a.weight && b.weight < a.weight ? b : a)) : null;
    const tallest = top.length > 1 ? top.reduce((a, b) => ((b.stack ?? 0) > (a.stack ?? 0) ? b : a)) : null;
    // One plain reason each, and never the same sentence twice.
    const picks = top.map((shoe, i) => {
      const badge = i === 0 ? "Top pick" : shoe === cheapest ? "Best value" : shoe === lightest ? "Lightest" : "Also great";
      let reason = reasonFor(shoe, answers);
      if (badge === "Best value" && cheapest && top[0].price > shoe.price) {
        reason = `$${top[0].price - shoe.price} less than the top pick, same kind of ride.`;
      } else if (badge === "Lightest" && shoe.weight) {
        reason = `The lightest of your three at ${shoe.weight} oz.`;
      } else if (i > 0 && shoe === tallest && shoe.stack) {
        reason = `The most cushion here, a ${shoe.stack} mm heel stack.`;
      } else if (i > 0 && shoe.drop !== null && top[0].drop !== null && shoe.drop !== top[0].drop) {
        reason = `A ${shoe.drop} mm drop, ${shoe.drop < top[0].drop ? "lower" : "higher"} than the top pick if your calves prefer it.`;
      }
      return { shoe, reason, badge };
    });
    return { picks, total: pool.length, loosened: attempt.loosened, gridHref: `/shoes${toQuery(attempt.filters)}` };
  }
  return { picks: [], total: 0, loosened: null, gridHref: "/shoes" };
}
