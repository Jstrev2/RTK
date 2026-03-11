import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Running Music by BPM",
  description:
    "Browse 3,000+ running songs organized by BPM. Find the perfect tempo for easy runs, tempo runs, speed work, and more.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
