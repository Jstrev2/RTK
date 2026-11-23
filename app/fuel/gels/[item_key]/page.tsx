import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { pageMetadata } from "@/lib/seo";
import {
  PRODUCT_PAGE_RACES,
  TYPE_LABEL,
  findProduct,
  getFuelProducts,
  getRetiredBrand,
  neighboursOf,
  pairsFor,
  servingsFor
} from "@/lib/content/fuel";
import { finishLabel, finishSlug, findRaceDef, isPlannable, unitFor, type FuelProduct } from "@/lib/fueling";
import { Crumbs, FuelJsonLd } from "../../_ui/fuel-ui";
import FuelBuyLinks from "../../_ui/fuel-buy-links";
import FuelPhoto from "../../_ui/fuel-photo";
import { ProductBib } from "../../_ui/product-grid";
import s from "../../fuel.module.css";

export const revalidate = 86400;
export const dynamicParams = true;

export async function generateStaticParams(): Promise<{ item_key: string }[]> {
  return [];
}

type Params = { params: Promise<{ item_key: string }> };

const caffeineText = (p: FuelProduct) => (p.caffeineMg ? `${p.caffeineMg}mg caffeine` : "no caffeine");

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { item_key } = await params;
  const product = findProduct(await getFuelProducts(), item_key);
  if (!product) return { title: "Product not found" };
  const n = isPlannable(product) ? servingsFor(product, "marathon", 240) : 0;
  return pageMetadata({
    title: `${product.display}: Carbs, Caffeine, Sodium${n ? " and How Many for a Marathon" : ""}`,
    description: `${product.display}: ${product.carbs}g carbs, ${product.sodiumMg}mg sodium, ${caffeineText(product)}, ${product.calories} calories per ${product.servingSize ?? "serving"}.${n ? ` A 4:00 marathon takes ${n}.` : ""} Photos, flavors, price and the closest alternatives.`,
    path: `/fuel/gels/${product.key}`
  });
}

export default async function ProductPage({ params }: Params) {
  const { item_key } = await params;
  const products = await getFuelProducts();
  const product = findProduct(products, item_key);
  if (!product) {
    // A product that left the catalog sends its old page to that brand in the hub.
    const brand = await getRetiredBrand(item_key);
    if (brand) permanentRedirect(`/fuel?q=${encodeURIComponent(brand)}`);
    notFound();
  }

  const plannable = isPlannable(product);
  const similar = neighboursOf(product, products, 4);
  const pairs = pairsFor(product, products).slice(0, 6);
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Race fuel", path: "/fuel" },
    { name: product.display, path: `/fuel/gels/${product.key}` }
  ];

  return (
    <>
      <FuelJsonLd crumbs={crumbs} product={product} />
      <section className={`container ${s.block}`}>
        <div className={s.productHero}>
          <div className={s.productPhoto}>
            <FuelPhoto product={product} size="full" eager className={s.fill} />
          </div>
          <div className={s.productInfo}>
            <Crumbs crumbs={crumbs} />
            <span className="eyebrow">
              {product.brand} · {TYPE_LABEL[product.type]}
              {product.releaseNote ? <span className={s.newTag}>{product.releaseNote}</span> : null}
            </span>
            <h1 className={s.productTitle}>{product.name}</h1>
            <div className={s.bigStats}>
              {product.type !== "electrolyte" ? (
                <span className="split">
                  <b>{product.carbs}</b>g carbs
                </span>
              ) : null}
              <span className="split">
                <b>{product.sodiumMg}</b>mg sodium
              </span>
              <span className="split">
                <b>{product.caffeineMg}</b>mg caffeine
              </span>
              <span className="split">
                <b>{product.calories}</b>kcal
              </span>
              {product.priceUsd != null ? (
                <span className="split">
                  <b>${product.priceUsd.toFixed(2)}</b>each
                </span>
              ) : null}
            </div>
            <p className={s.serving}>
              Per {product.servingSize ?? "serving"}.{product.notes ? ` ${product.notes}` : ""}
            </p>
            {product.flavors.length ? (
              <div className={`chips ${s.flavors}`}>
                {product.flavors.map((flavor) => (
                  <span key={flavor} className="tag">
                    {flavor}
                  </span>
                ))}
              </div>
            ) : null}
            <FuelBuyLinks name={product.name} brand={product.brand} label={product.display} brandUrl={product.productUrl} />
          </div>
        </div>
      </section>

      {plannable ? (
        <section className={`container ${s.block}`}>
          <div className="section-head">
            <h2>How many for your race</h2>
            <Link className="btn btn-sm" href={`/tools/fueling?p=${product.key}`}>
              Your exact race
            </Link>
          </div>
          <div className={s.raceCounts}>
            {PRODUCT_PAGE_RACES.map(({ race: slug, minutes }) => {
              const race = findRaceDef(slug);
              if (!race) return null;
              const n = servingsFor(product, slug, minutes);
              return (
                <Link key={`${slug}-${minutes}`} className={s.raceCount} href={`/fuel/plan/${slug}/${finishSlug(minutes)}`}>
                  <span className={s.numLabel}>
                    {race.short} {finishLabel(minutes)}
                  </span>
                  <b className="clock">{n}</b>
                  <span>{unitFor(product.type, n)}</span>
                </Link>
              );
            })}
          </div>
        </section>
      ) : (
        <section className={`container ${s.block}`}>
          <p className={s.noFuelLine}>Electrolytes only: almost no carbs, so it replaces salt, not fuel. Pair it with a gel.</p>
        </section>
      )}

      {similar.length ? (
        <section className={`container ${s.block}`}>
          <div className="section-head">
            <h2>Closest alternatives</h2>
          </div>
          <div className={`bib-grid ${s.twoUp}`}>
            {similar.map((other) => (
              <ProductBib key={other.key} product={other} />
            ))}
          </div>
          {pairs.length ? (
            <div className={s.lists}>
              <span className="eyebrow">Side by side</span>
              <div className="chips">
                {pairs.map((pair) => (
                  <Link key={pair.slug} className="chip" href={`/fuel/compare/${pair.slug}`}>
                    vs {pair.other.display}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className={`container ${s.block}`}>
        <details className="fineprint">
          <summary>Where these numbers come from</summary>
          <p>
            Label numbers, flavors and price are from {product.brand}&apos;s own product page, checked monthly. Race counts use
            the Fuel Finder&apos;s math with a normal stomach. Runner Toolkit may earn a commission from retailer links; it never
            changes the numbers.
          </p>
        </details>
      </section>
    </>
  );
}
