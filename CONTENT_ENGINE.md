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
3. It opens `https://runnertoolkit.com/api/guides/sync`, which reads
   `content/guides.json` from GitHub's main branch into the `articles` table,
   refreshes the pages and pings IndexNow. The daily cron
   (`/api/cron/daily`, 09:00 UTC) runs the same sync as a fallback.

The sync only adds and updates; it never unpublishes. To take a guide down,
delete its row in Supabase (`articles`) and its file in `content/rundown/`.

## Accounts

Every tool is free. The full result (all shoe matches, the whole playlist,
every fuel serving, the catalogs and the practice log) needs a free account
(`components/account-gate.tsx`). Content pages are open to everyone.

## Shoe catalog

Unchanged: the monthly routine "Monthly shoe catalog re-audit" edits
`data/shoe-models-authored.json`, and the daily cron syncs it.

## Deploys

The Vercel project `fun-run` is connected to GitHub: a push to `main` deploys.
Guides do not need a deploy (they come through the sync).

## If something stops

- No new guides: check the routine's runs at claude.ai (Routines) and any open
  `guides-*` PR on GitHub; the PR comment says what failed.
- Guides merged but not live: open `/api/guides/sync` in a browser; the JSON
  says what it added or why it failed.
