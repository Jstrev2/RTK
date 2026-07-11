"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useAuth } from "@/components/auth-provider";
import { getSupabaseClient } from "@/lib/supabase-client";

const premiumFeatures = [
  {
    name: "Injury-adaptive training plans",
    detail:
      "Report an injury mid-plan and get your remaining weeks rebuilt: rest, cross-training swaps, a progressive return-to-run, and a preserved taper."
  },
  {
    name: "Injury-specific guidance",
    detail:
      "What to avoid, what's safe, which cross-training holds fitness best, and the red flags that mean see a professional."
  },
  {
    name: "Race-day feasibility calls",
    detail:
      "An honest read on whether your race is still on, with adjusted pace expectations — not wishful thinking."
  },
  {
    name: "Recovery timeline tracking",
    detail: "Phase-by-phase schedule from rest to race, with weekly volume caps."
  },
  {
    name: "Unlimited plan customization",
    detail: "Every plan, every distance, adjusted as many times as life requires."
  }
];

const freeFeatures = [
  "Shoe Finder with personalized match scores",
  "Pace calculator",
  "All 9 base training plans with full schedules",
  "Fueling planner",
  "Music by BPM",
  "Workout logging"
];

function PremiumContent() {
  const { user, isPremium, session } = useAuth();
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const [interval, setInterval] = useState<"monthly" | "annual">("annual");
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
        body: JSON.stringify({ interval })
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
    <div>
      <section className="tool-hero container">
        <span className="pill">Runner Toolkit Premium</span>
        <h1>Injuries happen. Your plan should adapt.</h1>
        <p>
          Free tools stay free. Premium is for the moment training goes
          sideways — an injury-aware system that rebuilds your remaining weeks
          instead of letting the plan fall apart.
        </p>
      </section>

      <section className="section container">
        <div className="stack">
          {status === "success" ? (
            <div className="notice">
              Payment received — welcome to Premium! Sign out and back in if
              your features haven&apos;t unlocked within a minute.
            </div>
          ) : null}
          {status === "cancelled" ? (
            <div className="notice">Checkout cancelled. No charge was made.</div>
          ) : null}

          <div className="grid grid-2">
            <div className="card">
              <div className="stack">
                <strong>Free — forever</strong>
                <div className="stat">
                  <strong>$0</strong>
                  <span>no account required</span>
                </div>
                <ul className="list">
                  {freeFeatures.map((feature) => (
                    <li key={feature} className="card card-outline">
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="card card-accent">
              <div className="stack">
                <strong>Premium</strong>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    className={`btn btn-sm ${interval === "annual" ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => setInterval("annual")}
                  >
                    $72 / year
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${interval === "monthly" ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => setInterval("monthly")}
                  >
                    $9 / month
                  </button>
                </div>
                {interval === "annual" ? (
                  <span className="brand-sub">Two months free versus monthly.</span>
                ) : null}
                <ul className="list">
                  {premiumFeatures.map((feature) => (
                    <li key={feature.name} className="card card-outline">
                      <strong>{feature.name}</strong>
                      <div className="brand-sub">{feature.detail}</div>
                    </li>
                  ))}
                </ul>

                {isPremium ? (
                  <div className="notice">You&apos;re on Premium. Thanks for the support!</div>
                ) : user ? (
                  <>
                    <button
                      className="btn btn-primary"
                      type="button"
                      disabled={checkoutState === "loading"}
                      onClick={startCheckout}
                    >
                      {checkoutState === "loading" ? "Opening checkout..." : "Upgrade to Premium"}
                    </button>
                    {checkoutState === "unavailable" ? (
                      <div className="notice">
                        Checkout is launching soon — payments aren&apos;t switched
                        on yet. Check back shortly.
                      </div>
                    ) : null}
                    {checkoutState === "error" ? (
                      <div className="notice">
                        Something went wrong starting checkout. Try again in a
                        minute.
                      </div>
                    ) : null}
                  </>
                ) : (
                  <Link className="btn btn-primary" href="/login">
                    Sign in to upgrade
                  </Link>
                )}
                <span className="brand-sub">
                  Cancel anytime. Your plans and logs stay yours either way.
                </span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="stack">
              <strong>How the injury adjustment works</strong>
              <ol className="list">
                <li className="card card-outline">
                  <strong>1. Tell us what happened.</strong>
                  <div className="brand-sub">
                    Pick from common running injuries — runner&apos;s knee, IT band,
                    shin splints, plantar fasciitis, Achilles, and more — plus
                    how bad it feels and which week of your plan you&apos;re in.
                  </div>
                </li>
                <li className="card card-outline">
                  <strong>2. Your remaining weeks get rebuilt.</strong>
                  <div className="brand-sub">
                    Rest where you need it, cross-training that holds fitness,
                    a progressive return-to-run, volume caps, and a preserved
                    taper when the calendar allows.
                  </div>
                </li>
                <li className="card card-outline">
                  <strong>3. You get an honest race-day call.</strong>
                  <div className="brand-sub">
                    Whether the race is still realistic, and what pace to
                    expect if it is.
                  </div>
                </li>
              </ol>
              <Link className="btn btn-secondary" href="/tools/training-plans">
                Try it on a training plan
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function PremiumPage() {
  return (
    <Suspense fallback={<div className="section container">Loading...</div>}>
      <PremiumContent />
    </Suspense>
  );
}
