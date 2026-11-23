import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import { collectionsFor, getFuelProducts, toClient } from "@/lib/content/fuel";
import { Crumbs, FuelJsonLd } from "./_ui/fuel-ui";
import ProductGrid from "./_ui/product-grid";
import RacePicker from "./_ui/race-picker";
import s from "./fuel.module.css";

export const revalidate = 86400;

export const metadata: Metadata = pageMetadata({
  title: "Race Fuel: Every Energy Gel, Chew and Drink Mix, and How Many You Need",
  description:
    "Search every current energy gel, chew, drink mix and electrolyte from GU, Maurten, SiS, Precision, Spring and more, with label numbers and photos. Pick a race and finish time for a fuel plan.",
  path: "/fuel"
});

const crumbs = [{ name: "Home", path: "/" }, { name: "Race fuel", path: "/fuel" }];

export default async function FuelHubPage() {
  const products = await getFuelProducts();
  const brands = new Set(products.map((p) => p.brand)).size;
  const collections = collectionsFor(products);

  return (
    <>
      <FuelJsonLd crumbs={crumbs} />
      <section className={`page-hero ${s.hubHero}`}>
        <div className="container">
          <Crumbs crumbs={crumbs} />
          <h1>Race fuel</h1>
          <p className="page-hero-sub">
            {products.length} gels, chews and mixes from {brands} brands. Pick your race for a plan.
          </p>
          <RacePicker />
        </div>
      </section>

      <section className={`container ${s.block}`}>
        <ProductGrid products={toClient(products)} />
      </section>

      <section className={`container ${s.block}`}>
        <div className={s.lists}>
          <span className="eyebrow">Best lists</span>
          <div className="chips">
            {collections.map((collection) => (
              <Link key={collection.slug} className="chip" href={`/fuel/best/${collection.slug}`}>
                {collection.h1}
              </Link>
            ))}
          </div>
        </div>
        <details className="fineprint">
          <summary>Where the numbers come from</summary>
          <p>
            Carbs, caffeine, sodium, calories, serving size and price come from each brand&apos;s own US product page and are
            checked every month. Photos are the brand&apos;s own. Where a number varies by flavor, the card shows the flagship
            flavor.
          </p>
        </details>
      </section>
    </>
  );
}
