import type { ReactNode } from "react";
import { pageMetadata } from "@/lib/seo";

// Layout metadata is inherited by nested segments: any future route under
// /premium (e.g. a checkout success page) must override alternates/openGraph
// or it will canonicalize to /premium.
export const metadata = pageMetadata({
  title: "Adaptive Training — A Plan That Changes With You",
  description:
    "Revise the remaining training schedule when missed time or an appropriately cleared return changes what is realistic.",
  path: "/premium",
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
