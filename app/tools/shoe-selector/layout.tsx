import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Shoe Finder",
  description:
    "Find your perfect running shoe. Filter by usage, cushion, stability, surface, and more from 200+ models.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
