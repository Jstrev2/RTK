import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { IBM_Plex_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import { AuthProvider } from "@/components/auth-provider";

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"]
});

const body = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["300", "400", "500", "600"]
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1491ff",
};

export const metadata: Metadata = {
  title: {
    default: "Runner Toolkit — Free Tools for Serious Runners",
    template: "%s | Runner Toolkit"
  },
  description:
    "Free running tools: shoe finder, pace calculator, race-day fueling planner, workout music by BPM, and training plans — all in one place.",
  metadataBase: new URL("https://runnertoolkit.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Runner Toolkit",
    title: "Runner Toolkit — Free Tools for Serious Runners",
    description:
      "Shoe recommendations, pace calculations, race-day fueling plans, workout music by BPM, and training schedules — all free.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Runner Toolkit — Free Tools for Serious Runners",
    description:
      "Shoe recommendations, pace calculations, race-day fueling plans, workout music by BPM, and training schedules — all free.",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://runnertoolkit.com",
  },
};

export default function RootLayout({
  children
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <AuthProvider>
          <SiteHeader />
          <main>{children}</main>
          <SiteFooter />
        </AuthProvider>
      </body>
    </html>
  );
}
