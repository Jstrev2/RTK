# Content engine

Runner Toolkit publishes on its own. Nobody imports, merges or deploys by hand.

## What gets published

1. **Data pages** (generated from Supabase, rendered on demand, cached a day):
   - Shoes: `/shoes/best/*` collections and `/shoes/compare/a-vs-b` comparisons (`lib/content/shoes.ts`).
   - Music: `/music/pace/*`, `/music/workout/*`, `/music/genre/*`, `/music/bpm/*`, `/music/artist/*` (`lib/content/music.ts`, fed by the song library below).
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

The weekly routine "Weekly shoe catalog audit" (prompt in
`scripts/catalog/ROUTINE-shoes.md`) adds new releases and lineup gaps to
`data/shoe-models-authored.json`, checks its PR with
`scripts/catalog/check-audit.mjs` and squash-merges it. The daily cron syncs
the file into `shoe_models` and fetches photos for up to three shoes a day that
have none (`lib/ingest/shoe-images.ts`). The one-time backfill and any re-run is
`node scripts/catalog/backfill-shoe-images.mjs`; `node scripts/catalog/sync-local.mjs`
applies a local copy of the catalog file with the same limits.

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

## Song library

`music_songs` holds the songs the Music Finder and the /music pages use. Only
songs with a BPM and a cover show anywhere (`lib/music/library.ts`).

- **Where songs come from:** Deezer's public API (no key): the global chart
  and 15 genre charts, plus the tracks in runners' public playlists (searches
  for running, run, workout, cardio, marathon, tempo run and more). A playlist
  track gets in when two playlists carry it or Deezer ranks it as popular.
  Kids' and lullaby acts, karaoke, "workout remix" factories, sped-up and
  slowed versions, and cheap covers of a popular original are kept out
  (`lib/music/catalog-rules.ts`). Deezer's playlists lean French, so a
  playlist-only track must be registered in an English-speaking market (its
  ISRC) or be by an artist on the US charts; chart songs always get in.
  Runners add any song in the finder: `/api/music/find` searches Spotify (or
  Deezer while Spotify is rate limiting us) and `/api/music/add` stores it
  (`added_by`, and `user_songs` remembers it as theirs).
- **BPM:** GetSongBPM when it knows the song by that artist
  (`bpm_source = 'getsongbpm'`); otherwise the tempo is read from Deezer's
  30-second preview (`lib/music/tempo.ts`, `'analysis'`). A preview without a
  clear beat gets no BPM (`'unreadable'`) and stays hidden. `'catalog'` marks
  older rows whose tempo came with the original import. GetSongBPM's terms
  require the visible getsongbpm.com link under every song list. Energy (low
  to extreme) comes from the preview's loudness, attack and brightness.
- **Spotify:** each song's Spotify id is found by ISRC (client credentials);
  Spotify's cover fills in when Deezer has none. Spotify keeps development-mode
  apps on a small quota: on November 23, 2026 about 700 searches at 10 a
  second locked the app out for 23 hours. Calls are now paced at one per 0.7
  seconds, and a long 429 stops every Spotify step until the lockout ends
  (`SpotifyUnavailable` in `lib/music/sources.ts`). Save to Spotify looks up
  any song still missing an id with the runner's own sign-in.
- **Every day** (`runDailyMusicIngest` in `lib/music/ingest.ts`, called by
  `/api/cron/daily` with whatever is left of its 60 seconds, up to 20): reads the global chart,
  two genre charts and three runners' playlists (rotating by day), adds the
  popular songs we lack with a BPM from their preview, retries BPM for songs
  that have none (GetSongBPM first), and maps Spotify ids for songs missing
  one. Each step stops when the time runs out; the next day carries on.
- **Backfill** (local, resumable, working files in `.tmp/music/`):
  `npm run music:backfill -- <stage>` with the stages `discover`, `details`,
  `existing`, `apply`, `getsong` (about one song a second), `spotify` and
  `report`. `npm run music:validate-tempo` checks the preview reader against
  GetSongBPM.
- Previews play through `/api/music/preview/<deezer id>`: Deezer's preview
  links expire after about fifteen minutes, so the stored `preview_url` is
  only a hint.
- **Save to Spotify** uses Spotify's PKCE sign-in in the browser
  (`lib/music/spotify-export.ts`). Redirect URIs registered on the Spotify app:
  `https://runnertoolkit.com/tools/music/spotify` and
  `http://127.0.0.1:3202/tools/music/spotify`. While the app is in Spotify's
  development mode only allow-listed accounts can save; everyone else gets the
  copy-the-links fallback.

## Deploys

The Vercel project `fun-run` is connected to GitHub: a push to `main` deploys.
Guides do not need a deploy (they come through the sync).

## If something stops

- No new guides: check the routine's runs at claude.ai (Routines) and any open
  `guides-*` PR on GitHub; the PR comment says what failed.
- Guides merged but not live: open `/api/guides/sync` in a browser; the JSON
  says what it added or why it failed.
