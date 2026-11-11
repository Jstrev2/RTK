# Data Sources and Ingestion Pipeline

## Sources (Initial)

### Reddit (official API)
We ingest fresh posts to detect mentions of new shoes and apparel brands.

Default subreddits:
- r/runningshoegeeks
- r/running
- r/advancedrunning
- r/trailrunning
- r/ultrarunning

These can be overridden with `REDDIT_SUBREDDITS` (comma-separated list).

### Image Search Providers (optional)
We fetch a single representative image for each catalog item if no image is
stored yet. This is optional and controlled by environment variables.

Supported providers (first available wins):
- Bing Image Search API (`BING_IMAGE_SEARCH_KEY`)
- SerpAPI Google Images (`SERPAPI_API_KEY`)

## How It Works

1. Fetch new posts from the configured subreddits.
2. Scan post titles and bodies for catalog aliases (shoe models, attire brands).
3. Aggregate mention counts and mention scores.
4. Upsert into `catalog_items` and `catalog_mentions` in Supabase.
5. Attempt to fill missing `image_url` entries (optional).

## Where It Shows Up

- Shoe Selector: New Releases uses `catalog_items` when live data is available.
- Attire Guide: Trending on Reddit uses `catalog_items` when live data is available.

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
REDDIT_CLIENT_ID=...
REDDIT_CLIENT_SECRET=...
REDDIT_USER_AGENT=runner-toolkit-ingest
REDDIT_SUBREDDITS=runningshoegeeks,running,advancedrunning
INGEST_SECRET=your-random-secret
BING_IMAGE_SEARCH_KEY=...
SERPAPI_API_KEY=...
IMAGE_FETCH_LIMIT=8
```

## Triggering the Pipeline

Call the ingestion route (protected by `INGEST_SECRET`):

```
POST /api/ingest   (header: x-ingest-secret: YOUR_SECRET)
```

## Next Additions

- Add more aliases in `lib/ingest/catalog-aliases.ts`
- Add RSS or retailer feeds when credentials are available
- Move UI catalog reads to Supabase for true live updates

## Shoe Catalog Coverage (Modern System)

We keep a canonical `shoe_models` list so the Shoe Selector and the "New for 2026" grid stay complete.

### Sources (2026 and beyond)
- Release calendars & previews (SoleReview, Runner's World, GearJunkie)
- Major retailer new-arrivals pages (Running Warehouse, Road Runner Sports, REI)
- Brand launch pages and product drops (Nike, Adidas, ASICS, Brooks, Hoka, New Balance, Saucony, On, etc.)

### Workflow
1. Scrape release calendars into `data/shoe-models-2026.json`.
2. Merge retailer and brand drops into the same JSON (manual or scripted).
3. Upsert with `npm run import:shoes`.
4. Upload imagery to Supabase Storage with `npm run upload:shoe-images`.
5. Audit coverage by brand/category before each release refresh.

### Where It Shows Up
- Shoe Selector: "New for 2026" pulls from `shoe_models`.
- Audit with `npm run audit:shoes` (optionally set `SHOE_AUDIT_YEAR=2026`).

## How the catalog stays current (November 2026)

The scraper pipeline above is dormant. The shoe catalog now maintains itself:

1. A scheduled Claude Code routine audits releases on the 1st of each month and
   opens a PR from a `catalog-audit-*` branch that edits
   `data/shoe-models-authored.json`.
2. The routine then runs `scripts/catalog/check-audit.mjs` against its own
   change (required fields present, no more than 40 shoes added or 8 removed)
   and, if it passes, squash-merges the PR. If the check fails it leaves the
   PR open for a human.
3. The daily Vercel cron (`/api/cron/daily`, 09:00 UTC) reads the file from
   GitHub and applies the differences to `shoe_models` via
   `lib/catalog-sync.ts`, then refreshes the affected pages and pings IndexNow.
   The same limits are enforced again before anything is written.

The file is the source of truth: a shoe removed from it is deactivated in the
database. Nobody needs to run `npm run import:shoes` anymore.

Optional hardening: set `CRON_SECRET` in Vercel (Production). The cron route
then accepts only Vercel's signed scheduler call.
