import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Free Running Pace Calculator",
  description:
    "Calculate your running pace, predict finish times, and get mile-by-mile splits for 5K, 10K, half marathon, marathon, and ultra distances. Free, no account required.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
