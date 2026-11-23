# Routine: weekly shoe catalog audit

Install as a Claude routine (claude.ai, Routines) on the GitHub repo
`Jstrev2/RTK`, schedule **weekly, Monday 06:00 UTC**. It replaces the old
"Monthly shoe catalog re-audit", whose PRs were never merged. Paste everything
below the line as the routine's prompt.

---

You keep Runner Toolkit's road running shoe catalog complete. The catalog is
`data/shoe-models-authored.json` in the repo `Jstrev2/RTK`. A daily job on the
site syncs that file into the database and then fetches a product photo for
any new shoe on its own (`lib/ingest/shoe-images.ts`, three shoes a day), so a
shoe you add here shows up on runnertoolkit.com with its picture within a few
days. You cannot reach runnertoolkit.com from this sandbox and there is no `gh`
CLI: use git for the branch and the GitHub MCP tools for the pull request.

## 1. Find what is missing

Work from today's date. Look for two kinds of gaps, road running shoes only
(no trail, track spikes, walking, gym, lifestyle, waterproof or kids' versions):

1. **New releases** since the newest `release_date` in the file: every brand
   already in the catalog plus any road shoe from another established running
   brand that runners are buying.
2. **Holes in current lineups**: models a major retailer sells today that the
   catalog lacks, including versions we skipped (a Beast GTS 26 when we only
   have the 24) and whole models (a brand's stability or wide-fit shoe).

Sources, in this order, with your web search and fetch tools:

- Retailer road-shoe listings: Running Warehouse (road running shoes by
  brand), Holabird Sports, Fleet Feet, Zappos. Their product sitemaps
  (`https://www.holabirdsports.com/sitemap.xml`, `https://www.runnersplus.com/sitemap.xml`)
  list every product they carry, one handle per colorway.
- RunRepeat's new releases and brand pages, Believe in the Run and Doctors of
  Running reviews, and the brands' own release news.
- If a site refuses automated requests, skip it. Never work around a block.

A shoe qualifies only when a retailer sells it now (in stock or shipping
within two weeks). Rumors, leaks and "coming this spring" posts do not count.

## 2. Write each new row

Copy the field conventions of the rows already in the file. Every row has all
of: `item_key` (lowercase brand + model, hyphens, e.g. `brooks-beast-gts-26`),
`name` (brand + model as the brand writes it), `brand` (exactly as the file
already spells it: `Hoka`, `On`, `Puma`, `ASICS`, `New Balance`...), `price`
(US MSRP, integer), `usage_types`, `foot_strike`, `cadence`, `toe_box`,
`cushion`, `stability`, `surfaces` (`["road"]`), `weight_range`, `stack` (heel,
mm), `drop` (mm), `weight_mens` and `weight_womens` (oz, US 9 / US 7),
`description`, `pros` (2 or 3), `cons` (2 or 3), `popularity` (0 to 100,
compare with similar rows: a brand's flagship trainer 80 to 95, niche models
45 to 60), `release_year`, `release_date` (YYYY-MM-DD, the US release),
`product_url` (null).

- Price, drop and weights come from a retailer or brand product page. If the
  brand has not published a number, carry the previous version's value and
  say so in the evidence file.
- `description`: two or three plain sentences: what the shoe is, what changed,
  who it suits. No em dashes, ever. No hype words. Follow `CONTENT_VOICE.md`.
- Older versions stay in the file. Remove a row only if it was never a road
  running shoe or is a duplicate; the sync refuses more than 8 removals.
- Keep the array sorted by `item_key`, two-space JSON, same as now.

Record where every new shoe came from in
`data/catalog-evidence/<today>-shoes.json` (same shape as
`data/catalog-evidence/2026-11-23-shoes.json`): the product page URL, the date
it was first listed, and which numbers were carried over.

## 3. Check, open the PR, merge

1. Save the current file first: `git show origin/main:data/shoe-models-authored.json > /tmp/base.json`.
2. `node scripts/catalog/check-audit.mjs --base /tmp/base.json --head data/shoe-models-authored.json`
   must pass. It also enforces at most 40 additions: if you found more, add
   the 40 most popular and list the rest in the PR body for next week.
3. `git checkout -b catalog-<today>`, commit both files with a plain message
   ("Shoe catalog: add 6 road shoes (Nimbus 29, ...)"), `git push -u origin catalog-<today>`.
4. Open the PR with `mcp__github__create_pull_request` (base `main`). The body
   lists each shoe added, its evidence URL and any carried-over numbers.
5. Merge it with `mcp__github__merge_pull_request`, `merge_method: "squash"`.
   Do not wait for a review: the check in step 2 is the gate.
6. If nothing is missing, open no PR and say so in your final message.

Finish with a short report: shoes added (name, release date, evidence),
shoes you saw but left out and why, and the PR link.
