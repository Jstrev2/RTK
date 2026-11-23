/**
 * Keeps the live fuel_gels table in step with data/fuel-catalog.json on GitHub.
 *
 * The catalog file on main is the source of truth for every product's name,
 * type, nutrition, flavors, price and official page. The monthly fuel audit
 * routine (scripts/catalog/ROUTINE-fuel.md) edits it through a PR that must
 * pass scripts/catalog/check-fuel.mjs; this sync, run by the daily cron,
 * applies the merged file to the database. A product that leaves the file is
 * deactivated, never deleted, so its page can still redirect.
 *
 * Images are not written here: lib/fuel-images.ts fills image_url for any
 * active product without one, right after the sync.
 *
 * Idempotent: only rows that differ are written.
 */

export const FUEL_CATALOG_URL =
  "https://raw.githubusercontent.com/Jstrev2/RTK/main/data/fuel-catalog.json";

export const FUEL_TYPES = ["gel", "chew", "drink", "bar", "electrolyte"] as const;
export type FuelType = (typeof FUEL_TYPES)[number];

/** Columns the catalog file owns. image_url is owned by lib/fuel-images.ts. */
const CATALOG_FIELDS = [
  "brand",
  "name",
  "product_type",
  "serving_size",
  "carbs_g",
  "caffeine_mg",
  "sodium_mg",
  "calories",
  "flavors",
  "price_usd",
  "product_url",
  "notes",
  "release_note"
] as const;

// Guardrails: a bad audit or a truncated download must not gut the catalog.
// Past these limits the sync stops and changes nothing. The same numbers are
// in scripts/catalog/check-fuel.mjs, which the routine runs before merging.
export const FUEL_LIMITS = { minRows: 80, maxRemoved: 12, maxAdded: 40 };

type Row = Record<string, unknown>;

// The admin client has no generated table types, so its query builder is untyped.
type CatalogDb = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (table: string) => any;
};

export type FuelSyncResult = {
  ok: boolean;
  dryRun: boolean;
  error?: string;
  fileRows: number;
  activeBefore: number;
  added: string[];
  updated: string[];
  reactivated: string[];
  deactivated: string[];
  newImages: string[];
};

const same = (a: unknown, b: unknown) => {
  const norm = (v: unknown) => (typeof v === "string" && /^-?\d+(\.\d+)?$/.test(v) ? Number(v) : v ?? null);
  return JSON.stringify(norm(a)) === JSON.stringify(norm(b));
};

const isNum = (v: unknown) => typeof v === "number" && Number.isFinite(v);

/** Problems with the catalog file, or [] when it is fine. Mirrors check-fuel.mjs. */
export function validateFuelCatalog(rows: unknown, minRows = FUEL_LIMITS.minRows): string[] {
  const problems: string[] = [];
  if (!Array.isArray(rows)) return ["catalog file is not an array"];
  if (rows.length < minRows) problems.push(`catalog has only ${rows.length} rows (minimum ${minRows})`);
  const seen = new Set<string>();
  for (const row of rows as Row[]) {
    const key = row?.item_key;
    if (typeof key !== "string" || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(key)) {
      problems.push(`bad item_key: ${String(key)}`);
      continue;
    }
    if (seen.has(key)) problems.push(`duplicate item_key: ${key}`);
    seen.add(key);
    for (const field of ["brand", "name", "serving_size"]) {
      if (typeof row[field] !== "string" || !(row[field] as string).trim()) problems.push(`${key}: missing ${field}`);
    }
    if (typeof row.name === "string" && row.name.length > 70) problems.push(`${key}: name longer than 70 characters`);
    if (!FUEL_TYPES.includes(row.product_type as FuelType)) problems.push(`${key}: product_type must be one of ${FUEL_TYPES.join(", ")}`);
    for (const field of ["carbs_g", "caffeine_mg", "sodium_mg", "calories"]) {
      if (!isNum(row[field])) problems.push(`${key}: ${field} must be a number`);
    }
    const carbs = Number(row.carbs_g);
    const kcal = Number(row.calories);
    if (carbs < 0 || carbs > 150) problems.push(`${key}: carbs_g ${carbs} out of range`);
    if (Number(row.caffeine_mg) < 0 || Number(row.caffeine_mg) > 300) problems.push(`${key}: caffeine_mg out of range`);
    if (Number(row.sodium_mg) < 0 || Number(row.sodium_mg) > 2000) problems.push(`${key}: sodium_mg out of range`);
    if (kcal < 0 || kcal > 600) problems.push(`${key}: calories out of range`);
    // Carbs carry 4 kcal a gram; a label can't have fewer calories than its carbs allow (some slack for rounding and allulose-type sugars).
    if (carbs >= 10 && kcal < carbs * 2.5) problems.push(`${key}: ${kcal} kcal is too few for ${carbs}g carbs`);
    if (row.product_type !== "electrolyte" && carbs < 10) problems.push(`${key}: fuel with under 10g carbs should be product_type electrolyte`);
    if (row.price_usd != null && (!isNum(row.price_usd) || Number(row.price_usd) <= 0 || Number(row.price_usd) > 25)) {
      problems.push(`${key}: price_usd must be a per-serving price in dollars`);
    }
    if (!Array.isArray(row.flavors) || row.flavors.some((f) => typeof f !== "string")) problems.push(`${key}: flavors must be a list of names`);
    if (typeof row.product_url !== "string" || !/^https:\/\//.test(row.product_url)) problems.push(`${key}: product_url must be an https link`);
    if (row.image_source != null && (typeof row.image_source !== "string" || !/^https:\/\//.test(row.image_source))) {
      problems.push(`${key}: image_source must be an https link or null`);
    }
    if (row.notes != null && (typeof row.notes !== "string" || row.notes.length > 200)) problems.push(`${key}: notes must be one short sentence`);
  }
  return problems;
}

export async function syncFuelCatalog(
  supabase: CatalogDb,
  {
    dryRun = false,
    file: given,
    limits = FUEL_LIMITS
  }: { dryRun?: boolean; file?: Row[]; limits?: typeof FUEL_LIMITS } = {}
): Promise<FuelSyncResult> {
  const result: FuelSyncResult = {
    ok: false,
    dryRun,
    fileRows: 0,
    activeBefore: 0,
    added: [],
    updated: [],
    reactivated: [],
    deactivated: [],
    newImages: []
  };
  const fail = (error: string) => ({ ...result, error });

  let file = given;
  if (!file) {
    const response = await fetch(FUEL_CATALOG_URL, { cache: "no-store" });
    if (!response.ok) return fail(`catalog fetch failed: HTTP ${response.status}`);
    try {
      file = (await response.json()) as Row[];
    } catch {
      return fail("catalog file is not valid JSON");
    }
  }
  const problems = validateFuelCatalog(file, limits.minRows);
  if (problems.length) return fail(problems.slice(0, 5).join("; "));
  result.fileRows = file.length;

  const { data, error } = await supabase
    .from("fuel_gels")
    .select(["item_key", "is_active", "image_source", ...CATALOG_FIELDS].join(","))
    .limit(2000);
  if (error) return fail(`database read failed: ${error.message}`);
  const dbRows = (data ?? []) as Row[];
  if (dbRows.length >= 1000) return fail("fuel_gels has 1,000+ rows: sync needs pagination");

  const db = new Map(dbRows.map((row) => [row.item_key as string, row]));
  const fileKeys = new Set(file.map((row) => row.item_key as string));
  result.activeBefore = dbRows.filter((row) => row.is_active).length;

  const now = new Date().toISOString();
  const toWrite: Row[] = [];
  for (const row of file) {
    const key = row.item_key as string;
    const existing = db.get(key);
    // A new official photo in the file replaces the stored one on the next image fill.
    const newImage =
      typeof row.image_source === "string" && row.image_source && (!existing || !same(row.image_source, existing.image_source));
    const changed = !existing || newImage || CATALOG_FIELDS.some((field) => !same(row[field], existing[field]));
    if (!existing) result.added.push(key);
    else if (!existing.is_active) result.reactivated.push(key);
    else if (changed) result.updated.push(key);
    else continue;

    const write: Row = { item_key: key, is_active: true, updated_at: now };
    for (const field of CATALOG_FIELDS) write[field] = row[field] ?? null;
    if (newImage) {
      write.image_source = row.image_source;
      write.image_url = null;
      result.newImages.push(key);
    }
    toWrite.push(write);
  }
  result.deactivated = dbRows
    .filter((row) => row.is_active && !fileKeys.has(row.item_key as string))
    .map((row) => row.item_key as string);

  if (result.deactivated.length > limits.maxRemoved) {
    return fail(`refusing to deactivate ${result.deactivated.length} products in one sync (limit ${limits.maxRemoved})`);
  }
  if (result.added.length > limits.maxAdded) {
    return fail(`refusing to add ${result.added.length} products in one sync (limit ${limits.maxAdded})`);
  }
  if (dryRun) return { ...result, ok: true };

  // Rows without a new image must not send image columns (they would wipe stored photos).
  const groups = [toWrite.filter((row) => "image_url" in row), toWrite.filter((row) => !("image_url" in row))];
  for (const group of groups) {
    for (let i = 0; i < group.length; i += 100) {
      const { error: upsertError } = await supabase
        .from("fuel_gels")
        .upsert(group.slice(i, i + 100), { onConflict: "item_key" });
      if (upsertError) return fail(`upsert failed: ${upsertError.message}`);
    }
  }
  if (result.deactivated.length) {
    const { error: deactivateError } = await supabase
      .from("fuel_gels")
      .update({ is_active: false, updated_at: now })
      .in("item_key", result.deactivated);
    if (deactivateError) return fail(`deactivate failed: ${deactivateError.message}`);
  }
  return { ...result, ok: true };
}
