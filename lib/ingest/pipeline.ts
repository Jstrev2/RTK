import { attireAliases, shoeAliases as fallbackShoeAliases, CatalogAlias } from "@/lib/ingest/catalog-aliases";
import { generateShoeAliases } from "@/lib/ingest/generate-aliases";
import { discoverNewShoes, ShoeCandidate } from "@/lib/ingest/discover-shoes";
import { fetchRedditPosts } from "@/lib/ingest/reddit";
import { fetchImageForItem } from "@/lib/ingest/images";
import { matchAliases, normalizeText } from "@/lib/ingest/text";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export type MentionAggregate = {
  itemType: "shoe" | "attire";
  itemKey: string;
  name: string;
  brand?: string;
  category?: string;
  releaseYear?: string;
  aliases: string[];
  mentionCount: number;
  mentionScore: number;
  lastSeen?: string;
  lastTitle?: string;
  lastUrl?: string;
};

const defaultSubreddits = [
  "runningshoegeeks",
  "running",
  "advancedrunning",
  "trailrunning",
  "ultrarunning"
];

const scoreWeight = (score: number) => {
  const normalized = Math.max(0, Math.min(score, 2000));
  return 1 + Math.log(1 + normalized / 10);
};

const aggregateMentions = (
  posts: Awaited<ReturnType<typeof fetchRedditPosts>>,
  aliases: CatalogAlias[]
) => {
  const aggregates = new Map<string, MentionAggregate>();

  for (const post of posts) {
    const content = normalizeText(`${post.title} ${post.body}`);

    for (const alias of aliases) {
      const matches = matchAliases(content, alias.aliases);
      if (!matches.length) {
        continue;
      }

      const key = `${alias.itemType}:${alias.itemKey}`;
      const existing = aggregates.get(key) ?? {
        itemType: alias.itemType,
        itemKey: alias.itemKey,
        name: alias.name,
        brand: alias.brand,
        category: alias.category,
        releaseYear: alias.releaseYear,
        aliases: alias.aliases,
        mentionCount: 0,
        mentionScore: 0,
        lastSeen: undefined,
        lastTitle: undefined,
        lastUrl: undefined
      };

      existing.mentionCount += 1;
      existing.mentionScore += scoreWeight(post.score);

      if (!existing.lastSeen || post.createdUtc * 1000 > Date.parse(existing.lastSeen)) {
        existing.lastSeen = new Date(post.createdUtc * 1000).toISOString();
        existing.lastTitle = post.title;
        existing.lastUrl = post.permalink;
      }

      aggregates.set(key, existing);
    }
  }

  return Array.from(aggregates.values());
};

const ensureCatalogItems = async (supabase: ReturnType<typeof getSupabaseAdmin>, shoeAliases: CatalogAlias[]) => {
  if (!supabase) {
    return;
  }

  const items = [...shoeAliases, ...attireAliases].map((item) => ({
    item_type: item.itemType,
    item_key: item.itemKey,
    name: item.name,
    brand: item.brand ?? null,
    category: item.category ?? null,
    release_year: item.releaseYear ?? null,
    aliases: item.aliases,
    source_data: { seeded: true },
    updated_at: new Date().toISOString()
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await supabase.from("catalog_items").upsert(items as any, {
    onConflict: "item_type,item_key"
  });
};

const upsertMentions = async (
  supabase: ReturnType<typeof getSupabaseAdmin>,
  source: string,
  mentions: MentionAggregate[]
) => {
  if (!supabase) {
    return { updated: 0 };
  }

  const rows = mentions.map((mention) => ({
    item_type: mention.itemType,
    item_key: mention.itemKey,
    source,
    mention_count: mention.mentionCount,
    mention_score: mention.mentionScore,
    last_seen: mention.lastSeen ?? null,
    last_title: mention.lastTitle ?? null,
    last_url: mention.lastUrl ?? null,
    updated_at: new Date().toISOString()
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase.from("catalog_mentions").upsert(rows as any, {
    onConflict: "item_type,item_key,source"
  });

  if (error) {
    throw error;
  }

  const updates = mentions.map((mention) => ({
    item_type: mention.itemType,
    item_key: mention.itemKey,
    mention_count: mention.mentionCount,
    mention_score: mention.mentionScore,
    last_seen: mention.lastSeen ?? null,
    updated_at: new Date().toISOString()
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await supabase.from("catalog_items").upsert(updates as any, {
    onConflict: "item_type,item_key"
  });

  return { updated: rows.length };
};

const fetchMissingImages = async (supabase: ReturnType<typeof getSupabaseAdmin>) => {
  if (!supabase) {
    return { attempted: 0, updated: 0 };
  }

  const limit = Number(process.env.IMAGE_FETCH_LIMIT ?? "8");
  if (limit <= 0) {
    return { attempted: 0, updated: 0 };
  }

  const { data } = await supabase
    .from("catalog_items")
    .select("item_type,item_key,name,brand,image_url")
    .is("image_url", null)
    .limit(limit);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = (data ?? []) as any[];
  let updated = 0;

  for (const item of items) {
    const result = await fetchImageForItem({
      name: item.name,
      brand: item.brand,
      itemType: item.item_type
    });

    if (!result) {
      continue;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("catalog_items") as any)
      .update({
        image_url: result.url,
        image_source: result.source,
        image_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .match({ item_type: item.item_type, item_key: item.item_key });

    updated += 1;
  }

  return { attempted: items.length, updated };
};

const upsertCandidates = async (
  supabase: ReturnType<typeof getSupabaseAdmin>,
  candidates: ShoeCandidate[]
) => {
  if (!supabase || !candidates.length) {
    return { upserted: 0 };
  }

  const rows = candidates.map((c) => ({
    item_key: c.itemKey,
    name: c.name,
    brand: c.brand,
    mention_count: c.mentionCount,
    mention_score: c.mentionScore,
    last_seen: c.lastSeen ?? null,
    last_title: c.lastTitle ?? null,
    last_url: c.lastUrl ?? null,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase.from("shoe_candidates").upsert(rows as any, {
    onConflict: "item_key",
  });

  if (error) {
    console.error("[pipeline] Failed to upsert candidates:", error.message);
    return { upserted: 0 };
  }

  return { upserted: rows.length };
};

export const runIngestionPipeline = async () => {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { ok: false, error: "Supabase admin client missing" };
  }

  // Dynamic aliases from shoe_models table, fallback to hardcoded list
  let shoeAliases = await generateShoeAliases();
  if (!shoeAliases.length) {
    console.warn("[pipeline] Dynamic aliases empty, using fallback");
    shoeAliases = fallbackShoeAliases;
  }
  console.log(`[pipeline] Tracking ${shoeAliases.length} shoes, ${attireAliases.length} attire items`);

  await ensureCatalogItems(supabase, shoeAliases);

  const subredditEnv = process.env.REDDIT_SUBREDDITS ?? "";
  const subreddits = subredditEnv
    ? subredditEnv.split(",").map((entry) => entry.trim()).filter(Boolean)
    : defaultSubreddits;

  const postsBySubreddit = await Promise.all(
    subreddits.map(async (subreddit) => ({
      subreddit,
      posts: await fetchRedditPosts(subreddit, 50)
    }))
  );

  const allPosts = postsBySubreddit.flatMap((entry) => entry.posts);
  const shoeMentions = aggregateMentions(allPosts, shoeAliases);
  const attireMentions = aggregateMentions(allPosts, attireAliases);

  const results = await upsertMentions(supabase, "reddit", [
    ...shoeMentions,
    ...attireMentions
  ]);

  // Discover new shoes from Reddit that aren't in the catalog yet
  const knownKeys = new Set(shoeAliases.map((a) => a.itemKey));
  const candidates = discoverNewShoes(allPosts, knownKeys);
  const candidateResult = await upsertCandidates(supabase, candidates);
  if (candidates.length) {
    console.log(`[pipeline] Discovered ${candidates.length} new shoe candidates (upserted ${candidateResult.upserted})`);
    for (const c of candidates.slice(0, 10)) {
      console.log(`  - ${c.name} (${c.mentionCount} mentions, score ${c.mentionScore.toFixed(1)})`);
    }
  }

  const imageResult = await fetchMissingImages(supabase);

  return {
    ok: true,
    subreddits,
    totalPosts: allPosts.length,
    totalMentions: results.updated,
    candidatesFound: candidates.length,
    candidatesUpserted: candidateResult.upserted,
    imagesChecked: imageResult.attempted,
    imagesUpdated: imageResult.updated
  };
};
