import type { Metadata } from "next";
import Link from "next/link";
import { searchSite, type SearchHit } from "@/lib/search";
import SiteSearch from "@/components/site-search";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Search",
  robots: { index: false, follow: true }
};

const SECTIONS: { kind: SearchHit["kind"]; label: string; more: string; moreLabel: string }[] = [
  { kind: "shoe", label: "Shoes", more: "/shoes", moreLabel: "Browse every shoe" },
  { kind: "song", label: "Songs", more: "/tools/music", moreLabel: "Open the Music Finder" },
  { kind: "fuel", label: "Fuel", more: "/fuel", moreLabel: "Browse all fuel" },
  { kind: "guide", label: "Guides", more: "/rundown", moreLabel: "All guides" }
];

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const query = q.slice(0, 80);
  const results = query.trim().length >= 2 ? await searchSite(query, 24) : null;
  const total = results ? Object.values(results).reduce((n, list) => n + list.length, 0) : 0;

  return (
    <div className="container" style={{ paddingBottom: 72 }}>
      <section className="page-hero">
        <span className="eyebrow">Search</span>
        <h1>{query ? `“${query}”` : "Find anything"}</h1>
        <div style={{ maxWidth: 640 }}>
          <SiteSearch initial={query} key={query} />
        </div>
      </section>

      {results && total === 0 ? <p className="empty">Nothing matched “{query}”. Try a brand, a model, an artist or a song.</p> : null}

      {results
        ? SECTIONS.filter((section) => results[section.kind].length).map((section) => (
            <section key={section.kind} style={{ marginBottom: 40 }}>
              <div className="section-head">
                <h2>{section.label}</h2>
                <Link className="text-link" href={section.more}>{section.moreLabel}</Link>
              </div>
              <div className="bib-grid">
                {results[section.kind].map((hit) => {
                  const external = hit.href.startsWith("http");
                  const body = (
                    <>
                      <span className="bib-pins" />
                      {section.kind !== "guide" ? (
                        <span className={`bib-photo${section.kind === "song" ? " cover" : ""}`}>
                          {hit.image ? <img src={hit.image} alt="" loading="lazy" /> : <span className="bib-photo-fallback">{hit.title.slice(0, 1)}</span>}
                        </span>
                      ) : null}
                      <span className="bib-title" style={section.kind === "guide" ? { marginTop: 18 } : undefined}>{hit.title}</span>
                      <span className="bib-meta" style={{ marginBottom: 14 }}>{hit.sub}</span>
                    </>
                  );
                  return external ? (
                    <a key={hit.href + hit.title} className="bib" href={hit.href} target="_blank" rel="noopener noreferrer">{body}</a>
                  ) : (
                    <Link key={hit.href} className="bib" href={hit.href}>{body}</Link>
                  );
                })}
              </div>
            </section>
          ))
        : null}
    </div>
  );
}
