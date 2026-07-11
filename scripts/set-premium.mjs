// Manually grant or revoke premium for a user (testing / comped accounts).
// Usage: node scripts/set-premium.mjs <email> [on|off]
import "./load-env.mjs";
import { createClient } from "@supabase/supabase-js";

const email = process.argv[2];
const mode = (process.argv[3] ?? "on").toLowerCase();

if (!email) {
  console.error("Usage: node scripts/set-premium.mjs <email> [on|off]");
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const run = async () => {
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (error) {
    console.error("Failed to list users:", error.message);
    process.exit(1);
  }
  const user = data.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );
  if (!user) {
    console.error(`No user found with email ${email}`);
    process.exit(1);
  }
  const { error: updateError } = await supabase.auth.admin.updateUserById(
    user.id,
    { app_metadata: { premium: mode === "on" } }
  );
  if (updateError) {
    console.error("Update failed:", updateError.message);
    process.exit(1);
  }
  console.log(`Set premium=${mode === "on"} for ${email} (${user.id}).`);
  console.log("The user must sign out/in (or refresh their session) to pick it up.");
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
