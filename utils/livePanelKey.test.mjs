/**
 * The live panel's identity must not depend on its POSITION.
 *
 * LiveShoppingPanel owns a live SSE connection, a ticket-refresh schedule and an
 * AbortController. The widgets loop in ShoppingAssistant.vue used to key parts by
 * array index, so a part inserted or reordered ahead of it during a streaming
 * turn shifted its key and Vue unmounted and remounted the same live session —
 * stopping the controller mid-stream. That is an abort with the page still open,
 * which is exactly the signature that cost a long investigation.
 *
 * This does not re-implement the rule: it extracts the SHIPPED `partKey` from
 * the component source and runs it, so the test fails if the real function
 * changes or disappears.
 *
 *   node --experimental-strip-types utils/livePanelKey.test.mjs
 */
import { readFileSync } from 'node:fs'

let pass = 0
let fail = 0
const check = (name, cond, detail = '') => {
  if (cond) { pass++ } else { fail++; console.error(`FAIL ${name}${detail ? ` — ${detail}` : ''}`) }
}

const src = readFileSync(new URL('../components/ShoppingAssistant.vue', import.meta.url), 'utf8')

// ── the loop that renders the panel must not be index-keyed ────────────────
const widgetsLoop = (src.match(/<template v-for="\(part, i\) in m\.parts" :key="([^"]+)">/g) || [])
check('widgets loop found', widgetsLoop.length >= 1, JSON.stringify(widgetsLoop))
check('the panel-bearing loop is keyed by partKey, not by index', src.includes(`:key="partKey(part, i)"`), JSON.stringify(widgetsLoop))
check('LiveShoppingPanel still lives in that loop', src.includes('LazyLiveShoppingPanel'))

// ── extract and run the REAL partKey ──────────────────────────────────────
const fn = src.match(/function partKey\(part, i\) \{([\s\S]*?)\n\}/)
check('partKey extracted from the component', !!fn)
const partKey = new Function('part', 'i', fn[1])

const verify = { type: 'tool-live_verify', toolCallId: 'call_flVWEgbFEq8AqLjZzsHWNVW0', state: 'output-available' }
const text = (t) => ({ type: 'text', text: t })
const keysOf = (parts) => parts.map((p, i) => partKey(p, i))

// The exact hazard: a part appears BEFORE the live one mid-turn.
const before = [text('a'), verify]
const afterInsert = [text('a'), text('inserted'), verify]
const keyBefore = partKey(verify, before.indexOf(verify))
const keyAfterInsert = partKey(verify, afterInsert.indexOf(verify))
check('key is UNCHANGED when a part is inserted ahead of the panel', keyBefore === keyAfterInsert, `${keyBefore} vs ${keyAfterInsert}`)

// Reordering must not remount it either.
const reordered = [verify, text('a')]
check('key is UNCHANGED when parts are reordered', partKey(verify, reordered.indexOf(verify)) === keyBefore)

// Two live parts in one message must stay distinct, or Vue would fuse them.
const twoLive = [{ ...verify }, { ...verify, toolCallId: 'call_second' }]
const twoKeys = keysOf(twoLive)
check('two live parts get DISTINCT keys', twoKeys[0] !== twoKeys[1], JSON.stringify(twoKeys))

// Stateless parts still need unique keys, and the fallback must never be able
// to collide with a real toolCallId.
const mixed = [text('a'), text('b'), verify]
const mixedKeys = keysOf(mixed)
check('all keys in a mixed message are unique', new Set(mixedKeys).size === mixedKeys.length, JSON.stringify(mixedKeys))
check('index fallback is namespaced away from tool ids', partKey(text('a'), 0) !== partKey({ toolCallId: '0' }, 99))
check('a part whose toolCallId is an empty string falls back, not to a blank key', partKey({ toolCallId: '' }, 3) === partKey({}, 3) && !!partKey({ toolCallId: '' }, 3))
check('a non-string toolCallId does not become "[object Object]"', !String(partKey({ toolCallId: { x: 1 } }, 2)).includes('object'))

// The persisted gallery part carries NO toolCallId by contract; it must still
// key stably by position without colliding with anything.
const results = { type: 'tool-live_results', state: 'output-available', output: { products: [] } }
check('persisted tool-live_results (no toolCallId) still gets a usable key', !!partKey(results, 1) && partKey(results, 1) !== partKey(results, 2))

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
