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
      // Already subscribed
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
    <div className="card card-accent">
      <div className="stack">
        <strong>Get the launch drop</strong>
        <p>
          We are building with real runners. Drop your email to get early access
          and new plan releases.
        </p>
        {status === "sent" ? (
          <div className="notice">Thanks. We will keep it useful and minimal.</div>
        ) : (
          <div className="form-grid" style={{ gridTemplateColumns: "1fr auto" }}>
            <input
              className="input"
              type="email"
              placeholder="name@email.com"
              aria-label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
            <button
              className="btn btn-primary"
              type="button"
              onClick={handleSubmit}
              disabled={status === "sending"}
            >
              {status === "sending" ? "Sending..." : "Notify me"}
            </button>
          </div>
        )}
        {status === "error" ? (
          <div className="notice">Something went wrong. Please try again.</div>
        ) : null}
      </div>
    </div>
  );
}
