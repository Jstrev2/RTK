"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { shoes as fallbackShoes, shoeOptions } from "@/lib/data";
import type { Shoe } from "@/lib/data";
import {
  scoreShoe,
  mapDbShoe,
  prettyLabel,
  type DbShoe,
  type Pronation,
  type Mileage
} from "@/lib/shoe-utils";
import SaveButton from "@/components/save-button";
import BuyLinks from "@/components/buy-links";
import { getSupabaseClient } from "@/lib/supabase-client";

const sortOptions = [
  { id: "match", label: "Best match" },
  { id: "price_low", label: "Price: low to high" },
  { id: "price_high", label: "Price: high to low" },
  { id: "popularity", label: "Most popular" }
];

const maxResults = 10;

const pronationOptions: { id: Pronation; label: string }[] = [
  { id: "not_sure", label: "Not sure" },
  { id: "neutral", label: "Neutral" },
  { id: "mild_overpronation", label: "Mild overpronation" },
  { id: "severe_overpronation", label: "Significant overpronation" }
];

const mileageOptions: { id: Mileage; label: string }[] = [
  { id: "", label: "Prefer not to say" },
  { id: "under_15", label: "Under 15 mi / week" },
  { id: "15_to_35", label: "15–35 mi / week" },
  { id: "over_35", label: "35+ mi / week" }
];

const cushionFeelOptions = [
  { id: "", label: "No preference" },
  { id: "minimal", label: "Firm & fast (ground feel)" },
  { id: "moderate", label: "Balanced" },
  { id: "maximum", label: "Plush & protective" }
];

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
  const [pronation, setPronation] = useState<Pronation>("not_sure");
  const [footStrike, setFootStrike] = useState("not_sure");
  const [cushion, setCushion] = useState("");
  const [toeBox, setToeBox] = useState("standard");
  const [mileage, setMileage] = useState<Mileage>("");
  const [weight, setWeight] = useState("");
  const [weightUnit, setWeightUnit] = useState("lb");
  const [brandFilter, setBrandFilter] = useState("all");
  const [priceMax, setPriceMax] = useState(300);
  const [sortBy, setSortBy] = useState("match");
  const [search, setSearch] = useState("");
  const [newOnly, setNewOnly] = useState(false);
  const [profileOpen, setProfileOpen] = useState(true);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareNotice, setCompareNotice] = useState("");
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.sessionStorage.getItem("shoe-selector-state-v2");
    if (!raw) {
      setRestored(true);
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      setUsageTypes(Array.isArray(parsed.usageTypes) ? parsed.usageTypes : []);
      setPronation(parsed.pronation || "not_sure");
      setFootStrike(parsed.footStrike || "not_sure");
      setCushion(parsed.cushion || "");
      setToeBox(parsed.toeBox || "standard");
      setMileage(parsed.mileage || "");
      setWeight(parsed.weight || "");
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
      pronation,
      footStrike,
      cushion,
      toeBox,
      mileage,
      weight,
      weightUnit,
      brandFilter,
      priceMax,
      sortBy,
      search,
      newOnly,
      showAll,
      compareIds
    };
    window.sessionStorage.setItem(
      "shoe-selector-state-v2",
      JSON.stringify(payload)
    );
  }, [
    usageTypes,
    pronation,
    footStrike,
    cushion,
    toeBox,
    mileage,
    weight,
    weightUnit,
    brandFilter,
    priceMax,
    sortBy,
    search,
    newOnly,
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

  const usageOptions = useMemo(
    () => shoeOptions.usageTypes.filter((option) => option.id !== "trail_running"),
    []
  );

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
      pronation !== "not_sure" ||
      footStrike !== "not_sure" ||
      cushion !== "" ||
      toeBox !== "standard" ||
      mileage !== ""
    );
  }, [usageTypes, pronation, footStrike, cushion, toeBox, mileage]);

  const scoringInput = useMemo(
    () => ({
      usageTypes,
      footStrike,
      pronation,
      cushion,
      toeBox,
      mileage,
      budget: priceMax < 300 ? priceMax : undefined,
      weight: weightLbs
    }),
    [usageTypes, footStrike, pronation, cushion, toeBox, mileage, priceMax, weightLbs]
  );

  const scoredResults = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();
    const scored = allShoes
      .map((shoe) => scoreShoe(shoe, scoringInput))
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
  }, [allShoes, scoringInput, brandFilter, priceMax, sortBy, search, newOnly, showAll]);

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
        return `${scoreShoe(shoe, scoringInput).score}%`;
      }
    },
    {
      label: "Price",
      value: (shoe: Shoe) => (shoe.price ? `$${shoe.price}` : "—")
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
      value: (shoe: Shoe) => (shoe.drop ? `${shoe.drop} mm` : "—")
    },
    {
      label: "Stack",
      value: (shoe: Shoe) => (shoe.stack ? `${shoe.stack} mm` : "—")
    },
    {
      label: "Weight (men's)",
      value: (shoe: Shoe) => (shoe.weightMens ? `${shoe.weightMens} oz` : "—")
    },
    {
      label: "Weight (women's)",
      value: (shoe: Shoe) => (shoe.weightWomens ? `${shoe.weightWomens} oz` : "—")
    },
    {
      label: "Release",
      value: (shoe: Shoe) =>
        shoe.releaseYear ? String(shoe.releaseYear) : shoe.release ?? "—"
    }
  ];

  return (
    <div className="tool-page tool-page-shoes">
      <section className="tool-hero container">
        <span className="eyebrow">Shoe Finder</span>
        <h1>Find the shoes that fit your run.</h1>
        <p>
          Tell us what you are training for, how you like a shoe to feel, what
          fits your foot, and what you want to spend. Get a short list with
          reasons—not 200 shoes to research.
        </p>
      </section>

      <section className="section container">
        <div className="stack">
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
                  <strong>Tell us about the run</strong>
                  <div className="brand-sub">
                    Each answer narrows the shortlist. Skip anything you do not know.
                  </div>
                </div>
                <button
                  className="btn btn-secondary btn-sm"
                  type="button"
                  onClick={() => setProfileOpen((current) => !current)}
                >
                  {profileOpen ? "Hide profile" : "Edit profile"}
                </button>
              </div>

              {profileOpen ? (
                <>
                  <div>
                    <span className="label">What runs are these shoes for?</span>
                    <div className="chip-group">
                      {usageOptions.map((option) => (
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

                  <div className="filter-row">
                    <div className="filter-group">
                      <span className="label">Support preference (optional)</span>
                      <select
                        className="select"
                        value={pronation}
                        onChange={(event) =>
                          setPronation(event.target.value as Pronation)
                        }
                      >
                        {pronationOptions.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <span className="brand-sub">Choose “Not sure” unless you already know what feels comfortable.</span>
                    </div>
                    <div className="filter-group">
                      <span className="label">Cushion feel</span>
                      <select
                        className="select"
                        value={cushion}
                        onChange={(event) => setCushion(event.target.value)}
                      >
                        {cushionFeelOptions.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="filter-group">
                      <span className="label">Weekly mileage</span>
                      <select
                        className="select"
                        value={mileage}
                        onChange={(event) =>
                          setMileage(event.target.value as Mileage)
                        }
                      >
                        {mileageOptions.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
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
                      <span className="label">Foot width</span>
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
                      <span className="label">Budget (max price)</span>
                      <input
                        className="input"
                        type="number"
                        value={priceMax}
                        onChange={(event) => setPriceMax(Number(event.target.value))}
                        min={90}
                        max={320}
                        step={10}
                      />
                    </div>
                    <div className="filter-group">
                      <span className="label">Body weight (optional)</span>
                      <div style={{ display: "flex", gap: "12px" }}>
                        <input
                          className="input"
                          type="number"
                          min="80"
                          max="350"
                          value={weight}
                          placeholder="e.g. 165"
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
                </>
              ) : null}

              <div className="divider" />
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
                </div>
              </div>
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
                  <div>
                    <strong>Start with the run you need this shoe to handle.</strong>{" "}
                    Add ride, fit, mileage, and budget preferences to narrow the shortlist.
                  </div>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <strong>Your shortlist</strong>
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
                      <th>Cushion</th>
                      <th>Support</th>
                      <th>Price</th>
                      <th>Shop</th>
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
                            {hasAnyCriteria && shoe.reasons.length ? (
                              <div className="brand-sub" style={{ marginTop: "4px" }}>
                                {shoe.reasons.join(" · ")}
                              </div>
                            ) : null}
                          </td>
                          <td>{joinLabels(shoe.usageTypes)}</td>
                          <td>{prettyLabel(shoe.cushion)}</td>
                          <td>{prettyLabel(shoe.stability)}</td>
                          <td>{shoe.price ? `$${shoe.price}` : "—"}</td>
                          <td>
                            <BuyLinks name={shoe.name} brand={shoe.brand} compact />
                          </td>
                          <td>
                            <SaveButton
                              itemType="shoe"
                              itemId={shoe.id}
                              label={`${shoe.name}`}
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
              <p className="brand-sub">
                Runner Toolkit may earn a commission when you buy through shop
                links. It never affects rankings.
              </p>
            </div>
          )}

          <div className="notice">
            Want to save favorites? Create a free account for saved shoes and
            alerts on new releases.
          </div>
          <div className="contextual-next">
            <span className="eyebrow">Planning race day?</span>
            <div>
              <strong>Turn your goal time into a practical fuel schedule.</strong>
              <Link className="text-link" href="/tools/fueling">Plan my fuel →</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
