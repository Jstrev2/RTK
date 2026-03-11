import "./common.mjs";
import path from "path";
import { readJson, writeJson, sleep, getDomain } from "./common.mjs";
import { shoeCatalogConfig } from "./config.mjs";

const API_KEY = process.env.SERPAPI_API_KEY;

const getArgValue = (flag) => {
  const idx = process.argv.findIndex((arg) => arg === flag);
  if (idx === -1) {
    return null;
  }
  return process.argv[idx + 1] ?? null;
};

const buildQuery = (shoe) => {
  const brand = shoe.brand ? `${shoe.brand} ` : "";
  return `${brand}${shoe.name} running shoe official site`;
};

const fetchSerpResults = async (query) => {
  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google");
  url.searchParams.set("q", query);
  url.searchParams.set("api_key", API_KEY);
  url.searchParams.set("num", "5");

  const response = await fetch(url.toString(), {
    headers: { "User-Agent": "runner-toolkit-catalog/1.0" }
  });

  if (!response.ok) {
    throw new Error(`SerpAPI failed: ${response.status}`);
  }

  return response.json();
};

const chooseCandidate = (candidates, brand) => {
  const brandDomains = shoeCatalogConfig.brandDomains[brand] ?? [];
  for (const domain of brandDomains) {
    const match = candidates.find((item) => getDomain(item.link) === domain);
    if (match) {
      return match.link;
    }
  }

  for (const domain of shoeCatalogConfig.preferredRetailers) {
    const match = candidates.find((item) => getDomain(item.link) === domain);
    if (match) {
      return match.link;
    }
  }

  return candidates[0]?.link ?? null;
};

const run = async () => {
  if (!API_KEY) {
    console.error("Missing SERPAPI_API_KEY in .env.local.");
    process.exit(1);
  }

  const inputPath =
    getArgValue("--input") || path.resolve("data", "shoe-seeds.json");
  const outputPath =
    getArgValue("--output") || path.resolve("data", "shoe-discovery.json");
  const delayMs = Number(getArgValue("--delay") || "1200");
  const limit = Number(getArgValue("--limit") || "0");

  const seeds = await readJson(inputPath);
  if (!Array.isArray(seeds)) {
    console.error("Input file must be an array of shoes.");
    process.exit(1);
  }

  const list = limit > 0 ? seeds.slice(0, limit) : seeds;
  const results = [];

  for (const shoe of list) {
    const query = buildQuery(shoe);
    const response = await fetchSerpResults(query);
    const candidates = (response.organic_results ?? []).map((item) => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet
    }));
    const selected_url = chooseCandidate(candidates, shoe.brand);

    results.push({
      name: shoe.name,
      brand: shoe.brand,
      release_year: shoe.release_year ?? null,
      release_date: shoe.release_date ?? null,
      query,
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
