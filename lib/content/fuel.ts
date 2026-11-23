import type { MetadataRoute } from "next";
import { cache } from "react";
import {
  RACE_DEFS,
  finishSlug,
  planTimesFor,
  isPlannable,
  planFuel,
  type FuelProduct,
  type FuelType,
  type RaceDef
} from "@/lib/fueling";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { SITE_URL } from "@/lib/seo";

/*
 * Race fuel content. Every number on /fuel pages comes from the fuel_gels
 * table (synced from data/fuel-catalog.json) or from lib/fueling.ts, the same
 * math the Fuel Finder runs.
 */

export type { FuelProduct } from "@/lib/fueling";
export { finishSlug, planTimesFor };

/** The product the Fuel Finder starts with: the gel most US runners have tried. */
export const DEFAULT_KEY = "gu-original-energy-gel";

type Row = {
  item_key: string;
  brand: string;
  name: string;
  product_type: string | null;
  serving_size: string | null;
  carbs_g: number | null;
  caffeine_mg: number | null;
  sodium_mg: number | null;
  calories: number | null;
  flavors: string[] | null;
  price_usd: number | null;
  notes: string | null;
  release_note: string | null;
  image_url: string | null;
  product_url: string | null;
};

export const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const BRAND_SHORT: Record<string, string> = { "Science in Sport": "SiS", "Precision Fuel & Hydration": "Precision" };

export const brandShort = (brand: string) => BRAND_SHORT[brand] ?? brand;

const displayNameFor = (brand: string, name: string) => {
  const lower = name.toLowerCase();
  const short = brandShort(brand);
  if (lower.startsWith(brand.toLowerCase()) || lower.startsWith(short.toLowerCase())) return name;
  return `${short} ${name}`;
};

const TYPES: FuelType[] = ["gel", "chew", "drink", "bar", "electrolyte"];

const inferType = (row: Row): FuelType => {
  if (row.product_type && (TYPES as string[]).includes(row.product_type)) return row.product_type as FuelType;
  if (/\bchews?\b|bloks|beans/i.test(row.name)) return "chew";
  return "gel";
};

const mapRow = (row: Row): FuelProduct => {
  const name = String(row.name).trim();
  const brand = String(row.brand).trim();
  return {
    key: row.item_key,
    brand,
    name,
    display: displayNameFor(brand, name),
    type: inferType(row),
    carbs: Number(row.carbs_g) || 0,
    caffeineMg: Number(row.caffeine_mg) || 0,
    sodiumMg: Number(row.sodium_mg) || 0,
    calories: Number(row.calories) || 0,
    servingSize: row.serving_size ?? undefined,
    flavors: (row.flavors ?? []).filter(Boolean),
    priceUsd: row.price_usd != null ? Number(row.price_usd) : undefined,
    imageUrl: row.image_url ?? undefined,
    productUrl: row.product_url ?? undefined,
    notes: row.notes?.trim() || undefined,
    releaseNote: row.release_note ?? undefined
  };
};

// A row is shown only with real nutrition (the old table held scraped headlines with none).
const isReal = (p: FuelProduct) => p.calories > 0 || p.type === "electrolyte";

/** Every active product with real numbers, sorted by brand then name. Throws on DB errors so ISR keeps the last good page. */
export const getFuelProducts = cache(async (): Promise<FuelProduct[]> => {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];
  const { data, error } = (await supabase
    .from("fuel_gels")
    .select(
      "item_key, brand, name, product_type, serving_size, carbs_g, caffeine_mg, sodium_mg, calories, flavors, price_usd, notes, release_note, image_url, product_url"
    )
    .eq("is_active", true)
    .order("item_key")) as { data: Row[] | null; error: { message: string } | null };
  if (error) throw new Error(`Failed to load fuel_gels: ${error.message}`);
  return (data ?? [])
    .filter((row) => row.item_key && row.name && row.brand)
    .map(mapRow)
    .filter(isReal)
    .sort((a, b) => a.brand.localeCompare(b.brand) || a.name.localeCompare(b.name));
});

/** Brand of a product that has left the catalog, for redirecting its old page. */
export const getRetiredBrand = cache(async (key: string): Promise<string | null> => {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  const { data } = (await supabase.from("fuel_gels").select("brand").eq("item_key", key).maybeSingle()) as {
    data: { brand: string } | null;
  };
  return data?.brand ?? null;
});

export const findProduct = (products: FuelProduct[], key: string) => products.find((p) => p.key === key);

/** Trim what the browser needs: every product, for the client grids. */
export const toClient = (products: FuelProduct[]) =>
  products.map((product) => ({ ...product, notes: undefined }));

// ---------- Formatting ----------

export const parseFinishSlug = (slug: string) => {
  const match = /^(\d{1,2})-(\d{2})$/.exec(slug);
  if (!match) return null;
  const mins = Number(match[2]);
  if (mins >= 60) return null;
  return Number(match[1]) * 60 + mins;
};

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export const TYPE_LABEL: Record<FuelType, string> = {
  gel: "Gel",
  chew: "Chews",
  drink: "Drink mix",
  bar: "Bar / waffle",
  electrolyte: "Electrolytes"
};

export const TYPE_PLURAL: Record<FuelType, string> = {
  gel: "gels",
  chew: "chews",
  drink: "drink mixes",
  bar: "bars and waffles",
  electrolyte: "electrolytes"
};

// ---------- Plan pages ----------

export const PLAN_RACES = RACE_DEFS;

// ---------- Neighbours and comparisons ----------

// Scales chosen so a step of each counts about the same to a runner.
const distance = (a: FuelProduct, b: FuelProduct) =>
  Math.sqrt(
    ((a.carbs - b.carbs) / 4) ** 2 +
      ((a.sodiumMg - b.sodiumMg) / 60) ** 2 +
      ((a.caffeineMg - b.caffeineMg) / 30) ** 2 +
      ((a.calories - b.calories) / 40) ** 2 +
      (a.type === b.type ? 0 : 6)
  );

/** The closest products of the same kind, at most two from the same brand. */
export const neighboursOf = (product: FuelProduct, products: FuelProduct[], count = 4) => {
  const ranked = products
    .filter((other) => other.key !== product.key && other.type === product.type)
    .map((other) => ({ other, d: distance(product, other) }))
    .sort((a, b) => a.d - b.d || a.other.key.localeCompare(b.other.key));
  const picks: FuelProduct[] = [];
  let sameBrand = 0;
  for (const { other } of ranked) {
    if (other.brand === product.brand) {
      if (sameBrand >= 2) continue;
      sameBrand += 1;
    }
    picks.push(other);
    if (picks.length === count) break;
  }
  return picks;
};

export const pairSlug = (a: string, b: string) => {
  const [first, second] = [a, b].sort();
  return `${first}-vs-${second}`;
};

export const parsePairSlug = (slug: string) => {
  const parts = slug.split("-vs-");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  return { a: parts[0], b: parts[1] };
};

/** Every comparison page: each carb product with its nearest neighbours of the same kind. */
export const comparePairs = (products: FuelProduct[]) => {
  const pairs = new Map<string, [FuelProduct, FuelProduct]>();
  const fuel = products.filter(isPlannable);
  for (const product of fuel) {
    for (const other of neighboursOf(product, fuel, 4)) {
      const [first, second] = [product, other].sort((x, y) => x.key.localeCompare(y.key));
      pairs.set(pairSlug(first.key, second.key), [first, second]);
    }
  }
  return pairs;
};

export const pairsFor = (product: FuelProduct, products: FuelProduct[]) =>
  Array.from(comparePairs(products).entries())
    .filter(([, pair]) => pair[0].key === product.key || pair[1].key === product.key)
    .map(([slug, pair]) => ({ slug, other: pair[0].key === product.key ? pair[1] : pair[0] }));

// ---------- Collections ----------

export type Collection = {
  slug: string;
  title: string;
  h1: string;
  filter: (p: FuelProduct) => boolean;
  sort: (a: FuelProduct, b: FuelProduct) => number;
  metric: "carbs" | "caffeine" | "sodium" | "calories" | "price";
};

const byKey = (a: FuelProduct, b: FuelProduct) => a.key.localeCompare(b.key);
const isGel = (p: FuelProduct) => p.type === "gel";

const TRAIT_COLLECTIONS: Collection[] = [
  { slug: "caffeine-free-gels", title: "Caffeine-Free Energy Gels", h1: "Caffeine-free gels", filter: (p) => isGel(p) && p.caffeineMg === 0, sort: (a, b) => b.carbs - a.carbs || byKey(a, b), metric: "carbs" },
  { slug: "caffeinated-gels", title: "Caffeinated Energy Gels", h1: "Caffeinated gels", filter: (p) => isGel(p) && p.caffeineMg > 0, sort: (a, b) => a.caffeineMg - b.caffeineMg || byKey(a, b), metric: "caffeine" },
  { slug: "high-caffeine-gels", title: "High-Caffeine Energy Gels (75mg+)", h1: "75mg+ caffeine gels", filter: (p) => isGel(p) && p.caffeineMg >= 75, sort: (a, b) => b.caffeineMg - a.caffeineMg || byKey(a, b), metric: "caffeine" },
  { slug: "high-sodium-gels", title: "High-Sodium Energy Gels (100mg+)", h1: "100mg+ sodium gels", filter: (p) => isGel(p) && p.sodiumMg >= 100, sort: (a, b) => b.sodiumMg - a.sodiumMg || byKey(a, b), metric: "sodium" },
  { slug: "high-carb-gels", title: "High-Carb Gels and Chews (40g+)", h1: "40g+ carbs a serving", filter: (p) => (p.type === "gel" || p.type === "chew") && p.carbs >= 40, sort: (a, b) => b.carbs - a.carbs || byKey(a, b), metric: "carbs" },
  { slug: "30g-carb-gels", title: "Energy Gels With 30g+ Carbs", h1: "30g+ carb gels", filter: (p) => isGel(p) && p.carbs >= 30, sort: (a, b) => b.carbs - a.carbs || byKey(a, b), metric: "carbs" },
  { slug: "low-calorie-gels", title: "Low-Calorie Energy Gels (90 kcal or less)", h1: "Gels at 90 calories or less", filter: (p) => isGel(p) && p.calories > 0 && p.calories <= 90, sort: (a, b) => a.calories - b.calories || byKey(a, b), metric: "calories" },
  { slug: "cheapest-gels", title: "Cheapest Energy Gels per Serving", h1: "Cheapest gels per serving", filter: (p) => isGel(p) && p.priceUsd != null, sort: (a, b) => (a.priceUsd ?? 0) - (b.priceUsd ?? 0) || byKey(a, b), metric: "price" },
  { slug: "energy-chews", title: "Energy Chews for Running", h1: "Energy chews", filter: (p) => p.type === "chew", sort: (a, b) => b.carbs - a.carbs || byKey(a, b), metric: "carbs" },
  { slug: "drink-mixes", title: "Carb Drink Mixes for Running", h1: "Carb drink mixes", filter: (p) => p.type === "drink", sort: (a, b) => b.carbs - a.carbs || byKey(a, b), metric: "carbs" },
  { slug: "energy-bars-and-waffles", title: "Energy Bars and Waffles for Running", h1: "Bars and waffles", filter: (p) => p.type === "bar", sort: (a, b) => b.carbs - a.carbs || byKey(a, b), metric: "carbs" },
  { slug: "electrolytes", title: "Electrolyte Capsules, Tabs and Mixes", h1: "Electrolytes", filter: (p) => p.type === "electrolyte", sort: (a, b) => b.sodiumMg - a.sodiumMg || byKey(a, b), metric: "sodium" }
];

export const MIN_COLLECTION = 3;

export const collectionsFor = (products: FuelProduct[]): Collection[] => {
  const brands = new Map<string, string>();
  products.forEach((p) => brands.set(slugify(p.brand), p.brand));
  const brandCollections: Collection[] = Array.from(brands.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([slug, brand]) => ({
      slug: `${slug}-gels`,
      title: `${brand} Gels, Chews and Drink Mixes Compared`,
      h1: `Every ${brand} product`,
      filter: (p: FuelProduct) => slugify(p.brand) === slug,
      sort: (a: FuelProduct, b: FuelProduct) => TYPES.indexOf(a.type) - TYPES.indexOf(b.type) || a.caffeineMg - b.caffeineMg || b.carbs - a.carbs || byKey(a, b),
      metric: "carbs" as const
    }));
  return [...TRAIT_COLLECTIONS, ...brandCollections].filter(
    (collection) => products.filter(collection.filter).length >= MIN_COLLECTION
  );
};

export const findCollection = (products: FuelProduct[], slug: string) =>
  collectionsFor(products).find((collection) => collection.slug === slug);

// ---------- Reference counts ----------

/** Races shown on every product page: how many servings that product takes. */
export const PRODUCT_PAGE_RACES: { race: string; minutes: number }[] = [
  { race: "half-marathon", minutes: 120 },
  { race: "marathon", minutes: 210 },
  { race: "marathon", minutes: 270 },
  { race: "50k", minutes: 360 }
];

export const servingsFor = (product: FuelProduct, raceSlug: string, minutes: number) => {
  const race = RACE_DEFS.find((r) => r.slug === raceSlug);
  if (!race) return 0;
  return planFuel({ minutes, miles: race.miles, product }).servings.length;
};

// ---------- Sitemap ----------

export async function getFuelContentSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const products = await getFuelProducts();
  if (!products.length) return [];
  const base = `${SITE_URL}/fuel`;
  const entries: MetadataRoute.Sitemap = [{ url: base, changeFrequency: "weekly", priority: 0.7 }];
  for (const race of PLAN_RACES) {
    for (const minutes of planTimesFor(race)) {
      entries.push({ url: `${base}/plan/${race.slug}/${finishSlug(minutes)}`, changeFrequency: "monthly", priority: 0.6 });
    }
  }
  for (const product of products) {
    entries.push({ url: `${base}/gels/${product.key}`, changeFrequency: "monthly", priority: 0.6 });
  }
  for (const collection of collectionsFor(products)) {
    entries.push({ url: `${base}/best/${collection.slug}`, changeFrequency: "monthly", priority: 0.6 });
  }
  for (const slug of comparePairs(products).keys()) {
    entries.push({ url: `${base}/compare/${slug}`, changeFrequency: "monthly", priority: 0.5 });
  }
  return entries;
}
