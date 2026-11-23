/**
 * Finds, cleans and stores a product photo for each shoe.
 *
 * Sources, in order (each only where the site answers a plain, identified
 * request; a site that refuses scripted requests is skipped, never worked
 * around):
 *   1. Shopify stores: run specialty shops (Holabird Sports, Runner's Plus,
 *      Gazelle Sports, Luke's Locker) and the brand's own store where it runs
 *      on Shopify. Specialty shops keep earlier versions listed for months.
 *   2. Zappos search: brand and model name as Zappos lists them.
 *   3. The brand's own site, where its search page is server-rendered: the
 *      product page's og:image, checked against the page's own title.
 *
 * A photo is only accepted when the source's own model name equals ours after
 * normalising case, punctuation and a few filler words (see modelTokens), so a
 * "Clifton 11 GTX" or a "Ghost 17" is never filed as a "Ghost 16".
 *
 * Used by scripts/catalog/backfill-shoe-images.mjs (every shoe) and by the
 * daily cron (a few shoes a run). Keep this file free of path aliases and
 * non-erasable TypeScript so Node can run it directly.
 */

import sharp from "sharp";

export const SHOE_IMAGE_BUCKET = "site-images";
export const SHOE_IMAGE_WIDTH = 900;
export const SHOE_IMAGE_HEIGHT = 600;

export const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36 RunnerToolkit/1.0 (+https://runnertoolkit.com)";

export type ShoeForImage = {
  item_key: string;
  name: string;
  brand: string;
};

export type ImageSource = "shopify" | "zappos" | "brand";

export type ImageCandidate = {
  imageUrl: string;
  sourceUrl: string;
  source: ImageSource;
  sourceTitle: string;
  /** Other photos of the same product (other angles), tried when the main one is a close-up. */
  alternates?: string[];
};

export type FindOptions = {
  /** Which finders to try, in order; defaults to DEFAULT_SOURCES. */
  sources?: string[];
  /** Pause between requests to the same site, in ms. */
  delayMs?: number;
  /** Shared page cache so a brand page is read once per run. */
  cache?: Map<string, string | null>;
  /** Wall-clock deadline (epoch ms); sources past it are skipped. */
  deadline?: number;
  log?: (line: string) => void;
};

/* ------------------------------------------------------------------ */
/* Names                                                               */
/* ------------------------------------------------------------------ */

const BRAND_TOKENS: Record<string, string[][]> = {
  adidas: [["adidas"]],
  altra: [["altra"]],
  asics: [["asics"]],
  brooks: [["brooks"]],
  craft: [["craft"]],
  diadora: [["diadora"]],
  hoka: [["hoka"], ["hoka", "one", "one"]],
  mizuno: [["mizuno"]],
  "mount to coast": [["mount", "to", "coast"]],
  "new balance": [["new", "balance"]],
  nike: [["nike"]],
  on: [["on"], ["on", "running"]],
  puma: [["puma"]],
  reebok: [["reebok"]],
  salomon: [["salomon"]],
  saucony: [["saucony"]],
  skechers: [["skechers"], ["skechers", "performance"]],
  "topo athletic": [["topo", "athletic"], ["topo"]],
  tracksmith: [["tracksmith"]],
  "under armour": [["under", "armour"], ["ua"]]
};

// Words retailers add or drop without naming a different shoe.
const FILLER = new Set(["shoe", "shoes", "running", "road", "mens", "womens", "men", "women", "unisex", "the"]);

// Brand-specific words that come and go between listings ("Nike Air Zoom
// Pegasus 41" is the "Nike Pegasus 41").
const BRAND_FILLER: Record<string, string[]> = {
  nike: ["air", "zoom", "zoomx", "next"],
  "new balance": ["fresh", "foam", "fuelcell", "x", "v"],
  asics: ["gel"],
  adidas: ["adizero"],
  mizuno: ["wave"],
  "under armour": ["ua"]
};

const SYNONYMS: Record<string, string> = {
  supercomp: "sc",
  ii: "2",
  iii: "3",
  iv: "4"
};

export const decodeEntities = (text: string) =>
  text
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&apos;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");

const rawTokens = (text: string) =>
  decodeEntities(text)
    .toLowerCase()
    .replace(/[®™©]/g, "")
    .replace(/'s\b/g, "s")
    .replace(/(\d)\.0\b/g, "$1 0")
    .replace(/([a-z])(\d)/g, "$1 $2")
    .replace(/(\d)([a-z])/g, "$1 $2")
    .split(/[^a-z0-9%]+/)
    .map((token) => token.replace(/%/g, ""))
    .filter(Boolean);

/**
 * The tokens that identify a model within its brand: brand words stripped
 * from the front, filler dropped, order ignored by the caller.
 */
export function modelTokens(name: string, brand: string): string[] {
  let tokens = rawTokens(name);
  const variants = BRAND_TOKENS[brand.toLowerCase()] ?? [rawTokens(brand)];
  for (const variant of [...variants].sort((a, b) => b.length - a.length)) {
    if (variant.every((token, i) => tokens[i] === token)) {
      tokens = tokens.slice(variant.length);
      break;
    }
  }
  const brandFiller = new Set(BRAND_FILLER[brand.toLowerCase()] ?? []);
  return tokens
    .map((token) => (token in SYNONYMS ? SYNONYMS[token] : token))
    .filter((token) => token && !FILLER.has(token) && !brandFiller.has(token));
}

export const modelKey = (name: string, brand: string) => modelTokens(name, brand).sort().join(" ");

export const sameModel = (ours: ShoeForImage, theirName: string) => {
  const a = modelKey(ours.name, ours.brand);
  if (!a.length) return false;
  if (a === modelKey(theirName, ours.brand)) return true;
  // "Hyper Speed 4" and "Hyperspeed 4" are the same shoe: compare the words run together, in order.
  return modelTokens(ours.name, ours.brand).join("") === modelTokens(theirName, ours.brand).join("");
};

/* ------------------------------------------------------------------ */
/* Fetching                                                            */
/* ------------------------------------------------------------------ */

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function getText(url: string, opts: FindOptions): Promise<string | null> {
  const cache = opts.cache;
  if (cache?.has(url)) return cache.get(url) ?? null;
  if (opts.deadline && Date.now() > opts.deadline) return null;
  let text: string | null = null;
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "text/html,application/json;q=0.9,*/*;q=0.8" },
      redirect: "follow",
      signal: AbortSignal.timeout(20000)
    });
    if (response.ok) text = await response.text();
  } catch {
    text = null;
  }
  cache?.set(url, text);
  await sleep(opts.delayMs ?? 1200);
  return text;
}

/* ------------------------------------------------------------------ */
/* Zappos                                                              */
/* ------------------------------------------------------------------ */

type ZapposItem = {
  brandName?: string;
  productName?: string;
  productUrl?: string;
  productType?: string;
  txAttrFacet_Gender?: string[];
  imageMap?: Record<string, string>;
};

export function parseZapposList(html: string): ZapposItem[] {
  const start = html.indexOf('"list":[');
  if (start < 0) return [];
  let depth = 0;
  let end = start + 7;
  for (; end < html.length; end++) {
    const ch = html[end];
    if (ch === "[") depth++;
    else if (ch === "]") {
      depth--;
      if (!depth) break;
    }
  }
  try {
    return JSON.parse(html.slice(start + 7, end + 1).replace(/\\u002F/g, "/")) as ZapposItem[];
  } catch {
    return [];
  }
}

const brandMatches = (ours: string, theirs: string) => {
  const a = ours.toLowerCase().replace(/[^a-z]/g, "");
  const b = theirs.toLowerCase().replace(/[^a-z]/g, "");
  return a === b || b.startsWith(a) || a.startsWith(b);
};

// 6pm.com is Zappos's outlet: same listing format, and it keeps last season's versions.
const from6pm = (shoe: ShoeForImage, opts: FindOptions) => fromZappos(shoe, opts, "www.6pm.com");

async function fromZappos(shoe: ShoeForImage, opts: FindOptions, host = "www.zappos.com"): Promise<ImageCandidate | null> {
  const query = shoe.name.toLowerCase().startsWith(shoe.brand.toLowerCase()) ? shoe.name : `${shoe.brand} ${shoe.name}`;
  const html = await getText(`https://${host}/search?term=${encodeURIComponent(query)}`, opts);
  if (!html) return null;
  const items = parseZapposList(html).filter(
    (item) =>
      item.productName &&
      item.brandName &&
      brandMatches(shoe.brand, item.brandName) &&
      !/kid|toddler|infant/i.test(item.productName) &&
      sameModel(shoe, `${shoe.brand} ${decodeEntities(item.productName)}`)
  );
  if (!items.length) return null;
  const score = (item: ZapposItem) => ((item.txAttrFacet_Gender ?? []).includes("Men") ? 0 : 1);
  const item = items.sort((a, b) => score(a) - score(b))[0];
  const map = item.imageMap ?? {};
  const ids = [map.RGHT, map.MAIN, map.LEFT].filter((value): value is string => Boolean(value));
  const id = ids[0];
  if (!id) return null;
  return {
    alternates: ids.slice(1).map((other) => `https://m.media-amazon.com/images/I/${other}.jpg`),
    imageUrl: `https://m.media-amazon.com/images/I/${id}.jpg`,
    sourceUrl: `https://${host}${item.productUrl ?? ""}`,
    source: "zappos",
    sourceTitle: `${item.brandName} ${decodeEntities(item.productName ?? "")}`
  };
}

/* ------------------------------------------------------------------ */
/* Shopify stores: run specialty shops and brands' own stores          */
/* ------------------------------------------------------------------ */

// Run specialty shops on Shopify keep earlier versions listed long after the
// big retailers drop them. Brand stores are tried for their own brand only.
// Stores whose photos sit on plain white go first; Holabird shoots on grey
// and carries the most, so it is the last resort.
export const SHOPIFY_STORES = [
  "www.runnersplus.com",
  "www.gazellesports.com",
  "www.lukeslocker.com",
  "www.holabirdsports.com"
];

const BRAND_STORES: Record<string, string> = {
  reebok: "www.reebok.com",
  "mount to coast": "mounttocoast.com"
};

type ShopifyProduct = { title?: string; vendor?: string; url?: string; image?: string; available?: boolean };

/**
 * Turns a store's product title into the model name: drops the colourway,
 * width and gender ("Brooks Ghost 18 Men's Coconut/Pearl" -> "Brooks Ghost
 * 18"; "Women's Ghost 16 Running Shoe - Peacoat - Narrow (2A)" -> "Ghost 16").
 */
export function shopifyModelName(title: string): string {
  let text = decodeEntities(title).split(/\s+-\s+/)[0];
  text = text.replace(/\([^)]*\)/g, " ");
  const gender = /\b(men'?s|women'?s|mens|womens|unisex)\b/i;
  const match = text.match(gender);
  if (match && match.index !== undefined) {
    const before = text.slice(0, match.index);
    const after = text.slice(match.index + match[0].length);
    // A colourway follows the gender word ("Men's Black/Volt", "Men's
    // White"): drop it. "ASICS MEN'S GEL-NIMBUS 28" keeps the model after it.
    const words = before.trim().split(/\s+/).filter(Boolean).length;
    const colourway = words > 0 && (/\//.test(after) || /\d/.test(before) || (words >= 2 && !/\d/.test(after)));
    text = colourway ? before : `${before} ${after}`;
  }
  return text.replace(/\b(running|shoes?|sneakers?)\b/gi, " ").replace(/\s+/g, " ").trim();
}

const widthWord = /\b(wide|narrow|2e|4e|2a|extra)\b|\(d\)|\(2e\)/i;

async function fromShopify(shoe: ShoeForImage, opts: FindOptions): Promise<ImageCandidate | null> {
  const brandStore = BRAND_STORES[shoe.brand.toLowerCase()];
  const stores = brandStore ? [brandStore, ...SHOPIFY_STORES] : SHOPIFY_STORES;
  const query = shoe.name.toLowerCase().startsWith(shoe.brand.toLowerCase()) ? shoe.name : `${shoe.brand} ${shoe.name}`;
  for (const host of stores) {
    if (opts.deadline && Date.now() > opts.deadline) return null;
    const url =
      `https://${host}/search/suggest.json?q=${encodeURIComponent(query)}` +
      `&resources[type]=product&resources[limit]=10`;
    const text = await getText(url, opts);
    if (!text) continue;
    let products: ShopifyProduct[] = [];
    try {
      products = (JSON.parse(text) as { resources?: { results?: { products?: ShopifyProduct[] } } }).resources?.results?.products ?? [];
    } catch {
      continue;
    }
    const hits = products.filter(
      (product) =>
        product.title &&
        product.image &&
        (!product.vendor || brandMatches(shoe.brand, product.vendor) || host === brandStore) &&
        !/kid|toddler|youth|junior/i.test(product.title) &&
        sameModel(shoe, shopifyModelName(product.title))
    );
    if (!hits.length) continue;
    const score = (product: ShopifyProduct) =>
      (widthWord.test(product.title ?? "") ? 2 : 0) + (/women/i.test(product.title ?? "") ? 1 : 0);
    const product = hits.sort((a, b) => score(a) - score(b))[0];
    // Serve the photo from the store's own /cdn/shop path (the bare
    // cdn.shopify.com form answers 403 for some stores).
    const handlePath = (product.url ?? "").split("?")[0];
    const full = handlePath ? await getText(`https://${host}${handlePath}.js`, opts) : null;
    let alternates: string[] = [];
    try {
      alternates = ((full ? (JSON.parse(full) as { images?: string[] }).images : []) ?? []).slice(0, 6).map((image) => storeImageUrl(host, image));
    } catch {
      alternates = [];
    }
    return {
      alternates,
      imageUrl: storeImageUrl(host, product.image ?? ""),
      sourceUrl: `https://${host}${(product.url ?? "").split("?")[0]}`,
      source: host === brandStore ? "brand" : "shopify",
      sourceTitle: decodeEntities(product.title ?? "")
    };
  }
  return null;
}

function storeImageUrl(host: string, raw: string) {
  let image = raw.replace(/^\/\//, "https://");
  const asset = image.match(/\/(files|products)\/([^/?]+)(\?.*)?$/);
  if (asset) image = `https://${host}/cdn/shop/${asset[1]}/${asset[2]}${asset[3] ?? ""}`;
  return `${image}${image.includes("?") ? "&" : "?"}width=1400`;
}

/**
 * The same stores, found through their product sitemaps instead of their
 * search box: search ranks the newest version first and stops at ten
 * results, while the sitemap lists every product page the store still has.
 * Handles look like "brooks-glycerin-gts-22-mens-black-ebony"; the product's
 * own title is checked again before its photo is used.
 */
async function storeHandles(host: string, opts: FindOptions): Promise<string[]> {
  const key = `handles:${host}`;
  if (opts.cache?.has(key)) return JSON.parse(opts.cache.get(key) ?? "[]") as string[];
  const index = (await getText(`https://${host}/sitemap.xml`, opts)) ?? "";
  const maps = [...index.matchAll(/<loc>([^<]*sitemap_products[^<]*)<\/loc>/g)].map((m) => decodeEntities(m[1]));
  const handles: string[] = [];
  for (const map of maps) {
    const xml = (await getText(map, opts)) ?? "";
    for (const m of xml.matchAll(/<loc>[^<]*\/products\/([^<?]+)<\/loc>/g)) handles.push(m[1]);
  }
  opts.cache?.set(key, JSON.stringify(handles));
  return handles;
}

export function handleModelName(handle: string): string {
  let text = handle.replace(/^(mens|womens|unisex)-/, "");
  const cut = text.match(/^(.*?)-(mens|mnes|womens|unisex)(-|$)/);
  if (cut) text = cut[1];
  return text.replace(/-(narrow|wide|extra-wide|2e|4e|d|b|2a)$/, "").replace(/-/g, " ");
}

async function fromStoreSitemaps(shoe: ShoeForImage, opts: FindOptions): Promise<ImageCandidate | null> {
  const brandStore = BRAND_STORES[shoe.brand.toLowerCase()];
  const stores = brandStore ? [brandStore, ...SHOPIFY_STORES] : SHOPIFY_STORES;
  for (const host of stores) {
    if (opts.deadline && Date.now() > opts.deadline) return null;
    const handles = await storeHandles(host, opts);
    const matches = handles
      .filter((handle) => !/kid|toddler|youth|junior|-gtx|gore-tex/.test(handle))
      .filter((handle) => {
        const name = handleModelName(handle);
        return sameModel(shoe, name) || sameModel(shoe, `${shoe.brand} ${name}`);
      })
      .sort((a, b) => Number(/womens/.test(a)) - Number(/womens/.test(b)) || Number(/wide|narrow|-2e|-4e/.test(a)) - Number(/wide|narrow|-2e|-4e/.test(b)));
    for (const handle of matches.slice(0, 3)) {
      const text = await getText(`https://${host}/products/${handle}.js`, opts);
      if (!text) continue;
      let product: { title?: string; vendor?: string; featured_image?: string; images?: string[] };
      try {
        product = JSON.parse(text);
      } catch {
        continue;
      }
      const image = product.featured_image ?? product.images?.[0];
      if (!product.title || !image) continue;
      if (product.vendor && !brandMatches(shoe.brand, product.vendor) && host !== brandStore) continue;
      if (!sameModel(shoe, shopifyModelName(product.title)) && !sameModel(shoe, `${shoe.brand} ${shopifyModelName(product.title)}`)) continue;
      return {
        alternates: (product.images ?? []).slice(0, 6).map((other) => storeImageUrl(host, other)),
        imageUrl: storeImageUrl(host, image),
        sourceUrl: `https://${host}/products/${handle}`,
        source: host === brandStore ? "brand" : "shopify",
        sourceTitle: decodeEntities(product.title)
      };
    }
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Brand sites: their own search page, then the product page's photo   */
/* ------------------------------------------------------------------ */

// Brand sites that answer a plain request with server-rendered search results.
const BRAND_SEARCH: Record<string, (query: string) => string> = {
  saucony: (q) => `https://www.saucony.com/en/search?q=${q}`,
  salomon: (q) => `https://www.salomon.com/en-us/search?q=${q}`,
  diadora: (q) => `https://www.diadora.com/en/us/search?q=${q}`,
  craft: (q) => `https://www.craftsportswear.com/us/search?q=${q}`,
  skechers: (q) => `https://www.skechers.com/search/?q=${q}`,
  puma: (q) => `https://us.puma.com/us/en/search?q=${q}`,
  reebok: (q) => `https://www.reebok.com/search?q=${q}`,
  "topo athletic": (q) => `https://www.topoathletic.com/search?q=${q}&type=product`,
  nike: (q) => `https://www.nike.com/w?q=${q}`
};

const metaContent = (html: string, property: string) =>
  html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`, "i"))?.[1] ??
  html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`, "i"))?.[1];

async function fromBrandSite(shoe: ShoeForImage, opts: FindOptions): Promise<ImageCandidate | null> {
  const search = BRAND_SEARCH[shoe.brand.toLowerCase()];
  if (!search) return null;
  const model = shoe.name.replace(new RegExp(`^${shoe.brand}\\s+`, "i"), "");
  const searchUrl = search(encodeURIComponent(model));
  const html = await getText(searchUrl, opts);
  if (!html) return null;
  const origin = new URL(searchUrl).origin;
  // Product links whose text (or title/aria-label) names exactly this model.
  const links = new Map<string, string>();
  for (const m of html.matchAll(/<a\b([^>]*)>([\s\S]{0,400}?)<\/a>/gi)) {
    const attrs = m[1];
    const href = attrs.match(/href=["']([^"'#]+)["']/i)?.[1];
    if (!href || /\/search|\/cart|\/account|javascript:/i.test(href)) continue;
    const labels = [
      m[2].replace(/<[^>]+>/g, " "),
      attrs.match(/(?:title|aria-label)=["']([^"']+)["']/i)?.[1] ?? ""
    ].map((label) => decodeEntities(label).replace(/\s+/g, " ").trim());
    for (const label of labels) {
      if (!label || label.length > 120) continue;
      const name = shopifyModelName(label);
      if (sameModel(shoe, name) || sameModel(shoe, `${shoe.brand} ${name}`)) {
        links.set(new URL(href, origin).toString(), label);
        break;
      }
    }
  }
  for (const [url, label] of [...links.entries()].slice(0, 3)) {
    const page = await getText(url, opts);
    if (!page) continue;
    const title = decodeEntities(metaContent(page, "og:title") ?? page.match(/<title>([^<]+)/i)?.[1] ?? "");
    const image = metaContent(page, "og:image");
    if (!image) continue;
    const name = shopifyModelName(title.split(/\s[|]\s/)[0]);
    if (!sameModel(shoe, name) && !sameModel(shoe, `${shoe.brand} ${name}`)) continue;
    return { imageUrl: new URL(decodeEntities(image), url).toString(), sourceUrl: url, source: "brand", sourceTitle: title || label };
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Orchestration                                                       */
/* ------------------------------------------------------------------ */

const FINDERS: Record<"shopify" | "sitemaps" | "zappos" | "6pm" | "brand", (shoe: ShoeForImage, opts: FindOptions) => Promise<ImageCandidate | null>> = {
  shopify: fromShopify,
  sitemaps: fromStoreSitemaps,
  zappos: (shoe, opts) => fromZappos(shoe, opts),
  "6pm": from6pm,
  brand: fromBrandSite
};

export type FinderName = keyof typeof FINDERS;

/** Store search, every product page the stores still list, Zappos, then the brand's own site. */
export const DEFAULT_SOURCES: FinderName[] = ["shopify", "sitemaps", "zappos", "brand", "6pm"];

export async function findShoeImage(shoe: ShoeForImage, opts: FindOptions = {}): Promise<ImageCandidate | null> {
  for (const source of opts.sources ?? DEFAULT_SOURCES) {
    if (opts.deadline && Date.now() > opts.deadline) return null;
    const finder = FINDERS[source as FinderName];
    if (!finder) continue;
    const hit = await finder(shoe, opts);
    if (hit) {
      opts.log?.(`  ${shoe.item_key}: ${source} -> ${hit.sourceTitle}`);
      return hit;
    }
  }
  return null;
}

export type PhotoCheck = { onWhite: boolean; aspect: number; cutOff: boolean; sideView: boolean };

/**
 * Is this a clean side view? On white, the shoe trimmed out of the frame is
 * about 2 to 3 times as wide as it is tall and stops short of the left and
 * right edges. Close-ups (a heel, the outsole, laces) fail one of those.
 */
export async function checkPhoto(input: Buffer): Promise<PhotoCheck> {
  const flat = await sharp(input).rotate().flatten({ background: "#ffffff" }).toBuffer({ resolveWithObject: true });
  const { data, info } = await sharp(flat.data).resize(60, 60, { fit: "fill" }).raw().toBuffer({ resolveWithObject: true });
  const corner = (x: number, y: number) => {
    const i = (y * info.width + x) * info.channels;
    return Math.min(data[i], data[i + 1], data[i + 2]);
  };
  const onWhite = [corner(1, 1), corner(58, 1), corner(1, 58), corner(58, 58)].every((value) => value >= 236);
  if (!onWhite) {
    const aspect = flat.info.width / flat.info.height;
    return { onWhite, aspect, cutOff: false, sideView: false };
  }
  try {
    const trimmed = await sharp(flat.data).trim({ background: "#ffffff", threshold: 18 }).toBuffer({ resolveWithObject: true });
    const left = -(trimmed.info.trimOffsetLeft ?? 0);
    const right = flat.info.width - left - trimmed.info.width;
    const aspect = trimmed.info.width / trimmed.info.height;
    const cutOff = left <= 2 || right <= 2;
    return { onWhite, aspect, cutOff, sideView: !cutOff && aspect >= 1.6 && aspect <= 3.6 };
  } catch {
    return { onWhite, aspect: flat.info.width / flat.info.height, cutOff: true, sideView: false };
  }
}

/**
 * A fixed 3:2 card image so every card in the grid lines up. Photos shot on
 * white are trimmed and centred on white; photos shot on a coloured or grey
 * backdrop are cropped to fill the frame instead of floating in a box.
 */
export async function toCardWebp(input: Buffer): Promise<Buffer> {
  const flat = await sharp(input).rotate().flatten({ background: "#ffffff" }).toBuffer();
  const check = await checkPhoto(flat);

  if (!check.onWhite) {
    return sharp(flat)
      .resize(SHOE_IMAGE_WIDTH, SHOE_IMAGE_HEIGHT, { fit: "cover", position: "centre" })
      .webp({ quality: 82, effort: 5 })
      .toBuffer();
  }

  let trimmed: Buffer;
  try {
    trimmed = await sharp(flat).trim({ background: "#ffffff", threshold: 18 }).toBuffer();
  } catch {
    trimmed = flat;
  }
  const inner = await sharp(trimmed)
    .resize({ width: SHOE_IMAGE_WIDTH - 90, height: SHOE_IMAGE_HEIGHT - 70, fit: "inside" })
    .toBuffer({ resolveWithObject: true });
  const left = Math.round((SHOE_IMAGE_WIDTH - inner.info.width) / 2);
  const top = Math.round((SHOE_IMAGE_HEIGHT - inner.info.height) / 2);
  return sharp({
    create: { width: SHOE_IMAGE_WIDTH, height: SHOE_IMAGE_HEIGHT, channels: 3, background: "#ffffff" }
  })
    .composite([{ input: inner.data, left, top }])
    .webp({ quality: 82, effort: 5 })
    .toBuffer();
}

async function download(url: string, referer: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url, { headers: { "User-Agent": USER_AGENT, Referer: referer }, signal: AbortSignal.timeout(20000) });
    if (!response.ok || !(response.headers.get("content-type") ?? "").startsWith("image/")) return null;
    const buffer = Buffer.from(await response.arrayBuffer());
    return buffer.length >= 4000 ? buffer : null;
  } catch {
    return null;
  }
}

/**
 * The product's best photo: the first clean side view among the main photo
 * and its alternates; failing that, any photo on a plain backdrop; failing
 * that, the main photo.
 */
export async function pickPhoto(hit: ImageCandidate): Promise<{ buffer: Buffer; url: string; check: PhotoCheck } | null> {
  const urls = [hit.imageUrl, ...(hit.alternates ?? [])].filter((url, i, all) => url && all.indexOf(url) === i).slice(0, 7);
  let fallback: { buffer: Buffer; url: string; check: PhotoCheck } | null = null;
  for (const url of urls) {
    const buffer = await download(url, hit.sourceUrl);
    if (!buffer) continue;
    const check = await checkPhoto(buffer).catch(() => null);
    if (!check) continue;
    if (check.sideView) return { buffer, url, check };
    const rank = (c: PhotoCheck) => (c.onWhite ? 0 : !c.cutOff && c.aspect >= 1.2 ? 1 : 2);
    if (!fallback || rank(check) < rank(fallback.check)) fallback = { buffer, url, check };
    await sleep(250);
  }
  return fallback;
}

// The admin client is untyped here; narrow to the calls used.
type StorageDb = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (table: string) => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  storage: any;
};

export async function ensureImageBucket(supabase: StorageDb) {
  const { data } = await supabase.storage.getBucket(SHOE_IMAGE_BUCKET);
  if (data) return;
  const { error } = await supabase.storage.createBucket(SHOE_IMAGE_BUCKET, { public: true });
  if (error && !/exist/i.test(error.message)) throw new Error(`bucket: ${error.message}`);
}

export const shoeImageAlt = (shoe: ShoeForImage) => `${shoe.name} running shoe, side view`;

/** Downloads the photo, converts it and points the row at the stored copy. */
export async function storeShoeImage(supabase: StorageDb, shoe: ShoeForImage, hit: ImageCandidate) {
  const photo = await pickPhoto(hit);
  if (!photo) throw new Error("no photo could be downloaded");
  const webp = await toCardWebp(photo.buffer);

  const path = `shoes/${shoe.item_key}.webp`;
  const upload = await supabase.storage.from(SHOE_IMAGE_BUCKET).upload(path, webp, {
    contentType: "image/webp",
    upsert: true,
    cacheControl: "604800"
  });
  if (upload.error) throw new Error(`upload: ${upload.error.message}`);
  const publicUrl = supabase.storage.from(SHOE_IMAGE_BUCKET).getPublicUrl(path).data.publicUrl as string;
  const version = Date.now().toString(36);

  const { error } = await supabase
    .from("shoe_models")
    .update({
      image_url: `${publicUrl}?v=${version}`,
      image_path: `${SHOE_IMAGE_BUCKET}/${path}`,
      image_source: hit.sourceUrl,
      image_alt: shoeImageAlt(shoe)
    })
    .eq("item_key", shoe.item_key);
  if (error) throw new Error(`row update: ${error.message}`);
  return { path, bytes: webp.length, sideView: photo.check.sideView, photo: photo.url };
}

export type FillResult = {
  checked: number;
  stored: string[];
  missed: string[];
  errors: Array<{ item_key: string; error: string }>;
};

/**
 * The daily cron's step: give a few active shoes without a photo one.
 * Shoes are tried newest first; a shoe that keeps missing is retried on
 * later days (new retailer listings appear after launch).
 */
export async function fillMissingShoeImages(
  supabase: StorageDb,
  { limit = 3, budgetMs = 25000 }: { limit?: number; budgetMs?: number } = {}
): Promise<FillResult> {
  const result: FillResult = { checked: 0, stored: [], missed: [], errors: [] };
  const deadline = Date.now() + budgetMs;
  const { data, error } = await supabase
    .from("shoe_models")
    .select("item_key,name,brand,release_date")
    .eq("is_active", true)
    .is("image_url", null)
    .order("release_date", { ascending: false, nullsFirst: false })
    .limit(limit * 4);
  if (error) {
    result.errors.push({ item_key: "*", error: error.message });
    return result;
  }
  const shoes = (data ?? []) as Array<ShoeForImage & { release_date: string | null }>;
  if (!shoes.length) return result;
  await ensureImageBucket(supabase);
  const cache = new Map<string, string | null>();
  // Rotate through the queue so one shoe that never matches can't block it.
  const offset = new Date().getUTCDate() % shoes.length;
  const queue = [...shoes.slice(offset), ...shoes.slice(0, offset)].slice(0, limit);
  for (const shoe of queue) {
    if (Date.now() > deadline) break;
    result.checked++;
    try {
      const hit = await findShoeImage(shoe, {
        cache,
        delayMs: 400,
        deadline,
        // Store search and Zappos only: reading whole sitemaps is the backfill's job.
        sources: ["shopify", "zappos", "brand"]
      });
      if (!hit) {
        result.missed.push(shoe.item_key);
        continue;
      }
      await storeShoeImage(supabase, shoe, hit);
      result.stored.push(shoe.item_key);
    } catch (err) {
      result.errors.push({ item_key: shoe.item_key, error: (err as Error).message });
    }
  }
  return result;
}
