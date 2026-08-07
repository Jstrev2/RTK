"use client";

import { useState, type CSSProperties } from "react";
import styles from "./logo-lab.module.css";

type LogoId = "a" | "b" | "c";
type LogoVariant = "standard" | "mono" | "inverse";

interface LogoProps {
  kind: LogoId;
  size: number;
  variant?: LogoVariant;
  decorative?: boolean;
}

const options = [
  {
    id: "a" as const,
    number: "01",
    title: "Shoe Case Redux",
    label: "Continuity",
    description:
      "Keeps the familiar toolkit case, but lets a larger, cleaner running shoe become the first read.",
    note: "Safest evolution of the current identity"
  },
  {
    id: "b" as const,
    number: "02",
    title: "Sprint Shoe",
    label: "Clarity",
    description:
      "Puts an unmistakable running-shoe profile first, with a small utility badge as the toolkit cue.",
    note: "Strongest recognition at header size"
  },
  {
    id: "c" as const,
    number: "03",
    title: "Pace Badge",
    label: "Personality",
    description:
      "Pairs a shoe silhouette with one restrained track lane for a compact, more ownable athletic badge.",
    note: "Most distinctive app-icon system"
  }
];

function markStyle(size: number) {
  return { "--mark-size": `${size}px` } as CSSProperties;
}

function CaseMark({ size, variant = "standard", decorative }: Omit<LogoProps, "kind">) {
  return (
    <span
      className={`${styles.caseMark} ${styles[variant]}`}
      style={markStyle(size)}
      role={decorative ? undefined : "img"}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : "Shoe Case Redux logo"}
    >
      <i className={styles.caseShadow} />
      <i className={styles.caseHandle} />
      <i className={styles.caseBody}>
        <i className={styles.caseUpper} />
        <i className={styles.caseHeel} />
        <i className={styles.caseQuarter} />
        <i className={`${styles.caseLace} ${styles.laceOne}`} />
        <i className={`${styles.caseLace} ${styles.laceTwo}`} />
        <i className={`${styles.caseLace} ${styles.laceThree}`} />
        <i className={styles.caseOutsole} />
      </i>
    </span>
  );
}

function SprintMark({ size, variant = "standard", decorative }: Omit<LogoProps, "kind">) {
  return (
    <span
      className={`${styles.sprintMark} ${styles[variant]}`}
      style={markStyle(size)}
      role={decorative ? undefined : "img"}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : "Sprint Shoe logo"}
    >
      <i className={styles.sprintUpper} />
      <i className={styles.sprintCollar} />
      <i className={styles.sprintHeelSeam} />
      <i className={styles.sprintBadge} />
      <i className={styles.sprintLaces}><b /><b /><b /></i>
      <i className={styles.sprintSole} />
    </span>
  );
}

function PaceMark({ size, variant = "standard", decorative }: Omit<LogoProps, "kind">) {
  return (
    <span
      className={`${styles.paceMark} ${styles[variant]}`}
      style={markStyle(size)}
      role={decorative ? undefined : "img"}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : "Pace Badge logo"}
    >
      <i className={styles.paceBadge}><i className={styles.paceLane} /></i>
      <i className={styles.paceUpper} />
      <i className={styles.paceHeel} />
      <i className={styles.paceQuarter} />
      <i className={styles.paceCollar} />
      <i className={styles.paceLaces}><b /></i>
      <i className={styles.paceOutsole} />
    </span>
  );
}

function LogoMark({ kind, ...props }: LogoProps) {
  if (kind === "a") return <CaseMark {...props} />;
  if (kind === "b") return <SprintMark {...props} />;
  return <PaceMark {...props} />;
}

function Lockup({ kind, size = 54, inverse = false }: { kind: LogoId; size?: number; inverse?: boolean }) {
  return (
    <span className={`${styles.lockup} ${inverse ? styles.lockupInverse : ""}`}>
      <LogoMark kind={kind} size={size} variant={inverse ? "inverse" : "standard"} decorative />
      <span className={styles.lockupCopy}>
        <strong>Runner Toolkit</strong>
        <small>Run smarter. Guess less.</small>
      </span>
    </span>
  );
}

export default function LogoLabClient() {
  const [active, setActive] = useState<LogoId>("b");
  const selected = options.find((option) => option.id === active) ?? options[1];

  return (
    <div className={styles.lab}>
      <section className={styles.intro}>
        <div>
          <span className={styles.eyebrow}>Runner Toolkit · Logo Lab</span>
          <h1>Three sharper ways to say “runner.”</h1>
          <p>
            All three keep the current blue, orange, lime, cream, and ink palette. The variable is how
            directly the mark reads as a running shoe—and how much of the toolkit idea remains.
          </p>
        </div>
        <div className={styles.reviewStamp} aria-label="Design review">
          <span>Design</span>
          <strong>Review</strong>
          <small>3 directions</small>
        </div>
      </section>

      <section className={styles.switcher} aria-labelledby="live-preview-title">
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.eyebrow}>Live context</span>
            <h2 id="live-preview-title">Try each mark in the site header.</h2>
          </div>
          <div className={styles.tabs} aria-label="Choose a logo preview">
            {options.map((option) => (
              <button
                key={option.id}
                type="button"
                className={active === option.id ? styles.tabActive : undefined}
                aria-pressed={active === option.id}
                onClick={() => setActive(option.id)}
              >
                <span>{option.id.toUpperCase()}</span>
                {option.title}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.headerMock}>
          <Lockup kind={active} />
          <div className={styles.mockNav} aria-hidden="true">
            <span>Tools</span>
            <span>Training</span>
            <span>Shoe Finder</span>
            <b>Start a plan →</b>
          </div>
        </div>

        <div className={styles.heroMock}>
          <div className={styles.heroMarkField}>
            <LogoMark kind={active} size={270} decorative />
          </div>
          <div className={styles.heroCopy}>
            <span className={styles.directionLabel}>{selected.label} direction</span>
            <h3>{selected.title}</h3>
            <p>{selected.description}</p>
            <strong>{selected.note}</strong>
          </div>
        </div>
      </section>

      <section className={styles.comparison} aria-labelledby="compare-title">
        <div className={styles.compareHeading}>
          <div>
            <span className={styles.eyebrow}>Side-by-side</span>
            <h2 id="compare-title">Compare the actual use cases.</h2>
          </div>
          <p>Large presentation, 50px header, 32px favicon, one-color, and dark-field treatments.</p>
        </div>

        <div className={styles.optionGrid}>
          {options.map((option) => (
            <article className={`${styles.optionCard} ${active === option.id ? styles.optionSelected : ""}`} key={option.id}>
              <button type="button" className={styles.cardSelect} onClick={() => setActive(option.id)}>
                <span>{option.number}</span>
                <span>Preview in header</span>
              </button>
              <div className={styles.cardTitle}>
                <span>{option.label}</span>
                <h3>{option.title}</h3>
                <p>{option.description}</p>
              </div>

              <div className={`${styles.markStage} ${styles[`stage${option.id.toUpperCase()}`]}`}>
                <LogoMark kind={option.id} size={190} decorative />
              </div>

              <div className={styles.scaleTests}>
                <div>
                  <LogoMark kind={option.id} size={50} decorative />
                  <span>Header · 50px</span>
                </div>
                <div>
                  <span className={styles.faviconFrame}>
                    <LogoMark kind={option.id} size={32} decorative />
                  </span>
                  <span>Favicon · 32px</span>
                </div>
              </div>

              <div className={styles.variantTests}>
                <div className={styles.monoTest}>
                  <LogoMark kind={option.id} size={82} variant="mono" decorative />
                  <span>One color</span>
                </div>
                <div className={styles.darkTest}>
                  <LogoMark kind={option.id} size={82} variant="inverse" decorative />
                  <span>Dark field</span>
                </div>
              </div>

              <p className={styles.cardNote}>{option.note}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
