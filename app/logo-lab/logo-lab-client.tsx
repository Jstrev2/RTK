"use client";

import { useState, type CSSProperties } from "react";
import styles from "./logo-lab.module.css";

type LogoId = "a" | "b" | "c" | "d" | "e" | "f" | "g";
type LogoVariant = "standard" | "mono" | "inverse";
type Author = "codex" | "claude";

const INK = "#161814";
const BLUE = "#1647d9";
const ORANGE = "#ff6a35";
const LIME = "#ddea3f";
const CREAM = "#fffefa";

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
    author: "codex" as Author,
    title: "Shoe Case Redux",
    label: "Continuity",
    description:
      "Keeps the familiar toolkit case, but lets a larger, cleaner running shoe become the first read.",
    note: "Safest evolution of the current identity"
  },
  {
    id: "b" as const,
    number: "02",
    author: "codex" as Author,
    title: "Sprint Shoe",
    label: "Clarity",
    description:
      "Puts an unmistakable running-shoe profile first, with a small utility badge as the toolkit cue.",
    note: "Strongest recognition at header size"
  },
  {
    id: "c" as const,
    number: "03",
    author: "codex" as Author,
    title: "Pace Badge",
    label: "Personality",
    description:
      "Pairs a shoe silhouette with one restrained track lane for a compact, more ownable athletic badge.",
    note: "Most distinctive app-icon system"
  },
  {
    id: "d" as const,
    number: "04",
    author: "claude" as Author,
    title: "Wrench Sole",
    label: "Fusion",
    description:
      "A running shoe whose outsole is a full open-end wrench—ring at the heel, jaw at the toe. One object, both reads.",
    note: "Tool and shoe welded into a single silhouette"
  },
  {
    id: "e" as const,
    number: "05",
    author: "claude" as Author,
    title: "Socket Sprint",
    label: "Badge",
    description:
      "A socket-wrench head becomes the badge: a shoe mid-stride sits inside the drive while the handle trails off like a speed line.",
    note: "Circular system that survives the favicon test"
  },
  {
    id: "f" as const,
    number: "06",
    author: "claude" as Author,
    title: "Hex Stride",
    label: "One line",
    description:
      "A single hex key bent into a runner's profile, capped with a lime hex nut. The whole mark is one continuous stroke.",
    note: "Most ownable; built for one color by design"
  },
  {
    id: "g" as const,
    number: "07",
    author: "claude" as Author,
    title: "Gear Shoe",
    label: "Response",
    description:
      "The case idea with the box removed: the shoe itself is the soft gear bag—arched carry handle, zip seam, chunky sole. All curves.",
    note: "Everything the case promises, nothing boxy"
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

function markShell(size: number, decorative: boolean | undefined, label: string) {
  return {
    className: styles.svgMark,
    style: markStyle(size),
    role: decorative ? undefined : ("img" as const),
    "aria-hidden": decorative || undefined,
    "aria-label": decorative ? undefined : label
  };
}

function WrenchMark({ size, variant = "standard", decorative }: Omit<LogoProps, "kind">) {
  const c =
    variant === "mono"
      ? { tool: INK, upper: INK, hole: CREAM, accent: INK, pop: null }
      : variant === "inverse"
        ? { tool: CREAM, upper: LIME, hole: INK, accent: CREAM, pop: null }
        : { tool: INK, upper: BLUE, hole: CREAM, accent: ORANGE, pop: LIME };
  return (
    <span {...markShell(size, decorative, "Wrench Sole logo")}>
      <svg viewBox="0 20 104 70" xmlns="http://www.w3.org/2000/svg">
        {/* shoe upper */}
        <path
          d="M7,62.5 L6,52 C5,38 8,29 15,27 C20,25.5 24,29 26.5,32.5 C35,51 56,56 79,60 L80,62.5 Z"
          fill={c.upper}
        />
        {c.pop && <path d="M7.2,55.5 L79.2,60.2 L80,62.5 L7,62.5 Z" fill={c.pop} />}
        {/* collar accent */}
        <path d="M15,27 C20,25.5 24,29 26.5,32.5 L23,37 C20.5,33 18,31 14,31.5 Z" fill={c.accent} />
        {/* laces */}
        <g stroke={c.hole} strokeWidth="3.2" strokeLinecap="round">
          <line x1="33" y1="42.5" x2="41.5" y2="36.5" />
          <line x1="40" y1="48" x2="48.5" y2="42" />
          <line x1="47" y1="52.5" x2="55.5" y2="46.5" />
        </g>
        {/* wrench outsole: ring end at heel, open jaw at toe */}
        <g fill={c.tool}>
          <circle cx="16" cy="74" r="12.5" />
          <rect x="16" y="67.5" width="62" height="13" rx="2" />
          <path
            d="M78,61.5 L85,61.5 A11.5,11.5 0 0 1 95.2,67.8 L89.5,69.5 L89.5,76.5 L95.2,78.2 A11.5,11.5 0 0 1 85,84.5 L78,84.5 Z"
            transform="rotate(-12 82 73)"
          />
        </g>
        <polygon points="21.8,74 18.9,79 13.1,79 10.2,74 13.1,69 18.9,69" fill={c.hole} />
      </svg>
    </span>
  );
}

function SocketMark({ size, variant = "standard", decorative }: Omit<LogoProps, "kind">) {
  const c =
    variant === "mono"
      ? { ring: INK, knurl: CREAM, face: CREAM, shoe: INK, sole: INK, speed: INK, handle: INK, line: INK }
      : variant === "inverse"
        ? { ring: CREAM, knurl: INK, face: CREAM, shoe: INK, sole: INK, speed: INK, handle: LIME, line: INK }
        : { ring: BLUE, knurl: CREAM, face: CREAM, shoe: INK, sole: ORANGE, speed: BLUE, handle: ORANGE, line: INK };
  return (
    <span {...markShell(size, decorative, "Socket Sprint logo")}>
      <svg viewBox="4 8 112 84" xmlns="http://www.w3.org/2000/svg">
        {/* ratchet handle trailing behind the socket head */}
        <rect
          x="76"
          y="47"
          width="38"
          height="14"
          rx="7"
          fill={c.handle}
          stroke={c.line}
          strokeWidth="2.5"
          transform="rotate(8 80 54)"
        />
        {/* socket head with hex drive */}
        <circle cx="46" cy="50" r="38" fill={c.ring} stroke={c.line} strokeWidth="3" />
        <circle cx="46" cy="50" r="33.5" fill="none" stroke={c.knurl} strokeWidth="3.5" strokeDasharray="3.4 6" />
        <polygon
          points="73,50 59.5,26.6 32.5,26.6 19,50 32.5,73.4 59.5,73.4"
          fill={c.face}
          stroke={c.line}
          strokeWidth="2"
        />
        {/* shoe mid-stride inside the drive */}
        <path
          d="M31,54 C30,45 32,37.5 36,36.2 C38.5,35.4 40.5,37.2 42.2,39.4 C48,48 57,50.5 66.5,52.2 L67.5,54 Z"
          fill={c.shoe}
        />
        <rect x="29.5" y="56" width="37" height="6" rx="3" fill={c.sole} />
        <g stroke={c.speed} strokeWidth="2.6" strokeLinecap="round">
          <line x1="24" y1="43" x2="30.5" y2="43.4" />
          <line x1="23" y1="49.5" x2="30" y2="49.9" />
        </g>
      </svg>
    </span>
  );
}

function HexMark({ size, variant = "standard", decorative }: Omit<LogoProps, "kind">) {
  const c =
    variant === "mono"
      ? { stroke: INK, hex: CREAM, line: INK }
      : variant === "inverse"
        ? { stroke: CREAM, hex: LIME, line: CREAM }
        : { stroke: BLUE, hex: LIME, line: INK };
  return (
    <span {...markShell(size, decorative, "Hex Stride logo")}>
      <svg viewBox="6 4 98 82" xmlns="http://www.w3.org/2000/svg">
        {/* one continuous hex-key stroke tracing the shoe */}
        <path
          d="M33,10 L33,24 C33,35 20,37 20,52 L20,66 Q20,77 31,77 L83,77 Q95,77 96.5,67.5 Q97.5,59.5 87,56.5 L61,49.5 C50.5,46.5 44.5,40.5 41.5,31"
          fill="none"
          stroke={c.stroke}
          strokeWidth="7.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* hex nut cap at the working end */}
        <polygon
          points="51.5,28.5 47.3,35.9 38.7,35.9 34.5,28.5 38.7,21.1 47.3,21.1"
          fill={c.hex}
          stroke={c.line}
          strokeWidth="2.6"
        />
      </svg>
    </span>
  );
}

function DuffelMark({ size, variant = "standard", decorative }: Omit<LogoProps, "kind">) {
  const c =
    variant === "mono"
      ? { upper: INK, sole: INK, handle: INK, seam: CREAM, latch: CREAM, lace: CREAM }
      : variant === "inverse"
        ? { upper: CREAM, sole: CREAM, handle: LIME, seam: INK, latch: LIME, lace: INK }
        : { upper: BLUE, sole: INK, handle: ORANGE, seam: CREAM, latch: LIME, lace: CREAM };
  return (
    <span {...markShell(size, decorative, "Gear Shoe logo")}>
      <svg viewBox="2 8 100 78" xmlns="http://www.w3.org/2000/svg">
        {/* arched carry handle */}
        <path
          d="M36,27 A12,12 0 0 1 60,28"
          fill="none"
          stroke={c.handle}
          strokeWidth="6.5"
          strokeLinecap="round"
        />
        {/* soft duffel body in a shoe profile */}
        <path
          d="M8,68 C6,54 8,40 16,34 C24,28 36,25 48,25 C58,25 64,29 68,36 C74,46 82,52 90,56 C96,59 97,64 96,68 Z"
          fill={c.upper}
        />
        {/* zip seam along the instep, with pull */}
        <path
          d="M18,42 C28,35 40,32.5 54,34"
          fill="none"
          stroke={c.seam}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="0.5 6"
        />
        <circle cx="58" cy="35.5" r="4" fill={c.latch} stroke={c.seam} strokeWidth="1.8" />
        {/* laces on the vamp */}
        <g stroke={c.lace} strokeWidth="3.2" strokeLinecap="round">
          <line x1="62" y1="44" x2="70" y2="39.5" />
          <line x1="68" y1="50" x2="76" y2="45.5" />
        </g>
        {/* chunky outsole */}
        <rect x="6" y="70.5" width="92" height="12" rx="6" fill={c.sole} />
      </svg>
    </span>
  );
}

function LogoMark({ kind, ...props }: LogoProps) {
  if (kind === "a") return <CaseMark {...props} />;
  if (kind === "b") return <SprintMark {...props} />;
  if (kind === "c") return <PaceMark {...props} />;
  if (kind === "d") return <WrenchMark {...props} />;
  if (kind === "e") return <SocketMark {...props} />;
  if (kind === "f") return <HexMark {...props} />;
  return <DuffelMark {...props} />;
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
          <h1>Seven ways to weld tool to shoe.</h1>
          <p>
            All seven keep the current blue, orange, lime, cream, and ink palette. Directions 01–03 are
            Codex&rsquo;s; 04–07 are Claude&rsquo;s—07 is a direct answer to the front-runner: the case
            concept, minus the box.
          </p>
        </div>
        <div className={styles.reviewStamp} aria-label="Design review">
          <span>Design</span>
          <strong>Review</strong>
          <small>7 directions</small>
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
            <span className={styles.directionLabel}>
              {selected.label} direction
              <span className={`${styles.authorChip} ${selected.author === "claude" ? styles.chipClaude : styles.chipCodex}`}>
                {selected.author}
              </span>
            </span>
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
                <span>
                  {option.label}
                  <span className={`${styles.authorChip} ${option.author === "claude" ? styles.chipClaude : styles.chipCodex}`}>
                    {option.author}
                  </span>
                </span>
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
