"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";

export default function AuthActions() {
  const { user, loading, supabaseAvailable } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    const { getSupabaseClient } = await import("@/lib/supabase-client");
    const supabase = getSupabaseClient();
    if (!supabase) {
      return;
    }
    await supabase.auth.signOut();
    router.push("/");
  };

  if (!supabaseAvailable) {
    return <span className="brand-sub">Auth setup needed</span>;
  }

  if (loading) {
    return <span className="brand-sub">Checking account...</span>;
  }

  if (user) {
    return (
      <div className="auth-actions">
        <Link className="btn btn-secondary btn-sm" href="/account">
          Account
        </Link>
        <button className="btn btn-ghost btn-sm" type="button" onClick={handleSignOut}>
          Sign out
        </button>
      </div>
    );
  }

  return (
    <Link className="btn btn-secondary btn-sm" href="/login">
      Sign in
    </Link>
  );
}
