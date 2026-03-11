# Remaining Tasks & Required APIs

## Required API Keys (add to `.env.local`)
- `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET`  
  Used by `catalog:music` to pull playlists (free Spotify developer app).
- `SPOTIFY_PLAYLIST_IDS`  
  Comma-separated playlist IDs to ingest.

## Free Discovery Mode (no paid APIs)
- Shoes, attire, and gels can run in sitemap mode without keys.
- Optional tuning env vars:
  - `SITEMAP_MAX_FILES` (default 8)
  - `SITEMAP_MAX_URLS` (default 8000)
  - `ATTIRE_URL_LIMIT` (default 60)
  - `GEL_URL_LIMIT` (default 40)

## Database / Supabase Setup
1. Run the SQL in `supabase/schema.sql` (Supabase SQL Editor) to create/upgrade:
   - `attire_items` table
   - `fuel_gels` table
2. Storage policy (manual step in Storage UI):
   - Create `shoe-images` bucket (or reuse it)
   - Ensure public read policy exists for `shoe-images`
   - Note: SQL editor cannot modify `storage.objects` due to ownership restrictions.
3. Optional: If you want a separate bucket for attire, create `attire-images` and set:
   - `SUPABASE_ATTIRE_BUCKET=attire-images`

## Shoe Catalog (2023–2026)
- Update `data/shoe-seeds.json` with all 2023–2026 shoe names + release dates.
  - Current file is a 2026 starter only.
- Run:
  - `npm run catalog:shoes`
- After import, verify:
  - `npm run audit:shoes`
- Verify:
  - `npm run audit:shoes`

## Attire Catalog
- Run:
  - `npm run catalog:attire`
- If the apparel list is too small or irrelevant, expand the brand list in:
  - `scripts/catalog/config.mjs`

## Fuel Gels Catalog
- Run:
  - `npm run catalog:gels`
- Optional: expand gel brands in:
  - `scripts/catalog/config.mjs`
- Note: Fueling UI does **not** yet display gels (requires UI wiring).

## Music Catalog
- After setting Spotify keys and playlist IDs, run:
  - `npm run catalog:music`

## Other Required Tasks
- Confirm the 2023–2026 seed list scope (brands + categories) is complete.
- If free sitemap discovery returns low coverage, increase:
  - `SITEMAP_MAX_FILES`, `SITEMAP_MAX_URLS`, `ATTIRE_URL_LIMIT`, `GEL_URL_LIMIT`
- If you want apparel images stored separately:
  - Create `attire-images` bucket and set `SUPABASE_ATTIRE_BUCKET`

## UI Work (Not Done Yet)
- Fueling tool needs a UI section to read from `fuel_gels`.
- Optional: add attire/shoe image placeholders styling if you want a different layout.
