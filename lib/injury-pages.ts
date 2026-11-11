import { buildCustomPlan, type PlanShape } from "@/lib/custom-plan";
import { adjustPlan, type AdjustedPhase } from "@/lib/plan-adjuster";
import type { Injury, InjurySeverity } from "@/lib/injuries";

/**
 * Numbers for the per-injury pages under /rescue/[injury].
 *
 * Everything here is produced by running the real calculator engine, never
 * by restating its rules, so a page can't drift from the verdict a runner
 * gets when they use the tool.
 */

export const SEVERITIES: InjurySeverity[] = ["mild", "moderate", "severe"];

export const SEVERITY_COPY: Record<InjurySeverity, { label: string; looksLike: string }> = {
  mild: {
    label: "Mild",
    looksLike: "You walk normally, and easy running stays at 3/10 pain or lower"
  },
  moderate: {
    label: "Moderate",
    looksLike:
      "Two or three warning signs: runs that hurt past 3/10, a painful single-leg hop, symptoms older than two weeks"
  },
  severe: {
    label: "Severe",
    looksLike: "You're limping and it aches at rest or at night, or nearly every warning sign is present"
  }
};

/** The one runner every sample schedule is built for. */
const SAMPLE_SHAPE: PlanShape = {
  distance: "half",
  weeksToRace: 10,
  runsPerWeek: 4,
  currentWeeklyMiles: 25,
  longRunDay: "Sunday"
};

export const SAMPLE_DESCRIPTION =
  "a half marathon ten weeks away, 25 miles a week, four runs a week";

export type SeverityRow = {
  severity: InjurySeverity;
  label: string;
  looksLike: string;
  restDays: number;
  returnWeeks: number;
  startPercent: number;
  speedAfterWeeks: number;
  longRunAfterWeeks: number;
  /** Fewest whole weeks to race day that still gets a "race is on" verdict. */
  minWeeks: number | null;
  /** Rough seconds per mile given up against the original goal. */
  paceCost: number;
};

export function severityRows(injury: Injury): SeverityRow[] {
  return SEVERITIES.map((severity) => {
    const profile = injury.severityProfiles[severity];
    let minWeeks: number | null = null;
    let paceCost = 0;
    for (let weeks = 3; weeks <= 30; weeks++) {
      const adjusted = adjustPlan(
        buildCustomPlan({ ...SAMPLE_SHAPE, weeksToRace: weeks }),
        injury.id,
        severity,
        1
      );
      if (!adjusted) break;
      paceCost = adjusted.feasibility.paceAdjustmentSecPerMile;
      if (adjusted.feasibility.canRace) {
        minWeeks = weeks;
        break;
      }
    }
    return {
      severity,
      label: SEVERITY_COPY[severity].label,
      looksLike: SEVERITY_COPY[severity].looksLike,
      restDays: profile.restDays,
      returnWeeks: profile.returnWeeks,
      startPercent: Math.round(profile.startVolumeFactor * 100),
      speedAfterWeeks: profile.speedAfterWeeks,
      longRunAfterWeeks: profile.longRunAfterWeeks,
      minWeeks,
      paceCost
    };
  });
}

export type SampleWeek = {
  weekNumber: number;
  phase: AdjustedPhase;
  phaseLabel: string;
  /** Running miles for the week, the race itself excluded. */
  miles: number;
  /** "2 x Cross-train, 2 x Rest" style summary of the week's sessions. */
  sessions: string;
  /** The week still ends in the race (or an optional run of the distance). */
  hasRace: boolean;
};

export type SampleSchedule = {
  weeks: SampleWeek[];
  canRace: boolean;
  /** Weeks before normal training resumes: time off plus the graded return. */
  weeksBeforeRebuild: number;
};

const NON_TRAINING_MILES = new Set(["Race Day", "Time Trial (optional)"]);

export function sampleSchedule(injury: Injury): SampleSchedule | null {
  const adjusted = adjustPlan(buildCustomPlan(SAMPLE_SHAPE), injury.id, "moderate", 1);
  if (!adjusted) return null;

  const weeks = adjusted.weeks.map((week) => {
    const counts = new Map<string, number>();
    let miles = 0;
    for (const workout of week.workouts) {
      counts.set(workout.type, (counts.get(workout.type) ?? 0) + 1);
      if (workout.distance.includes("mile") && !NON_TRAINING_MILES.has(workout.type)) {
        miles += parseFloat(workout.distance) || 0;
      }
    }
    const sessions = [...counts.entries()]
      .map(([type, count]) => (count > 1 ? `${count} x ${type}` : type))
      .join(", ");
    return {
      weekNumber: week.weekNumber,
      phase: week.phase,
      phaseLabel: week.phaseLabel,
      miles: Math.round(miles * 10) / 10,
      sessions,
      hasRace: week.workouts.some((workout) => NON_TRAINING_MILES.has(workout.type))
    };
  });

  return {
    weeks,
    canRace: adjusted.feasibility.canRace,
    weeksBeforeRebuild: weeks.filter((w) => w.phase === "rest" || w.phase === "return").length
  };
}
