import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/json-ld";
import ShoeBib from "@/components/shoe-bib";
import { shoeToCard, shortParagraphs } from "@/lib/shoe-catalog";
import { pageMetadata, SITE_URL } from "@/lib/seo";
import {
  SHOWN_IN_LIST,
  collectionFaq,
  collectionIntro,
  collectionStats,
  getCollection,
  getCollectionIndex,
  getComparisonIndex,
  listHeading,
  mm,
  money,
  oz,
  pairSlug,
  rankingRule,
  relatedCollections,
  shoeName,
  supportLabel
} from "@/lib/content/shoes";
import "@/components/shoes.css";

export const revalidate = 86400;
export const dynamicParams = true;

// Hundreds of lists: render on first request, then cache for a day.
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  return [];
}

type Props = { params: Promise<{ slug: string }> };

const TABLE_ROWS = 20;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getCollection(slug);
  if (!collection) return { title: "List not found" };
  const st = collectionStats(collection);
  const top = collection.ranked[0].shoe;
  const year = new Date().getFullYear();
  return pageMetadata({
    title: `Best ${collection.title} (${year})`,
    description: `${st.count} ${collection.phrase} ranked from our shoe data. Top pick: the ${shoeName(top)} at ${money(top.price)} and ${oz(top.weightMens)}. Prices run ${money(st.minPrice)} to ${money(st.maxPrice)}.`,
    path: `/shoes/best/${collection.slug}`
  });
}

export default async function CollectionPage({ params }: Props) {
  const { slug } = await params;
  const collection = await getCollection(slug);
  if (!collection) notFound();

  const [index, comparisons] = await Promise.all([getCollectionIndex(), getComparisonIndex()]);
  const path = `/shoes/best/${collection.slug}`;
  const intro = shortParagraphs([...collectionIntro(collection), rankingRule(collection)]);
  const faq = collectionFaq(collection);
  const related = relatedCollections(index, collection);
  const shown = collection.ranked.slice(0, SHOWN_IN_LIST);
  const podium = shown.slice(0, 3);
  const chasers = shown.slice(3);
  const rest = collection.ranked.slice(SHOWN_IN_LIST);
  const [first, second] = collection.ranked;
  const headToHead = second ? comparisons.bySlug.get(pairSlug(first.shoe.id, second.shoe.id)) : undefined;
  const title = `Best ${collection.title}`;
  const st = collectionStats(collection);

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
                { "@type": "ListItem", position: 3, name: "Best running shoes", item: `${SITE_URL}/shoes/best` },
                { "@type": "ListItem", position: 4, name: title, item: `${SITE_URL}${path}` }
              ]
            },
            {
              "@type": "ItemList",
              name: title,
              numberOfItems: collection.ranked.length,
              itemListElement: shown.map((row) => ({
                "@type": "ListItem",
                position: row.rank,
                name: shoeName(row.shoe),
                url: `${SITE_URL}/shoes/${row.shoe.id}`
              }))
            },
            {
              "@type": "FAQPage",
              mainEntity: faq.map((item) => ({
                "@type": "Question",
                name: item.q,
                acceptedAnswer: { "@type": "Answer", text: item.a }
              }))
            }
          ]
        }}
      />

      <section className="page-hero collection-hero">
        <div className="container">
          <nav className="shoe-detail-crumbs" aria-label="Breadcrumb">
            <Link href="/shoes">All shoes</Link>
            <Link href="/shoes/best">Best running shoes</Link>
          </nav>
          <h1>{title}</h1>
          <p className="page-hero-sub">
            {listHeading(collection)}. Ranked by popularity, freshness and fit.
          </p>
          <div className="bib-stats">
            <span className="split">
              <b>{st.count}</b> shoes
            </span>
            <span className="split">
              <b>
                {money(st.minPrice)} to {money(st.maxPrice)}
              </b>
            </span>
            <span className="split">
              median <b>{oz(st.medianWeight)}</b>
            </span>
            <span className="split">
              median <b>{mm(st.medianDrop)}</b> drop
            </span>
          </div>
        </div>
      </section>

      <section className="container shoe-section">
        <div className="bib-grid finder-results-grid">
          {podium.map((row, i) => (
            <ShoeBib
              key={row.shoe.id}
              shoe={shoeToCard(row.shoe)}
              number={row.rank}
              badge={i === 0 ? "Top pick" : undefined}
              reason={row.shoe.pros[0] ? `${row.shoe.pros[0]}.` : undefined}
              eager
            />
          ))}
        </div>
      </section>

      {chasers.length ? (
        <section className="container shoe-section">
          <h2>The rest of the top {shown.length}</h2>
          <div className="collection-rank">
            {chasers.map((row) => {
              const shoe = row.shoe;
              return (
                <Link key={shoe.id} href={`/shoes/${shoe.id}`} className="collection-row">
                  <span className="bib-photo">
                    {shoe.imageUrl ? (
                      <img src={shoe.imageUrl} alt={`${shoeName(shoe)} running shoe`} width={900} height={600} loading="lazy" />
                    ) : (
                      <span className="bib-photo-fallback">{shoe.brand}</span>
                    )}
                  </span>
                  <span className="collection-row-body">
                    <span className="collection-row-title">
                      <span className="clock">{String(row.rank).padStart(2, "0")}</span>
                      <strong>{shoeName(shoe)}</strong>
                    </span>
                    <span className="bib-stats">
                      <span className="split">
                        <b>{shoe.price ? money(shoe.price) : "n/a"}</b>
                      </span>
                      {shoe.weightMens ? (
                        <span className="split">
                          <b>{shoe.weightMens}</b>oz
                        </span>
                      ) : null}
                      <span className="split">
                        <b>{shoe.drop}</b>mm drop
                      </span>
                      <span className="split">{supportLabel(shoe.stability)}</span>
                    </span>
                    {shoe.pros[0] ? <p>{shoe.pros[0]}.</p> : null}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      {rest.length ? (
        <section className="container shoe-section">
          <h2>
            Also on the list, #{SHOWN_IN_LIST + 1} to #{collection.ranked.length}
          </h2>
          <div className="compare-links">
            {rest.map((row) => (
              <Link key={row.shoe.id} className="chip" href={`/shoes/${row.shoe.id}`}>
                {row.rank}. {shoeName(row.shoe)}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="container shoe-section">
        <div className="section-head">
          <h2>Specs side by side</h2>
          {headToHead ? (
            <Link className="btn btn-sm" href={`/shoes/compare/${headToHead.slug}`}>
              #1 vs #2
            </Link>
          ) : null}
        </div>
        <div className="table-wrap">
          <table className="vs-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Shoe</th>
                <th>Price</th>
                <th>Weight</th>
                <th>Stack</th>
                <th>Drop</th>
                <th>Support</th>
              </tr>
            </thead>
            <tbody>
              {collection.ranked.slice(0, TABLE_ROWS).map((row) => (
                <tr key={row.shoe.id}>
                  <td>{row.rank}</td>
                  <td>
                    <Link className="text-link" href={`/shoes/${row.shoe.id}`}>
                      {shoeName(row.shoe)}
                    </Link>
                  </td>
                  <td>{row.shoe.price ? money(row.shoe.price) : "n/a"}</td>
                  <td>{row.shoe.weightMens ? oz(row.shoe.weightMens) : "n/a"}</td>
                  <td>{mm(row.shoe.stack)}</td>
                  <td>{mm(row.shoe.drop)}</td>
                  <td>{supportLabel(row.shoe.stability)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {related.length ? (
        <section className="container shoe-section">
          <h2>Narrow it down</h2>
          <div className="compare-links">
            {related.map((other) => (
              <Link key={other.slug} className="chip" href={`/shoes/best/${other.slug}`}>
                Best {other.title} <span className="clock">{other.ranked.length}</span>
              </Link>
            ))}
            <Link className="chip" href="/shoes/best">
              Every list →
            </Link>
          </div>
        </section>
      ) : null}

      <section className="container shoe-section">
        <details className="fineprint">
          <summary>How this list works</summary>
          {intro.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </details>
        <details className="fineprint">
          <summary>Questions, answered from our data</summary>
          {faq.map((item) => (
            <div key={item.q}>
              <p>
                <strong>{item.q}</strong>
              </p>
              {shortParagraphs([item.a]).map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          ))}
        </details>
        <p className="fineprint-inline">
          Runner Toolkit may earn a commission from retailer links. That never changes the order of this list or the price
          you pay. Not sure? The <Link className="text-link" href="/tools/shoe-selector">Shoe Finder</Link> picks three in three taps.
        </p>
      </section>
    </div>
  );
}
