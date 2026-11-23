import type { Metadata } from "next";
import Link from "next/link";
import Newsletter from "@/components/newsletter";
import SiteSearch from "@/components/site-search";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { PHOTOS, photoForGuide } from "@/lib/photos";

export const revalidate = 1800;

export const metadata: Metadata = {
  title: { absolute: "Runner Toolkit: Running Shoes, Music and Race Fuel, Sorted" },
  description:
    "Find running shoes that fit how you run, a playlist that matches your pace and a fuel plan for race day. Every current shoe, thousands of songs, every gel.",
  alternates: { canonical: "/" }
};

type Shoe = { item_key: string; name: string; brand: string; price: number | null; image_url: string | null; weight_mens: number | null; drop: number | null };
type Guide = { slug: string; title: string; excerpt: string | null; tags: string[] };
type Fresh = { label: string; href: string };

async function getHomeData() {
  const supabase = getSupabaseAdmin();
  const empty = { shoes: [] as Shoe[], guides: [] as Guide[], fresh: [] as Fresh[], counts: { shoes: 0, songs: 0, fuel: 0 } };
  if (!supabase) return empty;

  const [popular, newest, guides, shoeCount, songCount, fuelCount] = await Promise.all([
    supabase
      .from("shoe_models")
      .select("item_key,name,brand,price,image_url,weight_mens,drop")
      .eq("is_active", true)
      .lte("release_date", new Date().toISOString().slice(0, 10))
      .order("popularity", { ascending: false })
      .limit(24),
    supabase
      .from("shoe_models")
      .select("item_key,name,release_date")
      .eq("is_active", true)
      .lte("release_date", new Date().toISOString().slice(0, 10))
      .order("release_date", { ascending: false })
      .limit(8),
    supabase
      .from("articles")
      .select("slug,title,excerpt,tags")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(12),
    supabase.from("shoe_models").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("music_songs").select("*", { count: "exact", head: true }).not("bpm", "is", null),
    supabase.from("fuel_gels").select("*", { count: "exact", head: true }).eq("is_active", true)
  ]);

  const shoes = ((popular.data as Shoe[]) ?? []).sort((a, b) => Number(Boolean(b.image_url)) - Number(Boolean(a.image_url))).slice(0, 8);
  const guideRows = ((guides.data as Guide[]) ?? []).filter((g) => !g.tags.map((t) => t.toLowerCase()).includes("news"));
  const fresh: Fresh[] = [
    ...((newest.data as { item_key: string; name: string }[]) ?? []).map((s) => ({ label: `New shoe: ${s.name}`, href: `/shoes/${s.item_key}` })),
    ...guideRows.slice(0, 6).map((g) => ({ label: `New guide: ${g.title}`, href: `/rundown/${g.slug}` }))
  ];

  return {
    shoes,
    guides: guideRows.slice(0, 6),
    fresh,
    counts: { shoes: shoeCount.count ?? 0, songs: songCount.count ?? 0, fuel: fuelCount.count ?? 0 }
  };
}

const TOOLS = [
  { href: "/tools/shoe-selector", photo: PHOTOS.shoes, kicker: "Shoe Finder", title: "Three taps to your next pair.", cta: "Find my shoes" },
  { href: "/tools/music", photo: PHOTOS.music, kicker: "Music Finder", title: "A playlist that runs your pace.", cta: "Build my playlist" },
  { href: "/tools/fueling", photo: PHOTOS.fuel, kicker: "Fuel Finder", title: "Know when to take the next gel.", cta: "Plan my fuel" }
];

export default async function HomePage() {
  const data = await getHomeData();
  const hero = PHOTOS.home();

  return (
    <div>
      <section className="home-hero2">
        <div className="photo-duo">
          <img src={hero.src} alt={hero.alt} fetchPriority="high" />
        </div>
        <div className="container home-hero2-inner">
          <span className="home-hero2-bib">
            <span className="clock">{data.counts.shoes || "300+"}</span> shoes ·{" "}
            <span className="clock">{data.counts.songs ? data.counts.songs.toLocaleString() : "1,000s of"}</span> songs ·{" "}
            <span className="clock">{data.counts.fuel || "150+"}</span> fuel picks
          </span>
          <h1>
            Shoes. Songs. Gels.<br />
            <span>Sorted.</span>
          </h1>
          <p className="page-hero-sub">Everything you need between now and the start line, minus the research.</p>
          <div className="home-hero2-search">
            <SiteSearch />
          </div>
          <div className="home-hero2-actions">
            {TOOLS.map((tool) => (
              <Link key={tool.href} href={tool.href} className="btn btn-volt">
                {tool.cta}
              </Link>
            ))}
          </div>
        </div>
        <span className="photo-credit">
          Photo: <a href={hero.source} target="_blank" rel="noopener noreferrer">{hero.author}</a>, {hero.license}
        </span>
      </section>

      {data.fresh.length ? (
        <div className="ticker" aria-label="Just added">
          <div className="ticker-track">
            {[...data.fresh, ...data.fresh].map((item, i) => (
              <Link key={i} href={item.href}>
                ● {item.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <section className="container home-block">
        <div className="section-head">
          <div>
            <span className="eyebrow">Most popular right now</span>
            <h2>The shoes everyone's running in</h2>
          </div>
          <Link className="btn" href="/shoes">See every shoe</Link>
        </div>
        <div className="bib-grid">
          {data.shoes.map((shoe, i) => (
            <Link key={shoe.item_key} href={`/shoes/${shoe.item_key}`} className="bib">
              <span className="bib-pins" />
              <span className="bib-number">{String(i + 1).padStart(2, "0")}</span>
              <span className="bib-photo">
                {shoe.image_url ? (
                  <img src={shoe.image_url} alt={shoe.name} loading="lazy" />
                ) : (
                  <span className="bib-photo-fallback">{shoe.brand}</span>
                )}
              </span>
              <span className="bib-meta">{shoe.brand}</span>
              <span className="bib-title">{shoe.name.replace(new RegExp(`^${shoe.brand}\\s+`, "i"), "")}</span>
              <span className="bib-stats">
                {shoe.weight_mens ? <span className="split"><b>{shoe.weight_mens}</b>oz</span> : null}
                {shoe.drop !== null ? <span className="split"><b>{shoe.drop}</b>mm drop</span> : null}
              </span>
              <span className="bib-tear">
                <span className="bib-price">{shoe.price ? `$${shoe.price}` : "See price"}</span>
                <span className="text-link">Details →</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="container home-block">
        <div className="section-head">
          <div>
            <span className="eyebrow">Three finders</span>
            <h2>Answer a couple of questions. Get the answer.</h2>
          </div>
        </div>
        <div className="tool-tiles">
          {TOOLS.map((tool) => {
            const photo = tool.photo();
            return (
              <Link key={tool.href} href={tool.href} className="tool-tile">
                <div className="photo-duo">
                  <img src={photo.src} alt={photo.alt} loading="lazy" />
                </div>
                <div className="tool-tile-body">
                  <span className="eyebrow">{tool.kicker}</span>
                  <h3>{tool.title}</h3>
                  <span className="btn btn-volt btn-sm">{tool.cta} →</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {data.guides.length ? (
        <section className="container home-block">
          <div className="section-head">
            <div>
              <span className="eyebrow">Fresh guides</span>
              <h2>Short answers to real questions</h2>
            </div>
            <Link className="btn" href="/rundown">All guides</Link>
          </div>
          <div className="guide-cards">
            {data.guides.map((guide) => {
              const photo = photoForGuide(guide.tags, guide.slug);
              return (
                <Link key={guide.slug} href={`/rundown/${guide.slug}`} className="guide-card2">
                  <span className="guide-card2-photo">
                    <img src={photo.src} alt="" loading="lazy" />
                  </span>
                  <span className="guide-card2-tag">{guide.tags[0] ?? "guide"}</span>
                  <strong>{guide.title}</strong>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="container home-block">
        <div className="panel-dark home-news">
          <div>
            <span className="eyebrow" style={{ color: "var(--volt)" }}>Once a month, never more</span>
            <h2>New shoes, new songs, one email.</h2>
          </div>
          <Newsletter />
        </div>
      </section>
    </div>
  );
}
