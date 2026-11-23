import Link from "next/link";
import ShoeGrid from "./shoe-grid";
import { loadShoeCards } from "@/lib/shoe-catalog";
import { filtersFromParams } from "@/lib/shoe-filters";
import { pageMetadata } from "@/lib/seo";
import "@/components/shoes.css";

export const metadata = pageMetadata({
  title: "Running Shoes: Every Current Road Shoe, With Photos",
  description:
    "Every current road running shoe in one grid, most popular first. Search by name, filter by run type, cushion, support, toe box, price and brand.",
  path: "/shoes",
});

export default async function ShoeIndexPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [shoes, params] = await Promise.all([loadShoeCards(), searchParams]);
  const initial = filtersFromParams(params);

  return (
    <div className="shoe-index">
      <section className="page-hero shoe-index-hero">
        <div className="container">
          <span className="eyebrow">Shoe database</span>
          <h1>
            Every road shoe. <span className="hi">{shoes.length}</span> of them.
          </h1>
          <p className="page-hero-sub">
            Most popular first. Search, tap a filter, or let the{" "}
            <Link className="text-link" href="/tools/shoe-selector">
              Shoe Finder
            </Link>{" "}
            pick three.
          </p>
        </div>
      </section>
      <section className="container shoe-index-body">
        <ShoeGrid shoes={shoes} initial={initial} />
      </section>
    </div>
  );
}
