import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Running Music — Find Tracks for This Run",
  description:
    "Find running music by workout, energy, genre, and BPM—from easy miles to the final push.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
