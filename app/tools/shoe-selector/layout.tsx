import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Running Shoe Finder — Personalized Recommendations",
  description:
    "Answer a few questions about your runs, pronation, mileage, and budget to get personalized road running shoe recommendations from every current 2024-2026 model.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
