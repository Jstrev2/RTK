import Link from "next/link";
import Finder from "./finder";
import { loadShoeCards } from "@/lib/shoe-catalog";
import type { FinderAnswers } from "@/lib/shoe-finder";
import "@/components/shoes.css";

const RUNS = ["daily_trainer", "long_run", "speed_work", "race_day", "recovery_runs"];

export default async function ShoeFinderPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [shoes, params] = await Promise.all([loadShoeCards(), searchParams]);
  const one = (key: string) => {
    const value = params[key];
    return (Array.isArray(value) ? value[0] : value) ?? "";
  };
  const feel = one("feel");
  const feet = one("feet");
  const budget = Number(one("budget"));
  const initial: FinderAnswers = {
    run: RUNS.includes(one("run")) ? one("run") : "",
    feel: feel === "soft" || feel === "balanced" || feel === "fast" ? feel : "",
    feet: feet === "none" || feet === "support" || feet === "wide" ? feet : "",
    budget: [130, 160, 200].includes(budget) ? budget : 0
  };

  return (
    <div className="shoe-finder">
      <section className="page-hero shoe-finder-hero">
        <div className="container">
          <span className="eyebrow">Shoe Finder</span>
          <h1>
            Three taps. <span className="hi">3</span> shoes.
          </h1>
          <p className="page-hero-sub">
            Out of {shoes.length} current road shoes. Rather browse?{" "}
            <Link className="text-link" href="/shoes">
              See every shoe
            </Link>
            .
          </p>
        </div>
      </section>
      <section className="container shoe-index-body">
        <Finder shoes={shoes} initial={initial} />
        <details className="fineprint">
          <summary>How this works</summary>
          <p>
            Your answers filter the shoe database by run type, cushion, support, toe box and price. The rest are ranked by
            how popular they are with runners, with newer versions first, and we show one version per model.
          </p>
        </details>
      </section>
    </div>
  );
}
