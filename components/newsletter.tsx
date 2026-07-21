"use client";

import { useState } from "react";
import { getSupabaseClient } from "@/lib/supabase-client";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const handleSubmit = async () => {
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) return;

    setStatus("sending");
    const supabase = getSupabaseClient();
    if (!supabase) {
      setStatus("sent");
      return;
    }

    const { error } = await supabase
      .from("newsletter_subscribers")
      .insert({ email: trimmed.toLowerCase() });

    if (error && error.code === "23505") {
      setStatus("sent");
      return;
    }
    if (error) {
      setStatus("error");
      return;
    }

    setStatus("sent");
    setEmail("");
  };

  return (
    <div className="newsletter-card">
      <div className="stack">
        <strong>Choose what reaches you</strong>
        <p>
          Useful updates across shoes, music, fuel, and adaptive training.
          Occasional by design.
        </p>
        {status === "sent" ? (
          <div className="notice">You&apos;re in. We&apos;ll keep it useful.</div>
        ) : (
          <div className="newsletter-form">
            <input
              className="input"
              type="email"
              placeholder="you@example.com"
              aria-label="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && handleSubmit()}
            />
            <button
              className="btn btn-primary"
              type="button"
              onClick={handleSubmit}
              disabled={status === "sending"}
            >
              {status === "sending" ? "Joining..." : "Keep me posted"}
            </button>
          </div>
        )}
        {status === "error" ? <div className="notice">Something went wrong. Please try again.</div> : null}
      </div>
    </div>
  );
}
