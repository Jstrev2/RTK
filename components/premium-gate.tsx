"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useAuth } from "@/components/auth-provider";

type Props = {
  children: ReactNode;
  feature: string;
  teaser?: ReactNode;
};

export default function PremiumGate({ children, feature, teaser }: Props) {
  const { user, isPremium } = useAuth();
  if (isPremium) return <>{children}</>;

  return (
    <div className="stack">
      {teaser}
      <div className="card card-accent">
        <div className="stack">
          <span className="pill">Injury Rescue</span>
          <strong>Unlock {feature}</strong>
          <p>
            Every remaining revised week, the reason behind each change, and an
            updated race-day expectation. One-time $29 for 90 days of access —
            no subscription required.
          </p>
          <div className="button-row">
            <Link className="btn btn-primary" href="/premium#pricing">See Injury Rescue — $29</Link>
            {!user ? <Link className="btn btn-secondary" href="/login">Sign in</Link> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
