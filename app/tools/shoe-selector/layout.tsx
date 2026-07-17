import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Free Running Shoe Finder — Every Current Road Shoe, Ranked for You",
  description:
    "Answer a few questions about your runs, pronation, mileage, and budget to get personalized road running shoe recommendations from every current 2024-2026 model. Free, no account required.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
