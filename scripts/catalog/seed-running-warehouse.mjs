/**
 * Seed shoes from Running Warehouse sitemap.
 * Finds running shoe product URLs and extracts shoe name + brand.
 */
import { readJson, writeJson, sleep } from "./common.mjs";
import { fetchSitemapUrls } from "./sitemap-utils.mjs";
import { shoeCatalogConfig } from "./config.mjs";
import path from "path";

const DOMAIN = "www.runningwarehouse.com";

const slugify = (text) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

// Map URL path segments to brands
const BRAND_PATTERNS = {};
for (const brand of Object.keys(shoeCatalogConfig.brandDomains)) {
  BRAND_PATTERNS[brand.toLowerCase().replace(/[\s-]+/g, "")] = brand;
}

function extractBrandFromUrl(url) {
  const lower = url.toLowerCase();
  for (const [pattern, brand] of Object.entries(BRAND_PATTERNS)) {
    if (lower.includes(pattern)) return brand;
  }
  return null;
}

function extractShoeNameFromUrl(url) {
  try {
    const pathname = new URL(url).pathname;
    // Running Warehouse URLs tend to be like /catpage-BRANDMODEL.html or /ShoeModel-Main.html
    const segment = pathname.split("/").pop() || "";
    const cleaned = segment
      .replace(/\.html?$/i, "")
      .replace(/-Main$/i, "")
      .replace(/-Shoe$/i, "")
      .replace(/^catpage-/i, "");
    return cleaned;
  } catch {
    return null;
  }
}

function isRunningShoeUrl(url) {
  const lower = url.toLowerCase();
  // Running Warehouse shoe product URLs usually contain brand names and running terms
  if (lower.includes("/cart") || lower.includes("/account") || lower.includes("/blog")) return false;
  if (lower.includes("/review") && !lower.includes("/shoe")) return false;
  // Must look like a product page
  return (
    lower.includes("shoe") ||
    lower.includes("running") ||
    lower.includes("trainer") ||
    lower.includes("racer")
  );
}

const run = async () => {
  console.log(`Fetching sitemap from ${DOMAIN}...`);
  const urls = await fetchSitemapUrls(DOMAIN, { maxSitemaps: 10, maxUrls: 8000 });
  console.log(`Found ${urls.length} URLs in sitemap`);

  // Filter to running shoe product pages
  const shoeUrls = urls.filter(isRunningShoeUrl);
  console.log(`Filtered to ${shoeUrls.length} potential shoe URLs`);

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
    const brand = extractBrandFromUrl(url);
    if (!brand) continue;

    const rawName = extractShoeNameFromUrl(url);
    if (!rawName) continue;

    // Build a human-readable name: "Brand ModelName"
    const modelParts = rawName
      .replace(/([a-z])([A-Z])/g, "$1 $2") // CamelCase → spaces
      .replace(/[-_]+/g, " ")
      .trim();

    const name = `${brand} ${modelParts}`;
    const itemKey = slugify(name);

    if (existingKeys.has(itemKey)) continue;

    newSeeds.push({
      item_key: itemKey,
      name,
      brand,
      release_date: null,
      release_year: null,
      source: "running-warehouse"
    });
    existingKeys.add(itemKey);
  }

  console.log(`Found ${newSeeds.length} new shoes from Running Warehouse`);

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
