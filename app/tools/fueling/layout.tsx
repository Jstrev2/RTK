import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Fuel Planner - Build a Practical Run Fueling Schedule",
  description:
    "Turn distance, expected time, and conditions into a practical carbohydrate schedule, hydration starting point, and short list of products to practice.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
