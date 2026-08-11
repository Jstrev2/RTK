import type { TrainingPlan, TrainingWorkout } from "@/lib/data";

/**
 * Plan-shape intake: six fields that describe any training plan well enough
 * to rebuild its remaining weeks — a Hal Higdon PDF, a Garmin Coach plan, a
 * coach's spreadsheet, or one of ours. We deliberately do NOT parse plan
 * files; we rebuild the remaining weeks around the plan's shape.
 */

export type PlanShape = {
  distance: TrainingPlan["distance"];
  /** Whole weeks from now through race week (race week included). */
  weeksToRace: number;
  runsPerWeek: number;
  /** Miles actually run in a typical recent week (pre-injury). */
  currentWeeklyMiles: number;
  /** The plan's biggest week, if known. Defaults to a distance-typical peak. */
  peakWeeklyMiles?: number;
  longRunDay: "Saturday" | "Sunday";
};

const DEFAULT_PEAK: Record<TrainingPlan["distance"], number> = {
  "5k": 18,
  "10k": 25,
  half: 32,
  marathon: 42
};

export const RACE_LABEL: Record<TrainingPlan["distance"], string> = {
  "5k": "5K",
  "10k": "10K",
  half: "Half marathon",
  marathon: "Marathon"
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/**
 * Build a synthetic TrainingPlan whose week 1 mirrors the runner's current
 * week. Reporting the injury in week 1 then makes `adjustPlan` treat their
 * current mileage as the baseline and `weeksToRace` as the full runway.
 */
export function buildCustomPlan(shape: PlanShape): TrainingPlan {
  const weeksToRace = clamp(Math.round(shape.weeksToRace), 3, 30);
  const runsPerWeek = clamp(Math.round(shape.runsPerWeek), 2, 6);
  const weeklyMiles = clamp(shape.currentWeeklyMiles, 4, 120);
  const peak = clamp(
    shape.peakWeeklyMiles ?? Math.max(weeklyMiles * 1.15, DEFAULT_PEAK[shape.distance]),
    weeklyMiles,
    140
  );

  const longMiles = Math.max(2, Math.round(weeklyMiles * 0.35 * 10) / 10);
  const otherRuns = runsPerWeek - 1;
  const perRun =
    otherRuns > 0
      ? Math.max(1.5, Math.round(((weeklyMiles - longMiles) / otherRuns) * 10) / 10)
      : 0;

  const easyDayOrder = ["Tuesday", "Thursday", "Monday", "Wednesday", "Friday"];
  const weekOne: TrainingWorkout[] = easyDayOrder.slice(0, otherRuns).map((day) => ({
    day,
    type: "Easy Run",
    distance: `${perRun} miles`,
    pace: "Easy",
    notes: "Conversational pace."
  }));
  weekOne.push({
    day: "Sunday",
    type: "Long Run",
    distance: `${longMiles} miles`,
    pace: "Easy",
    notes: "Your usual long run."
  });

  return {
    id: "custom-plan",
    name: `Your ${RACE_LABEL[shape.distance].toLowerCase()} plan`,
    distance: shape.distance,
    difficulty: runsPerWeek >= 4 ? "intermediate" : "beginner",
    durationWeeks: weeksToRace,
    runsPerWeek,
    peakMileage: peak,
    description: "Rebuilt from the shape of the plan you were following.",
    prerequisites: "",
    weekOne
  };
}

/**
 * The schedule generator anchors long runs on Sunday. If the runner's plan
 * runs long on Saturday, swap the two labels so the week reads like theirs.
 */
export function applyLongRunDay(
  workouts: TrainingWorkout[],
  longRunDay: PlanShape["longRunDay"]
): TrainingWorkout[] {
  if (longRunDay === "Sunday") return workouts;
  // Race week stays untouched: the race is on its real day; only training
  // weeks get relabeled to match the runner's long-run habit.
  if (workouts.some((w) => w.type === "Race Day")) return workouts;
  const order = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  return workouts
    .map((w) => {
      if (w.day === "Sunday") return { ...w, day: "Saturday" };
      if (w.day === "Saturday") return { ...w, day: "Sunday" };
      return w;
    })
    .sort((a, b) => order.indexOf(a.day) - order.indexOf(b.day));
}
