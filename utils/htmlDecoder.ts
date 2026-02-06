
/**
 * Decodes HTML entities in a string to their corresponding characters.
 * 
 * Examples:
 * - &#8217; → '
 * - &amp; → &
 * - &quot; → "
 * - &lt; → <
 * - &gt; → >
 * 
 * @param html - String containing HTML entities
 * @returns Decoded string with normal characters
 */
export function decodeHtmlEntities(html: string): string {
  if (!html) return '';
  
  return html
    // Decode numeric entities (e.g., &#8217;, &#039;)
    .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
    // Decode hex entities (e.g., &#x27;)
    .replace(/&#x([0-9A-Fa-f]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)))
    // Decode named entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&hellip;/g, '…')
    .trim();
}
