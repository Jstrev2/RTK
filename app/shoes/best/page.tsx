import Link from "next/link";
import JsonLd from "@/components/json-ld";
import { pageMetadata, SITE_URL } from "@/lib/seo";
import { getCollectionIndex, loadContentShoes, money, shoeName, type Collection } from "@/lib/content/shoes";
import styles from "./content.module.css";

export const revalidate = 86400;

export const metadata = pageMetadata({
  title: "Best Running Shoes by Run, Fit and Budget",
  description:
    "Ranked lists of the best running shoes for every kind of run, foot and budget, built from the specs of every current road shoe we track. Each list says how it ranks.",
  path: "/shoes/best"
});

const SECTION_ORDER = [
  "Daily Trainers",
  "Long Run Shoes",
  "Recovery Shoes",
  "Speed Work Shoes",
  "Race Day Shoes",
  "By support",
  "By cushion and drop",
  "By fit",
  "By budget",
  "New releases",
  "By brand"
];

const SECTION_NOTES: Record<string, string> = {
  "Daily Trainers": "The shoe that does most of your miles. Start here if you only buy one pair.",
  "Long Run Shoes": "More foam and a steadier ride for the runs where your form starts to fade.",
  "Recovery Shoes": "Soft, forgiving shoes for the easy day after a hard one.",
  "Speed Work Shoes": "Lighter and snappier for tempo runs and intervals.",
  "Race Day Shoes": "Built to go fast once. Expect less durability for the money.",
  "By support": "Neutral if your arch holds its own, stability if it collapses inward.",
  "By cushion and drop": "How much foam sits under you, and how far your heel sits above your toes.",
  "By fit": "Foot shape, body weight and how you land.",
  "By budget": "List prices, so a sale only makes these better.",
  "New releases": "Shoes that came out in the last 12 months.",
  "By brand": "Every brand's lineup, ranked the same way."
};

export default async function BestShoesHub() {
  const [index, shoes] = await Promise.all([getCollectionIndex(), loadContentShoes()]);

  const sections = new Map<string, Collection[]>();
  for (const collection of index.list) {
    const list = sections.get(collection.hub) ?? [];
    list.push(collection);
    sections.set(collection.hub, list);
  }
  const ordered = [...sections.entries()].sort(
    ([a], [b]) => SECTION_ORDER.indexOf(a) - SECTION_ORDER.indexOf(b)
  );
  for (const [, list] of ordered) {
    list.sort((a, b) => a.facetIds.length - b.facetIds.length || b.ranked.length - a.ranked.length);
  }

  const daily = index.bySlug.get("daily-trainers");
  const budget = index.bySlug.get("running-shoes-under-120");

  return (
    <div className="editorial-page">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "Shoe Database", item: `${SITE_URL}/shoes` },
            { "@type": "ListItem", position: 3, name: "Best running shoes", item: `${SITE_URL}/shoes/best` }
          ]
        }}
      />

      <section className="tool-hero container">
        <span className="eyebrow">
          <Link href="/shoes">Shoe database</Link> · {index.list.length} lists
        </span>
        <h1>Best running shoes, sorted by the run you have in mind.</h1>
        <p>
          Every list here is built from the specs of the {shoes.length} current road shoes we track, and every one
          says how it ranks: popularity first, a bump for new releases, and fit points where a spec matters, like
          drop on a low-drop list.
          {daily ? (
            <>
              {" "}
              The biggest is <Link href={`/shoes/best/${daily.slug}`}>daily trainers</Link>, {daily.ranked.length}{" "}
              models led by the {shoeName(daily.ranked[0].shoe)}.
            </>
          ) : null}
          {budget ? (
            <>
              {" "}
              On a tight budget, <Link href={`/shoes/best/${budget.slug}`}>shoes under $120</Link> start at{" "}
              {money(Math.min(...budget.ranked.map((r) => r.shoe.price)))}.
            </>
          ) : null}
        </p>
        <div className="button-row" style={{ marginTop: "20px" }}>
          <Link className="btn btn-primary" href="/tools/shoe-selector">
            Skip the lists, match my run
          </Link>
        </div>
      </section>

      <section className="section container">
        {ordered.map(([hub, list]) => (
          <div key={hub} className={styles.hubSection}>
            <h2 className="section-title">{hub}</h2>
            {SECTION_NOTES[hub] ? <p className="section-lede">{SECTION_NOTES[hub]}</p> : null}
            <div className={styles.linkGrid}>
              {list.map((collection) => (
                <Link key={collection.slug} className="tag" href={`/shoes/best/${collection.slug}`}>
                  {collection.title}
                  <span className={styles.count}>{collection.ranked.length}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="container next-step-card section">
        <div>
          <div className="eyebrow">Shoe Finder</div>
          <h2>Lists are a start. Your stride decides.</h2>
          <p>
            The Shoe Finder asks how you land, how far you run and what you want to spend, then scores every shoe in
            our database against your answers.
          </p>
        </div>
        <Link className="btn btn-primary" href="/tools/shoe-selector">
          Find my shoe
        </Link>
      </section>
    </div>
  );
}
