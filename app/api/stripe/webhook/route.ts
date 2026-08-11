import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const getAdmin = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
};

const setPremium = async (
  userId: string,
  premium: boolean,
  stripeCustomerId?: string
) => {
  const admin = getAdmin();
  if (!admin) throw new Error("Supabase admin not configured");
  const { error } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: {
      premium,
      ...(stripeCustomerId ? { stripe_customer_id: stripeCustomerId } : {})
    }
  });
  if (error) throw error;
};

/** One-time Injury Rescue purchase: 90 days of adaptive access. */
const RESCUE_DAYS = 90;

const setRescue = async (userId: string, stripeCustomerId?: string) => {
  const admin = getAdmin();
  if (!admin) throw new Error("Supabase admin not configured");
  const until = new Date(Date.now() + RESCUE_DAYS * 24 * 60 * 60 * 1000);
  // Never clobber an existing stripe_customer_id: an active subscriber who
  // also buys a rescue keeps the customer their subscription (and Billing
  // Portal) lives on. The rescue's payment-mode customer is stored separately.
  const { data: existing } = await admin.auth.admin.getUserById(userId);
  const hasCustomer = Boolean(existing?.user?.app_metadata?.stripe_customer_id);
  const { error } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: {
      rescue_until: until.toISOString(),
      ...(stripeCustomerId
        ? hasCustomer
          ? { rescue_customer_id: stripeCustomerId }
          : { stripe_customer_id: stripeCustomerId }
        : {})
    }
  });
  if (error) throw error;
};

/** Find the Supabase user id we stored on the subscription's customer. */
const userIdFromSubscription = async (
  stripe: Stripe,
  subscription: Stripe.Subscription
): Promise<string | null> => {
  if (subscription.metadata?.supabase_user_id) {
    return subscription.metadata.supabase_user_id;
  }
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;
  const customer = await stripe.customers.retrieve(customerId);
  if (!customer.deleted && customer.metadata?.supabase_user_id) {
    return customer.metadata.supabase_user_id;
  }
  return null;
};

export async function POST(request: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secretKey || !webhookSecret) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const stripe = new Stripe(secretKey);
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const payload = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId =
          session.client_reference_id ?? session.metadata?.supabase_user_id;
        if (userId) {
          const customerId =
            typeof session.customer === "string"
              ? session.customer
              : session.customer?.id;
          // Tag the Stripe customer so later subscription events map back.
          if (customerId) {
            await stripe.customers.update(customerId, {
              metadata: { supabase_user_id: userId }
            });
          }
          if (session.mode === "payment" || session.metadata?.product === "rescue") {
            // Delayed-notification methods (ACH etc.) complete the session
            // before the money moves; grant access only once actually paid.
            // async_payment_succeeded below covers the rest.
            if (session.payment_status === "paid") {
              await setRescue(userId, customerId ?? undefined);
            }
          } else {
            await setPremium(userId, true, customerId ?? undefined);
          }
        }
        break;
      }
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId =
          session.client_reference_id ?? session.metadata?.supabase_user_id;
        if (userId && (session.mode === "payment" || session.metadata?.product === "rescue")) {
          const customerId =
            typeof session.customer === "string"
              ? session.customer
              : session.customer?.id;
          await setRescue(userId, customerId ?? undefined);
        }
        break;
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = await userIdFromSubscription(stripe, subscription);
        if (userId) {
          const active = ["active", "trialing", "past_due"].includes(
            subscription.status
          );
          await setPremium(userId, active);
        }
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = await userIdFromSubscription(stripe, subscription);
        if (userId) {
          await setPremium(userId, false);
        }
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.error("Webhook handling failed:", error);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
