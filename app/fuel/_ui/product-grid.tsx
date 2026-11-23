"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { FuelProduct, FuelType } from "@/lib/fueling";
import FuelPhoto from "./fuel-photo";
import s from "../fuel.module.css";

const TYPE_CHIPS: { id: FuelType | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "gel", label: "Gels" },
  { id: "chew", label: "Chews" },
  { id: "drink", label: "Drink mixes" },
  { id: "bar", label: "Bars & waffles" },
  { id: "electrolyte", label: "Electrolytes" }
];

const SORTS = [
  { id: "featured", label: "Gels first" },
  { id: "carbs", label: "Most carbs" },
  { id: "price", label: "Cheapest" },
  { id: "sodium", label: "Most sodium" },
  { id: "caffeine", label: "Most caffeine" },
  { id: "name", label: "A to Z" }
] as const;
type SortId = (typeof SORTS)[number]["id"];

// The brands most US runners reach for first, then everyone else A to Z.
const BRAND_RANK = ["GU", "Maurten", "Science in Sport", "Precision Fuel & Hydration", "Spring Energy", "Honey Stinger", "Clif", "Huma", "Skratch Labs", "Näak", "Neversecond", "Tailwind", "UCAN", "Carbs Fuel"];
const TYPE_RANK: FuelType[] = ["gel", "chew", "drink", "bar", "electrolyte"];
const brandRank = (brand: string) => {
  const i = BRAND_RANK.indexOf(brand);
  return i === -1 ? BRAND_RANK.length : i;
};

const TYPE_SHORT: Record<FuelType, string> = { gel: "Gel", chew: "Chews", drink: "Drink mix", bar: "Bar", electrolyte: "Electrolyte" };

export function ProductStats({ product }: { product: FuelProduct }) {
  return (
    <div className="bib-stats">
      {product.type !== "electrolyte" ? (
        <span className="split">
          <b>{product.carbs}</b>g carbs
        </span>
      ) : null}
      <span className="split">
        <b>{product.sodiumMg}</b>mg Na
      </span>
      {product.caffeineMg ? (
        <span className="split">
          <b>{product.caffeineMg}</b>mg caf
        </span>
      ) : null}
    </div>
  );
}

export function ProductBib({
  product,
  number,
  href,
  onSelect,
  selected,
  badge,
  countLine
}: {
  product: FuelProduct;
  number?: number;
  href?: string;
  onSelect?: () => void;
  selected?: boolean;
  badge?: string;
  /** Replaces the price in the tear strip, e.g. "9 gels". */
  countLine?: string;
}) {
  const body = (
    <>
      <span className="bib-pins" />
      {number ? <span className="bib-number">{number.toString().padStart(2, "0")}</span> : null}
      {badge || product.releaseNote ? <span className="bib-badge">{badge ?? "New"}</span> : null}
      <span className="bib-photo">
        <FuelPhoto product={product} className={s.fill} />
      </span>
      <span className="bib-meta">
        {product.brand} · {TYPE_SHORT[product.type]}
      </span>
      <span className="bib-title">{product.name}</span>
      <ProductStats product={product} />
      <span className="bib-tear">
        <span className="bib-price">
          {countLine ?? (product.priceUsd != null ? `$${product.priceUsd.toFixed(2)}` : " ")}
        </span>
        <span className={s.tearAction}>{onSelect ? (selected ? "Using" : "Use this") : "Details"}</span>
      </span>
    </>
  );
  if (onSelect) {
    return (
      <button type="button" className={`bib ${s.bibButton} ${selected ? s.bibSelected : ""}`} onClick={onSelect} aria-pressed={selected}>
        {body}
      </button>
    );
  }
  return (
    <Link className="bib" href={href ?? `/fuel/gels/${product.key}`}>
      {body}
    </Link>
  );
}

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

export default function ProductGrid({
  products,
  onSelect,
  selectedKey,
  initialQuery = "",
  types = true,
  pageSize = 24,
  plannableOnly = false,
  numbered = false
}: {
  products: FuelProduct[];
  onSelect?: (product: FuelProduct) => void;
  selectedKey?: string;
  initialQuery?: string;
  /** Show the type chips (off when the list is already one type). */
  types?: boolean;
  pageSize?: number;
  /** Hide electrolyte-only products (the Fuel Finder can't schedule them). */
  plannableOnly?: boolean;
  /** Rank numbers on the bibs, in the given order (collections). */
  numbered?: boolean;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [type, setType] = useState<FuelType | "all">("all");
  const [caffeine, setCaffeine] = useState<"any" | "free" | "with">("any");
  const [salty, setSalty] = useState(false);
  const [brand, setBrand] = useState("");
  const [sort, setSort] = useState<SortId | "given">(numbered ? "given" : "featured");
  const [limit, setLimit] = useState(pageSize);

  useEffect(() => {
    // The hub's links from retired product pages arrive as ?q=Brand.
    if (initialQuery) return;
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) setQuery(q);
  }, [initialQuery]);

  const pool = useMemo(
    () => (plannableOnly ? products.filter((p) => p.type !== "electrolyte" && p.carbs >= 10) : products),
    [products, plannableOnly]
  );
  const brands = useMemo(() => Array.from(new Set(pool.map((p) => p.brand))).sort((a, b) => a.localeCompare(b)), [pool]);
  const presentTypes = useMemo(() => new Set(pool.map((p) => p.type)), [pool]);

  const shown = useMemo(() => {
    const words = query
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);
    const list = pool.filter((p) => {
      if (type !== "all" && p.type !== type) return false;
      if (caffeine === "free" && p.caffeineMg > 0) return false;
      if (caffeine === "with" && !p.caffeineMg) return false;
      if (salty && p.sodiumMg < 100) return false;
      if (brand && p.brand !== brand) return false;
      if (!words.length) return true;
      const hay = `${p.brand} ${p.name} ${p.type} ${p.flavors.join(" ")}`
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase();
      return words.every((word) => hay.includes(word));
    });
    if (sort === "given") return list;
    const by: Record<SortId, (a: FuelProduct, b: FuelProduct) => number> = {
      featured: (a, b) =>
        TYPE_RANK.indexOf(a.type) - TYPE_RANK.indexOf(b.type) ||
        Number(Boolean(b.imageUrl)) - Number(Boolean(a.imageUrl)) ||
        brandRank(a.brand) - brandRank(b.brand) ||
        a.brand.localeCompare(b.brand) ||
        a.caffeineMg - b.caffeineMg,
      carbs: (a, b) => b.carbs - a.carbs,
      price: (a, b) => (a.priceUsd ?? 99) - (b.priceUsd ?? 99),
      sodium: (a, b) => b.sodiumMg - a.sodiumMg,
      caffeine: (a, b) => b.caffeineMg - a.caffeineMg,
      name: (a, b) => a.display.localeCompare(b.display)
    };
    return [...list].sort((a, b) => by[sort](a, b) || a.display.localeCompare(b.display));
  }, [pool, query, type, caffeine, salty, brand, sort]);

  useEffect(() => setLimit(pageSize), [query, type, caffeine, salty, brand, sort, pageSize]);

  const reset = () => {
    setQuery("");
    setType("all");
    setCaffeine("any");
    setSalty(false);
    setBrand("");
  };

  return (
    <div className={s.grid}>
      <div className="toolbar">
        <label className="search-bar">
          <SearchIcon />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Search ${pool.length} products, brands, flavors`}
            aria-label="Search fuel"
          />
        </label>
        <select className={`select ${s.sortSelect}`} value={sort} onChange={(event) => setSort(event.target.value as SortId)} aria-label="Sort">
          {numbered ? <option value="given">Ranked</option> : null}
          {SORTS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className={`chips ${s.filterRow}`}>
        {types
          ? TYPE_CHIPS.filter((chip) => chip.id === "all" || presentTypes.has(chip.id)).map((chip) => (
              <button key={chip.id} type="button" className={`chip ${type === chip.id ? "is-on" : ""}`} onClick={() => setType(chip.id)}>
                {chip.label}
              </button>
            ))
          : null}
        <span className={s.chipGap} />
        <button type="button" className={`chip ${caffeine === "free" ? "is-on" : ""}`} onClick={() => setCaffeine(caffeine === "free" ? "any" : "free")}>
          No caffeine
        </button>
        <button type="button" className={`chip ${caffeine === "with" ? "is-on" : ""}`} onClick={() => setCaffeine(caffeine === "with" ? "any" : "with")}>
          Caffeine
        </button>
        <button type="button" className={`chip ${salty ? "is-on" : ""}`} onClick={() => setSalty(!salty)}>
          High sodium
        </button>
        {brands.length > 1 ? (
          <select className={`select ${s.brandSelect} ${brand ? s.brandOn : ""}`} value={brand} onChange={(event) => setBrand(event.target.value)} aria-label="Brand">
            <option value="">All brands</option>
            {brands.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        ) : null}
      </div>
      <p className={s.count}>
        {shown.length === pool.length ? `${pool.length} products` : `${shown.length} of ${pool.length}`}
      </p>
      {shown.length ? (
        <div className="bib-grid">
          {shown.slice(0, limit).map((product, index) => (
            <ProductBib
              key={product.key}
              product={product}
              number={numbered && sort === "given" ? index + 1 : undefined}
              onSelect={onSelect ? () => onSelect(product) : undefined}
              selected={product.key === selectedKey}
            />
          ))}
        </div>
      ) : (
        <div className="empty">
          Nothing matches.{" "}
          <button type="button" className="text-button" onClick={reset}>
            Clear filters
          </button>
        </div>
      )}
      {shown.length > limit ? (
        <div className={s.more}>
          <button type="button" className="btn" onClick={() => setLimit(shown.length)}>
            Show all {shown.length}
          </button>
        </div>
      ) : null}
    </div>
  );
}
