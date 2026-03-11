import "./common.mjs";
import path from "path";
import { writeJson, sleep } from "./common.mjs";
import { fetchSitemapUrls } from "./sitemap-utils.mjs";
import { gelCatalogConfig } from "./config.mjs";

const getArgValue = (flag) => {
  const idx = process.argv.findIndex((arg) => arg === flag);
  if (idx === -1) {
    return null;
  }
  return process.argv[idx + 1] ?? null;
};

const keywords = ["gel", "energy-gel", "gels", "energy"];

const matchesKeywords = (url) => {
  const lower = url.toLowerCase();
  return keywords.some((key) => lower.includes(key));
};

const run = async () => {
  const outputPath =
    getArgValue("--output") || path.resolve("data", "fuel-gels-discovery.json");
  const delayMs = Number(getArgValue("--delay") || "600");
  const maxSitemaps = Number(process.env.SITEMAP_MAX_FILES || "8");
  const maxUrls = Number(process.env.SITEMAP_MAX_URLS || "8000");
  const perBrandLimit = Number(process.env.GEL_URL_LIMIT || "40");

  const results = [];

  for (const brand of gelCatalogConfig.brands) {
    const domain = brand
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "")
      .replace(/(^-|-$)+/g, "");

    const candidateDomains = [
      `${domain}.com`,
      `${domain}.co`,
      `${domain}.net`
    ];

    for (const site of candidateDomains) {
      const urls = await fetchSitemapUrls(site, { maxSitemaps, maxUrls });
      const filtered = urls.filter(matchesKeywords).slice(0, perBrandLimit);
      for (const url of filtered) {
        results.push({
          query: `${brand} energy gel`,
          brand,
          selected_url: url,
          candidates: [{ link: url, source: site }]
        });
      }
    }
    if (delayMs > 0) {
      await sleep(delayMs);
    }
  }

  await writeJson(outputPath, results);
  console.log(`Saved ${results.length} gel discovery entries to ${outputPath}.`);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
