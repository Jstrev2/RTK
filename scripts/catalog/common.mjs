import "../load-env.mjs";
import fs from "fs/promises";
import path from "path";

const DEFAULT_UA =
  "runner-toolkit-catalog/1.0 (+https://example.com)"; // Replace with your site when available

export const readJson = async (filePath) => {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
};

export const writeJson = async (filePath, data) => {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
};

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const fetchHtml = async (url, { timeoutMs = 20000 } = {}) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": process.env.CATALOG_USER_AGENT || DEFAULT_UA,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9"
      },
      signal: controller.signal
    });
    if (!response.ok) {
      throw new Error(`Fetch failed (${response.status}) for ${url}`);
    }
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
};

export const stripTags = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ");

export const normalizeWhitespace = (value) =>
  value.replace(/\s+/g, " ").trim();

export const extractMeta = (html, name) => {
  const regex = new RegExp(
    `<meta[^>]+(?:property|name)="${name}"[^>]+content="([^"]+)"[^>]*>`,
    "i"
  );
  const match = html.match(regex);
  return match ? match[1] : null;
};

export const extractJsonLd = (html) => {
  const results = [];
  const regex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const raw = match[1].trim();
    if (!raw) {
      continue;
    }
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        results.push(...parsed);
      } else {
        results.push(parsed);
      }
    } catch {
      // ignore invalid JSON-LD blocks
    }
  }
  return results;
};

export const getDomain = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};
