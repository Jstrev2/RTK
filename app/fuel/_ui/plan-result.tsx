import { clock, finishLabel, unitFor, type FuelPlan } from "@/lib/fueling";
import FuelPhoto from "./fuel-photo";
import s from "../fuel.module.css";

/** The race as a strip of road: start, every serving at its minute, finish. */
export function RaceStrip({ plan }: { plan: FuelPlan }) {
  const n = plan.servings.length;
  const dense = n > 8;
  return (
    <div className={s.stripWrap}>
      <div className={s.strip} data-dense={dense ? (n > 14 ? "2" : "1") : undefined} role="img" aria-label={`${n} servings over ${finishLabel(plan.minutes)}`}>
        <span className={s.stripStart}>Start</span>
        <span className={s.stripFinish}>{finishLabel(plan.minutes)}</span>
        <div className={s.road} />
        {plan.servings.map((serving, index) => (
          <span
            key={`${serving.at}-${index}`}
            className={`${s.marker} ${index % 2 ? s.markerLow : ""} ${serving.product.caffeineMg > 0 ? s.markerCaf : ""}`}
            style={{ left: `calc(var(--pad) + (100% - 2 * var(--pad)) * ${(serving.at / plan.minutes).toFixed(4)})` }}
            title={`${clock(serving.at)} · mile ${serving.mile} · ${serving.product.display}`}
          >
            <span className={s.bubble}>
              <FuelPhoto product={serving.product} />
            </span>
            {!dense ? <span className={s.markerTime}>{clock(serving.at)}</span> : null}
          </span>
        ))}
      </div>
      {n ? (
        <ol className={s.servingList}>
          {plan.servings.map((serving, index) => (
            <li key={`${serving.at}-${index}`} className={serving.product.caffeineMg > 0 ? s.servingCaf : undefined}>
              <b className="clock">{clock(serving.at)}</b>
              <span>mi {serving.mile}</span>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}

/** Three numbers a runner needs on race morning. */
export function PlanNumbers({ plan }: { plan: FuelPlan }) {
  const unit = unitFor(plan.product.type, plan.pack);
  return (
    <div className={s.numbers}>
      <div>
        <span className={s.numLabel}>Carbs an hour</span>
        <b className="clock">{plan.carbsPerHour}<small>g</small></b>
      </div>
      <div>
        <span className={s.numLabel}>{plan.servings.length > 1 ? "One every" : "Take it at"}</span>
        <b className="clock">
          {plan.servings.length > 1 ? (
            <>
              {plan.every}
              <small>min</small>
            </>
          ) : (
            clock(plan.servings[0]?.at ?? 0)
          )}
        </b>
      </div>
      <div>
        <span className={s.numLabel}>Pack</span>
        <b className="clock">
          {plan.pack}
          <small>{unit}</small>
        </b>
      </div>
    </div>
  );
}

/** The whole answer: no-fuel line, or numbers + strip + one line. */
export default function PlanResult({ plan, children }: { plan: FuelPlan; children?: React.ReactNode }) {
  if (plan.need === "none") {
    return (
      <div className={s.noFuel}>
        <b>No fuel needed.</b>
        <span>Under an hour, the carbs already in your muscles cover it. Breakfast and water, that&apos;s it.</span>
      </div>
    );
  }
  const caffeineHeavy = plan.totalCaffeine > 300;
  return (
    <div className={s.result}>
      <PlanNumbers plan={plan} />
      <RaceStrip plan={plan} />
      <p className={s.resultLine}>
        {plan.need === "optional"
          ? `Optional: one ${unitFor(plan.product.type)} helps some runners at this length.`
          : plan.spare
            ? `${plan.servings.length} on the course plus 1 spare. ${plan.totalCarbs}g carbs in all.`
            : `${plan.totalCarbs}g carbs in all.`}
        {plan.totalCaffeine ? ` ${plan.totalCaffeine}mg caffeine.` : ""}
        {caffeineHeavy ? " That much caffeine is a lot: mix in a caffeine-free version." : ""}
      </p>
      {children}
    </div>
  );
}
