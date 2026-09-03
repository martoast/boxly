import assert from 'node:assert/strict'
// Pure tests for utils/liveBrowse.ts — the remote store browser's client logic.
import { keyMessageFor, mapPointer, boundMessage, parseInbound, createInputRelayController, overlayReducer, purchaseItemFor, storeCardImage, createTextBuffer, MAX_TEXT_CHARS, loaderStepsFor } from './liveBrowse.ts'

let passed = 0, failed = 0
const check = (name, ok, detail = '') => { if (ok) { passed++; console.log(`  ✓ ${name}`) } else { failed++; console.log(`  ✗ ${name} ${detail}`) } }

// keys
check('Enter → key.press', keyMessageFor({ key: 'Enter' })?.type === 'key.press')
check('printable → text.type', JSON.stringify(keyMessageFor({ key: 'a' })) === JSON.stringify({ type: 'text.type', value: 'a' }))
check('space → text.type, not a key (a query needs its spaces)', JSON.stringify(keyMessageFor({ key: ' ' })) === JSON.stringify({ type: 'text.type', value: ' ' }))
check('F5 (reload) not forwarded', keyMessageFor({ key: 'F5' }) === null)
check('ctrl+l (address bar) not forwarded', keyMessageFor({ key: 'l', ctrlKey: true }) === null)
check('ctrl+t (new tab) not forwarded', keyMessageFor({ key: 't', ctrlKey: true }) === null)
check('ctrl+c allowed with modifiers', JSON.stringify(keyMessageFor({ key: 'C', ctrlKey: true })) === JSON.stringify({ type: 'key.press', key: 'c', modifiers: ['ctrl'] }))
check('meta never forwarded', keyMessageFor({ key: 'a', metaKey: true }) === null)
check('shift+Tab carries the modifier', JSON.stringify(keyMessageFor({ key: 'Tab', shiftKey: true })?.modifiers) === '["shift"]')
check('alt+anything not forwarded', keyMessageFor({ key: 'ArrowLeft', altKey: true }) === null)

// text coalescing: a whole word typed character-by-character becomes ONE text.type, flushed ahead of the Enter
{
  const b = createTextBuffer()
  let out = []
  for (const ev of [...'running shoes'].map((ch) => ({ key: ch }))) out = out.concat(b.push(keyMessageFor(ev)))
  check('typed characters buffer — nothing is sent yet', out.length === 0 && b.pending === true)
  const withEnter = b.push(keyMessageFor({ key: 'Enter' }))
  check('typing "running shoes" then Enter → one text.type then one key.press', JSON.stringify(withEnter) === JSON.stringify([{ type: 'text.type', value: 'running shoes' }, { type: 'key.press', key: 'Enter', modifiers: [] }]))
  check('the buffer is empty after it flushes', b.pending === false && JSON.stringify(b.flush()) === '[]')
}
{
  const b = createTextBuffer()
  b.push({ type: 'text.type', value: 'hi' })
  check('flush() emits the buffered word as one message', JSON.stringify(b.flush()) === JSON.stringify([{ type: 'text.type', value: 'hi' }]))
  check('a non-text message with an empty buffer passes straight through', JSON.stringify(b.push({ type: 'pointer.click', button: 'left' })) === JSON.stringify([{ type: 'pointer.click', button: 'left' }]))
  // control characters are dropped and the cap chunks on flush (never a message over MAX_TEXT_CHARS)
  b.push({ type: 'text.type', value: 'a\tb' + 'x'.repeat(MAX_TEXT_CHARS) })
  const chunks = b.flush()
  check('flush chunks at MAX_TEXT_CHARS and drops control chars', chunks.every((m) => m.type === 'text.type' && m.value.length <= MAX_TEXT_CHARS) && chunks.map((m) => m.value).join('').startsWith('ab') && chunks.map((m) => m.value).join('').length === MAX_TEXT_CHARS + 2)
}

// pointer mapping (object-contain letterbox)
const rect = { left: 100, top: 50, width: 640, height: 480 } // 4:3 box for a 16:9 stream → letterboxed
const intr = { width: 1280, height: 720 }
const scale = 640 / 1280 // 0.5 → drawn 640x360, offY = 50 + 60
check('top-left of the drawn frame maps to 0,0', JSON.stringify(mapPointer(100, 110, rect, intr)) === JSON.stringify({ x: 0, y: 0 }))
check('centre maps to the centre', JSON.stringify(mapPointer(100 + 320, 110 + 180, rect, intr)) === JSON.stringify({ x: 640, y: 360 }))
check('in the letterbox band → null', mapPointer(300, 60, rect, intr) === null)
check('outside the element → null', mapPointer(10, 10, rect, intr) === null)
check('unknown geometry → null', mapPointer(1, 1, { left: 0, top: 0, width: 0, height: 0 }, intr) === null)
void scale

// bounds
check('move out of bounds refused client-side', boundMessage({ type: 'pointer.move', x: 1280, y: 0 }, intr) === null)
check('move in bounds passes', boundMessage({ type: 'pointer.move', x: 1279, y: 719 }, intr) !== null)
check('scroll clamped to the engine bound (steps)', boundMessage({ type: 'pointer.scroll', dy: 99999 }, intr)?.dy === 10)
check('scroll zero refused', boundMessage({ type: 'pointer.scroll', dy: 0 }, intr) === null)
check('text over the cap refused', boundMessage({ type: 'text.type', value: 'x'.repeat(MAX_TEXT_CHARS + 1) }, intr) === null)
check('unknown button refused', boundMessage({ type: 'pointer.click', button: 'back' }, intr) === null)

// inbound
check('state frame parses', parseInbound('{"type":"state","controller":"agent"}')?.controller === 'agent')
check('refused frame parses', parseInbound('{"type":"refused","code":"rate_limited"}')?.code === 'rate_limited')
check('unknown code ignored', parseInbound('{"type":"refused","code":"whatever"}') === null)
check('no_media refusal parses', parseInbound('{"type":"refused","code":"no_media"}')?.code === 'no_media')
check('garbage ignored', parseInbound('nope') === null)

// controller with a fake socket
function fakeSocketFactory() {
  const sockets = []
  const connect = (url) => { const s = { url, sent: [], closed: false, send(d) { this.sent.push(JSON.parse(d)) }, close() { this.closed = true }, onopen: null, onmessage: null, onclose: null, onerror: null }; sockets.push(s); return s }
  return { connect, sockets }
}
{
  const f = fakeSocketFactory(); const states = []; const refused = []
  const c = createInputRelayController({ connect: f.connect, onState: (s) => states.push(s), onRefused: (code) => refused.push(code) })
  const ticket = { ticket: 'vt_1', inputUrl: 'wss://engine.example.com/v1/sessions/s1/input', expiresAtMs: 0, sseUrl: 'https://e/sse', whepUrl: null, iceServers: [], mediaAvailable: false }
  c.setIntrinsic(intr)
  c.start(ticket)
  const s = f.sockets[0]
  check('connects to the ticket input_url', s.url === ticket.inputUrl)
  check('nothing sent before open', c.send({ type: 'pointer.click', button: 'left' }) === false && s.sent.length === 0)
  s.onopen()
  check('FIRST frame is auth with the ticket, never in the URL', JSON.stringify(s.sent[0]) === JSON.stringify({ type: 'auth', ticket: 'vt_1' }) && !s.url.includes('vt_1'))
  check('still not open before the state frame', c.getState() === 'connecting')
  s.onmessage({ data: '{"type":"state","controller":"customer"}' })
  check('state frame → open', c.getState() === 'open')
  c.send({ type: 'pointer.move', x: 10, y: 10 }); c.send({ type: 'pointer.move', x: 20, y: 20 })
  check('moves coalesce until flush', s.sent.length === 1)
  c.flushMove()
  check('flush sends the LATEST move only', s.sent.length === 2 && s.sent[1].x === 20)
  c.send({ type: 'pointer.click', button: 'left' })
  check('click sent after flushing any pending move', s.sent[2].type === 'pointer.click')
  check('out-of-bounds move never sent', c.send({ type: 'pointer.move', x: 5000, y: 0 }) === false)
  s.onmessage({ data: '{"type":"refused","code":"rate_limited"}' })
  check('refusal surfaced, state stays open', refused[0] === 'rate_limited' && c.getState() === 'open')
  s.onmessage({ data: '{"type":"state","controller":"agent"}' })
  check('agent holds the turn → sends refused locally', c.send({ type: 'pointer.click', button: 'left' }) === false)
  s.onmessage({ data: '{"type":"state","controller":"customer"}' })
  s.onmessage({ data: '{"type":"refused","code":"session_ended"}' })
  check('session_ended → failed', c.getState() === 'failed')
  c.stop()
  check('stop closes the socket and detaches handlers', s.closed === true && s.onmessage === null && c.getState() === 'closed')
  check('state transitions recorded', JSON.stringify(states) === JSON.stringify(['connecting', 'open', 'failed', 'closed']))
}
{
  const f = fakeSocketFactory()
  const c = createInputRelayController({ connect: f.connect })
  c.start({ ticket: 'vt', inputUrl: null, expiresAtMs: 0, sseUrl: 'https://e/sse', whepUrl: null, iceServers: [], mediaAvailable: false })
  check('a ticket without input_url never opens a socket', f.sockets.length === 0 && c.getState() === 'failed')
}
{
  const f = fakeSocketFactory()
  const c = createInputRelayController({ connect: f.connect })
  const t = { ticket: 'vt', inputUrl: 'wss://e/i', expiresAtMs: 0, sseUrl: 'https://e/sse', whepUrl: null, iceServers: [], mediaAvailable: false }
  c.start(t); const first = f.sockets[0]; first.onopen(); c.start(t)
  check('restart closes the previous socket (one connection per page)', first.closed === true && f.sockets.length === 2)
  first.onmessage?.({ data: '{"type":"state","controller":"customer"}' })
  check('a stale socket cannot change state', c.getState() === 'connecting')
}

// overlay reducer
const cand = { store: 'Walmart', store_id: 'walmart', title: 'Avia 5000', url: 'https://www.walmart.com/ip/1', image: 'https://i5.walmartimages.com/x.jpg', current_price: { amount: 24, currency: 'USD' }, list_price: { amount: 27, currency: 'USD' }, availability: 'in_stock', observed_at: null }
const ev = (type, extra = {}) => ({ schemaVersion: 1, id: 'e', sessionId: 's', seq: 1, type, occurredAt: 'now', ...extra })
check('candidate shows the overlay', overlayReducer(null, ev('candidate', { candidate: cand }))?.title === 'Avia 5000')
check('candidate.cleared hides it', overlayReducer(cand, ev('candidate.cleared')) === null)
check('terminal hides it', overlayReducer(cand, ev('session.completed')) === null)
check('other events keep it', overlayReducer(cand, ev('worker.progress')) === cand)
const item = purchaseItemFor(cand)
check('purchase item carries name/url/image/price/quantity 1', item.product_name === 'Avia 5000' && item.product_url === cand.url && item.product_image_url === cand.image && item.price === 24 && item.quantity === 1)
check('purchase item notes name the live store', /Walmart/.test(item.notes || ''))
{
  const noPrice = purchaseItemFor({ ...cand, current_price: null })
  check('unknown price → price 0 and a note asking to confirm it', noPrice.price === 0 && /Precio no leído/.test(noPrice.notes || '') && /Walmart/.test(noPrice.notes || ''))
  check('known price → no confirm note', !/Precio no leído/.test(item.notes || ''))
}
check('store card image derives from the https host only', storeCardImage('https://www.walmart.com/').includes('domain=www.walmart.com'))
check('store card image refuses non-https', storeCardImage('http://x/') === null)


// Wheel → steps (the engine bounds pointer.scroll at ±10 steps; raw deltaY pixels were refused out_of_bounds).
{
  const { scrollStepsFor, MAX_SCROLL_STEPS } = await import('./liveBrowse.ts')
  assert.equal(MAX_SCROLL_STEPS, 10)
  assert.equal(scrollStepsFor(100, 0), 1, 'one pixel notch is one step')
  assert.equal(scrollStepsFor(360, 0), 4, '360 px rounds to 4 steps')
  assert.equal(scrollStepsFor(-120, 0), -1, 'direction is kept')
  assert.equal(scrollStepsFor(20, 0), 1, 'a small delta is still one step')
  assert.equal(scrollStepsFor(5000, 0), 10, 'clamped to the engine bound')
  assert.equal(scrollStepsFor(3, 1), 1, 'three lines are one notch')
  assert.equal(scrollStepsFor(-1, 2), -10, 'a page is the maximum')
  assert.equal(scrollStepsFor(0, 0), 0)
  assert.equal(scrollStepsFor(Number.NaN, 0), 0)
  console.log('ok   scrollStepsFor: pixels/lines/pages → ±1..10 steps')
}

// Keyboard details (Alex's acceptance): IME composition, held-key repeats, paste chunking.
const check_eq = (a, b, label = '') => check(label || JSON.stringify([a, b]), a === b)
const check_deep = (a, b, label = '') => check(label || JSON.stringify([a, b]), JSON.stringify(a) === JSON.stringify(b))
{
  const { textChunks, shouldForwardKeydown, MAX_TEXT_CHARS } = await import('./liveBrowse.ts')
  check_deep(textChunks('running shoes'), ['running shoes'])
  check_deep(textChunks('a' + String.fromCharCode(10) + 'b' + String.fromCharCode(9) + 'c d'), ['abc d'], 'control characters are dropped')
  check_deep(textChunks(''), [])
  const long = 'x'.repeat(MAX_TEXT_CHARS * 2 + 5)
  check_deep(textChunks(long).map((c) => c.length), [MAX_TEXT_CHARS, MAX_TEXT_CHARS, 5], 'a paste is chunked to the engine bound')
  check_eq(shouldForwardKeydown({ key: 'a' }), true)
  check_eq(shouldForwardKeydown({ key: 'a', repeat: true }), false, 'a held printable key does not flood')
  check_eq(shouldForwardKeydown({ key: 'Backspace', repeat: true }), true, 'held Backspace still deletes')
  check_eq(shouldForwardKeydown({ key: 'ArrowLeft', repeat: true }), true)
  check_eq(shouldForwardKeydown({ key: 'a', isComposing: true }), false, 'composition keystrokes wait for compositionend')
  check_eq(shouldForwardKeydown({ key: 'Process', keyCode: 229 }), false)
  check_eq(shouldForwardKeydown({ key: 'Dead' }), false)
  console.log('ok   keyboard details: textChunks + shouldForwardKeydown')
}

// b2: the document-level keydown forwarder targets only the video, body or root (a lost focus).
{
  const { documentKeydownForwardable } = await import('./liveBrowse.ts')
  const video = { tagName: 'VIDEO' }
  check('forwards from the video itself', documentKeydownForwardable(video, video) === true)
  check('forwards from the body (focus fell off)', documentKeydownForwardable({ tagName: 'BODY' }, video) === true)
  check('forwards from the html root', documentKeydownForwardable({ tagName: 'html' }, video) === true)
  check('does NOT forward from a real input', documentKeydownForwardable({ tagName: 'INPUT' }, video) === false)
  check('does NOT forward from a button', documentKeydownForwardable({ tagName: 'BUTTON' }, video) === false)
  check('null target or no video → false', documentKeydownForwardable(null, video) === false && documentKeydownForwardable(video, null) === false)
}


// staged loader (each step from a real signal, never a timer)
{
  const st = (i, n) => loaderStepsFor(i, n).map((s) => s.state).join(',')
  check('creating → session active, rest pending', st({ stage: 'creating', mediaState: 'pending', viewerState: 'idle' }) === 'active,pending,pending')
  check('live + media pending → media active', st({ stage: 'live', mediaState: 'pending', viewerState: 'idle' }) === 'done,active,pending')
  check('media ready + viewer connecting → video active', st({ stage: 'live', mediaState: 'ready', viewerState: 'connecting' }) === 'done,done,active')
  check('playing → all done', st({ stage: 'live', mediaState: 'ready', viewerState: 'playing' }) === 'done,done,done')
  check('media failed → media step failed, video pending', st({ stage: 'live', mediaState: 'failed', viewerState: 'idle' }) === 'done,failed,pending')
  check('viewer failed after media ready → video failed', st({ stage: 'live', mediaState: 'ready', viewerState: 'failed' }) === 'done,done,failed')
  check('create error → session failed', st({ stage: 'error', mediaState: 'pending', viewerState: 'idle' }) === 'failed,pending,pending')
  check('viewer playing never counts before media ready', st({ stage: 'live', mediaState: 'pending', viewerState: 'playing' }) === 'done,active,pending')
  check('store name in the first label', loaderStepsFor({ stage: 'creating', mediaState: 'pending', viewerState: 'idle' }, 'Target')[0].label === 'Abriendo Target')
  check('fallback label without a name', loaderStepsFor({ stage: 'creating', mediaState: 'pending', viewerState: 'idle' })[0].label === 'Abriendo la tienda')
}

// Summary LAST so every appended block (scroll, keyboard, b2) is counted and can fail the run.
console.log(`\n${passed} passed, ${failed} failed`)
if (failed) process.exit(1)