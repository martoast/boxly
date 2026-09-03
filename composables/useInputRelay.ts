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
  type Controller,
  type InputRefusalCode,
  type RelayState,
} from '../utils/liveBrowse'
import type { ViewerTicket } from '../utils/liveShopping'

export function useInputRelay() {
  const state = ref<RelayState>('idle')
  const controller = ref<Controller>('customer')
  const lastRefusal = ref<InputRefusalCode | null>(null)

  const relay = createInputRelayController({
    connect: (url) => new WebSocket(url) as any,
    onState: (s) => { state.value = s },
    onController: (c) => { controller.value = c },
    onRefused: (code) => { lastRefusal.value = code },
  })

  let el: HTMLVideoElement | null = null
  let raf: number | null = null
  const listeners: Array<[string, any, any?]> = []

  const intrinsic = () => ({ width: el?.videoWidth || 0, height: el?.videoHeight || 0 })
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
    const on = (type: string, fn: any, opts?: any) => { video.addEventListener(type, fn, opts); listeners.push([type, fn, opts]) }
    on('pointermove', (ev: PointerEvent) => { const p = point(ev); if (p) { relay.send({ type: 'pointer.move', ...p }); scheduleFlush() } })
    on('pointerdown', (ev: PointerEvent) => {
      video.focus()
      const p = point(ev); if (!p) return
      ev.preventDefault()
      relay.send({ type: 'pointer.move', ...p }); relay.flushMove()
      relay.send({ type: 'pointer.click', button: ev.button === 2 ? 'right' : ev.button === 1 ? 'middle' : 'left' })
    })
    on('contextmenu', (ev: Event) => ev.preventDefault())
    on('wheel', (ev: WheelEvent) => { const p = point(ev); if (!p) return; ev.preventDefault(); relay.send({ type: 'pointer.scroll', dy: ev.deltaY }) }, { passive: false })
    on('keydown', (ev: KeyboardEvent) => {
      const m = keyMessageFor(ev)
      // Keys the page does not forward still must not reach the customer's browser chrome while the store has focus.
      ev.preventDefault()
      if (m) relay.send(m)
    })
  }
  function unbind() {
    if (el) for (const [t, fn, opts] of listeners) el.removeEventListener(t, fn, opts)
    listeners.length = 0
    el = null
    if (raf !== null) { cancelAnimationFrame(raf); raf = null }
  }

  const start = (ticket: ViewerTicket) => { lastRefusal.value = null; relay.start(ticket) }
  const stop = () => { relay.stop() }

  if (getCurrentInstance()) onBeforeUnmount(() => { unbind(); relay.stop() })

  return { state, controller, lastRefusal, bind, unbind, start, stop, stats: relay.stats }
}
