"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { trainingPlans, type TrainingPlan } from "@/lib/data";
import { injuries, MEDICAL_DISCLAIMER, type Injury } from "@/lib/injuries";
import { adjustPlan, type AdjustedWeek } from "@/lib/plan-adjuster";
import { runTriage, TRIAGE_QUESTIONS, type TriageAnswers, type TriageResult } from "@/lib/triage";
import { buildCustomPlan, applyLongRunDay, type PlanShape } from "@/lib/custom-plan";
import { useAuth } from "@/components/auth-provider";

const phaseIcons: Record<AdjustedWeek["phase"], string> = {
  rest: "🛌",
  return: "🚶",
  rebuild: "🏃",
  taper: "📉",
  race: "🏁"
};

const EMAIL_KEY = "rtk_rescue_email";
const STATE_KEY = "rtk_rescue_state";

type SavedState = {
  injuryId: string;
  answers: Partial<TriageAnswers>;
  planMode: "custom" | "rtk";
  shape: PlanShape;
  rtkPlanId: string;
  rtkWeek: number;
};

function WeekCard({ week }: { week: AdjustedWeek }) {
  return (
    <div className="card card-outline">
      <div className="stack">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <strong>
            {phaseIcons[week.phase]} Week {week.weekNumber}
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

function EmailGate({ onUnlock }: { onUnlock: () => void }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");

  const submit = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) return;
    setStatus("sending");
    try {
      const { getSupabaseClient } = await import("@/lib/supabase-client");
      const supabase = getSupabaseClient();
      if (supabase) {
        const { error } = await supabase
          .from("newsletter_subscribers")
          .insert({ email: trimmed });
        if (error && error.code !== "23505") {
          setStatus("error");
          return;
        }
      }
      try {
        localStorage.setItem(EMAIL_KEY, trimmed);
      } catch {
        // Private browsing: unlock for the session anyway.
      }
      onUnlock();
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="card card-accent">
      <div className="stack">
        <strong>See your first rebuilt week</strong>
        <p className="brand-sub">
          Enter your email and the first week of your comeback schedule appears
          right here. We&apos;ll also send occasional, genuinely useful training
          updates — no daily noise.
        </p>
        <div className="newsletter-form">
          <input
            className="input"
            type="email"
            placeholder="you@example.com"
            aria-label="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && submit()}
          />
          <button className="btn btn-primary" type="button" onClick={submit} disabled={status === "sending"}>
            {status === "sending" ? "Unlocking..." : "Show my week"}
          </button>
        </div>
        {status === "error" ? (
          <div className="notice">Something went wrong. Please try again.</div>
        ) : null}
      </div>
    </div>
  );
}

function RescueCheckout() {
  const { user, session } = useAuth();
  const [state, setState] = useState<"idle" | "loading" | "unavailable" | "error">("idle");

  const startCheckout = async () => {
    if (!session) return;
    setState("loading");
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ product: "rescue" })
      });
      if (response.status === 503) {
        setState("unavailable");
        return;
      }
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setState("error");
    } catch {
      setState("error");
    }
  };

  return (
    <div className="card card-accent">
      <div className="stack">
        <span className="pill">Injury Rescue</span>
        <strong>Unlock your full comeback schedule</strong>
        <p>
          Every remaining week through race day — rest, graded return-to-run,
          volume-capped rebuild, and your taper when the timeline allows it.
          Re-run it as the injury evolves. One-time <strong>$29</strong>, 90
          days of access, no subscription.
        </p>
        <div className="button-row">
          {user ? (
            <button className="btn btn-primary" type="button" onClick={startCheckout} disabled={state === "loading"}>
              {state === "loading" ? "Opening checkout..." : "Get my full schedule — $29"}
            </button>
          ) : (
            <Link className="btn btn-primary" href="/login">Sign in to unlock</Link>
          )}
          <Link className="btn btn-ghost" href="/premium">Compare options</Link>
        </div>
        {state === "unavailable" ? (
          <div className="notice">
            Checkout is not switched on yet. Email hello@runnertoolkit.com for
            early access.
          </div>
        ) : null}
        {state === "error" ? (
          <div className="notice">Checkout could not start. Please try again.</div>
        ) : null}
      </div>
    </div>
  );
}

type PlanMode = "custom" | "rtk";

function RescueContent() {
  const { isPremium } = useAuth();
  const searchParams = useSearchParams();
  const status = searchParams.get("status");

  // After the Stripe redirect, the webhook stamps rescue access on the user's
  // app_metadata — refresh the JWT so access appears without re-login.
  useEffect(() => {
    if (status !== "success" || isPremium) return;
    let cancelled = false;
    const refreshAfter = async (delay: number) => {
      await new Promise((resolve) => setTimeout(resolve, delay));
      if (cancelled) return;
      try {
        const { getSupabaseClient } = await import("@/lib/supabase-client");
        await getSupabaseClient()?.auth.refreshSession();
      } catch {
        // Non-fatal; the next attempt or a reload picks it up.
      }
    };
    (async () => {
      await refreshAfter(0);
      await refreshAfter(3000);
      await refreshAfter(8000);
    })();
    return () => {
      cancelled = true;
    };
  }, [status, isPremium]);

  const [injuryId, setInjuryId] = useState(injuries[0]?.id ?? "");
  const [answers, setAnswers] = useState<Partial<TriageAnswers>>({});
  const [planMode, setPlanMode] = useState<PlanMode>("custom");
  const [shape, setShape] = useState<PlanShape>({
    distance: "half",
    weeksToRace: 8,
    runsPerWeek: 4,
    currentWeeklyMiles: 25,
    peakWeeklyMiles: undefined,
    longRunDay: "Sunday"
  });
  const [rtkPlanId, setRtkPlanId] = useState(trainingPlans[0]?.id ?? "");
  const [rtkWeek, setRtkWeek] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [emailUnlocked, setEmailUnlocked] = useState(false);

  // Restore inputs after a full-page round trip (most importantly the Stripe
  // checkout redirect): a buyer must come back to their verdict, not an empty
  // form above a "your schedule is unlocked" banner.
  useEffect(() => {
    try {
      if (localStorage.getItem(EMAIL_KEY)) setEmailUnlocked(true);
      const raw = localStorage.getItem(STATE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as SavedState;
        if (saved && typeof saved === "object" && saved.answers) {
          if (injuries.some((i) => i.id === saved.injuryId)) setInjuryId(saved.injuryId);
          setAnswers(saved.answers);
          if (saved.planMode === "custom" || saved.planMode === "rtk") setPlanMode(saved.planMode);
          if (saved.shape) setShape((s) => ({ ...s, ...saved.shape }));
          if (trainingPlans.some((p) => p.id === saved.rtkPlanId)) setRtkPlanId(saved.rtkPlanId);
          if (Number.isFinite(saved.rtkWeek)) setRtkWeek(saved.rtkWeek);
          setSubmitted(true);
        }
      }
    } catch {
      // Storage unavailable or corrupt: start fresh.
    }
  }, []);

  // Persist the submitted inputs so the verdict survives reloads/redirects.
  useEffect(() => {
    if (!submitted) return;
    try {
      const saved: SavedState = { injuryId, answers, planMode, shape, rtkPlanId, rtkWeek };
      localStorage.setItem(STATE_KEY, JSON.stringify(saved));
    } catch {
      // Non-fatal.
    }
  }, [submitted, injuryId, answers, planMode, shape, rtkPlanId, rtkWeek]);

  const triageComplete = TRIAGE_QUESTIONS.every((q) => answers[q.id] !== undefined);
  const selectedInjury = injuries.find((i) => i.id === injuryId);
  const rtkPlan = trainingPlans.find((p) => p.id === rtkPlanId) ?? trainingPlans[0];

  // A cleared number input becomes 0 via Number("") — never let that silently
  // clamp into a phantom 3-week plan; block submission instead.
  const shapeValid =
    planMode !== "custom" ||
    (Number.isFinite(shape.weeksToRace) &&
      shape.weeksToRace >= 1 &&
      Number.isFinite(shape.currentWeeklyMiles) &&
      shape.currentWeeklyMiles >= 1 &&
      (shape.peakWeeklyMiles === undefined ||
        (Number.isFinite(shape.peakWeeklyMiles) && shape.peakWeeklyMiles >= 1)));

  const result = useMemo(() => {
    if (!submitted || !triageComplete || !shapeValid) return null;
    const triage: TriageResult = runTriage(answers as TriageAnswers);

    // Bone-stress patterns escalate to the stress-fracture protocol no matter
    // which injury was picked — conservative until imaging says otherwise.
    const effectiveInjuryId = triage.suspectBoneStress ? "stress_fracture" : injuryId;

    let plan: TrainingPlan;
    let reportedWeek: number;
    if (planMode === "custom") {
      plan = buildCustomPlan(shape);
      reportedWeek = 1;
    } else {
      plan = rtkPlan;
      reportedWeek = rtkWeek;
    }

    const adjusted = adjustPlan(plan, effectiveInjuryId, triage.severity, reportedWeek);
    if (!adjusted) return null;

    const weeks =
      planMode === "custom"
        ? adjusted.weeks.map((week) => ({
            ...week,
            workouts: applyLongRunDay(week.workouts, shape.longRunDay)
          }))
        : adjusted.weeks;

    const remaining = weeks.filter((w) => w.weekNumber >= adjusted.reportedWeek);
    return { triage, adjusted, remaining, escalated: triage.suspectBoneStress && injuryId !== "stress_fracture" };
  }, [submitted, triageComplete, answers, injuryId, planMode, shape, rtkPlan, rtkWeek]);

  const effectiveInjury: Injury | undefined = result
    ? result.adjusted.injury
    : selectedInjury;

  const setAnswer = (id: keyof TriageAnswers, value: boolean) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
    setSubmitted(false);
  };

  return (
    <section className="section container">
        {status === "success" ? (
          <div className="notice" style={{ marginBottom: "24px" }}>
            Payment received — your full comeback schedule is unlocked below.
          </div>
        ) : null}
        {status === "cancelled" ? (
          <div className="notice" style={{ marginBottom: "24px" }}>
            Checkout cancelled. No charge was made.
          </div>
        ) : null}

        <div className="stack" style={{ gap: "24px" }}>
          <div className="card">
            <div className="stack">
              <div>
                <span className="pill">Step 1</span>
                <strong style={{ display: "block", marginTop: "8px" }}>
                  What are you managing?
                </strong>
              </div>
              <div className="filter-group">
                <span className="label">Closest match</span>
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
              {selectedInjury ? (
                <p className="brand-sub">{selectedInjury.summary}</p>
              ) : null}
            </div>
          </div>

          <div className="card">
            <div className="stack">
              <div>
                <span className="pill">Step 2</span>
                <strong style={{ display: "block", marginTop: "8px" }}>
                  Symptom check
                </strong>
                <div className="brand-sub">
                  We grade severity from your answers — the way a professional
                  would — instead of asking you to guess how bad it is.
                </div>
              </div>
              {TRIAGE_QUESTIONS.map((q) => (
                <div key={q.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                  <div style={{ flex: "1 1 320px" }}>
                    <strong style={{ fontSize: ".95rem" }}>{q.question}</strong>
                    <div className="brand-sub">{q.detail}</div>
                  </div>
                  <div className="button-row" role="group" aria-label={q.question}>
                    <button
                      type="button"
                      className={`btn btn-sm ${answers[q.id] === true ? "btn-primary" : "btn-secondary"}`}
                      aria-pressed={answers[q.id] === true}
                      onClick={() => setAnswer(q.id, true)}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${answers[q.id] === false ? "btn-primary" : "btn-secondary"}`}
                      aria-pressed={answers[q.id] === false}
                      onClick={() => setAnswer(q.id, false)}
                    >
                      No
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="stack">
              <div>
                <span className="pill">Step 3</span>
                <strong style={{ display: "block", marginTop: "8px" }}>
                  The plan you were following
                </strong>
                <div className="brand-sub">
                  Hal Higdon PDF, Garmin Coach, a coach&apos;s spreadsheet, or a
                  Runner Toolkit plan — six numbers describe its shape well
                  enough to rebuild the rest of it.
                </div>
              </div>
              <div className="button-row">
                <button
                  type="button"
                  className={`btn btn-sm ${planMode === "custom" ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => {
                    setPlanMode("custom");
                    setSubmitted(false);
                  }}
                >
                  Describe my plan
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${planMode === "rtk" ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => {
                    setPlanMode("rtk");
                    setSubmitted(false);
                  }}
                >
                  I&apos;m on a Runner Toolkit plan
                </button>
              </div>

              {planMode === "custom" ? (
                <div className="form-grid">
                  <div>
                    <span className="label">Race distance</span>
                    <select
                      className="select"
                      value={shape.distance}
                      onChange={(event) => {
                        setShape((s) => ({ ...s, distance: event.target.value as PlanShape["distance"] }));
                        setSubmitted(false);
                      }}
                    >
                      <option value="5k">5K</option>
                      <option value="10k">10K</option>
                      <option value="half">Half marathon</option>
                      <option value="marathon">Marathon</option>
                    </select>
                  </div>
                  <div>
                    <span className="label">Weeks until race day</span>
                    <input
                      className="input"
                      type="number"
                      min={3}
                      max={30}
                      value={shape.weeksToRace}
                      onChange={(event) => {
                        setShape((s) => ({ ...s, weeksToRace: Number(event.target.value) }));
                        setSubmitted(false);
                      }}
                    />
                  </div>
                  <div>
                    <span className="label">Runs per week</span>
                    <select
                      className="select"
                      value={shape.runsPerWeek}
                      onChange={(event) => {
                        setShape((s) => ({ ...s, runsPerWeek: Number(event.target.value) }));
                        setSubmitted(false);
                      }}
                    >
                      {[2, 3, 4, 5, 6].map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <span className="label">Miles in a typical recent week</span>
                    <input
                      className="input"
                      type="number"
                      min={4}
                      max={120}
                      value={shape.currentWeeklyMiles}
                      onChange={(event) => {
                        setShape((s) => ({ ...s, currentWeeklyMiles: Number(event.target.value) }));
                        setSubmitted(false);
                      }}
                    />
                  </div>
                  <div>
                    <span className="label">Plan&apos;s biggest week (optional)</span>
                    <input
                      className="input"
                      type="number"
                      min={4}
                      max={140}
                      placeholder="Leave blank if unsure"
                      value={shape.peakWeeklyMiles ?? ""}
                      onChange={(event) => {
                        const value = event.target.value;
                        setShape((s) => ({ ...s, peakWeeklyMiles: value === "" ? undefined : Number(value) }));
                        setSubmitted(false);
                      }}
                    />
                  </div>
                  <div>
                    <span className="label">Long run day</span>
                    <select
                      className="select"
                      value={shape.longRunDay}
                      onChange={(event) => {
                        setShape((s) => ({ ...s, longRunDay: event.target.value as PlanShape["longRunDay"] }));
                        setSubmitted(false);
                      }}
                    >
                      <option value="Saturday">Saturday</option>
                      <option value="Sunday">Sunday</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="form-grid">
                  <div>
                    <span className="label">Your plan</span>
                    <select
                      className="select"
                      value={rtkPlanId}
                      onChange={(event) => {
                        setRtkPlanId(event.target.value);
                        setRtkWeek(1);
                        setSubmitted(false);
                      }}
                    >
                      {trainingPlans.map((plan) => (
                        <option key={plan.id} value={plan.id}>{plan.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <span className="label">Which week are you in?</span>
                    <select
                      className="select"
                      value={rtkWeek}
                      onChange={(event) => {
                        setRtkWeek(Number(event.target.value));
                        setSubmitted(false);
                      }}
                    >
                      {Array.from({ length: rtkPlan?.durationWeeks ?? 1 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          Week {i + 1} of {rtkPlan?.durationWeeks}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {!result ? (
            <button
              className="btn btn-primary"
              type="button"
              disabled={!triageComplete || !shapeValid}
              onClick={() => setSubmitted(true)}
              style={{ alignSelf: "flex-start" }}
            >
              {!triageComplete
                ? "Answer the symptom check to continue"
                : !shapeValid
                  ? "Fill in your plan numbers to continue"
                  : "Get my verdict"}
            </button>
          ) : null}

          {result ? (
            <div className="stack" style={{ gap: "24px" }}>
              <div className="card card-outline">
                <div className="stack">
                  <div>
                    <span className="pill">How we graded this</span>
                    <strong style={{ display: "block", marginTop: "8px" }}>
                      {result.triage.severity === "mild"
                        ? "Mild — manageable with a careful, reduced schedule"
                        : result.triage.severity === "moderate"
                          ? "Moderate — running load needs a real reset"
                          : "Severe — the comeback starts with rest, not runs"}
                    </strong>
                  </div>
                  <ul className="list">
                    {result.triage.reasons.map((reason) => (
                      <li key={reason} className="brand-sub">{reason}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {result.escalated ? (
                <div className="card card-accent">
                  <div className="stack">
                    <strong>Your answers fit a bone-stress pattern.</strong>
                    <p>
                      Pinpoint bone tenderness with night pain or hop pain can
                      mean a stress fracture — so we&apos;ve switched your plan to
                      the suspected-stress-fracture protocol until imaging says
                      otherwise. That&apos;s not us being dramatic; running on a
                      stress fracture is how a 6-week problem becomes a 6-month
                      one.
                    </p>
                  </div>
                </div>
              ) : null}

              {result.triage.seeProfessionalFirst && !result.escalated ? (
                <div className="card card-accent">
                  <div className="stack">
                    <strong>Get this assessed before you restart training.</strong>
                    <p>
                      This combination of symptoms has gone beyond confident
                      self-management. Treat the schedule below as the plan to
                      bring to that appointment — not a substitute for it.
                    </p>
                  </div>
                </div>
              ) : null}

              <div className={result.adjusted.feasibility.canRace ? "notice" : "card card-accent"}>
                <strong>
                  {result.adjusted.feasibility.canRace
                    ? "Your race is still on."
                    : "The race timeline needs to change."}
                </strong>
                <p style={{ margin: "6px 0 0" }}>{result.adjusted.feasibility.message}</p>
              </div>

              {effectiveInjury ? (
                <div className="card card-outline">
                  <div className="stack">
                    <strong>{effectiveInjury.name} — the ground rules</strong>
                    <div className="grid grid-2">
                      <div>
                        <span className="label">Avoid for now</span>
                        <ul className="list">
                          {effectiveInjury.avoid.map((item) => (
                            <li key={item} className="brand-sub">✗ {item}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <span className="label">Usually still workable</span>
                        <ul className="list">
                          {effectiveInjury.safe.map((item) => (
                            <li key={item} className="brand-sub">✓ {item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div>
                      <span className="label">Best cross-training</span>
                      <div className="tag-grid">
                        {effectiveInjury.crossTraining.map((item) => (
                          <span key={item} className="tag">{item}</span>
                        ))}
                      </div>
                    </div>
                    <div className="notice">
                      <strong>See a professional if:</strong> {effectiveInjury.redFlags}
                    </div>
                  </div>
                </div>
              ) : null}

              {result.remaining.length ? (
                emailUnlocked || isPremium ? (
                  <div className="stack">
                    <strong>Your comeback starts here — week {result.adjusted.reportedWeek}</strong>
                    <WeekCard week={result.remaining[0]} />
                  </div>
                ) : (
                  <EmailGate onUnlock={() => setEmailUnlocked(true)} />
                )
              ) : null}

              {result.remaining.length > 1 ? (
                isPremium ? (
                  <div className="stack">
                    <strong>Every remaining week through race day</strong>
                    {result.remaining.slice(1).map((week) => (
                      <WeekCard key={week.weekNumber} week={week} />
                    ))}
                    <button
                      className="btn btn-secondary btn-sm"
                      type="button"
                      onClick={() => setSubmitted(false)}
                      style={{ alignSelf: "flex-start" }}
                    >
                      Re-run with different answers
                    </button>
                  </div>
                ) : (
                  <div className="stack">
                    <div className="brand-sub">
                      {result.remaining.length - 1} more rebuilt week
                      {result.remaining.length === 2 ? "" : "s"} through race day —
                      graded return-to-run, volume-capped rebuild, and your taper
                      when the timeline allows it.
                    </div>
                    <RescueCheckout />
                  </div>
                )
              ) : null}

              <p className="brand-sub">{MEDICAL_DISCLAIMER}</p>
              <Link className="text-link" href="/methodology">
                How the comeback schedule is built — sources and methodology →
              </Link>
            </div>
          ) : null}
        </div>
    </section>
  );
}

export default function RescueClient() {
  return (
    <Suspense fallback={<div className="section container">Loading the comeback calculator…</div>}>
      <RescueContent />
    </Suspense>
  );
}
