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

// A NEW iPHONE ASKED FOR, NO PHONE SHOWN (live 2026-11-02: "iPhone 18 Pro Max" at Walmart lists it only with a carrier plan — those cards
// are dropped — so the gallery was all cases): the chat says where the unlocked phone is bought instead of leaving cases as the answer.
const NOT_A_PHONE = /\b(?:case|cover|funda|screen protector|protector|charger|cargador|cable|adapter|stand|mount|holder|wallet|skin|lens protector|magsafe charger|band|strap)\b/i
export function iphoneNotListed(query: string, titles: string[]): boolean {
  if (!/\biphone\s*\d{2}\b/i.test(String(query || '')) || /\b(?:case|funda|cover|charger|cargador|protector)\b/i.test(String(query || ''))) return false
  return titles.length > 0 && titles.every((t) => NOT_A_PHONE.test(String(t || '')))
}
