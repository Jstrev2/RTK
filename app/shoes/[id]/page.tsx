import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { shoes } from "@/lib/data";
import type { Shoe } from "@/lib/data";
import { mapDbShoe, displayName, prettyLabel, modelFamily, type DbShoe } from "@/lib/shoe-utils";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import BuyLinks from "@/components/buy-links";
import JsonLd from "@/components/json-ld";
import { SITE_URL } from "@/lib/seo";

export const revalidate = 86400;

// Paths render on demand and are then cached for the revalidate window.
export async function generateStaticParams(): Promise<{ id: string }[]> {
  return [];
}

const joinLabels = (values: string[]) =>
  values.map(prettyLabel).join(", ");

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

const usagePhrases: Record<string, string> = {
  daily_trainer: "everyday training miles",
  long_run: "long runs",
  speed_work: "tempo days and intervals",
  race_day: "race day",
  recovery_runs: "easy recovery days"
};

const whoItsFor = (shoe: Shoe): string => {
  const sentences: string[] = [];

  const uses = shoe.usageTypes
    .map((u) => usagePhrases[u])
    .filter(Boolean);
  if (uses.length) {
    sentences.push(
      `Reach for the ${displayName(shoe)} for ${
        uses.length > 1
          ? `${uses.slice(0, -1).join(", ")} and ${uses[uses.length - 1]}`
          : uses[0]
      }.`
    );
  }

  if (shoe.stability === "moderate" || shoe.stability === "motion_control") {
    sentences.push(
      "It has real support built in, so it suits runners who overpronate or like a locked-in, guided ride."
    );
  } else if (shoe.stability === "mild") {
    sentences.push(
      "A wide, stable base keeps it steady without stability hardware — a good pick if you're mostly neutral but like a planted feel."
    );
  } else {
    sentences.push(
      "It's a neutral shoe, best for runners with an efficient stride who don't need pronation support."
    );
  }

  if (shoe.cushion === "maximum") {
    sentences.push(
      "The tall, soft stack favors comfort over ground feel — great for high mileage and bigger runners, less so for racing snappiness."
    );
  } else if (shoe.cushion === "minimal") {
    sentences.push(
      "Expect a firm, low-to-the-ground feel that rewards fast turnover but offers less protection on long efforts."
    );
  }

  return sentences.join(" ");
};

// cache() dedupes the query between generateMetadata and the page render.
const loadShoe = cache(async (id: string): Promise<Shoe | undefined> => {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase
      .from("shoe_models")
      .select("*")
      .eq("item_key", id)
      .eq("is_active", true)
      .maybeSingle();

    // Throw on infrastructure errors: during ISR revalidation Next keeps
    // serving the last good page, instead of caching a 404 over a live shoe.
    if (error) {
      throw new Error(`Failed to load shoe ${id}: ${error.message}`);
    }
    if (data) {
      return mapDbShoe(data as DbShoe);
    }
    // DB reachable but no active row: a deactivated shoe must 404, not
    // resurrect from the bundled fallback list.
    return undefined;
  }

  return shoes.find((item) => item.id === id);
});

async function loadAlternatives(shoe: Shoe): Promise<Shoe[]> {
  const supabase = getSupabaseAdmin();
  let pool: Shoe[] = [];

  if (supabase) {
    const { data } = await supabase
      .from("shoe_models")
      .select("*")
      .eq("is_active", true)
      .neq("item_key", shoe.id)
      .overlaps("usage_types", shoe.usageTypes.length ? shoe.usageTypes : ["daily_trainer"])
      .order("popularity", { ascending: false })
      .limit(24);
    if (data?.length) {
      pool = (data as DbShoe[]).map(mapDbShoe);
    }
    // With a reachable DB, never fall back to the bundled list — bundled
    // shoes that were since deactivated would render as 404ing links.
  } else {
    pool = shoes.filter(
      (item) =>
        item.id !== shoe.id &&
        item.usageTypes.some((u) => shoe.usageTypes.includes(u))
    );
  }

  // Prefer same cushion class and a similar price band, then popularity.
  // Keep one version per model family (not Bondi 9 AND Bondi 10), and never
  // another version of the shoe being viewed.
  const ranked = pool
    .filter((item) => modelFamily(item.name) !== modelFamily(shoe.name))
    .map((item) => {
      let affinity = item.popularity / 100;
      if (item.cushion === shoe.cushion) affinity += 1;
      if (item.stability === shoe.stability) affinity += 0.75;
      if (shoe.price && item.price && Math.abs(item.price - shoe.price) <= 40)
        affinity += 0.5;
      return { item, affinity };
    })
    .sort((a, b) => b.affinity - a.affinity);

  const seen = new Set<string>();
  const picks: Shoe[] = [];
  for (const { item } of ranked) {
    const family = modelFamily(item.name);
    if (seen.has(family)) continue;
    seen.add(family);
    picks.push(item);
    if (picks.length === 4) break;
  }
  return picks;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const shoe = await loadShoe(id);
  if (!shoe) return { title: "Shoe Not Found" };
  const title = displayName(shoe);
  const description = `${title} review data — ${prettyLabel(shoe.cushion)} cushion, ${prettyLabel(
    shoe.stability
  )} support. ${shoe.stack ? `${shoe.stack}mm stack, ` : ""}${
    shoe.drop ? `${shoe.drop}mm drop, ` : ""
  }specs, pros & cons, and where to buy.`;
  const image = shoe.imageUrl ?? "/og.jpg";
  return {
    title,
    description,
    alternates: { canonical: `/shoes/${id}` },
    openGraph: {
      title,
      description,
      type: "website",
      url: `/shoes/${id}`,
      siteName: "Runner Toolkit",
      images: [{ url: image, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function ShoeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const shoe = await loadShoe(id);
  if (!shoe) {
    notFound();
  }

  const alternatives = await loadAlternatives(shoe);
  const title = displayName(shoe);

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

  const pageUrl = `${SITE_URL}/shoes/${shoe.id}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: title,
    url: pageUrl,
    brand: { "@type": "Brand", name: shoe.brand },
    description: shoe.description || `${title} running shoe`,
    ...(shoe.price
      ? {
          offers: {
            "@type": "Offer",
            price: shoe.price,
            priceCurrency: "USD",
            availability: "https://schema.org/InStock",
            itemCondition: "https://schema.org/NewCondition",
            url: pageUrl,
          },
        }
      : {}),
    ...(shoe.imageUrl ? { image: shoe.imageUrl } : {}),
  };

  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Shoe Database", item: `${SITE_URL}/shoes` },
      { "@type": "ListItem", position: 3, name: title },
    ],
  };

  return (
    <div>
      <JsonLd data={jsonLd} />
      <JsonLd data={breadcrumbs} />
      <section className="tool-hero container">
        <div className="button-row">
          <Link className="btn btn-ghost btn-sm" href="/shoes">
            All shoes
          </Link>
          <Link className="btn btn-ghost btn-sm" href="/tools/shoe-selector">
            Back to Shoe Finder
          </Link>
        </div>
        <h1>{title}</h1>
        <p>{shoe.description || `${shoe.brand} road running shoe`}</p>
      </section>

      <section className="section container">
        <div className="analysis-grid">
          <div className="stack">
            {shoe.imageUrl ? (
              <div className="card">
                <img
                  src={shoe.imageUrl}
                  alt={`${title} running shoe`}
                  width={640}
                  height={427}
                  decoding="async"
                  style={{ width: "100%", height: "auto", aspectRatio: "3 / 2", objectFit: "contain" }}
                />
              </div>
            ) : null}
            <div className="card">
              <div className="stack">
                <strong>Quick specs</strong>
                <div className="hero-strip">
                  <div className="hero-strip-item">
                    <span>Cushion</span>
                    <strong>{prettyLabel(shoe.cushion)}</strong>
                  </div>
                  <div className="hero-strip-item">
                    <span>Support</span>
                    <strong>{prettyLabel(shoe.stability)}</strong>
                  </div>
                  <div className="hero-strip-item">
                    <span>Drop</span>
                    <strong>{shoe.drop ? `${shoe.drop} mm` : "—"}</strong>
                  </div>
                  <div className="hero-strip-item">
                    <span>Heel stack</span>
                    <strong>{shoe.stack ? `${shoe.stack} mm` : "—"}</strong>
                  </div>
                  <div className="hero-strip-item">
                    <span>Toe box</span>
                    <strong>{prettyLabel(shoe.toeBox)}</strong>
                  </div>
                  <div className="hero-strip-item">
                    <span>Foot strike</span>
                    <strong>{joinLabels(shoe.footStrike) || "All"}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="stack">
                <strong>Who it&apos;s for</strong>
                <p>{whoItsFor(shoe)}</p>
                <div className="tag-grid">
                  {shoe.usageTypes.map((usage) => (
                    <span key={usage} className="tag">
                      {prettyLabel(usage)}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {shoe.pros.length > 0 || shoe.cons.length > 0 ? (
              <div className="card">
                <div className="stack">
                  {shoe.pros.length > 0 ? (
                    <>
                      <strong>Pros</strong>
                      <ul>
                        {shoe.pros.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                  {shoe.cons.length > 0 ? (
                    <>
                      <strong>Cons</strong>
                      <ul>
                        {shoe.cons.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                </div>
              </div>
            ) : null}

            {alternatives.length ? (
              <div className="card">
                <div className="stack">
                  <strong>Similar shoes to consider</strong>
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Shoe</th>
                          <th>Cushion</th>
                          <th>Support</th>
                          <th>Price</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {alternatives.map((alt) => (
                          <tr key={alt.id}>
                            <td>
                              <Link href={`/shoes/${alt.id}`}>
                                <strong>{displayName(alt)}</strong>
                              </Link>
                            </td>
                            <td>{prettyLabel(alt.cushion)}</td>
                            <td>{prettyLabel(alt.stability)}</td>
                            <td>{alt.price ? `$${alt.price}` : "—"}</td>
                            <td>
                              <Link
                                className="btn btn-xs btn-ghost"
                                href={`/shoes/${alt.id}`}
                              >
                                Analyze
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : null}
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
                    <strong>{shoe.price ? `$${shoe.price}` : "—"}</strong>
                    <span>Price (MSRP)</span>
                  </div>
                  <div className="stat">
                    <strong>{shoe.stack ? `${shoe.stack} mm` : "—"}</strong>
                    <span>Stack height</span>
                  </div>
                  <div className="stat">
                    <strong>{shoe.drop ? `${shoe.drop} mm` : "—"}</strong>
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
                    <strong>{shoe.releaseYear ?? "—"}</strong>
                    <span>Release year</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <BuyLinks name={shoe.name} brand={shoe.brand} />
            </div>

            {shoe.productUrl ? (
              <a
                className="btn btn-ghost"
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
