import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { pageMetadata } from "@/lib/seo";
import { TYPE_LABEL, findProduct, getFuelProducts, pairSlug, parsePairSlug, servingsFor } from "@/lib/content/fuel";
import { isPlannable, type FuelProduct } from "@/lib/fueling";
import { Crumbs, FuelJsonLd } from "../../_ui/fuel-ui";
import FuelPhoto from "../../_ui/fuel-photo";
import s from "../../fuel.module.css";

export const revalidate = 86400;
export const dynamicParams = true;

export async function generateStaticParams(): Promise<{ pair: string }[]> {
  return [];
}

type Params = { params: Promise<{ pair: string }> };

const load = async (slug: string) => {
  const parsed = parsePairSlug(slug);
  if (!parsed || parsed.a === parsed.b) return { status: "missing" as const };
  const products = await getFuelProducts();
  const a = findProduct(products, parsed.a);
  const b = findProduct(products, parsed.b);
  if (a && b) return { status: "ok" as const, a, b, canonical: pairSlug(a.key, b.key) };
  // One side left the catalog: send the page to the one still sold.
  const survivor = a ?? b;
  return survivor ? { status: "moved" as const, to: `/fuel/gels/${survivor.key}` } : { status: "missing" as const };
};

const verdict = (a: FuelProduct, b: FuelProduct) => {
  const parts: string[] = [];
  if (a.carbs !== b.carbs) {
    const [more, less] = a.carbs > b.carbs ? [a, b] : [b, a];
    parts.push(`${more.display} has ${more.carbs - less.carbs}g more carbs`);
  }
  if (a.caffeineMg !== b.caffeineMg) {
    const [more, less] = a.caffeineMg > b.caffeineMg ? [a, b] : [b, a];
    parts.push(less.caffeineMg ? `${more.display} has ${more.caffeineMg - less.caffeineMg}mg more caffeine` : `only ${more.display} has caffeine`);
  }
  if (Math.abs(a.sodiumMg - b.sodiumMg) >= 50) {
    const [more] = a.sodiumMg > b.sodiumMg ? [a, b] : [b, a];
    parts.push(`${more.display} is saltier`);
  }
  if (!parts.length) return "Same label numbers. Pick the flavor you like.";
  const line = parts.slice(0, 2).join("; ");
  return `${line.charAt(0).toUpperCase()}${line.slice(1)}.`;
};

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { pair } = await params;
  const found = await load(pair);
  if (found.status !== "ok") return { title: "Comparison not found" };
  const { a, b, canonical } = found;
  return pageMetadata({
    title: `${a.display} vs ${b.display}: Carbs, Caffeine, Sodium`,
    description: `${a.display} (${a.carbs}g carbs, ${a.caffeineMg}mg caffeine, ${a.sodiumMg}mg sodium) against ${b.display} (${b.carbs}g, ${b.caffeineMg}mg, ${b.sodiumMg}mg), with how many each takes for a marathon.`,
    path: `/fuel/compare/${canonical}`
  });
}

type Stat = { label: string; get: (p: FuelProduct) => number | undefined; unit: string; better?: "high" | "low"; money?: boolean };

const STATS: Stat[] = [
  { label: "Carbs", get: (p) => p.carbs, unit: "g", better: "high" },
  { label: "Sodium", get: (p) => p.sodiumMg, unit: "mg" },
  { label: "Caffeine", get: (p) => p.caffeineMg, unit: "mg" },
  { label: "Calories", get: (p) => p.calories, unit: "kcal" },
  { label: "Price each", get: (p) => p.priceUsd, unit: "", better: "low", money: true }
];

export default async function ComparePage({ params }: Params) {
  const { pair } = await params;
  const found = await load(pair);
  if (found.status === "moved") permanentRedirect(found.to);
  if (found.status !== "ok") notFound();
  const { a, b, canonical } = found;
  if (canonical !== pair) permanentRedirect(`/fuel/compare/${canonical}`);

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Race fuel", path: "/fuel" },
    { name: `${a.display} vs ${b.display}`, path: `/fuel/compare/${canonical}` }
  ];
  const races = [
    { slug: "half-marathon", minutes: 120, label: "Half 2:00" },
    { slug: "marathon", minutes: 240, label: "Marathon 4:00" }
  ];

  return (
    <>
      <FuelJsonLd crumbs={crumbs} />
      <section className={`page-hero ${s.planHero}`}>
        <div className="container">
          <Crumbs crumbs={crumbs} />
          <h1 className={s.compareTitle}>
            {a.display} <span className={s.vs}>vs</span> {b.display}
          </h1>
          <p className="page-hero-sub">{verdict(a, b)}</p>
        </div>
      </section>

      <section className={`container ${s.block}`}>
        <div className={s.compare}>
          {[a, b].map((p) => (
            <Link key={p.key} href={`/fuel/gels/${p.key}`} className={s.compareSide}>
              <span className={s.comparePhoto}>
                <FuelPhoto product={p} size="full" eager className={s.fill} />
              </span>
              <span className="bib-meta">
                {p.brand} · {TYPE_LABEL[p.type]}
              </span>
              <b className="bib-title">{p.name}</b>
            </Link>
          ))}
          {STATS.map((stat) => {
            const [va, vb] = [stat.get(a), stat.get(b)];
            if (va == null && vb == null) return null;
            const winner =
              stat.better && va != null && vb != null && va !== vb
                ? (stat.better === "high" ? va > vb : va < vb)
                  ? "a"
                  : "b"
                : null;
            const cell = (v: number | undefined, side: "a" | "b") => (
              <span className={`split ${s.compareCell} ${winner === side ? s.win : ""}`}>
                <b>{v == null ? "-" : stat.money ? `$${v.toFixed(2)}` : v}</b>
                {v == null || stat.money ? "" : stat.unit}
              </span>
            );
            return (
              <div key={stat.label} className={s.compareRow}>
                {cell(va, "a")}
                <span className={s.compareLabel}>{stat.label}</span>
                {cell(vb, "b")}
              </div>
            );
          })}
          {isPlannable(a) && isPlannable(b)
            ? races.map((race) => {
                const [na, nb] = [servingsFor(a, race.slug, race.minutes), servingsFor(b, race.slug, race.minutes)];
                return (
                  <div key={race.slug} className={s.compareRow}>
                    <span className={`split ${s.compareCell} ${na < nb ? s.win : ""}`}>
                      <b>{na}</b>to carry
                    </span>
                    <span className={s.compareLabel}>{race.label}</span>
                    <span className={`split ${s.compareCell} ${nb < na ? s.win : ""}`}>
                      <b>{nb}</b>to carry
                    </span>
                  </div>
                );
              })
            : null}
        </div>
        <details className="fineprint">
          <summary>How this is worked out</summary>
          <p>
            Label numbers per serving from each brand&apos;s page. Counts to carry use the Fuel Finder&apos;s math with a
            normal stomach, without a spare. Highlighted: more carbs, fewer to carry, lower price.
          </p>
        </details>
      </section>
    </>
  );
}
