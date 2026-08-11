"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { CSSProperties } from "react";
import { trainingPlans } from "@/lib/data";
import { generateSchedule } from "@/lib/training-schedule";
import SaveButton from "@/components/save-button";
import InjuryAdjuster from "@/components/injury-adjuster";

const distanceOptions = ["all", "5k", "10k", "half", "marathon"];
const difficultyOptions = ["all", "beginner", "intermediate", "advanced"];

export default function TrainingPlansPage() {
  const [distance, setDistance] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [selectedPlanId, setSelectedPlanId] = useState(trainingPlans[0]?.id ?? "");
  const [selectedWeek, setSelectedWeek] = useState(0);

  const filteredPlans = useMemo(() => {
    return trainingPlans.filter((plan) => {
      const distanceMatch = distance === "all" || plan.distance === distance;
      const difficultyMatch = difficulty === "all" || plan.difficulty === difficulty;
      return distanceMatch && difficultyMatch;
    });
  }, [distance, difficulty]);

  const selectedPlan = useMemo(() => {
    return trainingPlans.find((plan) => plan.id === selectedPlanId) ?? filteredPlans[0];
  }, [selectedPlanId, filteredPlans]);

  const schedule = useMemo(() => {
    if (!selectedPlan) return [];
    return generateSchedule(selectedPlan);
  }, [selectedPlan]);

  useEffect(() => {
    setSelectedWeek(0);
  }, [selectedPlanId]);

  const currentWeekWorkouts = schedule[selectedWeek] ?? [];

  return (
    <div className="tool-page tool-page-training">
      <section className="tool-hero container">
        <span className="eyebrow">Free training plans</span>
        <h1>Start with a plan. Change it when life does.</h1>
        <p>
          Choose a complete plan from 5K to marathon. Browse every week for
          free, and if an injury interrupts the plan, Injury Rescue rebuilds
          the remaining weeks around a careful return.
        </p>
      </section>

      <section className="section container">
        <div className="stack" style={{ marginBottom: "24px" }}>
          <strong>Plan library</strong>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <div>
              <span className="label">Distance</span>
              <select className="select" value={distance} onChange={(e) => setDistance(e.target.value)}>
                {distanceOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <span className="label">Difficulty</span>
              <select className="select" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                {difficultyOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-2">
          <div className="stack">
            <div className="card-grid">
              {filteredPlans.length === 0 ? (
                <div className="card card-outline">No plans match those filters.</div>
              ) : (
                filteredPlans.map((plan, index) => (
                  <button
                    key={plan.id}
                    type="button"
                    className={`card ${selectedPlan?.id === plan.id ? "card-accent" : "card-outline"} fade-up`}
                    style={{ "--delay": `${index * 0.05}s` } as CSSProperties}
                    onClick={() => setSelectedPlanId(plan.id)}
                  >
                    <div className="stack">
                      <strong>{plan.name}</strong>
                      <span className="tag">{plan.distance} | {plan.difficulty}</span>
                      <p>{plan.description}</p>
                      <span className="brand-sub">
                        {plan.durationWeeks} weeks · {plan.runsPerWeek} runs/week · Peak {plan.peakMileage} mi
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="stack">
            {selectedPlan && (
              <div className="card card-accent">
                <div className="stack">
                  <strong>{selectedPlan.name}</strong>
                  <p>{selectedPlan.description}</p>
                  <div className="brand-sub">Prerequisites: {selectedPlan.prerequisites}</div>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <span className="tag">{selectedPlan.durationWeeks} weeks</span>
                    <span className="tag">{selectedPlan.runsPerWeek} runs/week</span>
                    <span className="tag">Peak {selectedPlan.peakMileage} miles</span>
                  </div>
                  <div className="divider" />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                    <strong>
                      Week {selectedWeek + 1} of {schedule.length}
                      {selectedWeek === schedule.length - 1 ? " (Race week)" : ""}
                    </strong>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        type="button"
                        disabled={selectedWeek === 0}
                        onClick={() => setSelectedWeek((w) => w - 1)}
                      >
                        Prev
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        type="button"
                        disabled={selectedWeek >= schedule.length - 1}
                        onClick={() => setSelectedWeek((w) => w + 1)}
                      >
                        Next
                      </button>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                    {schedule.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        className={`btn btn-sm ${i === selectedWeek ? "btn-primary" : "btn-secondary"}`}
                        style={{ minWidth: "32px", padding: "4px 6px", fontSize: "0.7rem" }}
                        onClick={() => setSelectedWeek(i)}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>

                  <ul className="list">
                    {currentWeekWorkouts.map((workout) => (
                      <li key={`${workout.day}-${workout.type}`} className="card card-outline">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          <strong>{workout.day}</strong>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <span className="tag">{workout.type}</span>
                            <span className="badge">{workout.distance}</span>
                          </div>
                        </div>
                        <div className="brand-sub" style={{ marginTop: "4px" }}>{workout.notes}</div>
                      </li>
                    ))}
                  </ul>
                  <SaveButton
                    itemType="plan"
                    itemId={selectedPlan.id}
                    label={selectedPlan.name}
                    metadata={{ distance: selectedPlan.distance, difficulty: selectedPlan.difficulty }}
                  />
                </div>
              </div>
            )}

            <div id="adapt">
              <span id="injury" className="anchor-target" aria-hidden="true" />
              {selectedPlan && <InjuryAdjuster plan={selectedPlan} />}
            </div>

            <div className="contextual-next">
              <span className="eyebrow">Finish the race kit</span>
              <div>
                <strong>Use your plan to calculate pace, fuel, and music for the work ahead.</strong>
                <div className="button-row">
                  <Link className="text-link" href="/tools/pace-calculator">Calculate pace →</Link>
                  <Link className="text-link" href="/tools/fueling">Plan fuel →</Link>
                  <Link className="text-link" href="/tools/music">Find music →</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section container prose-block">
        <h2>How to choose the right running plan</h2>
        <p>
          Match the plan to your last four weeks of running, not the runner
          you plan to become. If you&apos;re running 15 miles a week now, a
          plan that starts at 25 will hurt you by week three.
        </p>
        <ul>
          <li>5K plans: 6–10 weeks, 3–4 runs per week. The best first-race distance.</li>
          <li>10K plans: 8–10 weeks. Adds one quality workout per week.</li>
          <li>Half marathon plans: 10–14 weeks. The long run becomes the anchor of your week.</li>
          <li>Marathon plans: 16–20 weeks. Consistency beats any single workout.</li>
        </ul>
        <h2>What if I miss a week?</h2>
        <p>
          Don&apos;t make up the miles. That&apos;s how a missed week becomes a
          missed month. Rejoin the plan where the calendar says you are and
          downgrade the next hard workout. Hurt, or missed more than two
          weeks? That&apos;s what <Link href="/rescue">Injury Rescue</Link> is
          built for: it rebuilds the remaining schedule instead of pretending
          nothing happened.
        </p>
      </section>
    </div>
  );
}
