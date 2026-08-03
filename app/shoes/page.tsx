import Link from "next/link";
import { shoes as fallbackShoes } from "@/lib/data";
import type { Shoe } from "@/lib/data";
import { mapDbShoe, displayName, prettyLabel, type DbShoe } from "@/lib/shoe-utils";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 86400;

export const metadata = pageMetadata({
  title: "Running Shoe Database — Every Road Shoe We Track",
  description:
    "Browse 220+ current road running shoes by brand — cushion, support, drop, weight, and honest tradeoffs for every model, updated as new versions release.",
  path: "/shoes",
});

async function loadShoes(): Promise<Shoe[]> {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data } = await supabase
      .from("shoe_models")
      .select("*")
      .eq("is_active", true)
      .order("brand")
      .order("name");
    if (data?.length) {
      return (data as DbShoe[]).map(mapDbShoe);
    }
  }
  return fallbackShoes;
}

export default async function ShoeIndexPage() {
  const allShoes = await loadShoes();

  const byBrand = new Map<string, Shoe[]>();
  for (const shoe of allShoes) {
    const list = byBrand.get(shoe.brand) ?? [];
    list.push(shoe);
    byBrand.set(shoe.brand, list);
  }
  const brands = [...byBrand.keys()].sort((a, b) => a.localeCompare(b));

  return (
    <div className="editorial-page">
      <section className="tool-hero container">
        <span className="eyebrow">Shoe database</span>
        <h1>Every road running shoe we track.</h1>
        <p>
          {allShoes.length} current road shoes with specs, support level,
          cushion, and honest tradeoffs for each. Pick a brand below, or use
          the <Link href="/tools/shoe-selector">Shoe Finder</Link> to narrow
          it to three shoes matched to how you run.
        </p>
      </section>

      <section className="section container">
        {brands.map((brand) => (
          <div key={brand} className="stack" style={{ marginBottom: "32px" }}>
            <h2 className="section-title">{brand}</h2>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Shoe</th>
                    <th>Cushion</th>
                    <th>Support</th>
                    <th>Drop</th>
                    <th>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {(byBrand.get(brand) ?? []).map((shoe) => (
                    <tr key={shoe.id}>
                      <td>
                        <Link href={`/shoes/${shoe.id}`}>
                          <strong>{displayName(shoe)}</strong>
                        </Link>
                      </td>
                      <td>{prettyLabel(shoe.cushion)}</td>
                      <td>{prettyLabel(shoe.stability)}</td>
                      <td>{shoe.drop ? `${shoe.drop} mm` : "—"}</td>
                      <td>{shoe.price ? `$${shoe.price}` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
