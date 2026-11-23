import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import BuyLinks from "@/components/buy-links";
import JsonLd from "@/components/json-ld";
import { pageMetadata, SITE_URL } from "@/lib/seo";
import {
  SHOWN_IN_LIST,
  collectionFaq,
  collectionIntro,
  collectionStats,
  cushionLabel,
  firstSentence,
  getCollection,
  getCollectionIndex,
  getComparisonIndex,
  listHeading,
  lowerFirst,
  mm,
  money,
  oz,
  pairSlug,
  rankingRule,
  relatedCollections,
  shoeName,
  supportLabel,
  tableHeading,
  toeBoxLabel
} from "@/lib/content/shoes";
import styles from "../content.module.css";

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
  const intro = collectionIntro(collection);
  const faq = collectionFaq(collection);
  const related = relatedCollections(index, collection);
  const shown = collection.ranked.slice(0, SHOWN_IN_LIST);
  const rest = collection.ranked.slice(SHOWN_IN_LIST);
  const [first, second] = collection.ranked;
  const headToHead = second ? comparisons.bySlug.get(pairSlug(first.shoe.id, second.shoe.id)) : undefined;
  const title = `Best ${collection.title}`;

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

      <section className="tool-hero container">
        <span className="eyebrow">
          <Link href="/shoes/best">Best running shoes</Link> · {collection.ranked.length} ranked
        </span>
        <h1>{title}</h1>
        <div className={styles.intro}>
          {intro.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <div className="button-row" style={{ marginTop: "20px" }}>
          <Link className="btn btn-primary" href="/tools/shoe-selector">
            Match a shoe to how I run
          </Link>
          <Link className="btn btn-ghost" href="/shoes">
            All shoes
          </Link>
        </div>
      </section>

      <section className="section container">
        <div className="stack" style={{ gap: "18px" }}>
          <h2 className="section-title">{listHeading(collection)}</h2>
          <p className={styles.rule}>{rankingRule(collection)}</p>
          <ol className={styles.ranked}>
            {shown.map((row) => {
              const shoe = row.shoe;
              return (
                <li key={shoe.id} className={styles.item}>
                  <div className={styles.rank} aria-label={`Rank ${row.rank}`}>
                    {row.rank}
                  </div>
                  <div>
                    <div className={styles.itemTop}>
                      <h3>
                        <Link href={`/shoes/${shoe.id}`}>{shoeName(shoe)}</Link>
                      </h3>
                      <span className={styles.score}>
                        {row.score} pts = {row.popularity} popularity
                        {row.recency ? ` + ${row.recency} recency` : ""}
                        {row.fit ? ` + ${row.fit} fit` : ""}
                      </span>
                    </div>
                    <ul className={styles.specs}>
                      <li><span>Price</span><strong>{shoe.price ? money(shoe.price) : "Not listed"}</strong></li>
                      <li><span>Weight</span><strong>{shoe.weightMens ? oz(shoe.weightMens) : "Not listed"}</strong></li>
                      <li><span>Stack</span><strong>{mm(shoe.stack)}</strong></li>
                      <li><span>Drop</span><strong>{mm(shoe.drop)}</strong></li>
                      <li><span>Support</span><strong>{supportLabel(shoe.stability)}</strong></li>
                    </ul>
                    {shoe.description ? <p className={styles.blurb}>{firstSentence(shoe.description)}</p> : null}
                    {shoe.pros.length || shoe.cons.length ? (
                      <p className={styles.proCon}>
                        {shoe.pros.length ? <>Good: {lowerFirst(shoe.pros[0])}. </> : null}
                        {shoe.cons.length ? <>Watch for: {lowerFirst(shoe.cons[0])}.</> : null}
                      </p>
                    ) : null}
                    <div className={styles.itemActions}>
                      <Link className="btn btn-xs btn-ghost" href={`/shoes/${shoe.id}`}>
                        Full specs
                      </Link>
                      <BuyLinks name={shoe.name} brand={shoe.brand} compact />
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
          {rest.length ? (
            <div className="stack">
              <span className="label">Also on the list, #{SHOWN_IN_LIST + 1} to #{collection.ranked.length}</span>
              <div className={styles.linkGrid}>
                {rest.map((row) => (
                  <Link key={row.shoe.id} className="tag" href={`/shoes/${row.shoe.id}`}>
                    {row.rank}. {shoeName(row.shoe)}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
          {headToHead ? (
            <p>
              The top two, side by side:{" "}
              <Link className="text-link" href={`/shoes/compare/${headToHead.slug}`}>
                {shoeName(first.shoe)} vs {shoeName(second.shoe)}, spec by spec
              </Link>
            </p>
          ) : null}
        </div>
      </section>

      <section className="section container">
        <div className="stack" style={{ gap: "18px" }}>
          <h2 className="section-title">{tableHeading(collection)}</h2>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Shoe</th>
                  <th>Price</th>
                  <th>Weight (M / W)</th>
                  <th>Heel stack</th>
                  <th>Drop</th>
                  <th>Cushion</th>
                  <th>Support</th>
                  <th>Toe box</th>
                </tr>
              </thead>
              <tbody>
                {collection.ranked.slice(0, TABLE_ROWS).map((row) => (
                  <tr key={row.shoe.id}>
                    <td>{row.rank}</td>
                    <td>
                      <Link href={`/shoes/${row.shoe.id}`}>
                        <strong>{shoeName(row.shoe)}</strong>
                      </Link>
                    </td>
                    <td>{row.shoe.price ? money(row.shoe.price) : "Not listed"}</td>
                    <td>
                      {row.shoe.weightMens ? oz(row.shoe.weightMens) : "n/a"} /{" "}
                      {row.shoe.weightWomens ? oz(row.shoe.weightWomens) : "n/a"}
                    </td>
                    <td>{mm(row.shoe.stack)}</td>
                    <td>{mm(row.shoe.drop)}</td>
                    <td>{cushionLabel(row.shoe.cushion)}</td>
                    <td>{supportLabel(row.shoe.stability)}</td>
                    <td>{toeBoxLabel(row.shoe.toeBox)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {collection.ranked.length > TABLE_ROWS ? (
            <p className="brand-sub">The table shows the top {TABLE_ROWS}. Every shoe on the list links to its full spec page.</p>
          ) : null}
        </div>
      </section>

      <section className="section container">
        <div className="stack" style={{ gap: "18px" }}>
          <h2 className="section-title">Questions about {collection.phrase}, answered from our data</h2>
          <div className={styles.faq}>
            {faq.map((item) => (
              <div key={item.q}>
                <h3>{item.q}</h3>
                <p>{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {related.length ? (
        <section className="section container">
          <div className="stack">
            <span className="label">Narrow it down or try a neighboring list</span>
            <div className={styles.linkGrid}>
              {related.map((other) => (
                <Link key={other.slug} className="tag" href={`/shoes/best/${other.slug}`}>
                  Best {other.title}
                  <span className={styles.count}>{other.ranked.length}</span>
                </Link>
              ))}
            </div>
            <Link className="text-link" href="/shoes/best">
              Every list we keep →
            </Link>
          </div>
        </section>
      ) : null}

      <section className="container next-step-card section">
        <div>
          <div className="eyebrow">Shoe Finder</div>
          <h2>A list ranks shoes. The finder ranks them for you.</h2>
          <p>
            Answer a few questions about your stride, mileage and budget, and the Shoe Finder scores every shoe in
            our database against them and hands back three.
          </p>
        </div>
        <Link className="btn btn-primary" href="/tools/shoe-selector">
          Find my shoe
        </Link>
      </section>

      <p className="container shoe-affiliate-note">
        Runner Toolkit may earn a commission from retailer links. That never changes the order of this list or the price
        you pay.
      </p>
    </div>
  );
}
