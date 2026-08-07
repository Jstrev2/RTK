# Market Position Deep Dive

Date: August 7, 2026
Method: 11-agent research workflow — 7 independent web sweeps (paid training apps,
injury niche, runner pain points, shoe-content economics, music angle, indie
playbooks, AI threat), one synthesis, three adversarial judges (demand,
competition/distribution, execution). ~245 live web lookups. All three judges
returned "amend" — not "agree," not "reject."

Question answered: does the current angle (free shoes/music/fuel tools → affiliate
revenue, plus $9/mo Adaptive Training anchored on injury) work, or do we adjust
drastically?

---

## TL;DR verdict

**Right product core, wrong business shape.** The injury wedge is real and
verified unserved — but the value ladder built around it (affiliate SEO, music,
a $9/mo subscription) mostly does not survive contact with the 2026 market, and
the honest revenue ceiling is hobby-scale unless distribution materializes.
This is an adjustment, not a burn-it-down pivot: keep the engine, change the
SKU, the claim, the channel, and the expectations — and run a cheap demand
test before building anything else.

---

## 1. The one thing we have that nobody else does (verified 3×)

**No product on the market rewrites the remaining weeks of an in-flight race
plan around a specific injury.** Three independent sweeps confirmed the gap:

- **Runna** (Strava-owned since Apr 2025, ~2M monthly users, $19.99/mo /
  $119.99/yr): its "Not Feeling 100%" tool caps at 3–14-day dial-backs; its
  post-injury plan is a separate generic walk-run plan, not mid-plan surgery.
  The top community review of the injury feature (406 upvotes): it "doesn't
  actually really help you unless you already know how much to reduce load by."
- **Injury apps** (Exakt Health, Recover Athletics ~€60/yr, Molab, Kaizen): rehab
  and load tools only — a 2026 roundup confirms none touch an existing race plan.
  Recover Athletics has been effectively frozen since Strava bought it.
- **AI coaches** (Humango ~$29/mo, Athletica $19.90/mo, TrainAsONE, free Pheidi):
  adapt schedule/load around missed sessions and fatigue — not injury profiles,
  not return-to-run progressions.
- Human injury adaptation exists only at ~$39/mo (Runcoach human coaches) or via
  your own physio.

And disruption is the majority case: 48% of NYC Marathon runners report
training-impeding injury; ~90% of Utrecht marathoners reported injury or illness
in a 16-week block (the5krunner.com, Feb 2026).

**Demand-judge correction (important):** the *serviceable* slice — multi-week
diagnosed injury, mid-plan, race still wanted, not already inside Runna/Garmin's
free tooling — is a minority of a minority. Observable surface demand for the
exact question ("X weeks off, race in Y weeks — still doable?") is **dozens of
Reddit posts per month**, not thousands of searches. The wedge is real but
narrow. Size expectations accordingly.

## 2. What the research killed

| Current-plan assumption | What the evidence says |
| --- | --- |
| Free tools → affiliate SEO revenue | Channel is structurally closed for a new zero-authority site: AI Overviews on ~48% of queries; 55 of 100 tracked niche blogs lost 80%+ of organic; RunRepeat itself is shrinking; RunDida (a direct small shoe-quiz analog) has zero traction. Amazon pays ~$5.60 per shoe. Running Warehouse's AvantLink program status is disputed — verify before depending on it. |
| Music as a flagship free product | **Spotify relaunched Running Mode on July 30, 2026.** jog.fm/PaceDJ/RockMyRun are dead or zombie-scale. The BPM library is finished inventory now: keep it live, zero new engineering. |
| $9/mo Adaptive Training subscription | Loses head-to-head: Runna has physio chat in-app, a FREE post-injury tier, plan realignment, and Strava's distribution. Garmin Coach and Pheidi give away generic adaptation. Missed-weeks/travel adaptation cannot anchor a paywall. Injury demand is *episodic* (6–12 weeks then cancel) — a subscription captures ~$18–27/episode and invites the fatal Runna comparison. |
| TrainingPeaks marketplace as borrowed distribution | **Garmin acquired TrainingPeaks July 22, 2026.** Seller economics: ~$21.99/mo coach account + 30% commission + $99 activation, plans must be rebuilt in their workout builder, and the shelf is owned by named coaches (80/20 lists 954 plans; Higdon owns the brand). At most a 1–2 plan experiment, not a channel. |
| Injury SEO pages as channel #1 | These are YMYL health queries. Post-Sept-2025/March-2026 updates, anonymous solo domains publishing injury content are the worst-positioned profile in search, and Marathon Handbook already owns "injured before your marathon" queries. Publish 10–15 pages as a 180-day tail asset, judged at day 180 — gate nothing on them. |
| "Runna injury" backlash traffic converts to us | Those searchers are Runna subscribers with free in-app physio chat. The plan-agnostic wedge actually targets Higdon-PDF/Garmin/coach-spreadsheet runners — who skew casual and less monetizable. Keep comparison pages as opportunistic content only. |

## 3. The window

Runna is shipping adaptation features every 4–8 weeks (Not Feeling 100% + Return
to Running Feb 2026, Adapt for Heat July 29 2026, revamped post-race recovery Aug
2026) and has a WSJ-reported injury-controversy PR incentive to close exactly our
gap. **Realistic window: 6–12 months, not 12–24.** If Runna ships
injury-profile-specific mid-plan adaptation, our fallback framing is the
PT-companion / second-opinion layer ("the plan-math your physio approves"), not a
feature fight.

## 4. The adjusted strategy

**Positioning:** stop selling "Adaptive Training" (a category Runna owns and
Garmin gives away). Become **the injury rescue tool for any training plan**:
injured mid-block — on Higdon, Garmin, Runna, a coach's PDF, or ours — we give an
honest feasibility verdict and rebuild the remaining weeks around a conservative,
literature-based return-to-run progression. Lean into conservatism as the brand:
the adjuster that starts cautious, refuses red flags, works alongside your PT.
That is the exact counter-position to both the Runna backlash and sycophantic
ChatGPT.

**Wedge product:** a free **"Can I still make my race?"** calculator — injury +
weeks missed + weeks to race → coarse verdict band free; full verdict, rebuilt
weeks, progression, and one revision in the paid rescue. (Demand judge: keep the
*reassurance* in the paid tier, don't give it all away free.)

**Honest plan-agnosticism (1–2 weeks of work, not months):** v1 is a structured
6-field intake — race date, weeks remaining, runs/week, current mileage, peak
mileage, long-run day — mapped onto the parameters `generateSchedule` already
consumes. Market as "we rebuild your remaining weeks around your plan's shape,"
never "we rewrite your exact plan." No PDF/Garmin/Runna plan parsing for at
least 6 months — that is the data-pipeline failure mode that killed the project
in March.

**Fix the severity intake before launch:** derive mild/moderate/severe from
symptom-triage questions (night pain? pain at rest? limping? single-leg hop
pain? pinpoint bone tenderness?) instead of user self-grading. This is
simultaneously the fix for Runna's most-upvoted documented weakness and the
substance behind "a form that asks what a physio would ask."

**Monetization order:**
1. One-time **Injury Rescue, $19–39 per incident** (new Stripe SKU + entitlement
   window — current routes are subscription-shaped). The $90/yr becomes a
   "season pass" later, only if rescues sell.
2. **The Feed** affiliate now (8%, natural Fuel Planner fit). Verify Running
   Warehouse/AvantLink before depending on it. **Do NOT sign Amazon Associates
   yet** — the 3-sales-in-180-days closure rule burns the application at zero
   traffic.
3. Marketplace listing only as a capped experiment, only with a named
   credentialed partner.

**Trust:** a paid "reviewed by X, DPT" byline alone doesn't convert (every
working analog — E3 Rehab, Doctors of Running, Exakt — is credential + owned
audience together). Target a **rev-share distribution partnership** with a small
DPT creator; byline-only is the fallback, capped ~$1–2k. Until secured: a public
sources-and-methodology page citing the clinical literature behind each injury
profile's numbers, and copy says "conservative, literature-based," not
"physio-grade."

**Liability is a week-1 blocker, not a footnote:** LLC + reviewed
terms/disclaimers + insurance check BEFORE charging money for return-to-run
progressions.

**Channel reality:** Reddit is the only channel that can produce signal inside
90 days — and it must start as genuine concierge help (founder answers
injury-math threads with hand-built rebuilt weeks, zero links, week 1) in the
subs that allow it (r/Marathon_Training, r/firstmarathon, r/beginnerrunning —
NOT r/running, which bans both the question and self-promo; verify each sub's
rules via mods first). Launch post weeks 4–6. In-thread answers paste the
verdict + sample week inline so value lands even if links get stripped. SEO
pages and answer-engine optimization (crawlable methodology, structured data,
citable feasibility tables for ChatGPT/Perplexity) are tail assets.

## 5. The validation gate (before the build)

Weeks 1–4 are a **demand test, not a launch**: concierge Reddit answering +
a landing page with a real $29 checkout (or waitlist), measured. Pre-committed
day-90 continue/kill gates, judged on Reddit-sourced traffic:

- ≥1,000 calculator sessions
- ≥12% session→email capture
- ≥5 paid rescues

Above the line → proceed to DPT partnership, season pass, marketplace
experiment. Below it → the honest conclusion is that distribution cannot be
bootstrapped here; stop feature work cleanly instead of drifting into a second
abandonment.

## 6. Honest economics (name the prize)

Executed well, month-12 best case per the evidence: hundreds of engaged free
users, low tens of paying customers, low-hundreds of dollars per month. **The
numbers do not close as income.** This is a compounding side project whose
upside paths are (a) the DPT partnership maturing into a co-owned audience,
(b) the email list as an asset, (c) owning the injury-rescue slot if the window
holds. If the requirement is income, the right call per the demand judge is to
say so plainly and stop. Both outcomes are acceptable endings; writing that
down now is the insurance against the March 2026 failure mode.

## 7. What survives from the July turnaround plan

- "Run smarter. Guess less." and the decision-tool framing (as brand, not as
  revenue model)
- The injury engine (`lib/injuries.ts` red flags, stress-fracture clearance
  gate, `lib/plan-adjuster.ts`) — the real asset; needs the triage intake and
  6-field plan-shape intake on top
- Shoe finder — repurposed from acquisition to conversion/email-capture layer
  (Brooks pattern: quizzes convert on-site; they don't acquire)
- Fuel Planner — kept, pairs with The Feed affiliate
- Free plans — kept as email hooks and rescue-demo surfaces
- Email capture on every tool from day one (needs an actual ESP; current
  newsletter component is a bare Supabase insert — manual weekly send is fine
  at this scale)
- SEO infrastructure from the Aug 2026 overhaul (serves the tail-asset pages)

## Key sources

- Runna pricing/features/acquisition: press.strava.com; runna.com/training/post-injury-plan; support.runna.com (Not Feeling 100%, refunds)
- Runna injury controversy: the5krunner.com/2026/02/21/runna-ai-marathon-training-injury/ (WSJ-reported PT observations; 48%/90% injury stats)
- Injury-app roundup (none adapt race plans): molab.me/running-injury-apps/
- Spotify Running Mode relaunch: newsroom.spotify.com/2026-07-30/running-mode-playlist/
- Garmin acquires TrainingPeaks: the5krunner.com/2026/07/22/garmin-trainingpeaks-acquisition-price/
- TrainingPeaks seller terms: help.trainingpeaks.com (store, commission, builder)
- Amazon Associates 180-day rule: affiliate-program.amazon.com/help/node/topic/G7MJTPEP9NC3YKMG
- AI Overviews / YMYL / E-E-A-T dynamics: tygartmedia.com, thestacc.com (2025–2026 updates)
- Adaptive free competitors: pheidi.training/articles/runna-alternatives/
