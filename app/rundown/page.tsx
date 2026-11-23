import Link from "next/link";
import JsonLd from "@/components/json-ld";
import { pageMetadata, SITE_URL } from "@/lib/seo";
import { getGuides } from "@/lib/guides";
import { GuideList, TopicNav, tagCounts } from "./guide-list";

export const revalidate = 1800;

export const metadata = pageMetadata({
  title: "Runner Guides: Shoes, Music, Fuel and Race Day",
  description:
    "Practical running guides on choosing shoes, cadence and playlists, race fueling and race day, with prices and specs checked against our database. New guides every day.",
  path: "/rundown",
});

export default async function RundownPage() {
  const articles = await getGuides();
  const counts = tagCounts(articles);

  return (
    <div className="editorial-page">
      {articles.length > 0 ? (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "ItemList",
            itemListElement: articles.slice(0, 100).map((article, index) => ({
              "@type": "ListItem",
              position: index + 1,
              url: `${SITE_URL}/rundown/${article.slug}`,
              name: article.title,
            })),
          }}
        />
      ) : null}
      <section className="container tool-hero">
        <span className="eyebrow">Runner Guides</span>
        <h1>Use the answer well.</h1>
        <p className="section-lede">
          Straight answers on shoes, cadence and playlists, race fueling and
          race day. New guides land every day.
        </p>
      </section>

      <section className="section container">
        <TopicNav counts={counts} />
        {articles.length === 0 ? (
          <div className="card card-outline" style={{ textAlign: "center", padding: "48px 20px" }}>
            <p style={{ fontSize: "1.1rem", marginBottom: "8px" }}>
              <strong>Guides are on the way.</strong>
            </p>
            <p style={{ color: "var(--ink-2)" }}>
              In the meantime, start with the <Link href="/tools/shoe-selector">Shoe Finder</Link>.
            </p>
          </div>
        ) : (
          <GuideList guides={articles} />
        )}
      </section>
    </div>
  );
}
