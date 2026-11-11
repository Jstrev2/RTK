/**
 * Paid Injury Rescue is off unless this flag is set at build time.
 *
 * While it is off, nothing on the site mentions a price or opens checkout:
 * the full comeback schedule is free (first week open, remaining weeks for an
 * email). Set NEXT_PUBLIC_RESCUE_PAID=1 in Vercel, together with the Stripe
 * variables in MONETIZATION.md, to bring the $29 paywall back without any
 * code change.
 */
export const PAID_RESCUE_ENABLED = process.env.NEXT_PUBLIC_RESCUE_PAID === "1";
