"use client";

/**
 * One place for creating accounts, signing in and resetting a password, so
 * the inline gate and the login page behave the same way.
 */

export type AccountResult = { ok: true } | { ok: false; message: string; exists?: boolean };

async function client() {
  const { getSupabaseClient } = await import("@/lib/supabase-client");
  return getSupabaseClient();
}

export async function signIn(email: string, password: string): Promise<AccountResult> {
  const supabase = await client();
  if (!supabase) return { ok: false, message: "Accounts are offline for a moment. Try again shortly." };
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
  if (!error) return { ok: true };
  if (/invalid login/i.test(error.message)) {
    return { ok: false, message: "That email and password don't match. Try again, or reset your password." };
  }
  if (/not confirmed/i.test(error.message)) {
    return { ok: false, message: "This account was never confirmed. Reset your password below and you're in." };
  }
  return { ok: false, message: error.message };
}

/** Creates the account already confirmed (no email), then signs in. */
export async function createAccount(email: string, password: string): Promise<AccountResult> {
  const res = await fetch("/api/account/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  }).catch(() => null);
  if (!res) return { ok: false, message: "Couldn't reach the server. Check your connection and try again." };
  const body = (await res.json().catch(() => ({}))) as { error?: string };
  if (res.status === 409) {
    return { ok: false, exists: true, message: "You already have an account with that email. Sign in, or reset your password if you forgot it." };
  }
  if (!res.ok) return { ok: false, message: body.error ?? "We couldn't create the account. Try again in a moment." };
  return signIn(email, password);
}

export async function sendPasswordReset(email: string): Promise<AccountResult> {
  const supabase = await client();
  if (!supabase) return { ok: false, message: "Accounts are offline for a moment." };
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: `${window.location.origin}/reset-password`
  });
  if (error) {
    return {
      ok: false,
      message: /rate|limit/i.test(error.message) ? "Too many reset emails just now. Try again in a few minutes." : error.message
    };
  }
  return { ok: true };
}
