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
    default: "Runner Toolkit — The Training Plan That Survives Injury",
    template: "%s | Runner Toolkit"
  },
  description:
    "Your plan broke you. Ours will get you back to the start line. Injury-adaptive training plans, plus free tools: shoe finder, pace calculator, fueling planner, and running music.",
  metadataBase: new URL("https://runnertoolkit.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Runner Toolkit",
    title: "Runner Toolkit — Your Plan Broke You. Ours Will Get You Back.",
    description:
      "Injury-adaptive training plans that rebuild your remaining weeks around the injury — plus a free shoe finder, pace calculator, fueling planner, and running music library.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Runner Toolkit — Your Plan Broke You. Ours Will Get You Back.",
    description:
      "Injury-adaptive training plans that rebuild your remaining weeks around the injury — plus a free shoe finder, pace calculator, fueling planner, and running music library.",
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
