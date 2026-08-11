"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import ManageSubscription from "@/components/manage-subscription";

const paidFeatures = [
  {
    name: "The complete revised schedule",
    detail: "See every remaining week, including reduced load, progressive rebuilding, and a preserved taper when the timeline allows it."
  },
  {
    name: "The reason behind every change",
    detail: "Understand what was removed, reduced, delayed, or replaced, and what must be true before training progresses."
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
  const { user, isPremium, isSubscriber, session } = useAuth();
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const [checkoutState, setCheckoutState] = useState<"idle" | "loading" | "unavailable" | "error">("idle");

  // After Stripe redirects back with ?status=success, the webhook flips the
  // premium flag in app_metadata, but the browser still holds the old JWT.
  // Force token refreshes (webhook may lag the redirect by a few seconds) so
  // access appears without signing out and back in.
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
        // Non-fatal; the next attempt or a manual reload picks it up.
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

  const startCheckout = async (
    body: { product: "rescue" } | { interval: "monthly" | "annual" }
  ) => {
    if (!session) return;
    setCheckoutState("loading");
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify(body)
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
        <span className="eyebrow">Runner Toolkit Injury Rescue</span>
        <h1>Injured mid-training? We&apos;ll get you back to the start line.</h1>
        <p>
          A short symptom check grades the injury the way a professional would.
          Then the remaining weeks of your plan (any plan, not just ours) are
          rebuilt around a careful return, with an honest answer when racing
          isn&apos;t the right call.
        </p>
        <div className="button-row">
          <Link className="btn btn-primary" href="/rescue">Check my race for free</Link>
          <a className="btn btn-secondary" href="#pricing">See the options</a>
        </div>
      </section>

      <section className="section container">
        {status === "success" ? <div className="notice">Payment received. Your access is active. Head to the calculator when you&apos;re ready.</div> : null}
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
            <h2 className="section-title">A revised schedule, not a motivational paragraph.</h2>
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
            <p>The verdict, the symptom check, and every free tool.</p>
            <ul className="list">
              <li>Symptom check and severity grade</li>
              <li>Honest race-day verdict</li>
              <li>First rebuilt week, free with your email</li>
              <li>Shoes, fuel, pace, and all base plans</li>
            </ul>
            <Link className="btn btn-secondary" href="/rescue">Check my race</Link>
          </div>

          <div className="pricing-card pricing-featured">
            <span className="eyebrow">Injury Rescue</span>
            <strong className="price">$29 <small>one-time</small></strong>
            <p>The full comeback, for this injury. No subscription.</p>
            <ul className="list">
              <li>Every rebuilt week through race day</li>
              <li>Re-run it as the injury evolves</li>
              <li>90 days of access</li>
              <li>Works with any plan, yours or ours</li>
            </ul>
            {isPremium ? (
              <div className="stack">
                <div className="notice">Your access is active. Head to the calculator.</div>
                <Link className="btn btn-primary" href="/rescue">Open Injury Rescue</Link>
              </div>
            ) : user ? (
              <button className="btn btn-primary" type="button" onClick={() => startCheckout({ product: "rescue" })} disabled={checkoutState === "loading"}>
                {checkoutState === "loading" ? "Opening checkout..." : "Get Injury Rescue for $29"}
              </button>
            ) : (
              <Link className="btn btn-primary" href="/login">Sign in to start</Link>
            )}
            {checkoutState === "unavailable" ? <div className="notice">Checkout is not switched on yet. Email hello@runnertoolkit.com for early access.</div> : null}
            {checkoutState === "error" ? <div className="notice">Checkout could not start. Please try again.</div> : null}
          </div>

          <div className="pricing-card">
            <span className="eyebrow">Season pass</span>
            <strong className="price">$90 <small>/ year</small></strong>
            <p>For a whole training cycle that keeps changing on you.</p>
            <ul className="list">
              <li>Everything in Injury Rescue, all year</li>
              <li>Unlimited adjustments and re-runs</li>
              <li>Missed weeks, travel, and goal changes</li>
              <li>Cancel anytime</li>
            </ul>
            {isSubscriber ? (
              <ManageSubscription />
            ) : user ? (
              <div className="stack">
                <button className="btn btn-secondary" type="button" onClick={() => startCheckout({ interval: "annual" })} disabled={checkoutState === "loading"}>
                  Start a season pass
                </button>
                <button className="text-button" type="button" onClick={() => startCheckout({ interval: "monthly" })} disabled={checkoutState === "loading"}>
                  Or $9 month-to-month
                </button>
              </div>
            ) : (
              <Link className="btn btn-secondary" href="/login">Sign in to start</Link>
            )}
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
          <Link className="text-link" href="/methodology">Read the Injury Rescue methodology and sources →</Link>
        </div>
      </section>
    </div>
  );
}

export default function PremiumPage() {
  return (
    <Suspense fallback={<div className="section container">Loading Injury Rescue…</div>}>
      <PremiumContent />
    </Suspense>
  );
}
