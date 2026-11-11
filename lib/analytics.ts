import { track as vercelTrack } from "@vercel/analytics";

type EventParams = Record<string, string | number | boolean>;

/**
 * Anonymous usage events, sent to GA4 (production only, see
 * components/google-analytics.tsx) and Vercel Analytics.
 *
 * Never pass tool inputs here: no injury names, symptom answers, mileage, or
 * emails. Events say that something happened, not what the runner entered.
 */
export function trackEvent(name: string, params?: EventParams) {
  if (typeof window === "undefined") return;
  try {
    vercelTrack(name, params);
  } catch {
    // Analytics must never break a tool.
  }
  try {
    window.gtag?.("event", name, params ?? {});
  } catch {
    // Same.
  }
}
