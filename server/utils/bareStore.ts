// A MESSAGE THAT IS JUST A STORE ("Gymshark", "gym shark", "muéstrame Alo", "algo de Old Navy") asks to see that store.
// Left to the prompt, the model answered "Gymshark" with a pitch about shipping and Mexican cards and a question, and
// no products (Alex, 2026-09-28). The chat now makes a product tool mandatory for it (assistant.post.ts prepareStep).
// Pure; tested in bareStore.test.mjs.

const FILLER = new Set(['muestrame', 'muestra', 'ensename', 'ver', 'veamos', 'quiero', 'busco', 'algo', 'cosas', 'productos',
  'de', 'del', 'en', 'la', 'el', 'los', 'las', 'tienda', 'store', 'que', 'hay', 'tienes', 'tienen', 'traes', 'me', 'a', 'ver',
  'lo', 'nuevo', 'mejor', 'porfa', 'por', 'favor', 'please', 'show', 'shop', 'some', 'stuff', 'from', 'y', 'e', 'hola', 'oye'])
const fold = (s: string) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const compact = (s: string) => fold(s).replace(/[^a-z0-9]+/g, '')

export interface StoreRef { id: string, name?: string | null }

/** PURE. The carried store the message is only about (its display name), or null. */
export function bareStoreAsk(text: string, stores: StoreRef[]): string | null {
  const t = fold(text).replace(/https?:\/\/\S+/g, ' ')
  if (!t.trim() || /https?:/.test(String(text))) return null
  const words = t.split(/[^a-z0-9&']+/).filter(Boolean)
  if (!words.length || words.length > 7) return null
  const rest = words.filter((w) => !FILLER.has(w))
  if (!rest.length || rest.length > 4) return null
  const said = compact(rest.join(''))
  if (said.length < 3) return null
  for (const s of stores || []) {
    const name = s?.name || s?.id
    const keys = [s?.name, s?.id].filter(Boolean).map((k) => compact(String(k)))
    if (keys.some((k) => k.length >= 3 && k === said)) return String(name)
  }
  return null
}
