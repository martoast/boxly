// A live search's gallery arrives with no assistant reply, so when none of the shown products
// carries a word the shopper named (live 2026-10-14: "Breville Spiral Luxe" → Grind Control,
// Smart Kettle Luxe), the chat says so itself instead of passing look-alikes off as the item.
const SKIP = new Set(['the', 'and', 'for', 'con', 'para', 'del', 'los', 'las', 'una', 'uno', 'de', 'en', 'el', 'la', 'y', 'with', 'of'])

function words(s: string): string[] {
  return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[™®©]/g, ' ').split(/[^a-z0-9]+/).filter((w) => w.length >= 3 && !SKIP.has(w))
}

/** The query's words that no shown title contains; empty when every word is somewhere. */
export function missingQueryWords(query: string, titles: string[]): string[] {
  const shown = new Set(titles.flatMap(words))
  return [...new Set(words(query))].filter((w) => !shown.has(w) && !shown.has(w.replace(/s$/, '')) && !shown.has(w + 's'))
}

/** Only a named product counts (2+ words, one of them missing everywhere); a generic search ("tenis") never warns. */
export function notExactly(query: string, titles: string[]): boolean {
  if (!titles.length || words(query).length < 2) return false
  return missingQueryWords(query, titles).length > 0
}
