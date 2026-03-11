import "./common.mjs";
import path from "path";
import { readJson, writeJson, sleep, getDomain } from "./common.mjs";
import { fetchSitemapUrls } from "./sitemap-utils.mjs";
import { shoeCatalogConfig } from "./config.mjs";

const getArgValue = (flag) => {
  const idx = process.argv.findIndex((arg) => arg === flag);
  if (idx === -1) {
    return null;
  }
  return process.argv[idx + 1] ?? null;
};

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const scoreUrl = (url, slug) => {
  const path = url.toLowerCase();
  const slugParts = slug.split("-").filter(Boolean);
  let score = 0;
  if (path.includes(slug)) {
    score += 50;
  }
  for (const part of slugParts) {
    if (part.length >= 3 && path.includes(part)) {
      score += 5;
    }
  }
  if (path.includes("running")) score += 2;
  if (path.includes("shoe")) score += 2;
  return score;
};

const pickBest = (urls, slug) => {
  let best = null;
  let bestScore = -1;
  for (const url of urls) {
    const score = scoreUrl(url, slug);
    if (score > bestScore) {
      bestScore = score;
      best = url;
    }
  }
  return { best, bestScore };
};

const run = async () => {
  const inputPath =
    getArgValue("--input") || path.resolve("data", "shoe-seeds.json");
  const outputPath =
    getArgValue("--output") || path.resolve("data", "shoe-discovery.json");
  const delayMs = Number(getArgValue("--delay") || "600");
  const limit = Number(getArgValue("--limit") || "0");

  const maxSitemaps = Number(process.env.SITEMAP_MAX_FILES || "8");
  const maxUrls = Number(process.env.SITEMAP_MAX_URLS || "8000");

  const seeds = await readJson(inputPath);
  if (!Array.isArray(seeds)) {
    console.error("Input file must be an array of shoes.");
    process.exit(1);
  }

  const list = limit > 0 ? seeds.slice(0, limit) : seeds;
  const results = [];
  const sitemapCache = new Map();

  const getUrlsForDomain = async (domain) => {
    if (sitemapCache.has(domain)) {
      return sitemapCache.get(domain);
    }
    const urls = await fetchSitemapUrls(domain, {
      maxSitemaps,
      maxUrls
    });
    sitemapCache.set(domain, urls);
    return urls;
  };

  for (const shoe of list) {
    const slug = slugify(`${shoe.brand ?? ""} ${shoe.name ?? ""}`.trim());
    const brandDomains = shoeCatalogConfig.brandDomains[shoe.brand] ?? [];
    let candidates = [];
    let selected_url = null;

    for (const domain of brandDomains) {
      const urls = await getUrlsForDomain(domain);
      const matches = urls.filter((url) => scoreUrl(url, slug) >= 20);
      candidates = matches.slice(0, 5).map((url) => ({ link: url, source: domain }));
      if (matches.length) {
        selected_url = matches[0];
        break;
      }
    }

    if (!selected_url) {
      for (const domain of shoeCatalogConfig.preferredRetailers) {
        const urls = await getUrlsForDomain(domain);
        const { best } = pickBest(urls, slug);
        if (best) {
          selected_url = best;
          candidates = [{ link: best, source: domain }];
          break;
        }
      }
    }

    results.push({
      name: shoe.name,
      brand: shoe.brand,
      release_year: shoe.release_year ?? null,
      release_date: shoe.release_date ?? null,
      query: slug.replace(/-/g, " "),
      selected_url,
      candidates
    });

    if (delayMs > 0) {
      await sleep(delayMs);
    }
  }

  await writeJson(outputPath, results);
  console.log(`Saved ${results.length} discovery entries to ${outputPath}.`);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
