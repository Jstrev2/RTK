"use client";

import { useEffect, useMemo, useState } from "react";
import ShoeBib from "@/components/shoe-bib";
import { SignupCard } from "@/components/account-gate";
import { useAuth } from "@/components/auth-provider";
import type { ShoeCard } from "@/lib/shoe-catalog";
import { applyFilters, CUSHIONS, EMPTY_FILTERS, FREE_CARDS, PRICES, SORTS, SUPPORTS, toQuery, USES, type GridFilters } from "@/lib/shoe-filters";

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" className={`chip${on ? " is-on" : ""}`} aria-pressed={on} onClick={onClick}>
      {children}
    </button>
  );
}

export default function ShoeGrid({ shoes, initial }: { shoes: ShoeCard[]; initial: GridFilters }) {
  const { user, loading, supabaseAvailable } = useAuth();
  const [filters, setFilters] = useState<GridFilters>(initial);
  const brands = useMemo(() => [...new Set(shoes.map((shoe) => shoe.brand))].sort((a, b) => a.localeCompare(b)), [shoes]);
  const results = useMemo(() => applyFilters(shoes, filters), [shoes, filters]);
  const unlocked = Boolean(user) || !supabaseAvailable;

  useEffect(() => {
    const url = `${window.location.pathname}${toQuery(filters)}`;
    window.history.replaceState(window.history.state, "", url);
  }, [filters]);

  const set = (patch: Partial<GridFilters>) => setFilters((current) => ({ ...current, ...patch }));
  const toggle = (key: "use" | "cushion" | "support", value: string) =>
    setFilters((current) => ({ ...current, [key]: current[key] === value ? "" : value }));
  const active =
    Boolean(filters.q || filters.use || filters.cushion || filters.support || filters.wide || filters.max || filters.brand);

  const visible = unlocked ? results : results.slice(0, FREE_CARDS);
  const teaser = unlocked ? [] : results.slice(FREE_CARDS, FREE_CARDS + 4);

  return (
    <div className="shoe-grid">
      <div className="toolbar">
        <label className="search-bar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <span className="sr-only">Search shoes</span>
          <input
            type="search"
            placeholder="Search shoes or brands"
            value={filters.q}
            onChange={(event) => set({ q: event.target.value })}
          />
        </label>
        <div className="shoe-grid-selects">
          <label>
            <span className="sr-only">Brand</span>
            <select className="select" value={filters.brand} onChange={(event) => set({ brand: event.target.value })}>
              <option value="">All brands</option>
              {brands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Sort</span>
            <select className="select" value={filters.sort} onChange={(event) => set({ sort: event.target.value })}>
              {SORTS.map((sort) => (
                <option key={sort.id} value={sort.id}>
                  {sort.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="shoe-filters">
        <div className="chips" role="group" aria-label="Run type">
          {USES.map((use) => (
            <Chip key={use.id} on={filters.use === use.id} onClick={() => toggle("use", use.id)}>
              {use.label}
            </Chip>
          ))}
        </div>
        <div className="chips" role="group" aria-label="Feel and support">
          {CUSHIONS.map((cushion) => (
            <Chip key={cushion.id} on={filters.cushion === cushion.id} onClick={() => toggle("cushion", cushion.id)}>
              {cushion.label}
            </Chip>
          ))}
          <span className="chip-gap" aria-hidden="true" />
          {SUPPORTS.map((support) => (
            <Chip key={support.id} on={filters.support === support.id} onClick={() => toggle("support", support.id)}>
              {support.label}
            </Chip>
          ))}
          <span className="chip-gap" aria-hidden="true" />
          <Chip on={filters.wide} onClick={() => set({ wide: !filters.wide })}>
            Wide toe box
          </Chip>
          <span className="chip-gap" aria-hidden="true" />
          {PRICES.map((price) => (
            <Chip key={price} on={filters.max === price} onClick={() => set({ max: filters.max === price ? 0 : price })}>
              Under ${price}
            </Chip>
          ))}
        </div>
      </div>

      <div className="shoe-grid-count" aria-live="polite">
        <span>
          <b className="clock">{results.length}</b> {results.length === 1 ? "shoe" : "shoes"}
          {active ? " match" : ""}
        </span>
        {active ? (
          <button type="button" className="text-button" onClick={() => setFilters({ ...EMPTY_FILTERS, sort: filters.sort })}>
            Clear filters
          </button>
        ) : null}
      </div>

      {results.length ? (
        <div className="bib-grid">
          {visible.map((shoe, i) => (
            <ShoeBib key={shoe.id} shoe={shoe} number={i + 1} eager={i < 4} />
          ))}
        </div>
      ) : (
        <div className="empty">
          <p>No shoe matches all of that.</p>
          <button type="button" className="btn" onClick={() => setFilters({ ...EMPTY_FILTERS, q: filters.q })}>
            Keep the search, drop the filters
          </button>
        </div>
      )}

      {!unlocked && results.length > FREE_CARDS ? (
        <>
          <div className="bib-grid shoe-grid-teaser" aria-hidden="true">
            {teaser.map((shoe, i) => (
              <div key={shoe.id} className="shoe-grid-teaser-card">
                <ShoeBib shoe={shoe} number={FREE_CARDS + i + 1} />
              </div>
            ))}
          </div>
          <div className="wall">
            {loading ? (
              <div className="account-gate account-gate-loading" aria-busy="true" />
            ) : (
              <SignupCard unlocks={`all ${results.length} ${active ? "matching shoes" : "shoes"}`} tool="shoes" />
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
