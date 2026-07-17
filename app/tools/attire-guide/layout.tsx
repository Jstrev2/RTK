import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Free Running Attire Guide",
  description:
    "What to wear for your run, free: outfit recommendations for any temperature, weather, and training style.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
