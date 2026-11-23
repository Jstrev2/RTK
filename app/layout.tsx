import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Analytics } from "@vercel/analytics/next";
import localFont from "next/font/local";
import "./globals.css";
import "./design.css";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import { AuthProvider } from "@/components/auth-provider";
import JsonLd from "@/components/json-ld";
import GoogleAnalytics from "@/components/google-analytics";
import { SITE_URL } from "@/lib/seo";

// Fonts are bundled in app/fonts rather than fetched from Google at build
// time: that fetch failed often enough to break production deploys.
// Archivo is variable in weight and width: headlines run it wide (125%).
const archivo = localFont({
  src: "./fonts/archivo-latin-wdth-normal.woff2",
  variable: "--font-display",
  weight: "100 900",
  display: "swap",
  declarations: [{ prop: "font-stretch", value: "62% 125%" }]
});

const mono = localFont({
  src: "./fonts/jetbrains-mono-latin-wght-normal.woff2",
  variable: "--font-mono-face",
  weight: "100 800",
  display: "swap"
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#121212",
};

export const metadata: Metadata = {
  title: {
    default: "Runner Toolkit: Run Smarter. Guess Less.",
    template: "%s | Runner Toolkit"
  },
  description:
    "Free running tools and guides: find shoes that fit how you run, songs that match your cadence, and a fuel plan for your race.",
  metadataBase: new URL(SITE_URL),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Runner Toolkit",
    title: "Runner Toolkit: Run Smarter. Guess Less.",
    description:
      "Find shoes that fit how you run, build music for the workout, and plan fuel for the distance.",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Runner Toolkit: Run smarter. Guess less." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Runner Toolkit: Run Smarter. Guess Less.",
    description:
      "Find shoes that fit how you run, build music for the workout, and plan fuel for the distance.",
    images: ["/og.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin
  : null;

export default function RootLayout({
  children
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" className={`${archivo.variable} ${mono.variable}`}>
      <body>
        {supabaseOrigin ? (
          <link rel="preconnect" href={supabaseOrigin} crossOrigin="anonymous" />
        ) : null}
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "WebSite",
                "@id": `${SITE_URL}/#website`,
                url: SITE_URL,
                name: "Runner Toolkit",
                publisher: { "@id": `${SITE_URL}/#org` }
              },
              {
                "@type": "Organization",
                "@id": `${SITE_URL}/#org`,
                name: "Runner Toolkit",
                url: SITE_URL,
                logo: { "@type": "ImageObject", url: `${SITE_URL}/icon.svg` }
              }
            ]
          }}
        />
        <AuthProvider>
          <SiteHeader />
          <main>{children}</main>
          <SiteFooter />
        </AuthProvider>
        <Analytics />
        <GoogleAnalytics />
      </body>
    </html>
  );
}
