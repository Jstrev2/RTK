"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth-provider";

const paidFeatures = [
  {
    name: "The complete revised schedule",
    detail: "See every remaining week, including reduced load, progressive rebuilding, and a preserved taper when the timeline allows it."
  },
  {
    name: "The reason behind every change",
    detail: "Understand what was removed, reduced, delayed, or replaced—and what must be true before training progresses."
  },
  {
    name: "A realistic race-day update",
    detail: "See whether the original goal still fits the available time, including the cases where a later or shorter race is the better choice."
  },
  {
    name: "Revisions as circumstances change",
    detail: "Update the timing or impact and generate a new schedule without starting the entire plan again."
  }
];

function PremiumContent() {
  const { user, isPremium, session } = useAuth();
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const [checkoutState, setCheckoutState] = useState<"idle" | "loading" | "unavailable" | "error">("idle");

  const startCheckout = async () => {
    if (!session) return;
    setCheckoutState("loading");
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ interval: "monthly" })
      });
      if (response.status === 503) {
        setCheckoutState("unavailable");
        return;
      }
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setCheckoutState("error");
    } catch {
      setCheckoutState("error");
    }
  };

  return (
    <div className="tool-page tool-page-adaptive">
      <section className="tool-hero container adaptive-hero">
        <span className="eyebrow">Runner Toolkit Adaptive Training</span>
        <h1>A training plan that changes when your training changes.</h1>
        <p>
          Static plans assume perfect weeks. Adaptive Training revises the
          remaining schedule when missed time or an appropriately cleared
          return changes what is realistic—and explains every tradeoff.
        </p>
        <div className="button-row">
          <Link className="btn btn-primary" href="/tools/training-plans#adapt">Try a sample adjustment</Link>
          <a className="btn btn-secondary" href="#pricing">See the options</a>
        </div>
      </section>

      <section className="section container">
        {status === "success" ? <div className="notice">Payment received. Welcome to Adaptive Training.</div> : null}
        {status === "cancelled" ? <div className="notice">Checkout cancelled. No charge was made.</div> : null}

        <div className="adaptive-story">
          <div>
            <span className="eyebrow">The problem with static plans</span>
            <h2 className="section-title">The PDF does not know you missed week nine.</h2>
            <p className="section-lede">
              It keeps prescribing the same mileage, workouts, and race goal.
              The runner is left to improvise: skip ahead, repeat a week, cram
              the missed work, or abandon the plan.
            </p>
          </div>
          <div className="plan-compare">
            <div className="plan-compare-head">
              <span>Original week</span>
              <span>Revised week</span>
            </div>
            <div className="plan-row"><span>Intervals</span><b>→</b><span>Easy cross-training</span></div>
            <div className="plan-row"><span>7-mile steady run</span><b>→</b><span>Rest + reassess</span></div>
            <div className="plan-row"><span>16-mile long run</span><b>→</b><span>Reduced easy effort</span></div>
            <div className="plan-verdict"><span>Plan decision</span><strong>Remove intensity. Reduce volume. Protect the rebuild.</strong></div>
          </div>
        </div>
      </section>

      <section className="results-section">
        <div className="container results-layout">
          <div className="results-copy">
            <span className="eyebrow">What you are buying</span>
            <h2 className="section-title">A revised schedule—not a motivational paragraph.</h2>
            <p className="section-lede">
              The value is the plan itself: the next week, every remaining
              week, the new race expectation, and the reasoning behind each
              change.
            </p>
          </div>
          <div className="adaptive-feature-list">
            {paidFeatures.map((feature, index) => (
              <div key={feature.name}>
                <span>0{index + 1}</span>
                <div><strong>{feature.name}</strong><p>{feature.detail}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="section container">
        <div className="pricing-heading">
          <span className="eyebrow">Choose the access that fits the problem</span>
          <h2 className="section-title">The free tools stay free.</h2>
          <p className="section-lede">Pay only when you need a plan that keeps changing with you.</p>
        </div>

        <div className="pricing-grid">
          <div className="pricing-card">
            <span className="eyebrow">Free toolkit</span>
            <strong className="price">$0</strong>
            <p>Shoes, music, fuel, pace, and every base training plan.</p>
            <ul className="list">
              <li>Complete free tool results</li>
              <li>All base-plan weeks</li>
              <li>One sample adjusted week</li>
              <li>No account required to begin</li>
            </ul>
            <Link className="btn btn-secondary" href="/#tools">Use the free tools</Link>
          </div>

          <div className="pricing-card pricing-featured">
            <span className="eyebrow">Adaptive membership</span>
            <strong className="price">$9 <small>/ month</small></strong>
            <p>For a training cycle that needs continued revision.</p>
            <ul className="list">
              <li>Complete revised schedule</li>
              <li>Ongoing re-adjustments</li>
              <li>Race-goal update</li>
              <li>Plan history and explanations</li>
            </ul>
            {isPremium ? (
              <div className="notice">Your Adaptive Training access is active.</div>
            ) : user ? (
              <button className="btn btn-primary" type="button" onClick={startCheckout} disabled={checkoutState === "loading"}>
                {checkoutState === "loading" ? "Opening checkout..." : "Start Adaptive Training"}
              </button>
            ) : (
              <Link className="btn btn-primary" href="/login">Sign in to start</Link>
            )}
            {checkoutState === "unavailable" ? <div className="notice">Checkout is not switched on yet. Email hello@runnertoolkit.com for early access.</div> : null}
            {checkoutState === "error" ? <div className="notice">Checkout could not start. Please try again.</div> : null}
          </div>

          <div className="pricing-card">
            <span className="eyebrow">Plan Rescue pass</span>
            <strong className="price">Fixed access</strong>
            <p>For one immediate disruption without another indefinite subscription.</p>
            <ul className="list">
              <li>Fixed access window</li>
              <li>Complete revised schedule</li>
              <li>Limited follow-up revisions</li>
              <li>No automatic renewal</li>
            </ul>
            <a className="btn btn-secondary" href="mailto:hello@runnertoolkit.com?subject=Plan%20Rescue%20early%20access">Join Plan Rescue early access</a>
          </div>
        </div>
      </section>

      <section className="section container">
        <div className="boundaries-card">
          <span className="eyebrow">Clear boundaries</span>
          <h2 className="section-title">Schedule adaptation is not diagnosis or treatment.</h2>
          <p>
            Runner Toolkit will not identify an injury, replace a clinician, or
            tell you to run through red flags. Some inputs should end with a
            recommendation to stop, seek professional assessment, or choose a
            later race. That refusal is part of the product.
          </p>
          <Link className="text-link" href="/methodology">Read the Adaptive Training methodology →</Link>
        </div>
      </section>
    </div>
  );
}

export default function PremiumPage() {
  return (
    <Suspense fallback={<div className="section container">Loading Adaptive Training…</div>}>
      <PremiumContent />
    </Suspense>
  );
}
