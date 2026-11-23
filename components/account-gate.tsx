"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { useAuth } from "@/components/auth-provider";
import { trackEvent } from "@/lib/analytics";

type AccountGateProps = {
  /** What the full result unlocks, e.g. "your other two shoe matches". */
  unlocks: string;
  /** Short name of the tool, sent with the signup event. */
  tool: "shoes" | "music" | "fuel" | "attire" | "pace";
  children: ReactNode;
};

/**
 * Every tool is free, and the full result opens with a free account.
 * Signed-in runners see the children. Everyone else gets an inline sign-up
 * card in their place: email and password, no email round trip, and the
 * result appears the moment the account exists.
 */
export default function AccountGate({ unlocks, tool, children }: AccountGateProps) {
  const { user, loading, supabaseAvailable } = useAuth();

  if (user || !supabaseAvailable) return <>{children}</>;
  if (loading) return <div className="account-gate account-gate-loading" aria-busy="true" />;
  return <SignupCard unlocks={unlocks} tool={tool} />;
}

export function SignupCard({ unlocks, tool }: { unlocks: string; tool: AccountGateProps["tool"] }) {
  const { refresh } = useAuth();
  const [mode, setMode] = useState<"sign-up" | "sign-in">("sign-up");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "working" | "error" | "check-email">("idle");
  const [message, setMessage] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus("working");
    setMessage("");
    const { getSupabaseClient } = await import("@/lib/supabase-client");
    const supabase = getSupabaseClient();
    if (!supabase) {
      setStatus("error");
      setMessage("Accounts are offline for a moment. Try again shortly.");
      return;
    }

    const trimmed = email.trim().toLowerCase();
    const result =
      mode === "sign-up"
        ? await supabase.auth.signUp({ email: trimmed, password })
        : await supabase.auth.signInWithPassword({ email: trimmed, password });

    if (result.error) {
      setStatus("error");
      setMessage(friendlyError(result.error.message, mode));
      return;
    }

    if (mode === "sign-up") trackEvent("sign_up", { method: "password", tool });

    if (!result.data.session) {
      setStatus("check-email");
      setMessage("Almost there: confirm the email we just sent, then come back to this page.");
      return;
    }
    await refresh();
  };

  return (
    <div className="account-gate">
      <div className="account-gate-copy">
        <span className="eyebrow">Free account</span>
        <h3>Create a free account to see {unlocks}.</h3>
        <p>
          It takes ten seconds and costs nothing. Your account also keeps the
          shoes, songs and fuel plans you save, on any device.
        </p>
      </div>
      <form className="account-gate-form" onSubmit={submit}>
        <label className="label" htmlFor={`gate-email-${tool}`}>Email</label>
        <input
          id={`gate-email-${tool}`}
          className="input"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <label className="label" htmlFor={`gate-password-${tool}`}>Password</label>
        <input
          id={`gate-password-${tool}`}
          className="input"
          type="password"
          autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
          minLength={6}
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <button className="btn btn-primary" type="submit" disabled={status === "working"}>
          {status === "working" ? "One moment..." : mode === "sign-up" ? "Create free account" : "Sign in"}
        </button>
        <button
          className="text-button"
          type="button"
          onClick={() => {
            setMode(mode === "sign-up" ? "sign-in" : "sign-up");
            setStatus("idle");
            setMessage("");
          }}
        >
          {mode === "sign-up" ? "Already have an account? Sign in" : "New here? Create a free account"}
        </button>
        {message ? <p className="form-message" role="status">{message}</p> : null}
      </form>
    </div>
  );
}

function friendlyError(message: string, mode: "sign-up" | "sign-in") {
  const lower = message.toLowerCase();
  if (lower.includes("already registered")) return "That email already has an account. Sign in instead.";
  if (lower.includes("invalid login")) return "That email and password don't match. Try again or create an account.";
  if (lower.includes("rate limit")) return "Too many tries in a row. Wait a minute and try again.";
  if (lower.includes("password")) return "Use a password of at least 6 characters.";
  return mode === "sign-up" ? "We couldn't create the account. Try again in a moment." : message;
}
