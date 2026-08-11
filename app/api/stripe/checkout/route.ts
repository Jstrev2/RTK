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
 * Body: { product?: "rescue" | "membership", interval?: "monthly" | "annual" }
 *  - product "rescue" = one-time Injury Rescue payment (90-day access)
 *  - otherwise a membership subscription at the given interval
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
  let product = "membership";
  try {
    const body = await request.json();
    if (body?.interval === "annual") interval = "annual";
    if (body?.product === "rescue") product = "rescue";
  } catch {
    // defaults
  }

  const priceId =
    product === "rescue"
      ? process.env.STRIPE_PRICE_RESCUE
      : interval === "annual"
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
  const returnPath = product === "rescue" ? "/rescue" : "/premium";

  const session = await stripe.checkout.sessions.create({
    mode: product === "rescue" ? "payment" : "subscription",
    // Payment mode defaults to a guest customer; always create one so the
    // webhook can tag it and later events map back to the user.
    ...(product === "rescue" ? { customer_creation: "always" as const } : {}),
    line_items: [{ price: priceId, quantity: 1 }],
    client_reference_id: data.user.id,
    customer_email: data.user.email ?? undefined,
    success_url: `${siteUrl}${returnPath}?status=success`,
    cancel_url: `${siteUrl}${returnPath}?status=cancelled`,
    metadata: { supabase_user_id: data.user.id, product }
  });

  return NextResponse.json({ url: session.url });
}
