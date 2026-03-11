import "./load-env.mjs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.SUPABASE_SHOE_BUCKET || "shoe-images";
const LIMIT = Number(process.env.IMAGE_UPLOAD_LIMIT || "15");

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const buildQuery = ({ name, brand }) => {
  const prefix = brand ? `${brand} ` : "";
  return `${prefix}${name} running shoe`;
};

const fetchFromBing = async (query) => {
  const apiKey = process.env.BING_IMAGE_SEARCH_KEY || "";
  if (!apiKey) {
    return null;
  }

  const url = `https://api.bing.microsoft.com/v7.0/images/search?q=${encodeURIComponent(
    query
  )}&safeSearch=Moderate&count=1`;

  const response = await fetch(url, {
    headers: {
      "Ocp-Apim-Subscription-Key": apiKey,
      "User-Agent": "runner-toolkit-ingest"
    }
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  const imageUrl = data.value?.[0]?.contentUrl;
  if (!imageUrl) {
    return null;
  }

  return { url: imageUrl, source: "bing" };
};

const fetchFromSerpApi = async (query) => {
  const apiKey = process.env.SERPAPI_API_KEY || "";
  if (!apiKey) {
    return null;
  }

  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google_images");
  url.searchParams.set("q", query);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("safe", "active");

  const response = await fetch(url.toString(), {
    headers: { "User-Agent": "runner-toolkit-ingest" }
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  const imageUrl = data.images_results?.[0]?.original || data.images_results?.[0]?.thumbnail;
  if (!imageUrl) {
    return null;
  }

  return { url: imageUrl, source: "serpapi" };
};

const resolveImage = async (shoe) => {
  if (shoe.image_source && shoe.image_source.startsWith("http")) {
    return { url: shoe.image_source, source: "source" };
  }
  const query = buildQuery(shoe);
  return (await fetchFromBing(query)) ?? (await fetchFromSerpApi(query));
};

const getExtension = (contentType, fallbackUrl) => {
  if (contentType) {
    const match = contentType.match(/image\/(jpeg|png|webp|gif|avif)/i);
    if (match) {
      return match[1] === "jpeg" ? "jpg" : match[1].toLowerCase();
    }
  }
  const ext = path.extname(fallbackUrl || "").replace(".", "");
  return ext || "jpg";
};

const run = async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { data, error } = await supabase
    .from("shoe_models")
    .select("id, item_key, name, brand, image_url, image_source")
    .is("image_url", null)
    .limit(LIMIT);

  if (error) {
    throw new Error(error.message);
  }

  const rows = data ?? [];
  if (!rows.length) {
    console.log("No shoes missing images.");
    return;
  }

  for (const shoe of rows) {
    const result = await resolveImage(shoe);
    if (!result) {
      console.warn(`No image found for ${shoe.name}.`);
      continue;
    }

    const imageResponse = await fetch(result.url);
    if (!imageResponse.ok) {
      console.warn(`Failed to download image for ${shoe.name}.`);
      continue;
    }

    const contentType = imageResponse.headers.get("content-type") || "image/jpeg";
    const buffer = Buffer.from(await imageResponse.arrayBuffer());
    const extension = getExtension(contentType, result.url);
    const filePath = `${shoe.item_key}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, buffer, {
        contentType,
        upsert: true
      });

    if (uploadError) {
      console.warn(`Upload failed for ${shoe.name}: ${uploadError.message}`);
      continue;
    }

    const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(filePath);

    await supabase
      .from("shoe_models")
      .update({
        image_url: publicUrl.publicUrl,
        image_path: filePath,
        image_source: result.url,
        updated_at: new Date().toISOString()
      })
      .eq("id", shoe.id);

    console.log(`Uploaded image for ${shoe.name}.`);
  }
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
