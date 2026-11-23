import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { pageMetadata } from "@/lib/seo";
import { collectionsFor, findCollection, getFuelProducts, toClient } from "@/lib/content/fuel";
import { Crumbs, FuelJsonLd } from "../../_ui/fuel-ui";
import ProductGrid, { ProductBib } from "../../_ui/product-grid";
import s from "../../fuel.module.css";

export const revalidate = 86400;
export const dynamicParams = true;

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  return [];
}

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const products = await getFuelProducts();
  const collection = findCollection(products, slug);
  if (!collection) return { title: "List not found" };
  const count = products.filter(collection.filter).length;
  return pageMetadata({
    title: `${collection.title} (${count} Compared)`,
    description: `${count} products, with photos, carbs, sodium, caffeine and price per serving from each brand's own page. Search and filter the list, or plan your race.`,
    path: `/fuel/best/${slug}`
  });
}

export default async function CollectionPage({ params }: Params) {
  const { slug } = await params;
  const products = await getFuelProducts();
  const collection = findCollection(products, slug);
  if (!collection) notFound();
  const list = products.filter(collection.filter).sort(collection.sort);
  const others = collectionsFor(products).filter((c) => c.slug !== slug);
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Race fuel", path: "/fuel" },
    { name: collection.h1, path: `/fuel/best/${slug}` }
  ];
  const types = new Set(list.map((p) => p.type)).size > 1;

  return (
    <>
      <FuelJsonLd crumbs={crumbs} />
      <section className={`page-hero ${s.planHero}`}>
        <div className="container">
          <Crumbs crumbs={crumbs} />
          <h1>{collection.h1}</h1>
          <p className="page-hero-sub">
            {list.length} products, ranked. Tap one for flavors, price and how many your race takes.
          </p>
        </div>
      </section>

      <section className={`container ${s.block}`}>
        {list.length > 12 ? (
          <ProductGrid products={toClient(list)} numbered types={types} />
        ) : (
          <div className={`bib-grid ${s.twoUp}`}>
            {list.map((product, index) => (
              <ProductBib key={product.key} product={product} number={index + 1} />
            ))}
          </div>
        )}
        <div className={s.lists}>
          <span className="eyebrow">More lists</span>
          <div className="chips">
            {others.map((other) => (
              <Link key={other.slug} className="chip" href={`/fuel/best/${other.slug}`}>
                {other.h1}
              </Link>
            ))}
          </div>
        </div>
        <details className="fineprint">
          <summary>How this list is built</summary>
          <p>
            Every current product in our catalog that fits, ranked by the number in the title. Numbers per serving from each
            brand&apos;s own page, checked monthly.
          </p>
        </details>
      </section>
    </>
  );
}
