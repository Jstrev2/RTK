import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Training Plans",
  description:
    "Free running training plans for 5K, 10K, half marathon, and marathon. Structured weekly schedules for beginners to advanced runners.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
