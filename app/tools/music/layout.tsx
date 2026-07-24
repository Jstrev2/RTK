import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Running Music - Build a Playlist for This Workout",
  description:
    "Choose the workout, duration, and energy arc to build a phased running playlist from warm-up through the final push.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
