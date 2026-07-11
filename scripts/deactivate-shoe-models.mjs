// Marks every shoe_models row inactive. Run before importing a fresh
// authored catalog so retired/junk entries stop appearing on the site.
// The subsequent import (upsert on item_key) re-activates everything in
// the new catalog, including rows that share keys with old entries.
import "./load-env.mjs";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing Supabase env vars.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const run = async () => {
  const { error, count } = await supabase
    .from("shoe_models")
    .update({ is_active: false, updated_at: new Date().toISOString() }, { count: "exact" })
    .eq("is_active", true);

  if (error) {
    console.error("Deactivation failed:", error.message);
    process.exit(1);
  }
  console.log(`Deactivated ${count ?? "all"} shoe_models rows.`);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
