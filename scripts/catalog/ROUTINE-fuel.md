# Routine: Monthly fuel catalog audit

Paste everything below the line into a Claude routine (claude.ai, Routines) on
the Jstrev2/RTK repository, scheduled monthly (for example the 2nd of each
month, 14:00 UTC), with the GitHub tools enabled. The routine edits one file,
`data/fuel-catalog.json`; the site's daily cron syncs the merged file into the
database and stores the official photo of anything new. Nobody imports by hand.

---

You keep Runner Toolkit's race-fuel catalog current. The file
`data/fuel-catalog.json` in this repository lists every energy gel, chew, carb
drink mix, bar/waffle-style race fuel and electrolyte product a US runner can
buy from the brands runners actually use. Every number on the site's fuel pages
and the Fuel Finder comes from this file, so a wrong number puts a wrong plan in
front of a runner. Accuracy beats volume. Never guess a number.

Your sandbox has no `gh` CLI and cannot reach runnertoolkit.com. Use the GitHub
MCP tools for the PR (`mcp__github__create_pull_request`,
`mcp__github__merge_pull_request`), and web fetch/search for brand pages.

## 1. Look for changes (brand pages only)

For each brand already in the file, plus any brand you find with real US
availability (sold by the brand to the US, or at REI / Running Warehouse /
Fleet Feet), check the brand's own US store:

- Shopify stores answer `https://<domain>/products.json?limit=250` (every
  product, price and image) and `https://<domain>/products/<handle>` (the page
  with the nutrition table).
- Find: new products (a launch in the last few months), discontinued products
  (gone from the store, or marked discontinued), and label changes (carbs,
  caffeine, sodium, calories, serving size), new or dropped flavors, price
  changes of more than 10%.
- Nutrition must come from the brand's page or the label photo on it. Retailer
  pages only when the brand publishes nothing, and then say so in `notes`.

## 2. Edit `data/fuel-catalog.json`

Each row:

```json
{
  "item_key": "gu-energy-gel",
  "brand": "GU",
  "name": "Energy Gel",
  "product_type": "gel",
  "serving_size": "1 packet (32 g)",
  "carbs_g": 22,
  "caffeine_mg": 0,
  "sodium_mg": 60,
  "calories": 100,
  "flavors": ["Salted Caramel", "Vanilla Bean"],
  "price_usd": 1.67,
  "product_url": "https://guenergy.com/products/energy-gel",
  "image_source": "https://cdn.shopify.com/...png",
  "notes": null,
  "release_note": null,
  "nutrition_source": "brand page nutrition table"
}
```

Rules:

- `item_key`: lowercase words joined by hyphens, brand first. Never rename an
  existing key (it is a live page address). New products get new keys.
- `name` without the brand. Caffeinated versions are their own row:
  "Energy Gel (Caffeinated)". One row per product line and caffeine level;
  flavors go in `flavors`.
- `product_type`: `gel`, `chew`, `drink`, `bar` or `electrolyte` (under 10g
  carbs a serving is always `electrolyte`).
- Numbers per one serving as the brand defines it. Flagship flavor when they
  vary; say the range in `notes` (one short sentence) if it matters.
- `price_usd`: one serving at the brand's US list price (box price / count),
  or null.
- `image_source`: the brand's own photo of one packet/sleeve/bar (the page's
  og:image or the first Shopify product image), or null to let the site find
  the page's og:image itself. Change it only when the packaging changed.
- `release_note`: "New in 2026" style, only when the brand calls it new.
- Discontinued: delete the row. The page redirects on its own.
- Keep the file sorted by `item_key`, 2-space indent, UTF-8, trailing newline.

Do not change more than 40 additions, 12 removals or 25 nutrition edits in one
run; if there is more, do the most important part and list the rest in the PR
for next month.

## 3. Check

```
git show origin/main:data/fuel-catalog.json > /tmp/fuel-base.json
node scripts/catalog/check-fuel.mjs --base /tmp/fuel-base.json
```

It must print `check-fuel: OK`. Fix every problem it lists and run it again.
Read its warnings and fix any that are real.

## 4. PR and merge

If nothing changed, stop and report "Fuel catalog current, no changes".

Otherwise commit on a branch named `fuel-audit-YYYY-MM-DD`, push it, and open a
PR with `mcp__github__create_pull_request` (base `main`). Title:
"Fuel catalog audit, <Month YYYY>". Body: one line per change in plain English
("Added Maurten Gel 100 CAF 100 Raspberry flavor", "Removed Clif Shot 100mg
caffeine: discontinued", "SiS Beta Fuel sodium 50 -> 20 mg per label"), with the
brand page link for each, then the check-fuel output.

Then merge it with `mcp__github__merge_pull_request` (merge_method `squash`).
Merging is the publish: the daily cron syncs it within 24 hours and stores the
photos of new products. If the merge fails because main moved, update the
branch from main, rerun the check, and merge again.

Report: what changed, what you could not verify, and the PR link.
