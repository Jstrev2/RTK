# Website traffic (GA4)

Configured October 27, 2026 for basic traffic reporting.

- Account: Naper Solutions In-House Accounts (`35494500`).
- Property: Runner Toolkit (`561097293`). Reporting timezone: America/Chicago; currency: USD.
- [Open Analytics](https://analytics.google.com/analytics/web/#/a35494500p561097293/reports/intelligenthome).
- Web stream: Runner Toolkit website (`16216735244`), https://runnertoolkit.com.
- Measurement ID: `G-9JT3GV1LZG` (public identifier, not a secret).
- `components/google-analytics.tsx` is included once in the root layout.
- Tracks initial page views and Next.js route changes. GA4 supplies standard
  visitor/session metrics. No custom goals, conversions or form events.
- Enhanced measurement is **off** in the web stream; `send_page_view: false`
  disables the automatic initial view. Keep both settings to avoid duplicate
  page views alongside the component's explicit route events.
- Only the production domain (and www alias) loads GA4. Local and Vercel
  preview URLs do not send traffic.
- Query strings and URL fragments are omitted; the initial external referrer
  is reduced to its origin. No account IDs or tool inputs are sent. Google
  signals and advertising personalization are disabled in the tag.
- Existing Vercel Analytics is independent and remains available.

Use GA4 Reports > Realtime to check current visits, and the traffic reports
for visitors, sessions and page views over a chosen date range. Collection
starts at installation; earlier traffic cannot be recovered by this tag.
