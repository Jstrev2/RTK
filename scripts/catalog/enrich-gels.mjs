import "./common.mjs";
import path from "path";
import {
  readJson,
  writeJson,
  fetchHtml,
  stripTags,
  normalizeWhitespace,
  extractMeta,
  extractJsonLd
} from "./common.mjs";

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

const extractProduct = (html) => {
  const jsonLd = extractJsonLd(html);
  const product = jsonLd.find((item) => {
    const type = item["@type"];
    if (Array.isArray(type)) {
      return type.includes("Product");
    }
    return type === "Product";
  });

  if (!product) {
    return {};
  }

  const brand =
    typeof product.brand === "string"
      ? product.brand
      : product.brand?.name ?? null;
  const offers = Array.isArray(product.offers) ? product.offers[0] : product.offers;
  const image = Array.isArray(product.image)
    ? product.image[0]
    : product.image ?? null;

  return {
    name: product.name ?? null,
    brand,
    description: product.description ?? null,
    image,
    price: offers?.price != null ? Number(offers.price) : null
  };
};

const matchNumber = (text, regex) => {
  const match = text.match(regex);
  if (!match) {
    return null;
  }
  return Number(match[1]);
};

const extractNutrition = (text) => {
  const lower = text.toLowerCase();
  const carbs =
    matchNumber(lower, /\bcarbs?\b[^0-9]{0,8}(\d+(\.\d+)?)\s?g/) ?? null;
  const caffeine =
    matchNumber(lower, /\bcaffeine\b[^0-9]{0,8}(\d+(\.\d+)?)\s?mg/) ?? null;
  const sodium =
    matchNumber(lower, /\bsodium\b[^0-9]{0,8}(\d+(\.\d+)?)\s?mg/) ?? null;
  const calories =
    matchNumber(lower, /\bcalories?\b[^0-9]{0,8}(\d+(\.\d+)?)/) ?? null;
  return { carbs, caffeine, sodium, calories };
};

const inferFlavors = (text) => {
  const lower = text.toLowerCase();
  const flavors = [];
  if (/(berry|strawberry|raspberry)/.test(lower)) flavors.push("berry");
  if (/(citrus|lemon|lime|orange)/.test(lower)) flavors.push("citrus");
  if (/(chocolate|cocoa)/.test(lower)) flavors.push("chocolate");
  if (/(cola|coffee|espresso)/.test(lower)) flavors.push("cola");
  return Array.from(new Set(flavors));
};

const run = async () => {
  const inputPath =
    getArgValue("--input") || path.resolve("data", "fuel-gels-discovery.json");
  const outputPath =
    getArgValue("--output") || path.resolve("data", "fuel-gels-curated.json");
  const limit = Number(getArgValue("--limit") || "0");

  const entries = await readJson(inputPath);
  if (!Array.isArray(entries)) {
    console.error("Discovery file must be an array.");
    process.exit(1);
  }

  const list = limit > 0 ? entries.slice(0, limit) : entries;
  const results = [];

  for (const entry of list) {
    const url = entry.selected_url || entry.candidates?.[0]?.link;
    if (!url) {
      continue;
    }

    let html;
    try {
      html = await fetchHtml(url);
    } catch (error) {
      console.warn(`Fetch failed for ${url}: ${error.message}`);
      continue;
    }

    const product = extractProduct(html);
    const ogImage = extractMeta(html, "og:image");
    const ogTitle = extractMeta(html, "og:title");
    const ogDescription = extractMeta(html, "og:description");
    const text = normalizeWhitespace(stripTags(html));
    const nutrition = extractNutrition(text);
    const flavors = inferFlavors(text);

    const name = product.name || ogTitle || entry.query || "";
    const brand = product.brand || entry.brand || name.split(" ")[0];

    results.push({
      item_key: slugify(`${brand} ${name}`),
      brand,
      name,
      carbs_g: nutrition.carbs,
      caffeine_mg: nutrition.caffeine,
      sodium_mg: nutrition.sodium,
      calories: nutrition.calories,
      flavors,
      notes: ogDescription || product.description || null,
      image_source: ogImage || product.image || null,
      product_url: url,
      is_active: true,
      updated_at: new Date().toISOString()
    });
  }

  await writeJson(outputPath, results);
  console.log(`Saved ${results.length} gels to ${outputPath}.`);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
