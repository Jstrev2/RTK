import type { FuelProduct } from "@/lib/fueling";

/** The 360px grid copy of a stored product photo (see lib/fuel-images.ts). */
export const thumbOf = (url: string) => url.replace("/site-images/fuel/", "/site-images/fuel/thumb/");

const initials = (brand: string) =>
  brand
    .replace(/&/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

/** A product's official photo, or its brand initials when there is none yet. */
export default function FuelPhoto({
  product,
  size = "thumb",
  className,
  eager = false
}: {
  product: Pick<FuelProduct, "imageUrl" | "brand" | "display">;
  size?: "thumb" | "full";
  className?: string;
  eager?: boolean;
}) {
  if (!product.imageUrl) {
    return (
      <span className={className} aria-hidden="true">
        <span className="bib-photo-fallback">{initials(product.brand)}</span>
      </span>
    );
  }
  return (
    // Photos are already sized and compressed WebP in Supabase Storage.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={className}
      src={size === "thumb" ? thumbOf(product.imageUrl) : product.imageUrl}
      alt={product.display}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
    />
  );
}
