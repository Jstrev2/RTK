import type { TrainingPlan, TrainingWorkout } from "@/lib/data";

/**
 * Generate a full multi-week schedule from a training plan's parameters.
 * Uses progressive overload principles: gradual mileage increase with
 * cutback weeks every 3-4 weeks and a taper in the final weeks.
 */
export function generateSchedule(plan: TrainingPlan): TrainingWorkout[][] {
  const weeks: TrainingWorkout[][] = [];
  const { durationWeeks, runsPerWeek, peakMileage, weekOne, difficulty, distance } = plan;

  // Week 1 is provided
  weeks.push(weekOne);

  // Calculate starting weekly mileage from week 1
  const week1Miles = weekOne.reduce((sum, w) => {
    const num = parseFloat(w.distance);
    return sum + (Number.isNaN(num) ? 2 : num);
  }, 0);

  const taperWeeks = distance === "marathon" ? 3 : distance === "half" ? 2 : 1;
  const buildWeeks = durationWeeks - taperWeeks - 1; // minus week 1

  for (let w = 2; w <= durationWeeks; w++) {
    const weekIndex = w - 1;
    const isCutback = weekIndex > 0 && weekIndex % 4 === 3;
    const isTaper = w > durationWeeks - taperWeeks;
    const isRaceWeek = w === durationWeeks;

    // Calculate target weekly mileage
    let weeklyMiles: number;
    if (isRaceWeek) {
      weeklyMiles = week1Miles * 0.5;
    } else if (isTaper) {
      const taperProgress = (durationWeeks - w) / taperWeeks;
      weeklyMiles = peakMileage * (0.5 + 0.3 * taperProgress);
    } else if (isCutback) {
      const progress = Math.min(1, weekIndex / buildWeeks);
      const targetMiles = week1Miles + (peakMileage - week1Miles) * progress;
      weeklyMiles = targetMiles * 0.7;
    } else {
      const progress = Math.min(1, weekIndex / buildWeeks);
      weeklyMiles = week1Miles + (peakMileage - week1Miles) * progress;
    }

    const longRunMiles = weeklyMiles * 0.35;
    const remainingMiles = weeklyMiles - longRunMiles;
    const otherRuns = runsPerWeek - 1;
    const avgOtherMiles = otherRuns > 0 ? remainingMiles / otherRuns : 0;

    const workouts: TrainingWorkout[] = [];
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    // Distribute workouts across the week
    const hasQuality = difficulty !== "beginner" && !isTaper && !isRaceWeek;
    let assigned = 0;

    if (runsPerWeek >= 4 && hasQuality) {
      workouts.push({
        day: days[1], // Tuesday
        type: w % 2 === 0 ? "Tempo" : "Intervals",
        distance: `${Math.round(avgOtherMiles * 10) / 10} miles`,
        pace: w % 2 === 0 ? "Tempo" : "Fast",
        notes: w % 2 === 0
          ? `${Math.max(1, Math.round(avgOtherMiles * 0.6))} miles at tempo effort.`
          : `${Math.max(2, Math.round(avgOtherMiles * 1.2))} x 400m with full recovery.`,
      });
      assigned++;
    }

    // Easy runs to fill remaining slots (before long run)
    const easyDays = runsPerWeek >= 5
      ? [days[0], days[3], days[4]]
      : runsPerWeek >= 4
      ? [days[3], days[4]]
      : [days[1], days[3]];

    for (const day of easyDays) {
      if (assigned >= runsPerWeek - 1) break;
      if (workouts.some((w) => w.day === day)) continue;
      workouts.push({
        day,
        type: "Easy Run",
        distance: `${Math.round(avgOtherMiles * 10) / 10} miles`,
        pace: "Easy",
        notes: isTaper
          ? "Keep it light. Trust the taper."
          : isCutback
          ? "Recovery week. Stay relaxed."
          : "Conversational pace.",
      });
      assigned++;
    }

    // Long run on Sunday (or Saturday for race week)
    if (isRaceWeek) {
      workouts.push({
        day: days[6],
        type: "Race Day",
        distance: distance === "5k" ? "3.1 miles" : distance === "10k" ? "6.2 miles" : distance === "half" ? "13.1 miles" : "26.2 miles",
        pace: "Race",
        notes: "You are ready. Trust your training.",
      });
    } else {
      workouts.push({
        day: days[6], // Sunday
        type: "Long Run",
        distance: `${Math.round(longRunMiles * 10) / 10} miles`,
        pace: "Easy",
        notes: isTaper
          ? "Shorter long run. Stay fresh."
          : isCutback
          ? "Easy cutback long run."
          : longRunMiles >= 10
          ? "Practice fueling every 35-40 minutes."
          : "Build your time on feet.",
      });
    }

    // Sort by day order
    workouts.sort((a, b) => days.indexOf(a.day) - days.indexOf(b.day));
    weeks.push(workouts);
  }

  return weeks;
}
