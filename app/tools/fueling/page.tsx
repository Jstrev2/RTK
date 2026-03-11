"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import { buildFuelingPlan, formatFuelingSummary, fuelingProducts, type FuelingProduct } from "@/lib/fueling";
import { useAuth } from "@/components/auth-provider";
import { getSupabaseClient } from "@/lib/supabase-client";

const distanceOptions = [
  { id: "10k", label: "10K", miles: 6.2 },
  { id: "half", label: "Half Marathon", miles: 13.1 },
  { id: "marathon", label: "Marathon", miles: 26.2 },
  { id: "50k", label: "50K Ultra", miles: 31.1 },
  { id: "50mi", label: "50 Mile Ultra", miles: 50 },
  { id: "100k", label: "100K Ultra", miles: 62.1 },
  { id: "100mi", label: "100 Mile Ultra", miles: 100 }
];

type FuelingLogRow = {
  id: string;
  run_date: string;
  run_type: string;
  distance: string | null;
  duration: string | null;
  rating: number | null;
  notes: string | null;
};

type FuelingLog = {
  id: string;
  date: string;
  runType: string;
  distance: string;
  duration: string;
  rating: string;
  notes: string;
};

const mapFuelingLog = (row: FuelingLogRow): FuelingLog => ({
  id: row.id,
  date: row.run_date,
  runType: row.run_type,
  distance: row.distance ?? "",
  duration: row.duration ?? "",
  rating: row.rating?.toString() ?? "",
  notes: row.notes ?? ""
});

export default function FuelingPage() {
  const { user, supabaseAvailable } = useAuth();
  const [distance, setDistance] = useState("half");
  const [hours, setHours] = useState("1");
  const [minutes, setMinutes] = useState("55");
  const [weight, setWeight] = useState("155");
  const [weightUnit, setWeightUnit] = useState("lb");
  const [paceOverride, setPaceOverride] = useState("");
  const [experience, setExperience] = useState("some");
  const [temperature, setTemperature] = useState("moderate");
  const [gels, setGels] = useState<FuelingProduct[]>(fuelingProducts);
  const [gelId, setGelId] = useState(fuelingProducts[0]?.id ?? "");
  const [carbTarget, setCarbTarget] = useState("");

  const [gelSearch, setGelSearch] = useState("");
  const [gelFilter, setGelFilter] = useState<"all" | "caffeine" | "high-carb" | "low-sodium">("all");

  const [logs, setLogs] = useState<FuelingLog[]>([]);
  const [logStatus, setLogStatus] = useState<"idle" | "loading" | "error">("idle");
  const [logForm, setLogForm] = useState({
    date: "",
    runType: "long_run",
    distance: "",
    duration: "",
    rating: "4",
    notes: ""
  });

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    let active = true;
    supabase
      .from("fuel_gels")
      .select("item_key, name, brand, carbs_g, calories, sodium_mg, caffeine_mg, notes")
      .eq("is_active", true)
      .then(({ data, error }) => {
        if (!active || error || !data?.length) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped: FuelingProduct[] = (data as any[]).map((row) => ({
          id: row.item_key,
          name: row.name,
          brand: row.brand,
          carbs: row.carbs_g ?? 0,
          calories: row.calories ?? 0,
          sodiumMg: row.sodium_mg ?? undefined,
          caffeineMg: row.caffeine_mg ?? undefined,
          notes: row.notes ?? undefined,
        }));
        setGels(mapped);
        if (!mapped.find((g) => g.id === gelId)) {
          setGelId(mapped[0]?.id ?? "");
        }
      });
    return () => { active = false; };
  }, []);

  const totalMinutes = useMemo(() => {
    const hrs = Number(hours) || 0;
    const mins = Number(minutes) || 0;
    return hrs * 60 + mins;
  }, [hours, minutes]);

  const weightLbs = useMemo(() => {
    const parsed = Number(weight) || 0;
    return weightUnit === "kg" ? parsed * 2.205 : parsed;
  }, [weight, weightUnit]);

  const paceMinutes = useMemo(() => {
    if (!paceOverride) {
      return undefined;
    }
    const parts = paceOverride.split(":").map(Number);
    if (parts.some((item) => Number.isNaN(item))) {
      return undefined;
    }
    if (parts.length === 1) {
      return parts[0];
    }
    if (parts.length >= 2) {
      return parts[0] + parts[1] / 60;
    }
    return undefined;
  }, [paceOverride]);

  const carbTargetValue = useMemo(() => {
    if (!carbTarget) {
      return undefined;
    }
    const parsed = Number(carbTarget);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return undefined;
    }
    return parsed;
  }, [carbTarget]);

  const plan = useMemo(() => {
    const distanceData = distanceOptions.find((item) => item.id === distance);
    if (!distanceData || totalMinutes <= 0 || weightLbs <= 0) {
      return null;
    }
    return buildFuelingPlan({
      distanceMiles: distanceData.miles,
      distanceLabel: distanceData.label,
      goalTimeMinutes: totalMinutes,
      weightLbs,
      paceMinutes,
      experience: experience as "first" | "some" | "experienced" | "elite",
      temperature: temperature as "cool" | "moderate" | "warm" | "hot",
      gelId,
      carbTargetPerHour: carbTargetValue,
      gels
    });
  }, [
    distance,
    totalMinutes,
    weightLbs,
    paceMinutes,
    experience,
    temperature,
    gelId,
    carbTargetValue,
    gels
  ]);

  const summary = plan ? formatFuelingSummary(plan) : null;

  const filteredGels = useMemo(() => {
    let list = gels;
    if (gelSearch) {
      const q = gelSearch.toLowerCase();
      list = list.filter((g) => `${g.brand} ${g.name}`.toLowerCase().includes(q));
    }
    if (gelFilter === "caffeine") list = list.filter((g) => (g.caffeineMg ?? 0) > 0);
    if (gelFilter === "high-carb") list = list.filter((g) => g.carbs >= 30);
    if (gelFilter === "low-sodium") list = list.filter((g) => (g.sodiumMg ?? 999) <= 60);
    return list;
  }, [gels, gelSearch, gelFilter]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase || !user) {
      return;
    }

    let active = true;
    setLogStatus("loading");

    supabase
      .from("fueling_logs")
      .select("id, run_date, run_type, distance, duration, rating, notes")
      .eq("user_id", user.id)
      .order("run_date", { ascending: false })
      .then(({ data, error }) => {
        if (!active) {
          return;
        }
        if (error) {
          setLogStatus("error");
          return;
        }
        setLogs((data as FuelingLogRow[])?.map(mapFuelingLog) ?? []);
        setLogStatus("idle");
      });

    return () => {
      active = false;
    };
  }, [user, supabaseAvailable]);

  const addLog = async () => {
    if (!logForm.date || !logForm.distance || !logForm.duration) {
      return;
    }

    const supabase = getSupabaseClient();
    const entry: FuelingLog = {
      id: `local-${Date.now()}`,
      date: logForm.date,
      runType: logForm.runType,
      distance: logForm.distance,
      duration: logForm.duration,
      rating: logForm.rating,
      notes: logForm.notes
    };

    if (!supabase || !user) {
      setLogs((current) => [entry, ...current]);
      setLogForm({
        date: "",
        runType: "long_run",
        distance: "",
        duration: "",
        rating: "4",
        notes: ""
      });
      return;
    }

    setLogStatus("loading");
    const { data, error } = await supabase
      .from("fueling_logs")
      .insert({
        user_id: user.id,
        run_date: logForm.date,
        run_type: logForm.runType,
        distance: logForm.distance,
        duration: logForm.duration,
        rating: Number(logForm.rating),
        notes: logForm.notes
      })
      .select("id, run_date, run_type, distance, duration, rating, notes")
      .single();

    if (error || !data) {
      setLogStatus("error");
      return;
    }

    setLogs((current) => [mapFuelingLog(data as FuelingLogRow), ...current]);
    setLogStatus("idle");
    setLogForm({
      date: "",
      runType: "long_run",
      distance: "",
      duration: "",
      rating: "4",
      notes: ""
    });
  };

  return (
    <div>
      <section className="tool-hero container">
        <h1>Fueling Calculator</h1>
        <p>
          Build a race-day fueling plan in minutes, then track what works on
          your long runs.
        </p>
      </section>

      <section className="section container">
        <div className="grid grid-2">
          <div className="card">
            <div className="stack">
              <strong>Race inputs</strong>
              <div className="form-grid">
                <div>
                  <span className="label">Distance</span>
                  <select className="select" value={distance} onChange={(event) => setDistance(event.target.value)}>
                    {distanceOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className="label">Goal time</span>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <input
                      className="input"
                      type="number"
                      min="0"
                      value={hours}
                      onChange={(event) => setHours(event.target.value)}
                      placeholder="Hours"
                    />
                    <input
                      className="input"
                      type="number"
                      min="0"
                      value={minutes}
                      onChange={(event) => setMinutes(event.target.value)}
                      placeholder="Minutes"
                    />
                  </div>
                </div>
                <div>
                  <span className="label">Body weight</span>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <input
                      className="input"
                      type="number"
                      min="80"
                      value={weight}
                      onChange={(event) => setWeight(event.target.value)}
                    />
                    <select
                      className="select"
                      value={weightUnit}
                      onChange={(event) => setWeightUnit(event.target.value)}
                      style={{ maxWidth: "90px" }}
                    >
                      <option value="lb">lb</option>
                      <option value="kg">kg</option>
                    </select>
                  </div>
                </div>
                <div>
                  <span className="label">Pace override (min:sec per mile)</span>
                  <input
                    className="input"
                    value={paceOverride}
                    onChange={(event) => setPaceOverride(event.target.value)}
                    placeholder="8:30"
                  />
                </div>
                <div>
                  <span className="label">Experience level</span>
                  <select
                    className="select"
                    value={experience}
                    onChange={(event) => setExperience(event.target.value)}
                  >
                    <option value="first">First timer</option>
                    <option value="some">Completed 1-3 races</option>
                    <option value="experienced">Experienced</option>
                    <option value="elite">Elite</option>
                  </select>
                </div>
                <div>
                  <span className="label">Conditions</span>
                  <select
                    className="select"
                    value={temperature}
                    onChange={(event) => setTemperature(event.target.value)}
                  >
                    <option value="cool">Cool</option>
                    <option value="moderate">Moderate</option>
                    <option value="warm">Warm</option>
                    <option value="hot">Hot</option>
                  </select>
                </div>
                <div>
                  <span className="label">Gel choice</span>
                  <select
                    className="select"
                    value={gelId}
                    onChange={(event) => setGelId(event.target.value)}
                  >
                    {gels.map((gel) => (
                      <option key={gel.id} value={gel.id}>
                        {gel.brand} {gel.name} ({gel.carbs}g carbs)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className="label">Carb target (g/hr)</span>
                  <input
                    className="input"
                    type="number"
                    min="20"
                    max="120"
                    value={carbTarget}
                    onChange={(event) => setCarbTarget(event.target.value)}
                    placeholder="Auto"
                  />
                  {plan && summary ? (
                    <span className="brand-sub">Suggested range: {summary.carbs}</span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="stack">
            <div className="card card-accent">
              <div className="stack">
                <strong>Your fueling plan</strong>
                {plan && summary ? (
                  <div className="stack">
                    <div className="stat-grid">
                      <div className="stat">
                        <strong>{summary.totalTime}</strong>
                        <span>Total time</span>
                      </div>
                      <div className="stat">
                        <strong>{summary.pace}</strong>
                        <span>Avg pace</span>
                      </div>
                      <div className="stat">
                        <strong>{summary.carbs}</strong>
                        <span>Carbs</span>
                      </div>
                      <div className="stat">
                        <strong>{summary.carbTarget}</strong>
                        <span>Target carbs</span>
                      </div>
                      <div className="stat">
                        <strong>{summary.fluids}</strong>
                        <span>Fluids</span>
                      </div>
                    </div>
                    <div className="divider" />
                    <div className="card card-outline">
                      <div className="stack">
                        <strong>Selected gel</strong>
                        <div className="brand-sub">
                          {plan.gel.brand} {plan.gel.name} · {plan.gel.carbs}g carbs · {plan.gel.calories} kcal
                        </div>
                        <div className="brand-sub">
                          Sodium {plan.gel.sodiumMg ?? "varies"} mg · Caffeine {plan.gel.caffeineMg ?? "none"} mg
                        </div>
                        {plan.gel.notes ? <div className="brand-sub">{plan.gel.notes}</div> : null}
                        <span className="tag">Every {plan.gelIntervalMinutes} min</span>
                      </div>
                    </div>
                    <div>
                      <strong>Schedule</strong>
                      <ul className="list">
                        {plan?.schedule.map((step) => (
                          <li key={`${step.timeMinutes}-${step.item}`}>
                            Mile {step.mile.toFixed(1)} at {step.timeMinutes} min: {step.item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <p>Enter your race details to see a plan.</p>
                )}
              </div>
            </div>

            <div className="card">
              <div className="stack">
                <strong>Fueling log</strong>
                {!supabaseAvailable ? (
                  <div className="notice">Connect Supabase to save fueling logs.</div>
                ) : null}
                {supabaseAvailable && !user ? (
                  <div className="notice">Sign in to save fueling logs across devices.</div>
                ) : null}
                {logStatus === "error" ? (
                  <div className="notice">Unable to load or save logs right now.</div>
                ) : null}
                <div className="form-grid">
                  <div>
                    <span className="label">Date</span>
                    <input
                      className="input"
                      type="date"
                      value={logForm.date}
                      onChange={(event) => setLogForm({ ...logForm, date: event.target.value })}
                    />
                  </div>
                  <div>
                    <span className="label">Run type</span>
                    <select
                      className="select"
                      value={logForm.runType}
                      onChange={(event) => setLogForm({ ...logForm, runType: event.target.value })}
                    >
                      <option value="long_run">Long run</option>
                      <option value="tempo">Tempo</option>
                      <option value="race">Race</option>
                      <option value="easy">Easy</option>
                    </select>
                  </div>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <div>
                      <span className="label">Distance</span>
                      <input
                        className="input"
                        value={logForm.distance}
                        onChange={(event) => setLogForm({ ...logForm, distance: event.target.value })}
                      />
                    </div>
                    <div>
                      <span className="label">Duration</span>
                      <input
                        className="input"
                        value={logForm.duration}
                        onChange={(event) => setLogForm({ ...logForm, duration: event.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <span className="label">Rating</span>
                    <select
                      className="select"
                      value={logForm.rating}
                      onChange={(event) => setLogForm({ ...logForm, rating: event.target.value })}
                    >
                      <option value="5">5 - Great</option>
                      <option value="4">4 - Good</option>
                      <option value="3">3 - Ok</option>
                      <option value="2">2 - Rough</option>
                      <option value="1">1 - Bad</option>
                    </select>
                  </div>
                  <div>
                    <span className="label">Notes</span>
                    <textarea
                      className="textarea"
                      value={logForm.notes}
                      onChange={(event) => setLogForm({ ...logForm, notes: event.target.value })}
                      rows={3}
                    />
                  </div>
                  <button className="btn btn-primary" type="button" onClick={addLog}>
                    Save log
                  </button>
                </div>
                <ul className="list">
                  {logs.map((entry) => (
                    <li key={entry.id} className="card card-outline">
                      <strong>{entry.date}</strong> | {entry.runType} | {entry.distance} | {entry.duration} | {entry.rating} / 5
                      <div>{entry.notes}</div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <Link className="btn btn-ghost" href="/tools/training-plans">
              Next tool: Training Plans
            </Link>
          </div>
        </div>
      </section>

      <section className="section container">
        <div className="stack" style={{ marginBottom: "24px" }}>
          <h2 className="section-title">Gel library</h2>
          <p className="section-lede">
            Pick a gel to update your fueling schedule. Filter by nutrition profile.
          </p>
        </div>
        <div className="filter-bar" style={{ marginBottom: "20px" }}>
          <div className="filter-group">
            <span className="label">Search</span>
            <input
              className="input"
              placeholder="Brand or name..."
              value={gelSearch}
              onChange={(event) => setGelSearch(event.target.value)}
            />
          </div>
          <div className="filter-group">
            <span className="label">Filter</span>
            <select
              className="select"
              value={gelFilter}
              onChange={(event) => setGelFilter(event.target.value as typeof gelFilter)}
            >
              <option value="all">All gels</option>
              <option value="caffeine">Has caffeine</option>
              <option value="high-carb">High carb (30g+)</option>
              <option value="low-sodium">Low sodium (≤60mg)</option>
            </select>
          </div>
        </div>
        <div className="grid grid-2">
          {filteredGels.map((gel, index) => (
            <button
              key={gel.id}
              type="button"
              className={`card card-outline fade-up ${gel.id === gelId ? "card-accent" : ""}`}
              style={{ "--delay": `${index * 0.03}s` } as CSSProperties}
              onClick={() => setGelId(gel.id)}
            >
              <div className="stack">
                <strong>{gel.brand} {gel.name}</strong>
                <span className="brand-sub">{gel.carbs}g carbs · {gel.calories} kcal</span>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <span className="tag">Sodium {gel.sodiumMg ?? "varies"} mg</span>
                  <span className="tag">Caffeine {gel.caffeineMg ?? "none"} mg</span>
                </div>
                {gel.notes ? <span className="brand-sub">{gel.notes}</span> : null}
                <span className="badge">{gel.id === gelId ? "Selected" : "Use this gel"}</span>
              </div>
            </button>
          ))}
          {filteredGels.length === 0 ? (
            <p className="brand-sub">No gels match your search.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
