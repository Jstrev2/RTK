"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { useAuth } from "@/components/auth-provider";
import { trackEvent } from "@/lib/analytics";
import { createAccount, sendPasswordReset, signIn } from "@/lib/account";

type Tool = "shoes" | "music" | "fuel" | "pace";

type AccountGateProps = {
  /** What the full result unlocks, e.g. "your other two shoe matches". */
  unlocks: string;
  tool: Tool;
  children: ReactNode;
};

/**
 * Every tool is free, and the full result opens with a free account.
 * Signed-in runners see the children; everyone else gets the inline card.
 */
export default function AccountGate({ unlocks, tool, children }: AccountGateProps) {
  const { user, loading, supabaseAvailable } = useAuth();
  if (user || !supabaseAvailable) return <>{children}</>;
  if (loading) return <div className="account-gate account-gate-loading" aria-busy="true" />;
  return <SignupCard unlocks={unlocks} tool={tool} />;
}

export function SignupCard({ unlocks, tool, initialMode = "sign-up" }: { unlocks: string; tool: Tool; initialMode?: "sign-up" | "sign-in" }) {
  const { refresh } = useAuth();
  const [mode, setMode] = useState<"sign-up" | "sign-in" | "reset">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setWorking(true);
    setMessage("");
    if (mode === "reset") {
      const result = await sendPasswordReset(email);
      setWorking(false);
      if (result.ok) {
        setDone(true);
        setMessage("Check your inbox for a link to set a new password. It can take a minute or two.");
      } else setMessage(result.message);
      return;
    }
    const result = mode === "sign-up" ? await createAccount(email, password) : await signIn(email, password);
    setWorking(false);
    if (!result.ok) {
      setMessage(result.message);
      if (result.exists) setMode("sign-in");
      return;
    }
    if (mode === "sign-up") trackEvent("sign_up", { method: "password", tool });
    await refresh();
  };

  const heading =
    mode === "reset" ? "Reset your password." : mode === "sign-in" ? `Sign in to see ${unlocks}.` : `Create a free account to see ${unlocks}.`;

  return (
    <div className="account-gate">
      <div className="account-gate-copy">
        <span className="eyebrow">Free account</span>
        <h3>{heading}</h3>
        <p>Takes ten seconds. No email to confirm, no card, nothing to pay. It also keeps the shoes, songs and fuel plans you save.</p>
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
        {mode !== "reset" ? (
          <>
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
          </>
        ) : null}
        {!done ? (
          <button className="btn btn-primary" type="submit" disabled={working}>
            {working ? "One moment..." : mode === "sign-up" ? "Create free account" : mode === "sign-in" ? "Sign in" : "Email me a reset link"}
          </button>
        ) : null}
        {message ? <p className="form-message" role="status">{message}</p> : null}
        <div className="account-gate-switch">
          {mode !== "sign-up" ? (
            <button className="text-button" type="button" onClick={() => { setMode("sign-up"); setMessage(""); setDone(false); }}>
              New here? Create a free account
            </button>
          ) : (
            <button className="text-button" type="button" onClick={() => { setMode("sign-in"); setMessage(""); }}>
              Already have an account? Sign in
            </button>
          )}
          {mode !== "reset" ? (
            <button className="text-button" type="button" onClick={() => { setMode("reset"); setMessage(""); setDone(false); }}>
              Forgot password?
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
