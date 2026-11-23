import Link from "next/link";
import JsonLd from "@/components/json-ld";
import { pageMetadata, SITE_URL } from "@/lib/seo";
import { getCollectionIndex, loadContentShoes, type Collection } from "@/lib/content/shoes";
import ListSearch, { type ListHub } from "./list-search";
import "@/components/shoes.css";

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

  const hubs: ListHub[] = ordered.map(([hub, list]) => ({
    hub,
    note: SECTION_NOTES[hub],
    lists: list.map((collection) => ({ slug: collection.slug, title: collection.title, count: collection.ranked.length }))
  }));

  return (
    <div>
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

      <section className="page-hero collection-hero">
        <div className="container">
          <nav className="shoe-detail-crumbs" aria-label="Breadcrumb">
            <Link href="/shoes">All shoes</Link>
          </nav>
          <h1>Best running shoes, by the run you have in mind.</h1>
          <p className="page-hero-sub">
            {index.list.length} ranked lists built from {shoes.length} current road shoes. Or let the{" "}
            <Link className="text-link" href="/tools/shoe-selector">
              Shoe Finder
            </Link>{" "}
            pick three.
          </p>
        </div>
      </section>

      <section className="container shoe-index-body">
        <ListSearch hubs={hubs} />
      </section>
    </div>
  );
}
