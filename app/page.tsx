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

const journey = [
  {
    name: "Plan your goal",
    description: "Set your race target, map your pacing, and choose the tools that match your current block.",
  },
  {
    name: "Train with purpose",
    description: "Use shoes, fueling, music, and training plans that actually fit the kind of runner you are.",
  },
  {
    name: "Race with confidence",
    description: "Show up with a clear pacing plan, a dialed fueling strategy, and fewer race-day question marks.",
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
    { label: "Goal", value: "PR-ready" }
  ];

  return (
    <div>
      <section className="hero container">
        <div>
          <span className="pill">Built for runners chasing a goal race</span>
          <h1>Your race-day toolkit for training smarter, fueling better, and showing up ready.</h1>
          <p>
            Runner Toolkit helps serious everyday runners prepare for their next 5K, half, or marathon with practical tools for shoes, pacing, fueling, music, and training plans. Use it free, then save your race strategy when you are ready to build your dashboard.
          </p>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link className="btn btn-primary" href="/account">
              Build your race dashboard
            </Link>
            <Link className="btn btn-secondary" href="/tools/pace-calculator">
              Start with pace
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
            <strong>Free now, personal when you want it</strong>
            <p>
              Every tool works instantly. Create an account to save your race goal, training picks, pacing plans, and fueling strategy in one place.
            </p>
          </div>
        </div>
      </section>

      <section id="tools" className="section container">
        <div className="stack" style={{ marginBottom: "24px" }}>
          <h2 className="section-title">Everything you need for your next race block</h2>
          <p className="section-lede">
            Start with one tool or connect them into a complete race-prep workflow.
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

      <section className="section section-tight container">
        <div className="grid grid-3">
          {journey.map((step, index) => (
            <div
              key={step.name}
              className="card card-outline fade-up"
              style={{ "--delay": `${index * 0.08}s` } as CSSProperties}
            >
              <div className="stack">
                <span className="pill">Step {index + 1}</span>
                <strong>{step.name}</strong>
                <p>{step.description}</p>
              </div>
            </div>
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
            <h2 className="section-title">Built for runners training toward something</h2>
            <ul className="list">
              <li className="card card-outline">
                Start free. Use every tool instantly before you decide to save anything.
              </li>
              <li className="card card-outline">
                Save your race setup. Keep your target, pacing, shoes, and fueling plan together in one account.
              </li>
              <li className="card card-outline">
                Come back every week. The goal is not a one-off calculator — it is a better race-day system.
              </li>
            </ul>
          </div>
          <Newsletter />
        </div>
      </section>
    </div>
  );
}
