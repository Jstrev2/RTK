import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Free accounts open instantly: the account is created here already
 * confirmed, so nobody waits on an email (Supabase's built-in mailer sends a
 * handful an hour). The page signs in with the same password right after.
 *
 * Light abuse guard: a few sign-ups per address per hour, per instance.
 */

const recent = new Map<string, number[]>();
const WINDOW_MS = 60 * 60 * 1000;
const LIMIT = 5;

export async function POST(request: Request) {
  const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (hits.length >= LIMIT) {
    return NextResponse.json({ error: "Too many sign-ups from here. Try again in an hour." }, { status: 429 });
  }

  let body: { email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 254) {
    return NextResponse.json({ error: "That doesn't look like an email address." }, { status: 400 });
  }
  if (password.length < 6 || password.length > 72) {
    return NextResponse.json({ error: "Use a password of at least 6 characters." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Accounts are offline for a moment." }, { status: 503 });

  hits.push(now);
  recent.set(ip, hits);

  const { error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) {
    const taken = /already|registered|exists/i.test(error.message);
    return NextResponse.json(
      { error: taken ? "exists" : "We couldn't create the account. Try again in a moment." },
      { status: taken ? 409 : 500 }
    );
  }
  return NextResponse.json({ ok: true });
}
