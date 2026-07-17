import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Running Music — 3,000+ Songs for Every Pace",
  description:
    "A free library of 3,000+ community-ranked running songs with workout tags. Find tracks for easy runs, tempo days, and speed work.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
