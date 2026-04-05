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

type RaceProfile = {
  id: string;
  user_id: string;
  goal_race: string | null;
  race_date: string | null;
  target_time: string | null;
  goal_notes: string | null;
  created_at?: string;
  updated_at?: string;
};

const groupByType = (items: SavedItem[]) => {
  return items.reduce<Record<string, SavedItem[]>>((groups, item) => {
    if (!groups[item.item_type]) groups[item.item_type] = [];
    groups[item.item_type].push(item);
    return groups;
  }, {});
};

const defaultProfile = {
  goal_race: "",
  race_date: "",
  target_time: "",
  goal_notes: ""
};

export default function AccountPage() {
  const { user, loading, supabaseAvailable } = useAuth();
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [profile, setProfile] = useState(defaultProfile);
  const [profileStatus, setProfileStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const shoeMap = useMemo(() => new Map(shoes.map((shoe) => [shoe.id, shoe])), []);
  const attireMap = useMemo(() => new Map(attireItems.map((item) => [item.id, item])), []);
  const songMap = useMemo(() => new Map(songs.map((song) => [song.id, song])), []);
  const planMap = useMemo(() => new Map(trainingPlans.map((plan) => [plan.id, plan])), []);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase || !user) return;

    setStatus("loading");

    Promise.all([
      supabase
        .from("saved_items")
        .select("id, item_type, item_id, label, metadata, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("race_profiles")
        .select("id, user_id, goal_race, race_date, target_time, goal_notes, created_at, updated_at")
        .eq("user_id", user.id)
        .maybeSingle()
    ]).then(([savedRes, profileRes]) => {
      if (savedRes.error) {
        setStatus("error");
      } else {
        setSavedItems((savedRes.data as SavedItem[]) ?? []);
        setStatus("idle");
      }

      if (profileRes.data) {
        const raceProfile = profileRes.data as RaceProfile;
        setProfile({
          goal_race: raceProfile.goal_race ?? "",
          race_date: raceProfile.race_date ?? "",
          target_time: raceProfile.target_time ?? "",
          goal_notes: raceProfile.goal_notes ?? ""
        });
      }
    });
  }, [user]);

  const grouped = useMemo(() => groupByType(savedItems), [savedItems]);
  const savedCount = savedItems.length;

  const saveProfile = async () => {
    const supabase = getSupabaseClient();
    if (!supabase || !user) return;

    setProfileStatus("saving");

    const payload = {
      user_id: user.id,
      goal_race: profile.goal_race || null,
      race_date: profile.race_date || null,
      target_time: profile.target_time || null,
      goal_notes: profile.goal_notes || null,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from("race_profiles")
      .upsert(payload, { onConflict: "user_id" });

    if (error) {
      setProfileStatus("error");
      return;
    }

    setProfileStatus("saved");
    setTimeout(() => setProfileStatus("idle"), 2500);
  };

  if (!supabaseAvailable) {
    return (
      <section className="section container">
        <div className="card">
          <strong>Race dashboard</strong>
          <p>Supabase auth is not configured yet. Add env vars to enable login.</p>
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="section container">
        <div className="card">Loading your race dashboard...</div>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="section container">
        <div className="card card-accent">
          <div className="stack">
            <strong>Build your race dashboard</strong>
            <p>
              Save your goal race, target time, fueling ideas, shoes, and training picks so Runner Toolkit becomes more than a one-off calculator.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link className="btn btn-primary" href="/login">
                Sign in
              </Link>
              <Link className="btn btn-secondary" href="/tools/pace-calculator">
                Explore tools first
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div>
      <section className="tool-hero container">
        <div className="dashboard-hero stack">
          <span className="pill">Phase 2 · Race dashboard</span>
          <h1>Your next race starts here.</h1>
          <p>
            Set your goal, save the tools that fit your training block, and build a race-day system you can come back to every week.
          </p>
          <div className="kpi-grid">
            <div className="kpi-card">
              <strong>{profile.goal_race || "No race set"}</strong>
              <span className="brand-sub">Goal race</span>
            </div>
            <div className="kpi-card">
              <strong>{profile.target_time || "Set a target"}</strong>
              <span className="brand-sub">Target time</span>
            </div>
            <div className="kpi-card">
              <strong>{savedCount}</strong>
              <span className="brand-sub">Saved building blocks</span>
            </div>
            <div className="kpi-card">
              <strong>{profile.race_date || "Pick a date"}</strong>
              <span className="brand-sub">Race date</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section container">
        <div className="stack">

          <div className="grid grid-2">
            <div className="card card-premium">
              <div className="stack">
                <strong>Race profile</strong>
                <p style={{ margin: 0, color: "var(--ink-2)" }}>
                  This is the sticky layer: your race target, your date, your notes, and the tools you are using to prepare.
                </p>
                <div className="form-grid">
                  <div>
                    <label className="label" htmlFor="goal_race">Goal race</label>
                    <input
                      id="goal_race"
                      className="input"
                      placeholder="Chicago Marathon"
                      value={profile.goal_race}
                      onChange={(e) => setProfile((curr) => ({ ...curr, goal_race: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-2">
                    <div>
                      <label className="label" htmlFor="race_date">Race date</label>
                      <input
                        id="race_date"
                        className="input"
                        type="date"
                        value={profile.race_date}
                        onChange={(e) => setProfile((curr) => ({ ...curr, race_date: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="label" htmlFor="target_time">Target time</label>
                      <input
                        id="target_time"
                        className="input"
                        placeholder="1:45:00"
                        value={profile.target_time}
                        onChange={(e) => setProfile((curr) => ({ ...curr, target_time: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label" htmlFor="goal_notes">Race notes</label>
                    <textarea
                      id="goal_notes"
                      className="textarea"
                      placeholder="Sub-1:45 half. Need better fueling and a steadier first 5K."
                      rows={5}
                      value={profile.goal_notes}
                      onChange={(e) => setProfile((curr) => ({ ...curr, goal_notes: e.target.value }))}
                    />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                  <button className="btn btn-primary" type="button" onClick={saveProfile} disabled={profileStatus === "saving"}>
                    {profileStatus === "saving" ? "Saving..." : "Save race profile"}
                  </button>
                  {profileStatus === "saved" ? <span className="notice">Race profile saved.</span> : null}
                  {profileStatus === "error" ? <span className="notice">Could not save race profile.</span> : null}
                </div>
              </div>
            </div>

            <div className="card card-dashboard">
              <div className="stack">
                <strong>Recommended next moves</strong>
                <div className="list">
                  <Link href="/tools/pace-calculator" className="card card-outline">
                    <strong>Lock your pace plan</strong>
                    <div className="brand-sub">Build splits for your goal time and race distance.</div>
                  </Link>
                  <Link href="/tools/fueling" className="card card-outline">
                    <strong>Dial in race fueling</strong>
                    <div className="brand-sub">Create a race-day gel and hydration strategy you can revisit.</div>
                  </Link>
                  <Link href="/tools/training-plans" className="card card-outline">
                    <strong>Choose your training block</strong>
                    <div className="brand-sub">Match your current plan to the race you are targeting.</div>
                  </Link>
                  <Link href="/tools/shoe-selector" className="card card-outline">
                    <strong>Save your shoe rotation</strong>
                    <div className="brand-sub">Keep race-day and training-day options in one place.</div>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {status === "error" ? <div className="notice">Unable to load saved items right now.</div> : null}

          <div className="grid grid-2">
            <div className="card card-dashboard">
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

            <div className="card card-dashboard">
              <div className="stack">
                <strong>Saved training plans</strong>
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

            <div className="card card-dashboard">
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

            <div className="card card-dashboard">
              <div className="stack">
                <strong>Saved gear and attire</strong>
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
          </div>

          <div className="notice">
            Next evolution: adaptive recommendations, race-week checklists, and premium planning layers on top of this dashboard.
          </div>
        </div>
      </section>
    </div>
  );
}
