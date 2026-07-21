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
  themeColor: "#f4f0e7",
};

export const metadata: Metadata = {
  title: {
    default: "Runner Toolkit — Run Smarter. Guess Less.",
    template: "%s | Runner Toolkit"
  },
  description:
    "Free tools to find running shoes, build a run playlist, and plan race fuel—plus adaptive training when your schedule changes.",
  metadataBase: new URL("https://runnertoolkit.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Runner Toolkit",
    title: "Runner Toolkit — Run Smarter. Guess Less.",
    description:
      "Find shoes that fit how you run, build music for the workout, and plan fuel for the distance.",
    images: [{ url: "/og.png", width: 1731, height: 909, alt: "Runner Toolkit — Run smarter. Guess less." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Runner Toolkit — Run Smarter. Guess Less.",
    description:
      "Find shoes that fit how you run, build music for the workout, and plan fuel for the distance.",
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
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
