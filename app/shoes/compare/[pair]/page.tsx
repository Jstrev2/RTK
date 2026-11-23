import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import BuyLinks from "@/components/buy-links";
import JsonLd from "@/components/json-ld";
import ShoeBib from "@/components/shoe-bib";
import { shoeToCard, shortParagraphs } from "@/lib/shoe-catalog";
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
import "@/components/shoes.css";

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

const specRows: { label: string; value: (shoe: ContentShoe) => string; better?: (shoe: ContentShoe) => number }[] = [
  { label: "Price", value: (s) => (s.price ? money(s.price) : "n/a"), better: (s) => (s.price ? -s.price : -Infinity) },
  { label: "Weight (M)", value: (s) => (s.weightMens ? oz(s.weightMens) : "n/a"), better: (s) => (s.weightMens ? -s.weightMens : -Infinity) },
  { label: "Weight (W)", value: (s) => (s.weightWomens ? oz(s.weightWomens) : "n/a"), better: (s) => (s.weightWomens ? -s.weightWomens : -Infinity) },
  { label: "Heel stack", value: (s) => mm(s.stack) },
  { label: "Drop", value: (s) => mm(s.drop) },
  { label: "Cushion", value: (s) => cushionLabel(s.cushion) },
  { label: "Support", value: (s) => supportLabel(s.stability) },
  { label: "Toe box", value: (s) => toeBoxLabel(s.toeBox) },
  { label: "Best for", value: (s) => capitalize(joinWords(s.usageTypes.map(usageWords))) },
  { label: "Released", value: (s) => monthYear(s) }
];

function GoodBad({ shoe }: { shoe: ContentShoe }) {
  return (
    <div className="panel">
      <h3>
        <Link href={`/shoes/${shoe.id}`}>{shoeName(shoe)}</Link>
      </h3>
      {shoe.pros.length ? (
        <div className="goodbad good">
          <ul>
            {shoe.pros.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {shoe.cons.length ? (
        <div className="goodbad bad" style={{ marginTop: 10 }}>
          <ul>
            {shoe.cons.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <div style={{ marginTop: 14 }}>
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
  const lead = shortParagraphs([comparisonLead(a, b)], 2)[0];

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
    <div>
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

      <section className="page-hero collection-hero">
        <div className="container">
          <nav className="shoe-detail-crumbs" aria-label="Breadcrumb">
            <Link href="/shoes">All shoes</Link>
            <span>Head to head</span>
          </nav>
          <h1>{title}</h1>
          <p className="page-hero-sub">{lead}</p>
        </div>
      </section>

      <section className="container">
        <div className="versus">
          <ShoeBib shoe={shoeToCard(a)} eager />
          <span className="versus-vs" aria-hidden="true">
            VS
          </span>
          <ShoeBib shoe={shoeToCard(b)} eager />
        </div>
      </section>

      <section className="container shoe-section">
        <h2>Side by side</h2>
        <div className="table-wrap">
          <table className="vs-table">
            <thead>
              <tr>
                <th scope="col">
                  <span className="sr-only">Spec</span>
                </th>
                <th scope="col">{nameA}</th>
                <th scope="col">{nameB}</th>
              </tr>
            </thead>
            <tbody>
              {specRows.map((row) => {
                const [va, vb] = row.better ? [row.better(a), row.better(b)] : [0, 0];
                return (
                  <tr key={row.label}>
                    <th scope="row">{row.label}</th>
                    <td className={row.better && va > vb ? "win" : undefined}>{row.value(a)}</td>
                    <td className={row.better && vb > va ? "win" : undefined}>{row.value(b)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {verdicts.some((v) => v.edge) ? (
        <section className="container shoe-section">
          <h2>Who wins what</h2>
          <div className="table-wrap">
            <table className="vs-table">
              <tbody>
                {verdicts.map((v) => (
                  <tr key={v.dimension}>
                    <th scope="row">{v.dimension}</th>
                    <td className={v.edge ? "win" : undefined}>{v.edge ?? "Tie"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <details className="fineprint">
            <summary>Why</summary>
            {verdicts.map((v) => (
              <p key={v.dimension}>
                <strong>{v.dimension}.</strong> {v.text}
              </p>
            ))}
          </details>
        </section>
      ) : null}

      <section className="container shoe-section">
        <h2>Pick it if...</h2>
        <div className="verdict-pair">
          {[
            [a, b],
            [b, a]
          ].map(([x, y]) => (
            <div key={x.id} className="panel">
              {shortParagraphs([whoSuits(x, y)]).map((paragraph) => (
                <p key={paragraph} style={{ margin: "0 0 8px" }}>
                  {paragraph}
                </p>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="container shoe-section">
        <h2>Good and not so good</h2>
        <div className="verdict-pair">
          <GoodBad shoe={a} />
          <GoodBad shoe={b} />
        </div>
      </section>

      <section className="container shoe-section">
        {[a, b].map((shoe) => {
          const list = others(shoe);
          if (!list.length) return null;
          return (
            <div key={shoe.id} style={{ marginBottom: 18 }}>
              <h3>More {shoeName(shoe)} matchups</h3>
              <div className="compare-links">
                {list.map(({ slug: otherSlug, other }) => (
                  <Link key={otherSlug} className="chip" href={`/shoes/compare/${otherSlug}`}>
                    vs {shoeName(other)}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
        {shared.length ? (
          <div>
            <h3>Lists with both</h3>
            <div className="compare-links">
              {shared.map((c) => {
                const rankA = c.ranked.find((r) => r.shoe.id === a.id)?.rank;
                const rankB = c.ranked.find((r) => r.shoe.id === b.id)?.rank;
                return (
                  <Link key={c.slug} className="chip" href={`/shoes/best/${c.slug}`}>
                    Best {c.title} (#{rankA}, #{rankB})
                  </Link>
                );
              })}
            </div>
          </div>
        ) : null}
        <p className="fineprint-inline">
          Still a tie? The <Link className="text-link" href="/tools/shoe-selector">Shoe Finder</Link> picks three in three
          taps. Runner Toolkit may earn a commission from retailer links; that never changes how we compare shoes.
        </p>
      </section>
    </div>
  );
}
