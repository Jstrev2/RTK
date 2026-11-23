import { cache } from "react";
import type { MetadataRoute } from "next";
import { shoes as fallbackShoes } from "@/lib/data";
import type { Shoe } from "@/lib/data";
import { displayName, mapDbShoe, modelFamily, type DbShoe } from "@/lib/shoe-utils";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { SITE_URL } from "@/lib/seo";

/*
 * Shoe content pages generated from shoe_models: ranked collections
 * (/shoes/best/<slug>) and head-to-head comparisons
 * (/shoes/compare/<a>-vs-<b>). Everything here is computed from the live
 * catalog on each render, so pages change when the data does.
 */

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

export type ContentShoe = Shoe & {
  /** Brand + model line, so "Bondi 9" and "Bondi 10" group together. */
  family: string;
  updatedAt: string | null;
  /** release_date as a timestamp, 0 when unknown. */
  releasedAt: number;
};

const SHOE_COLUMNS =
  "id,item_key,name,brand,price,usage_types,foot_strike,cadence,toe_box,cushion,stability,surfaces,weight_range,stack,drop,weight_mens,weight_womens,description,pros,cons,popularity,release_date,release_year,image_url,product_url,retailer_url,is_active,updated_at";

const DAY = 24 * 60 * 60 * 1000;

const toContentShoe = (shoe: Shoe, updatedAt: string | null): ContentShoe => ({
  ...shoe,
  family: `${shoe.brand.toLowerCase()}|${modelFamily(shoe.name)}`,
  updatedAt,
  releasedAt: shoe.releaseDate ? Date.parse(shoe.releaseDate) || 0 : 0
});

/**
 * Every active, already released shoe. One query per request (React cache);
 * the pages themselves are ISR, so this runs about once a day per URL.
 */
export const loadContentShoes = cache(async (): Promise<ContentShoe[]> => {
  const today = new Date().toISOString().slice(0, 10);
  const released = (date?: string | null) => !date || date.slice(0, 10) <= today;

  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase
      .from("shoe_models")
      .select(SHOE_COLUMNS)
      .eq("is_active", true)
      .order("item_key");
    // Throw so ISR keeps serving the last good page instead of caching 404s.
    if (error) {
      throw new Error(`Failed to load shoes for content pages: ${error.message}`);
    }
    const rows = (data ?? []) as unknown as (DbShoe & { updated_at: string | null })[];
    return rows
      .filter((row) => released(row.release_date))
      .map((row) => toContentShoe(mapDbShoe(row), row.updated_at ?? null));
  }

  return fallbackShoes
    .filter((shoe) => released(shoe.releaseDate))
    .map((shoe) => toContentShoe(shoe, null));
});

// ---------------------------------------------------------------------------
// Formatting helpers (shared with the pages)
// ---------------------------------------------------------------------------

export const shoeName = (shoe: { name: string; brand: string }) => displayName(shoe);

export const money = (value: number) => `$${Math.round(value)}`;

export const oz = (value: number) => `${value.toFixed(1)} oz`;

export const mm = (value: number) => `${Math.round(value)} mm`;

const round1 = (value: number) => Math.round(value * 10) / 10;

export const median = (values: number[]) => {
  const sorted = values.filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
  if (!sorted.length) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const monthYear = (shoe: ContentShoe) => {
  if (!shoe.releasedAt) return shoe.releaseYear ? String(shoe.releaseYear) : "Not listed";
  const date = new Date(shoe.releasedAt);
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
};

export const cushionLabel = (value: string) =>
  ({ minimal: "Minimal", moderate: "Moderate", maximum: "Maximum" })[value] ?? value;

export const supportLabel = (value: string) =>
  ({
    neutral: "Neutral",
    mild: "Mild stability",
    moderate: "Moderate stability",
    motion_control: "Motion control"
  })[value] ?? value;

export const toeBoxLabel = (value: string) =>
  ({ narrow: "Narrow", standard: "Standard", wide: "Wide", extra_wide: "Extra wide" })[value] ?? value;

const USAGE_WORDS: Record<string, string> = {
  daily_trainer: "daily training",
  long_run: "long runs",
  speed_work: "speed work",
  race_day: "race day",
  recovery_runs: "recovery runs",
  trail_running: "trail running"
};

export const usageWords = (usage: string) => USAGE_WORDS[usage] ?? usage.replace(/_/g, " ");

export const joinWords = (items: string[]) => {
  if (items.length <= 1) return items.join("");
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
};

/** "Proven guidance system" -> "proven guidance system", but "PWRRUN foam" stays. */
export const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export const lowerFirst = (text: string) => {
  const clean = text.trim().replace(/[.\s]+$/, "");
  if (clean.length > 1 && /[A-Z]/.test(clean[0]) && /[a-z\s]/.test(clean[1])) {
    return clean[0].toLowerCase() + clean.slice(1);
  }
  return clean;
};

/** First sentence of a description, for list blurbs. */
export const firstSentence = (text: string) => {
  const match = text.trim().match(/^.*?[.!?](\s|$)/);
  return (match ? match[0] : text).trim();
};

const CUSHION_LEVEL: Record<string, number> = { minimal: 0, moderate: 1, maximum: 2 };
const SUPPORT_LEVEL: Record<string, number> = { neutral: 0, mild: 1, moderate: 2, motion_control: 3 };
const TOE_LEVEL: Record<string, number> = { narrow: 0, standard: 1, wide: 2, extra_wide: 3 };

export const cushionLevel = (shoe: Shoe) => CUSHION_LEVEL[shoe.cushion] ?? 1;
export const supportLevel = (shoe: Shoe) => SUPPORT_LEVEL[shoe.stability] ?? 0;
export const toeLevel = (shoe: Shoe) => TOE_LEVEL[shoe.toeBox] ?? 1;

// ---------------------------------------------------------------------------
// Collections: facets
// ---------------------------------------------------------------------------

type Group =
  | "brand"
  | "new"
  | "usage"
  | "support"
  | "cushion"
  | "fit"
  | "drop"
  | "weight"
  | "runner"
  | "strike"
  | "price";

/** Where a facet's words go in "Best [new] [brand] [adjectives] [noun] [for ...] [under $X]". */
type Slot = "new" | "brand" | "adj" | "noun" | "for" | "price";

type Ctx = { now: number };

type Facet = {
  id: string;
  group: Group;
  slot: Slot;
  /** Order among adjectives (lower first). */
  order?: number;
  slug: string;
  title: string;
  phrase: string;
  /** For two "for" facets: the clause the second one takes ("Who Overpronate"). */
  withTitle?: string;
  withPhrase?: string;
  /** Plain-English rule, shown when the label alone is ambiguous. */
  definition?: string;
  match: (shoe: ContentShoe, ctx: Ctx) => boolean;
  /** Ranking points (0 to 5) for how squarely a shoe fits, with the rule in words. */
  fit?: { points: (shoe: ContentShoe) => number; note: string };
  /** Hub section heading. */
  hub: string;
};

const NEW_WINDOW_DAYS = 365;
const LIGHT_OZ = 8;
const PRICE_CEILINGS = [100, 120, 150];

const clampPoints = (value: number) => Math.max(0, Math.min(5, Math.round(value)));

const USAGE_FACETS: Facet[] = [
  { usage: "daily_trainer", slug: "daily-trainers", title: "Daily Trainers", phrase: "daily trainers" },
  { usage: "race_day", slug: "race-day-shoes", title: "Race Day Shoes", phrase: "race day shoes" },
  { usage: "long_run", slug: "long-run-shoes", title: "Long Run Shoes", phrase: "long run shoes" },
  { usage: "recovery_runs", slug: "recovery-shoes", title: "Recovery Shoes", phrase: "recovery shoes" },
  { usage: "speed_work", slug: "speed-work-shoes", title: "Speed Work Shoes", phrase: "speed work shoes" }
].map(({ usage, slug, title, phrase }) => ({
  id: `usage:${usage}`,
  group: "usage" as const,
  slot: "noun" as const,
  slug,
  title,
  phrase,
  definition: `is listed for ${usageWords(usage)}`,
  match: (shoe: ContentShoe) => shoe.usageTypes.includes(usage),
  hub: "By the run"
}));

const STATIC_FACETS: Facet[] = [
  {
    id: "support:neutral",
    group: "support",
    slot: "adj",
    order: 60,
    slug: "neutral",
    title: "Neutral",
    phrase: "neutral",
    definition: "has no stability features",
    match: (s) => s.stability === "neutral",
    hub: "By support"
  },
  {
    id: "support:stability",
    group: "support",
    slot: "adj",
    order: 60,
    slug: "stability",
    title: "Stability",
    phrase: "stability",
    definition: "has mild, moderate or motion control support",
    match: (s) => s.stability !== "neutral",
    fit: {
      points: (s) => (supportLevel(s) >= 2 ? 3 : 0),
      note: "3 points for moderate support or more"
    },
    hub: "By support"
  },
  {
    id: "support:mild",
    group: "support",
    slot: "adj",
    order: 60,
    slug: "mild-stability",
    title: "Mild Stability",
    phrase: "mild stability",
    definition: "is rated mild stability",
    match: (s) => s.stability === "mild",
    hub: "By support"
  },
  {
    id: "support:overpronation",
    group: "support",
    slot: "for",
    slug: "for-overpronation",
    title: "for Overpronation",
    phrase: "for overpronation",
    withTitle: "Who Overpronate",
    withPhrase: "who overpronate",
    definition: "has moderate stability or motion control",
    match: (s) => s.stability === "moderate" || s.stability === "motion_control",
    fit: {
      points: (s) => (s.stability === "motion_control" ? 3 : 0),
      note: "3 points for motion control"
    },
    hub: "By support"
  },
  {
    id: "cushion:maximum",
    group: "cushion",
    slot: "adj",
    order: 50,
    slug: "max-cushion",
    title: "Max Cushion",
    phrase: "max cushion",
    definition: "is rated maximum cushion",
    match: (s) => s.cushion === "maximum",
    fit: {
      points: (s) => clampPoints(s.stack - 40),
      note: "1 point per mm of heel stack above 40 mm, up to 5"
    },
    hub: "By cushion and drop"
  },
  {
    id: "cushion:minimal",
    group: "cushion",
    slot: "adj",
    order: 50,
    slug: "minimal-cushion",
    title: "Minimal Cushion",
    phrase: "minimal cushion",
    definition: "is rated minimal cushion",
    match: (s) => s.cushion === "minimal",
    hub: "By cushion and drop"
  },
  {
    id: "fit:wide",
    group: "fit",
    slot: "adj",
    order: 10,
    slug: "wide-toe-box",
    title: "Wide Toe Box",
    phrase: "wide toe box",
    definition: "has a wide or extra wide toe box",
    match: (s) => s.toeBox === "wide" || s.toeBox === "extra_wide",
    fit: {
      points: (s) => (s.toeBox === "extra_wide" ? 3 : 0),
      note: "3 points for an extra wide toe box"
    },
    hub: "By fit"
  },
  {
    id: "fit:narrow",
    group: "fit",
    slot: "for",
    slug: "for-narrow-feet",
    title: "for Narrow Feet",
    phrase: "for narrow feet",
    withTitle: "With Narrow Feet",
    withPhrase: "with narrow feet",
    definition: "has a narrow toe box",
    match: (s) => s.toeBox === "narrow",
    hub: "By fit"
  },
  {
    id: "drop:zero",
    group: "drop",
    slot: "adj",
    order: 40,
    slug: "zero-drop",
    title: "Zero Drop",
    phrase: "zero drop",
    definition: "has 0 mm of drop",
    match: (s) => s.drop === 0,
    hub: "By cushion and drop"
  },
  {
    id: "drop:low",
    group: "drop",
    slot: "adj",
    order: 40,
    slug: "low-drop",
    title: "Low Drop",
    phrase: "low drop",
    definition: "has 4 mm of drop or less",
    match: (s) => s.drop <= 4,
    fit: {
      points: (s) => clampPoints(5 - s.drop),
      note: "5 points at 0 mm of drop, one fewer per mm"
    },
    hub: "By cushion and drop"
  },
  {
    id: "drop:high",
    group: "drop",
    slot: "adj",
    order: 40,
    slug: "high-drop",
    title: "High Drop",
    phrase: "high drop",
    definition: "has 10 mm of drop or more",
    match: (s) => s.drop >= 10,
    hub: "By cushion and drop"
  },
  {
    id: "weight:light",
    group: "weight",
    slot: "adj",
    order: 20,
    slug: "lightweight",
    title: "Lightweight",
    phrase: "lightweight",
    definition: `weighs ${LIGHT_OZ} oz or less in a men's size`,
    match: (s) => s.weightMens > 0 && s.weightMens <= LIGHT_OZ,
    fit: {
      points: (s) => clampPoints((LIGHT_OZ - s.weightMens) * 2),
      note: `2 points per ounce under ${LIGHT_OZ} oz, up to 5`
    },
    hub: "By fit"
  },
  {
    id: "runner:heavy",
    group: "runner",
    slot: "for",
    slug: "for-heavy-runners",
    title: "for Heavy Runners",
    phrase: "for heavy runners",
    definition: "is flagged in our data as built for heavier runners, roughly 185 lb and up",
    match: (s) => s.weightRange === "heavyweight",
    fit: {
      points: (s) => (s.cushion === "maximum" ? 3 : 0),
      note: "3 points for maximum cushion"
    },
    hub: "By fit"
  },
  {
    id: "strike:heel",
    group: "strike",
    slot: "for",
    slug: "for-heel-strikers",
    title: "for Heel Strikers",
    phrase: "for heel strikers",
    definition: "is listed as suiting heel strikers",
    match: (s) => s.footStrike.includes("heel"),
    fit: {
      points: (s) => (s.drop >= 8 ? 2 : 0),
      note: "2 points for 8 mm of drop or more"
    },
    hub: "By fit"
  },
  {
    id: "strike:forefoot",
    group: "strike",
    slot: "for",
    slug: "for-forefoot-strikers",
    title: "for Forefoot Strikers",
    phrase: "for forefoot strikers",
    definition: "is listed as suiting forefoot strikers",
    match: (s) => s.footStrike.includes("forefoot"),
    fit: {
      points: (s) => (s.drop <= 6 ? 2 : 0),
      note: "2 points for 6 mm of drop or less"
    },
    hub: "By fit"
  },
  {
    id: "new:recent",
    group: "new",
    slot: "new",
    slug: "new",
    title: "New",
    phrase: "new",
    definition: "came out in the last 12 months",
    match: (s, ctx) => s.releasedAt > 0 && ctx.now - s.releasedAt <= NEW_WINDOW_DAYS * DAY,
    hub: "New releases"
  },
  ...PRICE_CEILINGS.map(
    (ceiling): Facet => ({
      id: `price:${ceiling}`,
      group: "price",
      slot: "price",
      slug: `under-${ceiling}`,
      title: `Under $${ceiling}`,
      phrase: `under $${ceiling}`,
      definition: `lists at $${ceiling} or less`,
      match: (s) => s.price > 0 && s.price <= ceiling,
      fit: {
        points: (s) => clampPoints((ceiling - s.price) / 10),
        note: `1 point per $10 under $${ceiling}, up to 5`
      },
      hub: "By budget"
    })
  )
];

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const brandFacets = (shoes: ContentShoe[]): Facet[] => {
  const brands = [...new Set(shoes.map((s) => s.brand))].sort((a, b) => a.localeCompare(b));
  return brands.map((brand) => ({
    id: `brand:${brand}`,
    group: "brand",
    slot: "brand",
    slug: slugify(brand),
    title: brand,
    phrase: brand,
    match: (s: ContentShoe) => s.brand === brand,
    hub: "By brand"
  }));
};

/** Which facet groups may combine. Anything else would be a thin page. */
const PAIRS: [Group, Group][] = [
  ["brand", "usage"], ["brand", "support"], ["brand", "cushion"], ["brand", "fit"],
  ["brand", "price"], ["brand", "new"], ["brand", "weight"],
  ["usage", "support"], ["usage", "cushion"], ["usage", "fit"], ["usage", "drop"],
  ["usage", "weight"], ["usage", "runner"], ["usage", "strike"], ["usage", "price"], ["usage", "new"],
  ["support", "cushion"], ["support", "fit"], ["support", "runner"], ["support", "price"],
  ["support", "drop"], ["support", "weight"], ["support", "new"],
  ["cushion", "fit"], ["cushion", "runner"], ["cushion", "price"], ["cushion", "drop"],
  ["cushion", "weight"], ["cushion", "strike"], ["cushion", "new"],
  ["fit", "runner"], ["fit", "price"], ["fit", "drop"],
  ["drop", "price"], ["drop", "weight"], ["drop", "strike"], ["drop", "runner"],
  ["weight", "price"], ["weight", "strike"],
  ["runner", "price"], ["new", "price"]
];

/** Three-way combos that match real searches ("stability daily trainers under $150"). */
const TRIPLES: [Group, Group, Group][] = [
  ["usage", "support", "price"],
  ["usage", "cushion", "price"],
  ["usage", "fit", "price"],
  ["usage", "support", "runner"],
  ["brand", "usage", "support"]
];

const pairKey = (a: Group, b: Group) => [a, b].sort().join("+");
const ALLOWED_PAIRS = new Set(PAIRS.map(([a, b]) => pairKey(a, b)));
const ALLOWED_TRIPLES = new Set(TRIPLES.map((t) => [...t].sort().join("+")));

// ---------------------------------------------------------------------------
// Collections: naming
// ---------------------------------------------------------------------------

type Naming = { slug: string; title: string; phrase: string; noun: string };

const SLOT_ORDER: Record<Slot, number> = { new: 0, brand: 1, adj: 2, noun: 3, for: 4, price: 5 };

const nameFacets = (facets: Facet[]): Naming | null => {
  const sorted = [...facets].sort(
    (a, b) => SLOT_ORDER[a.slot] - SLOT_ORDER[b.slot] || (a.order ?? 0) - (b.order ?? 0)
  );
  const noun = sorted.find((f) => f.slot === "noun");
  const fors = sorted.filter((f) => f.slot === "for");

  // Two "for" facets only read well as "for Heavy Runners Who Overpronate".
  let forParts: { slug: string; title: string; phrase: string }[] = fors;
  if (fors.length > 1) {
    const lead = fors.find((f) => f.group === "runner");
    const second = fors.find((f) => f !== lead && f.withTitle);
    if (!lead || !second || fors.length > 2) return null;
    forParts = [
      lead,
      { slug: slugify(second.withPhrase!), title: second.withTitle!, phrase: second.withPhrase! }
    ];
  }

  // "New New Balance Running Shoes" reads like a typo.
  const brand = sorted.find((f) => f.slot === "brand");
  if (brand && sorted.some((f) => f.slot === "new") && /^new\b/i.test(brand.title)) return null;

  const before = sorted.filter((f) => f.slot === "new" || f.slot === "brand" || f.slot === "adj");
  const price = sorted.filter((f) => f.slot === "price");
  const nounSlug = noun ? noun.slug : "running-shoes";
  const nounTitle = noun ? noun.title : "Running Shoes";
  const nounPhrase = noun ? noun.phrase : "running shoes";

  const slug = [...before.map((f) => f.slug), nounSlug, ...forParts.map((f) => f.slug), ...price.map((f) => f.slug)].join("-");
  const title = [...before.map((f) => f.title), nounTitle, ...forParts.map((f) => f.title), ...price.map((f) => f.title)].join(" ");
  const phrase = [...before.map((f) => f.phrase), nounPhrase, ...forParts.map((f) => f.phrase), ...price.map((f) => f.phrase)].join(" ");
  return { slug, title, phrase, noun: nounPhrase };
};

// ---------------------------------------------------------------------------
// Collections: ranking and building
// ---------------------------------------------------------------------------

export const MIN_COLLECTION_SIZE = 4;

export type RankedShoe = {
  shoe: ContentShoe;
  rank: number;
  score: number;
  popularity: number;
  recency: number;
  fit: number;
};

export type Collection = {
  slug: string;
  title: string;
  /** Lowercase noun phrase for prose: "stability daily trainers under $150". */
  phrase: string;
  noun: string;
  facetIds: string[];
  groups: Group[];
  hub: string;
  definitions: string[];
  fitNotes: string[];
  ranked: RankedShoe[];
  /** Older versions of listed models that also matched but are left off. */
  olderVersions: number;
  lastModified: string | null;
};

const recencyPoints = (shoe: ContentShoe, now: number) => {
  if (!shoe.releasedAt) return 0;
  const age = now - shoe.releasedAt;
  if (age <= 365 * DAY) return 5;
  if (age <= 730 * DAY) return 2;
  return 0;
};

/** Newest version of each model line among the matches. */
const newestPerFamily = (shoes: ContentShoe[]) => {
  const best = new Map<string, ContentShoe>();
  for (const shoe of shoes) {
    const current = best.get(shoe.family);
    if (
      !current ||
      shoe.releasedAt > current.releasedAt ||
      (shoe.releasedAt === current.releasedAt && shoe.popularity > current.popularity)
    ) {
      best.set(shoe.family, shoe);
    }
  }
  return [...best.values()];
};

const rankShoes = (shoes: ContentShoe[], facets: Facet[], now: number): RankedShoe[] =>
  shoes
    .map((shoe) => {
      const recency = recencyPoints(shoe, now);
      const fit = facets.reduce((sum, f) => sum + (f.fit ? f.fit.points(shoe) : 0), 0);
      return { shoe, rank: 0, score: shoe.popularity + recency + fit, popularity: shoe.popularity, recency, fit };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.popularity - a.popularity ||
        b.shoe.releasedAt - a.shoe.releasedAt ||
        a.shoe.id.localeCompare(b.shoe.id)
    )
    .map((row, index) => ({ ...row, rank: index + 1 }));

const latest = (values: (string | null)[]) =>
  values.reduce<string | null>((max, v) => (v && (!max || v > max) ? v : max), null);

/** Hub section for a collection: the run type first, then brand, then its lead facet. */
const hubFor = (facets: Facet[]) => {
  const usage = facets.find((f) => f.group === "usage");
  if (usage) return usage.title;
  const brand = facets.find((f) => f.group === "brand");
  if (brand) return "By brand";
  return facets[0].hub;
};

const GROUP_RANK: Group[] = ["usage", "brand", "support", "cushion", "fit", "runner", "drop", "weight", "strike", "new", "price"];

export type CollectionIndex = {
  list: Collection[];
  bySlug: Map<string, Collection>;
  /** facet-id signature -> slug, for finding related collections. */
  bySignature: Map<string, string>;
  facets: Facet[];
};

const signature = (ids: string[]) => [...ids].sort().join("|");

/** Every non-empty proper subset (combos have at most three facets). */
const properSubsets = (ids: string[]) => {
  const out: string[][] = [];
  for (let mask = 1; mask < (1 << ids.length) - 1; mask++) {
    out.push(ids.filter((_, i) => mask & (1 << i)));
  }
  return out;
};

const buildCollections = (shoes: ContentShoe[], now: number): CollectionIndex => {
  const ctx: Ctx = { now };
  const facets = [...USAGE_FACETS, ...STATIC_FACETS, ...brandFacets(shoes)];

  const matchSets = new Map<string, Set<string>>();
  for (const facet of facets) {
    matchSets.set(facet.id, new Set(shoes.filter((s) => facet.match(s, ctx)).map((s) => s.id)));
  }

  // Candidate facet combinations: singles, whitelisted pairs and triples.
  const candidates: Facet[][] = facets.map((f) => [f]);
  for (let i = 0; i < facets.length; i++) {
    for (let j = i + 1; j < facets.length; j++) {
      const a = facets[i];
      const b = facets[j];
      if (a.group === b.group || !ALLOWED_PAIRS.has(pairKey(a.group, b.group))) continue;
      candidates.push([a, b]);
      for (let k = j + 1; k < facets.length; k++) {
        const c = facets[k];
        if (c.group === a.group || c.group === b.group) continue;
        if (!ALLOWED_TRIPLES.has([a.group, b.group, c.group].sort().join("+"))) continue;
        candidates.push([a, b, c]);
      }
    }
  }

  // Simplest pages claim a shoe list first; a combo that only repeats its
  // parent's list (or nearly so) is dropped as duplicate content.
  candidates.sort(
    (a, b) =>
      a.length - b.length ||
      GROUP_RANK.indexOf(a[0].group) - GROUP_RANK.indexOf(b[0].group)
  );

  const list: Collection[] = [];
  const bySlug = new Map<string, Collection>();
  const bySignature = new Map<string, string>();
  const seenLists = new Set<string>();

  for (const combo of candidates) {
    const naming = nameFacets(combo);
    if (!naming || bySlug.has(naming.slug)) continue;

    const sets = combo.map((f) => matchSets.get(f.id)!);
    const matched = shoes.filter((s) => sets.every((set) => set.has(s.id)));
    const newest = newestPerFamily(matched);
    if (newest.length < MIN_COLLECTION_SIZE) continue;

    const listKey = newest.map((s) => s.id).sort().join(",");
    if (seenLists.has(listKey)) continue;

    if (combo.length > 1) {
      // Must cut at least 10% (and two models) from every list it narrows.
      let tooClose = false;
      for (const parentIds of properSubsets(combo.map((f) => f.id))) {
        const parentSlug = bySignature.get(signature(parentIds));
        const parent = parentSlug ? bySlug.get(parentSlug) : undefined;
        const cut = parent ? parent.ranked.length - newest.length : 0;
        if (parent && cut < Math.max(2, Math.ceil(parent.ranked.length * 0.1))) {
          tooClose = true;
          break;
        }
      }
      if (tooClose) continue;
    }

    const ranked = rankShoes(newest, combo, now);
    const collection: Collection = {
      slug: naming.slug,
      title: naming.title,
      phrase: naming.phrase,
      noun: naming.noun,
      facetIds: combo.map((f) => f.id),
      groups: combo.map((f) => f.group),
      hub: hubFor(combo),
      definitions: combo.map((f) => f.definition).filter((d): d is string => Boolean(d)),
      fitNotes: combo.map((f) => f.fit?.note).filter((n): n is string => Boolean(n)),
      ranked,
      olderVersions: matched.length - newest.length,
      lastModified: latest(newest.map((s) => s.updatedAt))
    };
    seenLists.add(listKey);
    list.push(collection);
    bySlug.set(collection.slug, collection);
    bySignature.set(signature(collection.facetIds), collection.slug);
  }

  return { list, bySlug, bySignature, facets };
};

export const getCollectionIndex = cache(async (): Promise<CollectionIndex> => {
  const shoes = await loadContentShoes();
  return buildCollections(shoes, Date.now());
});

export const getCollection = async (slug: string) =>
  (await getCollectionIndex()).bySlug.get(slug);

/** Parents (one criterion fewer), swaps (same group, other value) and children. */
export const relatedCollections = (index: CollectionIndex, collection: Collection, limit = 12) => {
  const out: Collection[] = [];
  const seen = new Set<string>([collection.slug]);
  const push = (slug?: string) => {
    if (!slug || seen.has(slug)) return;
    const found = index.bySlug.get(slug);
    if (!found) return;
    seen.add(slug);
    out.push(found);
  };
  const ids = collection.facetIds;

  if (ids.length > 1) {
    for (let drop = 0; drop < ids.length; drop++) {
      push(index.bySignature.get(signature(ids.filter((_, i) => i !== drop))));
    }
  }

  const facetById = new Map(index.facets.map((f) => [f.id, f]));
  for (let i = 0; i < ids.length; i++) {
    const facet = facetById.get(ids[i]);
    if (!facet) continue;
    for (const other of index.facets) {
      if (other.group !== facet.group || other.id === facet.id || other.group === "brand") continue;
      const swapped = [...ids];
      swapped[i] = other.id;
      push(index.bySignature.get(signature(swapped)));
    }
  }

  const children = index.list
    .filter(
      (c) =>
        !seen.has(c.slug) &&
        c.facetIds.length === ids.length + 1 &&
        ids.every((id) => c.facetIds.includes(id))
    )
    .sort((a, b) => b.ranked.length - a.ranked.length);
  for (const child of children) {
    if (out.length >= limit) break;
    push(child.slug);
  }

  // Brand swaps last, most models first, so a brand page links to its peers.
  const brandId = ids.find((id) => id.startsWith("brand:"));
  if (brandId && out.length < limit) {
    const peers = index.list
      .filter(
        (c) =>
          !seen.has(c.slug) &&
          c.facetIds.length === ids.length &&
          c.facetIds.some((id) => id.startsWith("brand:")) &&
          ids.filter((id) => id !== brandId).every((id) => c.facetIds.includes(id))
      )
      .sort((a, b) => b.ranked.length - a.ranked.length);
    for (const peer of peers) {
      if (out.length >= limit) break;
      push(peer.slug);
    }
  }

  return out.slice(0, limit);
};

// ---------------------------------------------------------------------------
// Collections: copy written from the data
// ---------------------------------------------------------------------------

export const SHOWN_IN_LIST = 12;

export type FaqItem = { q: string; a: string };

const s = (count: number, word: string, plural = `${word}s`) => `${count} ${count === 1 ? word : plural}`;

const by = <T,>(items: T[], value: (item: T) => number, dir: 1 | -1 = 1) =>
  [...items].sort((a, b) => dir * (value(a) - value(b)))[0];

export type CollectionStats = {
  count: number;
  minPrice: number;
  maxPrice: number;
  medianPrice: number;
  medianWeight: number;
  medianDrop: number;
  medianStack: number;
  cheapest: RankedShoe;
  priciest: RankedShoe;
  lightest: RankedShoe;
  heaviest: RankedShoe;
  tallest: RankedShoe;
  lowestDrop: RankedShoe;
};

export const collectionStats = (collection: Collection): CollectionStats => {
  const rows = collection.ranked;
  const weighed = rows.filter((r) => r.shoe.weightMens > 0);
  const priced = rows.filter((r) => r.shoe.price > 0);
  const tieRank = (a: RankedShoe, b: RankedShoe) => a.rank - b.rank;
  const pick = (list: RankedShoe[], value: (r: RankedShoe) => number, dir: 1 | -1) =>
    [...list].sort((a, b) => dir * (value(a) - value(b)) || tieRank(a, b))[0] ?? rows[0];
  return {
    count: rows.length,
    minPrice: Math.min(...priced.map((r) => r.shoe.price)),
    maxPrice: Math.max(...priced.map((r) => r.shoe.price)),
    medianPrice: median(priced.map((r) => r.shoe.price)),
    medianWeight: round1(median(weighed.map((r) => r.shoe.weightMens))),
    medianDrop: median(rows.map((r) => r.shoe.drop)),
    medianStack: median(rows.map((r) => r.shoe.stack)),
    cheapest: pick(priced, (r) => r.shoe.price, 1),
    priciest: pick(priced, (r) => r.shoe.price, -1),
    lightest: pick(weighed, (r) => r.shoe.weightMens, 1),
    heaviest: pick(weighed, (r) => r.shoe.weightMens, -1),
    tallest: pick(rows, (r) => r.shoe.stack, -1),
    lowestDrop: pick(rows, (r) => r.shoe.drop, 1)
  };
};

const the = (row: RankedShoe | ContentShoe) => `the ${shoeName("shoe" in row ? row.shoe : row)}`;
const The = (row: RankedShoe | ContentShoe) => `The ${shoeName("shoe" in row ? row.shoe : row)}`;

/** The intro: what's in the set, the top pick with its numbers, and who should skip it. */
export const collectionIntro = (collection: Collection): string[] => {
  const st = collectionStats(collection);
  const [top, second] = collection.ranked;
  const t = top.shoe;
  const paragraphs: string[] = [];

  const priceSpan =
    st.minPrice === st.maxPrice
      ? `all list at ${money(st.minPrice)}`
      : `run ${money(st.minPrice)} to ${money(st.maxPrice)}`;
  let set = `We track ${s(st.count, "model")} that count as ${collection.phrase}. They ${priceSpan}. Median weight is ${oz(st.medianWeight)} in a men's size, median drop ${mm(st.medianDrop)}.`;
  if (collection.definitions.length) {
    set += ` To make the list, a shoe ${joinWords(collection.definitions)}.`;
  }
  if (collection.olderVersions > 0) {
    set += ` Where an older version also qualifies we list only the newest, which leaves off ${s(collection.olderVersions, "older version")}.`;
  }
  paragraphs.push(set);

  const mostPopular = by(collection.ranked, (r) => r.popularity, -1);
  let lead = `${The(top)} ranks first: ${money(t.price)}, ${oz(t.weightMens)}, a ${mm(t.stack)} heel stack and ${mm(t.drop)} of drop.`;
  if (mostPopular.shoe.id === t.id) {
    const shared = collection.ranked.filter((r) => r.popularity === t.popularity).length > 1;
    lead += shared
      ? ` It shares the list's top popularity score (${t.popularity} out of 100)`
      : ` It's the most popular shoe on the list (${t.popularity} out of 100)`;
    if (!second) lead += ".";
    else if (top.score === second.score) lead += `, and ${the(second)} ties it on points, so the tiebreak decides.`;
    else lead += `, and ${the(second)} sits ${round1(top.score - second.score)} points behind.`;
  } else {
    const edge = top.recency > mostPopular.recency ? "is newer" : "fits the criteria more squarely";
    lead += ` ${The(mostPopular)} is more popular (${mostPopular.popularity} to ${t.popularity}), but ${the(top)} ${edge}.`;
  }
  if (t.pros.length) lead += ` Its best trait: ${lowerFirst(t.pros[0])}.`;
  paragraphs.push(lead);

  const skip: string[] = [];
  if (t.cons.length) skip.push(`The catch: ${lowerFirst(t.cons[0])}.`);
  if (st.cheapest.shoe.id !== t.id && t.price - st.cheapest.shoe.price >= 15) {
    skip.push(
      `If ${money(t.price)} is more than you want to spend, ${the(st.cheapest)} costs ${money(st.cheapest.shoe.price)} and ranks #${st.cheapest.rank} here.`
    );
  }
  if (st.lightest.shoe.id !== t.id && t.weightMens - st.lightest.shoe.weightMens >= 0.5) {
    skip.push(
      `Runners who want less shoe on their feet should look at ${the(st.lightest)}, ${oz(t.weightMens - st.lightest.shoe.weightMens)} lighter at ${oz(st.lightest.shoe.weightMens)}.`
    );
  }
  if (!collection.groups.includes("support")) {
    if (t.stability === "neutral") {
      const support = collection.ranked.find((r) => supportLevel(r.shoe) >= 2);
      if (support) {
        skip.push(`If you overpronate, ${the(support)} (#${support.rank}) is the best-ranked shoe here with real support.`);
      }
    } else {
      const neutral = collection.ranked.find((r) => r.shoe.stability === "neutral");
      if (neutral) {
        skip.push(`It's a ${supportLabel(t.stability).toLowerCase()} shoe, so neutral runners may be happier in ${the(neutral)} (#${neutral.rank}).`);
      }
    }
  }
  if (!collection.groups.includes("drop") && t.drop >= 8) {
    const flat = collection.ranked.find((r) => r.shoe.drop <= 4);
    if (flat) skip.push(`If you're used to low-drop shoes, ${the(flat)} sits at ${mm(flat.shoe.drop)}.`);
  }
  if (skip.length) paragraphs.push(skip.slice(0, 3).join(" "));

  return paragraphs;
};

export const rankingRule = (collection: Collection) => {
  let rule =
    "How we rank: each shoe starts with our 0 to 100 popularity score, gets 5 points if it came out in the last 12 months (2 if in the last 24)";
  rule += collection.fitNotes.length
    ? `, plus fit points for these criteria: ${collection.fitNotes.join("; ")}.`
    : ".";
  rule += " Ties go to the more popular shoe. We don't take payment for placement.";
  return rule;
};

export const listHeading = (collection: Collection) => {
  const [top, second] = collection.ranked;
  if (!second) return `${The(top)} leads`;
  const gap = round1(top.score - second.score);
  if (gap < 2) return `${The(top)} edges ${the(second)} for the top spot`;
  return `${The(top)} leads, ${gap} points clear of ${the(second)}`;
};

export const tableHeading = (collection: Collection) => {
  const st = collectionStats(collection);
  if (st.lightest.shoe.id === st.cheapest.shoe.id) {
    return `${The(st.lightest)} is both the lightest and the cheapest here`;
  }
  return `${The(st.lightest)} is the lightest; ${the(st.cheapest)} costs the least`;
};

export const collectionFaq = (collection: Collection): FaqItem[] => {
  const st = collectionStats(collection);
  const [top, second] = collection.ranked;
  const faq: FaqItem[] = [];
  const phrase = collection.phrase;

  faq.push({
    q: `What are the best ${phrase}?`,
    a: `${The(top)} ranks first of the ${st.count} we track, at ${money(top.shoe.price)} and ${oz(top.shoe.weightMens)}.${
      second
        ? ` ${The(second)} is second${
            second.shoe.price < top.shoe.price
              ? ` and costs ${money(top.shoe.price - second.shoe.price)} less`
              : second.shoe.price > top.shoe.price
              ? ` and costs ${money(second.shoe.price - top.shoe.price)} more`
              : ` at the same price`
          }.`
        : ""
    } The ranking leans on popularity and recency, so check the specs against how you run.`
  });

  if (st.minPrice !== st.maxPrice) {
    faq.push({
      q: `How much do ${phrase} cost?`,
      a: `List prices run ${money(st.minPrice)} to ${money(st.maxPrice)}, with a median of ${money(st.medianPrice)}. The cheapest is ${the(st.cheapest)}${
        st.cheapest.shoe.id === top.shoe.id ? ", which is also our top pick" : `, ranked #${st.cheapest.rank}`
      }. The most expensive is ${the(st.priciest)} at ${money(st.priciest.shoe.price)}.`
    });
  }

  if (st.lightest.shoe.id !== st.heaviest.shoe.id) {
    const women = st.lightest.shoe.weightWomens > 0 ? ` (${oz(st.lightest.shoe.weightWomens)} in a women's)` : "";
    faq.push({
      q: `Which one is the lightest?`,
      a: `${The(st.lightest)} at ${oz(st.lightest.shoe.weightMens)} in a men's size${women}. The heaviest is ${the(st.heaviest)} at ${oz(st.heaviest.shoe.weightMens)}, so the spread is ${oz(st.heaviest.shoe.weightMens - st.lightest.shoe.weightMens)} per shoe.`
    });
  }

  const stacks = collection.ranked.map((r) => r.shoe.stack);
  if (Math.max(...stacks) !== Math.min(...stacks)) {
    faq.push({
      q: `How much cushion do they have?`,
      a: `Heel stacks run ${mm(Math.min(...stacks))} to ${mm(Math.max(...stacks))}, median ${mm(st.medianStack)}. ${The(st.tallest)} stands tallest. More stack means more protection on long or tired runs, and a bit less feel for the ground.`
    });
  }

  if (!collection.groups.includes("drop")) {
    const low = collection.ranked.filter((r) => r.shoe.drop <= 4).length;
    const high = collection.ranked.filter((r) => r.shoe.drop >= 8).length;
    faq.push({
      q: `What heel to toe drop do they have?`,
      a: `The median is ${mm(st.medianDrop)}. ${
        low
          ? `${low === st.count ? `All ${st.count}` : `${low} of the ${st.count}`} drop 4 mm or less (${the(st.lowestDrop)} is flattest at ${mm(st.lowestDrop.shoe.drop)})`
          : "None drops 4 mm or less"
      }, and ${
        high === st.count ? "every one sits at 8 mm or more" : high ? `${high} sit at 8 mm or more` : "none sits at 8 mm or more"
      }. If you're coming from a higher drop, move down a few millimeters at a time.`
    });
  }

  if (!collection.groups.includes("support")) {
    const supported = collection.ranked.filter((r) => r.shoe.stability !== "neutral");
    faq.push({
      q: `Do any have stability support?`,
      a: supported.length
        ? `${supported.length} of the ${st.count} ${supported.length === 1 ? "does" : "do"}: ${joinWords(
            supported.slice(0, 4).map((r) => `${the(r)} (${supportLabel(r.shoe.stability).toLowerCase()})`)
          )}${supported.length > 4 ? ` and ${supported.length - 4} more` : ""}. The rest are neutral.`
        : `No. All ${st.count} are neutral, so overpronators should look at a stability list instead.`
    });
  }

  if (!collection.groups.includes("fit")) {
    const wide = collection.ranked.filter((r) => toeLevel(r.shoe) >= 2);
    if (wide.length) {
      faq.push({
        q: `Which have a wide toe box?`,
        a: `${capitalize(joinWords(wide.slice(0, 4).map((r) => the(r))))}${wide.length > 4 ? ` and ${wide.length - 4} more` : ""}. Many brands also sell wide sizes of standard models, so check the size chart before you rule a shoe out.`
      });
    }
  }

  return faq.slice(0, 6);
};

// ---------------------------------------------------------------------------
// Comparisons
// ---------------------------------------------------------------------------

export const NEIGHBOURS_PER_SHOE = 6;

export type Pair = { slug: string; a: ContentShoe; b: ContentShoe; distance: number };

export type ComparisonIndex = {
  pairs: Pair[];
  bySlug: Map<string, Pair>;
  byShoe: Map<string, Pair[]>;
  shoesById: Map<string, ContentShoe>;
};

/** How different two shoes are, in rough "steps". Price and specs weigh in. */
export const specDistance = (a: ContentShoe, b: ContentShoe) =>
  Math.abs(a.price - b.price) / 40 +
  Math.abs(cushionLevel(a) - cushionLevel(b)) +
  Math.abs(supportLevel(a) - supportLevel(b)) +
  Math.abs(a.stack - b.stack) / 6 +
  Math.abs(a.drop - b.drop) / 4 +
  (a.weightMens && b.weightMens ? Math.abs(a.weightMens - b.weightMens) / 1.2 : 1);

export const pairSlug = (x: string, y: string) => (x < y ? `${x}-vs-${y}` : `${y}-vs-${x}`);

const buildComparisons = (shoes: ContentShoe[]): ComparisonIndex => {
  const pairs = new Map<string, Pair>();
  const add = (x: ContentShoe, y: ContentShoe) => {
    const slug = pairSlug(x.id, y.id);
    if (pairs.has(slug)) return;
    const [a, b] = x.id < y.id ? [x, y] : [y, x];
    pairs.set(slug, { slug, a, b, distance: specDistance(a, b) });
  };

  for (const shoe of shoes) {
    const candidates = shoes
      .filter(
        (other) =>
          other.id !== shoe.id &&
          other.family !== shoe.family &&
          other.usageTypes.some((u) => shoe.usageTypes.includes(u))
      )
      .map((other) => ({ other, d: specDistance(shoe, other) }))
      .sort((x, y) => x.d - y.d || y.other.popularity - x.other.popularity);

    const families = new Set<string>();
    let taken = 0;
    for (const { other } of candidates) {
      if (families.has(other.family)) continue;
      families.add(other.family);
      add(shoe, other);
      if (++taken >= NEIGHBOURS_PER_SHOE) break;
    }
  }

  // Version upgrades: each model against its previous version.
  const byFamily = new Map<string, ContentShoe[]>();
  for (const shoe of shoes) {
    const list = byFamily.get(shoe.family) ?? [];
    list.push(shoe);
    byFamily.set(shoe.family, list);
  }
  for (const list of byFamily.values()) {
    list.sort((x, y) => x.releasedAt - y.releasedAt);
    for (let i = 1; i < list.length; i++) add(list[i - 1], list[i]);
  }

  const byShoe = new Map<string, Pair[]>();
  for (const pair of pairs.values()) {
    for (const id of [pair.a.id, pair.b.id]) {
      const list = byShoe.get(id) ?? [];
      list.push(pair);
      byShoe.set(id, list);
    }
  }
  for (const list of byShoe.values()) list.sort((x, y) => x.distance - y.distance);

  return {
    pairs: [...pairs.values()].sort((x, y) => x.slug.localeCompare(y.slug)),
    bySlug: pairs,
    byShoe,
    shoesById: new Map(shoes.map((shoe) => [shoe.id, shoe]))
  };
};

export const getComparisonIndex = cache(async (): Promise<ComparisonIndex> => {
  const shoes = await loadContentShoes();
  return buildComparisons(shoes);
});

/** Comparison pages that include this shoe, closest match first. */
export const getComparisonsForShoe = async (id: string) => {
  const index = await getComparisonIndex();
  return otherComparisons(index, id);
};

/** A shoe's comparisons, closest first, one per model line of the other shoe. */
export const otherComparisons = (index: ComparisonIndex, id: string, excludeSlug?: string) => {
  const seen = new Set<string>();
  const out: { slug: string; other: ContentShoe }[] = [];
  for (const pair of index.byShoe.get(id) ?? []) {
    if (pair.slug === excludeSlug) continue;
    const other = pair.a.id === id ? pair.b : pair.a;
    if (seen.has(other.family)) continue;
    seen.add(other.family);
    out.push({ slug: pair.slug, other });
  }
  return out;
};

export type PairLookup =
  | { kind: "found"; pair: Pair }
  | { kind: "redirect"; slug: string }
  | { kind: "missing" };

/** Resolve "<keyA>-vs-<keyB>", sending the reversed order to the canonical URL. */
export const resolvePair = async (raw: string): Promise<PairLookup> => {
  const index = await getComparisonIndex();
  const direct = index.bySlug.get(raw);
  if (direct) return { kind: "found", pair: direct };

  // Item keys contain hyphens, so try every "-vs-" split.
  let from = 0;
  while (true) {
    const at = raw.indexOf("-vs-", from);
    if (at < 0) break;
    const left = raw.slice(0, at);
    const right = raw.slice(at + 4);
    if (index.shoesById.has(left) && index.shoesById.has(right)) {
      const canonical = pairSlug(left, right);
      if (canonical !== raw && index.bySlug.has(canonical)) return { kind: "redirect", slug: canonical };
    }
    from = at + 1;
  }
  return { kind: "missing" };
};

export type Verdict = { dimension: string; edge: string | null; text: string };

const diffOz = (x: number, y: number) => round1(Math.abs(x - y));

/** One sentence per dimension, written from the numbers. */
export const comparisonVerdicts = (a: ContentShoe, b: ContentShoe): Verdict[] => {
  const A = shoeName(a);
  const B = shoeName(b);
  const out: Verdict[] = [];

  if (a.price && b.price) {
    if (a.price === b.price) {
      out.push({ dimension: "Price", edge: null, text: `Same list price, ${money(a.price)}.` });
    } else {
      const [cheap, dear] = a.price < b.price ? [a, b] : [b, a];
      out.push({
        dimension: "Price",
        edge: shoeName(cheap),
        text: `The ${shoeName(cheap)} costs ${money(dear.price - cheap.price)} less (${money(cheap.price)} against ${money(dear.price)}).`
      });
    }
  }

  if (a.weightMens && b.weightMens) {
    const d = diffOz(a.weightMens, b.weightMens);
    const womens = () => {
      if (!a.weightWomens || !b.weightWomens) return "";
      if (diffOz(a.weightWomens, b.weightWomens) < 0.2) {
        return ` Women's sizes are ${d < 0.2 ? "close too" : "within a whisker"}: ${oz(a.weightWomens)} against ${oz(b.weightWomens)}.`;
      }
      const [wl, wh] = a.weightWomens < b.weightWomens ? [a, b] : [b, a];
      return ` In a women's size the ${shoeName(wl)} is lighter, ${oz(wl.weightWomens)} against ${oz(wh.weightWomens)}.`;
    };
    if (d < 0.2) {
      out.push({
        dimension: "Weight",
        edge: null,
        text: `Close to even in a men's size: ${oz(a.weightMens)} for the ${A}, ${oz(b.weightMens)} for the ${B}.${womens()}`
      });
    } else {
      const [light, heavy] = a.weightMens < b.weightMens ? [a, b] : [b, a];
      const women = womens();
      out.push({
        dimension: "Weight",
        edge: shoeName(light),
        text: `The ${shoeName(light)} is ${d.toFixed(1)} oz lighter in a men's size (${oz(light.weightMens)} against ${oz(heavy.weightMens)}), about ${Math.round(d * 28.35)} g per shoe.${women}`
      });
    }
  }

  if (a.stack === b.stack && a.cushion === b.cushion) {
    out.push({ dimension: "Cushion", edge: null, text: `Both stand ${mm(a.stack)} at the heel with ${cushionLabel(a.cushion).toLowerCase()} cushion.` });
  } else {
    const [tall, short] = a.stack >= b.stack ? [a, b] : [b, a];
    const classNote =
      tall.cushion !== short.cushion
        ? ` We rate it ${cushionLabel(tall.cushion).toLowerCase()} cushion against ${cushionLabel(short.cushion).toLowerCase()}.`
        : ` Both are rated ${cushionLabel(tall.cushion).toLowerCase()} cushion.`;
    out.push({
      dimension: "Cushion",
      edge: tall.stack - short.stack >= 2 ? shoeName(tall) : null,
      text:
        tall.stack === short.stack
          ? `Same ${mm(tall.stack)} heel stack.${classNote}`
          : `The ${shoeName(tall)} stands ${mm(tall.stack - short.stack)} taller at the heel (${mm(tall.stack)} against ${mm(short.stack)}).${classNote}${
              tall.stack - short.stack < 2 ? " You won't feel a single millimeter." : ""
            }`
    });
  }

  if (a.drop === b.drop) {
    out.push({ dimension: "Drop", edge: null, text: `Both drop ${mm(a.drop)} from heel to toe.` });
  } else {
    const [low, high] = a.drop < b.drop ? [a, b] : [b, a];
    const gap = high.drop - low.drop;
    out.push({
      dimension: "Drop",
      edge: shoeName(low),
      text: `The ${shoeName(low)} has ${mm(gap)} less drop (${mm(low.drop)} against ${mm(high.drop)}).${
        gap >= 4 ? " That's a real change for your calves and Achilles, so switch between them gradually." : " Most runners won't feel a gap that small."
      }`
    });
  }

  if (a.stability === b.stability) {
    out.push({
      dimension: "Support",
      edge: null,
      text: a.stability === "neutral" ? "Both are neutral shoes." : `Both have ${supportLabel(a.stability).toLowerCase()}.`
    });
  } else {
    const [more, less] = supportLevel(a) > supportLevel(b) ? [a, b] : [b, a];
    out.push({
      dimension: "Support",
      edge: shoeName(more),
      text: `The ${shoeName(more)} has ${supportLabel(more.stability).toLowerCase()}${more.stability === "motion_control" ? "" : " support"}; the ${shoeName(less)} is ${
        less.stability === "neutral" ? "neutral" : supportLabel(less.stability).toLowerCase()
      }.`
    });
  }

  if (a.toeBox === b.toeBox) {
    out.push({ dimension: "Toe box", edge: null, text: `Both have a ${toeBoxLabel(a.toeBox).toLowerCase()} toe box.` });
  } else {
    const [wide, narrow] = toeLevel(a) > toeLevel(b) ? [a, b] : [b, a];
    out.push({
      dimension: "Toe box",
      edge: shoeName(wide),
      text: `The ${shoeName(wide)} has the roomier toe box (${toeBoxLabel(wide.toeBox).toLowerCase()} against ${toeBoxLabel(narrow.toeBox).toLowerCase()}).`
    });
  }

  const shared = a.usageTypes.filter((u) => b.usageTypes.includes(u));
  const onlyA = a.usageTypes.filter((u) => !b.usageTypes.includes(u));
  const onlyB = b.usageTypes.filter((u) => !a.usageTypes.includes(u));
  const useParts: string[] = [];
  if (shared.length) useParts.push(`Both are listed for ${joinWords(shared.map(usageWords))}.`);
  if (onlyA.length) useParts.push(`Only the ${A} is listed for ${joinWords(onlyA.map(usageWords))}.`);
  if (onlyB.length) useParts.push(`Only the ${B} is listed for ${joinWords(onlyB.map(usageWords))}.`);
  if (useParts.length) {
    out.push({
      dimension: "Best for",
      edge: onlyA.length && !onlyB.length ? A : onlyB.length && !onlyA.length ? B : null,
      text: useParts.join(" ")
    });
  }

  if (a.releasedAt && b.releasedAt && a.releasedAt !== b.releasedAt) {
    const [newer, older] = a.releasedAt > b.releasedAt ? [a, b] : [b, a];
    out.push({
      dimension: "Release",
      edge: null,
      text: `The ${shoeName(newer)} is newer (${monthYear(newer)} against ${monthYear(older)}).`
    });
  }

  return out;
};

/** "Pick the X if ..." for each shoe, from the dimensions where it wins. */
export const whoSuits = (x: ContentShoe, y: ContentShoe) => {
  const reasons: string[] = [];
  if (x.price && y.price && y.price - x.price >= 10) reasons.push(`price matters (it's ${money(y.price - x.price)} cheaper)`);
  if (x.weightMens && y.weightMens && y.weightMens - x.weightMens >= 0.3) {
    reasons.push(`you want the lighter shoe (${diffOz(x.weightMens, y.weightMens).toFixed(1)} oz less)`);
  }
  if (x.stack - y.stack >= 3) reasons.push(`you want more foam under you on long or tired runs`);
  if (y.drop - x.drop >= 3) reasons.push(`you're used to a lower drop or land midfoot`);
  if (x.drop - y.drop >= 3) reasons.push(`you heel strike and like a higher drop`);
  if (supportLevel(x) > supportLevel(y)) reasons.push(`you overpronate and want guidance`);
  if (supportLevel(x) < supportLevel(y)) reasons.push(`you're a neutral runner who doesn't want support getting in the way`);
  if (toeLevel(x) > toeLevel(y)) reasons.push(`your forefoot needs room`);
  const onlyX = x.usageTypes.filter((u) => !y.usageTypes.includes(u));
  if (onlyX.length) reasons.push(`you also want it for ${joinWords(onlyX.map(usageWords))}`);
  if (x.releasedAt - y.releasedAt > 180 * DAY) reasons.push(`you want the newer design`);

  if (!reasons.length) {
    return `The ${shoeName(x)} doesn't win on any spec we track, so pick it only if it feels better on your foot or turns up on sale.`;
  }
  return `Pick the ${shoeName(x)} if ${joinWords(reasons.slice(0, 3))}.`;
};

/** Lead sentence: the two or three biggest differences. */
export const comparisonLead = (a: ContentShoe, b: ContentShoe) => {
  const facts: { weight: number; text: string }[] = [];
  if (a.price && b.price && a.price !== b.price) {
    const [cheap, dear] = a.price < b.price ? [a, b] : [b, a];
    facts.push({ weight: (dear.price - cheap.price) / 20, text: `the ${shoeName(cheap)} costs ${money(dear.price - cheap.price)} less` });
  }
  if (a.weightMens && b.weightMens && diffOz(a.weightMens, b.weightMens) >= 0.2) {
    const [light, heavy] = a.weightMens < b.weightMens ? [a, b] : [b, a];
    facts.push({ weight: (heavy.weightMens - light.weightMens) / 0.5, text: `the ${shoeName(light)} is ${diffOz(a.weightMens, b.weightMens).toFixed(1)} oz lighter` });
  }
  if (Math.abs(a.stack - b.stack) >= 2) {
    const [tall, short] = a.stack > b.stack ? [a, b] : [b, a];
    facts.push({ weight: (tall.stack - short.stack) / 3, text: `the ${shoeName(tall)} has ${mm(tall.stack - short.stack)} more stack` });
  }
  if (Math.abs(a.drop - b.drop) >= 2) {
    const [low, high] = a.drop < b.drop ? [a, b] : [b, a];
    facts.push({ weight: (high.drop - low.drop) / 2, text: `the ${shoeName(low)} drops ${mm(high.drop - low.drop)} less` });
  }
  if (a.stability !== b.stability) {
    const [more] = supportLevel(a) > supportLevel(b) ? [a, b] : [b, a];
    facts.push({ weight: 3, text: `only the ${shoeName(more)} has ${supportLabel(more.stability).toLowerCase()}` });
  }
  const strong = facts.filter((f) => f.weight >= 0.5);
  const top = (strong.length ? strong : facts).sort((x, y) => y.weight - x.weight).slice(0, 3).map((f) => f.text);

  let upgrade = "";
  if (a.family === b.family && a.releasedAt && b.releasedAt && a.releasedAt !== b.releasedAt) {
    const [newer, older] = a.releasedAt > b.releasedAt ? [a, b] : [b, a];
    upgrade = `The ${shoeName(newer)} replaced the ${shoeName(older)} in ${monthYear(newer)}. `;
  }
  const stackGap = Math.abs(a.stack - b.stack);
  const weightGap = diffOz(a.weightMens, b.weightMens);
  const twins = `same support, ${stackGap ? `heel stacks within ${mm(stackGap)}` : "the same heel stack"} and ${
    weightGap >= 0.1 ? `weights within ${oz(weightGap)}` : "the same weight"
  }`;

  if (!top.length) {
    return `${upgrade}On paper these two are nearly twins: ${twins}. Fit and feel decide this one.`;
  }
  const sentence = capitalize(joinWords(top));
  if (!strong.length && a.stability === b.stability) {
    return `${upgrade}${sentence}, and that's about it: ${twins}. Fit and feel decide this one.`;
  }
  return `${upgrade}${sentence}.`;
};

/** Smallest collections that list both shoes (the most specific shared list). */
export const sharedCollections = (index: CollectionIndex, a: ContentShoe, b: ContentShoe, limit = 4) =>
  index.list
    .filter((c) => {
      let hits = 0;
      for (const row of c.ranked) {
        if (row.shoe.id === a.id || row.shoe.id === b.id) hits++;
      }
      return hits === 2;
    })
    .sort((x, y) => x.ranked.length - y.ranked.length || x.facetIds.length - y.facetIds.length)
    .slice(0, limit);

// ---------------------------------------------------------------------------
// Sitemap
// ---------------------------------------------------------------------------

export async function getShoeContentSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const [collections, comparisons] = await Promise.all([getCollectionIndex(), getComparisonIndex()]);
  const stamp = (value: string | null) => (value ? { lastModified: new Date(value) } : {});

  const hubModified = latest(collections.list.map((c) => c.lastModified));
  const entries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/shoes/best`, ...stamp(hubModified), changeFrequency: "weekly", priority: 0.8 }
  ];

  for (const collection of collections.list) {
    entries.push({
      url: `${SITE_URL}/shoes/best/${collection.slug}`,
      ...stamp(collection.lastModified),
      changeFrequency: "weekly",
      priority: collection.facetIds.length === 1 ? 0.7 : 0.6
    });
  }

  for (const pair of comparisons.pairs) {
    entries.push({
      url: `${SITE_URL}/shoes/compare/${pair.slug}`,
      ...stamp(latest([pair.a.updatedAt, pair.b.updatedAt])),
      changeFrequency: "monthly",
      priority: 0.5
    });
  }

  return entries;
}
