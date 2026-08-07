import type { Metadata } from "next";
import LogoLabClient from "./logo-lab-client";

export const metadata: Metadata = {
  title: "Logo Lab",
  description: "Compare six Runner Toolkit logo directions in real site contexts.",
  robots: { index: false, follow: false }
};

export default function LogoLabPage() {
  return <LogoLabClient />;
}
