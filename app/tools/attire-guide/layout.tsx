import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Running Attire Guide",
  description:
    "What to wear for your run based on weather conditions. Get outfit recommendations for any temperature and conditions.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
