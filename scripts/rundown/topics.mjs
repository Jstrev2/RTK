/**
 * List current Rundown topics by status.
 *
 * Usage:
 *   npm run rundown:topics             — show new topics (default)
 *   npm run rundown:topics -- --all    — show all topics
 *   npm run rundown:topics -- --status drafted
 */

import "../load-env.mjs";
import { createClient } from "@supabase/supabase-js";

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

  const showAll = process.argv.includes("--all");
  const statusIdx = process.argv.indexOf("--status");
  const statusFilter = statusIdx !== -1 ? process.argv[statusIdx + 1] : null;

  let query = supabase
    .from("rundown_topics")
    .select("topic_key, title, summary, score, post_count, tags, status, subreddit, discovered_at")
    .order("score", { ascending: false })
    .limit(30);

  if (!showAll) {
    query = query.eq("status", statusFilter ?? "new");
  }

  const { data, error } = await query;

  if (error) {
    console.error("Query failed:", error.message);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log("No topics found. Run 'npm run rundown:discover' first.");
    return;
  }

  console.log(`\n${"─".repeat(70)}`);
  console.log(`  THE RUNDOWN — Topic Queue (${data.length} topics, status: ${statusFilter ?? (showAll ? "all" : "new")})`);
  console.log(`${"─".repeat(70)}\n`);

  for (const topic of data) {
    const tags = topic.tags?.length ? `[${topic.tags.join(", ")}]` : "";
    const status = topic.status !== "new" ? ` (${topic.status})` : "";
    console.log(`  ${String(topic.score).padStart(6)}↑  ${String(topic.post_count).padStart(2)} posts  ${topic.title}${status}`);
    console.log(`          ${tags}  ${topic.subreddit}`);

    if (topic.summary) {
      const lines = topic.summary.split("\n").slice(0, 2);
      for (const line of lines) {
        console.log(`          ${line}`);
      }
    }
    console.log();
  }

  console.log(`${"─".repeat(70)}`);
  console.log(`  To write about a topic, tell Claude Code:`);
  console.log(`  "Write a Rundown article about [topic title]"`);
  console.log(`${"─".repeat(70)}\n`);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
