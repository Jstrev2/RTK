import Link from "next/link";

const toolLinks = [
  { href: "/tools/shoe-selector", label: "Shoe Finder" },
  { href: "/tools/pace-calculator", label: "Pace Calculator" },
  { href: "/tools/music", label: "Running Music" },
  { href: "/tools/fueling", label: "Fueling Planner" },
  { href: "/tools/attire-guide", label: "Attire Guide" },
  { href: "/tools/training-plans", label: "Training Plans" }
];

export default function SiteFooter() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="stack">
          <div className="brand">
            <span className="brand-mark">RT</span>
            <span>Runner Toolkit</span>
          </div>
          <p>
            Free tools for the everyday miles. A premium plan for the day
            something snaps.
          </p>
          <span className="pill">Get back to the start line</span>
        </div>
        <div className="stack">
          <strong>Free tools</strong>
          {toolLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </div>
        <div className="stack">
          <strong>Explore</strong>
          <Link href="/premium">Premium — the comeback plan</Link>
          <Link href="/rundown">The Rundown</Link>
          <Link href="/#tools">All tools</Link>
          <Link href="/#how-it-works">How it works</Link>
        </div>
        <div className="stack">
          <strong>Get in touch</strong>
          <span>hello@runnertoolkit.com</span>
          <span>Boston, MA</span>
        </div>
      </div>
      <div className="container" style={{ marginTop: "32px" }}>
        <div className="divider" />
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <span>© 2026 Runner Toolkit. All rights reserved.</span>
          <span>Your plan broke you. Ours will get you back.</span>
        </div>
      </div>
    </footer>
  );
}
