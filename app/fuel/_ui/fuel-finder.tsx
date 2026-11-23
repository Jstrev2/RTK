"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { SignupCard } from "@/components/account-gate";
import { useAuth } from "@/components/auth-provider";
import { trackEvent } from "@/lib/analytics";
import { getSupabaseClient } from "@/lib/supabase-client";
import {
  RACE_DEFS,
  caffeinatedPartner,
  clock,
  finishLabel,
  isPlannable,
  paceLabel,
  picksFor,
  planFuel,
  rangeForMiles,
  unitFor,
  type FuelProduct,
  type Gut
} from "@/lib/fueling";
import FuelPhoto from "./fuel-photo";
import PlanResult from "./plan-result";
import ProductGrid, { ProductBib } from "./product-grid";
import s from "../fuel.module.css";

const GUTS: { id: Gut; label: string; hint: string }[] = [
  { id: "light", label: "Sensitive", hint: "Less carbs an hour, easier on the stomach" },
  { id: "standard", label: "Normal", hint: "The usual guidance for your race length" },
  { id: "trained", label: "Trained", hint: "You've practised big carb intakes in training" }
];

type LogRow = { id: string; run_date: string; run_type: string; distance: string | null; duration: string | null; rating: number | null; notes: string | null };

const KM = 0.621371;

export default function FuelFinder({ products, defaultKey }: { products: FuelProduct[]; defaultKey: string }) {
  const { user, supabaseAvailable } = useAuth();
  const unlocked = Boolean(user) || !supabaseAvailable;
  const fuel = useMemo(() => products.filter(isPlannable), [products]);
  const fallbackKey = fuel.find((p) => p.key === defaultKey)?.key ?? fuel[0]?.key ?? "";

  const [race, setRace] = useState("marathon");
  const [customDistance, setCustomDistance] = useState("20");
  const [customUnit, setCustomUnit] = useState<"mi" | "km">("mi");
  const [minutes, setMinutes] = useState(240);
  const [gut, setGut] = useState<Gut>("standard");
  const [productKey, setProductKey] = useState(fallbackKey);
  const [caffeineLate, setCaffeineLate] = useState(false);
  const [copied, setCopied] = useState(false);
  const kitRef = useRef<HTMLElement>(null);
  const ready = useRef(false);

  // Links from plan and product pages arrive with ?race=&t=&p=.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const r = params.get("race");
    const t = Number(params.get("t"));
    const p = params.get("p");
    const mi = Number(params.get("mi"));
    if (r === "custom" && mi > 0) {
      setRace("custom");
      setCustomDistance(String(mi));
    } else if (r && RACE_DEFS.some((d) => d.slug === r)) setRace(r);
    if (t > 0) setMinutes(Math.round(t));
    if (p && fuel.some((x) => x.key === p)) setProductKey(p);
    ready.current = true;
  }, [fuel]);

  const miles = useMemo(() => {
    if (race !== "custom") return RACE_DEFS.find((d) => d.slug === race)?.miles ?? 26.219;
    const value = Number(customDistance);
    if (!Number.isFinite(value) || value <= 0) return 1;
    return Math.min(200, customUnit === "km" ? value * KM : value);
  }, [race, customDistance, customUnit]);

  const range = useMemo(() => {
    const def = RACE_DEFS.find((d) => d.slug === race);
    return def ? { min: def.min, max: def.max, start: def.start } : rangeForMiles(miles);
  }, [race, miles]);

  const time = Math.min(range.max, Math.max(range.min, minutes));

  const chooseRace = (slug: string) => {
    setRace(slug);
    const def = RACE_DEFS.find((d) => d.slug === slug);
    setMinutes(def ? def.start : rangeForMiles(miles).start);
  };

  const product = fuel.find((p) => p.key === productKey) ?? fuel[0];
  const partner = product ? caffeinatedPartner(product, fuel) : undefined;
  const plan = useMemo(
    () =>
      product
        ? planFuel({ minutes: time, miles, product, gut, late: caffeineLate && product.caffeineMg === 0 ? partner : undefined })
        : null,
    [product, time, miles, gut, caffeineLate, partner]
  );
  const picks = useMemo(
    () => picksFor({ minutes: time, miles, products: fuel, defaultKey: fallbackKey, gut }),
    [time, miles, fuel, fallbackKey, gut]
  );

  useEffect(() => {
    if (!ready.current) return;
    const params = new URLSearchParams();
    params.set("race", race);
    params.set("t", String(time));
    if (race === "custom") params.set("mi", (Math.round(miles * 10) / 10).toString());
    if (product && product.key !== fallbackKey) params.set("p", product.key);
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
  }, [race, time, miles, product, fallbackKey]);

  const choose = (next: FuelProduct) => {
    setProductKey(next.key);
    trackEvent("fuel_product_select", { product: next.key });
  };

  const packingText = plan
    ? [
        `Fuel for ${race === "custom" ? `${Math.round(miles * 10) / 10} miles` : RACE_DEFS.find((d) => d.slug === race)?.label} in ${finishLabel(time)}`,
        ...(() => {
          const counts = new Map<string, number>();
          plan.servings.forEach((sv) => counts.set(sv.product.display, (counts.get(sv.product.display) ?? 0) + 1));
          if (plan.spare) counts.set(plan.product.display, (counts.get(plan.product.display) ?? 0) + plan.spare);
          return Array.from(counts.entries()).map(([name, count]) => `${count} x ${name}`);
        })(),
        `Take at: ${plan.servings.map((sv) => clock(sv.at)).join(", ")}`
      ].join("\n")
    : "";

  return (
    <div className={s.finder}>
      <section className={`page-hero ${s.finderHero}`}>
        <div className="container">
          <span className="eyebrow">Fuel Finder</span>
          <h1>When to fuel, and with what.</h1>
          <p className="page-hero-sub">Pick the race, drag to your finish time. Done.</p>
        </div>
      </section>

      <section className="container">
        <div className={`panel-dark ${s.controls}`}>
          <div className={`chips ${s.raceChips}`} role="group" aria-label="Race">
            {RACE_DEFS.map((def) => (
              <button key={def.slug} type="button" className={`chip ${s.darkChip} ${race === def.slug ? "is-on" : ""}`} onClick={() => chooseRace(def.slug)}>
                {def.short}
              </button>
            ))}
            <button type="button" className={`chip ${s.darkChip} ${race === "custom" ? "is-on" : ""}`} onClick={() => chooseRace("custom")}>
              Custom
            </button>
          </div>
          {race === "custom" ? (
            <div className={s.customRow}>
              <input
                className={`input ${s.customInput}`}
                type="number"
                min="1"
                max="200"
                step="0.1"
                inputMode="decimal"
                value={customDistance}
                onChange={(event) => setCustomDistance(event.target.value)}
                aria-label="Distance"
              />
              <div className="chips">
                {(["mi", "km"] as const).map((unit) => (
                  <button key={unit} type="button" className={`chip ${s.darkChip} ${customUnit === unit ? "is-on" : ""}`} onClick={() => setCustomUnit(unit)}>
                    {unit}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          <div className={s.timeRow}>
            <div className={s.timeRead}>
              <span className={s.numLabel}>Finish time</span>
              <b className={`clock ${s.bigClock}`}>{finishLabel(time)}</b>
              <span className="split on-dark">
                <b>{paceLabel(time, miles)}</b>
              </span>
            </div>
            <input
              className={s.slider}
              type="range"
              min={range.min}
              max={range.max}
              step={1}
              value={time}
              onChange={(event) => setMinutes(Number(event.target.value))}
              aria-label="Finish time"
              aria-valuetext={finishLabel(time)}
              style={{ ["--fill" as string]: `${((time - range.min) / (range.max - range.min)) * 100}%` }}
            />
            <div className={s.sliderEnds}>
              <span>{finishLabel(range.min)} elite</span>
              <span>{finishLabel(range.max)} walking</span>
            </div>
          </div>
          <div className={s.gutRow}>
            <span className={s.numLabel}>Your stomach</span>
            <div className="chips">
              {GUTS.map((option) => (
                <button key={option.id} type="button" title={option.hint} className={`chip ${s.darkChip} ${gut === option.id ? "is-on" : ""}`} onClick={() => setGut(option.id)}>
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {plan && product ? (
          <div className={`panel ${s.resultPanel}`}>
            {plan.need !== "none" ? (
              <div className={s.usingRow}>
                <span className={s.usingPhoto}>
                  <FuelPhoto product={product} eager />
                </span>
                <span className={s.usingText}>
                  <span className="bib-meta">Using</span>
                  <b>{product.display}</b>
                  <span className={s.usingStats}>
                    {product.carbs}g carbs · {product.sodiumMg}mg sodium{product.caffeineMg ? ` · ${product.caffeineMg}mg caffeine` : ""}
                  </span>
                </span>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => kitRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                >
                  Change
                </button>
              </div>
            ) : null}
            <PlanResult plan={plan} />
          </div>
        ) : null}
      </section>

      {plan && plan.need !== "none" ? (
        <section className={`container ${s.kit}`} ref={kitRef} id="kit">
          <div className="section-head">
            <h2>Your kit</h2>
            {unlocked && partner && product?.caffeineMg === 0 ? (
              <button type="button" className={`chip ${caffeineLate ? "is-on" : ""}`} onClick={() => setCaffeineLate(!caffeineLate)}>
                Caffeine late: {partner.display}
              </button>
            ) : null}
          </div>

          {picks.length ? (
            <div className={s.picks}>
              {picks.map((pick) => {
                const shownProduct = pick.plan.late ?? pick.plan.product;
                const count = pick.plan.servings.length;
                return (
                  <ProductBib
                    key={pick.id}
                    product={shownProduct}
                    badge={pick.label}
                    selected={unlocked && product?.key === pick.plan.product.key && (pick.id === "caffeine") === caffeineLate}
                    onSelect={() => {
                      if (!unlocked) {
                        document.getElementById("fuel-wall")?.scrollIntoView({ behavior: "smooth", block: "center" });
                        return;
                      }
                      choose(pick.plan.product);
                      setCaffeineLate(pick.id === "caffeine");
                    }}
                    countLine={
                      pick.id === "caffeine"
                        ? `Last ${pick.plan.servings.filter((sv) => sv.product.caffeineMg > 0).length} of ${count}`
                        : `${count} ${unitFor(pick.plan.product.type, count)}`
                    }
                  />
                );
              })}
            </div>
          ) : null}

          {unlocked ? (
            <>
              <div className={s.packing}>
                <div>
                  <h3>Packing list</h3>
                  <ul className={s.packList}>
                    {packingText
                      .split("\n")
                      .slice(1, -1)
                      .map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                  </ul>
                  {product && product.flavors.length ? (
                    <div className={`chips ${s.flavors}`}>
                      {product.flavors.slice(0, 12).map((flavor) => (
                        <span key={flavor} className="tag">
                          {flavor}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className={s.packStats}>
                  <span className="split">
                    <b>{plan.totalCarbs}</b>g carbs
                  </span>
                  <span className="split">
                    <b>{plan.sodiumPerHour}</b>mg sodium/hr
                  </span>
                  <span className="split">
                    <b>{plan.totalCaffeine}</b>mg caffeine
                  </span>
                  {product?.priceUsd != null ? (
                    <span className="split">
                      <b>${(plan.pack * product.priceUsd).toFixed(2)}</b>
                    </span>
                  ) : null}
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => {
                      navigator.clipboard?.writeText(packingText).then(() => {
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1600);
                      });
                    }}
                  >
                    {copied ? "Copied" : "Copy list"}
                  </button>
                </div>
              </div>

              <h3 className={s.kitHead}>Swap the product</h3>
              <ProductGrid products={fuel} onSelect={choose} selectedKey={product?.key} pageSize={12} plannableOnly />

              <PracticeLog productName={product?.display ?? ""} race={race} minutes={time} />
            </>
          ) : (
            <div className="wall" id="fuel-wall">
              <SignupCard unlocks="the product swap, your packing list and the practice log" tool="fuel" />
            </div>
          )}
        </section>
      ) : null}

      <section className="container">
        <details className="fineprint">
          <summary>How this works</summary>
          <p>
            Under an hour you don&apos;t need fuel. From 60 to 75 minutes one serving is optional. Longer races get carbs at a
            steady rhythm: about 45g an hour up to two hours, 55g to 2:30 and 65g past that (20g less for a sensitive stomach,
            25g more for a trained one, up to 100g; at most 45g at walk-run pace). The first serving comes at about 20 minutes or later and nothing in the last
            15 minutes, since it won&apos;t reach your legs before the line. Caffeine goes late, about 200mg in all.
          </p>
          <p>
            Based on the ACSM and IOC consensus on carbohydrate during exercise. Nutrition comes from each brand&apos;s own
            product page. Practise any plan on long runs first. <Link href="/fuel">Browse every product</Link>.
          </p>
        </details>
      </section>
    </div>
  );
}

function PracticeLog({ productName, race, minutes }: { productName: string; race: string; minutes: number }) {
  const { user } = useAuth();
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [form, setForm] = useState({ date: "", distance: "", duration: "", rating: "4", notes: "" });

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase || !user) return;
    let active = true;
    setStatus("loading");
    supabase
      .from("fueling_logs")
      .select("id, run_date, run_type, distance, duration, rating, notes")
      .eq("user_id", user.id)
      .order("run_date", { ascending: false })
      .limit(20)
      .then(({ data, error }) => {
        if (!active) return;
        setStatus(error ? "error" : "idle");
        if (!error) setLogs((data as LogRow[]) ?? []);
      });
    return () => {
      active = false;
    };
  }, [user]);

  const add = async (event: React.FormEvent) => {
    event.preventDefault();
    const supabase = getSupabaseClient();
    if (!supabase || !user || !form.date) return;
    setStatus("loading");
    const { data, error } = await supabase
      .from("fueling_logs")
      .insert({
        user_id: user.id,
        run_date: form.date,
        run_type: race === "custom" ? "long_run" : race,
        distance: form.distance || null,
        duration: form.duration || finishLabel(minutes),
        rating: Number(form.rating),
        notes: [productName, form.notes].filter(Boolean).join(": ")
      })
      .select("id, run_date, run_type, distance, duration, rating, notes")
      .single();
    if (error || !data) {
      setStatus("error");
      return;
    }
    setLogs((current) => [data as LogRow, ...current]);
    setStatus("idle");
    setForm({ date: "", distance: "", duration: "", rating: "4", notes: "" });
  };

  return (
    <div className={s.log}>
      <h3>Practice log</h3>
      <form className={s.logForm} onSubmit={add}>
        <input className="input" type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} aria-label="Date" />
        <input className="input" placeholder="Distance" value={form.distance} onChange={(e) => setForm({ ...form, distance: e.target.value })} aria-label="Distance" />
        <input className="input" placeholder={finishLabel(minutes)} value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} aria-label="Time" />
        <select className="select" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} aria-label="How did your stomach feel">
          <option value="5">Stomach: great</option>
          <option value="4">Stomach: fine</option>
          <option value="3">Stomach: so-so</option>
          <option value="2">Stomach: rough</option>
          <option value="1">Stomach: bad</option>
        </select>
        <input className={`input ${s.logNotes}`} placeholder={`Notes (logged with ${productName || "your product"})`} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} aria-label="Notes" />
        <button className="btn btn-flare" type="submit" disabled={status === "loading"}>
          Log it
        </button>
      </form>
      {status === "error" ? <p className="form-message">Couldn&apos;t reach your log. Try again.</p> : null}
      {logs.length ? (
        <ul className={s.logList}>
          {logs.map((row) => (
            <li key={row.id}>
              <span className="split">
                <b>{row.run_date}</b>
              </span>
              <span>{[row.distance, row.duration].filter(Boolean).join(" · ")}</span>
              <span className={s.logNote}>{row.notes}</span>
              <span className="split">
                <b>{row.rating ?? "-"}</b>/5
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className={s.muted}>Log each long run you fuel on. After a few, you&apos;ll know what your stomach handles.</p>
      )}
    </div>
  );
}
