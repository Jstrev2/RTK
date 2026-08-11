"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import BuyLinks from "@/components/buy-links";
import SaveButton from "@/components/save-button";
import { shoeOptions, shoes as fallbackShoes, type Shoe } from "@/lib/data";
import { getSupabaseClient } from "@/lib/supabase-client";
import {
  displayName,
  mapDbShoe,
  prettyLabel,
  scoreShoe,
  type DbShoe,
  type Mileage,
  type Pronation,
  type ScoredShoe
} from "@/lib/shoe-utils";

const usageChoices = [
  { id: "daily_trainer", label: "Everyday miles", description: "One dependable shoe for most runs." },
  { id: "long_run", label: "Long runs", description: "Comfort that holds up as miles add up." },
  { id: "speed_work", label: "Faster workouts", description: "A lighter, livelier feel for pace days." },
  { id: "race_day", label: "Race day", description: "Performance when the clock matters." },
  { id: "recovery_runs", label: "Easy recovery", description: "Protection and comfort on slower days." }
];

const cushionChoices = [
  { id: "", label: "Not sure", description: "Keep every ride style in play." },
  { id: "minimal", label: "Firm & fast", description: "More ground feel and snap." },
  { id: "moderate", label: "Balanced", description: "Comfort without feeling bulky." },
  { id: "maximum", label: "Plush", description: "Soft and protective underfoot." }
];

const fitChoices = [
  { id: "standard", label: "No special needs", description: "Standard fit; let comfort lead." },
  { id: "roomy", label: "More toe room", description: "Prioritize a wider forefoot." },
  { id: "support", label: "Extra support", description: "Add some guidance underfoot." },
  { id: "roomy_support", label: "Roomy + support", description: "Combine both preferences." }
];

const pronationOptions: Array<{ id: Pronation; label: string }> = [
  { id: "not_sure", label: "Not sure" },
  { id: "neutral", label: "Neutral" },
  { id: "mild_overpronation", label: "Mild overpronation" },
  { id: "severe_overpronation", label: "Severe overpronation" }
];

const mileageOptions: Array<{ id: Mileage; label: string }> = [
  { id: "", label: "No preference" },
  { id: "under_15", label: "Under 15 miles" },
  { id: "15_to_35", label: "15–35 miles" },
  { id: "over_35", label: "Over 35 miles" }
];

const sortOptions = [
  { id: "match", label: "Best match" },
  { id: "price_low", label: "Price: low to high" },
  { id: "price_high", label: "Price: high to low" },
  { id: "popular", label: "Most popular" }
];

const recommendationLabels = [
  { eyebrow: "Best match", title: "The strongest overall fit" },
  { eyebrow: "Best value", title: "A close match for less" },
  { eyebrow: "Different ride", title: "A good alternative feel" }
];

const sessionKey = "shoe-selector-state-v3";
const maxBrowseResults = 10;

const getFitProfile = (toeBox: string, pronation: Pronation) => {
  const roomy = toeBox === "wide" || toeBox === "extra_wide";
  const support =
    pronation === "mild_overpronation" || pronation === "severe_overpronation";
  if (roomy && support) return "roomy_support";
  if (roomy) return "roomy";
  if (support) return "support";
  return "standard";
};

const recommendationReason = (shoe: ScoredShoe, index: number) => {
  if (index === 1) {
    return shoe.reasons[0] || "A strong fit that leaves more room in your budget.";
  }
  if (index === 2) {
    return shoe.reasons[0] || "A credible alternative if you want a different feel underfoot.";
  }
  return shoe.reasons[0] || shoe.description || "The best balance of your run, ride and fit preferences.";
};

export default function ShoeSelectorPage() {
  const [allShoes, setAllShoes] = useState<Shoe[]>(fallbackShoes);
  const [loading, setLoading] = useState(true);
  const [usageTypes, setUsageTypes] = useState<string[]>(["daily_trainer"]);
  const [cushion, setCushion] = useState("moderate");
  const [toeBox, setToeBox] = useState("standard");
  const [pronation, setPronation] = useState<Pronation>("not_sure");
  const [mileage, setMileage] = useState<Mileage>("");
  const [footStrike, setFootStrike] = useState("not_sure");
  const [priceMax, setPriceMax] = useState(300);
  const [weight, setWeight] = useState("");
  const [weightUnit, setWeightUnit] = useState<"lb" | "kg">("lb");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("all");
  const [sortBy, setSortBy] = useState("match");
  const [newOnly, setNewOnly] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareNotice, setCompareNotice] = useState("");
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(sessionKey);
      if (raw) {
        const saved = JSON.parse(raw);
        if (Array.isArray(saved.usageTypes)) setUsageTypes(saved.usageTypes);
        if (typeof saved.cushion === "string") setCushion(saved.cushion);
        if (typeof saved.toeBox === "string") setToeBox(saved.toeBox);
        if (typeof saved.pronation === "string") setPronation(saved.pronation);
        if (typeof saved.mileage === "string") setMileage(saved.mileage);
        if (typeof saved.footStrike === "string") setFootStrike(saved.footStrike);
        if (typeof saved.priceMax === "number") setPriceMax(saved.priceMax);
        if (typeof saved.weight === "string") setWeight(saved.weight);
        if (saved.weightUnit === "kg" || saved.weightUnit === "lb") {
          setWeightUnit(saved.weightUnit);
        }
        if (typeof saved.advancedOpen === "boolean") setAdvancedOpen(saved.advancedOpen);
        if (typeof saved.catalogOpen === "boolean") setCatalogOpen(saved.catalogOpen);
      }
    } catch {
      window.sessionStorage.removeItem(sessionKey);
    } finally {
      setRestored(true);
    }
  }, []);

  useEffect(() => {
    if (!restored) return;
    window.sessionStorage.setItem(
      sessionKey,
      JSON.stringify({
        usageTypes,
        cushion,
        toeBox,
        pronation,
        mileage,
        footStrike,
        priceMax,
        weight,
        weightUnit,
        advancedOpen,
        catalogOpen
      })
    );
  }, [
    restored,
    usageTypes,
    cushion,
    toeBox,
    pronation,
    mileage,
    footStrike,
    priceMax,
    weight,
    weightUnit,
    advancedOpen,
    catalogOpen
  ]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    let active = true;
    supabase
      .from("shoe_models")
      .select(
        "id,item_key,name,brand,price,usage_types,foot_strike,cadence,toe_box,cushion,stability,surfaces,weight_range,stack,drop,weight_mens,weight_womens,description,pros,cons,popularity,release_date,release_year,product_url,retailer_url,image_url,is_active"
      )
      .eq("is_active", true)
      .then(({ data, error }) => {
        if (!active) return;
        if (!error && data?.length) {
          setAllShoes((data as DbShoe[]).map(mapDbShoe));
        }
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const weightInPounds = useMemo(() => {
    const parsed = Number(weight);
    if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
    return weightUnit === "kg" ? parsed * 2.20462 : parsed;
  }, [weight, weightUnit]);

  const scoredShoes = useMemo(
    () =>
      allShoes
        .map((shoe) =>
          scoreShoe(shoe, {
            usageTypes,
            cushion,
            toeBox,
            pronation,
            mileage,
            footStrike,
            budget: priceMax,
            weight: weightInPounds
          })
        )
        .filter((shoe) => !priceMax || !shoe.price || shoe.price <= priceMax)
        .sort((a, b) => b.score - a.score || b.popularity - a.popularity),
    [
      allShoes,
      usageTypes,
      cushion,
      toeBox,
      pronation,
      mileage,
      footStrike,
      priceMax,
      weightInPounds
    ]
  );

  const recommendations = useMemo(() => {
    if (!scoredShoes.length) return [];
    const best = scoredShoes[0];
    const closeMatches = scoredShoes
      .filter((shoe) => shoe.id !== best.id && shoe.score >= best.score - 10)
      .sort((a, b) => {
        const aPrice = a.price || Number.MAX_SAFE_INTEGER;
        const bPrice = b.price || Number.MAX_SAFE_INTEGER;
        return aPrice - bPrice || b.score - a.score;
      });
    const value =
      closeMatches[0] || scoredShoes.find((shoe) => shoe.id !== best.id);
    const usedIds = new Set([best.id, value?.id]);
    const alternative =
      scoredShoes.find(
        (shoe) =>
          !usedIds.has(shoe.id) &&
          (shoe.cushion !== best.cushion || shoe.stability !== best.stability)
      ) || scoredShoes.find((shoe) => !usedIds.has(shoe.id));
    return [best, value, alternative].filter(Boolean) as ScoredShoe[];
  }, [scoredShoes]);

  const brands = useMemo(
    () => Array.from(new Set(allShoes.map((shoe) => shoe.brand))).sort(),
    [allShoes]
  );

  const catalogShoes = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const filtered = scoredShoes.filter((shoe) => {
      const matchesSearch =
        !needle ||
        displayName(shoe).toLowerCase().includes(needle) ||
        shoe.description.toLowerCase().includes(needle);
      const matchesBrand = brandFilter === "all" || shoe.brand === brandFilter;
      const matchesRelease = !newOnly || shoe.isNew;
      return matchesSearch && matchesBrand && matchesRelease;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "price_low") return (a.price || 9999) - (b.price || 9999);
      if (sortBy === "price_high") return b.price - a.price;
      if (sortBy === "popular") return b.popularity - a.popularity;
      return b.score - a.score || b.popularity - a.popularity;
    });
  }, [scoredShoes, search, brandFilter, newOnly, sortBy]);

  const comparedShoes = compareIds
    .map((id) => scoredShoes.find((shoe) => shoe.id === id))
    .filter(Boolean) as ScoredShoe[];

  const fitProfile = getFitProfile(toeBox, pronation);

  const chooseFit = (id: string) => {
    if (id === "roomy" || id === "roomy_support") {
      setToeBox("wide");
    } else {
      setToeBox("standard");
    }
    if (id === "support" || id === "roomy_support") {
      setPronation("mild_overpronation");
    } else {
      setPronation("not_sure");
    }
  };

  const toggleCompare = (id: string) => {
    setCompareNotice("");
    setCompareIds((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= 2) {
        setCompareNotice("Choose up to two shoes. Remove one to compare another.");
        return current;
      }
      return [...current, id];
    });
  };

  const resetQuickChoices = () => {
    setUsageTypes(["daily_trainer"]);
    setCushion("moderate");
    setToeBox("standard");
    setPronation("not_sure");
    setMileage("");
    setFootStrike("not_sure");
    setPriceMax(300);
    setWeight("");
    setAdvancedOpen(false);
  };

  return (
    <div className="page-shell shoe-finder-simple">
      <section className="container tool-hero tool-hero-simple">
        <div className="eyebrow">Free shoe finder</div>
        <h1>Three answers. Three shoes worth considering.</h1>
        <p className="lead">
          Tell us what the shoe needs to do, how you want it to feel, and whether
          your feet need anything special. We will narrow the catalog for you.
        </p>
      </section>

      <section className="container shoe-quick-card" aria-labelledby="quick-fit-title">
        <div className="shoe-quick-heading">
          <div>
            <span className="shoe-step-count">3 quick choices</span>
            <h2 id="quick-fit-title">Start with what you know</h2>
          </div>
          <button className="text-button" type="button" onClick={resetQuickChoices}>
            Reset
          </button>
        </div>

        <fieldset className="shoe-question">
          <legend className="shoe-question-label">
            <span>1</span> What is this shoe&apos;s main job?
          </legend>
          <div className="choice-grid choice-grid-use">
            {usageChoices.map((choice) => {
              const selected = usageTypes[0] === choice.id;
              return (
                <button
                  key={choice.id}
                  type="button"
                  className={selected ? "choice-tile choice-tile-selected" : "choice-tile"}
                  aria-pressed={selected}
                  onClick={() => setUsageTypes([choice.id])}
                >
                  <strong>{choice.label}</strong>
                  <span>{choice.description}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="shoe-question">
          <legend className="shoe-question-label">
            <span>2</span> How should it feel?
          </legend>
          <div className="choice-grid">
            {cushionChoices.map((choice) => {
              const selected = cushion === choice.id;
              return (
                <button
                  key={choice.label}
                  type="button"
                  className={selected ? "choice-tile choice-tile-selected" : "choice-tile"}
                  aria-pressed={selected}
                  onClick={() => setCushion(choice.id)}
                >
                  <strong>{choice.label}</strong>
                  <span>{choice.description}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="shoe-question">
          <legend className="shoe-question-label">
            <span>3</span> Anything your feet need?
          </legend>
          <div className="choice-grid">
            {fitChoices.map((choice) => {
              const selected = fitProfile === choice.id;
              return (
                <button
                  key={choice.id}
                  type="button"
                  className={selected ? "choice-tile choice-tile-selected" : "choice-tile"}
                  aria-pressed={selected}
                  onClick={() => chooseFit(choice.id)}
                >
                  <strong>{choice.label}</strong>
                  <span>{choice.description}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="shoe-quick-actions">
          <button
            className="btn btn-ghost"
            type="button"
            aria-expanded={advancedOpen}
            onClick={() => setAdvancedOpen((open) => !open)}
          >
            {advancedOpen ? "Hide fine-tuning" : "Fine-tune my matches"}
          </button>
          <span>You can skip this if the three answers feel right.</span>
        </div>

        {advancedOpen && (
          <div className="shoe-advanced-panel">
            <label>
              Exact support need
              <select
                value={pronation}
                onChange={(event) => setPronation(event.target.value as Pronation)}
              >
                {pronationOptions.map((option) => (
                  <option key={option.id} value={option.id}>{option.label}</option>
                ))}
              </select>
            </label>
            <label>
              Toe-box width
              <select value={toeBox} onChange={(event) => setToeBox(event.target.value)}>
                {shoeOptions.toeBox.map((option) => (
                  <option key={option.id} value={option.id}>{option.label}</option>
                ))}
              </select>
            </label>
            <label>
              Weekly mileage
              <select
                value={mileage}
                onChange={(event) => setMileage(event.target.value as Mileage)}
              >
                {mileageOptions.map((option) => (
                  <option key={option.id} value={option.id}>{option.label}</option>
                ))}
              </select>
            </label>
            <label>
              Foot strike
              <select value={footStrike} onChange={(event) => setFootStrike(event.target.value)}>
                {shoeOptions.footStrike.map((option) => (
                  <option key={option.id} value={option.id}>{option.label}</option>
                ))}
              </select>
            </label>
            <label>
              Maximum price
              <div className="input-prefix">
                <span>$</span>
                <input
                  type="number"
                  min="50"
                  max="500"
                  step="10"
                  value={priceMax}
                  onChange={(event) => setPriceMax(Number(event.target.value) || 300)}
                />
              </div>
            </label>
            <label>
              Body weight <small>(optional)</small>
              <div className="input-pair">
                <input
                  type="number"
                  min="1"
                  value={weight}
                  placeholder="e.g. 165"
                  onChange={(event) => setWeight(event.target.value)}
                />
                <select
                  aria-label="Weight unit"
                  value={weightUnit}
                  onChange={(event) => setWeightUnit(event.target.value as "lb" | "kg")}
                >
                  <option value="lb">lb</option>
                  <option value="kg">kg</option>
                </select>
              </div>
            </label>
          </div>
        )}
      </section>

      <section className="container section-block" aria-labelledby="recommendations-title">
        <div className="shoe-recommendation-heading">
          <div>
            <div className="eyebrow">Your short list</div>
            <h2 id="recommendations-title">Start with these three</h2>
            <p>Each fills a different role, so you can decide without sorting a spreadsheet.</p>
          </div>
          <span className="shoe-confidence">{loading ? "Refreshing catalog…" : "Updated instantly"}</span>
        </div>

        {recommendations.length ? (
          <div className="shoe-recommendation-grid">
            {recommendations.map((shoe, index) => {
              const label = recommendationLabels[index];
              return (
                <article
                  className={"shoe-recommendation-card shoe-recommendation-card-" + (index + 1)}
                  key={shoe.id}
                >
                  <div className="shoe-recommendation-top">
                    <span className="shoe-role">{label.eyebrow}</span>
                    {shoe.isNew && <span className="tag">New</span>}
                  </div>
                  <p className="shoe-card-kicker">{label.title}</p>
                  <h3>{displayName(shoe)}</h3>
                  <p className="shoe-reason">{recommendationReason(shoe, index)}</p>
                  <div className="shoe-tags">
                    <span>{prettyLabel(shoe.cushion)} cushion</span>
                    <span>{prettyLabel(shoe.stability)}</span>
                    <span>{prettyLabel(shoe.usageTypes[0] || "daily_trainer")}</span>
                  </div>
                  <div className="shoe-tradeoff">
                    <strong>Know before you buy</strong>
                    <span>{shoe.cons[0] || "Try the fit before committing to long mileage."}</span>
                  </div>
                  <div className="shoe-recommendation-footer">
                    <span className="shoe-price">{shoe.price ? "$" + shoe.price : "See retailer"}</span>
                    <div className="shoe-card-actions">
                      <Link className="btn btn-primary btn-sm" href={"/shoes/" + shoe.id}>
                        See details
                      </Link>
                      <button
                        className="btn btn-ghost btn-sm"
                        type="button"
                        aria-pressed={compareIds.includes(shoe.id)}
                        onClick={() => toggleCompare(shoe.id)}
                      >
                        {compareIds.includes(shoe.id) ? "Comparing" : "Compare"}
                      </button>
                    </div>
                  </div>
                  <BuyLinks name={shoe.name} brand={shoe.brand} compact />
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <h3>No shoes fit that budget yet.</h3>
            <p>Raise the maximum price in fine-tuning to bring recommendations back.</p>
          </div>
        )}
      </section>

      {comparedShoes.length > 0 && (
        <section className="container shoe-compare-card" aria-labelledby="compare-title">
          <div className="shoe-compare-heading">
            <div>
              <div className="eyebrow">Side by side</div>
              <h2 id="compare-title">
                {comparedShoes.length === 1 ? "Choose one more shoe" : "Your comparison"}
              </h2>
            </div>
            <button className="text-button" type="button" onClick={() => setCompareIds([])}>
              Clear
            </button>
          </div>
          {compareNotice && <p className="form-message">{compareNotice}</p>}
          <div className="comparison-grid">
            {comparedShoes.map((shoe) => (
              <article key={shoe.id} className="comparison-card">
                <h3>{displayName(shoe)}</h3>
                <dl>
                  <div><dt>Price</dt><dd>{shoe.price ? "$" + shoe.price : "–"}</dd></div>
                  <div><dt>Ride</dt><dd>{prettyLabel(shoe.cushion)}</dd></div>
                  <div><dt>Support</dt><dd>{prettyLabel(shoe.stability)}</dd></div>
                  <div><dt>Weight</dt><dd>{shoe.weightMens ? shoe.weightMens + " oz" : "–"}</dd></div>
                  <div><dt>Drop</dt><dd>{shoe.drop ? shoe.drop + " mm" : "–"}</dd></div>
                </dl>
                <button className="text-button" type="button" onClick={() => toggleCompare(shoe.id)}>
                  Remove
                </button>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="container shoe-browse-toggle">
        <div>
          <div className="eyebrow">Want more control?</div>
          <h2>Browse every matching shoe</h2>
          <p>Search, filter and sort the full catalog only when you need it.</p>
        </div>
        <button
          className="btn btn-secondary"
          type="button"
          aria-expanded={catalogOpen}
          onClick={() => setCatalogOpen((open) => !open)}
        >
          {catalogOpen ? "Hide full catalog" : "Browse all " + scoredShoes.length + " matches"}
        </button>
      </section>

      {catalogOpen && (
        <section className="container shoe-catalog" aria-labelledby="catalog-title">
          <div className="shoe-catalog-heading">
            <div>
              <h2 id="catalog-title">All matching shoes</h2>
              <p>{catalogShoes.length} results based on your answers.</p>
            </div>
            <button
              className="text-button"
              type="button"
              onClick={() => {
                setSearch("");
                setBrandFilter("all");
                setSortBy("match");
                setNewOnly(false);
              }}
            >
              Clear browse filters
            </button>
          </div>

          <div className="filter-bar">
            <label>
              Search
              <input
                type="search"
                value={search}
                placeholder="Shoe or brand"
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <label>
              Brand
              <select value={brandFilter} onChange={(event) => setBrandFilter(event.target.value)}>
                <option value="all">All brands</option>
                {brands.map((brand) => <option key={brand} value={brand}>{brand}</option>)}
              </select>
            </label>
            <label>
              Sort
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                {sortOptions.map((option) => (
                  <option key={option.id} value={option.id}>{option.label}</option>
                ))}
              </select>
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={newOnly}
                onChange={(event) => setNewOnly(event.target.checked)}
              />
              New releases only
            </label>
          </div>

          <div className="table-scroll">
            <table className="results-table">
              <thead>
                <tr>
                  <th>Shoe</th>
                  <th>Best for</th>
                  <th>Ride</th>
                  <th>Support</th>
                  <th>Price</th>
                  <th><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {(showAll ? catalogShoes : catalogShoes.slice(0, maxBrowseResults)).map((shoe) => (
                  <tr key={shoe.id}>
                    <td>
                      <Link href={"/shoes/" + shoe.id}>
                        <strong>{displayName(shoe)}</strong>
                      </Link>
                      {shoe.isNew && <span className="tag">New</span>}
                    </td>
                    <td>{prettyLabel(shoe.usageTypes[0] || "daily_trainer")}</td>
                    <td>{prettyLabel(shoe.cushion)}</td>
                    <td>{prettyLabel(shoe.stability)}</td>
                    <td>{shoe.price ? "$" + shoe.price : "–"}</td>
                    <td>
                      <div className="shoe-table-actions">
                        <Link className="btn btn-xs btn-secondary" href={"/shoes/" + shoe.id}>
                          Details
                        </Link>
                        <button
                          className="btn btn-xs btn-ghost"
                          type="button"
                          onClick={() => toggleCompare(shoe.id)}
                        >
                          {compareIds.includes(shoe.id) ? "Comparing" : "Compare"}
                        </button>
                        <SaveButton
                          itemType="shoe"
                          itemId={shoe.id}
                          label={displayName(shoe)}
                          metadata={{ price: shoe.price, score: shoe.score }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {catalogShoes.length > maxBrowseResults && (
            <button className="btn btn-ghost" type="button" onClick={() => setShowAll((open) => !open)}>
              {showAll ? "Show top 10" : "Show all " + catalogShoes.length}
            </button>
          )}
        </section>
      )}

      <section className="container next-step-card">
        <div>
          <div className="eyebrow">Next decision</div>
          <h2>Know the shoe. Fuel the run.</h2>
          <p>Use the free fueling tool to turn distance and duration into a practical plan.</p>
        </div>
        <Link className="btn btn-primary" href="/tools/fueling">Build my fuel plan</Link>
      </section>

      <p className="container shoe-affiliate-note">
        Runner Toolkit may earn a commission from retailer links. That never changes
        the order of these recommendations or the price you pay.
      </p>

      <section className="container section prose-block">
        <h2>How the shoe finder works</h2>
        <p>
          Every shoe in our database of 220+ current road running shoes is
          tagged for its job (daily miles, long runs, speed work, race day,
          recovery), its ride from firm to plush, its support level, its fit,
          and its price. Your answers filter and score that catalog. We show
          three shoes on purpose: the best overall match, the closest match
          for less money, and a different ride style in case the first two
          feel wrong at try-on. Prefer to look at everything? Browse the
          full <Link href="/shoes">running shoe database</Link>.
        </p>
        <h2>Why only three shoes?</h2>
        <p>
          Because a hundred options is how you end up buying the same shoe you
          already own. Three lets you compare with intention, and every pick
          shows its tradeoff before you spend anything.
        </p>
        <h2>When should I replace running shoes?</h2>
        <p>
          Most road shoes hold up for 300–500 miles. If you feel new aches
          after ordinary runs, or the midsole creases deeply and stops
          bouncing back, start the search before the shoe fails on you.
        </p>
      </section>
    </div>
  );
}
