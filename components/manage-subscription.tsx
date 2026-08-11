"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth-provider";

/**
 * "Manage subscription" button for premium members. Opens the Stripe
 * Billing Portal (update card, switch plan, cancel). Renders nothing for
 * non-premium users.
 */
export default function ManageSubscription() {
  const { session, isPremium } = useAuth();
  const [state, setState] = useState<"idle" | "loading" | "error" | "none">("idle");

  if (!isPremium || !session) return null;

  const openPortal = async () => {
    setState("loading");
    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      setState(response.status === 404 ? "none" : "error");
    } catch {
      setState("error");
    }
  };

  return (
    <span style={{ display: "inline-flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
      <button
        className="btn btn-secondary btn-sm"
        type="button"
        onClick={openPortal}
        disabled={state === "loading"}
      >
        {state === "loading" ? "Opening…" : "Manage subscription"}
      </button>
      {state === "none" ? (
        <span className="brand-sub">No billing record found. Email hello@runnertoolkit.com.</span>
      ) : null}
      {state === "error" ? (
        <span className="brand-sub">Could not open billing. Try again in a minute.</span>
      ) : null}
    </span>
  );
}
