import { pageMetadata } from "@/lib/seo";
import { allPhotos } from "@/lib/photos";

export const metadata = pageMetadata({
  title: "Photo Credits",
  description: "The photographers behind the running photos on Runner Toolkit, and the licenses we use them under.",
  path: "/credits"
});

export default function CreditsPage() {
  const photos = allPhotos();
  return (
    <div className="container" style={{ paddingBottom: 64 }}>
      <section className="page-hero">
        <span className="eyebrow">Credits</span>
        <h1>The photographers</h1>
        <p className="page-hero-sub">
          Our race photos come from Wikimedia Commons under licenses that allow reuse with credit. Product photos come from
          the brands and the retailers that sell them.
        </p>
      </section>
      <div className="bib-grid">
        {photos.map((photo) => (
          <a key={photo.src} className="bib" href={photo.source} target="_blank" rel="noopener noreferrer">
            <span className="bib-pins" />
            <span className="bib-photo cover">
              <img src={photo.src} alt={photo.alt} loading="lazy" />
            </span>
            <span className="bib-title">{photo.author}</span>
            <span className="bib-meta" style={{ marginBottom: 14 }}>{photo.license}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
