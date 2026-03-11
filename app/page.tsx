import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import Newsletter from "@/components/newsletter";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const metadata: Metadata = {
  title: "Runner Toolkit — Tools for Serious Runners",
  description:
    "Free running tools: shoe finder, race-day fueling planner, workout music by BPM, and training plans — all in one place.",
};

const tools = [
  {
    name: "Shoe Finder",
    description:
      "Answer a few key questions and see the most popular shoes ranked for your stride and goals.",
    href: "/tools/shoe-selector",
    detail: "Usage, foot strike, cadence, cushion, stability"
  },
  {
    name: "Pace Calculator",
    description:
      "Predict your finish time, convert between paces, and find your splits for any race distance.",
    href: "/tools/pace-calculator",
    detail: "Finish time, splits, pace conversion"
  },
  {
    name: "Music by BPM",
    description:
      "Browse running tracks by tempo, filter by workout type, and find songs that match your pace.",
    href: "/tools/music",
    detail: "3,000+ songs, BPM filters, workout tags"
  },
  {
    name: "Fueling Planner",
    description:
      "Build a race-day nutrition schedule with gel timing, carb targets, and hydration guidance.",
    href: "/tools/fueling",
    detail: "5K to ultra, gel library, mile-by-mile schedule"
  },
  {
    name: "Training Plans",
    description:
      "Pick a free plan from 5K to marathon, view the full weekly schedule, and log your workouts.",
    href: "/tools/training-plans",
    detail: "9 plans, full schedules, workout log"
  },
];

interface RecentArticle {
  slug: string;
  title: string;
  excerpt: string | null;
  tags: string[];
  published_at: string;
}

async function getStats() {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { shoes: 126, songs: 3000, gels: 48, articles: [] as RecentArticle[] };
  const [shoeRes, songRes, gelRes, articleRes] = await Promise.all([
    supabase.from("shoe_models").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("music_songs").select("*", { count: "exact", head: true }),
    supabase.from("fuel_gels").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase
      .from("articles")
      .select("slug, title, excerpt, tags, published_at")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(3),
  ]);
  return {
    shoes: shoeRes.count ?? 126,
    songs: songRes.count ?? 3000,
    gels: gelRes.count ?? 48,
    articles: (articleRes.data as RecentArticle[]) ?? [],
  };
}

export default async function HomePage() {
  const stats = await getStats();

  const highlights = [
    { label: "Running shoes", value: `${stats.shoes}+` },
    { label: "Songs with BPM", value: `${stats.songs.toLocaleString()}+` },
    { label: "Energy gels", value: `${stats.gels}` },
    { label: "Cost", value: "Free" }
  ];

  return (
    <div>
      <section className="hero container">
        <div>
          <span className="pill">Free tools for real runners</span>
          <h1>Everything you need to train smart and race ready.</h1>
          <p>
            Shoe recommendations, pace calculations, race-day fueling plans,
            workout music by BPM, and training schedules — all in one place,
            no account required.
          </p>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link className="btn btn-primary" href="/tools/shoe-selector">
              Find your shoe
            </Link>
            <Link className="btn btn-secondary" href="/tools/pace-calculator">
              Calculate your pace
            </Link>
          </div>
        </div>
        <div className="hero-panel">
          <div className="hero-card fade-up" style={{ "--delay": "0.1s" } as CSSProperties}>
            <div className="stack">
              <strong>What you get</strong>
              <div className="stat-grid">
                {highlights.map((item) => (
                  <div key={item.label} className="stat">
                    <strong>{item.value}</strong>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="card card-accent fade-up" style={{ "--delay": "0.2s" } as CSSProperties}>
            <strong>No sign-up required</strong>
            <p>
              Every tool works instantly. Create an account only if you want
              to save favorites and log workouts.
            </p>
          </div>
        </div>
      </section>

      <section id="tools" className="section container">
        <div className="stack" style={{ marginBottom: "24px" }}>
          <h2 className="section-title">All the tools you need in one place</h2>
          <p className="section-lede">
            Each tool works on its own. Use one or use them all.
          </p>
        </div>
        <div className="grid grid-3">
          {tools.map((tool, index) => (
            <Link
              key={tool.name}
              href={tool.href}
              className="card card-accent fade-up"
              style={{ "--delay": `${index * 0.08}s` } as CSSProperties}
            >
              <div className="stack">
                <strong>{tool.name}</strong>
                <p>{tool.description}</p>
                <span className="tag">{tool.detail}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {stats.articles.length > 0 && (
        <section className="section container">
          <div className="stack" style={{ marginBottom: "24px" }}>
            <h2 className="section-title">The Rundown</h2>
            <p className="section-lede">
              Latest news, guides, and deep dives from the team.
            </p>
          </div>
          <div className="grid grid-3">
            {stats.articles.map((article, index) => (
              <Link
                key={article.slug}
                href={`/rundown/${article.slug}`}
                className="card card-accent fade-up"
                style={{ "--delay": `${index * 0.08}s` } as CSSProperties}
              >
                <div className="stack">
                  <strong>{article.title}</strong>
                  {article.excerpt && (
                    <p style={{ color: "var(--ink-2)", margin: 0, lineHeight: 1.6 }}>
                      {article.excerpt}
                    </p>
                  )}
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {article.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div style={{ marginTop: "20px" }}>
            <Link href="/rundown" className="btn btn-ghost">
              View all articles &rarr;
            </Link>
          </div>
        </section>
      )}

      <section id="how-it-works" className="section container">
        <div className="grid grid-2">
          <div className="stack">
            <h2 className="section-title">Built for runners, not subscribers</h2>
            <ul className="list">
              <li className="card card-outline">
                No paywall. Every tool is free and works without sign-up.
              </li>
              <li className="card card-outline">
                Real data. Shoe specs from manufacturer pages, BPM from GetSongBPM, fueling science from sports nutrition research.
              </li>
              <li className="card card-outline">
                Works on mobile. Check your fueling plan or pace splits right before a race.
              </li>
            </ul>
          </div>
          <Newsletter />
        </div>
      </section>
    </div>
  );
}
