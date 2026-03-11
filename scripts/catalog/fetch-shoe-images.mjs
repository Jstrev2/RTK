import "../load-env.mjs";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing Supabase env vars.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const slugify = (str) =>
  str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// Build search URLs per brand to find product pages
const brandSearchUrls = {
  Nike: (name) =>
    `https://www.nike.com/w?q=${encodeURIComponent(name)}&vst=${encodeURIComponent(name)}`,
  Adidas: (name) =>
    `https://www.adidas.com/us/search?q=${encodeURIComponent(name)}`,
  "New Balance": (name) =>
    `https://www.newbalance.com/search/?q=${encodeURIComponent(name)}`,
  Brooks: (name) =>
    `https://www.brooksrunning.com/en_us/search?q=${encodeURIComponent(name)}`,
  ASICS: (name) =>
    `https://www.asics.com/us/en-us/search?q=${encodeURIComponent(name)}`,
  Saucony: (name) =>
    `https://www.saucony.com/en/search?q=${encodeURIComponent(name)}`,
  HOKA: (name) =>
    `https://www.hoka.com/en/us/search?q=${encodeURIComponent(name)}`,
  "On Running": (name) =>
    `https://www.on-running.com/en-us/search?q=${encodeURIComponent(name)}`,
};

// Try to fetch an image from Running Warehouse (more scrapable)
async function fetchImageFromRW(brand, name) {
  const query = `${brand} ${name}`.replace(/['"]/g, "");
  const url = `https://www.runningwarehouse.com/searchresult.html?search_terms=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    if (!res.ok) return null;
    const html = await res.text();

    // Look for og:image meta tag
    const ogMatch = html.match(
      /<meta\s+property="og:image"\s+content="([^"]+)"/i
    );
    if (ogMatch) return ogMatch[1];

    // Look for product image in search results
    const imgMatch = html.match(
      /class="product_image"[^>]*>\s*<img[^>]+src="([^"]+)"/i
    );
    if (imgMatch) return imgMatch[1];

    // Any product thumbnail
    const thumbMatch = html.match(
      /<img[^>]+src="(https:\/\/[^"]*runningwarehouse[^"]*\/(mens|womens|unisex)[^"]*\.(?:jpg|png|webp)[^"]*)"[^>]*>/i
    );
    if (thumbMatch) return thumbMatch[1];

    return null;
  } catch {
    return null;
  }
}

// Try manufacturer website for og:image
async function fetchImageFromBrand(brand, name) {
  // Build a likely product URL slug
  const slug = slugify(`${brand} ${name}`);
  const directUrls = [];

  if (brand === "Brooks") {
    directUrls.push(
      `https://www.brooksrunning.com/en_us/${slugify(name)}/`
    );
  } else if (brand === "HOKA") {
    directUrls.push(
      `https://www.hoka.com/en/us/mens-road/${slugify(name)}/`
    );
  } else if (brand === "Saucony") {
    directUrls.push(
      `https://www.saucony.com/en/${slugify(name)}/`
    );
  }

  for (const url of directUrls) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        redirect: "follow",
      });
      if (!res.ok) continue;
      const html = await res.text();
      const ogMatch = html.match(
        /<meta\s+property="og:image"\s+content="([^"]+)"/i
      );
      if (ogMatch) return ogMatch[1];
    } catch {
      continue;
    }
  }
  return null;
}

const run = async () => {
  const { data: shoes, error } = await supabase
    .from("shoe_models")
    .select("item_key, name, brand, image_url")
    .eq("is_active", true)
    .is("image_url", null)
    .order("item_key");

  if (error) {
    console.error("Fetch error:", error.message);
    process.exit(1);
  }

  console.log(`Found ${shoes.length} shoes without images.`);

  let found = 0;
  let missed = 0;

  for (let i = 0; i < shoes.length; i++) {
    const shoe = shoes[i];
    console.log(
      `  [${i + 1}/${shoes.length}] ${shoe.brand} ${shoe.name}...`
    );

    // Try Running Warehouse first (most reliably scrapable)
    let imageUrl = await fetchImageFromRW(shoe.brand, shoe.name);

    // Fallback to brand site
    if (!imageUrl) {
      imageUrl = await fetchImageFromBrand(shoe.brand, shoe.name);
    }

    if (imageUrl) {
      const { error: updateError } = await supabase
        .from("shoe_models")
        .update({
          image_url: imageUrl,
          image_source: "scraped",
          image_updated_at: new Date().toISOString(),
        })
        .eq("item_key", shoe.item_key);

      if (updateError) {
        console.log(`    DB error: ${updateError.message}`);
      } else {
        found++;
        console.log(`    Found: ${imageUrl.substring(0, 80)}...`);
      }
    } else {
      missed++;
      console.log(`    Not found`);
    }

    await sleep(1000); // Be respectful
  }

  console.log(`\nDone. Found images: ${found}, Not found: ${missed}`);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
