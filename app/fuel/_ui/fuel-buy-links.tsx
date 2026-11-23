"use client";

import { trackEvent } from "@/lib/analytics";
import { getFuelRetailerLinks } from "@/lib/affiliate";
import styles from "../fuel.module.css";

type Props = {
  name: string;
  brand: string;
  label: string;
  disclosure?: boolean;
};

export default function FuelBuyLinks({ name, brand, label, disclosure = true }: Props) {
  const links = getFuelRetailerLinks({ name, brand });
  return (
    <div className={styles.buy}>
      <div className={styles.buyRow}>
        {links.map((link) => (
          <a
            key={link.retailer}
            className="btn btn-secondary btn-sm"
            href={link.url}
            target="_blank"
            rel="sponsored noopener noreferrer"
            onClick={() => trackEvent("buy_link_click", { retailer: link.retailer, product: label, brand })}
          >
            Check price at {link.label}
          </a>
        ))}
      </div>
      {disclosure ? (
        <p className={styles.disclosure}>
          Runner Toolkit may earn a commission when you buy through these links. It never
          changes the price you pay or the numbers on this page.
        </p>
      ) : null}
    </div>
  );
}
