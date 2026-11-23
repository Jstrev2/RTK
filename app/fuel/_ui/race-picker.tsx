"use client";

import { useState } from "react";
import Link from "next/link";
import { RACE_DEFS, finishLabel, finishSlug, planTimesFor } from "@/lib/fueling";
import s from "../fuel.module.css";

/** Race tabs, then a finish time: each time is a link to its plan page. */
export default function RacePicker({ initial = "marathon" }: { initial?: string }) {
  const [race, setRace] = useState(initial);
  return (
    <div className={`panel-dark ${s.picker}`}>
      <div className={`chips ${s.raceChips}`} role="tablist" aria-label="Race">
        {RACE_DEFS.map((def) => (
          <button
            key={def.slug}
            type="button"
            role="tab"
            aria-selected={race === def.slug}
            className={`chip ${s.darkChip} ${race === def.slug ? "is-on" : ""}`}
            onClick={() => setRace(def.slug)}
          >
            {def.short}
          </button>
        ))}
      </div>
      {RACE_DEFS.map((def) => (
        <div key={def.slug} className={s.timeChips} hidden={race !== def.slug}>
          {def.slug === "5k" ? <p className={s.pickerNote}>Under an hour? No fuel needed. Walking it:</p> : null}
          {planTimesFor(def).map((minutes) => (
            <Link key={minutes} className={`split on-dark ${s.timeLink}`} href={`/fuel/plan/${def.slug}/${finishSlug(minutes)}`}>
              <b>{finishLabel(minutes)}</b>
            </Link>
          ))}
          <Link className={`btn btn-volt btn-sm ${s.exact}`} href={`/tools/fueling?race=${def.slug}`}>
            Exact time
          </Link>
        </div>
      ))}
    </div>
  );
}
