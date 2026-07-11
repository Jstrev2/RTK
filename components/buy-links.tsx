import { getRetailerLinks } from "@/lib/affiliate";

type Props = {
  name: string;
  brand: string;
  compact?: boolean;
};

export default function BuyLinks({ name, brand, compact }: Props) {
  const links = getRetailerLinks({ name, brand });

  if (compact) {
    return (
      <div className="buy-links-compact">
        {links.slice(0, 2).map((link) => (
          <a
            key={link.retailer}
            className="btn btn-xs btn-secondary"
            href={link.url}
            target="_blank"
            rel="sponsored noopener noreferrer"
          >
            {link.label}
          </a>
        ))}
      </div>
    );
  }

  return (
    <div className="stack">
      <strong>Shop this shoe</strong>
      <div className="tag-grid">
        {links.map((link) => (
          <a
            key={link.retailer}
            className="btn btn-secondary"
            href={link.url}
            target="_blank"
            rel="sponsored noopener noreferrer"
          >
            Check price at {link.label}
          </a>
        ))}
      </div>
      <p className="brand-sub">
        Runner Toolkit may earn a commission when you buy through these links.
        It never affects the price you pay or which shoes we recommend.
      </p>
    </div>
  );
}
