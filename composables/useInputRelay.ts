// Reactive wrapper over createInputRelayController (utils/liveBrowse.ts, where
// the logic lives and is tested) plus the DOM binding for the streamed store:
// pointer/wheel/keyboard events on the <video> element become the closed input
// vocabulary, coordinates are mapped from the rendered box to the stream's
// intrinsic pixels, and pointer moves are flushed once per animation frame.
import { ref, onBeforeUnmount, getCurrentInstance } from 'vue'
import {
  createInputRelayController,
  keyMessageFor,
  mapPointer,
  scrollStepsFor,
  shouldForwardKeydown,
  describeKeydown,
  documentKeydownForwardable,
  createTextBuffer,
  type InputMessage,
  type Controller,
  type InputRefusalCode,
  type RelayState,
} from '../utils/liveBrowse'
import { createQuietFlusher } from '../utils/typingFlush'
import type { ViewerTicket } from '../utils/liveShopping'

export function useInputRelay() {
  const state = ref<RelayState>('idle')
  const controller = ref<Controller>('customer')
  const lastRefusal = ref<InputRefusalCode | null>(null)
  const sent = ref(0) // accepted-by-the-page sends (a diagnostic the page may show as text)
  const received = ref(0) // raw DOM pointer/key events seen on the bound element
  const focusedTag = ref('none') // TAG#id of document.activeElement, for the page's focus readout
  const lastKey = ref('none') // the last keydown seen and what it became, for the page's key readout
  const sentByType = ref<Record<string, number>>({ 'pointer.move': 0, 'pointer.click': 0, 'pointer.scroll': 0, 'key.press': 0, 'text.type': 0 })

  const relay = createInputRelayController({
    connect: (url) => new WebSocket(url) as any,
    onState: (s) => { state.value = s; if (s === 'open') focusVideo() },
    onController: (c) => { controller.value = c },
    onRefused: (code) => { lastRefusal.value = code },
  })

  let el: HTMLVideoElement | null = null
  // Keys go to the focused element: focus the video as soon as the customer holds the turn (not only on the
  // first click), so typing right after "Tú controlas" reaches the store. preventScroll keeps the page still.
  const readFocus = () => { try { const a = (typeof document !== 'undefined' ? document.activeElement : null) as any; focusedTag.value = a ? `${a.tagName || '?'}${a.id ? '#' + a.id : ''}` : 'none' } catch { focusedTag.value = 'none' } }
  const focusVideo = () => { try { el?.focus({ preventScroll: true }) } catch { /* not focusable yet */ } finally { readFocus() } }
  // After a click the video must hold focus so the next keystrokes reach the store; a Vue re-render or the busy
  // overlay can steal it, so re-assert on the next frame if it did not stick.
  const ensureVideoFocus = () => { focusVideo(); if (typeof requestAnimationFrame === 'function' && el && (typeof document === 'undefined' || document.activeElement !== el)) requestAnimationFrame(() => { focusVideo() }) }
  // A keydown that fell off the video (focus on body/root) is still the customer's — forward it while the relay is open.
  const onDocumentKeydown = (ev: KeyboardEvent) => {
    if (state.value !== 'open' || !el || ev.target === el) return // the video's own handler covers the focused case
    if (!documentKeydownForwardable(ev.target, el)) return
    received.value++
    handleKeydown(ev, 'doc')
  }
  let raf: number | null = null
  const listeners: Array<[string, any, any?]> = []

  const intrinsic = () => ({ width: el?.videoWidth || 0, height: el?.videoHeight || 0 })
  const send = (m: Parameters<typeof relay.send>[0]) => { const ok = relay.send(m); if (ok) { sent.value++; sentByType.value[m.type] = (sentByType.value[m.type] || 0) + 1 } return ok }
  const noteKey = (ev: KeyboardEvent, message: any, reason: string, where: string) => { lastKey.value = `key=${ev.key} code=${ev.code || '?'} composing=${ev.isComposing === true} repeat=${ev.repeat === true} ${where}=${message ? message.type : 'dropped:' + reason}` }
  // Typed characters are coalesced into one text.type per burst (see createTextBuffer): a per-character stream
  // reaches a React search box as one keystroke per wtype session and only the last survives. The buffer is sent
  // after a bounded QUIET GAP with no further keystroke (createQuietFlusher — NOT per animation frame, which fired
  // after every key at a human 25–150 ms cadence), or immediately ahead of a non-text key, on blur, before a
  // click, and on stop.
  const textBuffer = createTextBuffer()
  const emit = (msgs: InputMessage[]) => { for (const m of msgs) send(m) }
  const flusher = createQuietFlusher(() => emit(textBuffer.flush()))
  const flushText = () => flusher.flushNow()
  const handleKeydown = (ev: KeyboardEvent, where: string) => {
    ev.preventDefault()
    const { message, reason } = describeKeydown(ev)
    noteKey(ev, message, reason, where)
    emit(textBuffer.push(message)) // a printable buffers (nothing sent); a non-text key flushes the word then itself
    if (message && message.type === 'text.type') flusher.bump() // (re)arm the quiet-gap flush; keep typing resets it
    else if (message) flusher.cancel() // a forwarded non-text key already flushed the buffer
  }
  const scheduleFlush = () => {
    if (raf !== null) return
    raf = requestAnimationFrame(() => { raf = null; relay.flushMove() })
  }
  const point = (ev: PointerEvent | MouseEvent) => {
    if (!el) return null
    const size = intrinsic()
    relay.setIntrinsic(size)
    return mapPointer(ev.clientX, ev.clientY, el.getBoundingClientRect(), size)
  }

  /** Bind the streamed video element. The element is focusable so keys reach it;
   *  every default is prevented so the customer's own browser never acts on a key
   *  or a context menu meant for the store. */
  function bind(video: HTMLVideoElement) {
    unbind()
    el = video
    video.tabIndex = 0
    if (state.value === 'open') focusVideo()
    const on = (type: string, fn: any, opts?: any) => { const wrapped = (ev: any) => { received.value++; return fn(ev) }; video.addEventListener(type, wrapped, opts); listeners.push([type, wrapped, opts]) }
    on('pointermove', (ev: PointerEvent) => { const p = point(ev); if (p) { send({ type: 'pointer.move', ...p }); scheduleFlush() } })
    // mousedown focuses too (some builds fire it before pointerdown, or when a pointerdown default was consumed).
    on('mousedown', () => ensureVideoFocus())
    on('pointerdown', (ev: PointerEvent) => {
      ensureVideoFocus()
      const p = point(ev); if (!p) return
      ev.preventDefault()
      flushText() // a word typed before this click lands in the store first
      send({ type: 'pointer.move', ...p }); relay.flushMove()
      send({ type: 'pointer.click', button: ev.button === 2 ? 'right' : ev.button === 1 ? 'middle' : 'left' })
    })
    on('contextmenu', (ev: Event) => ev.preventDefault())
    on('wheel', (ev: WheelEvent) => { const p = point(ev); if (!p) return; ev.preventDefault(); const dy = scrollStepsFor(ev.deltaY, ev.deltaMode); if (dy) send({ type: 'pointer.scroll', dy }) }, { passive: false })
    on('keydown', (ev: KeyboardEvent) => {
      // Keys the page does not forward still must not reach the customer's browser chrome while the store has focus.
      handleKeydown(ev, 'video')
    })
    on('focus', () => readFocus())
    on('blur', () => { readFocus(); flushText() }) // focus left the store: send whatever was typed
    // The document-level safety net for a keystroke that fell off the video.
    if (typeof document !== 'undefined') { document.addEventListener('keydown', onDocumentKeydown, true); listeners.push(['__doc_keydown__', onDocumentKeydown, true]) }
    // IME composition: the composed string joins the buffer and flushes at once (with any word typed before it).
    on('compositionend', (ev: CompositionEvent) => { textBuffer.push({ type: 'text.type', value: ev.data || '' }); flushText() })
    // Paste into the store: the clipboard text joins the buffer and flushes, bounded and chunked; the browser's own paste is prevented.
    on('paste', (ev: ClipboardEvent) => { ev.preventDefault(); textBuffer.push({ type: 'text.type', value: ev.clipboardData?.getData('text/plain') || '' }); flushText() })
  }
  function unbind() {
    for (const [t, fn, opts] of listeners) { if (t === '__doc_keydown__') { if (typeof document !== 'undefined') document.removeEventListener('keydown', fn, opts as any) } else el?.removeEventListener(t, fn, opts) }
    listeners.length = 0
    el = null
    if (raf !== null) { cancelAnimationFrame(raf); raf = null }
    flusher.cancel()
  }

  const start = (ticket: ViewerTicket) => { lastRefusal.value = null; relay.start(ticket) }
  const stop = () => { flushText(); relay.stop() }

  if (getCurrentInstance()) onBeforeUnmount(() => { unbind(); relay.stop() })

  return { state, controller, lastRefusal, sent, received, focusedTag, lastKey, sentByType, bind, unbind, start, stop, stats: relay.stats }
}
