import Link from "next/link";
import BrandMark from "@/components/brand-mark";

const toolLinks = [
  { href: "/tools/shoe-selector", label: "Shoe Finder" },
  { href: "/shoes", label: "Shoe Database" },
  { href: "/tools/music", label: "Running Music" },
  { href: "/tools/fueling", label: "Fuel Planner" },
  { href: "/tools/pace-calculator", label: "Pace Calculator" },
  { href: "/tools/attire-guide", label: "What to Wear Running" }
];

export default function SiteFooter() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-intro">
          <div className="brand">
            <BrandMark />
            <span>Runner Toolkit</span>
          </div>
          <p>Better decisions before, during, and between the miles.</p>
          <strong>Run smarter. Guess less.</strong>
        </div>
        <div className="stack">
          <strong>Tools</strong>
          {toolLinks.map((link) => (
            <Link key={link.href} href={link.href}>{link.label}</Link>
          ))}
        </div>
        <div className="stack">
          <strong>Training</strong>
          <Link href="/tools/training-plans">Free training plans</Link>
          <Link href="/premium">Adaptive Training</Link>
          <Link href="/rundown">Runner Guides</Link>
        </div>
        <div className="stack">
          <strong>Trust</strong>
          <Link href="/methodology">How recommendations work</Link>
          <Link href="/about">About Runner Toolkit</Link>
          <a href="mailto:hello@runnertoolkit.com">Contact</a>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© 2026 Runner Toolkit</span>
        <div>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <span>Boston, MA</span>
        </div>
      </div>
    </footer>
  );
}
