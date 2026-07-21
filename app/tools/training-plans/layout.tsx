import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Free Training Plans — 5K to Marathon",
  description:
    "Browse complete free running plans from 5K to marathon, then preview how Adaptive Training can revise the remaining schedule when circumstances change.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
