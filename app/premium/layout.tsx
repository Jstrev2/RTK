import type { ReactNode } from "react";
import { pageMetadata } from "@/lib/seo";
import { PAID_RESCUE_ENABLED } from "@/lib/billing";

// Layout metadata is inherited by nested segments: any future route under
// /premium (e.g. a checkout success page) must override alternates/openGraph
// or it will canonicalize to /premium.
export const metadata = pageMetadata(
  PAID_RESCUE_ENABLED
    ? {
        title: "Injury Rescue: Pricing and How It Works",
        description:
          "Injured mid-training? A one-time $29 Injury Rescue rebuilds the remaining weeks of any training plan around a careful return to running.",
        path: "/premium",
      }
    : {
        title: "Injury Rescue: How It Works",
        description:
          "Injured mid-training? Injury Rescue grades the injury with a short symptom check, then rebuilds the remaining weeks of any training plan around a careful return to running. Free.",
        path: "/premium",
      }
);

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
