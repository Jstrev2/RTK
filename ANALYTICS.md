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

## Events (added November 2026)

`lib/analytics.ts` `trackEvent()` sends anonymous events to GA4 and Vercel
Analytics. No tool inputs are ever attached (no injury, symptoms, mileage or
email).

| Event | Fires when |
| ----- | ---------- |
| `rescue_verdict` | someone runs the injury calculator |
| `generate_lead` (`source`: `rescue` or `newsletter`) | an email is captured |
| `share` | the "copy a link to this verdict" button is used |
| `buy_link_click` (`retailer`, `shoe`, `brand`) | a retailer link is clicked |

In GA4, Admin > Events lets you star `generate_lead` and `rescue_verdict` as
key events so they show up as conversions.

## Bots

The first two weeks of data were about 90% automated traffic (one crawler in
Singapore, zero engagement). The tag now skips browsers that report
`navigator.webdriver`, which removes most headless crawlers. If a country
still dominates with 0% engagement, filter it in the report instead of
trusting the totals.

## Search Console and IndexNow

- Google Search Console: URL-prefix property `https://runnertoolkit.com/`,
  verified by the file `public/google280c128eef2df7c4.html` (keep it).
- IndexNow (Bing and the engines that share its index): key file
  `public/eaaceb07ebc326c7a6d2ae8549fd9d11.txt`. The daily cron submits shoe
  pages that changed; `node scripts/indexnow-submit.mjs` resubmits the whole
  sitemap after a big content change.

Use GA4 Reports > Realtime to check current visits, and the traffic reports
for visitors, sessions and page views over a chosen date range. Collection
starts at installation; earlier traffic cannot be recovered by this tag.
