"use client";

import { useState } from "react";
import Link from "next/link";
import AuthActions from "@/components/auth-actions";

const navItems = [
  { href: "/tools/shoe-selector", label: "Shoes" },
  { href: "/tools/pace-calculator", label: "Pace" },
  { href: "/tools/music", label: "Music" },
  { href: "/tools/fueling", label: "Fueling" },
  { href: "/tools/training-plans", label: "Training" },
  { href: "/rundown", label: "Rundown" }
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
            <div className="brand-sub">runnertoolkit.com</div>
          </span>
        </Link>
        <nav className={`nav ${menuOpen ? "nav-open" : ""}`}>
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>
              {item.label}
            </Link>
          ))}
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
