/**
 * Rundown Topic Discovery
 *
 * Scans Reddit running communities for trending topics and clusters them
 * into potential article ideas. Saves results to rundown_topics table.
 *
 * Usage: npm run rundown:discover
 *
 * Env:
 *   REDDIT_CLIENT_ID / REDDIT_CLIENT_SECRET — required
 *   RUNDOWN_SUBREDDITS — comma-separated override (default: running subs)
 *   RUNDOWN_MIN_SCORE — minimum post score to consider (default: 20)
 *   RUNDOWN_LOOKBACK_HOURS — how far back to look (default: 168 = 7 days)
 */

import "../load-env.mjs";
import { createClient } from "@supabase/supabase-js";

// ── Reddit auth ─────────────────────────────────────────────────────

const getRedditToken = async () => {
  const clientId = process.env.REDDIT_CLIENT_ID ?? "";
  const clientSecret = process.env.REDDIT_CLIENT_SECRET ?? "";
  const userAgent = process.env.REDDIT_USER_AGENT ?? "runner-toolkit-rundown";

  if (!clientId || !clientSecret) {
    console.error("Missing REDDIT_CLIENT_ID or REDDIT_CLIENT_SECRET");
    process.exit(1);
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": userAgent,
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    console.error("Reddit auth failed:", res.status);
    process.exit(1);
  }

  const data = await res.json();
  return data.access_token;
};

// ── Fetch hot + top posts ───────────────────────────────────────────

const fetchPosts = async (token, subreddit, sort, limit = 100) => {
  const userAgent = process.env.REDDIT_USER_AGENT ?? "runner-toolkit-rundown";
  const timeParam = sort === "top" ? "&t=week" : "";
  const res = await fetch(
    `https://oauth.reddit.com/r/${subreddit}/${sort}?limit=${limit}${timeParam}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": userAgent,
      },
    }
  );

  if (!res.ok) return [];

  const data = await res.json();
  return data.data.children.map((c) => ({
    id: c.data.id,
    subreddit: c.data.subreddit,
    title: c.data.title,
    body: (c.data.selftext ?? "").slice(0, 500),
    score: c.data.score ?? 0,
    numComments: c.data.num_comments ?? 0,
    createdUtc: c.data.created_utc,
    permalink: `https://www.reddit.com${c.data.permalink}`,
    flair: c.data.link_flair_text ?? "",
  }));
};

// ── Topic clustering ────────────────────────────────────────────────

const normalize = (text) =>
  text
    .toLowerCase()
    .replace(/['']/g, "'")
    .replace(/[^a-z0-9' ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Extract topic phrases from a post title. We look for:
 * - Named events (marathon, race, olympics, etc.)
 * - Shoe names (brand + model patterns)
 * - Training concepts (tempo, intervals, taper, etc.)
 * - Gear categories
 * - Injury keywords
 */
const TOPIC_PATTERNS = [
  // Events & races
  /\b(boston|london|chicago|nyc|new york|berlin|tokyo|la|los angeles|olympic|world major)\s*(marathon|half|10k|5k|race|championship)s?\b/gi,
  /\b(marathon|half marathon|ultra|ironman|triathlon)\s*(training|results?|recap|winner|record)\b/gi,
  // Specific people / records
  /\b(kipchoge|cheptegei|assefa|lyles|jepchirchir|obiri|kosgei|chebet|tola|bekele|farah|hall|haskins|kipyegon)\b/gi,
  // Shoe buzz
  /\b(vaporfly|alphafly|endorphin|adizero|metaspeed|rocket\s*x|ghost|clifton|pegasus|novablast|glycerin|hyperion|invincible|gel.nimbus)\s*\d*/gi,
  // Training topics
  /\b(marathon training|half marathon training|speed ?work|tempo run|long run|taper|base building|mileage|pfitz|hanson|higdon|daniels)\b/gi,
  // Gear & tech
  /\b(garmin|coros|apple watch|chest strap|carbon plate|super ?shoe|stack height)\b/gi,
  // Fueling & health
  /\b(gel|fueling|hydration|electrolyte|carb loading|runner.s knee|plantar|achilles|shin splint|it band)\b/gi,
];

const extractPhrases = (title) => {
  const phrases = new Set();
  for (const pattern of TOPIC_PATTERNS) {
    // Reset lastIndex for global patterns
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(title)) !== null) {
      phrases.add(normalize(match[0]));
    }
  }
  return [...phrases];
};

/**
 * Build a topic key from a phrase — collapses minor variations.
 */
const topicKey = (phrase) =>
  phrase
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 80);

/**
 * Cluster posts into topics. Each topic is a group of posts sharing a phrase.
 * Posts with no matched phrase get grouped by high-level flair or skipped.
 */
const clusterTopics = (posts, minScore) => {
  const topics = new Map();

  for (const post of posts) {
    if (post.score < minScore) continue;

    const phrases = extractPhrases(post.title);
    if (!phrases.length) continue;

    for (const phrase of phrases) {
      const key = topicKey(phrase);
      if (!key) continue;

      const existing = topics.get(key) ?? {
        topic_key: key,
        phrase,
        posts: [],
        totalScore: 0,
        totalComments: 0,
        subreddits: new Set(),
        tags: new Set(),
      };

      existing.posts.push(post);
      existing.totalScore += post.score;
      existing.totalComments += post.numComments;
      existing.subreddits.add(post.subreddit);

      // Auto-tag
      if (/marathon|race|5k|10k|half|ultra/i.test(phrase)) existing.tags.add("racing");
      if (/training|tempo|speed|interval|taper|mileage/i.test(phrase)) existing.tags.add("training");
      if (/shoe|vaporfly|alphafly|endorphin|pegasus|clifton|ghost|carbon plate/i.test(phrase)) existing.tags.add("gear");
      if (/fueling|gel|hydration|carb/i.test(phrase)) existing.tags.add("fueling");
      if (/knee|plantar|achilles|shin|it band|injury/i.test(phrase)) existing.tags.add("health");
      if (/garmin|coros|apple watch|chest strap/i.test(phrase)) existing.tags.add("tech");
      if (/kipchoge|cheptegei|assefa|record|winner|olympic/i.test(phrase)) existing.tags.add("news");

      topics.set(key, existing);
    }
  }

  return topics;
};

// ── Generate a human-readable title from a phrase ───────────────────

const titleCase = (str) =>
  str.replace(/\b\w/g, (c) => c.toUpperCase());

const generateTitle = (phrase, topPosts) => {
  // Use the highest-scored post title as inspiration, but clean it up
  const best = topPosts[0];
  if (topPosts.length === 1) {
    // Single post — use its title directly if it's decent
    const t = best.title.trim();
    if (t.length > 20 && t.length < 120) return t;
  }
  // Multiple posts — create a summary title from the phrase
  return titleCase(phrase);
};

const generateSummary = (posts) => {
  const sorted = [...posts].sort((a, b) => b.score - a.score);
  return sorted
    .slice(0, 3)
    .map((p) => `[${p.score}↑ r/${p.subreddit}] ${p.title}`)
    .join("\n");
};

// ── Main ────────────────────────────────────────────────────────────

const run = async () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase env vars.");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const minScore = Number(process.env.RUNDOWN_MIN_SCORE ?? "20");
  const lookbackHours = Number(process.env.RUNDOWN_LOOKBACK_HOURS ?? "168");
  const cutoff = Date.now() / 1000 - lookbackHours * 3600;

  const subredditEnv = process.env.RUNDOWN_SUBREDDITS ?? "";
  const subreddits = subredditEnv
    ? subredditEnv.split(",").map((s) => s.trim()).filter(Boolean)
    : ["running", "advancedrunning", "runningshoegeeks", "marathontraining", "trailrunning"];

  console.log(`Scanning ${subreddits.length} subreddits (min score: ${minScore}, lookback: ${lookbackHours}h)...\n`);

  const token = await getRedditToken();

  // Fetch hot + top from each subreddit
  const allPosts = [];
  for (const sub of subreddits) {
    const [hot, top] = await Promise.all([
      fetchPosts(token, sub, "hot", 100),
      fetchPosts(token, sub, "top", 50),
    ]);

    // Deduplicate by post ID
    const seen = new Set();
    const combined = [...hot, ...top].filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return p.createdUtc >= cutoff;
    });

    console.log(`  r/${sub}: ${combined.length} posts (${hot.length} hot + ${top.length} top, after dedup & cutoff)`);
    allPosts.push(...combined);
  }

  console.log(`\nTotal posts: ${allPosts.length}`);

  // Cluster into topics
  const topicMap = clusterTopics(allPosts, minScore);
  const topics = [...topicMap.values()]
    .map((t) => ({
      ...t,
      subreddits: [...t.subreddits],
      tags: [...t.tags],
    }))
    .sort((a, b) => b.totalScore - a.totalScore);

  console.log(`Clustered into ${topics.length} topics\n`);

  if (!topics.length) {
    console.log("No trending topics found. Try lowering RUNDOWN_MIN_SCORE.");
    return;
  }

  // Upsert into rundown_topics
  const rows = topics.map((t) => {
    const sortedPosts = [...t.posts].sort((a, b) => b.score - a.score);
    return {
      topic_key: t.topic_key,
      title: generateTitle(t.phrase, sortedPosts),
      summary: generateSummary(sortedPosts),
      source: "reddit",
      subreddit: t.subreddits.join(", "),
      score: t.totalScore,
      post_count: t.posts.length,
      sample_posts: sortedPosts.slice(0, 5).map((p) => ({
        title: p.title,
        score: p.score,
        comments: p.numComments,
        subreddit: p.subreddit,
        url: p.permalink,
      })),
      tags: t.tags,
      updated_at: new Date().toISOString(),
    };
  });

  const { error } = await supabase.from("rundown_topics").upsert(rows, {
    onConflict: "topic_key",
    ignoreDuplicates: false,
  });

  if (error) {
    console.error("Failed to upsert topics:", error.message);
    process.exit(1);
  }

  // Print top topics
  console.log("Top trending topics:\n");
  for (const t of topics.slice(0, 15)) {
    const tagStr = t.tags.length ? ` [${t.tags.join(", ")}]` : "";
    console.log(`  ${t.totalScore.toLocaleString()}↑  ${t.posts.length} posts  "${t.phrase}"${tagStr}`);
    console.log(`       ${t.subreddits.map((s) => `r/${s}`).join(", ")}`);
  }

  console.log(`\nSaved ${rows.length} topics to rundown_topics table.`);
  console.log('Run "npm run rundown:topics" to see current topics.');
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
