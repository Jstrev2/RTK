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
  const price =
    offers?.price != null ? Number(offers.price) : null;
  const image = Array.isArray(product.image)
    ? product.image[0]
    : product.image ?? null;

  return {
    name: product.name ?? null,
    brand,
    description: product.description ?? null,
    image,
    price
  };
};

const inferCategory = (text) => {
  const lower = text.toLowerCase();
  if (/(jacket|windbreaker|shell|hoodie|rain|gilet|vest)/.test(lower)) {
    return "outerwear";
  }
  if (/(short|tights|tight|legging|pant|pants|shorts|half tight)/.test(lower)) {
    return "bottoms";
  }
  if (/(sock|hat|cap|visor|glove|arm sleeve|belt|pack|vest|headlamp|buff)/.test(lower)) {
    return "accessories";
  }
  return "tops";
};

const inferGender = (text) => {
  const lower = text.toLowerCase();
  if (/(women'?s|womens|female)/.test(lower)) {
    return "womens";
  }
  if (/(men'?s|mens|male)/.test(lower)) {
    return "mens";
  }
  return "unisex";
};

const inferWeather = (text) => {
  const lower = text.toLowerCase();
  const weather = new Set();
  if (/(hot|heat|summer)/.test(lower)) weather.add("hot");
  if (/(warm|warmth)/.test(lower)) weather.add("warm");
  if (/(cool|breeze)/.test(lower)) weather.add("cool");
  if (/(cold|thermal|insulated|fleece)/.test(lower)) weather.add("cold");
  if (/(rain|waterproof|water-resistant)/.test(lower)) weather.add("rain");
  if (/(wind|windproof)/.test(lower)) weather.add("wind");
  if (/(snow)/.test(lower)) weather.add("snow");
  if (/(reflective|visibility|night|dark)/.test(lower)) weather.add("dark");
  if (!weather.size) weather.add("warm");
  return Array.from(weather);
};

const inferPersonas = (text) => {
  const lower = text.toLowerCase();
  const personas = new Set();
  if (/(race|aero|fast|performance|lightweight)/.test(lower)) {
    personas.add("speed_demon");
  }
  if (/(bold|graphic|vibrant|color|statement)/.test(lower)) {
    personas.add("vibe_runner");
  }
  if (/(style|matching|set|trend|fashion)/.test(lower)) {
    personas.add("creative_cruiser");
  }
  if (/(classic|minimal|clean|neutral|timeless)/.test(lower)) {
    personas.add("minimalist_pro");
  }
  if (/(rain|waterproof|insulated|thermal|windproof)/.test(lower)) {
    personas.add("all_weather");
  }
  if (!personas.size) {
    personas.add("minimalist_pro");
  }
  return Array.from(personas);
};

const inferFeatures = (text) => {
  const lower = text.toLowerCase();
  const features = new Set();
  if (/(breathable|vented|mesh)/.test(lower)) features.add("breathable");
  if (/(moisture-wicking|sweat-wicking|quick-dry)/.test(lower)) features.add("moisture-wicking");
  if (/(waterproof|water-resistant)/.test(lower)) features.add("waterproof");
  if (/(reflective|visibility)/.test(lower)) features.add("reflective");
  if (/(pocket|storage)/.test(lower)) features.add("pockets");
  if (/(compress|compression)/.test(lower)) features.add("compression");
  if (/(lightweight|ultralight)/.test(lower)) features.add("lightweight");
  if (/(insulated|thermal|fleece)/.test(lower)) features.add("thermal");
  if (!features.size) {
    features.add("comfort");
  }
  return Array.from(features);
};

const run = async () => {
  const inputPath =
    getArgValue("--input") || path.resolve("data", "attire-discovery.json");
  const outputPath =
    getArgValue("--output") || path.resolve("data", "attire-items-curated.json");
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

    const name = product.name || ogTitle || entry.query || "";
    const brand = product.brand || entry.brand || name.split(" ")[0];
    const description = product.description || ogDescription || null;
    const category = inferCategory(text);
    const gender = inferGender(text);
    const personas = inferPersonas(text);
    const weather = inferWeather(text);
    const features = inferFeatures(text);

    results.push({
      item_key: slugify(`${brand} ${name}`),
      name,
      brand,
      category,
      gender,
      price: product.price ?? null,
      personas,
      weather,
      features,
      image_source: ogImage || product.image || null,
      product_url: url,
      retailer_url: null,
      is_active: true,
      updated_at: new Date().toISOString()
    });
  }

  await writeJson(outputPath, results);
  console.log(`Saved ${results.length} curated attire items to ${outputPath}.`);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
