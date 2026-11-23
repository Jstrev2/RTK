"use client";

import { trackEvent } from "@/lib/analytics";
import { getFuelRetailerLinks } from "@/lib/affiliate";
import s from "../fuel.module.css";

type Props = {
  name: string;
  brand: string;
  label: string;
  brandUrl?: string;
};

// "GU store" only when the link is the brand's own site (a few brands sell in the US only through a retailer).
const isBrandSite = (url: string, brand: string) => {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    const word = brand
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .split(/[^a-z0-9]+/)[0];
    return Boolean(word) && host.includes(word);
  } catch {
    return false;
  }
};

/** The brand's own page first, then retailers. */
export default function FuelBuyLinks({ name, brand, label, brandUrl }: Props) {
  const links = getFuelRetailerLinks({ name, brand });
  return (
    <div className={s.buy}>
      {brandUrl ? (
        <a
          className="btn btn-flare btn-sm"
          href={brandUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEvent("buy_link_click", { retailer: "brand", product: label, brand })}
        >
          {isBrandSite(brandUrl, brand) ? `${brand} store` : "Product page"}
        </a>
      ) : null}
      {links.map((link) => (
        <a
          key={link.retailer}
          className="btn btn-sm"
          href={link.url}
          target="_blank"
          rel="sponsored noopener noreferrer"
          onClick={() => trackEvent("buy_link_click", { retailer: link.retailer, product: label, brand })}
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}
