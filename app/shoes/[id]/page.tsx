import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { shoes } from "@/lib/data";
import type { Shoe } from "@/lib/data";
import { mapDbShoe, type DbShoe } from "@/lib/shoe-utils";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

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
  extra_wide: "Extra wide",
  midfoot: "Midfoot",
  forefoot: "Forefoot",
  heel: "Heel"
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

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const supportScore = (stability: string) => {
  switch (stability) {
    case "motion_control":
      return 92;
    case "moderate":
      return 78;
    case "mild":
      return 62;
    default:
      return 42;
  }
};

const cushionScore = (cushion: string) => {
  switch (cushion) {
    case "maximum":
      return 90;
    case "moderate":
      return 68;
    default:
      return 40;
  }
};

const durabilityScore = (usageTypes: string[]) => {
  let score = 52;
  if (usageTypes.includes("daily_trainer")) score += 12;
  if (usageTypes.includes("long_run")) score += 10;
  if (usageTypes.includes("trail_running")) score += 10;
  if (usageTypes.includes("recovery_runs")) score += 6;
  if (usageTypes.includes("race_day")) score -= 14;
  if (usageTypes.includes("speed_work")) score -= 6;
  return clamp(score, 30, 92);
};

const versatilityScore = (usageTypes: string[], surfaces: string[]) => {
  const score = 30 + usageTypes.length * 8 + surfaces.length * 6;
  return clamp(score, 35, 95);
};

const priceScore = (price: number) => {
  if (price <= 120) return 90;
  if (price <= 140) return 80;
  if (price <= 160) return 70;
  if (price <= 200) return 60;
  if (price <= 250) return 50;
  return 40;
};

const lightnessScore = (weightMens: number) => {
  if (!weightMens) return 50;
  const base = 100 - (weightMens - 6) * 7.5;
  return clamp(base, 35, 95);
};

const formatValue = (value: number) => `${Math.round(value)}`;

const buildRadarPoints = (values: number[], radius: number, center: number) => {
  const step = (Math.PI * 2) / values.length;
  return values
    .map((value, index) => {
      const angle = step * index - Math.PI / 2;
      const r = (value / 100) * radius;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
};

async function loadShoe(id: string): Promise<Shoe | undefined> {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data } = await supabase
      .from("shoe_models")
      .select("*")
      .eq("item_key", id)
      .eq("is_active", true)
      .single();

    if (data) {
      return mapDbShoe(data as DbShoe);
    }
  }

  return shoes.find((item) => item.id === id);
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const shoe = await loadShoe(id);
  if (!shoe) return { title: "Shoe Not Found" };
  return {
    title: `${shoe.brand} ${shoe.name}`,
    description: `${shoe.brand} ${shoe.name} — ${shoe.cushion} cushion, ${shoe.stability} stability running shoe. Stack height: ${shoe.stack}mm, drop: ${shoe.drop}mm.`,
  };
}

export default async function ShoeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const shoe = await loadShoe(id);
  if (!shoe) {
    notFound();
  }

  const metrics = [
    { label: "Support", value: supportScore(shoe.stability) },
    { label: "Cushion", value: cushionScore(shoe.cushion) },
    { label: "Durability", value: durabilityScore(shoe.usageTypes) },
    { label: "Popularity", value: shoe.popularity },
    { label: "Price", value: priceScore(shoe.price) },
    { label: "Versatility", value: versatilityScore(shoe.usageTypes, shoe.surfaces) },
    { label: "Lightness", value: lightnessScore(shoe.weightMens) }
  ];

  const radarSize = 300;
  const radarRadius = 110;
  const center = radarSize / 2;
  const ringLevels = [20, 40, 60, 80, 100];
  const metricValues = metrics.map((metric) => metric.value);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${shoe.brand} ${shoe.name}`,
    brand: { "@type": "Brand", name: shoe.brand },
    description: shoe.description || `${shoe.brand} ${shoe.name} running shoe`,
    ...(shoe.price ? { offers: { "@type": "Offer", price: shoe.price, priceCurrency: "USD" } } : {}),
    ...(shoe.imageUrl ? { image: shoe.imageUrl } : {}),
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="tool-hero container">
        <Link className="btn btn-ghost btn-sm" href="/tools/shoe-selector">
          Back to Shoe Finder
        </Link>
        <h1>{shoe.name}</h1>
        <p>{shoe.description || `${shoe.brand} running shoe`}</p>
      </section>

      <section className="section container">
        <div className="analysis-grid">
          <div className="stack">
            <div className="card">
              <div className="stack">
                <strong>Quick specs</strong>
                <div className="hero-strip">
                  <div className="hero-strip-item">
                    <span>Foot strike</span>
                    <strong>{joinLabels(shoe.footStrike)}</strong>
                  </div>
                  <div className="hero-strip-item">
                    <span>Cadence</span>
                    <strong>{joinLabels(shoe.cadence)}</strong>
                  </div>
                  <div className="hero-strip-item">
                    <span>Toe box</span>
                    <strong>{prettyLabel(shoe.toeBox)}</strong>
                  </div>
                  <div className="hero-strip-item">
                    <span>Cushion</span>
                    <strong>{prettyLabel(shoe.cushion)}</strong>
                  </div>
                  <div className="hero-strip-item">
                    <span>Support</span>
                    <strong>{prettyLabel(shoe.stability)}</strong>
                  </div>
                  <div className="hero-strip-item">
                    <span>Surface</span>
                    <strong>{joinLabels(shoe.surfaces)}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="stack">
                <strong>Best for</strong>
                <div className="tag-grid">
                  {shoe.usageTypes.map((usage) => (
                    <span key={usage} className="tag">
                      {prettyLabel(usage)}
                    </span>
                  ))}
                </div>
                {shoe.pros.length > 0 ? (
                  <>
                    <div className="divider" />
                    <strong>Pros</strong>
                    <div className="tag-grid">
                      {shoe.pros.map((item) => (
                        <span key={item} className="tag">
                          {item}
                        </span>
                      ))}
                    </div>
                  </>
                ) : null}
                {shoe.cons.length > 0 ? (
                  <>
                    <strong>Cons</strong>
                    <div className="tag-grid">
                      {shoe.cons.map((item) => (
                        <span key={item} className="tag">
                          {item}
                        </span>
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </div>

          <div className="stack">
            <div className="card card-accent">
              <div className="stack">
                <strong>Skill profile</strong>
                <div className="skill-chart">
                  <svg viewBox={`0 0 ${radarSize} ${radarSize}`} aria-hidden="true">
                    {ringLevels.map((level) => (
                      <polygon
                        key={level}
                        className="skill-ring"
                        points={buildRadarPoints(
                          Array(metrics.length).fill(level),
                          radarRadius,
                          center
                        )}
                      />
                    ))}
                    {metrics.map((metric, index) => {
                      const angle = (Math.PI * 2) / metrics.length * index - Math.PI / 2;
                      const x = center + radarRadius * Math.cos(angle);
                      const y = center + radarRadius * Math.sin(angle);
                      return (
                        <line
                          key={metric.label}
                          className="skill-axis"
                          x1={center}
                          y1={center}
                          x2={x}
                          y2={y}
                        />
                      );
                    })}
                    <polygon
                      className="skill-shape"
                      points={buildRadarPoints(metricValues, radarRadius, center)}
                    />
                    {metrics.map((metric, index) => {
                      const angle = (Math.PI * 2) / metrics.length * index - Math.PI / 2;
                      const labelRadius = radarRadius + 22;
                      const x = center + labelRadius * Math.cos(angle);
                      const y = center + labelRadius * Math.sin(angle);
                      const anchor = x < center - 10 ? "end" : x > center + 10 ? "start" : "middle";
                      return (
                        <text
                          key={`${metric.label}-label`}
                          className="skill-label"
                          x={x}
                          y={y}
                          textAnchor={anchor}
                          dominantBaseline="middle"
                        >
                          {metric.label}
                        </text>
                      );
                    })}
                  </svg>
                </div>
                <div className="skill-list">
                  {metrics.map((metric) => (
                    <div key={metric.label} className="skill-row">
                      <span>{metric.label}</span>
                      <strong>{formatValue(metric.value)}</strong>
                    </div>
                  ))}
                </div>
                <p className="brand-sub">
                  Ratings compare the current lineup. Price favors lower cost.
                </p>
              </div>
            </div>

            <div className="card">
              <div className="stack">
                <strong>Key stats</strong>
                <div className="stat-grid">
                  <div className="stat">
                    <strong>{shoe.price ? `$${shoe.price}` : "TBD"}</strong>
                    <span>Price</span>
                  </div>
                  <div className="stat">
                    <strong>{shoe.stack ? `${shoe.stack} mm` : "—"}</strong>
                    <span>Stack height</span>
                  </div>
                  <div className="stat">
                    <strong>{shoe.drop != null ? `${shoe.drop} mm` : "—"}</strong>
                    <span>Drop</span>
                  </div>
                  <div className="stat">
                    <strong>{shoe.weightMens ? `${shoe.weightMens} oz` : "—"}</strong>
                    <span>Men&apos;s weight</span>
                  </div>
                  <div className="stat">
                    <strong>{shoe.weightWomens ? `${shoe.weightWomens} oz` : "—"}</strong>
                    <span>Women&apos;s weight</span>
                  </div>
                  <div className="stat">
                    <strong>{shoe.weightRange ? prettyLabel(shoe.weightRange) : "—"}</strong>
                    <span>Runner profile</span>
                  </div>
                </div>
              </div>
            </div>

            {shoe.productUrl ? (
              <a
                className="btn btn-secondary"
                href={shoe.productUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                View on {shoe.brand} website
              </a>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
