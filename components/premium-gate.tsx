"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useAuth } from "@/components/auth-provider";

type Props = {
  children: ReactNode;
  /** Short name of the gated feature, e.g. "the full adjusted schedule". */
  feature: string;
  /** Optional teaser rendered above the upsell for non-premium users. */
  teaser?: ReactNode;
};

/**
 * Renders children for premium users; a teaser + upgrade card for everyone
 * else. Client-side gating only — fine for content features like adjusted
 * plans, where the worst case of tampering is reading your own workout list.
 */
export default function PremiumGate({ children, feature, teaser }: Props) {
  const { user, isPremium } = useAuth();

  if (isPremium) {
    return <>{children}</>;
  }

  return (
    <div className="stack">
      {teaser}
      <div className="card card-accent">
        <div className="stack">
          <span className="pill">Premium — the comeback plan</span>
          <strong>Unlock {feature}</strong>
          <p>
            This is the one part of Runner Toolkit we charge for: every
            remaining week rebuilt around your injury — return-to-run
            progression, cross-training swaps, a preserved taper, and an honest
            race-day call. $9/month, cancel when you&apos;re back.
          </p>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link className="btn btn-primary" href="/premium">
              Get the comeback plan
            </Link>
            {!user ? (
              <Link className="btn btn-secondary" href="/login">
                Sign in
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
