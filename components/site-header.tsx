"use client";

import { useState } from "react";
import Link from "next/link";
import AuthActions from "@/components/auth-actions";
import BrandMark from "@/components/brand-mark";

const toolItems = [
  { href: "/tools/shoe-selector", label: "Shoe Finder" },
  { href: "/tools/music", label: "Music Finder" },
  { href: "/tools/fueling", label: "Fuel Finder" }
];

const trainingItems = [
  { href: "/shoes/best", label: "Best shoes" },
  { href: "/music", label: "Songs by BPM" },
  { href: "/fuel", label: "Fuel plans" },
  { href: "/rundown", label: "Guides", cta: true }
];

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="container site-header-inner">
        <Link href="/" className="brand" onClick={() => setMenuOpen(false)}>
          <BrandMark />
          <span>
            Runner Toolkit
            <div className="brand-sub">Run smarter. Guess less.</div>
          </span>
        </Link>
        <nav className={`nav ${menuOpen ? "nav-open" : ""}`} aria-label="Primary navigation">
          <div className="nav-cluster">
            <span className="nav-cluster-label">Tools</span>
            <div className="nav-cluster-links">
              {toolItems.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <span className="nav-separator" aria-hidden="true" />
          <div className="nav-cluster nav-cluster-training">
            <span className="nav-cluster-label">Read</span>
            <div className="nav-cluster-links">
              {trainingItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={item.cta ? "nav-cta" : undefined}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="nav-auth-mobile">
            <AuthActions />
          </div>
        </nav>
        <div className="header-actions">
          <AuthActions />
          <button
            type="button"
            className="hamburger"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span className={`hamburger-bar ${menuOpen ? "open" : ""}`} />
            <span className={`hamburger-bar ${menuOpen ? "open" : ""}`} />
            <span className={`hamburger-bar ${menuOpen ? "open" : ""}`} />
          </button>
        </div>
      </div>
    </header>
  );
}
