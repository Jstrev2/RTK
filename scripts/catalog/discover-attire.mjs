import "./common.mjs";
import path from "path";
import { writeJson, sleep, getDomain } from "./common.mjs";
import { attireCatalogConfig } from "./config.mjs";

const API_KEY = process.env.SERPAPI_API_KEY;

const getArgValue = (flag) => {
  const idx = process.argv.findIndex((arg) => arg === flag);
  if (idx === -1) {
    return null;
  }
  return process.argv[idx + 1] ?? null;
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
  const brandDomains = attireCatalogConfig.brandDomains[brand] ?? [];
  for (const domain of brandDomains) {
    const match = candidates.find((item) => getDomain(item.link) === domain);
    if (match) {
      return match.link;
    }
  }

  for (const domain of attireCatalogConfig.preferredRetailers) {
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

  const outputPath =
    getArgValue("--output") || path.resolve("data", "attire-discovery.json");
  const delayMs = Number(getArgValue("--delay") || "1200");
  const limit = Number(getArgValue("--limit") || "0");

  const queries = [];

  for (const brand of attireCatalogConfig.brands) {
    for (const category of attireCatalogConfig.categories) {
      queries.push(`${brand} ${category} running`);
    }
  }

  const list = limit > 0 ? queries.slice(0, limit) : queries;
  const results = [];

  for (const query of list) {
    const response = await fetchSerpResults(query);
    const candidates = (response.organic_results ?? []).map((item) => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet
    }));
    const selected_url = chooseCandidate(candidates, query.split(" ")[0]);

    results.push({
      query,
      brand: query.split(" ")[0],
      selected_url,
      candidates
    });

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
