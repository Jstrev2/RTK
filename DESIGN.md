# Runner Toolkit design: Race Day

Jon, November 23, 2026: the old look (cream grid paper, rounded yellow boxes,
Space Grotesk) was "a carbon copy of every other site". The new look borrows
from race day itself: bibs, split clocks, hi-vis kit, asphalt. Fun, loud,
specific to running. Build every page from the pieces below; don't invent a
second style.

## Principles

1. **Show, don't tell.** A photo, a number or a control beats a paragraph.
   No page opens with more than two sentences. Long explanations go in a
   collapsed "How this works" (`<details class="fineprint">`).
2. **Every list is searchable or filterable.** If a page lists more than 12
   things, it has a search box or filter chips at the top.
3. **Images everywhere a product appears.** Shoe, gel and song cards always
   show their picture (`.bib-photo`); fall back to the brand-colored
   placeholder only when the image is missing.
4. **Numbers read like a race clock.** Prices, BPM, carbs, weights and times
   use `.split` (monospace digits).
5. **Voice:** short, plain, a little cheeky. Never an em dash.

## Tokens (app/design.css)

| Token | Value | Use |
|---|---|---|
| `--asphalt` | #121212 | page ink, dark sections |
| `--asphalt-2` | #1E1E1E | dark cards |
| `--chalk` | #F7F5F0 | page background |
| `--paper` | #FFFFFF | bibs, cards |
| `--volt` | #D4FF2A | highlights, active states, numbers on dark |
| `--flare` | #FF4D1A | primary buttons, badges |
| `--lane` | #2D5BFF | links, focus rings |
| `--muted` | #6B6B6B | secondary text |
| `--line` | rgba(18,18,18,.12) | borders |

Type: `--font-display` Archivo (variable, use `font-stretch: 125%` and
weight 800-900 for headlines), `--font-body` Archivo at 100% width,
`--font-mono` JetBrains Mono for numbers.

## Pieces (class names)

- `.page-hero` with `.page-hero-photo` (duotone photo behind, optional),
  `h1`, one-line `.page-hero-sub`, and the page's main control.
- `.search-bar`: big rounded input with icon; `.chips` / `.chip` (`.is-on`)
  for filters; `.toolbar` row for search + sort + view toggle.
- `.bib`: product card. Children: `.bib-pins` (four pin holes, decorative),
  `.bib-number` (rank, e.g. 07), `.bib-photo` (image area, 4:3, contain),
  `.bib-title`, `.bib-meta` (brand / type), `.bib-stats` (row of `.split`),
  `.bib-tear` (dashed perforation strip at the bottom: price + action).
  `.bib-grid` lays them out (auto-fill, min 240px).
- `.split`: monospace stat pill, e.g. `<span class="split"><b>9.8</b> oz</span>`.
  `.split.on-dark` for volt-on-asphalt.
- `.btn` (pill), `.btn-flare` (primary), `.btn-ghost`, `.btn-volt` (on dark).
- `.panel`: plain white rounded section card. `.panel-dark` asphalt version.
- `.photo-duo`: wrapper that renders any photo in asphalt/volt duotone.
- `.ticker`: scrolling strip of live items ("Just added: ...").
- `.wall`: the account wall overlay used after N free results
  (`components/account-gate.tsx` `SignupCard` inside it).
- `.fineprint`: collapsed details for method notes.
- `.empty`: empty state.

## Photos

Running photography lives in `public/photos/` (Wikimedia Commons, licenses
that allow commercial use, credited on /credits). Shoe and gel images live in
Supabase Storage, bucket `site-images` (`shoes/<item_key>.webp`,
`fuel/<item_key>.webp`), and their source page is stored with the row.
