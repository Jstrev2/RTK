import { unstable_cache } from "next/cache";
import { getSupabaseAdmin } from "./supabase-admin";
import type { Shoe } from "./data";

/**
 * The compact shoe record every shoe list uses (grid, finder, collections,
 * comparisons). Small enough to send all of them to the browser.
 */
export type ShoeCard = {
  id: string;
  name: string;
  brand: string;
  price: number;
  uses: string[];
  cushion: string;
  support: string;
  toeBox: string;
  drop: number | null;
  stack: number | null;
  weight: number | null;
  popularity: number;
  released: string | null;
  image: string | null;
  imageAlt: string | null;
  /** A newer version of the same model is in the catalog (Ghost 17 once Ghost 18 is out). */
  superseded: boolean;
};

type Row = {
  item_key: string;
  name: string;
  brand: string;
  price: number | null;
  usage_types: string[] | null;
  cushion: string | null;
  stability: string | null;
  toe_box: string | null;
  drop: number | null;
  stack: number | null;
  weight_mens: number | null;
  popularity: number | null;
  release_date: string | null;
  image_url: string | null;
  image_alt: string | null;
};

const COLUMNS =
  "item_key,name,brand,price,usage_types,cushion,stability,toe_box,drop,stack,weight_mens,popularity,release_date,image_url,image_alt";

export const toShoeCard = (row: Row): ShoeCard => ({
  id: row.item_key,
  name: row.name,
  brand: row.brand,
  price: row.price ?? 0,
  uses: row.usage_types ?? [],
  cushion: row.cushion ?? "moderate",
  support: row.stability ?? "neutral",
  toeBox: row.toe_box ?? "standard",
  drop: row.drop,
  stack: row.stack,
  weight: row.weight_mens,
  popularity: row.popularity ?? 0,
  released: row.release_date,
  image: row.image_url,
  imageAlt: row.image_alt,
  superseded: false
});

const familyOf = (shoe: { brand: string; name: string }) =>
  `${shoe.brand.toLowerCase()}|${shoe.name.toLowerCase().replace(/\s+(v?\d+(\.\d+)?)$/i, "").trim()}`;

/** Marks every shoe that has a newer version of the same model in the list. */
export function markSuperseded(cards: ShoeCard[]): ShoeCard[] {
  const newest = new Map<string, string>();
  for (const card of cards) {
    const family = familyOf(card);
    const date = card.released ?? "";
    if (date > (newest.get(family) ?? "")) newest.set(family, date);
  }
  return cards.map((card) => ({ ...card, superseded: (card.released ?? "") < (newest.get(familyOf(card)) ?? "") }));
}

/** Popularity for ranking: older versions sit below the current one. */
export const rankPopularity = (card: ShoeCard) => card.popularity - (card.superseded ? 15 : 0);

/**
 * Every active, released shoe, most popular first. Cached for 30 minutes so
 * pages that read search params (and render per request) stay cheap.
 */
export const loadShoeCards = unstable_cache(async (): Promise<ShoeCard[]> => {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("shoe_models")
    .select(COLUMNS)
    .eq("is_active", true)
    .or(`release_date.is.null,release_date.lte.${today}`)
    .order("popularity", { ascending: false })
    .order("release_date", { ascending: false })
    .limit(2000);
  if (error) throw new Error(`Failed to load shoes: ${error.message}`);
  return markSuperseded(((data ?? []) as Row[]).map(toShoeCard));
}, ["shoe-cards-v2"], { revalidate: 1800, tags: ["shoes"] });

/** Model name without the brand in front ("Ghost 18" for "Brooks Ghost 18"). */
export const modelName = (shoe: { name: string; brand: string }) =>
  shoe.name.toLowerCase().startsWith(shoe.brand.toLowerCase() + " ") ? shoe.name.slice(shoe.brand.length + 1) : shoe.name;

export const USE_LABEL: Record<string, string> = {
  daily_trainer: "Daily",
  long_run: "Long run",
  speed_work: "Speed",
  race_day: "Race",
  recovery_runs: "Recovery"
};

export const CUSHION_LABEL: Record<string, string> = {
  minimal: "Firm",
  moderate: "Balanced",
  maximum: "Max cushion"
};

export const SUPPORT_LABEL: Record<string, string> = {
  neutral: "Neutral",
  mild: "Light support",
  moderate: "Stability",
  motion_control: "Max support"
};

/** "Daily · Max cushion · Neutral": the one-line description under a card title. */
export const cardLine = (shoe: ShoeCard) =>
  [USE_LABEL[shoe.uses[0]] ?? null, CUSHION_LABEL[shoe.cushion], SUPPORT_LABEL[shoe.support]].filter(Boolean).join(" · ");

/** The full Shoe record (detail, collection and comparison pages) as a card. */
export const shoeToCard = (shoe: Shoe): ShoeCard => ({
  id: shoe.id,
  name: shoe.name,
  brand: shoe.brand,
  price: shoe.price,
  uses: shoe.usageTypes,
  cushion: shoe.cushion,
  support: shoe.stability,
  toeBox: shoe.toeBox,
  drop: shoe.drop ?? null,
  stack: shoe.stack || null,
  weight: shoe.weightMens || null,
  popularity: shoe.popularity,
  released: shoe.releaseDate ?? null,
  image: shoe.imageUrl ?? null,
  imageAlt: null,
  superseded: false
});

/** Splits copy into paragraphs of at most three sentences. */
export const shortParagraphs = (paragraphs: string[], max = 3): string[] =>
  paragraphs.flatMap((paragraph) => {
    // Split after ., ! or ? followed by a space and a capital ("10.6 oz" stays whole).
    const sentences = paragraph.split(/(?<=[.!?])\s+(?=[A-Z])/).map((s) => s.trim()).filter(Boolean);
    const out: string[] = [];
    for (let i = 0; i < sentences.length; i += max) out.push(sentences.slice(i, i + max).join(" "));
    return out;
  });
