import Link from "next/link";
import JsonLd from "@/components/json-ld";
import { pageMetadata, SITE_URL } from "@/lib/seo";
import { getGuides, photoChoices, toCards, topicChips } from "@/lib/guides";
import { PHOTOS } from "@/lib/photos";
import GuideBrowser from "./guide-browser";

export const revalidate = 1800;

export const metadata = pageMetadata({
  title: "Runner Guides: Shoes, Fuel, Music and Race Day",
  description:
    "Short answers for runners: how many gels to take, which shoes to buy, what cadence to run. Each guide opens with the answer, with prices and specs from our database.",
  path: "/rundown",
});

export default async function RundownPage() {
  const guides = await getGuides();
  const photo = PHOTOS.guides();

  return (
    <div>
      {guides.length > 0 ? (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "ItemList",
            itemListElement: guides.slice(0, 100).map((guide, index) => ({
              "@type": "ListItem",
              position: index + 1,
              url: `${SITE_URL}/rundown/${guide.slug}`,
              name: guide.title,
            })),
          }}
        />
      ) : null}

      <section className="page-hero on-photo rd-hero">
        <div className="photo-duo">
          <img src={photo.src} alt={photo.alt} fetchPriority="high" />
        </div>
        <div className="container">
          <span className="eyebrow" style={{ color: "var(--volt)" }}>Runner Guides</span>
          <h1>Short answers for runners.</h1>
          <p className="page-hero-sub">Shoes, fuel, music and race day. Every guide starts with the answer.</p>
        </div>
        <span className="photo-credit">
          Photo: <a href={photo.source} target="_blank" rel="noopener noreferrer">{photo.author}</a>, {photo.license}
        </span>
      </section>

      <section className="container">
        {guides.length ? (
          <GuideBrowser guides={toCards(guides)} topics={topicChips(guides)} photos={photoChoices()} />
        ) : (
          <div className="empty" style={{ margin: "8px 0 72px" }}>
            <p style={{ margin: "0 0 12px" }}>
              <strong>Guides are on the way.</strong>
            </p>
            <Link className="btn btn-sm" href="/tools/shoe-selector">Find my shoes</Link>
          </div>
        )}
      </section>
    </div>
  );
}
