"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { CSSProperties } from "react";
import { trainingPlans } from "@/lib/data";
import { generateSchedule } from "@/lib/training-schedule";
import SaveButton from "@/components/save-button";
import { useAuth } from "@/components/auth-provider";
import { getSupabaseClient } from "@/lib/supabase-client";

const distanceOptions = ["all", "5k", "10k", "half", "marathon"];
const difficultyOptions = ["all", "beginner", "intermediate", "advanced"];

type TrainingLogRow = {
  id: string;
  workout_date: string;
  workout_type: string;
  distance: string | null;
  time: string | null;
  effort: number | null;
  notes: string | null;
};

type TrainingLog = {
  id: string;
  date: string;
  workoutType: string;
  distance: string;
  time: string;
  effort: string;
  notes: string;
};

const mapTrainingLog = (row: TrainingLogRow): TrainingLog => ({
  id: row.id,
  date: row.workout_date,
  workoutType: row.workout_type,
  distance: row.distance ?? "",
  time: row.time ?? "",
  effort: row.effort?.toString() ?? "",
  notes: row.notes ?? ""
});

export default function TrainingPlansPage() {
  const { user, supabaseAvailable } = useAuth();
  const [distance, setDistance] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [selectedPlanId, setSelectedPlanId] = useState(trainingPlans[0]?.id ?? "");
  const [selectedWeek, setSelectedWeek] = useState(0);

  const [logs, setLogs] = useState<TrainingLog[]>([]);
  const [logStatus, setLogStatus] = useState<"idle" | "loading" | "error">("idle");
  const [logForm, setLogForm] = useState({
    date: "",
    workoutType: "easy_run",
    distance: "",
    time: "",
    effort: "3",
    notes: ""
  });

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

  const totalMiles = logs
    .map((entry) => Number(entry.distance))
    .filter((value) => !Number.isNaN(value))
    .reduce((sum, value) => sum + value, 0);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase || !user) return;

    let active = true;
    setLogStatus("loading");

    supabase
      .from("training_logs")
      .select("id, workout_date, workout_type, distance, time, effort, notes")
      .eq("user_id", user.id)
      .order("workout_date", { ascending: false })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) { setLogStatus("error"); return; }
        setLogs((data as TrainingLogRow[])?.map(mapTrainingLog) ?? []);
        setLogStatus("idle");
      });

    return () => { active = false; };
  }, [user, supabaseAvailable]);

  const addLog = async () => {
    if (!logForm.date || !logForm.distance || !logForm.time) return;

    const supabase = getSupabaseClient();
    const entry: TrainingLog = {
      id: `local-${Date.now()}`,
      date: logForm.date,
      workoutType: logForm.workoutType,
      distance: logForm.distance,
      time: logForm.time,
      effort: logForm.effort,
      notes: logForm.notes
    };

    if (!supabase || !user) {
      setLogs((current) => [entry, ...current]);
      setLogForm({ date: "", workoutType: "easy_run", distance: "", time: "", effort: "3", notes: "" });
      return;
    }

    setLogStatus("loading");
    const { data, error } = await supabase
      .from("training_logs")
      .insert({
        user_id: user.id,
        workout_date: logForm.date,
        workout_type: logForm.workoutType,
        distance: logForm.distance,
        time: logForm.time,
        effort: Number(logForm.effort),
        notes: logForm.notes
      })
      .select("id, workout_date, workout_type, distance, time, effort, notes")
      .single();

    if (error || !data) { setLogStatus("error"); return; }

    setLogs((current) => [mapTrainingLog(data as TrainingLogRow), ...current]);
    setLogStatus("idle");
    setLogForm({ date: "", workoutType: "easy_run", distance: "", time: "", effort: "3", notes: "" });
  };

  return (
    <div>
      <section className="tool-hero container">
        <h1>Training Plans</h1>
        <p>
          Pick a plan, browse the full weekly schedule, and log your workouts.
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

            <div className="card">
              <div className="stack">
                <strong>Workout log</strong>
                {!supabaseAvailable && <div className="notice">Demo mode: logs are stored locally.</div>}
                {supabaseAvailable && !user && <div className="notice">Sign in to save workouts across devices.</div>}
                {logStatus === "error" && <div className="notice">Unable to load or save workouts right now.</div>}
                <div className="form-grid">
                  <div>
                    <span className="label">Date</span>
                    <input className="input" type="date" value={logForm.date} onChange={(e) => setLogForm({ ...logForm, date: e.target.value })} />
                  </div>
                  <div>
                    <span className="label">Workout type</span>
                    <select className="select" value={logForm.workoutType} onChange={(e) => setLogForm({ ...logForm, workoutType: e.target.value })}>
                      <option value="easy_run">Easy run</option>
                      <option value="tempo">Tempo</option>
                      <option value="intervals">Intervals</option>
                      <option value="long_run">Long run</option>
                      <option value="race">Race pace</option>
                      <option value="rest">Rest / cross-train</option>
                    </select>
                  </div>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <div>
                      <span className="label">Distance (mi)</span>
                      <input className="input" value={logForm.distance} onChange={(e) => setLogForm({ ...logForm, distance: e.target.value })} />
                    </div>
                    <div>
                      <span className="label">Time</span>
                      <input className="input" value={logForm.time} onChange={(e) => setLogForm({ ...logForm, time: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <span className="label">Effort (1-5)</span>
                    <select className="select" value={logForm.effort} onChange={(e) => setLogForm({ ...logForm, effort: e.target.value })}>
                      <option value="5">5 - All out</option>
                      <option value="4">4 - Hard</option>
                      <option value="3">3 - Moderate</option>
                      <option value="2">2 - Easy</option>
                      <option value="1">1 - Recovery</option>
                    </select>
                  </div>
                  <div>
                    <span className="label">Notes</span>
                    <textarea className="textarea" value={logForm.notes} onChange={(e) => setLogForm({ ...logForm, notes: e.target.value })} rows={2} />
                  </div>
                  <button className="btn btn-primary" type="button" onClick={addLog}>Log workout</button>
                </div>
                {logs.length > 0 && (
                  <>
                    <div className="stat-grid">
                      <div className="stat"><strong>{logs.length}</strong><span>Workouts</span></div>
                      <div className="stat"><strong>{totalMiles.toFixed(1)}</strong><span>Total miles</span></div>
                    </div>
                    <ul className="list">
                      {logs.slice(0, 10).map((entry) => (
                        <li key={entry.id} className="card card-outline">
                          <strong>{entry.date}</strong> | {entry.workoutType} | {entry.distance} mi | {entry.time}
                          {entry.notes && <div className="brand-sub">{entry.notes}</div>}
                        </li>
                      ))}
                      {logs.length > 10 && <li className="brand-sub">And {logs.length - 10} more...</li>}
                    </ul>
                  </>
                )}
              </div>
            </div>

            <Link className="btn btn-ghost" href="/tools/shoe-selector">
              Back to Shoe Finder
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
