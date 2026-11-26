const JSON_LD_ESCAPES: Record<string, string> = {
  '<': '\\u003c',
  '>': '\\u003e',
  '&': '\\u0026',
  '\u2028': '\\u2028',
  '\u2029': '\\u2029',
}

/**
 * Serialize JSON-LD for the content of a `<script type="application/ld+json">` element.
 *
 * Characters that could end the script element (e.g. `</script>` in text from a CMS or a user) are written as
 * unicode escape sequences, which JSON parsers read as the same characters.
 */
export function serializeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/[<>&\u2028\u2029]/g, (char) => JSON_LD_ESCAPES[char] ?? char)
}
