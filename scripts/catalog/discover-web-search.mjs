/**
 * discover-web-search.mjs
 * Uses Running Warehouse, brand sites, and retailer search pages to find product URLs
 * for shoes that sitemap discovery missed.
 */
import "./common.mjs";
import path from "path";
import { readJson, writeJson, fetchHtml, sleep } from "./common.mjs";
import { shoeCatalogConfig } from "./config.mjs";

const getArgValue = (flag) => {
  const idx = process.argv.findIndex((arg) => arg === flag);
  if (idx === -1) return null;
  return process.argv[idx + 1] ?? null;
};

const slugify = (value) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

/**
 * Try known URL patterns for each brand's website
 */
const brandUrlPatterns = {
  ASICS: (name) => {
    // asics.com/us/en-us/{slug}/p/{sku} - but we don't know SKU
    // Try running warehouse instead
    const slug = slugify(name.replace(/^asics\s+/i, ""));
    return [
      `https://www.runningwarehouse.com/searchresults.html?search=${encodeURIComponent(name)}`,
      `https://www.asics.com/us/en-us/search?q=${encodeURIComponent(name.replace(/^asics\s+/i, ""))}`,
    ];
  },
  Nike: (name) => {
    const slug = slugify(name.replace(/^nike\s+/i, ""));
    return [
      `https://www.runningwarehouse.com/searchresults.html?search=${encodeURIComponent(name)}`,
      `https://www.nike.com/w?q=${encodeURIComponent(name.replace(/^nike\s+/i, ""))}`,
    ];
  },
  Brooks: (name) => {
    const slug = slugify(name.replace(/^brooks\s+/i, ""));
    return [
      `https://www.runningwarehouse.com/searchresults.html?search=${encodeURIComponent(name)}`,
      `https://www.brooksrunning.com/en_us/search?q=${encodeURIComponent(name.replace(/^brooks\s+/i, ""))}`,
    ];
  },
  Hoka: (name) => {
    const slug = slugify(name.replace(/^hoka\s+/i, ""));
    return [
      `https://www.runningwarehouse.com/searchresults.html?search=${encodeURIComponent(name)}`,
      `https://www.hoka.com/en/us/search?q=${encodeURIComponent(name.replace(/^hoka\s+/i, ""))}`,
    ];
  },
  Adidas: (name) => [
    `https://www.runningwarehouse.com/searchresults.html?search=${encodeURIComponent(name)}`,
  ],
  Saucony: (name) => [
    `https://www.runningwarehouse.com/searchresults.html?search=${encodeURIComponent(name)}`,
  ],
  On: (name) => [
    `https://www.runningwarehouse.com/searchresults.html?search=${encodeURIComponent(name)}`,
  ],
  "New Balance": (name) => [
    `https://www.runningwarehouse.com/searchresults.html?search=${encodeURIComponent(name)}`,
  ],
};

/**
 * Try to extract a product URL from Running Warehouse search results
 */
const extractRWProductUrl = (html, shoeName) => {
  const slug = slugify(shoeName);
  const slugParts = slug.split("-").filter(p => p.length >= 3);

  // Look for product links in search results
  const linkPattern = /href="(\/[^"]+\.html)"/gi;
  let match;
  const candidates = [];

  while ((match = linkPattern.exec(html)) !== null) {
    const href = match[1];
    if (href.includes("searchresult") || href.includes("search.html")) continue;

    const lower = href.toLowerCase();
    let score = 0;
    for (const part of slugParts) {
      if (lower.includes(part)) score += 5;
    }
    if (score >= 10) {
      candidates.push({ url: `https://www.runningwarehouse.com${href}`, score });
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates[0]?.url ?? null;
};

const run = async () => {
  const inputPath = getArgValue("--input") || path.resolve("data", "skeleton-discovery.json");
  const outputPath = getArgValue("--output") || path.resolve("data", "skeleton-discovery.json");

  const entries = await readJson(inputPath);
  const missing = entries.filter(e => !e.selected_url);

  console.log(`${missing.length} shoes need URLs. Searching...`);

  for (const entry of missing) {
    const searchUrl = `https://www.runningwarehouse.com/searchresults.html?search=${encodeURIComponent(entry.name)}`;

    try {
      const html = await fetchHtml(searchUrl, { timeoutMs: 15000 });
      const productUrl = extractRWProductUrl(html, entry.name);

      if (productUrl) {
        entry.selected_url = productUrl;
        entry.candidates = [{ link: productUrl, source: "runningwarehouse.com" }];
        console.log(`  Found: ${entry.name} → ${productUrl}`);
      } else {
        console.log(`  Miss:  ${entry.name} (no matching product on RW)`);
      }
    } catch (err) {
      console.log(`  Error: ${entry.name} - ${err.message}`);
    }

    await sleep(800);
  }

  const found = entries.filter(e => e.selected_url).length;
  console.log(`\nTotal: ${found}/${entries.length} have URLs`);

  await writeJson(outputPath, entries);
};

run().catch(err => { console.error(err); process.exit(1); });
