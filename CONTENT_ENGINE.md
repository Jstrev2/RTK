# Content engine

Runner Toolkit publishes on its own. Nobody imports, merges or deploys by hand.

## What gets published

1. **Data pages** (generated from Supabase, rendered on demand, cached a day):
   - Shoes: `/shoes/best/*` collections and `/shoes/compare/a-vs-b` comparisons (`lib/content/shoes.ts`).
   - Music: `/music/bpm/*`, `/music/pace/*`, `/music/genre/*`, `/music/workout/*`, `/music/artist/*` (`lib/content/music.ts`).
   - Fuel: `/fuel/gels/*`, `/fuel/compare/*`, `/fuel/plan/<race>/<finish>`, `/fuel/best/*` (`lib/content/fuel.ts`).
   Every page has a minimum-data rule and 404s below it. When the catalog grows,
   new pages appear by themselves and enter the sitemap.
2. **Guides** (`content/rundown/*.md`): written twice a day by the scheduled
   Claude routine **"Runner Toolkit guide writer"** (claude.ai, routines), four
   per run, from the backlog in `content/topics.md`.

## How a guide goes live

1. The routine writes guides, marks their topics done, runs
   `node scripts/rundown/check-guides.mjs --write` (voice rules, links, format)
   and opens a PR from a `guides-*` branch.
2. It runs `node scripts/rundown/check-guides.mjs --pr` (only content files,
   at most 8 new guides, no deletions, bundle up to date) and squash-merges.
3. Every push to main makes Vercel run `scripts/vercel-ignore.sh` (the
   project's `ignoreCommand`). It opens `https://runnertoolkit.com/api/guides/sync`,
   which reads `content/guides.json` at main's current commit into the
   `articles` table, refreshes the pages and pings IndexNow. Then, if the push
   changed only `content/`, it tells Vercel to skip the build (guides don't
   need a deploy). The daily cron (`/api/cron/daily`, 09:00 UTC) runs the same
   sync as a fallback. The routine's sandbox cannot reach runnertoolkit.com,
   which is why the publish hangs off Vercel instead.

The routine can't see the live site, so it works from snapshots in the repo:
`content/site-paths.txt` (every page in the sitemap; refresh it with
`curl -s https://runnertoolkit.com/sitemap.xml` when page types change, and
the check also accepts the generated page shapes) and `data/fuel-gels-live.json` (the live gel table,
exported November 23, 2026).

The sync only adds and updates; it never unpublishes. To take a guide down,
delete its row in Supabase (`articles`) and its file in `content/rundown/`.

## Accounts

Every tool is free. The full result (all shoe matches, the whole playlist,
every fuel serving, the catalogs and the practice log) needs a free account
(`components/account-gate.tsx`). Content pages are open to everyone.

## Shoe catalog

Unchanged: the monthly routine "Monthly shoe catalog re-audit" edits
`data/shoe-models-authored.json`, and the daily cron syncs it.

## Fuel catalog

`data/fuel-catalog.json` is the source of truth for every gel, chew, drink mix,
bar and electrolyte product (nutrition, flavors, price, brand page, official
photo). The monthly routine in `scripts/catalog/ROUTINE-fuel.md` audits brand
pages, edits the file, passes `node scripts/catalog/check-fuel.mjs` and merges
its PR. The daily cron syncs it (`lib/fuel-sync.ts`) and stores the official
photo of anything new in Supabase Storage (`lib/fuel-images.ts`, bucket
`site-images`, `fuel/<item_key>.webp` plus a 360px `fuel/thumb/` copy). From
this computer: `node scripts/fuel-catalog.mjs sync` and
`node scripts/fuel-catalog.mjs images`. A product removed from the file is
deactivated and its page redirects to its brand in the `/fuel` grid.
`data/fuel-gels-live.json` (the guide writer's snapshot) was regenerated from
the catalog on November 23, 2026.

## Deploys

The Vercel project `fun-run` is connected to GitHub: a push to `main` deploys.
Guides do not need a deploy (they come through the sync).

## If something stops

- No new guides: check the routine's runs at claude.ai (Routines) and any open
  `guides-*` PR on GitHub; the PR comment says what failed.
- Guides merged but not live: open `/api/guides/sync` in a browser; the JSON
  says what it added or why it failed.
