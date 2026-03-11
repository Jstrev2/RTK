import "./common.mjs";
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import { fetchHtml, writeJson } from "./common.mjs";
import { shoeCatalogConfig } from "./config.mjs";

const DEFAULT_SOURCE_URL =
  "https://www.solereview.com/release-date-calendar-for-running-shoes/";
const DEFAULT_OUTPUT_PATH = path.resolve("data", "shoe-seeds.json");

const monthMap = {
  jan: "01",
  january: "01",
  feb: "02",
  february: "02",
  mar: "03",
  march: "03",
  apr: "04",
  april: "04",
  may: "05",
  jun: "06",
  june: "06",
  jul: "07",
  july: "07",
  aug: "08",
  august: "08",
  sep: "09",
  sept: "09",
  september: "09",
  oct: "10",
  october: "10",
  nov: "11",
  november: "11",
  dec: "12",
  december: "12"
};

const brandPrefixes = [
  "New Balance",
  "Saucony",
  "Brooks",
  "ASICS",
  "Asics",
  "Nike",
  "adidas",
  "Mizuno",
  "Hoka",
  "On",
  "Puma",
  "Altra",
  "Salomon",
  "Skechers",
  "Merrell",
  "Arc'teryx",
  "Kiprun",
  "Teva",
  "TEVA",
  "Reebok",
  "Inov-8",
  "Topo"
];

const getArgValue = (flag) => {
  const idx = process.argv.findIndex((arg) => arg === flag);
  if (idx === -1) {
    return null;
  }
  return process.argv[idx + 1] ?? null;
};

const parseListArg = (value) =>
  (value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const parseYears = (value) => {
  if (!value) {
    return shoeCatalogConfig.years;
  }
  return value
    .split(/[,\s]+/)
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item));
};

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const stripTags = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, "\n");

const stripInlineTags = (html) => html.replace(/<[^>]+>/g, " ");

const decodeEntities = (value) => {
  let output = value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&ndash;|&#8211;/g, "-")
    .replace(/&mdash;|&#8212;/g, "-")
    .replace(/&hellip;|&#8230;/g, "...");

  output = output.replace(/&#x([0-9a-f]+);/gi, (_match, hex) => {
    const code = Number.parseInt(hex, 16);
    return code <= 127 ? String.fromCharCode(code) : "";
  });

  output = output.replace(/&#(\d+);/g, (_match, num) => {
    const code = Number.parseInt(num, 10);
    return code <= 127 ? String.fromCharCode(code) : "";
  });

  return output;
};

const DEFAULT_BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

const fetchHtmlWithBrowser = async (url) => {
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch (error) {
    console.warn(
      "Playwright not installed. Run `npm i -D playwright` and `npx playwright install chromium` to enable browser fetch."
    );
    return null;
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      process.env.CATALOG_USER_AGENT_BROWSER ||
      process.env.CATALOG_USER_AGENT ||
      DEFAULT_BROWSER_UA,
    viewport: { width: 1280, height: 800 }
  });

  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(1000);
    return await page.content();
  } catch (error) {
    console.warn(`Browser fetch failed for ${url}: ${error.message}`);
    return null;
  } finally {
    await browser.close();
  }
};

const cleanCellText = (value) =>
  decodeEntities(stripInlineTags(value))
    .replace(/\s+/g, " ")
    .trim();

const normalizeBrand = (name) => {
  for (const prefix of brandPrefixes) {
    if (name.toLowerCase().startsWith(prefix.toLowerCase())) {
      return prefix
        .replace("Asics", "ASICS")
        .replace("adidas", "Adidas")
        .replace("TEVA", "Teva");
    }
  }
  const first = name.split(" ")[0] ?? "";
  if (!first) {
    return "";
  }
  const lowered = first.toLowerCase();
  if (lowered === "asics") return "ASICS";
  if (lowered === "adidas") return "Adidas";
  if (lowered === "on") return "On";
  return first;
};

const parseReleaseMonthYear = (text) => {
  const match = text.match(
    /\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(20\d{2})\b/i
  );
  if (!match) {
    return null;
  }
  const monthToken = match[1].toLowerCase();
  const year = Number(match[2]);
  const month = monthMap[monthToken];
  if (!month || !Number.isFinite(year)) {
    return null;
  }
  return { month, year };
};

const buildEntry = (name, release, yearsSet) => {
  if (!name || !release) {
    return null;
  }
  if (yearsSet && !yearsSet.has(release.year)) {
    return null;
  }
  const brand = normalizeBrand(name);
  if (!brand) {
    return null;
  }
  // Use just the name for the slug since it already includes the brand prefix
  // (e.g. "Saucony Kinvara 16" → "saucony-kinvara-16" instead of "saucony-saucony-kinvara-16")
  return {
    item_key: slugify(name),
    name,
    brand,
    release_date: `${release.year}-${release.month}-01`,
    release_year: release.year
  };
};

const parseTableEntries = (html, yearsSet) => {
  const entries = [];
  const rowRegex =
    /<td[^>]*class="[^"]*column-1[^"]*"[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*class="[^"]*column-2[^"]*"[^>]*>([\s\S]*?)<\/td>/gi;

  let match;
  while ((match = rowRegex.exec(html)) !== null) {
    const name = cleanCellText(match[1]);
    const dateText = cleanCellText(match[2]);
    const release = parseReleaseMonthYear(dateText);
    const entry = buildEntry(name, release, yearsSet);
    if (entry) {
      entries.push(entry);
    }
  }

  return entries;
};

const parseLineEntries = (html, yearsSet) => {
  const text = stripTags(html);
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const monthPattern =
    "(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)";
  const lineRegex = new RegExp(`^(.*?)\\s+${monthPattern}\\s+(20\\d{2})\\b`, "i");

  const entries = [];
  for (const line of lines) {
    const match = line.match(lineRegex);
    if (!match) {
      continue;
    }
    const name = match[1].trim();
    const monthToken = match[2].toLowerCase();
    const year = Number(match[3]);
    const month = monthMap[monthToken];
    if (!month || !Number.isFinite(year)) {
      continue;
    }
    const entry = buildEntry(name, { month, year }, yearsSet);
    if (entry) {
      entries.push(entry);
    }
  }

  return entries;
};

const readExistingSeeds = async (outputPath, shouldMerge) => {
  if (!shouldMerge) {
    return [];
  }
  if (!fsSync.existsSync(outputPath)) {
    return [];
  }
  try {
    const raw = await fs.readFile(outputPath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const run = async () => {
  const outputPath = getArgValue("--output") || DEFAULT_OUTPUT_PATH;
  const yearsArg = getArgValue("--years") || process.env.SHOE_SEED_YEARS;
  const years = parseYears(yearsArg);
  const yearsSet = new Set(years);

  const fileArg = getArgValue("--file") || process.env.SOLE_REVIEW_HTML_PATH;
  const urlArg =
    getArgValue("--url") ||
    getArgValue("--urls") ||
    process.env.SOLE_REVIEW_URLS ||
    process.env.SOLE_REVIEW_URL ||
    DEFAULT_SOURCE_URL;

  const allowStale =
    (getArgValue("--allow-stale") || process.env.SHOE_SEEDS_ALLOW_STALE || "true") !==
    "false";
  const useBrowser =
    (getArgValue("--browser") || process.env.SHOE_SEEDS_BROWSER || "false") ===
    "true";
  const shouldMerge =
    (getArgValue("--no-merge") || process.env.SHOE_SEEDS_MERGE || "true") !== "false";

  const sources = [];
  const fileList = parseListArg(fileArg);
  const urlList = parseListArg(urlArg);

  for (const filePath of fileList) {
    const resolved = path.resolve(filePath);
    const html = await fs.readFile(resolved, "utf8");
    sources.push({ source: resolved, html });
  }

  for (const url of urlList) {
    try {
      const html = await fetchHtml(url);
      sources.push({ source: url, html });
    } catch (error) {
      if (useBrowser) {
        const html = await fetchHtmlWithBrowser(url);
        if (html) {
          sources.push({ source: url, html });
          continue;
        }
      }
      console.warn(`Failed to fetch ${url}: ${error.message}`);
    }
  }

  if (!sources.length) {
    const existing = await readExistingSeeds(outputPath, shouldMerge);
    if (allowStale && existing.length) {
      console.warn(
        "No seed sources available. Keeping existing shoe-seeds.json."
      );
      return;
    }
    console.error("No seed sources available. Use --url or --file.");
    process.exit(1);
  }

  const parsed = [];
  for (const { source, html } of sources) {
    const fromTable = parseTableEntries(html, yearsSet);
    const fromLines = parseLineEntries(html, yearsSet);
    const combined = [...fromTable, ...fromLines];
    if (!combined.length) {
      console.warn(`No entries parsed from ${source}.`);
    }
    parsed.push(...combined);
  }

  const existing = await readExistingSeeds(outputPath, shouldMerge);
  const merged = new Map();

  for (const entry of existing) {
    if (entry?.item_key) {
      merged.set(entry.item_key, entry);
    }
  }

  for (const entry of parsed) {
    if (!entry.item_key) {
      continue;
    }
    const previous = merged.get(entry.item_key);
    if (previous) {
      merged.set(entry.item_key, { ...previous, ...entry });
    } else {
      merged.set(entry.item_key, entry);
    }
  }

  const rows = Array.from(merged.values()).filter(
    (entry) => entry.name && entry.brand && entry.release_date
  );

  if (!rows.length) {
    if (allowStale && existing.length) {
      console.warn(
        "No new seed entries parsed. Keeping existing shoe-seeds.json."
      );
      return;
    }
    console.error("No seed entries parsed. Aborting.");
    process.exit(1);
  }

  rows.sort((a, b) => {
    const dateCompare = String(a.release_date).localeCompare(String(b.release_date));
    if (dateCompare !== 0) return dateCompare;
    const brandCompare = String(a.brand).localeCompare(String(b.brand));
    if (brandCompare !== 0) return brandCompare;
    return String(a.name).localeCompare(String(b.name));
  });

  await writeJson(outputPath, rows);
  console.log(
    `Saved ${rows.length} shoe seeds for years ${[...yearsSet].join(", ")} to ${outputPath}.`
  );
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
