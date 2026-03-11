"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

const distances = [
  { id: "1mi", label: "1 Mile", miles: 1 },
  { id: "5k", label: "5K", miles: 3.10686 },
  { id: "10k", label: "10K", miles: 6.21371 },
  { id: "half", label: "Half Marathon", miles: 13.1094 },
  { id: "marathon", label: "Marathon", miles: 26.2188 },
  { id: "50k", label: "50K", miles: 31.0686 },
  { id: "custom", label: "Custom", miles: 0 },
];

const formatTime = (totalSeconds: number): string => {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return "--";
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.round(totalSeconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const formatPace = (secondsPerMile: number): string => {
  if (!Number.isFinite(secondsPerMile) || secondsPerMile <= 0) return "--";
  const m = Math.floor(secondsPerMile / 60);
  const s = Math.round(secondsPerMile % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const parseTimeInput = (value: string): number => {
  const parts = value.split(":").map(Number);
  if (parts.some((p) => Number.isNaN(p))) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 1) return parts[0] * 60;
  return 0;
};

type Mode = "time_to_pace" | "pace_to_time";

export default function PaceCalculatorPage() {
  const [mode, setMode] = useState<Mode>("time_to_pace");
  const [distanceId, setDistanceId] = useState("half");
  const [customMiles, setCustomMiles] = useState("");
  const [finishTime, setFinishTime] = useState("1:55:00");
  const [paceInput, setPaceInput] = useState("8:45");

  const miles = useMemo(() => {
    if (distanceId === "custom") return Number(customMiles) || 0;
    return distances.find((d) => d.id === distanceId)?.miles ?? 0;
  }, [distanceId, customMiles]);

  const result = useMemo(() => {
    if (miles <= 0) return null;

    if (mode === "time_to_pace") {
      const totalSec = parseTimeInput(finishTime);
      if (totalSec <= 0) return null;
      const pacePerMile = totalSec / miles;
      const pacePerKm = pacePerMile / 1.60934;
      const mph = 3600 / pacePerMile;
      return { totalSec, pacePerMile, pacePerKm, mph, miles };
    }

    const paceSec = parseTimeInput(paceInput);
    if (paceSec <= 0) return null;
    const totalSec = paceSec * miles;
    const pacePerMile = paceSec;
    const pacePerKm = pacePerMile / 1.60934;
    const mph = 3600 / pacePerMile;
    return { totalSec, pacePerMile, pacePerKm, mph, miles };
  }, [mode, miles, finishTime, paceInput]);

  const splits = useMemo(() => {
    if (!result) return [];
    const { pacePerMile, miles: dist } = result;
    const list: { mile: number; elapsed: string }[] = [];
    const fullMiles = Math.floor(dist);
    for (let i = 1; i <= fullMiles; i++) {
      list.push({ mile: i, elapsed: formatTime(pacePerMile * i) });
    }
    if (dist > fullMiles) {
      list.push({
        mile: Math.round(dist * 100) / 100,
        elapsed: formatTime(pacePerMile * dist),
      });
    }
    return list;
  }, [result]);

  const predictions = useMemo(() => {
    if (!result) return [];
    const { pacePerMile } = result;
    return distances
      .filter((d) => d.id !== "custom" && d.miles !== miles)
      .map((d) => ({
        label: d.label,
        time: formatTime(pacePerMile * d.miles),
      }));
  }, [result, miles]);

  return (
    <div>
      <section className="tool-hero container">
        <h1>Pace Calculator</h1>
        <p>
          Enter a finish time or a pace to calculate splits, predict race
          times, and convert between units.
        </p>
      </section>

      <section className="section container">
        <div className="grid grid-2">
          <div className="card">
            <div className="stack">
              <strong>Calculator</strong>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  className={`btn ${mode === "time_to_pace" ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => setMode("time_to_pace")}
                >
                  Time → Pace
                </button>
                <button
                  type="button"
                  className={`btn ${mode === "pace_to_time" ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => setMode("pace_to_time")}
                >
                  Pace → Time
                </button>
              </div>
              <div className="form-grid">
                <div>
                  <span className="label">Distance</span>
                  <select
                    className="select"
                    value={distanceId}
                    onChange={(e) => setDistanceId(e.target.value)}
                  >
                    {distances.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>
                {distanceId === "custom" && (
                  <div>
                    <span className="label">Distance (miles)</span>
                    <input
                      className="input"
                      type="number"
                      step="0.01"
                      value={customMiles}
                      onChange={(e) => setCustomMiles(e.target.value)}
                      placeholder="13.1"
                    />
                  </div>
                )}
                {mode === "time_to_pace" ? (
                  <div>
                    <span className="label">Finish time (h:mm:ss or mm:ss)</span>
                    <input
                      className="input"
                      value={finishTime}
                      onChange={(e) => setFinishTime(e.target.value)}
                      placeholder="1:55:00"
                    />
                  </div>
                ) : (
                  <div>
                    <span className="label">Pace per mile (mm:ss)</span>
                    <input
                      className="input"
                      value={paceInput}
                      onChange={(e) => setPaceInput(e.target.value)}
                      placeholder="8:45"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="stack">
            {result ? (
              <div className="card card-accent">
                <div className="stack">
                  <strong>Results</strong>
                  <div className="stat-grid">
                    <div className="stat">
                      <strong>{formatTime(result.totalSec)}</strong>
                      <span>Finish time</span>
                    </div>
                    <div className="stat">
                      <strong>{formatPace(result.pacePerMile)}</strong>
                      <span>Per mile</span>
                    </div>
                    <div className="stat">
                      <strong>{formatPace(result.pacePerKm)}</strong>
                      <span>Per km</span>
                    </div>
                    <div className="stat">
                      <strong>{result.mph.toFixed(1)}</strong>
                      <span>MPH</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card card-outline">
                Enter a distance and time to see your pace.
              </div>
            )}

            {predictions.length > 0 && (
              <div className="card">
                <div className="stack">
                  <strong>Race predictions</strong>
                  <p className="brand-sub">
                    Estimated finish times at the same effort level.
                  </p>
                  <div className="stat-grid">
                    {predictions.map((p) => (
                      <div key={p.label} className="stat">
                        <strong>{p.time}</strong>
                        <span>{p.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {splits.length > 0 && splits.length <= 50 && (
              <div className="card">
                <div className="stack">
                  <strong>Mile splits</strong>
                  <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                    <table className="results-table">
                      <thead>
                        <tr>
                          <th>Mile</th>
                          <th>Split</th>
                          <th>Elapsed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {splits.map((s, i) => (
                          <tr key={s.mile}>
                            <td>{s.mile}</td>
                            <td>{formatPace(result!.pacePerMile)}</td>
                            <td>{s.elapsed}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            <Link className="btn btn-ghost" href="/tools/fueling">
              Plan your race-day fueling
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
