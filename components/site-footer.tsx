import Link from "next/link";
import BrandMark from "@/components/brand-mark";

const COLUMNS = [
  {
    title: "Tools",
    links: [
      { href: "/tools/shoe-selector", label: "Shoe Finder" },
      { href: "/tools/music", label: "Music Finder" },
      { href: "/tools/fueling", label: "Fuel Finder" },
      { href: "/tools/pace-calculator", label: "Pace Calculator" }
    ]
  },
  {
    title: "Browse",
    links: [
      { href: "/shoes", label: "Every running shoe" },
      { href: "/shoes/best", label: "Best shoes by need" },
      { href: "/music", label: "Running songs" },
      { href: "/fuel", label: "Gels, chews and drink mix" },
      { href: "/rundown", label: "Guides" }
    ]
  },
  {
    title: "Runner Toolkit",
    links: [
      { href: "/methodology", label: "How it works" },
      { href: "/about", label: "About" },
      { href: "/credits", label: "Photo credits" },
      { href: "mailto:hello@runnertoolkit.com", label: "Contact" }
    ]
  }
];

export default function SiteFooter() {
  return (
    <footer className="rt-footer">
      <div className="container rt-footer-grid">
        <div className="rt-footer-intro">
          <BrandMark />
          <p className="rt-footer-tag">See you at the start line.</p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title} className="rt-footer-col">
            <strong>{col.title}</strong>
            {col.links.map((link) =>
              link.href.startsWith("mailto:") ? (
                <a key={link.href} href={link.href}>{link.label}</a>
              ) : (
                <Link key={link.href} href={link.href}>{link.label}</Link>
              )
            )}
          </div>
        ))}
      </div>
      <div className="container rt-footer-bottom">
        <span>© 2026 Runner Toolkit</span>
        <span>
          <Link href="/privacy">Privacy</Link> · <Link href="/terms">Terms</Link>
        </span>
      </div>
    </footer>
  );
}
