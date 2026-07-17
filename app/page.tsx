import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import Newsletter from "@/components/newsletter";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const metadata: Metadata = {
  title: "Runner Toolkit — The Training Plan That Survives Injury",
  description:
    "Injured mid-training? Runner Toolkit rebuilds your plan around 11 common running injuries and gets you back to the start line — plus a free shoe finder, pace calculator, fueling planner, and running music.",
};

const tools = [
  {
    name: "Shoe Finder",
    description:
      "Answer a few questions and every current road shoe gets ranked for your stride, mileage, and budget — with the reasons why.",
    href: "/tools/shoe-selector",
    detail: "Pronation, mileage, cushion, budget",
    badge: "Free"
  },
  {
    name: "Pace Calculator",
    description:
      "Predict your finish time, convert between paces, and get mile-by-mile splits for any race distance.",
    href: "/tools/pace-calculator",
    detail: "Finish time, splits, conversions",
    badge: "Free"
  },
  {
    name: "Running Music",
    description:
      "Community-ranked running tracks with workout tags — build a playlist for easy days, tempo runs, and speed work.",
    href: "/tools/music",
    detail: "3,000+ songs, community votes",
    badge: "Free"
  },
  {
    name: "Fueling Planner",
    description:
      "Build a race-day nutrition schedule: carb targets, gel timing, and hydration guidance, mile by mile.",
    href: "/tools/fueling",
    detail: "5K to ultra, gel library",
    badge: "Free"
  },
  {
    name: "Attire Guide",
    description:
      "Dress right for any run — kit recommendations matched to the weather and how you like to train.",
    href: "/tools/attire-guide",
    detail: "Weather-based kit builder",
    badge: "Free"
  },
  {
    name: "Training Plans",
    description:
      "9 full plans from 5K to marathon with complete weekly schedules. If you get hurt mid-plan, this is where the comeback starts.",
    href: "/tools/training-plans",
    detail: "9 plans, injury-adaptive",
    badge: "Free + Premium"
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
  if (!supabase) return { shoes: 223, songs: 3000, gels: 48, articles: [] as RecentArticle[] };
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
    shoes: shoeRes.count ?? 223,
    songs: songRes.count ?? 3000,
    gels: gelRes.count ?? 48,
    articles: (articleRes.data as RecentArticle[]) ?? [],
  };
}

export default async function HomePage() {
  const stats = await getStats();

  const highlights = [
    { label: "Injury protocols", value: "11" },
    { label: "Road shoes scored", value: `${stats.shoes}+` },
    { label: "Running songs", value: `${stats.songs.toLocaleString()}+` },
    { label: "Free training plans", value: "9" }
  ];

  return (
    <div>
      <section className="hero container">
        <div>
          <span className="pill">Training plans with a Plan B</span>
          <h1>Injured mid-training? We&apos;ll get you back to the start line.</h1>
          <p>
            Week nine of sixteen and your shin starts screaming — a normal plan
            just keeps going like nothing happened. Runner Toolkit rebuilds your
            remaining weeks around the injury: rest that heals, cross-training
            that holds fitness, a progressive return to running, and an honest
            answer about race day.
          </p>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link className="btn btn-primary" href="/tools/training-plans#injury">
              Rebuild my plan
            </Link>
            <Link className="btn btn-secondary" href="/#tools">
              Explore the free toolkit
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
            <strong>The rest of the toolkit is free</strong>
            <p>
              Shoe finder, pace calculator, fueling planner, music, attire —
              free forever, no account required. Premium exists for one thing:
              the comeback.
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
                Pick any of 9 free plans, 5K to marathon, and follow the full
                weekly schedule. No paywall, no trial clock.
              </p>
            </div>
          </div>
          <div className="card card-outline fade-up" style={{ "--delay": "0.08s" } as CSSProperties}>
            <div className="stack">
              <strong>2. Something breaks</strong>
              <p>
                Runner&apos;s knee, shin splints, IT band, plantar fasciitis, a
                suspect stress fracture — tell us what hurts, how bad, and which
                week you&apos;re in.
              </p>
            </div>
          </div>
          <div className="card card-outline fade-up" style={{ "--delay": "0.16s" } as CSSProperties}>
            <div className="stack">
              <strong>3. We rebuild the road back</strong>
              <p>
                Your remaining weeks get rebuilt: recover first, keep the
                fitness you earned, and show up on race day knowing exactly what
                you&apos;re capable of.
              </p>
            </div>
          </div>
        </div>
        <div style={{ marginTop: "20px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <Link className="btn btn-primary" href="/premium">
            See what Premium includes
          </Link>
          <Link className="btn btn-ghost" href="/tools/training-plans#injury">
            Try it free on any plan
          </Link>
        </div>
      </section>

      <section id="tools" className="section container">
        <div className="stack" style={{ marginBottom: "24px" }}>
          <h2 className="section-title">Come for the free tools</h2>
          <p className="section-lede">
            Everything below is free — really free, no trial clock. It&apos;s how
            most runners find us. The comeback plan is why they stay.
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
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  <span className="badge">{tool.badge}</span>
                  <span className="tag">{tool.detail}</span>
                </div>
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
            <h2 className="section-title">
              The free tools get you training. The premium one keeps you training.
            </h2>
            <ul className="list">
              <li className="card card-outline">
                Free means free: shoes, pace, fueling, music, attire, and every
                base plan work without an account — forever.
              </li>
              <li className="card card-outline">
                Premium does one job. When an injury tries to end your season,
                it rebuilds your plan and gets you to the start line.
              </li>
              <li className="card card-outline">
                Honest by design: protocols follow standard return-to-run
                practice, red flags tell you when to see a professional, and
                some injuries never get a race-day green light from us.
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

      <section className="section container">
        <div className="card card-accent">
          <div className="stack">
            <span className="pill">Runner Toolkit Premium</span>
            <h2 className="section-title" style={{ margin: 0 }}>
              Broken plans welcome.
            </h2>
            <p>
              Report the injury and get your race-day verdict, injury guardrails,
              and first rebuilt week free. Unlock the full comeback schedule when
              you&apos;re ready — $9/month or $72/year. Cancel when you&apos;re
              back.
            </p>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <Link className="btn btn-primary" href="/tools/training-plans#injury">
                Rebuild my plan
              </Link>
              <Link className="btn btn-secondary" href="/premium">
                See Premium pricing
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
