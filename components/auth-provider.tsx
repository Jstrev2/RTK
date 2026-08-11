"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Session, SupabaseClient, User } from "@supabase/supabase-js";

// Inlined at build time; tells the UI auth is configured before the lazily
// loaded supabase-js chunk arrives.
const supabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  supabaseAvailable: boolean;
  /** Any paid access: an active subscription OR an unexpired rescue. */
  isPremium: boolean;
  /** Recurring subscription (monthly/season pass) — has a Billing Portal. */
  isSubscriber: boolean;
  /** One-time Injury Rescue window is active. */
  hasRescue: boolean;
  /** ISO expiry of the rescue window, when active. */
  rescueUntil: string | null;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  loading: true,
  supabaseAvailable: false,
  isPremium: false,
  isSubscriber: false,
  hasRescue: false,
  rescueUntil: null,
  refresh: async () => undefined
});

export function AuthProvider({ children }: { children: ReactNode }) {
  // supabase-js is dynamically imported so it stays out of the shared
  // first-load bundle; content pages never pay for it up front.
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(supabaseConfigured);

  useEffect(() => {
    if (!supabaseConfigured) {
      return;
    }

    let mounted = true;
    let subscription: { unsubscribe: () => void } | undefined;

    (async () => {
      try {
        const { getSupabaseClient } = await import("@/lib/supabase-client");
        const client = getSupabaseClient();
        if (!client || !mounted) {
          if (mounted) setLoading(false);
          return;
        }
        setSupabase(client);

        const { data } = await client.auth.getSession();
        if (mounted) {
          setSession(data.session);
          setLoading(false);
        }

        const listener = client.auth.onAuthStateChange((_event, nextSession) => {
          setSession(nextSession);
        });
        subscription = listener.data.subscription;
        if (!mounted) {
          subscription.unsubscribe();
        }
      } catch {
        // Chunk load failed (stale deploy, flaky network): settle into the
        // signed-out state rather than spinning forever.
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const meta = session?.user?.app_metadata;
    const isSubscriber = meta?.premium === true;
    const hasRescue =
      typeof meta?.rescue_until === "string" &&
      Date.parse(meta.rescue_until) > Date.now();
    return {
      session,
      user: session?.user ?? null,
      loading,
      supabaseAvailable: supabaseConfigured,
      isPremium: isSubscriber || hasRescue,
      isSubscriber,
      hasRescue,
      rescueUntil: hasRescue ? (meta?.rescue_until as string) : null,
      refresh: async () => {
        if (!supabaseConfigured) {
          return;
        }
        try {
          const client =
            supabase ??
            (await import("@/lib/supabase-client")).getSupabaseClient();
          if (!client) return;
          const { data } = await client.auth.getSession();
          setSession(data.session);
        } catch {
          // Keep current state if the client can't be loaded.
        }
      }
    };
  }, [session, loading, supabase]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
