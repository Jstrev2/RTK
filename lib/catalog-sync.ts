/**
 * Keeps the live shoe_models table in step with the catalog file on GitHub.
 *
 * data/shoe-models-authored.json on the main branch is the source of truth.
 * The weekly audit routine (scripts/catalog/ROUTINE-shoes.md) opens a PR against it, checks its own change
 * with scripts/catalog/check-audit.mjs and merges it, and this sync (run by
 * the daily cron) applies the result to the database. Nobody has to run an
 * import by hand.
 *
 * The sync is idempotent: it only writes rows that differ, so running it
 * twice changes nothing and updated_at stays honest for the sitemap.
 */

export const CATALOG_URL =
  "https://raw.githubusercontent.com/Jstrev2/RTK/main/data/shoe-models-authored.json";

/**
 * Columns the catalog file owns. Anything else on a row (images, retailer
 * links) is never touched by the sync.
 */
const CATALOG_FIELDS = [
  "name",
  "brand",
  "price",
  "usage_types",
  "foot_strike",
  "cadence",
  "toe_box",
  "cushion",
  "stability",
  "surfaces",
  "weight_range",
  "stack",
  "drop",
  "weight_mens",
  "weight_womens",
  "description",
  "pros",
  "cons",
  "popularity",
  "release_date",
  "release_year",
  "product_url"
] as const;

// Guardrails: a bad audit (or a truncated download) must not be able to gut
// the catalog. Past these limits the sync stops and changes nothing.
const MIN_ROWS = 250;
const MAX_REMOVED = 8;
const MAX_ADDED = 40;

type Row = Record<string, unknown>;

// The admin client is created without generated table types, so its query
// builder is untyped. Narrow to the three calls the sync actually makes.
type CatalogDb = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (table: string) => any;
};

export type CatalogSyncResult = {
  ok: boolean;
  dryRun: boolean;
  error?: string;
  fileRows: number;
  activeBefore: number;
  added: string[];
  updated: string[];
  reactivated: string[];
  deactivated: string[];
};

const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

function validate(rows: unknown): string | null {
  if (!Array.isArray(rows)) return "catalog file is not an array";
  if (rows.length < MIN_ROWS) return `catalog has only ${rows.length} rows (minimum ${MIN_ROWS})`;
  const seen = new Set<string>();
  for (const row of rows as Row[]) {
    const key = row?.item_key;
    if (typeof key !== "string" || !/^[a-z0-9-]+$/.test(key)) return `bad item_key: ${String(key)}`;
    if (seen.has(key)) return `duplicate item_key: ${key}`;
    seen.add(key);
    if (typeof row.name !== "string" || !row.name.trim()) return `${key}: missing name`;
    if (typeof row.brand !== "string" || !row.brand.trim()) return `${key}: missing brand`;
    if (row.release_date != null && !/^\d{4}-\d{2}-\d{2}$/.test(String(row.release_date))) {
      return `${key}: bad release_date`;
    }
  }
  return null;
}

export async function syncShoeCatalog(
  supabase: CatalogDb,
  { dryRun = false, rows }: { dryRun?: boolean; rows?: unknown } = {}
): Promise<CatalogSyncResult> {
  const result: CatalogSyncResult = {
    ok: false,
    dryRun,
    fileRows: 0,
    activeBefore: 0,
    added: [],
    updated: [],
    reactivated: [],
    deactivated: []
  };
  const fail = (error: string) => ({ ...result, error });

  // `rows` lets scripts/catalog/sync-local.mjs apply a local copy of the
  // file (same checks and limits); the cron always reads GitHub's.
  let file: Row[];
  if (rows !== undefined) file = rows as Row[];
  else {
    const response = await fetch(CATALOG_URL, { cache: "no-store" });
    if (!response.ok) return fail(`catalog fetch failed: HTTP ${response.status}`);
    try {
      file = (await response.json()) as Row[];
    } catch {
      return fail("catalog file is not valid JSON");
    }
  }
  const invalid = validate(file);
  if (invalid) return fail(invalid);
  result.fileRows = file.length;

  const { data, error } = await supabase
    .from("shoe_models")
    .select(["item_key", "is_active", ...CATALOG_FIELDS].join(","))
    .limit(5000);
  if (error) return fail(`database read failed: ${error.message}`);
  const dbRows = (data ?? []) as Row[];
  // PostgREST caps a response at 1,000 rows; a full page means rows are missing
  // and "not in the database" can no longer be trusted.
  if (dbRows.length >= 1000) return fail("shoe_models has 1,000+ rows: sync needs pagination");

  const db = new Map(dbRows.map((row) => [row.item_key as string, row]));
  const fileKeys = new Set(file.map((row) => row.item_key as string));
  result.activeBefore = dbRows.filter((row) => row.is_active).length;

  const toWrite: Row[] = [];
  for (const row of file) {
    const key = row.item_key as string;
    const existing = db.get(key);
    const changed = !existing || CATALOG_FIELDS.some((field) => !same(row[field], existing[field]));
    if (!existing) result.added.push(key);
    else if (!existing.is_active) result.reactivated.push(key);
    else if (changed) result.updated.push(key);
    else continue;

    const write: Row = { item_key: key, is_active: true, updated_at: new Date().toISOString() };
    for (const field of CATALOG_FIELDS) write[field] = row[field] ?? null;
    toWrite.push(write);
  }
  result.deactivated = dbRows
    .filter((row) => row.is_active && !fileKeys.has(row.item_key as string))
    .map((row) => row.item_key as string);

  if (result.deactivated.length > MAX_REMOVED) {
    return fail(`refusing to deactivate ${result.deactivated.length} shoes in one sync (limit ${MAX_REMOVED})`);
  }
  if (result.added.length > MAX_ADDED) {
    return fail(`refusing to add ${result.added.length} shoes in one sync (limit ${MAX_ADDED})`);
  }

  if (dryRun) return { ...result, ok: true };

  for (let i = 0; i < toWrite.length; i += 100) {
    const { error: upsertError } = await supabase
      .from("shoe_models")
      .upsert(toWrite.slice(i, i + 100), { onConflict: "item_key" });
    if (upsertError) return fail(`upsert failed: ${upsertError.message}`);
  }
  if (result.deactivated.length) {
    const { error: deactivateError } = await supabase
      .from("shoe_models")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .in("item_key", result.deactivated);
    if (deactivateError) return fail(`deactivate failed: ${deactivateError.message}`);
  }

  return { ...result, ok: true };
}
