/**
 * Seed shoes from RunRepeat sitemap.
 * RunRepeat has comprehensive shoe reviews with structured URLs like:
 *   /ranking/best-nike-running-shoes
 *   /best-hoka-running-shoes
 *   /shoe-name-review (individual reviews)
 */
import { readJson, writeJson, fetchHtml, stripTags, normalizeWhitespace, extractJsonLd } from "./common.mjs";
import { fetchSitemapUrls } from "./sitemap-utils.mjs";
import { shoeCatalogConfig } from "./config.mjs";
import path from "path";

const DOMAIN = "runrepeat.com";

const slugify = (text) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

// Known brand names to look for in URLs/titles
const BRANDS = Object.keys(shoeCatalogConfig.brandDomains);
const BRAND_LOWER = BRANDS.map((b) => b.toLowerCase());

function detectBrand(text) {
  const lower = text.toLowerCase();
  for (let i = 0; i < BRANDS.length; i++) {
    if (lower.includes(BRAND_LOWER[i])) return BRANDS[i];
  }
  // Check additional brand name variants
  if (lower.includes("new-balance") || lower.includes("new balance")) return "New Balance";
  if (lower.includes("inov-8") || lower.includes("inov8")) return "Inov-8";
  return null;
}

function isShoeReviewUrl(url) {
  const lower = url.toLowerCase();
  // Skip non-review pages
  if (lower.includes("/ranking/") || lower.includes("/blog/") || lower.includes("/user/")) return false;
  if (lower.includes("/best-") && lower.includes("-shoes")) return false; // Category pages, not individual
  // Must end in a shoe-like slug
  return lower.includes("running") || lower.includes("shoe") || lower.includes("trainer");
}

function extractNameFromUrl(url) {
  try {
    const pathname = new URL(url).pathname;
    const slug = pathname.split("/").filter(Boolean).pop() || "";
    // RunRepeat URLs: /shoe-name-review or /shoe-name
    return slug
      .replace(/-review$/, "")
      .replace(/-running-shoe[s]?$/, "")
      .replace(/-shoe[s]?$/, "")
      .replace(/-/g, " ")
      .trim();
  } catch {
    return null;
  }
}

const run = async () => {
  console.log(`Fetching sitemap from ${DOMAIN}...`);
  const urls = await fetchSitemapUrls(DOMAIN, { maxSitemaps: 12, maxUrls: 10000 });
  console.log(`Found ${urls.length} URLs in sitemap`);

  const shoeUrls = urls.filter(isShoeReviewUrl);
  console.log(`Filtered to ${shoeUrls.length} potential shoe review URLs`);

  const seedsPath = path.resolve("data", "shoe-seeds.json");
  let existing = [];
  try {
    existing = await readJson(seedsPath);
  } catch {
    existing = [];
  }
  const existingKeys = new Set(existing.map((s) => s.item_key));

  const newSeeds = [];
  for (const url of shoeUrls) {
    const rawName = extractNameFromUrl(url);
    if (!rawName || rawName.length < 5) continue;

    const brand = detectBrand(rawName);
    if (!brand) continue;

    // Capitalize each word
    const name = rawName
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    // Ensure brand is properly part of the name
    const fullName = name.toLowerCase().startsWith(brand.toLowerCase())
      ? `${brand} ${name.slice(brand.length).trim()}`
      : `${brand} ${name}`;

    const itemKey = slugify(fullName);
    if (existingKeys.has(itemKey)) continue;

    newSeeds.push({
      item_key: itemKey,
      name: fullName,
      brand,
      release_date: null,
      release_year: null,
      source: "runrepeat"
    });
    existingKeys.add(itemKey);
  }

  console.log(`Found ${newSeeds.length} new shoes from RunRepeat`);

  if (newSeeds.length > 0) {
    const merged = [...existing, ...newSeeds];
    await writeJson(seedsPath, merged);
    console.log(`Total seeds: ${merged.length}`);
  }
};

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
