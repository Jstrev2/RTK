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
          <span className="pill">Premium</span>
          <strong>Unlock {feature}</strong>
          <p>
            Runner Toolkit Premium adapts your training plan when life happens —
            injury-adjusted schedules, cross-training swaps, recovery tracking,
            and return-to-run protocols built into your remaining weeks.
          </p>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link className="btn btn-primary" href="/premium">
              See Premium
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
