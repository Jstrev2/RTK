/** A race bib: four safety pins and the site's initials. */
export default function BrandMark() {
  return (
    <svg className="brand-bib" viewBox="0 0 48 38" aria-hidden="true">
      <rect x="1" y="1" width="46" height="36" rx="5" fill="#d4ff2a" stroke="#121212" strokeWidth="2" />
      <circle cx="7" cy="7" r="2" fill="#121212" />
      <circle cx="41" cy="7" r="2" fill="#121212" />
      <circle cx="7" cy="31" r="2" fill="#121212" />
      <circle cx="41" cy="31" r="2" fill="#121212" />
      <text x="24" y="26" textAnchor="middle" fontFamily="var(--font-display), sans-serif" fontWeight="900" fontSize="17" fill="#121212" style={{ fontStretch: "125%" }}>
        RT
      </text>
    </svg>
  );
}
