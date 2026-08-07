import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Comma-separated allowlist; defaults to the site owner so the internal
// tooling works before any extra env config.
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "jonstrevell@gmail.com")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export type AdminAuth =
  | { ok: true; admin: SupabaseClient; email: string }
  | { ok: false; status: number; error: string };

/**
 * Verifies the Supabase access token in the Authorization header and checks
 * the user against the admin allowlist. Returns a service-role client for
 * tables that are RLS-locked to internal use.
 */
export async function requireAdmin(request: Request): Promise<AdminAuth> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceKey) {
    return { ok: false, status: 503, error: "Not configured" };
  }

  const token = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) {
    return { ok: false, status: 401, error: "Sign in required" };
  }

  const anon = createClient(url, anonKey);
  const { data, error } = await anon.auth.getUser(token);
  const email = data?.user?.email?.toLowerCase();
  if (error || !email) {
    return { ok: false, status: 401, error: "Sign in required" };
  }
  if (!ADMIN_EMAILS.includes(email)) {
    return { ok: false, status: 403, error: "Not authorized" };
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  return { ok: true, admin, email };
}
