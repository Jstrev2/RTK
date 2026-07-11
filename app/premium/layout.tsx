import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Premium — Injury-Adaptive Training Plans",
  description:
    "Got injured mid-training? Runner Toolkit Premium rebuilds your remaining plan: rest, cross-training swaps, return-to-run protocols, and honest race-day expectations.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
