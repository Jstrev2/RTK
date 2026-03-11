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
POST /api/ingest?secret=YOUR_SECRET
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
