type JsonLdProps = {
  data: Record<string, unknown>;
};

/**
 * Emits a JSON-LD script tag. JSON.stringify does not escape "<", so a DB
 * value containing "</script>" would otherwise break out of the tag; every
 * "<" is emitted as <, which is valid JSON and inert in HTML.
 */
export default function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c")
      }}
    />
  );
}
