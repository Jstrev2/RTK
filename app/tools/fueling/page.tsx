"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getFuelRetailerLinks } from "@/lib/affiliate";
import {
  buildFuelingPlan,
  formatFuelingSummary,
  fuelingProducts,
  suggestCarbTarget,
  type FuelingProduct
} from "@/lib/fueling";
import { useAuth } from "@/components/auth-provider";
import { getSupabaseClient } from "@/lib/supabase-client";

const distanceOptions = [
  { id: "10k", label: "10K", miles: 6.2, hours: "0", minutes: "50" },
  { id: "half", label: "Half", miles: 13.1, hours: "1", minutes: "55" },
  { id: "marathon", label: "Marathon", miles: 26.2, hours: "4", minutes: "10" },
  { id: "50k", label: "50K", miles: 31.1, hours: "6", minutes: "0" },
  { id: "50mi", label: "50 mile", miles: 50, hours: "11", minutes: "0" },
  { id: "100k", label: "100K", miles: 62.1, hours: "14", minutes: "0" },
  { id: "100mi", label: "100 mile", miles: 100, hours: "26", minutes: "0" }
];

const conditionOptions = [
  { id: "cool", label: "Cool", description: "Below about 50°F" },
  { id: "moderate", label: "Mild", description: "Comfortable running weather" },
  { id: "warm", label: "Warm", description: "Sweat rate likely climbs" },
  { id: "hot", label: "Hot", description: "Heat is a major factor" }
];

const caffeineOptions = [
  { id: "avoid", label: "Avoid caffeine" },
  { id: "optional", label: "Caffeine is okay" },
  { id: "prefer", label: "Prefer caffeine" }
];

const recommendationLabels = [
  { eyebrow: "Best starting point", title: "The cleanest fit for this plan" },
  { eyebrow: "Gentler option", title: "A simpler product to practice" },
  { eyebrow: "Higher-output option", title: "More carbohydrate per serving" }
];

const sessionKey = "fuel-planner-state-v2";
const maxCatalogResults = 12;

type Experience = "first" | "some" | "experienced" | "elite";
type Temperature = "cool" | "moderate" | "warm" | "hot";
type CaffeinePreference = "avoid" | "optional" | "prefer";
type CatalogFilter = "all" | "caffeine-free" | "caffeinated" | "high-carb";

type FuelingLogRow = {
  id: string;
  run_date: string;
  run_type: string;
  distance: string | null;
  duration: string | null;
  rating: number | null;
  notes: string | null;
};

type FuelingLog = {
  id: string;
  date: string;
  runType: string;
  distance: string;
  duration: string;
  rating: string;
  notes: string;
};

type RankedProduct = FuelingProduct & {
  score: number;
};

const mapFuelingLog = (row: FuelingLogRow): FuelingLog => ({
  id: row.id,
  date: row.run_date,
  runType: row.run_type,
  distance: row.distance ?? "",
  duration: row.duration ?? "",
  rating: row.rating?.toString() ?? "",
  notes: row.notes ?? ""
});

const isUsableProduct = (product: FuelingProduct) =>
  product.carbs >= 15 &&
  product.carbs <= 50 &&
  product.calories >= 60 &&
  product.calories <= 250 &&
  product.name.length <= 90;

const productScore = (
  product: FuelingProduct,
  target: number,
  caffeine: CaffeinePreference,
  temperature: Temperature,
  experience: Experience,
  totalMinutes: number
) => {
  const interval = Math.min(45, Math.max(20, Math.round((product.carbs / target) * 60)));
  let score = 100 - Math.abs(interval - 30) * 1.4;
  const caffeineMg = product.caffeineMg ?? 0;
  const sodiumMg = product.sodiumMg ?? 0;

  if (caffeine === "avoid") {
    score += caffeineMg > 0 ? -100 : 18;
  } else if (caffeine === "prefer") {
    score += caffeineMg > 0 ? Math.min(22, caffeineMg / 4) : -12;
  } else {
    score += caffeineMg === 0 ? 6 : caffeineMg <= 75 ? 3 : -2;
  }

  if ((temperature === "warm" || temperature === "hot") && sodiumMg >= 75) {
    score += 10;
  }
  if (temperature === "hot" && sodiumMg <= 10) {
    score -= 8;
  }
  if (experience === "first" && product.carbs <= 30 && caffeineMg === 0) {
    score += 10;
  }
  if (totalMinutes >= 150 && product.carbs >= 30) {
    score += 10;
  }

  return score;
};

const productReason = (
  product: FuelingProduct,
  index: number,
  temperature: Temperature,
  caffeine: CaffeinePreference
) => {
  const caffeineMg = product.caffeineMg ?? 0;
  const sodiumMg = product.sodiumMg ?? 0;
  if (index === 1) {
    return caffeineMg === 0
      ? "No caffeine, with a manageable " + product.carbs + "g carbohydrate serving."
      : "A smaller step up that keeps each serving straightforward.";
  }
  if (index === 2) {
    return product.carbs + "g carbohydrate per serving reduces how many packets you need.";
  }
  if ((temperature === "warm" || temperature === "hot") && sodiumMg >= 75) {
    return "Useful carbohydrate plus " + sodiumMg + "mg sodium for a warmer effort.";
  }
  if (caffeine === "prefer" && caffeineMg > 0) {
    return "Matches your caffeine preference with " + product.carbs + "g carbohydrate per serving.";
  }
  return "Its serving size creates a practical rhythm for the target in your plan.";
};

const productTradeoff = (product: FuelingProduct, temperature: Temperature) => {
  const caffeineMg = product.caffeineMg ?? 0;
  const sodiumMg = product.sodiumMg ?? 0;
  if (caffeineMg > 0) {
    return "Contains " + caffeineMg + "mg caffeine. Count coffee and every other source too.";
  }
  if (product.carbs >= 35) {
    return "A larger carbohydrate serving can be efficient, but it deserves gut practice.";
  }
  if ((temperature === "warm" || temperature === "hot") && sodiumMg <= 10) {
    return "Very little sodium, so electrolytes need to come from somewhere else.";
  }
  return "Flavor and texture still need a real long-run test before race day.";
};

const formatClock = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (!hours) return mins + " min";
  return hours + ":" + mins.toString().padStart(2, "0");
};

function FuelShopLinks({ product }: { product: FuelingProduct }) {
  const links = getFuelRetailerLinks(product).slice(0, 2);
  return (
    <div className="fuel-shop-links">
      {links.map((link) => (
        <a
          key={link.retailer}
          className="btn btn-xs btn-secondary"
          href={link.url}
          target="_blank"
          rel="sponsored noopener noreferrer"
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}

export default function FuelingPage() {
  const { user, supabaseAvailable } = useAuth();
  const [distance, setDistance] = useState("half");
  const [hours, setHours] = useState("1");
  const [minutes, setMinutes] = useState("55");
  const [experience, setExperience] = useState<Experience>("some");
  const [temperature, setTemperature] = useState<Temperature>("moderate");
  const [caffeine, setCaffeine] = useState<CaffeinePreference>("optional");
  const [carbTarget, setCarbTarget] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [practiceOpen, setPracticeOpen] = useState(false);
  const [catalogShowAll, setCatalogShowAll] = useState(false);
  const [products, setProducts] = useState<FuelingProduct[]>(fuelingProducts);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [productFilter, setProductFilter] = useState<CatalogFilter>("all");
  const [restored, setRestored] = useState(false);

  const [logs, setLogs] = useState<FuelingLog[]>([]);
  const [logStatus, setLogStatus] = useState<"idle" | "loading" | "error">("idle");
  const [logForm, setLogForm] = useState({
    date: "",
    runType: "long_run",
    distance: "",
    duration: "",
    rating: "4",
    notes: ""
  });

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(sessionKey);
      if (raw) {
        const saved = JSON.parse(raw);
        if (typeof saved.distance === "string") setDistance(saved.distance);
        if (typeof saved.hours === "string") setHours(saved.hours);
        if (typeof saved.minutes === "string") setMinutes(saved.minutes);
        if (typeof saved.experience === "string") setExperience(saved.experience);
        if (typeof saved.temperature === "string") setTemperature(saved.temperature);
        if (typeof saved.caffeine === "string") setCaffeine(saved.caffeine);
        if (typeof saved.carbTarget === "string") setCarbTarget(saved.carbTarget);
        if (typeof saved.advancedOpen === "boolean") setAdvancedOpen(saved.advancedOpen);
        if (typeof saved.catalogOpen === "boolean") setCatalogOpen(saved.catalogOpen);
        if (typeof saved.selectedProductId === "string") {
          setSelectedProductId(saved.selectedProductId);
        }
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
        distance,
        hours,
        minutes,
        experience,
        temperature,
        caffeine,
        carbTarget,
        advancedOpen,
        catalogOpen,
        selectedProductId
      })
    );
  }, [
    restored,
    distance,
    hours,
    minutes,
    experience,
    temperature,
    caffeine,
    carbTarget,
    advancedOpen,
    catalogOpen,
    selectedProductId
  ]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    let active = true;
    supabase
      .from("fuel_gels")
      .select(
        "item_key, name, brand, carbs_g, calories, sodium_mg, caffeine_mg, notes, product_url"
      )
      .eq("is_active", true)
      .then(({ data, error }) => {
        if (!active || error || !data?.length) return;
        const mapped = data
          .map((row) => ({
            id: String(row.item_key),
            name: String(row.name),
            brand: String(row.brand),
            carbs: Number(row.carbs_g) || 0,
            calories: Number(row.calories) || 0,
            sodiumMg: row.sodium_mg == null ? undefined : Number(row.sodium_mg),
            caffeineMg: row.caffeine_mg == null ? undefined : Number(row.caffeine_mg),
            notes: row.notes ? String(row.notes) : undefined,
            productUrl: row.product_url ? String(row.product_url) : undefined
          }))
          .filter(isUsableProduct);

        const merged = new Map<string, FuelingProduct>();
        fuelingProducts.forEach((product) => merged.set(product.id, product));
        mapped.forEach((product) => merged.set(product.id, product));
        const nextProducts = Array.from(merged.values());
        setProducts(nextProducts);
        setSelectedProductId((current) =>
          current && nextProducts.some((product) => product.id === current) ? current : ""
        );
      });
    return () => {
      active = false;
    };
  }, []);

  const totalMinutes = useMemo(
    () => Math.max(0, (Number(hours) || 0) * 60 + (Number(minutes) || 0)),
    [hours, minutes]
  );

  const targetCarbs = useMemo(() => {
    const custom = Number(carbTarget);
    if (Number.isFinite(custom) && custom > 0) return custom;
    return suggestCarbTarget(totalMinutes, experience);
  }, [carbTarget, totalMinutes, experience]);

  const rankedProducts = useMemo(
    () =>
      products
        .filter(isUsableProduct)
        .map((product) => ({
          ...product,
          score: productScore(
            product,
            targetCarbs,
            caffeine,
            temperature,
            experience,
            totalMinutes
          )
        }))
        .sort((a, b) => b.score - a.score || b.carbs - a.carbs),
    [products, targetCarbs, caffeine, temperature, experience, totalMinutes]
  );

  const recommendations = useMemo(() => {
    if (!rankedProducts.length) return [];
    const allowed = rankedProducts.filter(
      (product) => caffeine !== "avoid" || (product.caffeineMg ?? 0) === 0
    );
    const pool = allowed.length ? allowed : rankedProducts;
    const best = pool[0];
    const gentle =
      pool.find(
        (product) =>
          product.id !== best.id &&
          (product.caffeineMg ?? 0) === 0 &&
          product.carbs <= 30
      ) || pool.find((product) => product.id !== best.id);
    const used = new Set([best.id, gentle?.id]);
    const higher =
      [...pool]
        .filter((product) => !used.has(product.id))
        .sort((a, b) => b.carbs - a.carbs || b.score - a.score)[0] ||
      pool.find((product) => !used.has(product.id));
    return [best, gentle, higher].filter(Boolean) as RankedProduct[];
  }, [rankedProducts, caffeine]);

  const activeProduct =
    rankedProducts.find((product) => product.id === selectedProductId) ||
    recommendations[0] ||
    rankedProducts[0];

  const plan = useMemo(() => {
    const distanceData = distanceOptions.find((item) => item.id === distance);
    if (!distanceData || totalMinutes <= 0 || !activeProduct) return null;
    return buildFuelingPlan({
      distanceMiles: distanceData.miles,
      distanceLabel: distanceData.label,
      goalTimeMinutes: totalMinutes,
      weightLbs: 155,
      experience,
      temperature,
      gelId: activeProduct.id,
      carbTargetPerHour: targetCarbs,
      gels: products
    });
  }, [
    distance,
    totalMinutes,
    activeProduct,
    experience,
    temperature,
    targetCarbs,
    products
  ]);

  const summary = plan ? formatFuelingSummary(plan) : null;

  const filteredProducts = useMemo(() => {
    const needle = productSearch.trim().toLowerCase();
    return rankedProducts.filter((product) => {
      const matchesSearch =
        !needle ||
        (product.brand + " " + product.name).toLowerCase().includes(needle);
      const caffeineMg = product.caffeineMg ?? 0;
      const matchesFilter =
        productFilter === "all" ||
        (productFilter === "caffeine-free" && caffeineMg === 0) ||
        (productFilter === "caffeinated" && caffeineMg > 0) ||
        (productFilter === "high-carb" && product.carbs >= 30);
      return matchesSearch && matchesFilter;
    });
  }, [rankedProducts, productSearch, productFilter]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase || !user || !practiceOpen) return;
    let active = true;
    setLogStatus("loading");
    supabase
      .from("fueling_logs")
      .select("id, run_date, run_type, distance, duration, rating, notes")
      .eq("user_id", user.id)
      .order("run_date", { ascending: false })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setLogStatus("error");
          return;
        }
        setLogs((data as FuelingLogRow[])?.map(mapFuelingLog) ?? []);
        setLogStatus("idle");
      });
    return () => {
      active = false;
    };
  }, [user, practiceOpen]);

  const chooseDistance = (id: string) => {
    const option = distanceOptions.find((item) => item.id === id);
    if (!option) return;
    setDistance(id);
    setHours(option.hours);
    setMinutes(option.minutes);
    setSelectedProductId("");
  };

  const resetPlanner = () => {
    setDistance("half");
    setHours("1");
    setMinutes("55");
    setExperience("some");
    setTemperature("moderate");
    setCaffeine("optional");
    setCarbTarget("");
    setSelectedProductId("");
    setAdvancedOpen(false);
  };

  const addLog = async () => {
    if (!logForm.date || !logForm.distance || !logForm.duration) return;
    const supabase = getSupabaseClient();
    const entry: FuelingLog = {
      id: "local-" + Date.now(),
      date: logForm.date,
      runType: logForm.runType,
      distance: logForm.distance,
      duration: logForm.duration,
      rating: logForm.rating,
      notes: logForm.notes
    };

    if (!supabase || !user) {
      setLogs((current) => [entry, ...current]);
      setLogForm({
        date: "",
        runType: "long_run",
        distance: "",
        duration: "",
        rating: "4",
        notes: ""
      });
      return;
    }

    setLogStatus("loading");
    const { data, error } = await supabase
      .from("fueling_logs")
      .insert({
        user_id: user.id,
        run_date: logForm.date,
        run_type: logForm.runType,
        distance: logForm.distance,
        duration: logForm.duration,
        rating: Number(logForm.rating),
        notes: logForm.notes
      })
      .select("id, run_date, run_type, distance, duration, rating, notes")
      .single();

    if (error || !data) {
      setLogStatus("error");
      return;
    }

    setLogs((current) => [mapFuelingLog(data as FuelingLogRow), ...current]);
    setLogStatus("idle");
    setLogForm({
      date: "",
      runType: "long_run",
      distance: "",
      duration: "",
      rating: "4",
      notes: ""
    });
  };

  return (
    <div className="tool-page tool-page-fuel fuel-planner-simple">
      <section className="tool-hero container fuel-tool-hero">
        <span className="eyebrow">Free Fuel Planner</span>
        <h1>A fueling schedule you can actually follow.</h1>
        <p>
          Give us the effort, expected time, and conditions. Get a simple
          carbohydrate rhythm, hydration starting point, packing list, and three
          products worth testing.
        </p>
      </section>

      <section className="container fuel-planner-layout" aria-labelledby="fuel-builder-title">
        <div className="fuel-builder-card">
          <div className="fuel-card-heading">
            <div>
              <span className="fuel-step-count">3 quick answers</span>
              <h2 id="fuel-builder-title">Build the working plan</h2>
            </div>
            <button className="text-button" type="button" onClick={resetPlanner}>
              Reset
            </button>
          </div>

          <fieldset className="fuel-question">
            <legend><span>1</span> What are you fueling?</legend>
            <div className="fuel-distance-grid">
              {distanceOptions.slice(0, 5).map((option) => (
                <button
                  key={option.id}
                  className={
                    distance === option.id
                      ? "fuel-choice fuel-choice-selected"
                      : "fuel-choice"
                  }
                  type="button"
                  aria-pressed={distance === option.id}
                  onClick={() => chooseDistance(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="fuel-question">
            <legend><span>2</span> How long will it take?</legend>
            <div className="fuel-duration-inputs">
              <label>
                <input
                  type="number"
                  min="0"
                  max="40"
                  value={hours}
                  onChange={(event) => {
                    setHours(event.target.value);
                    setSelectedProductId("");
                  }}
                />
                <span>hours</span>
              </label>
              <label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={minutes}
                  onChange={(event) => {
                    setMinutes(event.target.value);
                    setSelectedProductId("");
                  }}
                />
                <span>minutes</span>
              </label>
            </div>
          </fieldset>

          <fieldset className="fuel-question">
            <legend><span>3</span> What will conditions feel like?</legend>
            <div className="fuel-condition-grid">
              {conditionOptions.map((option) => (
                <button
                  key={option.id}
                  className={
                    temperature === option.id
                      ? "fuel-choice fuel-choice-selected"
                      : "fuel-choice"
                  }
                  type="button"
                  aria-pressed={temperature === option.id}
                  onClick={() => {
                    setTemperature(option.id as Temperature);
                    setSelectedProductId("");
                  }}
                >
                  <strong>{option.label}</strong>
                  <span>{option.description}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <div className="fuel-refine-row">
            <button
              className="btn btn-ghost"
              type="button"
              aria-expanded={advancedOpen}
              onClick={() => setAdvancedOpen((open) => !open)}
            >
              {advancedOpen ? "Hide fine-tuning" : "Fine-tune this plan"}
            </button>
            <span>The defaults work for a first pass.</span>
          </div>

          {advancedOpen && (
            <div className="fuel-advanced-panel">
              <label>
                Experience
                <select
                  value={experience}
                  onChange={(event) => {
                    setExperience(event.target.value as Experience);
                    setSelectedProductId("");
                  }}
                >
                  <option value="first">New to fueling</option>
                  <option value="some">Some practice</option>
                  <option value="experienced">Experienced</option>
                  <option value="elite">High-carb trained</option>
                </select>
              </label>
              <label>
                Caffeine
                <select
                  value={caffeine}
                  onChange={(event) => {
                    setCaffeine(event.target.value as CaffeinePreference);
                    setSelectedProductId("");
                  }}
                >
                  {caffeineOptions.map((option) => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </select>
              </label>
              <label>
                Carbohydrate target <small>(optional)</small>
                <div className="fuel-input-suffix">
                  <input
                    type="number"
                    min="20"
                    max="120"
                    value={carbTarget}
                    placeholder={String(suggestCarbTarget(totalMinutes, experience))}
                    onChange={(event) => {
                      setCarbTarget(event.target.value);
                      setSelectedProductId("");
                    }}
                  />
                  <span>g/hr</span>
                </div>
              </label>
              <label>
                Longer ultra distance
                <select value={distance} onChange={(event) => chooseDistance(event.target.value)}>
                  {distanceOptions.map((option) => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </select>
              </label>
            </div>
          )}
        </div>

        <div className="fuel-plan-card" aria-live="polite">
          <div className="fuel-plan-heading">
            <div>
              <span className="eyebrow">Your working plan</span>
              <h2>{distanceOptions.find((item) => item.id === distance)?.label} · {formatClock(totalMinutes)}</h2>
            </div>
            <span className="fuel-live-pill">Updates instantly</span>
          </div>

          {plan && summary && activeProduct ? (
            <>
              <div className="fuel-plan-stats">
                <div>
                  <strong>{plan.carbTargetPerHour}g</strong>
                  <span>carbohydrate / hour</span>
                </div>
                <div>
                  <strong>{plan.schedule.length ? plan.gelIntervalMinutes + " min" : "Optional"}</strong>
                  <span>fuel rhythm</span>
                </div>
                <div>
                  <strong>{plan.fluidsPerHour}</strong>
                  <span>fluid starting range / hour</span>
                </div>
              </div>

              <div className="fuel-timeline">
                <div className="fuel-timeline-step fuel-timeline-before">
                  <span>Before</span>
                  <div>
                    <strong>Start fed and hydrated</strong>
                    <p>Use a familiar pre-run meal. Do not introduce a new product here.</p>
                  </div>
                </div>
                {plan.schedule.length ? (
                  plan.schedule.map((step, index) => (
                    <div className="fuel-timeline-step" key={String(step.timeMinutes) + step.item}>
                      <span>{formatClock(step.timeMinutes)}</span>
                      <div>
                        <strong>Serving {index + 1}: {activeProduct.brand} {activeProduct.name}</strong>
                        <p>About mile {step.mile.toFixed(1)} · {activeProduct.carbs}g carbohydrate</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="fuel-timeline-step">
                    <span>During</span>
                    <div>
                      <strong>No scheduled serving in this first pass</strong>
                      <p>For this duration, starting well-fed and carrying an optional familiar backup is reasonable.</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="fuel-packing-card">
                <div>
                  <span className="eyebrow">Pack this</span>
                  <strong>
                    {plan.schedule.length} × {activeProduct.brand} {activeProduct.name}
                  </strong>
                </div>
                <ul>
                  <li>{summary.fluids} as a starting range, adjusted to your sweat rate</li>
                  <li>{summary.sodium} as a broad starting range</li>
                  <li>One familiar backup serving when practical</li>
                </ul>
              </div>

              <div className="fuel-plan-caution">
                <strong>Practice, then personalize.</strong>
                <span>
                  Fluid and sodium needs vary widely. Avoid forcing fluid, test this on
                  long runs, and stop using anything that causes symptoms.
                </span>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <h3>Add a valid duration to build the plan.</h3>
            </div>
          )}
        </div>
      </section>

      <section className="container fuel-products-section" aria-labelledby="fuel-products-title">
        <div className="fuel-products-heading">
          <div>
            <span className="eyebrow">Products to practice</span>
            <h2 id="fuel-products-title">Three options worth testing</h2>
            <p>
              Nutrition fit comes first. Taste, texture, and gut tolerance still have
              to be proven on your own training runs.
            </p>
          </div>
          <span className="fuel-selected-label">
            Schedule uses: {activeProduct ? activeProduct.brand + " " + activeProduct.name : "—"}
          </span>
        </div>

        <div className="fuel-product-grid">
          {recommendations.map((product, index) => {
            const role = recommendationLabels[index];
            const selected = activeProduct?.id === product.id;
            return (
              <article
                className={
                  selected
                    ? "fuel-product-card fuel-product-selected"
                    : "fuel-product-card"
                }
                key={product.id}
              >
                <div className="fuel-product-top">
                  <span>{role.eyebrow}</span>
                  {selected && <b>In your schedule</b>}
                </div>
                <p className="fuel-product-kicker">{role.title}</p>
                <h3>{product.brand} {product.name}</h3>
                <p className="fuel-product-reason">
                  {productReason(product, index, temperature, caffeine)}
                </p>
                <div className="fuel-product-nutrition">
                  <span><strong>{product.carbs}g</strong> carbs</span>
                  <span><strong>{product.sodiumMg ?? 0}mg</strong> sodium</span>
                  <span><strong>{product.caffeineMg ?? 0}mg</strong> caffeine</span>
                </div>
                <div className="fuel-product-tradeoff">
                  <strong>Know before you buy</strong>
                  <span>{productTradeoff(product, temperature)}</span>
                </div>
                <div className="fuel-product-actions">
                  <button
                    className={selected ? "btn btn-primary btn-sm" : "btn btn-ghost btn-sm"}
                    type="button"
                    onClick={() => setSelectedProductId(product.id)}
                  >
                    {selected ? "Using this product" : "Use in my schedule"}
                  </button>
                  <FuelShopLinks product={product} />
                </div>
              </article>
            );
          })}
        </div>

        <p className="fuel-affiliate-note">
          Runner Toolkit may earn a commission from retailer links. That never
          changes the recommendation order or the price you pay.
        </p>
      </section>

      <section className="container fuel-browse-toggle">
        <div>
          <span className="eyebrow">Already know what works?</span>
          <h2>Browse the full fuel catalog</h2>
          <p>Search and filter every usable product without crowding the main plan.</p>
        </div>
        <button
          className="btn btn-secondary"
          type="button"
          aria-expanded={catalogOpen}
          onClick={() => setCatalogOpen((open) => !open)}
        >
          {catalogOpen ? "Hide catalog" : "Browse all " + rankedProducts.length + " products"}
        </button>
      </section>

      {catalogOpen && (
        <section className="container fuel-catalog" aria-labelledby="fuel-catalog-title">
          <div className="fuel-catalog-heading">
            <div>
              <h2 id="fuel-catalog-title">All usable products</h2>
              <p>{filteredProducts.length} results with complete nutrition data.</p>
            </div>
            <button
              className="text-button"
              type="button"
              onClick={() => {
                setProductSearch("");
                setProductFilter("all");
              }}
            >
              Clear filters
            </button>
          </div>

          <div className="fuel-catalog-filters">
            <label>
              Search
              <input
                type="search"
                value={productSearch}
                placeholder="Brand or product"
                onChange={(event) => setProductSearch(event.target.value)}
              />
            </label>
            <label>
              Nutrition profile
              <select
                value={productFilter}
                onChange={(event) => setProductFilter(event.target.value as CatalogFilter)}
              >
                <option value="all">All products</option>
                <option value="caffeine-free">Caffeine-free</option>
                <option value="caffeinated">Caffeinated</option>
                <option value="high-carb">High carb (30g+)</option>
              </select>
            </label>
          </div>

          <div className="fuel-catalog-grid">
            {(catalogShowAll
              ? filteredProducts
              : filteredProducts.slice(0, maxCatalogResults)
            ).map((product) => (
              <article
                className={
                  activeProduct?.id === product.id
                    ? "fuel-catalog-card fuel-catalog-card-selected"
                    : "fuel-catalog-card"
                }
                key={product.id}
              >
                <div>
                  <strong>{product.brand} {product.name}</strong>
                  <span>{product.carbs}g carbs · {product.calories} calories</span>
                </div>
                <div className="fuel-catalog-tags">
                  <span>{product.sodiumMg ?? 0}mg sodium</span>
                  <span>{product.caffeineMg ?? 0}mg caffeine</span>
                </div>
                <div className="fuel-catalog-actions">
                  <button
                    className="btn btn-xs btn-ghost"
                    type="button"
                    onClick={() => setSelectedProductId(product.id)}
                  >
                    {activeProduct?.id === product.id ? "Selected" : "Use in plan"}
                  </button>
                  <FuelShopLinks product={product} />
                </div>
              </article>
            ))}
          </div>
          {filteredProducts.length > maxCatalogResults && (
            <button
              className="btn btn-ghost"
              type="button"
              onClick={() => setCatalogShowAll((show) => !show)}
            >
              {catalogShowAll
                ? "Show top matches"
                : "Show all " + filteredProducts.length}
            </button>
          )}
        </section>
      )}

      <section className="container fuel-practice-toggle">
        <div>
          <span className="eyebrow">The part that matters</span>
          <h2>Practice the plan before race day</h2>
          <p>Record what worked without making a training log the center of this tool.</p>
        </div>
        <button
          className="btn btn-ghost"
          type="button"
          aria-expanded={practiceOpen}
          onClick={() => setPracticeOpen((open) => !open)}
        >
          {practiceOpen ? "Close practice log" : "Track a practice run"}
        </button>
      </section>

      {practiceOpen && (
        <section className="container fuel-practice-panel">
          <div className="fuel-practice-form">
            <div>
              <h2>Practice run</h2>
              <p>
                {supabaseAvailable && user
                  ? "Saved to your account."
                  : "This entry stays in this session unless you sign in."}
              </p>
            </div>
            {logStatus === "error" && (
              <div className="form-message">Unable to load or save logs right now.</div>
            )}
            <div className="fuel-log-fields">
              <label>
                Date
                <input
                  type="date"
                  value={logForm.date}
                  onChange={(event) => setLogForm({ ...logForm, date: event.target.value })}
                />
              </label>
              <label>
                Run type
                <select
                  value={logForm.runType}
                  onChange={(event) => setLogForm({ ...logForm, runType: event.target.value })}
                >
                  <option value="long_run">Long run</option>
                  <option value="tempo">Tempo</option>
                  <option value="race">Race</option>
                  <option value="easy">Easy</option>
                </select>
              </label>
              <label>
                Distance
                <input
                  value={logForm.distance}
                  placeholder="13 miles"
                  onChange={(event) => setLogForm({ ...logForm, distance: event.target.value })}
                />
              </label>
              <label>
                Duration
                <input
                  value={logForm.duration}
                  placeholder="2:05"
                  onChange={(event) => setLogForm({ ...logForm, duration: event.target.value })}
                />
              </label>
              <label>
                How did it go?
                <select
                  value={logForm.rating}
                  onChange={(event) => setLogForm({ ...logForm, rating: event.target.value })}
                >
                  <option value="5">Great</option>
                  <option value="4">Good</option>
                  <option value="3">Okay</option>
                  <option value="2">Rough</option>
                  <option value="1">Bad</option>
                </select>
              </label>
              <label className="fuel-log-notes">
                Notes
                <textarea
                  rows={3}
                  value={logForm.notes}
                  placeholder="Energy, stomach, thirst, flavor..."
                  onChange={(event) => setLogForm({ ...logForm, notes: event.target.value })}
                />
              </label>
            </div>
            <button className="btn btn-primary" type="button" onClick={addLog}>
              Save practice run
            </button>
          </div>

          {logs.length > 0 && (
            <div className="fuel-log-list">
              {logs.map((entry) => (
                <article key={entry.id}>
                  <div>
                    <strong>{entry.date} · {entry.distance}</strong>
                    <span>{entry.runType.replace("_", " ")} · {entry.duration} · {entry.rating}/5</span>
                  </div>
                  {entry.notes && <p>{entry.notes}</p>}
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="container next-step-card fuel-next-step">
        <div>
          <span className="eyebrow">Put it into training</span>
          <h2>Practice this rhythm on the right long runs.</h2>
          <p>Choose a free plan, then use training to make the fuel plan familiar.</p>
        </div>
        <Link className="btn btn-primary" href="/tools/training-plans">
          Choose a training plan
        </Link>
      </section>

      <section className="container fuel-method-note">
        <strong>A responsible starting point, not a prescription.</strong>
        <p>
          The calculator uses broad endurance-sport carbohydrate ranges and
          deliberately labels fluid and sodium as starting ranges. Individual
          needs, health conditions, medications, and environmental exposure can
          change what is appropriate.
        </p>
      </section>
    </div>
  );
}
