"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { CSSProperties } from "react";
import { attireItems, attirePersonas, type AttireItem } from "@/lib/data";
import SaveButton from "@/components/save-button";
import { useCatalogItems } from "@/lib/catalog-client";
import { getSupabaseClient } from "@/lib/supabase-client";

export default function AttireGuidePage() {
  const [selectedPersona, setSelectedPersona] = useState("vibe_runner");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [weatherFilter, setWeatherFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("either");
  const [outfit, setOutfit] = useState<Record<string, string>>({});
  const [customPersona, setCustomPersona] = useState({
    name: "",
    description: "",
    priorities: "Comfort, Confidence, Utility",
    highlight: "Built by you"
  });

  const {
    items: liveAttire,
    loading: liveAttireLoading,
    available: liveCatalogAvailable
  } = useCatalogItems("attire", { limit: 6, orderBy: "mention_score" });

  const showLiveAttire = liveCatalogAvailable && liveAttire.length > 0;

  const [attireCatalog, setAttireCatalog] = useState<AttireItem[]>([]);
  const [attireLoading, setAttireLoading] = useState(true);
  const [usingSampleData, setUsingSampleData] = useState(false);
  const supabaseAvailable = useMemo(() => Boolean(getSupabaseClient()), []);

  type AttireRow = {
    id: string;
    name: string;
    brand: string;
    category: AttireItem["category"];
    gender: AttireItem["gender"];
    price: number | null;
    personas: string[] | null;
    weather: string[] | null;
    features: string[] | null;
    image_url: string | null;
  };

  const mapAttireRow = (row: AttireRow): AttireItem => ({
    id: row.id,
    name: row.name,
    brand: row.brand,
    category: row.category,
    gender: row.gender,
    price: row.price,
    personas: row.personas ?? [],
    weather: row.weather ?? [],
    features: row.features ?? [],
    imageUrl: row.image_url ?? undefined
  });

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setAttireCatalog([]);
      setAttireLoading(false);
      setUsingSampleData(true);
      return;
    }

    let active = true;
    setAttireLoading(true);

    supabase
      .from("attire_items")
      .select("id, name, brand, category, gender, price, personas, weather, features, image_url")
      .eq("is_active", true)
      .then(({ data, error }) => {
        if (!active) {
          return;
        }
        if (error || !data || data.length === 0) {
          setAttireCatalog([]);
          setAttireLoading(false);
          setUsingSampleData(true);
          return;
        }
        setAttireCatalog((data as AttireRow[]).map(mapAttireRow));
        setAttireLoading(false);
        setUsingSampleData(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const sourceItems = useMemo(() => {
    if (attireCatalog.length > 0) {
      return attireCatalog;
    }
    return attireItems;
  }, [attireCatalog]);

  const categories = useMemo(() => {
    const items = Array.from(new Set(sourceItems.map((item) => item.category)));
    return ["all", ...items];
  }, [sourceItems]);

  const weatherOptions = [
    "all",
    "hot",
    "warm",
    "cool",
    "cold",
    "rain",
    "wind",
    "snow",
    "dark"
  ];

  const matchesGender = (gender: string) => {
    if (genderFilter === "either") {
      return true;
    }
    if (genderFilter === "man") {
      return gender === "mens" || gender === "unisex";
    }
    if (genderFilter === "women") {
      return gender === "womens" || gender === "unisex";
    }
    return true;
  };

  const filteredItems = useMemo(() => {
    return sourceItems.filter((item) => {
      const personaMatch =
        selectedPersona === "custom" ? true : item.personas.includes(selectedPersona);
      const categoryMatch = categoryFilter === "all" || item.category === categoryFilter;
      const weatherMatch =
        weatherFilter === "all" || item.weather.includes(weatherFilter);
      const genderMatch = matchesGender(item.gender);
      return personaMatch && categoryMatch && weatherMatch && genderMatch;
    });
  }, [selectedPersona, categoryFilter, weatherFilter, genderFilter, sourceItems]);

  const persona = useMemo(() => {
    if (selectedPersona !== "custom") {
      return attirePersonas.find((item) => item.id === selectedPersona);
    }

    const priorities = customPersona.priorities
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);

    return {
      id: "custom",
      name: customPersona.name.trim() || "Custom Persona",
      description:
        customPersona.description.trim() ||
        "Define the kit, the priorities, and the vibe that fits your running life.",
      priorities: priorities.length ? priorities : ["Custom"],
      highlight: customPersona.highlight.trim() || "Built by you"
    };
  }, [selectedPersona, customPersona]);

  return (
    <div>
      <section className="tool-hero container">
        <h1>Attire Guide</h1>
        <p>
          Pick your runner persona and build a kit that matches your style,
          weather, and performance needs.
        </p>
      </section>

      <section className="section container">
        <div className="stack" style={{ marginBottom: "24px" }}>
          <h2 className="section-title">Choose your persona</h2>
          <p className="section-lede">
            These style lanes are fun, but grounded in real training priorities.
          </p>
          <div className="grid grid-3">
            {attirePersonas.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className={`card ${selectedPersona === item.id ? "card-accent" : "card-outline"} fade-up`}
                style={{ "--delay": `${index * 0.06}s` } as CSSProperties}
                onClick={() => setSelectedPersona(item.id)}
              >
                <div className="stack">
                  <strong>{item.name}</strong>
                  <p>{item.description}</p>
                  <span className="tag">{item.highlight}</span>
                </div>
              </button>
            ))}
          </div>
          {selectedPersona === "custom" ? (
            <div className="card card-outline" style={{ marginTop: "16px" }}>
              <div className="stack">
                <strong>Create your persona</strong>
                <div className="form-grid">
                  <div>
                    <span className="label">Persona name</span>
                    <input
                      className="input"
                      value={customPersona.name}
                      onChange={(event) =>
                        setCustomPersona((prev) => ({
                          ...prev,
                          name: event.target.value
                        }))
                      }
                      placeholder="Trail Mixer, Race Week Pro..."
                    />
                  </div>
                  <div>
                    <span className="label">Description</span>
                    <input
                      className="input"
                      value={customPersona.description}
                      onChange={(event) =>
                        setCustomPersona((prev) => ({
                          ...prev,
                          description: event.target.value
                        }))
                      }
                      placeholder="One sentence summary of your vibe"
                    />
                  </div>
                  <div>
                    <span className="label">Priorities (comma separated)</span>
                    <input
                      className="input"
                      value={customPersona.priorities}
                      onChange={(event) =>
                        setCustomPersona((prev) => ({
                          ...prev,
                          priorities: event.target.value
                        }))
                      }
                      placeholder="Comfort, Speed, Utility"
                    />
                  </div>
                  <div>
                    <span className="label">Highlight tag</span>
                    <input
                      className="input"
                      value={customPersona.highlight}
                      onChange={(event) =>
                        setCustomPersona((prev) => ({
                          ...prev,
                          highlight: event.target.value
                        }))
                      }
                      placeholder="Your signature detail"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

          <div className="grid grid-2">
            <div className="stack">
              <div className="card">
                <div className="stack">
                  <strong>Filters</strong>
                <div className="gender-toggle">
                  <button
                    type="button"
                    className={`gender-chip ${genderFilter === "man" ? "active" : ""}`}
                    aria-label="Mens"
                    onClick={() => setGenderFilter("man")}
                  >
                    <svg viewBox="0 0 64 64" aria-hidden="true">
                      <circle cx="32" cy="18" r="10" />
                      <rect x="24" y="30" width="16" height="20" rx="4" />
                      <rect x="16" y="32" width="8" height="22" rx="4" />
                      <rect x="40" y="32" width="8" height="22" rx="4" />
                      <rect x="24" y="50" width="8" height="12" rx="3" />
                      <rect x="32" y="50" width="8" height="12" rx="3" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className={`gender-chip ${genderFilter === "women" ? "active" : ""}`}
                    aria-label="Womens"
                    onClick={() => setGenderFilter("women")}
                  >
                    <svg viewBox="0 0 64 64" aria-hidden="true">
                      <circle cx="32" cy="18" r="10" />
                      <path d="M20 52 L32 28 L44 52 Z" />
                      <rect x="22" y="52" width="8" height="10" rx="3" />
                      <rect x="34" y="52" width="8" height="10" rx="3" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className={`gender-chip ${genderFilter === "either" ? "active" : ""}`}
                    aria-label="Either or both"
                    onClick={() => setGenderFilter("either")}
                  >
                    <svg viewBox="0 0 64 64" aria-hidden="true">
                      <circle cx="22" cy="20" r="8" />
                      <rect x="16" y="30" width="12" height="16" rx="4" />
                      <circle cx="42" cy="20" r="8" />
                      <path d="M34 50 L42 30 L50 50 Z" />
                    </svg>
                  </button>
                </div>
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  <div>
                    <span className="label">Category</span>
                    <select
                      className="select"
                      value={categoryFilter}
                      onChange={(event) => setCategoryFilter(event.target.value)}
                    >
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category === "all" ? "All categories" : category}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <span className="label">Weather</span>
                    <select
                      className="select"
                      value={weatherFilter}
                      onChange={(event) => setWeatherFilter(event.target.value)}
                    >
                      {weatherOptions.map((weather) => (
                        <option key={weather} value={weather}>
                          {weather === "all" ? "All conditions" : weather}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                </div>
              </div>

              {!supabaseAvailable ? (
                <div className="notice">Demo mode: connect Supabase to load the full attire catalog.</div>
              ) : null}
              {supabaseAvailable && attireLoading ? (
                <div className="notice">Loading attire catalog...</div>
              ) : null}
              {supabaseAvailable && !attireLoading && usingSampleData ? (
                <div className="notice">Supabase attire catalog is empty. Showing sample data.</div>
              ) : null}

              <div className="card-grid two">
                {filteredItems.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    className="card fade-up"
                    style={{ "--delay": `${index * 0.04}s` } as CSSProperties}
                    onClick={() =>
                      setOutfit((prev) => ({
                        ...prev,
                        [item.category]: item.name
                      }))
                    }
                  >
                    <div className="stack">
                      {item.imageUrl ? (
                        <img
                          className="catalog-image"
                          src={item.imageUrl}
                          alt={item.name}
                        />
                      ) : (
                        <div style={{ height: "4px" }} />
                      )}
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <strong>{item.name}</strong>
                        <span className="tag">
                          {item.price != null ? `$${item.price}` : "Price varies"}
                        </span>
                    </div>
                    <span className="brand-sub">{item.brand}</span>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {item.features.map((feature) => (
                        <span key={feature} className="tag">
                          {feature}
                        </span>
                      ))}
                    </div>
                    <span className="badge">Add to outfit</span>
                    <SaveButton
                      itemType="attire"
                      itemId={item.id}
                      label={`${item.name} (${item.brand})`}
                      metadata={{
                        brand: item.brand,
                        category: item.category,
                        price: item.price ?? undefined
                      }}
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="stack">
            <div className="card card-accent">
              <div className="stack">
                <strong>Outfit builder</strong>
                {persona ? (
                  <p>
                    {persona.name} priorities: {persona.priorities.join(" > ")}
                  </p>
                ) : null}
                <div className="divider" />
                <div className="stack">
                  {categories
                    .filter((category) => category !== "all")
                    .map((category) => (
                      <div key={category} className="hero-strip-item">
                        <span>{category}</span>
                        <strong>{outfit[category] || "Pick an item"}</strong>
                      </div>
                    ))}
                </div>
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={() => setOutfit({})}
                  >
                    Clear outfit
                  </button>
                  {Object.keys(outfit).length > 0 && (
                    <SaveButton
                      itemType="attire"
                      itemId={`outfit-${selectedPersona}`}
                      label={`${persona?.name ?? "Custom"} outfit`}
                      metadata={outfit}
                    />
                  )}
                </div>
              </div>
            </div>

            {showLiveAttire ? (
              <div className="card card-accent">
                <div className="stack">
                  <strong>Trending on Reddit</strong>
                  <p>Live signal from the community to keep styles current.</p>
                  <div className="grid grid-3">
                    {liveAttire.map((item, index) => (
                      <div
                        key={item.item_key}
                        className="card card-outline fade-up"
                        style={{ "--delay": `${index * 0.05}s` } as CSSProperties}
                      >
                        <div className="stack">
                          {item.image_url ? (
                            <img className="catalog-image" src={item.image_url} alt={item.name} />
                          ) : (
                            <div style={{ height: "4px" }} />
                          )}
                          <strong>{item.name}</strong>
                          <span className="brand-sub">{item.brand ?? "Brand"}</span>
                          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            <span className="badge">
                              Buzz {Math.round(item.mention_score ?? 0)}
                            </span>
                            {item.mention_count ? (
                              <span className="tag">{item.mention_count} mentions</span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : liveAttireLoading ? (
              <div className="card card-outline">Loading live attire signals...</div>
            ) : null}

            <Link className="btn btn-ghost" href="/tools/music">
              Next tool: Music
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
