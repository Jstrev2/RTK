import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import Newsletter from "@/components/newsletter";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const metadata: Metadata = {
  title: "Runner Toolkit — Training Plans That Adapt When You Get Injured",
  description:
    "Got injured mid-training? Don't start over. Runner Toolkit rebuilds your plan around the injury — plus a free shoe finder, pace calculator, fueling planner, and more.",
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
      "Pick a plan from 5K to marathon — and if you get injured mid-plan, it adapts instead of falling apart.",
    href: "/tools/training-plans",
    detail: "9 plans, injury-adaptive, workout log"
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
    { label: "Injury protocols", value: "11" }
  ];

  return (
    <div>
      <section className="hero container">
        <div>
          <span className="pill">Life happens. Your plan should adapt.</span>
          <h1>Got injured mid-training? Don&apos;t start over.</h1>
          <p>
            Every other training plan falls apart the day your knee starts
            barking. Runner Toolkit rebuilds your remaining weeks around the
            injury — rest, cross-training swaps, a progressive return to
            running, and an honest call on race day.
          </p>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link className="btn btn-primary" href="/tools/training-plans">
              Adapt my training plan
            </Link>
            <Link className="btn btn-secondary" href="/tools/shoe-selector">
              Find your shoe — free
            </Link>
          </div>
        </div>
        <div className="hero-panel">
          <div className="hero-card fade-up" style={{ "--delay": "0.1s" } as CSSProperties}>
            <div className="stack">
              <strong>When you report an injury</strong>
              <ul className="list">
                <li className="brand-sub">🛌 Rest weeks where you need them</li>
                <li className="brand-sub">🚶 Progressive return-to-run protocol</li>
                <li className="brand-sub">🔁 Cross-training matched to the injury</li>
                <li className="brand-sub">📉 Taper preserved when the calendar allows</li>
                <li className="brand-sub">🏁 Honest race-day pace expectations</li>
              </ul>
            </div>
          </div>
          <div className="card card-accent fade-up" style={{ "--delay": "0.2s" } as CSSProperties}>
            <strong>Free tools stay free</strong>
            <p>
              Shoe finder, pace calculator, fueling planner, music, and base
              training plans — instant, no account required. Premium is for the
              adaptive plans.
            </p>
          </div>
        </div>
      </section>

      <section className="section container">
        <div className="grid grid-3">
          <div className="card card-outline fade-up">
            <div className="stack">
              <strong>1. Train for your race</strong>
              <p>
                Pick a free plan from 5K to marathon and follow the weekly
                schedule.
              </p>
            </div>
          </div>
          <div className="card card-outline fade-up" style={{ "--delay": "0.08s" } as CSSProperties}>
            <div className="stack">
              <strong>2. Something starts hurting</strong>
              <p>
                Runner&apos;s knee, IT band, shin splints, plantar fasciitis,
                Achilles — pick the injury and how bad it is.
              </p>
            </div>
          </div>
          <div className="card card-outline fade-up" style={{ "--delay": "0.16s" } as CSSProperties}>
            <div className="stack">
              <strong>3. Your plan adapts</strong>
              <p>
                The remaining weeks get rebuilt so you recover <em>and</em>{" "}
                still show up ready — no more winging it or giving up.
              </p>
            </div>
          </div>
        </div>
        <div style={{ marginTop: "20px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <Link className="btn btn-primary" href="/premium">
            See what Premium includes
          </Link>
          <Link className="btn btn-ghost" href="/tools/training-plans">
            Try it on a plan first
          </Link>
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
            <h2 className="section-title">Free where it counts, premium where it matters</h2>
            <ul className="list">
              <li className="card card-outline">
                The everyday tools — shoes, pace, fueling, music, base plans —
                are free and work without sign-up.
              </li>
              <li className="card card-outline">
                Premium exists for one job: keeping your training on track when
                an injury tries to derail it.
              </li>
              <li className="card card-outline">
                Real data. Full specs on {stats.shoes}+ current road shoes, and
                injury protocols built on standard return-to-run practice.
              </li>
            </ul>
            <div className="stat-grid">
              {highlights.map((item) => (
                <div key={item.label} className="stat">
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
          <Newsletter />
        </div>
      </section>
    </div>
  );
}
