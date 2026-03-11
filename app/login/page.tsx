"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase-client";

function LoginForm() {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [message, setMessage] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const supabase = getSupabaseClient();

    if (!supabase) {
      setStatus("error");
      setMessage("Supabase is not configured yet. Add env vars to enable login.");
      return;
    }

    setStatus("loading");
    setMessage("");

    if (mode === "sign-in") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        setStatus("error");
        setMessage(error.message);
        return;
      }

      setStatus("success");
      const redirect = searchParams.get("redirect") ?? "/account";
      router.push(redirect);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    setStatus("success");
    setMessage("Check your email to confirm your account.");
  };

  return (
    <div>
      <section className="tool-hero container">
        <h1>Sign in</h1>
        <p>Save your picks, track progress, and unlock personalized insights.</p>
      </section>

      <section className="section container">
        <div className="grid grid-2">
          <div className="card">
            <div className="stack">
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <button
                  className={`btn ${mode === "sign-in" ? "btn-primary" : "btn-ghost"}`}
                  type="button"
                  onClick={() => setMode("sign-in")}
                >
                  Sign in
                </button>
                <button
                  className={`btn ${mode === "sign-up" ? "btn-primary" : "btn-ghost"}`}
                  type="button"
                  onClick={() => setMode("sign-up")}
                >
                  Create account
                </button>
              </div>

              <button
                className="btn btn-secondary"
                type="button"
                style={{ width: "100%" }}
                onClick={async () => {
                  const supabase = getSupabaseClient();
                  if (!supabase) return;
                  await supabase.auth.signInWithOAuth({
                    provider: "google",
                    options: { redirectTo: `${window.location.origin}/account` }
                  });
                }}
              >
                Continue with Google
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div className="divider" style={{ flex: 1 }} />
                <span className="brand-sub">or</span>
                <div className="divider" style={{ flex: 1 }} />
              </div>

              <form className="form-grid" onSubmit={handleSubmit}>
                <div>
                  <span className="label">Email</span>
                  <input
                    className="input"
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
                <div>
                  <span className="label">Password</span>
                  <input
                    className="input"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </div>
                <button className="btn btn-primary" type="submit" disabled={status === "loading"}>
                  {status === "loading" ? "Working..." : mode === "sign-in" ? "Sign in" : "Create account"}
                </button>
              </form>

              {status === "error" ? <div className="notice">{message}</div> : null}
              {status === "success" && message ? <div className="notice">{message}</div> : null}
            </div>
          </div>

          <div className="card card-accent">
            <div className="stack">
              <strong>Why create a free account?</strong>
              <ul className="list">
                <li className="card card-outline">Save shoes, outfits, and playlists.</li>
                <li className="card card-outline">Track what works so your training feels dialed.</li>
                <li className="card card-outline">Log workouts and fueling to track what works.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
