import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Race Fueling Planner",
  description:
    "Plan your race-day nutrition. Get a personalized gel schedule based on your pace, distance, and preferred energy gel.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
