// Remote store browser (REMOTE_BROWSER_PLAN.md §(i)) — the pure logic behind
// /app/browse/[store]: the input relay over the engine's WebSocket, the outgoing
// message vocabulary with its client-side bounds, coordinate mapping from the
// rendered <video> to the stream's intrinsic pixel space, and the product
// overlay state driven by `candidate` / `candidate.cleared` events.
//
// Nothing here touches the DOM or opens sockets by itself: the composable
// injects a WebSocket factory and reads element geometry; every rule is pure
// and tested in utils/liveBrowse.test.mjs.
import type { Candidate, EventV1, ViewerTicket } from './liveShopping'

// ── Outgoing vocabulary (closed) ─────────────────────────────────────────────
export type InputMessage =
  | { type: 'pointer.move'; x: number; y: number }
  | { type: 'pointer.click'; button: 'left' | 'right' | 'middle' }
  | { type: 'pointer.scroll'; dy: number }
  | { type: 'key.press'; key: string; modifiers: Array<'ctrl' | 'shift' | 'alt'> }
  | { type: 'text.type'; value: string }

export const INPUT_REFUSAL_CODES = ['bad_message', 'out_of_bounds', 'key_refused', 'rate_limited', 'controller_busy', 'session_ended', 'unauthorized'] as const
export type InputRefusalCode = typeof INPUT_REFUSAL_CODES[number]
export type Controller = 'customer' | 'agent'
export type RelayState = 'idle' | 'connecting' | 'open' | 'closed' | 'failed'

export const MAX_TEXT_CHARS = 200
export const MAX_SCROLL_DY = 2000
export const POINTER_BUTTONS = ['left', 'right', 'middle'] as const

// Keys the page forwards as key.press. Printable characters travel as text.type.
// Browser-chrome shortcuts (address bar, tabs, windows, downloads, print,
// devtools, fullscreen, reload) never leave the page — the engine refuses them
// too; refusing here keeps the customer's own browser from acting on them.
export const KEY_ALLOWLIST = new Set([
  'Enter', 'Backspace', 'Delete', 'Tab', 'Escape', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'Home', 'End', 'PageUp', 'PageDown', ' ',
])
const MODIFIER_SHORTCUT_ALLOW = new Set(['a', 'c', 'v', 'x', 'z', 'y']) // select-all/copy/paste/cut/undo/redo inside the page

/** A key event → the closed message, or null when the key is not forwarded. */
export function keyMessageFor(ev: { key: string; ctrlKey?: boolean; shiftKey?: boolean; altKey?: boolean; metaKey?: boolean }): InputMessage | null {
  if (typeof ev.key !== 'string' || !ev.key) return null
  if (ev.metaKey) return null
  const modifiers: Array<'ctrl' | 'shift' | 'alt'> = []
  if (ev.ctrlKey) modifiers.push('ctrl')
  if (ev.shiftKey) modifiers.push('shift')
  if (ev.altKey) modifiers.push('alt')
  if (ev.ctrlKey || ev.altKey) {
    const k = ev.key.toLowerCase()
    if (ev.ctrlKey && !ev.altKey && MODIFIER_SHORTCUT_ALLOW.has(k)) return { type: 'key.press', key: k, modifiers }
    return null
  }
  if (KEY_ALLOWLIST.has(ev.key)) return { type: 'key.press', key: ev.key, modifiers }
  if (ev.key.length === 1) return { type: 'text.type', value: ev.key }
  return null
}

/** Map a pointer position on the rendered element to the stream's intrinsic
 *  pixels (object-contain letterboxing respected). Null when outside the frame
 *  or when geometry is unknown. */
export function mapPointer(
  clientX: number, clientY: number,
  rect: { left: number; top: number; width: number; height: number },
  intrinsic: { width: number; height: number },
): { x: number; y: number } | null {
  if (!(rect.width > 0 && rect.height > 0 && intrinsic.width > 0 && intrinsic.height > 0)) return null
  const scale = Math.min(rect.width / intrinsic.width, rect.height / intrinsic.height)
  const drawnW = intrinsic.width * scale
  const drawnH = intrinsic.height * scale
  const offX = rect.left + (rect.width - drawnW) / 2
  const offY = rect.top + (rect.height - drawnH) / 2
  const x = (clientX - offX) / scale
  const y = (clientY - offY) / scale
  if (x < 0 || y < 0 || x >= intrinsic.width || y >= intrinsic.height) return null
  return { x: Math.round(x), y: Math.round(y) }
}

/** Client-side bounds mirror the engine's: a message that would be refused
 *  there is never sent. */
export function boundMessage(m: InputMessage, intrinsic: { width: number; height: number }): InputMessage | null {
  switch (m.type) {
    case 'pointer.move':
      if (!Number.isInteger(m.x) || !Number.isInteger(m.y) || m.x < 0 || m.y < 0 || m.x >= intrinsic.width || m.y >= intrinsic.height) return null
      return m
    case 'pointer.click':
      return (POINTER_BUTTONS as readonly string[]).includes(m.button) ? m : null
    case 'pointer.scroll': {
      if (!Number.isFinite(m.dy) || m.dy === 0) return null
      const dy = Math.max(-MAX_SCROLL_DY, Math.min(MAX_SCROLL_DY, Math.round(m.dy)))
      return { type: 'pointer.scroll', dy }
    }
    case 'key.press':
      return typeof m.key === 'string' && m.key.length > 0 && m.key.length <= 32 ? m : null
    case 'text.type':
      return typeof m.value === 'string' && m.value.length > 0 && m.value.length <= MAX_TEXT_CHARS ? m : null
    default:
      return null
  }
}

/** Incoming frames (closed): state, refused; anything else is ignored. */
export function parseInbound(text: string): { type: 'state'; controller: Controller } | { type: 'refused'; code: InputRefusalCode } | null {
  let o: any
  try { o = JSON.parse(text) } catch { return null }
  if (!o || typeof o !== 'object') return null
  if (o.type === 'state' && (o.controller === 'customer' || o.controller === 'agent')) return { type: 'state', controller: o.controller }
  if (o.type === 'refused' && (INPUT_REFUSAL_CODES as readonly string[]).includes(o.code)) return { type: 'refused', code: o.code }
  return null
}

// ── The relay controller ─────────────────────────────────────────────────────
export interface SocketLike {
  send(data: string): void
  close(): void
  onopen: ((ev?: any) => void) | null
  onmessage: ((ev: { data: any }) => void) | null
  onclose: ((ev?: any) => void) | null
  onerror: ((ev?: any) => void) | null
}
export interface RelayDeps {
  connect: (url: string) => SocketLike
  onState?: (s: RelayState) => void
  onController?: (c: Controller) => void
  onRefused?: (code: InputRefusalCode) => void
}

/** One socket per page; auth is the FIRST frame; pointer moves are coalesced
 *  to the latest position per flush; every send is bounded first. */
export function createInputRelayController(deps: RelayDeps) {
  let sock: SocketLike | null = null
  let state: RelayState = 'idle'
  let controller: Controller = 'customer'
  let generation = 0
  let intrinsic = { width: 0, height: 0 }
  let pendingMove: { x: number; y: number } | null = null
  let sent = 0
  let refusedCount = 0

  const setState = (g: number, s: RelayState) => { if (g !== generation || state === s) return; state = s; deps.onState?.(s) }

  function start(ticket: ViewerTicket) {
    stop()
    const g = ++generation
    if (!ticket.inputUrl) { setState(g, 'failed'); return }
    setState(g, 'connecting')
    try { sock = deps.connect(ticket.inputUrl) } catch { setState(g, 'failed'); return }
    const s = sock
    s.onopen = () => { if (g !== generation) return; s.send(JSON.stringify({ type: 'auth', ticket: ticket.ticket })) }
    s.onmessage = (ev) => {
      if (g !== generation) return
      const m = parseInbound(typeof ev.data === 'string' ? ev.data : '')
      if (!m) return
      if (m.type === 'state') { controller = m.controller; deps.onController?.(controller); setState(g, 'open'); return }
      refusedCount++
      deps.onRefused?.(m.code)
      if (m.code === 'unauthorized' || m.code === 'session_ended') setState(g, 'failed')
    }
    s.onclose = () => { if (g !== generation) return; setState(g, state === 'failed' ? 'failed' : 'closed') }
    s.onerror = () => { if (g !== generation) return; setState(g, 'failed') }
  }

  function setIntrinsic(size: { width: number; height: number }) { intrinsic = { width: size.width | 0, height: size.height | 0 } }

  function send(m: InputMessage): boolean {
    if (state !== 'open' || !sock || controller !== 'customer') return false
    const b = boundMessage(m, intrinsic)
    if (!b) return false
    if (b.type === 'pointer.move') { pendingMove = { x: b.x, y: b.y }; return true }
    flushMove()
    sock.send(JSON.stringify(b)); sent++
    return true
  }

  /** Called once per animation frame by the composable: the latest move wins. */
  function flushMove() {
    if (!pendingMove || state !== 'open' || !sock) return
    sock.send(JSON.stringify({ type: 'pointer.move', x: pendingMove.x, y: pendingMove.y })); sent++
    pendingMove = null
  }

  function stop() {
    generation++
    pendingMove = null
    const s = sock
    sock = null
    if (s) { s.onopen = s.onmessage = s.onclose = s.onerror = null; try { s.close() } catch {} }
    if (state !== 'idle') { state = 'closed'; deps.onState?.('closed') }
  }

  return {
    start, stop, send, flushMove, setIntrinsic,
    getState: () => state,
    getController: () => controller,
    stats: () => ({ sent, refused: refusedCount }),
  }
}

// ── Product overlay state ────────────────────────────────────────────────────
/** The overlay shows the LATEST candidate and hides on candidate.cleared or a
 *  terminal. Pure reducer over the event stream the session controller already
 *  validates. */
export function overlayReducer(current: Candidate | null, ev: EventV1 & { candidate?: Candidate | null }): Candidate | null {
  if (ev.type === 'candidate') return ev.candidate ?? current
  if (ev.type === 'candidate.cleared') return null
  if (ev.type === 'session.completed' || ev.type === 'session.failed' || ev.type === 'session.cancelled') return null
  return current
}

/** The purchase-request item for a candidate (fields PurchaseRequestController::store validates). */
export function purchaseItemFor(c: Candidate): { product_name: string; product_url: string; product_image_url?: string; price: number; quantity: 1; notes?: string } {
  const price = c.current_price && typeof c.current_price.amount === 'number' ? c.current_price.amount : 0
  const item: any = { product_name: c.title, product_url: c.url, price, quantity: 1 as const }
  if (c.image) item.product_image_url = c.image
  if (c.store) item.notes = `Elegido en la tienda en vivo: ${c.store}`
  return item
}

/** Card image for a store card: derived from the storefront host, never from user input. */
export function storeCardImage(url: string): string | null {
  let u: URL
  try { u = new URL(url) } catch { return null }
  if (u.protocol !== 'https:') return null
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(u.hostname)}&sz=128`
}
