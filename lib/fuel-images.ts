/**
 * Official product photos for the fuel catalog.
 *
 * For every active fuel_gels row without image_url: take image_source (the
 * brand's own photo, set in data/fuel-catalog.json) or, failing that, the
 * og:image of the brand's product page; check it is a real product photo from
 * the brand's site or its store's CDN; trim the empty border; resize to fit
 * 800px; save as WebP in the public Supabase Storage bucket `site-images` at
 * fuel/<item_key>.webp (plus a 360px copy at fuel/thumb/<item_key>.webp for
 * grids, see thumbUrl); record image_url and image_source.
 *
 * Used by the daily cron (a few per run, so new products get photos within a
 * day) and by scripts/fuel-images.mjs (the backfill). Kept free of path
 * aliases so plain Node can run it.
 */

export const IMAGE_BUCKET = "site-images";
const MAX_BYTES = 15 * 1024 * 1024;
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

// Store CDNs brands serve their own product photos from.
const STORE_CDNS = [
  "cdn.shopify.com",
  "shopify.com",
  "cloudfront.net",
  "ctfassets.net",
  "scene7.com",
  "bigcommerce.com",
  "bigcommerce.net",
  "salsify.com",
  "squarespace-cdn.com",
  "imgix.net",
  "cloudinary.com",
  "akamaized.net",
  "wp.com",
  "amazonaws.com",
  "contentstack.io",
  "sanity.io",
  "storyblok.com",
  "demandware.static",
  "datocms-assets.com",
  "ferrara-sites.com",
  "dam."
];

type Db = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (table: string) => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  storage: any;
};

export type ImageFillResult = {
  ok: boolean;
  tried: number;
  filled: string[];
  failed: { key: string; reason: string }[];
  remaining: number;
};

const baseDomain = (host: string) => host.toLowerCase().replace(/^www\./, "").split(".").slice(-2).join(".");

/** True when the photo comes from the product page's own site or a store CDN. */
export const isOfficialSource = (imageUrl: string, productUrl?: string | null) => {
  try {
    const host = new URL(imageUrl).hostname.toLowerCase();
    if (productUrl && baseDomain(host) === baseDomain(new URL(productUrl).hostname)) return true;
    return STORE_CDNS.some((cdn) => host.includes(cdn));
  } catch {
    return false;
  }
};

const decode = (value: string) =>
  value.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x2F;/gi, "/").replace(/&#47;/g, "/");

/** The og:image (or twitter:image, or JSON-LD image) of a product page. */
export async function findPageImage(productUrl: string): Promise<string | null> {
  const response = await fetch(productUrl, {
    headers: { "user-agent": UA, accept: "text/html" },
    redirect: "follow",
    signal: AbortSignal.timeout(15000)
  });
  if (!response.ok) return null;
  const html = (await response.text()).slice(0, 600_000);
  const meta = (name: string) => {
    const a = new RegExp(`<meta[^>]+(?:property|name)=["']${name}["'][^>]*content=["']([^"']+)["']`, "i").exec(html);
    const b = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${name}["']`, "i").exec(html);
    return (a ?? b)?.[1];
  };
  let found = meta("og:image:secure_url") ?? meta("og:image") ?? meta("twitter:image");
  if (!found) {
    const ld = /"image"\s*:\s*(?:\[\s*)?"([^"]+)"/.exec(html);
    found = ld?.[1];
  }
  if (!found) return null;
  found = decode(found.trim());
  if (found.startsWith("//")) found = `https:${found}`;
  try {
    return new URL(found, response.url).toString();
  } catch {
    return null;
  }
}

/** The 360px grid copy of a stored photo. */
export const thumbUrl = (imageUrl: string) => imageUrl.replace("/site-images/fuel/", "/site-images/fuel/thumb/");

/** Download, trim, resize to fit 800px (and 360px) and encode as WebP. Throws with a reason. */
export async function toWebp(imageUrl: string): Promise<{ buffer: Buffer; thumb: Buffer; width: number; height: number }> {
  // Store CDNs answer a burst of requests with 403/429; back off and retry.
  let response: Response | null = null;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    if (attempt) await new Promise((resolve) => setTimeout(resolve, 2500 * attempt));
    response = await fetch(imageUrl, {
      headers: { "user-agent": UA, accept: "image/webp,image/png,image/jpeg,image/*" },
      redirect: "follow",
      signal: AbortSignal.timeout(20000)
    });
    if (response.status !== 403 && response.status !== 429) break;
  }
  if (!response || !response.ok) throw new Error(`image HTTP ${response?.status}`);
  const type = response.headers.get("content-type") ?? "";
  if (type && !type.startsWith("image/") && !type.includes("octet-stream")) throw new Error(`not an image (${type})`);
  const input = Buffer.from(await response.arrayBuffer());
  if (input.length > MAX_BYTES) throw new Error("image larger than 15 MB");
  if (input.length < 2000) throw new Error("image too small");

  const sharp = (await import("sharp")).default;
  const meta = await sharp(input).metadata();
  if (!meta.width || !meta.height) throw new Error("unreadable image");
  if (Math.max(meta.width, meta.height) < 300) throw new Error(`image only ${meta.width}x${meta.height}`);
  // A banner or a logo strip, not a product photo (checked before trimming: a packet can be tall and thin).
  const shape = meta.width / meta.height;
  if (shape > 3.2 || shape < 0.3) throw new Error(`odd shape ${meta.width}x${meta.height} (banner or logo?)`);

  // Trim the flat border most store photos carry, so packets fill their tile.
  let trimmed = input;
  try {
    trimmed = await sharp(input).trim({ threshold: 12 }).toBuffer();
  } catch {
    trimmed = input;
  }
  const tmeta = await sharp(trimmed).metadata();
  const source = tmeta.width && tmeta.height && Math.min(tmeta.width, tmeta.height) >= 120 ? trimmed : input;

  const { data, info } = await sharp(source)
    .resize({ width: 800, height: 800, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82, alphaQuality: 90, effort: 4 })
    .toBuffer({ resolveWithObject: true });
  const thumb = await sharp(data).resize({ width: 360, height: 360, fit: "inside", withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();
  return { buffer: data, thumb, width: info.width, height: info.height };
}

/** Make sure the public bucket exists. */
export async function ensureBucket(supabase: Db) {
  const { data } = await supabase.storage.getBucket(IMAGE_BUCKET);
  if (data) return;
  const { error } = await supabase.storage.createBucket(IMAGE_BUCKET, {
    public: true,
    fileSizeLimit: "5MB",
    allowedMimeTypes: ["image/webp", "image/png", "image/jpeg", "image/avif"]
  });
  if (error && !/already exists/i.test(error.message)) throw new Error(`bucket: ${error.message}`);
}

/** Fetch, convert and store one product's photo. Returns the public URL. */
export async function storeFuelImage(
  supabase: Db,
  row: { item_key: string; image_source?: string | null; product_url?: string | null }
): Promise<{ imageUrl: string; imageSource: string }> {
  let source = row.image_source || null;
  if (!source && row.product_url) source = await findPageImage(row.product_url);
  if (!source) throw new Error("no official image found");
  if (!isOfficialSource(source, row.product_url)) throw new Error(`not from the brand's site: ${new URL(source).hostname}`);
  const { buffer, thumb } = await toWebp(source);
  const path = `fuel/${row.item_key}.webp`;
  for (const [target, body] of [[`fuel/thumb/${row.item_key}.webp`, thumb], [path, buffer]] as const) {
    const { error } = await supabase.storage
      .from(IMAGE_BUCKET)
      .upload(target, body, { contentType: "image/webp", upsert: true, cacheControl: "31536000" });
    if (error) throw new Error(`upload: ${error.message}`);
  }
  const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path);
  // The version keeps browsers and the image optimizer from serving an old photo after a replace.
  const version = buffer.length.toString(36);
  return { imageUrl: `${data.publicUrl}?v=${version}`, imageSource: source };
}

/** Fill photos for active products that have none. `limit` keeps the cron inside its time budget. */
export async function fillFuelImages(
  supabase: Db,
  { limit = 8, keys, delayMs = 400 }: { limit?: number; keys?: string[]; delayMs?: number } = {}
): Promise<ImageFillResult> {
  const result: ImageFillResult = { ok: true, tried: 0, filled: [], failed: [], remaining: 0 };
  let query = supabase
    .from("fuel_gels")
    .select("item_key, image_source, product_url")
    .eq("is_active", true)
    .order("item_key");
  query = keys?.length ? query.in("item_key", keys) : query.is("image_url", null);
  const { data, error } = await query;
  if (error) return { ...result, ok: false, failed: [{ key: "*", reason: error.message }] };
  const rows = (data ?? []) as { item_key: string; image_source: string | null; product_url: string | null }[];
  if (!rows.length) return result;
  await ensureBucket(supabase);

  for (const [index, row] of rows.slice(0, limit).entries()) {
    if (index && delayMs) await new Promise((resolve) => setTimeout(resolve, delayMs));
    result.tried += 1;
    try {
      const { imageUrl, imageSource } = await storeFuelImage(supabase, row);
      const { error: updateError } = await supabase
        .from("fuel_gels")
        .update({ image_url: imageUrl, image_source: imageSource, updated_at: new Date().toISOString() })
        .eq("item_key", row.item_key);
      if (updateError) throw new Error(updateError.message);
      result.filled.push(row.item_key);
    } catch (err) {
      result.failed.push({ key: row.item_key, reason: (err as Error).message });
    }
  }
  result.remaining = Math.max(0, rows.length - limit);
  return result;
}
