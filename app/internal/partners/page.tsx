"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";

type Program = {
  id: string;
  name: string;
  network: string | null;
  category: string;
  status: string;
  commission: string | null;
  cookie_window: string | null;
  signup_url: string | null;
  contact: string | null;
  env_var: string | null;
  notes: string | null;
  priority: number;
  applied_at: string | null;
};

const STATUSES = ["researching", "applied", "approved", "live", "rejected", "parked"];
const CATEGORIES = ["shoes", "fuel", "attire", "all"];

const SETUP_SQL = `create table if not exists affiliate_programs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  network text,
  category text not null default 'shoes',
  status text not null default 'researching',
  commission text,
  cookie_window text,
  signup_url text,
  contact text,
  env_var text,
  notes text,
  priority int not null default 100,
  applied_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table affiliate_programs enable row level security;`;

const APPLICATION_BLURB = `Runner Toolkit (runnertoolkit.com) is a free set of decision tools for runners: a running-shoe finder backed by a 300+ shoe database with individual spec/review pages, a race-fuel planner, a pace calculator, a what-to-wear guide, and free training plans.

Recommendations are editorial — retailer relationships never change what we recommend, and every commercial link is labeled, uses rel="sponsored", and sits next to an on-page disclosure. Audience: committed recreational road runners, primarily US.

We already link retailer search and product pages from every shoe detail page and fuel plan, so approved links go live sitewide immediately. The site relaunched mid-2026 and organic traffic is early but growing on a fully indexed 300+ page catalog.`;

const OUTREACH_EMAIL = `Subject: Affiliate partnership — Runner Toolkit shoe recommendations

Hi there,

I run Runner Toolkit (runnertoolkit.com), a free set of tools that helps runners pick the right shoes, plan race fuel, and train well. Our shoe finder sits on a database of 300+ current road shoes, each with its own spec page — and we already link to your store from those pages because runners ask where to buy.

I'd love to make that relationship official through your affiliate program. Could you point me at the best way to apply, or approve runnertoolkit.com if you manage it directly?

A few things worth knowing:
- Recommendations are editorial; partner status never changes rankings, and we say so publicly on our methodology page.
- All commercial links are labeled and use rel="sponsored".
- We're happy to feature seasonal deals or launches in our guides where they genuinely fit.

Thanks for taking a look — happy to answer anything.

Jon
Runner Toolkit — runnertoolkit.com
hello@runnertoolkit.com`;

export default function PartnersPage() {
  const { user, session, loading, supabaseAvailable } = useAuth();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [pageState, setPageState] = useState<
    "loading" | "ready" | "forbidden" | "setup" | "error"
  >("loading");
  const [message, setMessage] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { status: string; notes: string }>>({});
  const [newProgram, setNewProgram] = useState({ name: "", network: "", category: "shoes", signup_url: "" });
  const [copied, setCopied] = useState<string | null>(null);

  const authedFetch = useCallback(
    async (input: string, init?: RequestInit) => {
      return fetch(input, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? ""}`,
          ...(init?.headers ?? {})
        }
      });
    },
    [session]
  );

  const load = useCallback(async () => {
    if (!session) return;
    try {
      const res = await authedFetch("/api/admin/partners");
      if (res.status === 401 || res.status === 403) {
        setPageState("forbidden");
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Something went wrong.");
        setPageState("error");
        return;
      }
      if (data.setupRequired) {
        setPageState("setup");
        return;
      }
      const list: Program[] = data.programs ?? [];
      setPrograms(list);
      setDrafts(
        Object.fromEntries(
          list.map((program) => [
            program.id,
            { status: program.status, notes: program.notes ?? "" }
          ])
        )
      );
      setPageState("ready");
    } catch {
      setPageState("error");
      setMessage("Could not reach the partners API.");
    }
  }, [session, authedFetch]);

  useEffect(() => {
    if (session) load();
  }, [session, load]);

  const saveRow = async (id: string) => {
    const draft = drafts[id];
    if (!draft) return;
    setMessage(null);
    const res = await authedFetch("/api/admin/partners", {
      method: "PATCH",
      body: JSON.stringify({ id, status: draft.status, notes: draft.notes })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMessage(data.error ?? "Save failed.");
      return;
    }
    setMessage("Saved.");
    load();
  };

  const seed = async () => {
    setMessage(null);
    const res = await authedFetch("/api/admin/partners", {
      method: "POST",
      body: JSON.stringify({ action: "seed" })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(data.error ?? "Seeding failed.");
      return;
    }
    setMessage(`Added ${data.seeded} default targets.`);
    load();
  };

  const addProgram = async () => {
    if (!newProgram.name.trim()) return;
    const res = await authedFetch("/api/admin/partners", {
      method: "POST",
      body: JSON.stringify(newProgram)
    });
    if (res.ok) {
      setNewProgram({ name: "", network: "", category: "shoes", signup_url: "" });
      load();
    } else {
      const data = await res.json().catch(() => ({}));
      setMessage(data.error ?? "Could not add program.");
    }
  };

  const removeProgram = async (id: string) => {
    const res = await authedFetch(`/api/admin/partners?id=${id}`, { method: "DELETE" });
    if (res.ok) load();
  };

  const copy = async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setMessage("Clipboard unavailable — select and copy manually.");
    }
  };

  if (!supabaseAvailable) {
    return <section className="section container"><div className="card">Auth is not configured.</div></section>;
  }
  if (loading) {
    return <section className="section container"><div className="card">Checking access…</div></section>;
  }
  if (!user) {
    return (
      <section className="section container">
        <div className="card">
          <div className="stack">
            <strong>Partner tracker</strong>
            <p>Sign in to manage affiliate outreach.</p>
            <Link className="btn btn-primary" href="/login">Sign in</Link>
          </div>
        </div>
      </section>
    );
  }
  if (pageState === "forbidden") {
    return <section className="section container"><div className="card">This page is for site admins.</div></section>;
  }
  if (pageState === "loading") {
    return <section className="section container"><div className="card">Loading partner pipeline…</div></section>;
  }
  if (pageState === "setup") {
    return (
      <section className="section container">
        <div className="card">
          <div className="stack">
            <strong>One-time setup: create the tracker table</strong>
            <p>
              Run this in the Supabase SQL editor (Dashboard → SQL), then reload
              this page and hit &ldquo;Seed default targets&rdquo;.
            </p>
            <pre style={{ overflowX: "auto", padding: "12px", background: "rgba(0,0,0,0.08)", borderRadius: "8px", fontSize: "0.8rem" }}>
              {SETUP_SQL}
            </pre>
            <div className="button-row">
              <button className="btn btn-secondary btn-sm" type="button" onClick={() => copy("sql", SETUP_SQL)}>
                {copied === "sql" ? "Copied" : "Copy SQL"}
              </button>
              <button className="btn btn-primary btn-sm" type="button" onClick={load}>
                I ran it — reload
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="editorial-page">
      <section className="tool-hero container">
        <span className="eyebrow">Internal</span>
        <h1>Partner outreach</h1>
        <p>
          Affiliate pipeline: research → applied → approved → live. When a
          program approves, drop its tag or link prefix into the env var listed
          on the row and the site links monetize immediately.
        </p>
        {message ? <p className="brand-sub">{message}</p> : null}
      </section>

      <section className="section container">
        <div className="grid grid-2">
          <div className="card">
            <div className="stack">
              <strong>Application blurb</strong>
              <p className="brand-sub" style={{ whiteSpace: "pre-wrap" }}>{APPLICATION_BLURB}</p>
              <button className="btn btn-secondary btn-sm" type="button" onClick={() => copy("blurb", APPLICATION_BLURB)}>
                {copied === "blurb" ? "Copied" : "Copy blurb"}
              </button>
            </div>
          </div>
          <div className="card">
            <div className="stack">
              <strong>Outreach email draft</strong>
              <p className="brand-sub" style={{ whiteSpace: "pre-wrap" }}>{OUTREACH_EMAIL}</p>
              <button className="btn btn-secondary btn-sm" type="button" onClick={() => copy("email", OUTREACH_EMAIL)}>
                {copied === "email" ? "Copied" : "Copy email"}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="section container">
        <div className="stack">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
            <strong>Pipeline ({programs.length})</strong>
            {programs.length === 0 ? (
              <button className="btn btn-primary btn-sm" type="button" onClick={seed}>
                Seed default targets
              </button>
            ) : null}
          </div>

          {programs.map((program) => {
            const draft = drafts[program.id] ?? { status: program.status, notes: program.notes ?? "" };
            const dirty = draft.status !== program.status || draft.notes !== (program.notes ?? "");
            return (
              <div key={program.id} className="card">
                <div className="stack">
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", alignItems: "baseline" }}>
                    <div>
                      <strong>{program.name}</strong>
                      <span className="brand-sub" style={{ marginLeft: "8px" }}>
                        {[program.network, program.category, program.commission].filter(Boolean).join(" · ")}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <select
                        className="select"
                        value={draft.status}
                        onChange={(e) =>
                          setDrafts((curr) => ({ ...curr, [program.id]: { ...draft, status: e.target.value } }))
                        }
                      >
                        {STATUSES.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                      {program.signup_url ? (
                        <a className="btn btn-ghost btn-sm" href={program.signup_url} target="_blank" rel="noopener noreferrer">
                          Open
                        </a>
                      ) : null}
                    </div>
                  </div>
                  {program.env_var ? (
                    <span className="brand-sub">Wires via: <code>{program.env_var}</code></span>
                  ) : null}
                  <textarea
                    className="input"
                    rows={2}
                    placeholder="Notes: contact, dates, terms…"
                    value={draft.notes}
                    onChange={(e) =>
                      setDrafts((curr) => ({ ...curr, [program.id]: { ...draft, notes: e.target.value } }))
                    }
                  />
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button className="btn btn-primary btn-sm" type="button" disabled={!dirty} onClick={() => saveRow(program.id)}>
                      Save
                    </button>
                    <button className="btn btn-ghost btn-sm" type="button" onClick={() => removeProgram(program.id)}>
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="card card-outline">
            <div className="stack">
              <strong>Add a target</strong>
              <div className="form-grid">
                <input
                  className="input"
                  placeholder="Program name"
                  value={newProgram.name}
                  onChange={(e) => setNewProgram((curr) => ({ ...curr, name: e.target.value }))}
                />
                <input
                  className="input"
                  placeholder="Network (AvantLink, Impact…)"
                  value={newProgram.network}
                  onChange={(e) => setNewProgram((curr) => ({ ...curr, network: e.target.value }))}
                />
                <select
                  className="select"
                  value={newProgram.category}
                  onChange={(e) => setNewProgram((curr) => ({ ...curr, category: e.target.value }))}
                >
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <input
                  className="input"
                  placeholder="Signup URL"
                  value={newProgram.signup_url}
                  onChange={(e) => setNewProgram((curr) => ({ ...curr, signup_url: e.target.value }))}
                />
              </div>
              <button className="btn btn-secondary btn-sm" type="button" onClick={addProgram} disabled={!newProgram.name.trim()}>
                Add
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
