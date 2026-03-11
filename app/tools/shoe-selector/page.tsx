"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { shoes as fallbackShoes, shoeOptions } from "@/lib/data";
import type { Shoe } from "@/lib/data";
import { scoreShoe, mapDbShoe, type DbShoe } from "@/lib/shoe-utils";
import SaveButton from "@/components/save-button";
import { getSupabaseClient } from "@/lib/supabase-client";

const sortOptions = [
  { id: "match", label: "Best match" },
  { id: "price_low", label: "Price: low to high" },
  { id: "price_high", label: "Price: high to low" },
  { id: "popularity", label: "Most popular" }
];

const maxResults = 10;

const labelOverrides: Record<string, string> = {
  daily_trainer: "Daily trainer",
  long_run: "Long run",
  speed_work: "Speed work",
  race_day: "Race day",
  trail_running: "Trail running",
  recovery_runs: "Recovery runs",
  trail_groomed: "Trail (groomed)",
  trail_technical: "Trail (technical)",
  motion_control: "Motion control",
  extra_wide: "Extra wide"
};

const prettyLabel = (value: string) => {
  if (labelOverrides[value]) {
    return labelOverrides[value];
  }
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const joinLabels = (values: string[]) => values.map(prettyLabel).join(", ");

const formatRating = (popularity: number) => {
  const raw = popularity ? popularity / 10 : 1;
  const rating = Math.min(10, Math.max(1, raw));
  return rating.toFixed(1);
};

export default function ShoeSelectorPage() {
  const [allShoes, setAllShoes] = useState<Shoe[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const [usageTypes, setUsageTypes] = useState<string[]>([]);
  const [footStrike, setFootStrike] = useState("not_sure");
  const [cadence, setCadence] = useState("average");
  const [toeBox, setToeBox] = useState("standard");
  const [cushion, setCushion] = useState("moderate");
  const [stability, setStability] = useState("neutral");
  const surfaces: string[] = [];
  const [weight, setWeight] = useState("155");
  const [weightUnit, setWeightUnit] = useState("lb");
  const [brandFilter, setBrandFilter] = useState("all");
  const [priceMax, setPriceMax] = useState(300);
  const [sortBy, setSortBy] = useState("match");
  const [search, setSearch] = useState("");
  const [newOnly, setNewOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareNotice, setCompareNotice] = useState("");
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.sessionStorage.getItem("shoe-selector-state-v1");
    if (!raw) {
      setRestored(true);
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      setUsageTypes(Array.isArray(parsed.usageTypes) ? parsed.usageTypes : []);
      setFootStrike(parsed.footStrike || "not_sure");
      setCadence(parsed.cadence || "average");
      setToeBox(parsed.toeBox || "standard");
      setCushion(parsed.cushion || "moderate");
      setStability(parsed.stability || "neutral");
      setWeight(parsed.weight || "155");
      setWeightUnit(parsed.weightUnit || "lb");
      setBrandFilter(parsed.brandFilter || "all");
      setPriceMax(Number(parsed.priceMax || 300));
      setSortBy(parsed.sortBy || "match");
      setSearch(parsed.search || "");
      setNewOnly(Boolean(parsed.newOnly));
      setShowAll(Boolean(parsed.showAll));
      setCompareIds(Array.isArray(parsed.compareIds) ? parsed.compareIds : []);
    } catch {
      // ignore parse errors and use defaults
    } finally {
      setRestored(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !restored) return;
    const payload = {
      usageTypes,
      footStrike,
      cadence,
      toeBox,
      cushion,
      stability,
      weight,
      weightUnit,
      brandFilter,
      priceMax,
      sortBy,
      search,
      newOnly,
      filtersOpen,
      showAll,
      compareIds
    };
    window.sessionStorage.setItem(
      "shoe-selector-state-v1",
      JSON.stringify(payload)
    );
  }, [
    usageTypes,
    footStrike,
    cadence,
    toeBox,
    cushion,
    stability,
    weight,
    weightUnit,
    brandFilter,
    priceMax,
    sortBy,
    search,
    newOnly,
    filtersOpen,
    showAll,
    compareIds,
    restored
  ]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setAllShoes(fallbackShoes);
      setLoading(false);
      return;
    }

    let active = true;

    supabase
      .from("shoe_models")
      .select("*")
      .eq("is_active", true)
      .then(({ data, error }) => {
        if (!active) return;
        if (error || !data?.length) {
          setAllShoes(fallbackShoes);
        } else {
          const today = new Date().toISOString().split("T")[0];
          const mapped = (data as DbShoe[]).map(mapDbShoe).filter((shoe) => {
            // Hide unreleased shoes (release_date in the future)
            if (shoe.releaseDate && shoe.releaseDate > today) return false;
            // Hide skeleton entries with no real specs
            if (!shoe.price && !shoe.description) return false;
            return true;
          });
          setAllShoes(mapped);
        }
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const brands = useMemo(() => {
    return ["all", ...Array.from(new Set(allShoes.map((shoe) => shoe.brand))).sort()];
  }, [allShoes]);

  const toggleMulti = (
    list: string[],
    value: string,
    setter: (value: string[]) => void
  ) => {
    setter(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  };

  const weightLbs = useMemo(() => {
    const parsed = Number(weight);
    if (!parsed) return undefined;
    return weightUnit === "kg" ? parsed * 2.205 : parsed;
  }, [weight, weightUnit]);

  const hasAnyCriteria = useMemo(() => {
    return (
      usageTypes.length > 0 ||
      footStrike !== "not_sure" ||
      cadence !== "average" ||
      toeBox !== "standard" ||
      cushion !== "moderate" ||
      stability !== "neutral"
    );
  }, [usageTypes, footStrike, cadence, toeBox, cushion, stability]);

  const scoredResults = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();
    const scored = allShoes
      .map((shoe) =>
        scoreShoe(shoe, {
          usageTypes,
          footStrike,
          cadence,
          toeBox,
          cushion,
          stability,
          surfaces: [],
          weight: weightLbs
        })
      )
      .filter((shoe) => (brandFilter === "all" ? true : shoe.brand === brandFilter))
      .filter((shoe) => shoe.price <= priceMax)
      .filter((shoe) => (newOnly ? Boolean(shoe.isNew) : true))
      .filter((shoe) => {
        if (!searchTerm) return true;
        return (
          shoe.name.toLowerCase().includes(searchTerm) ||
          shoe.brand.toLowerCase().includes(searchTerm)
        );
      });

    const sorted = [...scored].sort((a, b) => {
      if (sortBy === "price_low") return a.price - b.price;
      if (sortBy === "price_high") return b.price - a.price;
      if (sortBy === "popularity") return b.popularity - a.popularity;
      if (b.score === a.score) return b.popularity - a.popularity;
      return b.score - a.score;
    });

    const limit = showAll ? sorted.length : maxResults;
    return {
      total: sorted.length,
      list: sorted.slice(0, limit)
    };
  }, [
    allShoes,
    usageTypes,
    footStrike,
    cadence,
    toeBox,
    cushion,
    stability,
    weightLbs,
    brandFilter,
    priceMax,
    sortBy,
    search,
    newOnly,
    showAll
  ]);

  const compareShoes = useMemo(() => {
    const map = new Map(allShoes.map((shoe) => [shoe.id, shoe]));
    return compareIds
      .map((id) => map.get(id))
      .filter(Boolean) as Shoe[];
  }, [allShoes, compareIds]);

  const toggleCompare = (shoeId: string) => {
    setCompareNotice("");
    setCompareIds((current) => {
      if (current.includes(shoeId)) {
        return current.filter((id) => id !== shoeId);
      }
      if (current.length >= 2) {
        setCompareNotice("Select up to two shoes to compare. Remove one to add another.");
        return current;
      }
      return [...current, shoeId];
    });
  };

  const compareRows = [
    {
      label: "Match",
      value: (shoe: Shoe) => {
        if (!hasAnyCriteria) return "N/A";
        const score = scoreShoe(shoe, {
          usageTypes,
          footStrike,
          cadence,
          toeBox,
          cushion,
          stability,
          surfaces: [],
          weight: weightLbs
        }).score;
        return `${score}%`;
      }
    },
    {
      label: "Price",
      value: (shoe: Shoe) => (shoe.price ? `$${shoe.price}` : "TBD")
    },
    {
      label: "Rating",
      value: (shoe: Shoe) => formatRating(shoe.popularity)
    },
    {
      label: "Usage type",
      value: (shoe: Shoe) =>
        shoe.usageTypes.length ? joinLabels(shoe.usageTypes) : "—"
    },
    {
      label: "Cushion",
      value: (shoe: Shoe) => prettyLabel(shoe.cushion)
    },
    {
      label: "Support",
      value: (shoe: Shoe) => prettyLabel(shoe.stability)
    },
    {
      label: "Drop",
      value: (shoe: Shoe) => (shoe.drop ? `${shoe.drop} mm` : "TBD")
    },
    {
      label: "Stack",
      value: (shoe: Shoe) => (shoe.stack ? `${shoe.stack} mm` : "TBD")
    },
    {
      label: "Weight (men's)",
      value: (shoe: Shoe) => (shoe.weightMens ? `${shoe.weightMens} oz` : "TBD")
    },
    {
      label: "Weight (women's)",
      value: (shoe: Shoe) => (shoe.weightWomens ? `${shoe.weightWomens} oz` : "TBD")
    },
    {
      label: "Release",
      value: (shoe: Shoe) =>
        shoe.releaseYear ? String(shoe.releaseYear) : shoe.release ?? "TBD"
    }
  ];

  return (
    <div>
      <section className="tool-hero container">
        <h1>Shoe Selector</h1>
        <p>
          Filter by stride and cadence, then compare recommendations in a table
          below.
        </p>
      </section>

      <section className="section container">
        <div className="stack">
          <div className="card">
            <div className="stack">
              <strong>Filters</strong>
              <div className="filter-bar">
                <div className="filter-group">
                  <span className="label">Search</span>
                  <input
                    className="input"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by shoe or brand"
                  />
                </div>
                <div className="filter-group">
                  <span className="label">Brand</span>
                  <select
                    className="select"
                    value={brandFilter}
                    onChange={(event) => setBrandFilter(event.target.value)}
                  >
                    {brands.map((brand) => (
                      <option key={brand} value={brand}>
                        {brand === "all" ? "All brands" : brand}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="filter-group">
                  <span className="label">Max price</span>
                  <input
                    className="input"
                    type="number"
                    value={priceMax}
                    onChange={(event) => setPriceMax(Number(event.target.value))}
                    min={90}
                    max={320}
                  />
                </div>
                <div className="filter-group">
                  <span className="label">Sort</span>
                  <select
                    className="select"
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value)}
                  >
                    {sortOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="filter-actions">
                  <label className="chip">
                    <input
                      type="checkbox"
                      checked={newOnly}
                      onChange={(event) => setNewOnly(event.target.checked)}
                    />
                    New releases only
                  </label>
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={() => setFiltersOpen((current) => !current)}
                  >
                    {filtersOpen ? "Hide Advanced Filters" : "Show Advanced Filters"}
                  </button>
                </div>
              </div>

              <div style={{ marginTop: "16px" }}>
                <span className="label">Usage type</span>
                <div className="chip-group">
                  {shoeOptions.usageTypes.map((option) => (
                    <label key={option.id} className="chip">
                      <input
                        type="checkbox"
                        checked={usageTypes.includes(option.id)}
                        onChange={() =>
                          toggleMulti(usageTypes, option.id, setUsageTypes)
                        }
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </div>

              {filtersOpen ? (
                <div className="filter-panel">
                  <div className="filter-row">
                    <div className="filter-group">
                      <span className="label">Foot strike</span>
                      <select
                        className="select"
                        value={footStrike}
                        onChange={(event) => setFootStrike(event.target.value)}
                      >
                        {shoeOptions.footStrike.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="filter-group">
                      <span className="label">Cadence</span>
                      <select
                        className="select"
                        value={cadence}
                        onChange={(event) => setCadence(event.target.value)}
                      >
                        {shoeOptions.cadence.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="filter-group">
                      <span className="label">Toe box</span>
                      <select
                        className="select"
                        value={toeBox}
                        onChange={(event) => setToeBox(event.target.value)}
                      >
                        {shoeOptions.toeBox.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="filter-group">
                      <span className="label">Cushion</span>
                      <select
                        className="select"
                        value={cushion}
                        onChange={(event) => setCushion(event.target.value)}
                      >
                        {shoeOptions.cushion.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="filter-group">
                      <span className="label">Stability</span>
                      <select
                        className="select"
                        value={stability}
                        onChange={(event) => setStability(event.target.value)}
                      >
                        {shoeOptions.stability.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="filter-group">
                      <span className="label">Weight (optional)</span>
                      <div style={{ display: "flex", gap: "12px" }}>
                        <input
                          className="input"
                          type="number"
                          min="80"
                          max="260"
                          value={weight}
                          onChange={(event) => setWeight(event.target.value)}
                        />
                        <select
                          className="select"
                          value={weightUnit}
                          onChange={(event) => setWeightUnit(event.target.value)}
                          style={{ maxWidth: "90px" }}
                        >
                          <option value="lb">lb</option>
                          <option value="kg">kg</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {loading ? (
            <div className="card card-outline">Loading shoe catalog...</div>
          ) : (
            <div className="stack">
              {compareIds.length ? (
                <div className="card">
                  <div className="stack">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "12px",
                        flexWrap: "wrap"
                      }}
                    >
                      <div>
                        <strong>Compare models</strong>
                        <div className="brand-sub">
                          Select two shoes to compare key specs.
                        </div>
                      </div>
                      <button
                        className="btn btn-ghost btn-sm"
                        type="button"
                        onClick={() => setCompareIds([])}
                      >
                        Clear comparison
                      </button>
                    </div>
                    {compareNotice ? <div className="notice">{compareNotice}</div> : null}
                    {compareIds.length < 2 ? (
                      <div className="brand-sub">
                        Select one more shoe to see a side-by-side comparison.
                      </div>
                    ) : null}
                    <div className="table-wrap">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Spec</th>
                            {compareShoes.map((shoe) => (
                              <th key={shoe.id}>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    justifyContent: "space-between",
                                    gap: "12px"
                                  }}
                                >
                                  <div>
                                    {shoe.name}
                                    <div className="brand-sub">{shoe.brand}</div>
                                  </div>
                                  <Link
                                    className="btn btn-xs btn-ghost"
                                    href={`/shoes/${shoe.id}`}
                                  >
                                    Analyze
                                  </Link>
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {compareRows.map((row) => (
                            <tr key={row.label}>
                              <td>
                                <strong>{row.label}</strong>
                              </td>
                              {compareShoes.map((shoe) => (
                                <td key={`${shoe.id}-${row.label}`}>
                                  {row.value(shoe)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : null}
              {!hasAnyCriteria && (
                <div className="notice" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "1.5rem" }}>&#x1f3af;</span>
                  <div>
                    <strong>Select your preferences to see match scores.</strong>{" "}
                    Pick a usage type above, or open Advanced Filters to set foot strike, cushion, and more.
                    The more you tell us, the better your match percentages.
                  </div>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <strong>Recommendations</strong>
                  <div className="brand-sub">
                    Showing {scoredResults.list.length} of {scoredResults.total} matches
                  </div>
                </div>
                <span className="badge">Sorted by {sortOptions.find((option) => option.id === sortBy)?.label}</span>
              </div>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Match %</th>
                      <th>Shoe</th>
                      <th>Best for</th>
                      <th>Rating</th>
                      <th>Cushion</th>
                      <th>Support</th>
                      <th>Price</th>
                      <th>Save</th>
                      <th>Compare</th>
                      <th>Analyze</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scoredResults.list.length === 0 ? (
                      <tr>
                        <td colSpan={10}>No matches yet. Try adjusting your filters.</td>
                      </tr>
                    ) : (
                      scoredResults.list.map((shoe) => (
                        <tr key={shoe.id}>
                          <td>
                            {hasAnyCriteria ? (
                              <span className="score">{shoe.score}%</span>
                            ) : (
                              <span className="score score-muted">N/A</span>
                            )}
                          </td>
                          <td>
                            <strong>{shoe.name}</strong>
                            <div className="brand-sub">{shoe.brand}</div>
                            {shoe.isNew ? (
                              <span className="badge">New {shoe.release ?? ""}</span>
                            ) : null}
                          </td>
                          <td>{joinLabels(shoe.usageTypes)}</td>
                          <td>{formatRating(shoe.popularity)}</td>
                          <td>{prettyLabel(shoe.cushion)}</td>
                          <td>{prettyLabel(shoe.stability)}</td>
                          <td>{shoe.price ? `$${shoe.price}` : "TBD"}</td>
                          <td>
                            <SaveButton
                              itemType="shoe"
                              itemId={shoe.id}
                              label={`${shoe.name} (${shoe.brand})`}
                              metadata={{ brand: shoe.brand, price: shoe.price }}
                            />
                          </td>
                          <td>
                            <button
                              className={`btn btn-sm ${
                                compareIds.includes(shoe.id)
                                  ? "btn-primary"
                                  : "btn-ghost"
                              }`}
                              type="button"
                              onClick={() => toggleCompare(shoe.id)}
                            >
                              {compareIds.includes(shoe.id) ? "Comparing" : "Compare"}
                            </button>
                          </td>
                          <td>
                            <Link className="btn btn-sm btn-ghost" href={`/shoes/${shoe.id}`}>
                              Analyze
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {!showAll && scoredResults.total > maxResults ? (
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => setShowAll(true)}
                >
                  Show all {scoredResults.total} matches
                </button>
              ) : null}
              {showAll && scoredResults.total > maxResults ? (
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => setShowAll(false)}
                >
                  Show top {maxResults} only
                </button>
              ) : null}
            </div>
          )}

          <div className="notice">
            Want to save favorites? Create a free account for saved shoes and
            alerts on new releases.
          </div>
          <Link className="btn btn-ghost" href="/tools/attire-guide">
            Next tool: Attire Guide
          </Link>
        </div>
      </section>
    </div>
  );
}
