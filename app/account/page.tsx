"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { SignupCard } from "@/components/account-gate";
import { getSupabaseClient } from "@/lib/supabase-client";

type SavedItem = {
  id: string;
  item_type: string;
  item_id: string;
  label: string | null;
  created_at: string;
};

const SECTIONS: { type: string; title: string; empty: string; href: (id: string) => string | null; tool: string; toolLabel: string }[] = [
  { type: "shoe", title: "Saved shoes", empty: "No shoes saved yet.", href: (id) => `/shoes/${id}`, tool: "/tools/shoe-selector", toolLabel: "Open the Shoe Finder" },
  { type: "song", title: "Saved songs", empty: "No songs saved yet.", href: () => null, tool: "/tools/music", toolLabel: "Open the Music Finder" },
  { type: "plan", title: "Saved fuel plans", empty: "No fuel plans saved yet.", href: () => null, tool: "/tools/fueling", toolLabel: "Open the Fuel Finder" },
  { type: "attire", title: "Saved gear", empty: "No gear saved yet.", href: () => null, tool: "/tools/attire-guide", toolLabel: "What to wear running" }
];

export default function AccountPage() {
  const { user, loading, supabaseAvailable } = useAuth();
  const [saved, setSaved] = useState<SavedItem[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase || !user) return;
    setStatus("loading");
    supabase
      .from("saved_items")
      .select("id, item_type, item_id, label, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          setStatus("error");
          return;
        }
        setSaved((data as SavedItem[]) ?? []);
        setStatus("idle");
      });
  }, [user]);

  const grouped = useMemo(() => {
    const groups: Record<string, SavedItem[]> = {};
    for (const item of saved) (groups[item.item_type] ??= []).push(item);
    return groups;
  }, [saved]);

  if (!supabaseAvailable) {
    return (
      <section className="section container">
        <div className="card">Accounts are offline for a moment.</div>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="section container">
        <div className="card">Loading your account...</div>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="section container">
        <SignupCard tool="shoes" unlocks="full results from every tool and a place to keep what you save" />
      </section>
    );
  }

  return (
    <div>
      <section className="tool-hero container">
        <span className="eyebrow">Your account</span>
        <h1>Everything you&apos;ve saved, in one place.</h1>
        <p>
          Signed in as {user.email}. Every tool shows its full results while
          you&apos;re signed in, and anything you save shows up here.
        </p>
      </section>

      <section className="section container">
        {status === "error" ? <div className="notice">We couldn&apos;t load your saved items right now.</div> : null}
        <div className="grid grid-2">
          {SECTIONS.map((section) => {
            const items = grouped[section.type] ?? [];
            return (
              <div className="card card-dashboard" key={section.type}>
                <div className="stack">
                  <strong>{section.title}</strong>
                  {items.length ? (
                    <ul className="list">
                      {items.map((item) => {
                        const href = section.href(item.item_id);
                        const label = item.label ?? item.item_id;
                        return (
                          <li key={item.id} className="card card-outline">
                            {href ? <Link href={href}>{label}</Link> : label}
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="brand-sub">{section.empty}</p>
                  )}
                  <Link className="text-link" href={section.tool}>{section.toolLabel} →</Link>
                </div>
              </div>
            );
          })}
        </div>
        <p className="brand-sub" style={{ marginTop: 24 }}>
          Want your account deleted? Write to hello@runnertoolkit.com and it&apos;s gone within a week.
        </p>
      </section>
    </div>
  );
}
