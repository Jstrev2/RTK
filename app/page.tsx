import type { Metadata } from "next";
import Link from "next/link";
import Newsletter from "@/components/newsletter";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const revalidate = 1800;

export const metadata: Metadata = {
  title: { absolute: "Runner Toolkit: Running Shoes, Music, Fuel and Guides" },
  description:
    "Find running shoes that fit how you run, songs that match your cadence and a fuel plan for your race. Free tools, hundreds of data-backed pages and new guides every day.",
  alternates: { canonical: "/" }
};

interface RecentArticle {
  slug: string;
  title: string;
  excerpt: string | null;
  tags: string[];
  published_at: string;
}

async function getHomeData() {
  const fallback = {
    shoes: 440,
    gels: 48,
    songs: 2800,
    guides: 0,
    articles: [] as RecentArticle[]
  };
  const supabase = getSupabaseAdmin();
  if (!supabase) return fallback;

  const [shoeRes, gelRes, songRes, articleRes] = await Promise.all([
    supabase.from("shoe_models").select("*", { count: "exact", head: true }).eq("is_active", true),
    // Count only what the pages can use: gels with nutrition, songs with a measured BPM.
    supabase.from("fuel_gels").select("*", { count: "exact", head: true }).eq("is_active", true).gt("carbs_g", 0),
    supabase.from("music_songs").select("*", { count: "exact", head: true }).not("bpm", "is", null),
    supabase
      .from("articles")
      .select("slug, title, excerpt, tags, published_at", { count: "exact" })
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(12)
  ]);

  const articles = ((articleRes.data as RecentArticle[]) ?? [])
    .filter((article) => !article.tags.map((tag) => tag.toLowerCase()).includes("news"))
    .slice(0, 6);

  return {
    shoes: shoeRes.count ?? fallback.shoes,
    gels: gelRes.count ?? fallback.gels,
    songs: songRes.count ?? fallback.songs,
    guides: articleRes.count ?? articles.length,
    articles
  };
}

export default async function HomePage() {
  const data = await getHomeData();

  return (
    <div>
      <section className="home-hero container">
        <div className="home-hero-copy">
          <span className="eyebrow">Shoes, music, fuel and guides for runners</span>
          <h1>
            Run smarter.<br />
            <span>Guess less.</span>
          </h1>
          <p>
            Find shoes that fit how you run, songs that match your stride and a
            fuel plan for the distance. Every tool is free; a free account
            opens the full results.
          </p>
        </div>

        <div className="home-hero-note" aria-label="What is on Runner Toolkit">
          <span>Shoes tracked</span>
          <strong>{data.shoes.toLocaleString()}</strong>
          <span>Songs with BPM</span>
          <strong>{data.songs.toLocaleString()}</strong>
          <span>Gels and chews</span>
          <strong>{data.gels.toLocaleString()}</strong>
        </div>
      </section>

      <section id="tools" className="launch-section container" aria-labelledby="choose-tool-title">
        <div className="section-heading-row">
          <div>
            <span className="eyebrow">Start with the run in front of you</span>
            <h2 id="choose-tool-title" className="section-title">What do you need to figure out?</h2>
          </div>
          <p>Three finders that give you an answer you can act on, and a library of guides behind them.</p>
        </div>

        <div className="launch-grid launch-grid-4">
          <Link href="/tools/shoe-selector" className="launch-card launch-shoes">
            <div className="launch-card-top">
              <span className="launch-number">01</span>
              <span className="launch-meta">{data.shoes}+ road shoes</span>
            </div>
            <div>
              <span className="tool-kicker">Shoe Finder</span>
              <h3>Find the shoes that fit your run.</h3>
              <p>
                Tell us what you train for, how you like a shoe to feel, your
                foot and your budget. Get three shoes, each with a reason.
              </p>
            </div>
            <span className="launch-action">Find my shoes <b>→</b></span>
          </Link>

          <Link href="/tools/music" className="launch-card launch-music">
            <div className="launch-card-top">
              <span className="launch-number">02</span>
              <span className="launch-meta">{data.songs.toLocaleString()} songs by BPM</span>
            </div>
            <div>
              <span className="tool-kicker">Music Finder</span>
              <h3>Songs that match your stride.</h3>
              <p>
                Pick the workout and how long you&apos;ll run. Get a playlist
                timed to your cadence, with every track one tap from Spotify.
              </p>
            </div>
            <span className="launch-action">Build my playlist <b>→</b></span>
          </Link>

          <Link href="/tools/fueling" className="launch-card launch-fuel">
            <div className="launch-card-top">
              <span className="launch-number">03</span>
              <span className="launch-meta">{data.gels}+ fuel products</span>
            </div>
            <div>
              <span className="tool-kicker">Fuel Finder</span>
              <h3>Know what to take, and when.</h3>
              <p>
                Turn your distance, finish time and conditions into a gel
                schedule and a packing list you can practice.
              </p>
            </div>
            <span className="launch-action">Plan my fuel <b>→</b></span>
          </Link>

          <Link href="/rundown" className="launch-card launch-guides">
            <div className="launch-card-top">
              <span className="launch-number">04</span>
              <span className="launch-meta">{data.guides > 0 ? data.guides + " guides" : "New every day"}</span>
            </div>
            <div>
              <span className="tool-kicker">Runner Guides</span>
              <h3>Use the answer well.</h3>
              <p>
                Straight answers on shoes, cadence, fueling and race day, with
                the numbers checked against our own database.
              </p>
            </div>
            <span className="launch-action">Read the guides <b>→</b></span>
          </Link>
        </div>
      </section>

      <section className="results-section">
        <div className="container results-layout">
          <div className="results-copy">
            <span className="eyebrow">Browse without a quiz</span>
            <h2 className="section-title">Every answer, already worked out.</h2>
            <p className="section-lede">
              Ranked shoe lists, head-to-head comparisons, songs at every BPM
              and fuel plans for every finish time. Built from the same data the
              finders use and updated when it changes.
            </p>
            <Link href="/methodology" className="text-link">See how the pages are made →</Link>
          </div>

          <div className="result-principles">
            <Link href="/shoes/best">
              <span>Shoes</span>
              <strong>Best running shoes, by need</strong>
              <p>Daily trainers, race shoes, wide feet, stability, every price band and every brand, plus side-by-side comparisons.</p>
            </Link>
            <Link href="/music">
              <span>Music</span>
              <strong>Running songs by BPM and pace</strong>
              <p>Songs at every cadence from a slow jog to race pace, by genre, workout and artist.</p>
            </Link>
            <Link href="/fuel">
              <span>Fuel</span>
              <strong>Race fuel plans and gel data</strong>
              <p>How many gels for your half or full marathon at your finish time, and how every gel compares.</p>
            </Link>
          </div>
        </div>
      </section>

      {data.articles.length > 0 ? (
        <section className="guides-section container">
          <div className="section-heading-row">
            <div>
              <span className="eyebrow">Runner Guides</span>
              <h2 className="section-title">Newest guides.</h2>
            </div>
            <Link href="/rundown" className="text-link">Browse all guides →</Link>
          </div>
          <div className="guide-grid">
            {data.articles.map((article) => (
              <Link key={article.slug} href={`/rundown/${article.slug}`} className="guide-card">
                <div className="guide-tags">
                  {article.tags.slice(0, 2).map((tag) => <span key={tag}>{tag}</span>)}
                </div>
                <h3>{article.title}</h3>
                {article.excerpt ? <p>{article.excerpt}</p> : null}
                <span className="text-link">Read guide →</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="newsletter-section container">
        <div>
          <span className="eyebrow">Stay useful, stay occasional</span>
          <h2 className="section-title">Get better answers in your inbox.</h2>
          <p className="section-lede">
            New shoe matches, practical race prep, fresh playlists and new
            guides. No daily noise.
          </p>
        </div>
        <Newsletter />
      </section>
    </div>
  );
}
