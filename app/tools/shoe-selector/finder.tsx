"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import ShoeBib from "@/components/shoe-bib";
import { trackEvent } from "@/lib/analytics";
import type { ShoeCard } from "@/lib/shoe-catalog";
import { runFinder, type FinderAnswers } from "@/lib/shoe-finder";

const RUNS = [
  { id: "daily_trainer", label: "Everyday miles", hint: "One shoe for most runs" },
  { id: "long_run", label: "Long runs", hint: "Comfy past 10 miles" },
  { id: "speed_work", label: "Fast workouts", hint: "Tempo and intervals" },
  { id: "race_day", label: "Race day", hint: "When the clock matters" },
  { id: "recovery_runs", label: "Easy days", hint: "Slow, soft, recovery" }
];

const FEELS = [
  { id: "soft", label: "Soft", hint: "Big cushion, sink in" },
  { id: "balanced", label: "Balanced", hint: "Cushioned, not mushy" },
  { id: "fast", label: "Fast", hint: "Light and snappy" }
] as const;

const FEET = [
  { id: "none", label: "Nothing special", hint: "Just comfy, please" },
  { id: "support", label: "Support", hint: "Feet roll in, flat feet" },
  { id: "wide", label: "More room", hint: "Wide feet, bunions" }
] as const;

const BUDGETS = [0, 130, 160, 200];

function Tap({ on, label, hint, onClick }: { on: boolean; label: string; hint?: string; onClick: () => void }) {
  return (
    <button type="button" className={`finder-tap${on ? " is-on" : ""}`} aria-pressed={on} onClick={onClick}>
      <strong>{label}</strong>
      {hint ? <span>{hint}</span> : null}
    </button>
  );
}

export default function Finder({ shoes, initial }: { shoes: ShoeCard[]; initial: FinderAnswers }) {
  const [answers, setAnswers] = useState<FinderAnswers>(initial);
  const resultsRef = useRef<HTMLDivElement>(null);
  const ready = Boolean(answers.run && answers.feel && answers.feet);
  const result = useMemo(() => (ready ? runFinder(shoes, answers) : null), [shoes, answers, ready]);
  const wasReady = useRef(ready);

  useEffect(() => {
    const params = new URLSearchParams();
    if (answers.run) params.set("run", answers.run);
    if (answers.feel) params.set("feel", answers.feel);
    if (answers.feet) params.set("feet", answers.feet);
    if (answers.budget) params.set("budget", String(answers.budget));
    const query = params.toString();
    window.history.replaceState(window.history.state, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
    if (ready && !wasReady.current) {
      trackEvent("shoe_finder_result");
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    wasReady.current = ready;
  }, [answers, ready]);

  const set = (patch: Partial<FinderAnswers>) => setAnswers((current) => ({ ...current, ...patch }));

  return (
    <div className="finder">
      <div className="finder-step">
        <h2>
          <span className="clock">1</span> What are they for?
        </h2>
        <div className="finder-taps">
          {RUNS.map((run) => (
            <Tap key={run.id} on={answers.run === run.id} label={run.label} hint={run.hint} onClick={() => set({ run: run.id })} />
          ))}
        </div>
      </div>

      <div className="finder-step">
        <h2>
          <span className="clock">2</span> How should they feel?
        </h2>
        <div className="finder-taps">
          {FEELS.map((feel) => (
            <Tap key={feel.id} on={answers.feel === feel.id} label={feel.label} hint={feel.hint} onClick={() => set({ feel: feel.id })} />
          ))}
        </div>
      </div>

      <div className="finder-step">
        <h2>
          <span className="clock">3</span> Anything your feet need?
        </h2>
        <div className="finder-taps">
          {FEET.map((feet) => (
            <Tap key={feet.id} on={answers.feet === feet.id} label={feet.label} hint={feet.hint} onClick={() => set({ feet: feet.id })} />
          ))}
        </div>
      </div>

      <div className="finder-step">
        <h2>
          <span className="clock">$</span> Budget <small>optional</small>
        </h2>
        <div className="chips">
          {BUDGETS.map((budget) => (
            <button
              key={budget}
              type="button"
              className={`chip${answers.budget === budget ? " is-on" : ""}`}
              aria-pressed={answers.budget === budget}
              onClick={() => set({ budget })}
            >
              {budget ? `Under $${budget}` : "Any price"}
            </button>
          ))}
        </div>
      </div>

      <div ref={resultsRef} className="finder-results" aria-live="polite">
        {result && result.picks.length ? (
          <>
            <div className="section-head">
              <div>
                <span className="eyebrow">Your top 3</span>
                <h2>Try these first.</h2>
              </div>
            </div>
            {result.loosened ? <p className="form-message">{result.loosened}</p> : null}
            <div className="bib-grid">
              {result.picks.map((pick, i) => (
                <ShoeBib key={pick.shoe.id} shoe={pick.shoe} number={i + 1} badge={pick.badge} reason={pick.reason} eager />
              ))}
            </div>
            <div className="finder-more">
              {result.total > 3 ? (
                <Link className="btn btn-flare" href={result.gridHref}>
                  See all {result.total} matches
                </Link>
              ) : null}
              <button type="button" className="text-button" onClick={() => setAnswers({ run: "", feel: "", feet: "", budget: 0 })}>
                Start over
              </button>
            </div>
          </>
        ) : result ? (
          <div className="empty">No shoe fits that. Try another answer above.</div>
        ) : (
          <div className="empty">Three taps and your top 3 show up here.</div>
        )}
      </div>
    </div>
  );
}
