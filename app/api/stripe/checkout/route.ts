import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const getStripe = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
};

/**
 * Creates a Stripe Checkout session for the signed-in user.
 * Body: { interval: "monthly" | "annual" }
 * Auth: Supabase access token in the Authorization header.
 */
export async function POST(request: Request) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "Payments are not configured yet." },
      { status: 503 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    return NextResponse.json({ error: "Auth is not configured." }, { status: 503 });
  }

  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) {
    return NextResponse.json({ error: "Sign in to upgrade." }, { status: 401 });
  }

  const supabase = createClient(supabaseUrl, anonKey);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return NextResponse.json({ error: "Sign in to upgrade." }, { status: 401 });
  }

  let interval = "monthly";
  try {
    const body = await request.json();
    if (body?.interval === "annual") interval = "annual";
  } catch {
    // default to monthly
  }

  const priceId =
    interval === "annual"
      ? process.env.STRIPE_PRICE_ANNUAL
      : process.env.STRIPE_PRICE_MONTHLY;
  if (!priceId) {
    return NextResponse.json(
      { error: "Pricing is not configured yet." },
      { status: 503 }
    );
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://runnertoolkit.com";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    client_reference_id: data.user.id,
    customer_email: data.user.email ?? undefined,
    success_url: `${siteUrl}/premium?status=success`,
    cancel_url: `${siteUrl}/premium?status=cancelled`,
    metadata: { supabase_user_id: data.user.id }
  });

  return NextResponse.json({ url: session.url });
}
