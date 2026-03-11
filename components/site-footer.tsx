import Link from "next/link";

const toolLinks = [
  { href: "/tools/shoe-selector", label: "Shoe Selector" },
  { href: "/tools/music", label: "Music Tools" },
  { href: "/tools/fueling", label: "Fueling" },
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
            The free toolkit for runners who want both joy and results.
          </p>
          <span className="pill">Built for real-world training</span>
        </div>
        <div className="stack">
          <strong>Tools</strong>
          {toolLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </div>
        <div className="stack">
          <strong>Explore</strong>
          <Link href="/#tools">All tools</Link>
          <Link href="/rundown">The Rundown</Link>
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
          <span>Free tools. Real results.</span>
        </div>
      </div>
    </footer>
  );
}
