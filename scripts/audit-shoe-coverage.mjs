import "./load-env.mjs";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const AUDIT_YEAR = process.env.SHOE_AUDIT_YEAR
  ? Number(process.env.SHOE_AUDIT_YEAR)
  : null;

const expectedBrands = [
  "Nike",
  "Adidas",
  "ASICS",
  "Brooks",
  "Hoka",
  "New Balance",
  "Saucony",
  "On",
  "Puma",
  "Mizuno",
  "Altra",
  "Salomon",
  "Skechers",
  "Reebok",
  "Merrell",
  "Inov-8",
  "Topo"
];

const expectedUsage = [
  "daily_trainer",
  "long_run",
  "speed_work",
  "race_day",
  "trail_running",
  "recovery_runs"
];

const expectedStability = ["neutral", "mild", "moderate", "motion_control"];
const expectedCushion = ["minimal", "moderate", "maximum"];

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const run = async () => {
  let query = supabase
    .from("shoe_models")
    .select("brand, usage_types, stability, cushion, image_url, release_year")
    .eq("is_active", true);

  if (AUDIT_YEAR) {
    query = query.eq("release_year", AUDIT_YEAR);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Audit failed:", error.message);
    process.exit(1);
  }

  const rows = data ?? [];
  const brandCounts = new Map();
  const usageSeen = new Set();
  const stabilitySeen = new Set();
  const cushionSeen = new Set();
  let missingImages = 0;

  for (const row of rows) {
    if (row.brand) {
      brandCounts.set(row.brand, (brandCounts.get(row.brand) ?? 0) + 1);
    }
    if (Array.isArray(row.usage_types)) {
      row.usage_types.forEach((entry) => usageSeen.add(entry));
    }
    if (row.stability) {
      stabilitySeen.add(row.stability);
    }
    if (row.cushion) {
      cushionSeen.add(row.cushion);
    }
    if (!row.image_url) {
      missingImages += 1;
    }
  }

  const missingBrands = expectedBrands.filter((brand) => !brandCounts.has(brand));
  const missingUsage = expectedUsage.filter((usage) => !usageSeen.has(usage));
  const missingStability = expectedStability.filter((item) => !stabilitySeen.has(item));
  const missingCushion = expectedCushion.filter((item) => !cushionSeen.has(item));

  console.log("Shoe catalog audit");
  console.log("===================");
  console.log(`Rows audited: ${rows.length}`);
  if (AUDIT_YEAR) {
    console.log(`Release year filter: ${AUDIT_YEAR}`);
  }
  console.log(`Brands represented: ${brandCounts.size}`);
  console.log(`Missing images: ${missingImages}`);
  console.log("\nMissing brand coverage:");
  console.log(missingBrands.length ? `- ${missingBrands.join(", ")}` : "- None");
  console.log("\nMissing usage types:");
  console.log(missingUsage.length ? `- ${missingUsage.join(", ")}` : "- None");
  console.log("\nMissing stability types:");
  console.log(missingStability.length ? `- ${missingStability.join(", ")}` : "- None");
  console.log("\nMissing cushion types:");
  console.log(missingCushion.length ? `- ${missingCushion.join(", ")}` : "- None");

  const topBrands = Array.from(brandCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  console.log("\nTop brands:");
  for (const [brand, count] of topBrands) {
    console.log(`- ${brand}: ${count}`);
  }
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
