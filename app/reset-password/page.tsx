"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Landing page for the password-reset email. Supabase signs the visitor in
 * from the link (a recovery session); they choose a new password here.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [working, setWorking] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const { getSupabaseClient } = await import("@/lib/supabase-client");
      const supabase = getSupabaseClient();
      if (!supabase) return;
      const { data } = await supabase.auth.getSession();
      if (active && data.session) setReady(true);
      supabase.auth.onAuthStateChange((event, session) => {
        if (active && session && (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN")) setReady(true);
      });
    })();
    return () => {
      active = false;
    };
  }, []);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setWorking(true);
    const { getSupabaseClient } = await import("@/lib/supabase-client");
    const supabase = getSupabaseClient();
    const result = await supabase?.auth.updateUser({ password });
    setWorking(false);
    if (!result || result.error) {
      setMessage(result?.error?.message ?? "Couldn't save the password. Try the link again.");
      return;
    }
    router.push("/account");
  };

  return (
    <section className="section container" style={{ maxWidth: 520 }}>
      <h1>Choose a new password</h1>
      {ready ? (
        <form className="account-gate-form" onSubmit={save}>
          <label className="label" htmlFor="new-password">New password</label>
          <input
            id="new-password"
            className="input"
            type="password"
            autoComplete="new-password"
            minLength={6}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <button className="btn btn-primary" type="submit" disabled={working}>
            {working ? "Saving..." : "Save and sign in"}
          </button>
          {message ? <p className="form-message">{message}</p> : null}
        </form>
      ) : (
        <p>Open this page from the link in your reset email. If the link has expired, ask for a new one from any sign-in box.</p>
      )}
    </section>
  );
}
