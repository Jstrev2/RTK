"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const MEASUREMENT_ID = "G-9JT3GV1LZG";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export default function GoogleAnalytics() {
  const pathname = usePathname();
  const [enabled, setEnabled] = useState(false);
  const initialized = useRef(false);
  const previousPage = useRef<string | null>(null);

  useEffect(() => {
    // Preview deployments and local development must not inflate live traffic.
    if (!["runnertoolkit.com", "www.runnertoolkit.com"].includes(window.location.hostname)) return;

    const pageLocation = window.location.origin + pathname;
    if (previousPage.current === pageLocation) return;

    // Keep query strings, auth fragments and form contents out of Analytics.
    let referrer = previousPage.current ?? "";
    if (!referrer && document.referrer) {
      try {
        referrer = new URL(document.referrer).origin + "/";
      } catch {
        // An invalid referrer is simply omitted.
      }
    }

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () {
      window.dataLayer!.push(arguments);
    };
    window.gtag("set", {
      page_location: pageLocation,
      page_referrer: referrer,
      page_title: document.title,
    });

    if (!initialized.current) {
      window.gtag("js", new Date());
      window.gtag("config", MEASUREMENT_ID, {
        send_page_view: false,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
      });
      initialized.current = true;
      setEnabled(true);
    }

    // Enhanced measurement is off in GA4: send exactly one view per route.
    window.gtag("event", "page_view", { send_to: MEASUREMENT_ID });
    previousPage.current = pageLocation;
  }, [pathname]);

  return enabled ? (
    <Script
      id="runner-toolkit-ga4"
      src={`https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`}
      strategy="afterInteractive"
    />
  ) : null;
}
