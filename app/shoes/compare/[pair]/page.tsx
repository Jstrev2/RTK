import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import BuyLinks from "@/components/buy-links";
import JsonLd from "@/components/json-ld";
import { pageMetadata, SITE_URL } from "@/lib/seo";
import {
  capitalize,
  comparisonLead,
  comparisonVerdicts,
  cushionLabel,
  getCollectionIndex,
  getComparisonIndex,
  joinWords,
  mm,
  money,
  monthYear,
  otherComparisons,
  oz,
  resolvePair,
  sharedCollections,
  shoeName,
  supportLabel,
  toeBoxLabel,
  usageWords,
  whoSuits,
  type ContentShoe
} from "@/lib/content/shoes";
import styles from "../../best/content.module.css";

export const revalidate = 86400;
export const dynamicParams = true;

// Over a thousand pairs: render on first request, then cache for a day.
export async function generateStaticParams(): Promise<{ pair: string }[]> {
  return [];
}

type Props = { params: Promise<{ pair: string }> };

const OTHER_LINKS = 6;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pair: raw } = await params;
  const found = await resolvePair(raw);
  if (found.kind !== "found") return { title: "Comparison not found" };
  const { a, b } = found.pair;
  const lead = comparisonLead(a, b);
  return pageMetadata({
    title: `${shoeName(a)} vs ${shoeName(b)}`,
    description: `${shoeName(a)} vs ${shoeName(b)}, compared on price, weight, stack, drop and support. ${lead}`,
    path: `/shoes/compare/${found.pair.slug}`
  });
}

const specRows: { label: string; value: (shoe: ContentShoe) => string }[] = [
  { label: "Price (MSRP)", value: (s) => (s.price ? money(s.price) : "Not listed") },
  { label: "Weight, men's", value: (s) => (s.weightMens ? oz(s.weightMens) : "Not listed") },
  { label: "Weight, women's", value: (s) => (s.weightWomens ? oz(s.weightWomens) : "Not listed") },
  { label: "Heel stack", value: (s) => mm(s.stack) },
  { label: "Drop", value: (s) => mm(s.drop) },
  { label: "Cushion", value: (s) => cushionLabel(s.cushion) },
  { label: "Support", value: (s) => supportLabel(s.stability) },
  { label: "Toe box", value: (s) => toeBoxLabel(s.toeBox) },
  { label: "Foot strike", value: (s) => (s.footStrike.length ? capitalize(joinWords(s.footStrike)) : "Any") },
  { label: "Listed for", value: (s) => capitalize(joinWords(s.usageTypes.map(usageWords))) },
  { label: "Released", value: (s) => monthYear(s) }
];

function ProsCons({ shoe }: { shoe: ContentShoe }) {
  return (
    <div className="card">
      <div className="stack">
        <strong>
          <Link href={`/shoes/${shoe.id}`}>{shoeName(shoe)}</Link>
        </strong>
        {shoe.pros.length ? (
          <>
            <span className="label">Good</span>
            <ul>
              {shoe.pros.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </>
        ) : null}
        {shoe.cons.length ? (
          <>
            <span className="label">Watch for</span>
            <ul>
              {shoe.cons.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </>
        ) : null}
        <BuyLinks name={shoe.name} brand={shoe.brand} compact />
      </div>
    </div>
  );
}

export default async function ComparisonPage({ params }: Props) {
  const { pair: raw } = await params;
  const found = await resolvePair(raw);
  if (found.kind === "redirect") permanentRedirect(`/shoes/compare/${found.slug}`);
  if (found.kind !== "found") notFound();

  const { a, b, slug } = found.pair;
  const [comparisons, collections] = await Promise.all([getComparisonIndex(), getCollectionIndex()]);
  const nameA = shoeName(a);
  const nameB = shoeName(b);
  const title = `${nameA} vs ${nameB}`;
  const path = `/shoes/compare/${slug}`;
  const verdicts = comparisonVerdicts(a, b);
  const shared = sharedCollections(collections, a, b);
  const others = (shoe: ContentShoe) => otherComparisons(comparisons, shoe.id, slug).slice(0, OTHER_LINKS);

  const product = (shoe: ContentShoe) => ({
    "@type": "Product",
    name: shoeName(shoe),
    brand: { "@type": "Brand", name: shoe.brand },
    url: `${SITE_URL}/shoes/${shoe.id}`,
    ...(shoe.description ? { description: shoe.description } : {}),
    ...(shoe.imageUrl ? { image: shoe.imageUrl } : {}),
    ...(shoe.price
      ? {
          offers: {
            "@type": "Offer",
            price: shoe.price,
            priceCurrency: "USD",
            availability: "https://schema.org/InStock",
            url: `${SITE_URL}/shoes/${shoe.id}`
          }
        }
      : {})
  });

  return (
    <div className="editorial-page">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
                { "@type": "ListItem", position: 2, name: "Shoe Database", item: `${SITE_URL}/shoes` },
                { "@type": "ListItem", position: 3, name: title, item: `${SITE_URL}${path}` }
              ]
            },
            {
              "@type": "ItemList",
              name: title,
              numberOfItems: 2,
              itemListElement: [a, b].map((shoe, i) => ({ "@type": "ListItem", position: i + 1, item: product(shoe) }))
            }
          ]
        }}
      />

      <section className="tool-hero container">
        <span className="eyebrow">
          <Link href="/shoes">Shoe database</Link> · Head to head
        </span>
        <h1>{title}</h1>
        <p>{comparisonLead(a, b)}</p>
        <div className="button-row" style={{ marginTop: "20px" }}>
          <Link className="btn btn-secondary btn-sm" href={`/shoes/${a.id}`}>
            {nameA} specs
          </Link>
          <Link className="btn btn-secondary btn-sm" href={`/shoes/${b.id}`}>
            {nameB} specs
          </Link>
        </div>
      </section>

      <section className="section container">
        <div className="stack" style={{ gap: "18px" }}>
          <h2 className="section-title">Which one suits you</h2>
          <div className={styles.picks}>
            <div className="card">
              <p>{whoSuits(a, b)}</p>
            </div>
            <div className="card">
              <p>{whoSuits(b, a)}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section container">
        <div className="stack" style={{ gap: "18px" }}>
          <h2 className="section-title">The specs, side by side</h2>
          <div className="table-wrap">
            <table className={`table ${styles.compareTable}`}>
              <thead>
                <tr>
                  <th>Spec</th>
                  <th>
                    <Link href={`/shoes/${a.id}`}>{nameA}</Link>
                  </th>
                  <th>
                    <Link href={`/shoes/${b.id}`}>{nameB}</Link>
                  </th>
                </tr>
              </thead>
              <tbody>
                {specRows.map((row) => (
                  <tr key={row.label}>
                    <td>
                      <strong>{row.label}</strong>
                    </td>
                    <td>{row.value(a)}</td>
                    <td>{row.value(b)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="section container">
        <div className="stack" style={{ gap: "18px" }}>
          <h2 className="section-title">Where each one wins</h2>
          <div className={styles.verdicts}>
            {verdicts.map((v) => (
              <div key={v.dimension} className={styles.verdict}>
                <strong>
                  {v.dimension}
                  {v.edge ? <span className={styles.edge}>Edge: {v.edge}</span> : null}
                </strong>
                <p>{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section container">
        <div className="stack" style={{ gap: "18px" }}>
          <h2 className="section-title">The tradeoffs on each</h2>
          <div className="grid grid-2">
            <ProsCons shoe={a} />
            <ProsCons shoe={b} />
          </div>
        </div>
      </section>

      <section className="section container">
        <div className="stack" style={{ gap: "18px" }}>
          {[a, b].map((shoe) => {
            const list = others(shoe);
            if (!list.length) return null;
            return (
              <div key={shoe.id} className="stack">
                <span className="label">Other comparisons with the {shoeName(shoe)}</span>
                <div className={styles.linkGrid}>
                  {list.map(({ slug: otherSlug, other }) => (
                    <Link key={otherSlug} className="tag" href={`/shoes/compare/${otherSlug}`}>
                      vs {shoeName(other)}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
          {shared.length ? (
            <div className="stack">
              <span className="label">Lists with both shoes</span>
              <div className={styles.linkGrid}>
                {shared.map((c) => {
                  const rankA = c.ranked.find((r) => r.shoe.id === a.id)?.rank;
                  const rankB = c.ranked.find((r) => r.shoe.id === b.id)?.rank;
                  return (
                    <Link key={c.slug} className="tag" href={`/shoes/best/${c.slug}`}>
                      Best {c.title} (#{rankA} and #{rankB})
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="container next-step-card section">
        <div>
          <div className="eyebrow">Shoe Finder</div>
          <h2>If it&apos;s still a tie, let your stride break it.</h2>
          <p>
            The Shoe Finder scores every shoe in our database against how you land, how far you run and what you want to
            spend, so you can see where these two fall for you.
          </p>
        </div>
        <Link className="btn btn-primary" href="/tools/shoe-selector">
          Find my shoe
        </Link>
      </section>

      <p className="container shoe-affiliate-note">
        Runner Toolkit may earn a commission from retailer links. That never changes how we compare shoes or the price
        you pay.
      </p>
    </div>
  );
}
