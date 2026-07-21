import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Adaptive Training — A Plan That Changes With You",
  description:
    "Revise the remaining training schedule when missed time or an appropriately cleared return changes what is realistic.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
