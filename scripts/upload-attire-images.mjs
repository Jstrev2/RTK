import "./load-env.mjs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.SUPABASE_ATTIRE_BUCKET || process.env.SUPABASE_SHOE_BUCKET || "shoe-images";
const LIMIT = Number(process.env.IMAGE_UPLOAD_LIMIT || "15");

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

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
    .from("attire_items")
    .select("id, item_key, name, brand, image_url, image_source")
    .is("image_url", null)
    .limit(LIMIT);

  if (error) {
    throw new Error(error.message);
  }

  const rows = data ?? [];
  if (!rows.length) {
    console.log("No attire items missing images.");
    return;
  }

  for (const item of rows) {
    if (!item.image_source || !item.image_source.startsWith("http")) {
      console.warn(`No image source for ${item.name}.`);
      continue;
    }

    const imageResponse = await fetch(item.image_source);
    if (!imageResponse.ok) {
      console.warn(`Failed to download image for ${item.name}.`);
      continue;
    }

    const contentType = imageResponse.headers.get("content-type") || "image/jpeg";
    const buffer = Buffer.from(await imageResponse.arrayBuffer());
    const extension = getExtension(contentType, item.image_source);
    const filePath = `attire/${item.item_key}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, buffer, {
        contentType,
        upsert: true
      });

    if (uploadError) {
      console.warn(`Upload failed for ${item.name}: ${uploadError.message}`);
      continue;
    }

    const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(filePath);

    await supabase
      .from("attire_items")
      .update({
        image_url: publicUrl.publicUrl,
        image_path: filePath,
        image_source: item.image_source,
        updated_at: new Date().toISOString()
      })
      .eq("id", item.id);

    console.log(`Uploaded image for ${item.name}.`);
  }
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
