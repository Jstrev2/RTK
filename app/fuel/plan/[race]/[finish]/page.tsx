import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { pageMetadata } from "@/lib/seo";
import { DEFAULT_KEY, getFuelProducts, parseFinishSlug } from "@/lib/content/fuel";
import {
  RACE_DEFS,
  clock,
  findRaceDef,
  finishLabel,
  finishSlug,
  paceLabel,
  picksFor,
  planFuel,
  planTimesFor,
  unitFor,
  type FuelPlan,
  type RaceDef
} from "@/lib/fueling";
import { Crumbs, FuelJsonLd } from "../../../_ui/fuel-ui";
import FuelPhoto from "../../../_ui/fuel-photo";
import PlanResult from "../../../_ui/plan-result";
import { ProductBib } from "../../../_ui/product-grid";
import s from "../../../fuel.module.css";

export const revalidate = 86400;
export const dynamicParams = true;

export async function generateStaticParams(): Promise<{ race: string; finish: string }[]> {
  return [];
}

type Params = { params: Promise<{ race: string; finish: string }> };

const resolve = (raceSlug: string, finish: string) => {
  const race = findRaceDef(raceSlug);
  const minutes = parseFinishSlug(finish);
  if (!race || minutes === null || !planTimesFor(race).includes(minutes)) return null;
  return { race, minutes };
};

const raceName = (race: RaceDef) => (race.slug === "half-marathon" ? "Half marathon" : race.label.charAt(0).toUpperCase() + race.label.slice(1));

const summary = (plan: FuelPlan) => {
  const n = plan.servings.length;
  if (plan.need === "none" || !n) return "No fuel needed: you're done before you'd use it.";
  if (plan.need === "optional") return `One ${unitFor(plan.product.type)} at ${clock(plan.servings[0].at)} if you want it. It's optional.`;
  return `${n} ${unitFor(plan.product.type, n)}, one every ${plan.every} minutes from ${clock(plan.servings[0].at)}.`;
};

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { race: raceSlug, finish } = await params;
  const found = resolve(raceSlug, finish);
  if (!found) return { title: "Fuel plan not found" };
  const { race, minutes } = found;
  const products = await getFuelProducts();
  const [pick] = picksFor({ minutes, miles: race.miles, products, defaultKey: DEFAULT_KEY });
  const n = pick?.plan.servings.length ?? 0;
  const time = finishLabel(minutes);
  return pageMetadata({
    title: n
      ? `${raceName(race)} in ${time}: How Many Gels and When`
      : `${raceName(race)} in ${time}: Do You Need Gels?`,
    description: n
      ? `A ${time} ${race.label} takes ${n} gels, one every ${pick.plan.every || "few"} minutes, about ${pick.plan.carbsPerHour}g carbs an hour. See the timeline and the best products to carry.`
      : `A ${time} ${race.label} needs no fuel. Here's why, and when a gel starts to help.`,
    path: `/fuel/plan/${race.slug}/${finish}`
  });
}

export default async function PlanPage({ params }: Params) {
  const { race: raceSlug, finish } = await params;
  const found = resolve(raceSlug, finish);
  if (!found) notFound();
  const { race, minutes } = found;
  const products = await getFuelProducts();
  const picks = picksFor({ minutes, miles: race.miles, products, defaultKey: DEFAULT_KEY });
  const fallback = products.find((p) => p.key === DEFAULT_KEY) ?? products[0];
  if (!fallback) notFound();
  const plan = picks[0]?.plan ?? planFuel({ minutes, miles: race.miles, product: fallback });
  const time = finishLabel(minutes);

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Race fuel", path: "/fuel" },
    { name: `${raceName(race)} ${time}`, path: `/fuel/plan/${race.slug}/${finish}` }
  ];
  const times = planTimesFor(race);
  const index = times.indexOf(minutes);
  const nearby = times.slice(Math.max(0, index - 4), index + 5);

  return (
    <>
      <FuelJsonLd crumbs={crumbs} />
      <section className={`page-hero ${s.planHero}`}>
        <div className="container">
          <Crumbs crumbs={crumbs} />
          <h1>
            {raceName(race)} in <span className={s.hClock}>{time}</span>
          </h1>
          <p className="page-hero-sub">
            {summary(plan)} <span className={s.pace}>{paceLabel(minutes, race.miles)}</span>
          </p>
        </div>
      </section>

      <section className={`container ${s.block}`}>
        <div className={`panel ${s.resultPanel}`}>
          {plan.need !== "none" ? (
            <div className={s.usingRow}>
              <span className={s.usingPhoto}>
                <FuelPhoto product={plan.product} eager />
              </span>
              <span className={s.usingText}>
                <span className="bib-meta">Shown with</span>
                <b>{plan.product.display}</b>
                <span className={s.usingStats}>{plan.product.carbs}g carbs a {unitFor(plan.product.type)}</span>
              </span>
              <Link className="btn btn-sm" href={`/tools/fueling?race=${race.slug}&t=${minutes}`}>
                Exact time
              </Link>
            </div>
          ) : null}
          <PlanResult plan={plan} />
        </div>
      </section>

      {picks.length > 1 ? (
        <section className={`container ${s.block}`}>
          <div className="section-head">
            <h2>What to carry</h2>
          </div>
          <div className={s.picks}>
            {picks.map((pick) => {
              const count = pick.plan.servings.length;
              const shown = pick.plan.late ?? pick.plan.product;
              return (
                <ProductBib
                  key={pick.id}
                  product={shown}
                  badge={pick.label}
                  countLine={
                    pick.id === "caffeine"
                      ? `Last ${pick.plan.servings.filter((sv) => sv.product.caffeineMg > 0).length} of ${count}`
                      : `${count} ${unitFor(pick.plan.product.type, count)}`
                  }
                />
              );
            })}
          </div>
        </section>
      ) : null}

      <section className={`container ${s.block}`}>
        <div className={s.lists}>
          <span className="eyebrow">Other {race.label} times</span>
          <div className="chips">
            {nearby.map((t) => (
              <Link key={t} className={`chip ${t === minutes ? "is-on" : ""}`} href={`/fuel/plan/${race.slug}/${finishSlug(t)}`}>
                {finishLabel(t)}
              </Link>
            ))}
          </div>
          <span className="eyebrow">Other races</span>
          <div className="chips">
            {RACE_DEFS.filter((r) => r.slug !== race.slug).map((r) => {
              const rt = planTimesFor(r);
              const near = rt.reduce((best, t) => (Math.abs(t / r.miles - minutes / race.miles) < Math.abs(best / r.miles - minutes / race.miles) ? t : best), rt[0]);
              return (
                <Link key={r.slug} className="chip" href={`/fuel/plan/${r.slug}/${finishSlug(near)}`}>
                  {r.short}
                </Link>
              );
            })}
          </div>
        </div>
        <details className="fineprint">
          <summary>How this plan is worked out</summary>
          <p>
            Target: {plan.target}g of carbs an hour for a {time} finish (ACSM and IOC guidance: none under an hour, 30 to 60g
            an hour up to 2:30, up to 90g beyond for a trained gut, at most 45g at walk-run pace). First serving at about 20 minutes, then a steady rhythm,
            nothing in the last 15 minutes. Miles assume an even {paceLabel(minutes, race.miles)} pace. Caffeine late, about
            200mg in all. Label numbers come from each brand&apos;s page. Practise it on long runs first.
          </p>
        </details>
      </section>
    </>
  );
}
