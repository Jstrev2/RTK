import "./load-env.mjs";
import fs from "fs/promises";
import path from "path";

const DEFAULT_SOURCE_URL = "https://www.solereview.com/release-date-calendar-for-running-shoes/";
const OUTPUT_PATH = path.resolve("data", "shoe-models-2026.json");

const monthMap = {
  jan: "01",
  feb: "02",
  mar: "03",
  apr: "04",
  may: "05",
  jun: "06",
  july: "07",
  jul: "07",
  aug: "08",
  sep: "09",
  sept: "09",
  oct: "10",
  nov: "11",
  dec: "12"
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
  "Arc�teryx",
  "Kiprun",
  "Teva",
  "TEVA",
  "Reebok"
];

const normalizeBrand = (name) => {
  for (const prefix of brandPrefixes) {
    if (name.toLowerCase().startsWith(prefix.toLowerCase())) {
      return prefix.replace("Asics", "ASICS").replace("adidas", "Adidas");
    }
  }
  return name.split(" ")[0];
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

const cleanCellText = (value) =>
  decodeEntities(stripInlineTags(value))
    .replace(/\s+/g, " ")
    .trim();

const parseReleaseMonth = (text) => {
  const match = text.match(
    /\b(Jan|Feb|Mar|Apr|May|Jun|July|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\s+2026\b/i
  );
  if (!match) {
    return null;
  }
  const token = match[1].toLowerCase();
  return monthMap[token] ?? null;
};

const parseLine = (line) => {
  const match = line.match(
    /^(.*?)\s+(Jan|Feb|Mar|Apr|May|Jun|July|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\s+2026\b/i
  );
  if (!match) {
    return null;
  }
  const name = match[1].trim();
  const monthToken = match[2].toLowerCase();
  const month = monthMap[monthToken];
  if (!name || !month) {
    return null;
  }
  const brand = normalizeBrand(name);
  const release_date = `2026-${month}-01`;
  return {
    item_key: slugify(`${brand} ${name}`),
    name,
    brand,
    release_date,
    release_year: 2026
  };
};

const parseTableEntries = (html) => {
  const entries = [];
  const seen = new Set();
  const rowRegex = /<td class="column-1">([\s\S]*?)<\/td>\s*<td class="column-2">([\s\S]*?)<\/td>/gi;

  let match;
  while ((match = rowRegex.exec(html)) !== null) {
    const name = cleanCellText(match[1]);
    const dateText = cleanCellText(match[2]);
    if (!name || !dateText) {
      continue;
    }
    const month = parseReleaseMonth(dateText);
    if (!month) {
      continue;
    }
    const brand = normalizeBrand(name);
    const release_date = `2026-${month}-01`;
    const item_key = slugify(`${brand} ${name}`);
    if (seen.has(item_key)) {
      continue;
    }
    seen.add(item_key);
    entries.push({
      item_key,
      name,
      brand,
      release_date,
      release_year: 2026
    });
  }

  return entries;
};

const getArgValue = (flag) => {
  const idx = process.argv.findIndex((arg) => arg === flag);
  if (idx === -1) {
    return null;
  }
  return process.argv[idx + 1] ?? null;
};

const fetchHtml = async (url) => {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "runner-toolkit-import/1.0 (+https://example.com)",
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.9"
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return response.text();
};

const run = async () => {
  const fileArg = getArgValue("--file") || process.env.SOLE_REVIEW_HTML_PATH;
  const urlArg = getArgValue("--url") || process.env.SOLE_REVIEW_URL || DEFAULT_SOURCE_URL;

  let html;

  if (fileArg) {
    const resolved = path.resolve(fileArg);
    html = await fs.readFile(resolved, "utf8");
  } else {
    try {
      html = await fetchHtml(urlArg);
    } catch (error) {
      console.error(error.message);
      console.error("If the site blocks automated fetches, save the page HTML locally and rerun:");
      console.error("  npm run scrape:solereview:2026 -- --file path\\to\\solereview.html");
      process.exit(1);
    }
  }

  let entries = parseTableEntries(html);

  if (!entries.length) {
    const text = stripTags(html);
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const fallback = [];
    const seen = new Set();

    for (const line of lines) {
      const entry = parseLine(line);
      if (!entry) {
        continue;
      }
      if (seen.has(entry.item_key)) {
        continue;
      }
      seen.add(entry.item_key);
      fallback.push(entry);
    }

    entries = fallback;
  }

  if (!entries.length) {
    console.error("No 2026 entries parsed. The source format may have changed.");
    process.exit(1);
  }

  await fs.writeFile(OUTPUT_PATH, JSON.stringify(entries, null, 2));
  console.log(`Saved ${entries.length} entries to ${OUTPUT_PATH}.`);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
