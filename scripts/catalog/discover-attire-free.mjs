import "./common.mjs";
import path from "path";
import { writeJson, sleep } from "./common.mjs";
import { fetchSitemapUrls } from "./sitemap-utils.mjs";
import { attireCatalogConfig } from "./config.mjs";

const getArgValue = (flag) => {
  const idx = process.argv.findIndex((arg) => arg === flag);
  if (idx === -1) {
    return null;
  }
  return process.argv[idx + 1] ?? null;
};

const keywords = [
  "running",
  "short",
  "shorts",
  "tight",
  "tights",
  "jacket",
  "vest",
  "singlet",
  "tee",
  "shirt",
  "sock",
  "hat",
  "cap",
  "visor",
  "glove",
  "bra"
];

const matchesKeywords = (url) => {
  const lower = url.toLowerCase();
  return keywords.some((key) => lower.includes(key));
};

const run = async () => {
  const outputPath =
    getArgValue("--output") || path.resolve("data", "attire-discovery.json");
  const delayMs = Number(getArgValue("--delay") || "600");
  const maxSitemaps = Number(process.env.SITEMAP_MAX_FILES || "8");
  const maxUrls = Number(process.env.SITEMAP_MAX_URLS || "8000");
  const perBrandLimit = Number(process.env.ATTIRE_URL_LIMIT || "60");

  const results = [];

  for (const brand of attireCatalogConfig.brands) {
    const domains = attireCatalogConfig.brandDomains[brand] ?? [];
    for (const domain of domains) {
      const urls = await fetchSitemapUrls(domain, { maxSitemaps, maxUrls });
      const filtered = urls.filter(matchesKeywords).slice(0, perBrandLimit);
      for (const url of filtered) {
        results.push({
          query: `${brand} running apparel`,
          brand,
          selected_url: url,
          candidates: [{ link: url, source: domain }]
        });
      }
    }
    if (delayMs > 0) {
      await sleep(delayMs);
    }
  }

  await writeJson(outputPath, results);
  console.log(`Saved ${results.length} attire discovery entries to ${outputPath}.`);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
