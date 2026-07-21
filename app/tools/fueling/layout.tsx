import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Fuel Planner — Know What to Take and When",
  description:
    "Turn distance, expected time, conditions, and preferred products into a practical fuel schedule to practice before race day.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
