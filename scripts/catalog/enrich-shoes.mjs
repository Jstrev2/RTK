import "./common.mjs";
import path from "path";
import {
  readJson,
  writeJson,
  fetchHtml,
  stripTags,
  normalizeWhitespace,
  extractMeta,
  extractJsonLd,
  getDomain
} from "./common.mjs";
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

const normalizeBrand = (name) => {
  if (!name) {
    return "";
  }
  const lowered = name.toLowerCase();
  if (lowered.startsWith("asics")) return "ASICS";
  if (lowered.startsWith("adidas")) return "Adidas";
  if (lowered.startsWith("new balance")) return "New Balance";
  if (lowered.startsWith("on ")) return "On";
  return name.split(" ")[0];
};

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

const matchNumber = (text, regex) => {
  const match = text.match(regex);
  if (!match) {
    return null;
  }
  return Number(match[1]);
};

const extractSpecs = (text) => {
  const lower = text.toLowerCase();

  // Drop: try multiple patterns
  const drop =
    matchNumber(lower, /\b(?:drop|offset)\b[^0-9]{0,12}(\d+(?:\.\d+)?)\s?mm/) ??
    matchNumber(lower, /\bheel[- ]to[- ]toe\s*(?:drop|offset)?\b[^0-9]{0,12}(\d+(?:\.\d+)?)\s?mm/) ??
    matchNumber(lower, /(\d+(?:\.\d+)?)\s?mm\s*(?:drop|offset)/) ??
    matchNumber(lower, /\bheel[- ]toe\b[^0-9]{0,12}(\d+(?:\.\d+)?)\s?mm/);

  // Stack height: try multiple patterns
  const stack =
    matchNumber(lower, /\b(?:stack|stack height)\b[^0-9]{0,12}(\d+(?:\.\d+)?)\s?mm/) ??
    matchNumber(lower, /(\d+(?:\.\d+)?)\s?mm\s*(?:stack|midsole height)/) ??
    matchNumber(lower, /\bmidsole\s*(?:height|thickness)\b[^0-9]{0,12}(\d+(?:\.\d+)?)\s?mm/);

  // Weight: oz or grams, men's or generic
  const weightOz =
    matchNumber(lower, /\bweight\b[^0-9]{0,16}(\d+(?:\.\d+)?)\s?oz/) ??
    matchNumber(lower, /(\d+(?:\.\d+)?)\s?oz\s*\(?(?:men|m)\b/) ??
    matchNumber(lower, /\bmen'?s?\s*(?:weight)?\s*[:\-]?\s*(\d+(?:\.\d+)?)\s?oz/) ??
    (() => {
      const grams =
        matchNumber(lower, /\bweight\b[^0-9]{0,16}(\d+(?:\.\d+)?)\s?g(?:rams)?/) ??
        matchNumber(lower, /(\d+(?:\.\d+)?)\s?g(?:rams?)?\s*\(?(?:men|m)\b/) ??
        matchNumber(lower, /\bmen'?s?\s*(?:weight)?\s*[:\-]?\s*(\d+(?:\.\d+)?)\s?g(?:rams)?/);
      return grams ? +(grams / 28.3495).toFixed(1) : null;
    })();

  // Women's weight
  const weightWomensOz =
    matchNumber(lower, /\bwomen'?s?\s*(?:weight)?\s*[:\-]?\s*(\d+(?:\.\d+)?)\s?oz/) ??
    (() => {
      const grams = matchNumber(lower, /\bwomen'?s?\s*(?:weight)?\s*[:\-]?\s*(\d+(?:\.\d+)?)\s?g(?:rams)?/);
      return grams ? +(grams / 28.3495).toFixed(1) : null;
    })();

  // Price from text (backup if JSON-LD doesn't have it)
  const price = matchNumber(lower, /\$(\d+(?:\.\d{2})?)/);

  return { drop, stack, weightOz, weightWomensOz, price };
};

// Extract specs from HTML spec tables (common on Running Warehouse, REI, brand sites)
const extractSpecTable = (html) => {
  const specs = {};
  // Match table rows like: <th>Drop</th><td>8mm</td> or <dt>Weight</dt><dd>9.2 oz</dd>
  const patterns = [
    // th/td pattern
    /<t[hd][^>]*>\s*([^<]*(?:drop|offset|stack|weight|heel[- ]to[- ]toe)[^<]*)\s*<\/t[hd]>\s*<t[hd][^>]*>\s*([^<]+)\s*<\/t[hd]>/gi,
    // dt/dd pattern
    /<d[td][^>]*>\s*([^<]*(?:drop|offset|stack|weight|heel[- ]to[- ]toe)[^<]*)\s*<\/d[td]>\s*<d[td][^>]*>\s*([^<]+)\s*<\/d[td]>/gi,
    // label: value pattern in divs/spans
    /<(?:span|div|p)[^>]*>\s*([^<]*(?:drop|offset|stack|weight)[^<]*)\s*<\/(?:span|div|p)>\s*<(?:span|div|p)[^>]*>\s*([^<]+)\s*<\/(?:span|div|p)>/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      const label = match[1].toLowerCase().trim();
      const value = match[2].trim();
      if (label.includes("drop") || label.includes("offset") || label.includes("heel")) {
        const num = value.match(/(\d+(?:\.\d+)?)/);
        if (num) specs.drop = Number(num[1]);
      }
      if (label.includes("stack") || label.includes("midsole")) {
        const num = value.match(/(\d+(?:\.\d+)?)/);
        if (num) specs.stack = Number(num[1]);
      }
      if (label.includes("weight")) {
        const oz = value.match(/(\d+(?:\.\d+)?)\s*oz/i);
        const g = value.match(/(\d+(?:\.\d+)?)\s*g/i);
        if (oz) specs.weightOz = Number(oz[1]);
        else if (g) specs.weightOz = +(Number(g[1]) / 28.3495).toFixed(1);
      }
    }
  }

  return specs;
};

const inferUsageTypes = (text) => {
  const lower = text.toLowerCase();
  const usage = new Set();
  if (/(daily trainer|everyday|daily mileage|daily training)/.test(lower)) {
    usage.add("daily_trainer");
  }
  if (/(long run|marathon|endurance|distance)/.test(lower)) {
    usage.add("long_run");
  }
  if (/(speed|tempo|interval|uptempo|fast|workout)/.test(lower)) {
    usage.add("speed_work");
  }
  if (/(race|racing|carbon|race day|marathon racer)/.test(lower)) {
    usage.add("race_day");
  }
  if (/(trail)/.test(lower)) {
    usage.add("trail_running");
  }
  if (/(recovery|easy run|easy day|soft ride|comfort)/.test(lower)) {
    usage.add("recovery_runs");
  }
  if (!usage.size) {
    usage.add("daily_trainer");
  }
  return Array.from(usage);
};

const inferSurfaces = (text) => {
  const lower = text.toLowerCase();
  if (/(trail)/.test(lower)) {
    return ["trail_groomed", "trail_technical"];
  }
  return ["road", "treadmill", "mixed"];
};

const inferCushion = (text) => {
  const lower = text.toLowerCase();
  if (/(max cushion|maximal|plush|softest|stacked)/.test(lower)) {
    return "maximum";
  }
  if (/(minimal|low profile|barefoot)/.test(lower)) {
    return "minimal";
  }
  return "moderate";
};

const inferStability = (text) => {
  const lower = text.toLowerCase();
  if (/(motion control)/.test(lower)) {
    return "motion_control";
  }
  if (/(mild stability|light stability|guidance)/.test(lower)) {
    return "mild";
  }
  if (/(stability|support)/.test(lower)) {
    return "moderate";
  }
  return "neutral";
};

const inferToeBox = (text) => {
  const lower = text.toLowerCase();
  if (/(wide toe box|roomy forefoot)/.test(lower)) {
    return "wide";
  }
  if (/(narrow fit|snug fit)/.test(lower)) {
    return "narrow";
  }
  return "standard";
};

const inferFootStrike = (usageTypes, drop) => {
  if (usageTypes.includes("race_day") || usageTypes.includes("speed_work")) {
    return ["midfoot", "forefoot"];
  }
  if (drop != null && drop >= 8) {
    return ["heel", "midfoot"];
  }
  return ["heel", "midfoot"];
};

const inferCadence = (usageTypes) => {
  if (usageTypes.includes("race_day") || usageTypes.includes("speed_work")) {
    return ["high"];
  }
  return ["average"];
};

const inferWeightRange = (weightOz) => {
  if (!weightOz) {
    return "all";
  }
  if (weightOz >= 10.5) {
    return "heavyweight";
  }
  if (weightOz <= 8.0) {
    return "lightweight";
  }
  return "all";
};

const splitProsCons = (description) => {
  if (!description) {
    return { pros: [], cons: [] };
  }
  const pros = [];
  const cons = [];
  if (description.toLowerCase().includes("plush")) pros.push("Plush");
  if (description.toLowerCase().includes("lightweight")) pros.push("Lightweight");
  if (description.toLowerCase().includes("durable")) pros.push("Durable");
  return { pros, cons };
};

const classifyUrl = (url) => {
  const domain = getDomain(url);
  if (shoeCatalogConfig.preferredRetailers.includes(domain)) {
    return { retailer_url: url, product_url: null };
  }
  return { retailer_url: null, product_url: url };
};

const run = async () => {
  const inputPath =
    getArgValue("--input") || path.resolve("data", "shoe-discovery.json");
  const outputPath =
    getArgValue("--output") || path.resolve("data", "shoe-models-curated.json");
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
      console.warn(`Fetch failed for ${entry.name}: ${error.message}`);
      continue;
    }

    const product = extractProduct(html);
    const ogImage = extractMeta(html, "og:image");
    const ogTitle = extractMeta(html, "og:title");
    const ogDescription = extractMeta(html, "og:description");

    const text = normalizeWhitespace(stripTags(html));
    const textSpecs = extractSpecs(text);
    const tableSpecs = extractSpecTable(html);
    // Merge: prefer text-extracted specs, fall back to table-extracted
    const specs = {
      drop: textSpecs.drop ?? tableSpecs.drop ?? null,
      stack: textSpecs.stack ?? tableSpecs.stack ?? null,
      weightOz: textSpecs.weightOz ?? tableSpecs.weightOz ?? null,
      weightWomensOz: textSpecs.weightWomensOz ?? null,
      price: textSpecs.price ?? null,
    };
    const usageTypes = inferUsageTypes(text);
    const surfaces = inferSurfaces(text);
    const cushion = inferCushion(text);
    const stability = inferStability(text);
    const toeBox = inferToeBox(text);
    const footStrike = inferFootStrike(usageTypes, specs.drop);
    const cadence = inferCadence(usageTypes);
    const weightRange = inferWeightRange(specs.weightOz);
    const { pros, cons } = splitProsCons(
      product.description || ogDescription || ""
    );

    const { retailer_url, product_url } = classifyUrl(url);
    const brand = entry.brand || product.brand || normalizeBrand(product.name || "");

    results.push({
      item_key: slugify(entry.name),
      name: entry.name || product.name || ogTitle || "",
      brand,
      price: product.price ?? specs.price ?? null,
      usage_types: usageTypes,
      foot_strike: footStrike,
      cadence,
      toe_box: toeBox,
      cushion,
      stability,
      surfaces,
      weight_range: weightRange,
      stack: specs.stack ?? null,
      drop: specs.drop ?? null,
      weight_mens: specs.weightOz ?? null,
      weight_womens: specs.weightWomensOz ?? specs.weightOz ?? null,
      description: product.description || ogDescription || null,
      pros,
      cons,
      popularity: 0,
      release_date: entry.release_date ?? null,
      release_year: entry.release_year ?? null,
      image_source: ogImage || product.image || null,
      product_url,
      retailer_url,
      is_active: true,
      updated_at: new Date().toISOString()
    });
  }

  await writeJson(outputPath, results);
  console.log(`Saved ${results.length} curated shoes to ${outputPath}.`);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
