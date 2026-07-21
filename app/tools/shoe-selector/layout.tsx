import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Shoe Finder — Find Shoes That Fit Your Run",
  description:
    "Tell us what you run, the ride and fit you prefer, and your budget. Get a short, explainable list of road shoes worth trying.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
