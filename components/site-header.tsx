"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AuthActions from "@/components/auth-actions";
import BrandMark from "@/components/brand-mark";
import SiteSearch from "@/components/site-search";

const NAV = [
  { href: "/shoes", label: "Shoes", match: ["/shoes", "/tools/shoe-selector"] },
  { href: "/tools/music", label: "Music", match: ["/tools/music", "/music"] },
  { href: "/tools/fueling", label: "Fuel", match: ["/tools/fueling", "/fuel"] },
  { href: "/rundown", label: "Guides", match: ["/rundown"] }
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() ?? "/";
  const close = () => setOpen(false);

  return (
    <header className="rt-header">
      <div className="container rt-header-inner">
        <Link href="/" className="rt-brand" onClick={close}>
          <BrandMark />
          <span>Runner<br />Toolkit</span>
        </Link>

        <nav className={`rt-nav${open ? " is-open" : ""}`} aria-label="Main">
          {NAV.map((item) => {
            const active = item.match.some((m) => pathname === m || pathname.startsWith(m + "/"));
            return (
              <Link key={item.href} href={item.href} className={active ? "is-active" : undefined} onClick={close}>
                {item.label}
              </Link>
            );
          })}
          <div className="rt-nav-search">
            <SiteSearch onNavigate={close} />
          </div>
          <div className="rt-nav-auth">
            <AuthActions />
          </div>
        </nav>

        <div className="rt-header-search">
          <SiteSearch />
        </div>
        <div className="rt-header-auth">
          <AuthActions />
        </div>
        <button
          type="button"
          className="rt-burger"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  );
}
