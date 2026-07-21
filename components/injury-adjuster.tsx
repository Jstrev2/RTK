"use client";

import { useMemo, useState } from "react";
import type { TrainingPlan } from "@/lib/data";
import { injuries, MEDICAL_DISCLAIMER, type InjurySeverity } from "@/lib/injuries";
import { adjustPlan, type AdjustedWeek } from "@/lib/plan-adjuster";
import PremiumGate from "@/components/premium-gate";
import { useAuth } from "@/components/auth-provider";

const severityOptions: { id: InjurySeverity; label: string; hint: string }[] = [
  { id: "mild", label: "Mild", hint: "Noticeable but doesn't change how you run" },
  { id: "moderate", label: "Moderate", hint: "Forces you to cut runs short or skip days" },
  { id: "severe", label: "Severe", hint: "Can't run without pain, or told to stop" }
];

const phaseColors: Record<AdjustedWeek["phase"], string> = {
  rest: "🛌",
  return: "🚶",
  rebuild: "🏃",
  taper: "📉",
  race: "🏁"
};

function WeekCard({ week }: { week: AdjustedWeek }) {
  return (
    <div className="card card-outline">
      <div className="stack">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <strong>
            {phaseColors[week.phase]} Week {week.weekNumber}
          </strong>
          <span className="tag">{week.phaseLabel}</span>
        </div>
        {week.note ? <div className="notice">{week.note}</div> : null}
        <ul className="list">
          {week.workouts.map((workout) => (
            <li key={`${week.weekNumber}-${workout.day}-${workout.type}`}>
              <strong>{workout.day}</strong> — {workout.type}
              {workout.distance && workout.distance !== "—" ? `, ${workout.distance}` : ""}
              <div className="brand-sub">{workout.notes}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function InjuryAdjuster({ plan }: { plan: TrainingPlan }) {
  const { isPremium } = useAuth();
  const [injuryId, setInjuryId] = useState(injuries[0]?.id ?? "");
  const [severity, setSeverity] = useState<InjurySeverity>("mild");
  const [week, setWeek] = useState(1);
  const [submitted, setSubmitted] = useState(false);

  const adjusted = useMemo(() => {
    if (!submitted) return null;
    return adjustPlan(plan, injuryId, severity, week);
  }, [submitted, plan, injuryId, severity, week]);

  const selectedInjury = injuries.find((i) => i.id === injuryId);
  const remainingWeeks = adjusted
    ? adjusted.weeks.filter((w) => w.weekNumber >= adjusted.reportedWeek)
    : [];

  return (
    <div className="card">
      <div className="stack">
        <div>
          <span className="pill">Sample Adaptive Training</span>
          <strong style={{ display: "block", marginTop: "8px" }}>
            Preview a revised schedule after an injury
          </strong>
          <div className="brand-sub">
            Choose an issue you are already managing, its current impact, and
            your place in the plan. This preview adjusts training load; it does
            not diagnose the problem or replace professional guidance.
          </div>
        </div>

        <div className="filter-row">
          <div className="filter-group">
            <span className="label">Issue being managed</span>
            <select
              className="select"
              value={injuryId}
              onChange={(event) => {
                setInjuryId(event.target.value);
                setSubmitted(false);
              }}
            >
              {injuries.map((injury) => (
                <option key={injury.id} value={injury.id}>
                  {injury.name}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <span className="label">Current training impact</span>
            <select
              className="select"
              value={severity}
              onChange={(event) => {
                setSeverity(event.target.value as InjurySeverity);
                setSubmitted(false);
              }}
            >
              {severityOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label} — {option.hint}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <span className="label">Which week of the plan are you in?</span>
            <select
              className="select"
              value={week}
              onChange={(event) => {
                setWeek(Number(event.target.value));
                setSubmitted(false);
              }}
            >
              {Array.from({ length: plan.durationWeeks }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  Week {i + 1} of {plan.durationWeeks}
                </option>
              ))}
            </select>
          </div>
        </div>

        {!submitted ? (
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => setSubmitted(true)}
          >
            Preview the revised schedule
          </button>
        ) : null}

        {adjusted && selectedInjury ? (
          <div className="stack">
            <div className={adjusted.feasibility.canRace ? "notice" : "card card-accent"}>
              <strong>
                {adjusted.feasibility.canRace
                  ? "The timeline may still be workable."
                  : "The race timeline needs to change."}
              </strong>
              <p style={{ margin: "6px 0 0" }}>{adjusted.feasibility.message}</p>
            </div>

            <div className="card card-outline">
              <div className="stack">
                <strong>{selectedInjury.name} — the ground rules</strong>
                <p className="brand-sub">{selectedInjury.summary}</p>
                <div className="grid grid-2">
                  <div>
                    <span className="label">Avoid for now</span>
                    <ul className="list">
                      {selectedInjury.avoid.map((item) => (
                        <li key={item} className="brand-sub">✗ {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                  <span className="label">Potential alternatives</span>
                    <ul className="list">
                      {selectedInjury.safe.map((item) => (
                        <li key={item} className="brand-sub">✓ {item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div>
                  <span className="label">Best cross-training</span>
                  <div className="tag-grid">
                    {selectedInjury.crossTraining.map((item) => (
                      <span key={item} className="tag">{item}</span>
                    ))}
                  </div>
                </div>
                <div className="notice">
                  <strong>See a professional if:</strong> {selectedInjury.redFlags}
                </div>
              </div>
            </div>

            <PremiumGate
              feature="your full adjusted schedule"
              teaser={
                remainingWeeks.length ? (
                  <div className="stack">
                    <strong>
                      Revised plan — week {adjusted.reportedWeek} preview
                    </strong>
                    <WeekCard week={remainingWeeks[0]} />
                    <div className="brand-sub">
                      {remainingWeeks.length - 1} more adjusted week
                      {remainingWeeks.length === 2 ? "" : "s"} through race day,
                      including your return-to-run progression and preserved
                      taper.
                    </div>
                  </div>
                ) : null
              }
            >
              <div className="stack">
                <strong>Your revised schedule, week by week</strong>
                {remainingWeeks.map((adjustedWeek) => (
                  <WeekCard key={adjustedWeek.weekNumber} week={adjustedWeek} />
                ))}
              </div>
            </PremiumGate>

            <p className="brand-sub">{MEDICAL_DISCLAIMER}</p>
            {isPremium ? (
              <button
                className="btn btn-secondary btn-sm"
                type="button"
                onClick={() => setSubmitted(false)}
              >
                Adjust different details
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
