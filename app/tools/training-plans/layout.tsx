import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Free Training Plans That Adapt to Injury",
  description:
    "Nine free running plans from 5K to marathon with full weekly schedules — plus the injury-adaptive rebuild that gets you back to the start line when training goes sideways.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
