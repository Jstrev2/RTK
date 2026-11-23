/**
 * Keeps the live articles table in step with the guides on GitHub.
 *
 * content/guides.json on the main branch is the bundle of every guide in
 * content/rundown/*.md (built by scripts/rundown/check-guides.mjs --write).
 * The guide-writing routine adds guides, checks them, merges its own PR and
 * then calls /api/guides/sync; the daily cron runs the same sync as a
 * fallback. Nobody imports a guide by hand.
 *
 * The sync only adds and updates. It never unpublishes an article that is
 * missing from the bundle, so a truncated download cannot take pages down.
 */

export const GUIDES_URL = "https://raw.githubusercontent.com/Jstrev2/RTK/main/content/guides.json";

/**
 * raw.githubusercontent.com caches a branch path for about five minutes, so
 * a sync right after a merge would read the old bundle. Read it at main's
 * current commit instead (an immutable URL); fall back to the branch path if
 * GitHub's API is unavailable or rate-limited.
 */
async function bundleUrl(): Promise<string> {
  try {
    const res = await fetch("https://api.github.com/repos/Jstrev2/RTK/commits/main", {
      cache: "no-store",
      headers: { Accept: "application/vnd.github.sha", "User-Agent": "runnertoolkit-guide-sync" }
    });
    const sha = res.ok ? (await res.text()).trim() : "";
    if (/^[0-9a-f]{40}$/.test(sha)) return `https://raw.githubusercontent.com/Jstrev2/RTK/${sha}/content/guides.json`;
  } catch {
    // fall through
  }
  return GUIDES_URL;
}

// A routine run adds a handful of guides. Anything far beyond that is a bug.
const MAX_NEW_PER_RUN = 40;

export type BundledGuide = {
  slug: string;
  title: string;
  excerpt: string;
  tags: string[];
  author: string;
  published_at: string | null;
  body: string;
};

type GuideDb = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (table: string) => any;
};

export type GuideSyncResult = {
  ok: boolean;
  error?: string;
  dryRun: boolean;
  total: number;
  added: string[];
  updated: string[];
};

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function valid(guide: BundledGuide) {
  return (
    SLUG.test(guide.slug) &&
    typeof guide.title === "string" && guide.title.length > 10 &&
    typeof guide.excerpt === "string" && guide.excerpt.length > 20 &&
    typeof guide.body === "string" && guide.body.length > 1200 &&
    Array.isArray(guide.tags)
  );
}

export async function syncGuides(db: GuideDb, { dryRun = false } = {}): Promise<GuideSyncResult> {
  const result: GuideSyncResult = { ok: false, dryRun, total: 0, added: [], updated: [] };

  const response = await fetch(await bundleUrl(), { cache: "no-store" });
  if (!response.ok) return { ...result, error: `guide bundle fetch failed: HTTP ${response.status}` };

  let guides: BundledGuide[];
  try {
    const parsed = await response.json();
    guides = Array.isArray(parsed?.guides) ? parsed.guides : [];
  } catch {
    return { ...result, error: "guide bundle is not valid JSON" };
  }
  guides = guides.filter(valid);
  result.total = guides.length;

  const { data: existing, error: readError } = await db
    .from("articles")
    .select("id, slug, title, excerpt, body, tags, published_at");
  if (readError) return { ...result, error: `articles read failed: ${readError.message}` };

  const bySlug = new Map<string, { id: string; title: string; excerpt: string | null; body: string; tags: string[]; published_at: string | null }>(
    ((existing ?? []) as { id: string; slug: string; title: string; excerpt: string | null; body: string; tags: string[]; published_at: string | null }[]).map((row) => [row.slug, row])
  );

  const now = new Date().toISOString();
  const inserts: Record<string, unknown>[] = [];
  const updates: { id: string; row: Record<string, unknown>; slug: string }[] = [];

  for (const guide of guides) {
    const current = bySlug.get(guide.slug);
    const row = {
      slug: guide.slug,
      title: guide.title,
      excerpt: guide.excerpt,
      body: guide.body,
      tags: guide.tags,
      author: guide.author || "Runner Toolkit",
      is_published: true
    };
    if (!current) {
      inserts.push({ ...row, published_at: guide.published_at ?? now, updated_at: now });
      continue;
    }
    const changed =
      current.title !== guide.title ||
      (current.excerpt ?? "") !== guide.excerpt ||
      current.body !== guide.body ||
      (current.tags ?? []).join(",") !== guide.tags.join(",");
    if (changed) updates.push({ id: current.id, slug: guide.slug, row: { ...row, updated_at: now } });
  }

  if (inserts.length > MAX_NEW_PER_RUN) {
    return { ...result, error: `refusing to add ${inserts.length} guides in one run (limit ${MAX_NEW_PER_RUN})` };
  }

  result.added = inserts.map((row) => row.slug as string);
  result.updated = updates.map((update) => update.slug);
  if (dryRun) return { ...result, ok: true };

  if (inserts.length) {
    const { error } = await db.from("articles").insert(inserts);
    if (error) return { ...result, error: `insert failed: ${error.message}` };
  }
  for (const update of updates) {
    const { error } = await db.from("articles").update(update.row).eq("id", update.id);
    if (error) return { ...result, error: `update of ${update.slug} failed: ${error.message}` };
  }
  return { ...result, ok: true };
}
