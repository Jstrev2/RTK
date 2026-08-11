import type { Metadata } from "next";
import Link from "next/link";
import Newsletter from "@/components/newsletter";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: { absolute: "Runner Toolkit — Run Smarter. Guess Less." },
  description:
    "Free tools to find running shoes, plan race fuel, and find out if your race is still on after an injury—with a rebuilt comeback schedule for any training plan.",
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
    shoes: 223,
    gels: 48,
    articles: [] as RecentArticle[]
  };
  const supabase = getSupabaseAdmin();
  if (!supabase) return fallback;

  const [shoeRes, gelRes, articleRes] = await Promise.all([
    supabase.from("shoe_models").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("fuel_gels").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase
      .from("articles")
      .select("slug, title, excerpt, tags, published_at")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(12)
  ]);

  const articles = ((articleRes.data as RecentArticle[]) ?? [])
    .filter((article) => {
      const tags = article.tags.map((tag) => tag.toLowerCase());
      return !tags.includes("news") && tags.some((tag) =>
        ["gear", "shoes", "fueling", "music", "training", "race-day"].includes(tag)
      );
    })
    .slice(0, 3);

  return {
    shoes: shoeRes.count ?? fallback.shoes,
    gels: gelRes.count ?? fallback.gels,
    articles
  };
}

export default async function HomePage() {
  const data = await getHomeData();

  return (
    <div>
      <section className="home-hero container">
        <div className="home-hero-copy">
          <span className="eyebrow">Free tools made for runners</span>
          <h1>
            Run smarter.<br />
            <span>Guess less.</span>
          </h1>
          <p>
            Find shoes that fit how you run. Plan fuel for the distance. And if
            you&apos;re hurt mid-plan, find out if your race is still on. Get a
            useful answer in minutes—no account required.
          </p>
        </div>

        <div className="home-hero-note" aria-label="Runner Toolkit promise">
          <span>Before the run</span>
          <strong>Make the decisions.</strong>
          <span>When plans change</span>
          <strong>Make a better plan.</strong>
        </div>
      </section>

      <section id="tools" className="launch-section container" aria-labelledby="choose-tool-title">
        <div className="section-heading-row">
          <div>
            <span className="eyebrow">Start with the run in front of you</span>
            <h2 id="choose-tool-title" className="section-title">What do you need to figure out?</h2>
          </div>
          <p>Three focused tools. Each one gives you an answer you can act on.</p>
        </div>

        <div className="launch-grid">
          <Link href="/tools/shoe-selector" className="launch-card launch-shoes">
            <div className="launch-card-top">
              <span className="launch-number">01</span>
              <span className="launch-meta">{data.shoes}+ current road shoes</span>
            </div>
            <div>
              <span className="tool-kicker">Shoe Finder</span>
              <h3>Find the shoes that fit your run.</h3>
              <p>
                Tell us what you are training for, how you like a shoe to feel,
                what fits your foot, and what you want to spend.
              </p>
            </div>
            <div className="shoe-preview" aria-hidden="true">
              <span><b>Daily miles</b><i>balanced + durable</i></span>
              <span><b>Faster days</b><i>light + responsive</i></span>
              <span><b>Race day</b><i>fast + efficient</i></span>
            </div>
            <span className="launch-action">Find my shoes <b>→</b></span>
          </Link>

          <Link href="/rescue" className="launch-card launch-rescue">
            <div className="launch-card-top">
              <span className="launch-number">02</span>
              <span className="launch-meta">Works with any plan</span>
            </div>
            <div>
              <span className="tool-kicker">Injury Rescue</span>
              <h3>Can I still make my race?</h3>
              <p>
                Hurt mid-training? Answer a short symptom check and get an
                honest verdict—plus a rebuilt week-by-week comeback schedule.
              </p>
            </div>
            <div className="shoe-preview" aria-hidden="true">
              <span><b>Symptom check</b><i>graded like a pro would</i></span>
              <span><b>Race verdict</b><i>honest, not hopeful</i></span>
              <span><b>Rebuilt weeks</b><i>rest → return → race</i></span>
            </div>
            <span className="launch-action">Check my race <b>→</b></span>
          </Link>

          <Link href="/tools/fueling" className="launch-card launch-fuel">
            <div className="launch-card-top">
              <span className="launch-number">03</span>
              <span className="launch-meta">{data.gels}+ fuel products</span>
            </div>
            <div>
              <span className="tool-kicker">Fuel Planner</span>
              <h3>Know what to take—and when.</h3>
              <p>
                Turn your distance, expected time, conditions, and preferred
                fuel into a practical schedule and packing list.
              </p>
            </div>
            <div className="fuel-preview" aria-hidden="true">
              <span><b>0:25</b>Fuel</span>
              <span><b>0:50</b>Fuel</span>
              <span><b>1:15</b>Fuel</span>
            </div>
            <span className="launch-action">Plan my fuel <b>→</b></span>
          </Link>
        </div>
      </section>

      <section className="results-section">
        <div className="container results-layout">
          <div className="results-copy">
            <span className="eyebrow">Answers, not more research</span>
            <h2 className="section-title">Useful enough to change your next run.</h2>
            <p className="section-lede">
              No generic top-ten lists. No unexplained score and a hundred
              options. Runner Toolkit narrows the choice, shows the tradeoffs,
              and gives you a clear next step.
            </p>
            <Link href="/methodology" className="text-link">See how recommendations work →</Link>
          </div>

          <div className="result-principles">
            <div>
              <span>01</span>
              <strong>Personalized</strong>
              <p>Built around the run, runner, and constraints—not a universal ranking.</p>
            </div>
            <div>
              <span>02</span>
              <strong>Explainable</strong>
              <p>Every recommendation includes reasons, assumptions, and tradeoffs.</p>
            </div>
            <div>
              <span>03</span>
              <strong>Independent</strong>
              <p>Retailer relationships never decide what gets recommended.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="adaptive-section container">
        <div className="adaptive-copy">
          <span className="eyebrow">Runner Toolkit Injury Rescue</span>
          <h2>Injured mid-training? We&apos;ll get you back to the start line.</h2>
          <p>
            It works with the plan you&apos;re already on—Higdon PDF, Garmin
            Coach, your coach&apos;s spreadsheet, or ours. A short symptom check
            grades the injury the way a professional would, then the remaining
            weeks are rebuilt around a careful return—with an honest answer
            when racing isn&apos;t the right call.
          </p>
          <div className="button-row">
            <Link href="/rescue" className="btn btn-primary">Check my race — free</Link>
            <Link href="/premium" className="btn btn-secondary">See how Rescue works</Link>
          </div>
        </div>

        <div className="plan-compare" aria-label="Example training plan adjustment">
          <div className="plan-compare-head">
            <span>Week 9 · before</span>
            <span>Week 9 · adjusted</span>
          </div>
          <div className="plan-row">
            <span>Tue · Intervals</span>
            <b>→</b>
            <span>Tue · Easy cross-train</span>
          </div>
          <div className="plan-row">
            <span>Thu · 7 miles</span>
            <b>→</b>
            <span>Thu · Rest + reassess</span>
          </div>
          <div className="plan-row">
            <span>Sun · 16 miles</span>
            <b>→</b>
            <span>Sun · Reduced easy effort</span>
          </div>
          <div className="plan-verdict">
            <span>What changed</span>
            <strong>Intensity removed. Volume reduced. Goal updated.</strong>
          </div>
        </div>
      </section>

      {data.articles.length > 0 ? (
        <section className="guides-section container">
          <div className="section-heading-row">
            <div>
              <span className="eyebrow">Runner Guides</span>
              <h2 className="section-title">Use the answer well.</h2>
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
            New shoe matches, practical race prep, fresh playlists, and training
            updates. No daily noise.
          </p>
        </div>
        <Newsletter />
      </section>
    </div>
  );
}
