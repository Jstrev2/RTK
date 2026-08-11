# Monetization

Two revenue streams, in order of how fast they can produce dollars:

1. **Affiliate links** — already wired sitewide; each program goes live the
   moment its env var is set. Managed at `/internal/partners`.
2. **Adaptive Training subscription** — Stripe checkout + webhook + billing
   portal are built; needs the Stripe account configured (checklist below).

---

## 1. Affiliate pipeline

### How it's wired

`lib/affiliate.ts` builds retailer search links for every shoe and fuel
product. Links are unaffiliated (direct) until the matching env var is set —
so the UX works today and monetizes retroactively, sitewide, per program:

| Program           | Env var (Vercel, Production)                | Effect when set |
| ----------------- | ------------------------------------------- | --------------- |
| Amazon Associates | `NEXT_PUBLIC_AMAZON_TAG`                    | `&tag=` appended to every Amazon link (shoes + fuel) |
| Running Warehouse | `NEXT_PUBLIC_RUNNING_WAREHOUSE_LINK_PREFIX` | AvantLink deep-link wrapper around every RW link |
| Fleet Feet        | `NEXT_PUBLIC_FLEET_FEET_LINK_PREFIX`        | wrapper around every Fleet Feet link |
| Dick's            | `NEXT_PUBLIC_DICKS_LINK_PREFIX`             | wrapper around every Dick's link |

The wrapper format is `<click-url-prefix><urlencoded destination>` — the
standard AvantLink/Impact deep-link pattern. After approval, copy the
program's click URL prefix into the env var and redeploy.

New retailers (The Feed, REI, Holabird) need a small addition in
`lib/affiliate.ts` following the same wrap() pattern.

### Pipeline process (tracked at /internal/partners)

`researching → applied → approved → live` (or `rejected` / `parked`).
The tracker seeds seven prioritized targets, carries the application blurb
and a friendly outreach email draft with copy buttons, and records which env
var wires each program. Table is service-role-only (RLS enabled, no
policies); the API gates on `ADMIN_EMAILS` (defaults to the site owner).

Order of attack:
1. **Amazon Associates** — self-serve, approves fast, unlocks every Amazon
   link. Watch the 3-sales-in-180-days requirement.
2. **Running Warehouse (AvantLink)** — best rates, most catalog overlap.
3. **The Feed** — fuel-specific, pairs with the Fuel Planner.
4. Fleet Feet / Dick's / REI / Holabird as capacity allows.

Compliance already in place: every commercial link uses `rel="sponsored"`,
disclosure copy sits beside buy links and on /methodology. Keep both when
touching those components.

---

## 2. Subscription (Adaptive Training)

### Architecture

- **Checkout**: `POST /api/stripe/checkout` (bearer = Supabase access token)
  → Stripe Checkout session (`mode: subscription`, monthly or annual price),
  `client_reference_id` = Supabase user id. Success returns to
  `/premium?status=success`.
- **Entitlement**: `app_metadata.premium: boolean` on the Supabase user —
  set exclusively by the webhook (clients cannot write app_metadata).
  `useAuth().isPremium` reads it from the JWT; `premium-gate` components
  gate features.
- **Webhook**: `POST /api/stripe/webhook` (signature-verified):
  - `checkout.session.completed` → tag the Stripe customer with the user id,
    set `premium: true` + `stripe_customer_id`.
  - `customer.subscription.updated` → premium = status in
    `active | trialing | past_due`. (`past_due` keeps access during Stripe's
    smart-retry dunning window; access drops only when Stripe gives up and
    the sub goes `canceled`/`unpaid`.)
  - `customer.subscription.deleted` → premium = false.
- **JWT refresh**: after checkout, `/premium?status=success` force-refreshes
  the session token (0s / 3s / 8s) so the new claim shows up without
  re-login.
- **Self-serve management**: `POST /api/stripe/portal` opens the Stripe
  Billing Portal (update card, switch monthly↔annual, cancel).
  "Manage subscription" buttons render on /premium and /account for members.

### Lifecycle decisions

| Event | Handling |
| ----- | -------- |
| Payment failure | Stripe smart retries + portal; `past_due` keeps access until Stripe resolves or cancels. No custom dunning email at this stage. |
| Cancel | Portal cancels at period end → `subscription.updated` keeps premium until the period lapses, then `deleted` flips it off. |
| Plan switch (monthly↔annual) | Portal proration, no code involvement — entitlement is binary. |
| Refunds | Manual in the Stripe dashboard; cancel the sub there too (the webhook then revokes access). |
| Disputes | Handle in dashboard; revoke via subscription cancel. |

### Not built yet (deliberately)

- **Plan Rescue pass** (one-time fixed-window access): implement as Checkout
  `mode: payment` + a `checkout.session.completed` branch that stamps
  `app_metadata.rescue_until: <ISO date>`; `isPremium` becomes
  `premium || rescue_until > now`. Ship only after the subscription has real
  buyers — one-time pricing cannibalizes early subs.
- Team/coach plans, trials, coupon flows.

### Launch checklist (Stripe)

1. Create/activate the Stripe account; enable the **Billing Portal** default
   configuration (Settings → Billing → Customer portal → Save).
2. Create product "Injury Rescue" with three prices:
   - **one-time — $29** (the flagship SKU; 90 days of access, stamped as
     `app_metadata.rescue_until` by the webhook)
   - monthly recurring — $9 (matches /premium copy)
   - annual recurring — $90 ("season pass" on /premium)
3. Add webhook endpoint `https://runnertoolkit.com/api/stripe/webhook` with
   events: `checkout.session.completed`,
   `checkout.session.async_payment_succeeded`,
   `customer.subscription.updated`, `customer.subscription.deleted`.
4. Set Vercel Production env vars:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `STRIPE_PRICE_RESCUE` (the $29 one-time price ID — without it the
     flagship buttons on /rescue and /premium 503)
   - `STRIPE_PRICE_MONTHLY` / `STRIPE_PRICE_ANNUAL` (price IDs)
   - `NEXT_PUBLIC_SITE_URL=https://runnertoolkit.com` (optional; defaults)
5. Redeploy, then test end-to-end in test mode first (test keys + card
   `4242 4242 4242 4242`): checkout → premium flag appears on /premium →
   portal opens → cancel → access drops after period end (or immediately
   with a test-clock).

### Related env still outstanding

- `CRON_SECRET` — weekly catalog crons 401 until set.
- `ADMIN_EMAILS` — optional; internal tools default to the owner's email.
