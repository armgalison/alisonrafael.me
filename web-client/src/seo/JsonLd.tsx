// Structured data for search engines, rendered as a plain <script> (not
// next/script — it's data, not code). `<` is escaped so a string field can
// never close the tag early. See node_modules/next/dist/docs/01-app/02-guides/json-ld.md.
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  )
}
