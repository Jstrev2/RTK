import { rankPopularity, type ShoeCard } from "./shoe-catalog";

/**
 * Filters shared by the shoe grid (/shoes), the Shoe Finder's "see all
 * matches" link and the server page that reads them from the query string.
 */

export const FREE_CARDS = 10;

export type GridFilters = {
  q: string;
  use: string;
  cushion: string;
  support: string;
  wide: boolean;
  max: number;
  brand: string;
  sort: string;
};

export const EMPTY_FILTERS: GridFilters = { q: "", use: "", cushion: "", support: "", wide: false, max: 0, brand: "", sort: "popular" };

export const USES = [
  { id: "daily_trainer", label: "Daily miles" },
  { id: "long_run", label: "Long runs" },
  { id: "speed_work", label: "Speed work" },
  { id: "race_day", label: "Race day" },
  { id: "recovery_runs", label: "Easy days" }
];

export const CUSHIONS = [
  { id: "maximum", label: "Soft" },
  { id: "moderate", label: "Balanced" },
  { id: "minimal", label: "Firm" }
];

export const SUPPORTS = [
  { id: "neutral", label: "Neutral" },
  { id: "support", label: "Support" }
];

export const PRICES = [120, 160, 200];

export const SORTS = [
  { id: "popular", label: "Most popular" },
  { id: "newest", label: "Newest" },
  { id: "price", label: "Price: low to high" },
  { id: "weight", label: "Lightest" }
];

/** Reads filters from a query string (also used by the server page). */
export function filtersFromParams(params: Record<string, string | string[] | undefined>): GridFilters {
  const one = (key: string) => {
    const value = params[key];
    return (Array.isArray(value) ? value[0] : value) ?? "";
  };
  const max = Number(one("max"));
  return {
    q: one("q").slice(0, 60),
    use: USES.some((u) => u.id === one("use")) ? one("use") : "",
    cushion: CUSHIONS.some((c) => c.id === one("cushion")) ? one("cushion") : "",
    support: SUPPORTS.some((s) => s.id === one("support")) ? one("support") : "",
    wide: one("wide") === "1",
    max: Number.isFinite(max) && max > 0 ? max : 0,
    brand: one("brand").slice(0, 40),
    sort: SORTS.some((s) => s.id === one("sort")) ? one("sort") : "popular"
  };
}

export function toQuery(filters: GridFilters) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.use) params.set("use", filters.use);
  if (filters.cushion) params.set("cushion", filters.cushion);
  if (filters.support) params.set("support", filters.support);
  if (filters.wide) params.set("wide", "1");
  if (filters.max) params.set("max", String(filters.max));
  if (filters.brand) params.set("brand", filters.brand);
  if (filters.sort !== "popular") params.set("sort", filters.sort);
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function applyFilters(shoes: ShoeCard[], filters: GridFilters): ShoeCard[] {
  const words = filters.q.toLowerCase().split(/\s+/).filter(Boolean);
  const list = shoes.filter((shoe) => {
    if (words.length) {
      const haystack = `${shoe.brand} ${shoe.name}`.toLowerCase();
      if (!words.every((word) => haystack.includes(word))) return false;
    }
    if (filters.use && !shoe.uses.includes(filters.use)) return false;
    if (filters.cushion && shoe.cushion !== filters.cushion) return false;
    if (filters.support === "neutral" && shoe.support !== "neutral") return false;
    if (filters.support === "support" && shoe.support === "neutral") return false;
    if (filters.wide && !["wide", "extra_wide"].includes(shoe.toeBox)) return false;
    if (filters.max && (!shoe.price || shoe.price > filters.max)) return false;
    if (filters.brand && shoe.brand !== filters.brand) return false;
    return true;
  });
  const by = {
    popular: (a: ShoeCard, b: ShoeCard) => rankPopularity(b) - rankPopularity(a) || (b.released ?? "").localeCompare(a.released ?? ""),
    newest: (a: ShoeCard, b: ShoeCard) => (b.released ?? "").localeCompare(a.released ?? "") || b.popularity - a.popularity,
    price: (a: ShoeCard, b: ShoeCard) => (a.price || 9999) - (b.price || 9999) || b.popularity - a.popularity,
    weight: (a: ShoeCard, b: ShoeCard) => (a.weight || 99) - (b.weight || 99) || b.popularity - a.popularity
  }[filters.sort] ?? (() => 0);
  return [...list].sort(by);
}
