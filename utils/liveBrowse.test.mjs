// Pure tests for utils/liveBrowse.ts — the remote store browser's client logic.
import { keyMessageFor, mapPointer, boundMessage, parseInbound, createInputRelayController, overlayReducer, purchaseItemFor, storeCardImage, MAX_TEXT_CHARS } from './liveBrowse.ts'

let passed = 0, failed = 0
const check = (name, ok, detail = '') => { if (ok) { passed++; console.log(`  ✓ ${name}`) } else { failed++; console.log(`  ✗ ${name} ${detail}`) } }

// keys
check('Enter → key.press', keyMessageFor({ key: 'Enter' })?.type === 'key.press')
check('printable → text.type', JSON.stringify(keyMessageFor({ key: 'a' })) === JSON.stringify({ type: 'text.type', value: 'a' }))
check('F5 (reload) not forwarded', keyMessageFor({ key: 'F5' }) === null)
check('ctrl+l (address bar) not forwarded', keyMessageFor({ key: 'l', ctrlKey: true }) === null)
check('ctrl+t (new tab) not forwarded', keyMessageFor({ key: 't', ctrlKey: true }) === null)
check('ctrl+c allowed with modifiers', JSON.stringify(keyMessageFor({ key: 'C', ctrlKey: true })) === JSON.stringify({ type: 'key.press', key: 'c', modifiers: ['ctrl'] }))
check('meta never forwarded', keyMessageFor({ key: 'a', metaKey: true }) === null)
check('shift+Tab carries the modifier', JSON.stringify(keyMessageFor({ key: 'Tab', shiftKey: true })?.modifiers) === '["shift"]')
check('alt+anything not forwarded', keyMessageFor({ key: 'ArrowLeft', altKey: true }) === null)

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
check('scroll clamped', boundMessage({ type: 'pointer.scroll', dy: 99999 }, intr)?.dy === 2000)
check('scroll zero refused', boundMessage({ type: 'pointer.scroll', dy: 0 }, intr) === null)
check('text over the cap refused', boundMessage({ type: 'text.type', value: 'x'.repeat(MAX_TEXT_CHARS + 1) }, intr) === null)
check('unknown button refused', boundMessage({ type: 'pointer.click', button: 'back' }, intr) === null)

// inbound
check('state frame parses', parseInbound('{"type":"state","controller":"agent"}')?.controller === 'agent')
check('refused frame parses', parseInbound('{"type":"refused","code":"rate_limited"}')?.code === 'rate_limited')
check('unknown code ignored', parseInbound('{"type":"refused","code":"whatever"}') === null)
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
check('store card image derives from the https host only', storeCardImage('https://www.walmart.com/').includes('domain=www.walmart.com'))
check('store card image refuses non-https', storeCardImage('http://x/') === null)

console.log(`\n${passed} passed, ${failed} failed`)
if (failed) process.exit(1)
