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
import SaveButton from "@/components/save-button";
import ShoeBib from "@/components/shoe-bib";
import { CUSHION_LABEL, SUPPORT_LABEL, USE_LABEL, shoeToCard } from "@/lib/shoe-catalog";
import "@/components/shoes.css";
import { SITE_URL } from "@/lib/seo";
import { getComparisonsForShoe } from "@/lib/content/shoes";

export const revalidate = 86400;

// Paths render on demand and are then cached for the revalidate window.
export async function generateStaticParams(): Promise<{ id: string }[]> {
  return [];
}

const SUPPORT_METER: Record<string, number> = { neutral: 20, mild: 50, moderate: 75, motion_control: 100 };
const CUSHION_METER: Record<string, number> = { minimal: 30, moderate: 62, maximum: 100 };

/** 6 oz reads as featherlight, 12.5 oz as heavy. */
const weightMeter = (oz: number) => Math.round(Math.min(100, Math.max(8, ((oz - 5.5) / 7) * 100)));


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
    // With a reachable DB, never fall back to the bundled list, because bundled
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
  const description = `${title} review data: ${prettyLabel(shoe.cushion)} cushion, ${prettyLabel(
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

  const [alternatives, comparisons] = await Promise.all([
    loadAlternatives(shoe),
    // Comparison links are extra: a failed catalog read must not break the page.
    getComparisonsForShoe(shoe.id).catch(() => [])
  ]);
  const title = displayName(shoe);

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

  const specs: Array<{ label: string; value: string | number | null; unit?: string }> = [
    { label: "Weight (M)", value: shoe.weightMens || null, unit: "oz" },
    { label: "Weight (W)", value: shoe.weightWomens || null, unit: "oz" },
    { label: "Drop", value: shoe.drop ?? null, unit: "mm" },
    { label: "Heel stack", value: shoe.stack || null, unit: "mm" },
    { label: "Toe box", value: prettyLabel(shoe.toeBox) },
    {
      label: "Released",
      value: shoe.releaseDate
        ? new Date(`${shoe.releaseDate}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" })
        : shoe.releaseYear ?? null
    }
  ];
  const meters = [
    { label: "Cushion", value: CUSHION_METER[shoe.cushion] ?? 60, text: CUSHION_LABEL[shoe.cushion] ?? prettyLabel(shoe.cushion) },
    { label: "Support", value: SUPPORT_METER[shoe.stability] ?? 20, text: SUPPORT_LABEL[shoe.stability] ?? prettyLabel(shoe.stability) },
    ...(shoe.weightMens
      ? [{ label: "Weight", value: weightMeter(shoe.weightMens), text: shoe.weightMens <= 8 ? "Light" : shoe.weightMens <= 10 ? "Average" : "Heavy" }]
      : [])
  ];

  return (
    <div>
      <JsonLd data={jsonLd} />
      <JsonLd data={breadcrumbs} />

      <section className="container shoe-detail-top">
        <div className="shoe-detail-photo">
          {shoe.imageUrl ? (
            <img src={shoe.imageUrl} alt={`${title} running shoe, side view`} width={900} height={600} fetchPriority="high" />
          ) : (
            <span className="bib-photo-fallback">{shoe.brand}</span>
          )}
        </div>
        <div className="shoe-detail-head">
          <nav className="shoe-detail-crumbs" aria-label="Breadcrumb">
            <Link href="/shoes">All shoes</Link>
            <Link href={`/shoes?brand=${encodeURIComponent(shoe.brand)}`}>{shoe.brand}</Link>
          </nav>
          <h1>{title}</h1>
          <div className="shoe-detail-tags">
            {shoe.usageTypes.map((usage) => (
              <span key={usage} className="tag">
                {USE_LABEL[usage] ?? prettyLabel(usage)}
              </span>
            ))}
            <span className="tag">{CUSHION_LABEL[shoe.cushion] ?? prettyLabel(shoe.cushion)}</span>
            <span className="tag">{SUPPORT_LABEL[shoe.stability] ?? prettyLabel(shoe.stability)}</span>
          </div>
          {shoe.description ? <p className="shoe-detail-verdict">{shoe.description}</p> : null}
          <div className="spec-strip">
            {specs.map((spec) => (
              <span key={spec.label} className="split">
                <small>{spec.label}</small>
                <span>
                  <b>{spec.value ?? "n/a"}</b>
                  {spec.value !== null && spec.unit ? ` ${spec.unit}` : ""}
                </span>
              </span>
            ))}
          </div>
          <div className="shoe-detail-price">
            <span className="clock">{shoe.price ? `$${shoe.price}` : "Price varies"}</span>
            <SaveButton itemType="shoe" itemId={shoe.id} label={title} />
          </div>
        </div>
      </section>

      <section className="container shoe-detail-grid">
        <div className="panel">
          <h2 className="eyebrow">How it rides</h2>
          <div className="meter-list">
            {meters.map((meter) => (
              <div key={meter.label} className="meter">
                <span>{meter.label}</span>
                <span className="meter-track" aria-hidden="true">
                  <span className="meter-fill" style={{ width: `${meter.value}%` }} />
                </span>
                <small>{meter.text}</small>
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <BuyLinks name={shoe.name} brand={shoe.brand} />
        </div>
        {shoe.pros.length ? (
          <div className="panel goodbad good">
            <h2>Good</h2>
            <ul>
              {shoe.pros.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {shoe.cons.length ? (
          <div className="panel goodbad bad">
            <h2>Not so good</h2>
            <ul>
              {shoe.cons.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      {alternatives.length ? (
        <section className="container shoe-section">
          <div className="section-head">
            <h2>Similar shoes</h2>
            <Link className="btn btn-sm" href={`/shoes?use=${shoe.usageTypes[0] ?? ""}`}>
              More like this
            </Link>
          </div>
          <div className="bib-grid">
            {alternatives.map((alt) => (
              <ShoeBib key={alt.id} shoe={shoeToCard(alt)} />
            ))}
          </div>
        </section>
      ) : null}

      {comparisons.length ? (
        <section className="container shoe-section">
          <h2>Compare it</h2>
          <div className="compare-links">
            {comparisons.slice(0, 8).map(({ slug, other }) => (
              <Link key={slug} className="chip" href={`/shoes/compare/${slug}`}>
                vs {displayName(other)}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {shoe.productUrl ? (
        <section className="container shoe-section">
          <a className="btn btn-ghost" href={shoe.productUrl} target="_blank" rel="noopener noreferrer">
            View on {shoe.brand} website
          </a>
        </section>
      ) : null}
    </div>
  );
}
