"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { getSupabaseClient } from "@/lib/supabase-client";
import { attireItems, shoes, songs, trainingPlans } from "@/lib/data";

type SavedItem = {
  id: string;
  item_type: "shoe" | "attire" | "song" | "plan";
  item_id: string;
  label: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

const groupByType = (items: SavedItem[]) => {
  return items.reduce<Record<string, SavedItem[]>>((groups, item) => {
    if (!groups[item.item_type]) {
      groups[item.item_type] = [];
    }
    groups[item.item_type].push(item);
    return groups;
  }, {});
};

export default function AccountPage() {
  const { user, loading, supabaseAvailable } = useAuth();
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  const shoeMap = useMemo(() => new Map(shoes.map((shoe) => [shoe.id, shoe])), []);
  const attireMap = useMemo(() => new Map(attireItems.map((item) => [item.id, item])), []);
  const songMap = useMemo(() => new Map(songs.map((song) => [song.id, song])), []);
  const planMap = useMemo(() => new Map(trainingPlans.map((plan) => [plan.id, plan])), []);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase || !user) {
      return;
    }

    setStatus("loading");

    supabase
      .from("saved_items")
      .select("id, item_type, item_id, label, metadata, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          setStatus("error");
          return;
        }
        setSavedItems((data as SavedItem[]) ?? []);
        setStatus("idle");
      });
  }, [user]);

  const grouped = useMemo(() => groupByType(savedItems), [savedItems]);

  if (!supabaseAvailable) {
    return (
      <section className="section container">
        <div className="card">
          <strong>Account</strong>
          <p>Supabase auth is not configured yet. Add env vars to enable login.</p>
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="section container">
        <div className="card">Loading your profile...</div>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="section container">
        <div className="card">
          <div className="stack">
            <strong>Sign in to view your profile</strong>
            <p>Save shoes, outfits, and playlists to build your training profile.</p>
            <Link className="btn btn-primary" href="/login">
              Sign in
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div>
      <section className="tool-hero container">
        <h1>Your profile</h1>
        <p>Saved picks feed the future AI optimizer so your plan stays dialed.</p>
      </section>

      <section className="section container">
        <div className="stack">
          <div className="stat-grid">
            <div className="stat">
              <strong>{savedItems.length}</strong>
              <span>Saved items</span>
            </div>
            <div className="stat">
              <strong>{user.email}</strong>
              <span>Signed in</span>
            </div>
          </div>

          {status === "error" ? (
            <div className="notice">Unable to load saved items right now.</div>
          ) : null}

          <div className="grid grid-2">
            <div className="card">
              <div className="stack">
                <strong>Saved shoes</strong>
                {grouped.shoe?.length ? (
                  <ul className="list">
                    {grouped.shoe.map((item) => {
                      const shoe = shoeMap.get(item.item_id);
                      return (
                        <li key={item.id} className="card card-outline">
                          <strong>{shoe?.name ?? item.label ?? item.item_id}</strong>
                          <div className="brand-sub">{shoe?.brand ?? "Shoe"}</div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="brand-sub">No shoes saved yet.</p>
                )}
              </div>
            </div>

            <div className="card">
              <div className="stack">
                <strong>Saved attire</strong>
                {grouped.attire?.length ? (
                  <ul className="list">
                    {grouped.attire.map((item) => {
                      const attire = attireMap.get(item.item_id);
                      return (
                        <li key={item.id} className="card card-outline">
                          <strong>{attire?.name ?? item.label ?? item.item_id}</strong>
                          <div className="brand-sub">{attire?.brand ?? "Attire"}</div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="brand-sub">No attire saved yet.</p>
                )}
              </div>
            </div>

            <div className="card">
              <div className="stack">
                <strong>Saved songs</strong>
                {grouped.song?.length ? (
                  <ul className="list">
                    {grouped.song.map((item) => {
                      const song = songMap.get(item.item_id);
                      return (
                        <li key={item.id} className="card card-outline">
                          <strong>{song?.title ?? item.label ?? item.item_id}</strong>
                          <div className="brand-sub">{song?.artist ?? "Song"}</div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="brand-sub">No songs saved yet.</p>
                )}
              </div>
            </div>

            <div className="card">
              <div className="stack">
                <strong>Saved plans</strong>
                {grouped.plan?.length ? (
                  <ul className="list">
                    {grouped.plan.map((item) => {
                      const plan = planMap.get(item.item_id);
                      return (
                        <li key={item.id} className="card card-outline">
                          <strong>{plan?.name ?? item.label ?? item.item_id}</strong>
                          <div className="brand-sub">{plan?.distance ?? "Plan"}</div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="brand-sub">No plans saved yet.</p>
                )}
              </div>
            </div>
          </div>

          <div className="notice">
            Saved items will train the AI recommendation engine for shoes,
            fueling, and coaching.
          </div>
        </div>
      </section>
    </div>
  );
}
