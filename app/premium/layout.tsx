import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Premium — The Comeback Plan for Injured Runners",
  description:
    "Your plan broke you. Runner Toolkit Premium rebuilds it around the injury: rest, cross-training swaps, return-to-run progressions, and an honest race-day call. $9/month, cancel anytime.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
