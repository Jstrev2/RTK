import type { TrainingPlan, TrainingWorkout } from "@/lib/data";
import { generateSchedule } from "@/lib/training-schedule";
import { getInjury, type Injury, type InjurySeverity } from "@/lib/injuries";

export type AdjustedPhase = "rest" | "return" | "rebuild" | "taper" | "race";

export type AdjustedWeek = {
  weekNumber: number;
  phase: AdjustedPhase;
  phaseLabel: string;
  workouts: TrainingWorkout[];
  note?: string;
};

export type Feasibility = {
  canRace: boolean;
  /** Rough expected slowdown at the goal race, in seconds per mile. */
  paceAdjustmentSecPerMile: number;
  message: string;
};

export type AdjustedPlan = {
  injury: Injury;
  severity: InjurySeverity;
  reportedWeek: number;
  weeks: AdjustedWeek[];
  feasibility: Feasibility;
};

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const sortByDay = (workouts: TrainingWorkout[]) =>
  [...workouts].sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day));

const parseMiles = (distance: string): number => {
  const num = parseFloat(distance);
  return Number.isNaN(num) ? 2.5 : num;
};

const weekMiles = (week: TrainingWorkout[]) =>
  week.reduce((sum, w) => sum + parseMiles(w.distance), 0);

const isQuality = (w: TrainingWorkout) =>
  ["Tempo", "Intervals", "Speed", "Race Pace"].some((t) => w.type.includes(t));

const isLong = (w: TrainingWorkout) => w.type.includes("Long");

const isRace = (w: TrainingWorkout) => w.type === "Race Day";

const crossTrainWorkout = (
  day: string,
  injury: Injury,
  minutes: number,
  note: string
): TrainingWorkout => ({
  day,
  type: "Cross-train",
  distance: `${minutes} min`,
  pace: "Easy effort",
  notes: `${injury.crossTraining[0]} (or ${injury.crossTraining[1] ?? "walking"}). ${note}`
});

/**
 * Rough fitness cost of time off: noticeable losses start after ~2 weeks of
 * no running. Expressed as seconds per mile added to goal race pace.
 */
const paceLoss = (restDays: number, returnWeeks: number): number => {
  if (restDays <= 7) return 5;
  if (restDays <= 14) return 15;
  if (restDays <= 28) return 30 + returnWeeks * 5;
  return 60 + returnWeeks * 8;
};

/**
 * Rebuild a plan's remaining weeks around an injury reported in a given week.
 *
 * Phases: rest (cross-train only) -> return (run/walk, reduced volume)
 * -> rebuild (ramp back toward plan, quality/long runs re-introduced per
 * injury profile) -> taper/race preserved when reachable.
 */
export function adjustPlan(
  plan: TrainingPlan,
  injuryId: string,
  severity: InjurySeverity,
  reportedWeek: number
): AdjustedPlan | null {
  const injury = getInjury(injuryId);
  if (!injury) return null;

  const profile = injury.severityProfiles[severity];
  const schedule = generateSchedule(plan);
  const totalWeeks = schedule.length;
  const injuryWeekIndex = Math.min(Math.max(reportedWeek, 1), totalWeeks) - 1;

  // Volume baseline: the week before the injury (or week 1).
  const baselineMiles = weekMiles(schedule[Math.max(0, injuryWeekIndex - 1)]);

  const restWeeks = Math.ceil(profile.restDays / 7);
  const returnWeeks = profile.returnWeeks;
  const taperWeeks = plan.distance === "marathon" ? 3 : plan.distance === "half" ? 2 : 1;

  const weeksRemaining = totalWeeks - injuryWeekIndex; // includes race week
  const weeksNeeded = restWeeks + returnWeeks + 1; // +1 = at least race week
  const canRace = weeksRemaining >= weeksNeeded && !injury.requiresMedicalClearance
    ? true
    : weeksRemaining >= weeksNeeded;

  const adjusted: AdjustedWeek[] = [];

  // Untouched weeks before the injury.
  for (let i = 0; i < injuryWeekIndex; i++) {
    adjusted.push({
      weekNumber: i + 1,
      phase: "rebuild",
      phaseLabel: "As planned (completed)",
      workouts: schedule[i]
    });
  }

  let cursor = injuryWeekIndex;

  // Phase 1: rest — no running, cross-train to hold fitness.
  for (let r = 0; r < restWeeks && cursor < totalWeeks; r++, cursor++) {
    const original = schedule[cursor];
    const workouts = sortByDay(
      original
        .filter((w) => !isRace(w))
        .map((w, idx) => {
          if (idx % 2 === 1) {
            return { day: w.day, type: "Rest", distance: "—", pace: "—", notes: "Full rest day. Recovery is the training." };
          }
          const minutes = isLong(w) ? 50 : 30;
          return crossTrainWorkout(w.day, injury, minutes, "Zero running this week. Keep effort conversational.");
        })
    );
    adjusted.push({
      weekNumber: cursor + 1,
      phase: "rest",
      phaseLabel: `Rest & recover (week ${r + 1} of ${restWeeks})`,
      workouts,
      note:
        r === 0
          ? `No running while the ${injury.name.toLowerCase()} calms down. ${injury.requiresMedicalClearance ? "Do not restart running without medical clearance. " : ""}Avoid: ${injury.avoid[0].toLowerCase()}.`
          : undefined
    });
  }

  // Phase 2: progressive return-to-run.
  for (let r = 0; r < returnWeeks && cursor < totalWeeks; r++, cursor++) {
    const original = schedule[cursor];
    const isRaceWeek = original.some(isRace);
    if (isRaceWeek) break; // handled below

    const factor = profile.startVolumeFactor * Math.pow(profile.weeklyRamp, r);
    const targetMiles = Math.max(3, baselineMiles * Math.min(factor, 1));
    const runDays = original.filter((w) => !isRace(w));
    const allowSpeed = r + 1 > profile.speedAfterWeeks;
    const allowLong = r + 1 > profile.longRunAfterWeeks;

    const perRun = targetMiles / Math.max(1, runDays.length);
    const workouts = sortByDay(
      runDays.map((w) => {
        if (r === 0) {
          return {
            day: w.day,
            type: "Run/Walk",
            distance: `${Math.round(perRun * 10) / 10} miles`,
            pace: "Very easy",
            notes: "Alternate 4 min easy running / 1 min walking. Stop if symptoms pass 3/10 or change your stride."
          };
        }
        if (isQuality(w) && !allowSpeed) {
          return crossTrainWorkout(w.day, injury, 35, "Speed work swapped out until later in the return.");
        }
        if (isLong(w) && !allowLong) {
          return {
            day: w.day,
            type: "Easy Run",
            distance: `${Math.round(perRun * 1.3 * 10) / 10} miles`,
            pace: "Easy",
            notes: "Capped long run during the return phase. Flat and soft surface if possible."
          };
        }
        return {
          day: w.day,
          type: "Easy Run",
          distance: `${Math.round(perRun * 10) / 10} miles`,
          pace: "Easy",
          notes: "Symptoms should stay at 3/10 or below and settle by next morning — otherwise repeat last week instead of progressing."
        };
      })
    );

    adjusted.push({
      weekNumber: cursor + 1,
      phase: "return",
      phaseLabel: `Return to running (week ${r + 1} of ${returnWeeks})`,
      workouts,
      note:
        r === 0
          ? `Volume restarts at ~${Math.round(profile.startVolumeFactor * 100)}% of where you were, building ~${Math.round((profile.weeklyRamp - 1) * 100)}% per week.`
          : undefined
    });
  }

  // Phase 3: rebuild + preserved taper/race from the original plan, volume-capped.
  let rebuildIndex = 0;
  for (; cursor < totalWeeks; cursor++, rebuildIndex++) {
    const original = schedule[cursor];
    const isRaceWeek = original.some(isRace);
    const isTaperWeek = cursor >= totalWeeks - taperWeeks - 1 && !isRaceWeek;

    if (isRaceWeek) {
      adjusted.push({
        weekNumber: cursor + 1,
        phase: "race",
        phaseLabel: canRace ? "Race week" : "Original race week",
        workouts: canRace
          ? original
          : sortByDay(
              original.map((w) =>
                isRace(w)
                  ? { ...w, type: "Time Trial (optional)", notes: "Racing isn't recommended on this timeline. If you're symptom-free, run it as a supported training effort at easy-to-steady pace instead." }
                  : w
              )
            ),
        note: canRace
          ? "Adjust your goal pace — see the expectation note above."
          : undefined
      });
      continue;
    }

    // Cap the rebuild volume so it never exceeds the return-ramp trajectory.
    const rampFactor = Math.min(
      1,
      profile.startVolumeFactor * Math.pow(profile.weeklyRamp, returnWeeks + rebuildIndex)
    );
    const originalMiles = weekMiles(original);
    const cappedMiles = Math.min(originalMiles, Math.max(3, baselineMiles * rampFactor * 1.15));
    const scale = originalMiles > 0 ? cappedMiles / originalMiles : 1;

    const workouts = sortByDay(
      original.map((w) => {
        const miles = parseMiles(w.distance);
        const scaled = Math.round(miles * scale * 10) / 10;
        const distance = w.distance.includes("mile") ? `${scaled} miles` : w.distance;
        return { ...w, distance };
      })
    );

    adjusted.push({
      weekNumber: cursor + 1,
      phase: isTaperWeek ? "taper" : "rebuild",
      phaseLabel: isTaperWeek ? "Taper (preserved)" : scale < 0.95 ? "Rebuild (volume capped)" : "Back on plan",
      workouts
    });
  }

  const secPerMile = paceLoss(profile.restDays, returnWeeks);
  const feasibility: Feasibility = injury.requiresMedicalClearance
    ? {
        canRace: false,
        paceAdjustmentSecPerMile: secPerMile,
        message:
          "A suspected stress fracture needs imaging and a clinician-managed timeline before any return to running. Treat the schedule below as a template to review with them — and be open to picking a later race."
      }
    : canRace
    ? {
        canRace: true,
        paceAdjustmentSecPerMile: secPerMile,
        message:
          secPerMile <= 10
            ? "Race day is very much on. Expect close to your original goal — treat the first miles conservatively."
            : `Race day is doable on this timeline. Plan for roughly ${secPerMile} seconds per mile slower than your original goal pace, and consider revising your A-goal to a strong finish.`
      }
    : {
        canRace: false,
        paceAdjustmentSecPerMile: secPerMile,
        message:
          "There isn't enough runway to rest, rebuild, and safely race this distance. The schedule below prioritizes a full recovery — consider dropping to a shorter distance on race day, or targeting a race a few weeks later."
      };

  return {
    injury,
    severity,
    reportedWeek: injuryWeekIndex + 1,
    weeks: adjusted,
    feasibility
  };
}
