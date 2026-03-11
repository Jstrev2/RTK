/**
 * Publish or manage Rundown article drafts.
 *
 * Usage:
 *   npm run rundown:publish                     — list unpublished drafts
 *   npm run rundown:publish -- --slug <slug>    — publish a specific draft
 *   npm run rundown:publish -- --all            — publish all drafts
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

  const slugIdx = process.argv.indexOf("--slug");
  const targetSlug = slugIdx !== -1 ? process.argv[slugIdx + 1] : null;
  const publishAll = process.argv.includes("--all");

  if (targetSlug) {
    // Publish a specific article
    const { data, error } = await supabase
      .from("articles")
      .update({
        is_published: true,
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("slug", targetSlug)
      .select("slug, title");

    if (error) {
      console.error("Publish failed:", error.message);
      process.exit(1);
    }

    if (!data?.length) {
      console.error(`No article found with slug: ${targetSlug}`);
      process.exit(1);
    }

    console.log(`Published: "${data[0].title}" → /rundown/${data[0].slug}`);
    return;
  }

  if (publishAll) {
    const { data, error } = await supabase
      .from("articles")
      .update({
        is_published: true,
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("is_published", false)
      .select("slug, title");

    if (error) {
      console.error("Publish failed:", error.message);
      process.exit(1);
    }

    console.log(`Published ${data?.length ?? 0} articles.`);
    for (const a of data ?? []) {
      console.log(`  → "${a.title}" /rundown/${a.slug}`);
    }
    return;
  }

  // List unpublished drafts
  const { data: drafts, error } = await supabase
    .from("articles")
    .select("slug, title, excerpt, tags, created_at")
    .eq("is_published", false)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Query failed:", error.message);
    process.exit(1);
  }

  if (!drafts?.length) {
    console.log("No unpublished drafts.");
    return;
  }

  console.log(`\n${drafts.length} unpublished draft(s):\n`);
  for (const d of drafts) {
    console.log(`  "${d.title}"`);
    console.log(`   slug: ${d.slug}  tags: ${(d.tags ?? []).join(", ")}`);
    if (d.excerpt) console.log(`   ${d.excerpt.slice(0, 100)}...`);
    console.log();
  }

  console.log(`Publish with: npm run rundown:publish -- --slug <slug>`);
  console.log(`Or publish all: npm run rundown:publish -- --all`);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
