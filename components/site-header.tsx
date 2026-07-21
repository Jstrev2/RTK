"use client";

import { useState } from "react";
import Link from "next/link";
import AuthActions from "@/components/auth-actions";

const toolItems = [
  { href: "/tools/shoe-selector", label: "Shoes" },
  { href: "/tools/music", label: "Music" },
  { href: "/tools/fueling", label: "Fuel" }
];

const trainingItems = [
  { href: "/tools/training-plans", label: "Free plans" },
  { href: "/premium", label: "Adapt my plan", cta: true }
];

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="container site-header-inner">
        <Link href="/" className="brand" onClick={() => setMenuOpen(false)}>
          <span className="brand-mark">RT</span>
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
            <span className="nav-cluster-label">Training</span>
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
