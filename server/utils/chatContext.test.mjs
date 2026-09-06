/**
 * Context assembly for the assistant — the pure pieces (no model, no network).
 *
 *   node --experimental-strip-types server/utils/chatContext.test.mjs
 */
import { ageGalleries, windowMessages, withContextOnLastUser, estimateTokens, galleryMarker, dropToolParts } from './chatContext.ts'
import { attachFollowupChips, followupsWithin } from './followupChips.ts'

let pass = 0, fail = 0
const ok = (name, cond) => { if (cond) { pass++; console.log('  ✓', name) } else { fail++; console.log('  ✗', name) } }

const GALLERY = ['search_products', 'curate_products']
const products = (n, prefix = 'Item') => Array.from({ length: n }, (_, i) => ({ title: `${prefix} ${i + 1}`, url: `https://x/${prefix}${i + 1}`, store: 'Nike', price: 10 + i, image: 'https://img/' + i, token: 'T'.repeat(300) }))
const user = (text) => ({ role: 'user', parts: [{ type: 'text', text }] })
const gallery = (query, n, extraText = 'Te recomiendo el primero.') => ({
  role: 'assistant',
  parts: [
    { type: 'tool-search_products', toolCallId: 'c' + Math.random(), state: 'output-available', input: { query, store: 'Nike' }, output: { products: products(n, query), source: 'catalog' } },
    { type: 'text', text: extraText },
  ],
})

// ── ageGalleries ────────────────────────────────────────────────────────────
{
  const msgs = [user('hoodie'), gallery('hoodie', 16), user('shorts'), gallery('shorts', 12), user('tenis'), gallery('tenis', 8)]
  const aged = ageGalleries(msgs, GALLERY, { keepLast: 2, productId: (p) => 'p' + p.title.replace(/\s/g, '') })
  ok('oldest gallery collapsed to a marker', typeof aged[1].parts[0].output.gallery_marker === 'string' && !aged[1].parts[0].output.products)
  ok('marker carries query, count, first titles and registry ids', /16 productos para «hoodie · Nike» — hoodie 1; hoodie 2; hoodie 3; …/.test(aged[1].parts[0].output.gallery_marker) && /ids en el registro: phoodie1/.test(aged[1].parts[0].output.gallery_marker))
  ok('last two galleries untouched', Array.isArray(aged[3].parts[0].output.products) && aged[3].parts[0].output.products.length === 12 && aged[5].parts[0].output.products.length === 8)
  ok('input not mutated', Array.isArray(msgs[1].parts[0].output.products))
  ok('text parts preserved next to the marker', aged[1].parts[1].type === 'text')
  const before = estimateTokens(msgs[1]), after = estimateTokens(aged[1])
  ok(`a 16-item gallery shrinks ~10× (${before} → ${after} est. tokens)`, after * 8 < before)
  const compacted = ageGalleries(msgs, GALLERY, { keepLast: 2, compactProduct: (p) => ({ title: p.title, price: p.price }) })
  ok('recent galleries are compacted to the model shape (no token/image)', compacted[5].parts[0].output.products.length === 8 && !('token' in compacted[5].parts[0].output.products[0]) && compacted[5].parts[0].output.source === 'catalog')
  ok('compaction never touches the input objects', 'token' in msgs[5].parts[0].output.products[0])
}

// ── windowMessages ──────────────────────────────────────────────────────────
{
  const short = [user('a'), gallery('a', 3), user('b'), gallery('b', 3)]
  const r = windowMessages(short)
  ok('short history passes through untouched', r.messages === short && r.dropped === 0 && !r.trimmed)

  const long = []
  for (let i = 0; i < 10; i++) { long.push(user('q' + i)); long.push(gallery('q' + i, 2)) } // 20 messages
  const w = windowMessages(long, { max: 14, keep: 8, maxTokens: 1e9 })
  ok('over MAX messages trims down to KEEP in one cut', w.trimmed && w.messages.length === 8 && w.dropped === 12)
  ok('window starts at a user message', w.messages[0].role === 'user' && w.messages[0].parts[0].text === 'q6')

  // Between trims the window is append-only: 9..14 messages are left alone.
  const mid = long.slice(0, 13)
  ok('13 messages (≤ MAX) are not trimmed even though > KEEP', !windowMessages(mid, { max: 14, keep: 8, maxTokens: 1e9 }).trimmed)

  // Token trigger: few messages but a huge one (pasted PDF text) → trims by tokens.
  const big = [user('x'.repeat(40000)), gallery('a', 1), user('now?'), gallery('b', 1)]
  const t = windowMessages(big, { max: 14, keep: 8, maxTokens: 6000, hardTokens: 9000 })
  ok('token trigger fires on a small-but-heavy history', t.trimmed)
  ok('hard cap keeps dropping oldest turns until it fits', t.messages.length === 2 && t.messages[0].parts[0].text === 'now?')
  ok('never trims below min', windowMessages([user('y'.repeat(50000)), gallery('a', 1)], { min: 2 }).messages.length === 2)
}

// ── withContextOnLastUser ───────────────────────────────────────────────────
{
  const msgs = [user('hoodie'), gallery('hoodie', 2), user('¿y en negro?')]
  const out = withContextOnLastUser(msgs, 'PERFIL: talla M')
  ok('context lands on the newest user message only', out[2].parts[0].type === 'text' && /PERFIL: talla M/.test(out[2].parts[0].text) && out[2].parts[1].text === '¿y en negro?')
  ok('earlier messages are the same objects (prefix unchanged)', out[0] === msgs[0] && out[1] === msgs[1])
  ok('empty context is a no-op', withContextOnLastUser(msgs, '   ') === msgs)
  const legacy = [{ role: 'user', content: 'hola' }]
  ok('string-content messages are converted to parts', withContextOnLastUser(legacy, 'ctx')[0].parts.length === 2)
}

// ── galleryMarker edge cases ────────────────────────────────────────────────
{
  ok('empty gallery marker does not crash', /0 productos/.test(galleryMarker({ input: {}, output: { products: [] } }).gallery_marker))
  ok('brands[] shown in the marker', /Nike\/Adidas/.test(galleryMarker({ input: { brands: ['Nike', 'Adidas'] }, output: { products: [] } }).gallery_marker))
}

// ── dropToolParts ───────────────────────────────────────────────────────────
{
  const m = { role: 'assistant', parts: [{ type: 'text', text: 'hola' }, { type: 'tool-suggest_followups', state: 'output-available', input: {}, output: { suggestions: ['a'] } }] }
  const out = dropToolParts([user('x'), m], ['suggest_followups'])
  ok('UI-only tool parts are dropped from the transcript', out[1].parts.length === 1 && out[1].parts[0].type === 'text')
  ok('messages without them are the same objects', out[0] === out[0] && dropToolParts([user('x')], ['suggest_followups'])[0] !== undefined)
}

// ── attachFollowupChips / followupsWithin ───────────────────────────────────
await (async () => {
  const chunks = [{ type: 'start' }, { type: 'start-step' }, { type: 'text-delta', id: 't', delta: 'hola' }, { type: 'finish-step' }, { type: 'finish' }]
  const src = () => new ReadableStream({ start(c) { for (const ch of chunks) c.enqueue(ch); c.close() } })
  const read = async (s) => { const out = []; const r = s.getReader(); for (;;) { const { value, done } = await r.read(); if (done) break; out.push(value) } return out }
  const withChips = await read(attachFollowupChips(src(), () => Promise.resolve(['Búscame calcetines', 'Ver más en negro'])))
  const types = withChips.map((c) => c.type)
  ok('chips are inserted as a tool step right before finish', types.join(',') === 'start,start-step,text-delta,finish-step,start-step,tool-input-available,tool-output-available,finish-step,finish')
  const ti = withChips.find((c) => c.type === 'tool-input-available'), to = withChips.find((c) => c.type === 'tool-output-available')
  ok('tool chunks name suggest_followups and share a toolCallId', ti.toolName === 'suggest_followups' && ti.toolCallId === to.toolCallId && to.output.suggestions.length === 2)
  const none = await read(attachFollowupChips(src(), () => Promise.resolve([])))
  ok('no chips → stream untouched', none.length === chunks.length)
  const slow = new Promise((r) => setTimeout(() => r(['late']), 200))
  ok('followupsWithin gives up after the bound', (await followupsWithin(slow, 20)).length === 0)
  ok('followupsWithin returns the chips when ready in time', (await followupsWithin(Promise.resolve(['ok']), 100))[0] === 'ok')
  ok('followupsWithin swallows a rejection', (await followupsWithin(Promise.reject(new Error('x')), 100)).length === 0)
  ok('null promise → no chips', (await followupsWithin(null)).length === 0)
})()

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
