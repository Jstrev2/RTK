# Runner Toolkit Design Direction

## Goal
Runner Toolkit should feel like a **race-prep command center for serious everyday runners** — practical, sharp, energetic, and premium without looking like a luxury fashion brand or a generic SaaS dashboard.

## Brand adjectives
- Focused
- Kinetic
- Clear-headed
- Performance-minded
- Real-world
- Confident

## What it should NOT feel like
- generic startup template
- soft wellness brand
- over-designed sportswear ad
- bro-science / hypebeast running culture
- childish fitness app

## Visual direction

### 1. Running performance, not corporate SaaS
Use stronger contrast, tighter hierarchy, and directional visual cues that suggest motion, splits, pace, and race strategy.

### 2. Utility with emotion
The product is still tool-first, but the UI should carry a sense of anticipation and race-day momentum.

### 3. Distinct surface types
We should not use the same card style everywhere.

Surface types:
- **Hero / primary**: premium gradient + glow + darker contrast
- **Utility cards**: clean, crisp, functional
- **Editorial cards**: slightly more minimal, more typography-led
- **Dashboard cards**: denser, more status-oriented, more "command center"

## Palette direction
Keep the current blue/orange DNA, but use it with more intent.

- Primary electric blue = action / pace / utility
- Warm orange = race-day energy / urgency / momentum
- Deep navy / slate = grounding / premium contrast
- Soft fog / off-white backgrounds = breathing room

## Signature motifs
Introduce recurring cues inspired by running:
- split markers
- lane lines
- rhythm bars
- subtle gradient streaks
- grid overlays with directional feel

Do NOT overdo them. One strong motif repeated with discipline beats five random ones.

## Typography direction
- Headlines should feel stronger and more compressed/confident.
- Supporting text should stay readable but lighter in emphasis.
- Dashboard labels should read like useful race data, not generic form labels.

## Component guidance

### Buttons
- Primary CTA should feel decisive and premium.
- Secondary buttons should still feel athletic, not washed out.

### Cards
- Increase hierarchy differences.
- Hero cards can be darker / glow-backed.
- Dashboard cards should feel more like modules in a race HQ.

### Dashboard
The account area should feel like:
- race target
- date
- countdown
- key actions
- saved strategy

Not a user profile page. A race-prep page.

## Priority styling changes
1. Strengthen hero visual identity
2. Differentiate homepage sections more clearly
3. Make 3-step race-prep section branded and kinetic
4. Make dashboard feel like race HQ
5. Improve CTA polish and empty states

## Success criteria
When someone lands on the site, they should feel:
- this is for runners with a goal
- this is practical and sharp
- this is more premium than a random free tool site
- I want to use this before my next race

## v2 — Night Race (2026-07-17)

The system moved to a full dark "night race" execution of the same DNA:

- **Base**: deep navy-black (#070d17) with fixed atmospheric glows — blue top-left, orange top-right, sea-glass at the base. The site feels like a command center at dawn before a race.
- **Surfaces**: glass cards (translucent navy + blur + 1px light border + inner top highlight), solid dashboard cards, gradient-border accent/premium cards (blue→orange ring via padding-box/border-box composite).
- **Action color**: bright blue→orange gradient with near-black text for primary buttons and the nav CTA — high contrast, unmistakably clickable.
- **Type**: same Space Grotesk / IBM Plex pair; tighter tracking, clamp scales, `text-wrap: balance`, tabular numerals on all stats/KPIs/tables, gradient-text highlight (`.text-grad`) reserved for the headline payoff ("back to the start line").
- **Motifs kept**: lane-line hairlines (hero top, race-journey), orange momentum line on hero cards, split-marker KPI tiles.
- **States**: visible focus rings, hover lift + border brighten on interactive cards only, reduced-motion respected, dark-native form controls (`color-scheme: dark`).

Same class API as v1 — every page inherits the theme with no markup changes.
