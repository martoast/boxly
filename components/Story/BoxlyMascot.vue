<template>
  <!-- Boxly, Erick's mascot, as a rig (landing story, 2026-11-18). Drawn exactly as Erick designed him: a closed yellow cube
       with navy edges, brows that carry the mood, white gloves, navy legs and navy sneakers with a yellow stripe. No added
       parts. Everything moves by transforms from one state object (`st`), so a GSAP timeline animates the state and render()
       draws it; the arms are redrawn every frame from the shoulder to wherever the glove is. The default state IS the final
       pose (Erick's thumbs up), which is what reduced motion and the server show. -->
  <svg ref="svg" class="boxly-rig" viewBox="-30 0 300 310" role="img" aria-label="Boxly">
    <defs>
      <clipPath id="bx-eye-l"><ellipse cx="0" cy="0" rx="12.5" ry="15.5" /></clipPath>
      <clipPath id="bx-eye-r"><ellipse cx="0" cy="0" rx="12.5" ry="15.5" /></clipPath>
    </defs>
    <!-- contact shadow -->
    <ellipse ref="shadow" cx="122" cy="288" rx="78" ry="9" fill="#0C254C" opacity=".12" />
    <g ref="root">
      <g ref="body">
        <!-- legs + sneakers -->
        <g ref="legL">
          <path d="M94 196 L80 244" stroke="#14306A" stroke-width="26" stroke-linecap="round" fill="none" />
          <g ref="shoeL" transform="translate(74 266)">
            <path d="M-30 6 C-32 -14 -16 -22 2 -21 C20 -20 34 -12 34 6 Z" fill="#14306A" stroke="#0C254C" stroke-width="2" />
            <path d="M-6 -20 L4 4" stroke="#FECD04" stroke-width="9" stroke-linecap="round" />
            <rect x="-34" y="3" width="72" height="12" rx="6" fill="#FFFDF6" stroke="#D8D2C2" stroke-width="1.5" />
          </g>
          <rect x="63" y="230" width="34" height="16" rx="8" fill="#FFFDF6" stroke="#D8D2C2" stroke-width="1.8" />
        </g>
        <g ref="legR">
          <path d="M146 200 L148 246" stroke="#14306A" stroke-width="26" stroke-linecap="round" fill="none" />
          <g ref="shoeR" transform="translate(156 268)">
            <path d="M-30 6 C-32 -14 -16 -22 2 -21 C20 -20 34 -12 34 6 Z" fill="#14306A" stroke="#0C254C" stroke-width="2" />
            <path d="M-6 -20 L4 4" stroke="#FECD04" stroke-width="9" stroke-linecap="round" />
            <rect x="-34" y="3" width="72" height="12" rx="6" fill="#FFFDF6" stroke="#D8D2C2" stroke-width="1.5" />
          </g>
          <rect x="131" y="232" width="34" height="16" rx="8" fill="#FFFDF6" stroke="#D8D2C2" stroke-width="1.8" />
        </g>
        <!-- back arm (left), drawn under the cube -->
        <path ref="armL" stroke="#14306A" stroke-width="24" stroke-linecap="round" stroke-linejoin="round" fill="none" />
        <!-- the cube -->
        <g ref="cube" stroke="#0C254C" stroke-width="9" stroke-linejoin="round">
          <path d="M40 78 L126 46 L196 74 L104 98 Z" fill="#FFD62E" />
          <path d="M40 78 L104 98 L108 206 L46 182 Z" fill="#F4B800" />
          <path d="M104 98 L196 74 L200 184 L108 206 Z" fill="#FECD04" />
        </g>
        <!-- face, on the front face -->
        <g ref="face">
          <g transform="translate(134 141) rotate(-6)">
            <g ref="eyeL">
              <ellipse rx="12.5" ry="15.5" fill="#FFFDF6" stroke="#0C254C" stroke-width="2.2" />
              <g clip-path="url(#bx-eye-l)">
                <g ref="pupilL"><circle cx="2" cy="1.5" r="10" fill="#4A2A14" /><circle cx="2.5" cy="2" r="5.2" fill="#140904" /><circle cx="-1.6" cy="-2.8" r="2.8" fill="#fff" /></g>
                <!-- the lid closes from the top edge down (origin at y -17) -->
                <rect ref="lidL" x="-14" y="-17" width="28" height="34" fill="#FECD04" transform="translate(0 -17) scale(1 0) translate(0 17)" />
              </g>
              <path d="M-12.5 0 A12.5 15.5 0 0 1 12.5 0" stroke="#0C254C" stroke-width="3.8" stroke-linecap="round" fill="none" />
            </g>
            <!-- shut (blink / wink): a happy arc, the eye hidden -->
            <path ref="shutL" d="M-11 2 Q0 -9 11 2" stroke="#0C254C" stroke-width="3.8" stroke-linecap="round" fill="none" opacity="0" />
          </g>
          <g transform="translate(173 134) rotate(-6)">
            <g ref="eyeR">
              <ellipse rx="12.5" ry="15.5" fill="#FFFDF6" stroke="#0C254C" stroke-width="2.2" />
              <g clip-path="url(#bx-eye-r)">
                <g ref="pupilR"><circle cx="2" cy="1.5" r="10" fill="#4A2A14" /><circle cx="2.5" cy="2" r="5.2" fill="#140904" /><circle cx="-1.6" cy="-2.8" r="2.8" fill="#fff" /></g>
                <!-- the lid closes from the top edge down (origin at y -17) -->
                <rect ref="lidR" x="-14" y="-17" width="28" height="34" fill="#FECD04" transform="translate(0 -17) scale(1 0) translate(0 17)" />
              </g>
              <path d="M-12.5 0 A12.5 15.5 0 0 1 12.5 0" stroke="#0C254C" stroke-width="3.8" stroke-linecap="round" fill="none" />
            </g>
            <!-- shut (blink / wink): a happy arc, the eye hidden -->
            <path ref="shutR" d="M-11 2 Q0 -9 11 2" stroke="#0C254C" stroke-width="3.8" stroke-linecap="round" fill="none" opacity="0" />
          </g>
          <path ref="browL" d="M-11 3 Q0 -5 11 0" transform="translate(132 117)" stroke="#0C254C" stroke-width="6" stroke-linecap="round" fill="none" />
          <path ref="browR" d="M-11 3 Q0 -6 11 -1" transform="translate(172 109)" stroke="#0C254C" stroke-width="6" stroke-linecap="round" fill="none" />
          <!-- mouths: Erick's open smile is the default -->
          <g ref="mouths" transform="translate(155 171)">
            <g data-m="smile">
              <path d="M-18 -4 Q-1 2 17 -9 Q15 12 -1 13 Q-15 12 -18 -4 Z" fill="#7A2414" stroke="#0C254C" stroke-width="1.6" />
              <path d="M-15 -2.6 Q-1 2.4 14.5 -7.4 L13.6 -3.6 Q-1 4.6 -14.4 0.6 Z" fill="#FFFDF6" />
              <path d="M-8 9 Q0 4 9 7 Q3 13 -2 12.6 Q-6 12 -8 9 Z" fill="#E8775A" />
            </g>
            <path data-m="closed" d="M-15 -3 Q0 8 15 -7" stroke="#0C254C" stroke-width="3.6" stroke-linecap="round" fill="none" opacity="0" />
            <ellipse data-m="o" cx="0" cy="2" rx="6" ry="7.5" fill="#7A2414" stroke="#0C254C" stroke-width="1.6" opacity="0" />
            <path data-m="line" d="M-10 1 Q0 -1 10 0" stroke="#0C254C" stroke-width="3.4" stroke-linecap="round" fill="none" opacity="0" />
            <g data-m="talk" opacity="0">
              <path d="M-13 -3 Q0 1 13 -6 Q11 9 0 9.5 Q-11 9 -13 -3 Z" fill="#7A2414" stroke="#0C254C" stroke-width="1.6" />
              <path d="M-10 -1.6 Q0 1.6 10 -4.4 L9.4 -1.6 Q0 3.6 -9.6 0.8 Z" fill="#FFFDF6" />
            </g>
          </g>
        </g>
        <!-- a carton he lifts and carries (sits between his gloves) -->
        <g ref="carton" opacity="0">
          <rect x="-34" y="-26" width="68" height="52" rx="5" fill="#C98B4E" stroke="#8A5A2B" stroke-width="2.5" />
          <path d="M-34 -10 H34 M0 -26 V-10" stroke="#8A5A2B" stroke-width="2" />
          <rect x="-12" y="4" width="24" height="12" rx="2" fill="#FFFDF6" />
        </g>
        <!-- left glove: in front of the cube, the fist on his hip (the arm comes from behind the side face) -->
        <g ref="handL"><BoxlyGlove :pose="poses.L" side="L" /></g>
        <!-- front arm (right) + its prop -->
        <path ref="armR" stroke="#14306A" stroke-width="24" stroke-linecap="round" stroke-linejoin="round" fill="none" />
        <g ref="handR">
          <g ref="scanner" opacity="0">
            <rect x="-11" y="-58" width="22" height="44" rx="6" fill="#2B3445" stroke="#0C254C" stroke-width="2" />
            <rect x="-8" y="-58" width="16" height="9" rx="3" ref="scanLight" fill="#E5484D" />
          </g>
          <BoxlyGlove :pose="poses.R" side="R" />
        </g>
      </g>
    </g>
    <!-- speech bubble -->
    <g ref="say" opacity="0" transform="translate(150 22)">
      <rect x="-4" y="-18" :width="sayW" height="30" rx="15" fill="#fff" stroke="#0C254C" stroke-width="2" />
      <text x="10" y="2" font-size="14" font-weight="700" fill="#0C254C" font-family="inherit">{{ sayText }}</text>
    </g>
  </svg>
</template>

<script setup>
import { gsap } from 'gsap'
import BoxlyGlove from './BoxlyGlove.vue'

// shoulders (body space) and arm length; a shorter reach bends the elbow out and down
// at the cube's silhouette edges (left: mid-height of the side face; right: mouth level on the front face's edge)
const SHOULDER = { L: [44, 138], R: [199, 172] }
const ARM = 90
// Erick's pose: the left glove on the hip, the right one thumbs up
const REST = { L: { x: 52, y: 202, r: 10, pose: 'fist' }, R: { x: 244, y: 116, r: -8, pose: 'thumb' } }

const svg = ref(null), root = ref(null), body = ref(null), shadow = ref(null)
const armL = ref(null), armR = ref(null), handL = ref(null), handR = ref(null)
const pupilL = ref(null), pupilR = ref(null), lidL = ref(null), lidR = ref(null)
const browL = ref(null), browR = ref(null), mouths = ref(null), scanner = ref(null), scanLight = ref(null)
const eyeL = ref(null), eyeR = ref(null), shutL = ref(null), shutR = ref(null), carton = ref(null)
const legL = ref(null), legR = ref(null), say = ref(null), face = ref(null)
const poses = reactive({ L: REST.L.pose, R: REST.R.pose })
const sayText = ref('')
const sayW = computed(() => 22 + sayText.value.length * 7.6)

// the whole rig is this one object; timelines tween it, render() draws it
const st = reactive({
  x: 0, y: 0, sx: 1, sy: 1, lean: 0,
  lookX: 0, lookY: 0, blinkL: 0, blinkR: 0,
  browLy: 0, browLr: 0, browRy: 0, browRr: 0,
  mouth: 'smile',
  hLx: REST.L.x, hLy: REST.L.y, hLr: REST.L.r,
  hRx: REST.R.x, hRy: REST.R.y, hRr: REST.R.r,
  footL: 0, footR: 0, scan: 0, beep: 0, say: 0, carry: 0,
})

function arm(side, hx, hy) {
  const [sx, sy] = SHOULDER[side]
  const dx = hx - sx, dy = hy - sy, d = Math.hypot(dx, dy) || 1
  const bend = Math.min(34, d < ARM ? Math.sqrt((ARM / 2) ** 2 - (d / 2) ** 2) : 0)
  // the elbow points down and outward (away from the body), never up into a loop
  const nx = -dy / d, ny = dx / d, out = side === 'L' ? -1 : 1
  const sgn = (ny + nx * out * 0.5) >= 0 ? 1 : -1
  const ex = (sx + hx) / 2 + nx * bend * sgn, ey = (sy + hy) / 2 + ny * bend * sgn
  return `M${sx} ${sy} L${ex.toFixed(1)} ${ey.toFixed(1)} L${hx.toFixed(1)} ${hy.toFixed(1)}`
}

function render() {
  if (!root.value) return
  root.value.setAttribute('transform', `translate(${st.x} ${st.y})`)
  // squash and lean around the feet
  body.value.setAttribute('transform', `translate(122 286) rotate(${st.lean}) scale(${st.sx} ${st.sy}) translate(-122 -286)`)
  shadow.value.setAttribute('transform', `translate(${st.x} 0) translate(122 288) scale(${1 - Math.min(0.5, -st.y / 160)} 1) translate(-122 -288)`)
  face.value.setAttribute('transform', `translate(${st.lookX * 0.6} ${st.lookY * 0.5})`)
  pupilL.value.setAttribute('transform', `translate(${st.lookX} ${st.lookY})`)
  pupilR.value.setAttribute('transform', `translate(${st.lookX} ${st.lookY})`)
  // lids close from the top; fully shut shows the happy arc instead of the eye
  lidL.value.setAttribute('transform', `translate(0 -17) scale(1 ${st.blinkL}) translate(0 17)`)
  lidR.value.setAttribute('transform', `translate(0 -17) scale(1 ${st.blinkR}) translate(0 17)`)
  eyeL.value.setAttribute('opacity', st.blinkL > 0.85 ? 0 : 1); shutL.value.setAttribute('opacity', st.blinkL > 0.85 ? 1 : 0)
  eyeR.value.setAttribute('opacity', st.blinkR > 0.85 ? 0 : 1); shutR.value.setAttribute('opacity', st.blinkR > 0.85 ? 1 : 0)
  carton.value.setAttribute('opacity', st.carry)
  carton.value.setAttribute('transform', `translate(${(st.hLx + st.hRx) / 2} ${(st.hLy + st.hRy) / 2 - 4})`)
  browL.value.setAttribute('transform', `translate(132 ${117 + st.browLy}) rotate(${st.browLr})`)
  browR.value.setAttribute('transform', `translate(172 ${109 + st.browRy}) rotate(${st.browRr})`)
  for (const m of mouths.value.children) m.setAttribute('opacity', m.dataset.m === st.mouth ? 1 : 0)
  armL.value.setAttribute('d', arm('L', st.hLx, st.hLy))
  armR.value.setAttribute('d', arm('R', st.hRx, st.hRy))
  handL.value.setAttribute('transform', `translate(${st.hLx} ${st.hLy}) rotate(${st.hLr})`)
  handR.value.setAttribute('transform', `translate(${st.hRx} ${st.hRy}) rotate(${st.hRr})`)
  legL.value.setAttribute('transform', `translate(0 ${st.footL})`)
  legR.value.setAttribute('transform', `translate(0 ${st.footR})`)
  scanner.value.setAttribute('opacity', st.scan)
  scanLight.value.setAttribute('fill', st.beep > 0.5 ? '#3DD68C' : '#E5484D')
  say.value.setAttribute('opacity', st.say)
  say.value.setAttribute('transform', `translate(150 ${22 + (1 - st.say) * 8})`)
}

// ---- moves: each returns a paused-able GSAP timeline on `st` ----
const E = { up: 'power2.out', down: 'power2.in', soft: 'sine.inOut', pop: 'back.out(2.2)' }
const hand = (tl, side, to, at, dur = 0.35, ease = E.soft) => {
  const k = side === 'L' ? 'hL' : 'hR'
  const v = {}
  if (to.x !== undefined) v[k + 'x'] = to.x
  if (to.y !== undefined) v[k + 'y'] = to.y
  if (to.r !== undefined) v[k + 'r'] = to.r
  tl.to(st, { ...v, duration: dur, ease }, at)
  if (to.pose) tl.call(() => { poses[side] = to.pose }, null, at)
  return tl
}
const brows = (tl, at, { ly = 0, lr = 0, ry = 0, rr = 0 }, dur = 0.2) => tl.to(st, { browLy: ly, browLr: lr, browRy: ry, browRr: rr, duration: dur, ease: E.soft }, at)
const mouth = (tl, at, m) => tl.call(() => { st.mouth = m }, null, at)
const blink = (tl, at, which = 'both') => {
  const k = which === 'L' ? ['blinkL'] : which === 'R' ? ['blinkR'] : ['blinkL', 'blinkR']
  const on = Object.fromEntries(k.map((x) => [x, 1])), off = Object.fromEntries(k.map((x) => [x, 0]))
  tl.to(st, { ...on, duration: 0.07, ease: 'none' }, at).to(st, { ...off, duration: 0.09, ease: 'none' }, at + (which === 'both' ? 0.1 : 0.6))
  return tl
}
const speak = (tl, at, text, hold = 1.1) => {
  tl.call(() => { sayText.value = text }, null, at)
  tl.to(st, { say: 1, duration: 0.18, ease: E.pop }, at)
  for (let t = at; t < at + Math.min(hold, 0.9); t += 0.18) { mouth(tl, t, 'talk'); mouth(tl, t + 0.09, 'smile') }
  tl.to(st, { say: 0, duration: 0.2 }, at + hold)
  return tl
}
const squash = (tl, at, s = 0.12, dur = 0.12) => tl.to(st, { sx: 1 + s, sy: 1 - s, duration: dur, ease: E.up }, at).to(st, { sx: 1, sy: 1, duration: 0.28, ease: 'elastic.out(1, .5)' }, at + dur)
const hop = (tl, at, h = 34, dx = 0) => {
  squash(tl, at, 0.1, 0.1)
  tl.to(st, { y: -h, duration: 0.24, ease: E.up }, at + 0.1).to(st, { y: 0, duration: 0.22, ease: E.down }, at + 0.34)
  if (dx) tl.to(st, { x: `+=${dx}`, duration: 0.46, ease: 'none' }, at + 0.1)
  tl.to(st, { footL: -6, footR: -3, duration: 0.2 }, at + 0.1).to(st, { footL: 0, footR: 0, duration: 0.2 }, at + 0.36)
  return squash(tl, at + 0.56, 0.12)
}
const rest = (tl, at, dur = 0.4) => {
  hand(tl, 'L', REST.L, at, dur); hand(tl, 'R', REST.R, at, dur)
  return tl.to(st, { lean: 0, lookX: 0, lookY: 0, scan: 0, duration: dur, ease: E.soft }, at)
}
const toNeutral = (tl, at) => {
  hand(tl, 'L', { x: 46, y: 196, r: 10, pose: 'open' }, at, 0.3)
  hand(tl, 'R', { x: 210, y: 196, r: -10, pose: 'open' }, at, 0.3)
  return tl
}

function build(name) {
  const tl = gsap.timeline({ paused: true })
  if (name === 'wave') {
    toNeutral(tl, 0)
    hop(tl, 0.05, 26)
    hand(tl, 'R', { x: 236, y: 70, r: -20, pose: 'open' }, 0.3, 0.3, E.up)
    for (let i = 0; i < 3; i++) hand(tl, 'R', { r: i % 2 ? -20 : 18 }, 0.62 + i * 0.22, 0.2)
    brows(tl, 0.3, { ly: -5, ry: -6 })
    speak(tl, 0.5, '¡Hola, soy Boxly!', 1.4)
    blink(tl, 1.8)
    rest(tl, 2.2)
    brows(tl, 2.2, {})
  } else if (name === 'scan') {
    toNeutral(tl, 0)
    tl.to(st, { lean: 4, lookX: 3, lookY: 2, duration: 0.3, ease: E.soft }, 0.1)
    hand(tl, 'R', { x: 236, y: 178, r: -20, pose: 'fist' }, 0.15, 0.35)
    tl.to(st, { scan: 1, duration: 0.1 }, 0.25)
    brows(tl, 0.3, { ly: 3, lr: 8, ry: 3, rr: -8 })
    mouth(tl, 0.3, 'line')
    tl.to(st, { beep: 1, duration: 0.01 }, 0.8).to(st, { beep: 0, duration: 0.01 }, 1.2)
    mouth(tl, 0.85, 'closed')
    brows(tl, 0.85, { ly: -3, ry: -3 })
    squash(tl, 0.9, 0.05)
    tl.to(st, { lookX: 0, lookY: 0, lean: 0, duration: 0.3 }, 1.3)
    mouth(tl, 1.4, 'smile')
    rest(tl, 1.6)
    brows(tl, 1.6, {})
  } else if (name === 'thumbs') {
    toNeutral(tl, 0)
    tl.to(st, { lean: -3, duration: 0.2 }, 0)
    squash(tl, 0.2, 0.1)
    rest(tl, 0.3, 0.35)
    tl.to(st, { lean: 3, duration: 0.3, ease: E.pop }, 0.35)
    brows(tl, 0.35, { ly: -5, ry: -6 })
    blink(tl, 1.0, 'R')
    mouth(tl, 1.0, 'closed'); mouth(tl, 1.7, 'smile')
    brows(tl, 1.6, {})
    tl.to(st, { lean: 0, duration: 0.4 }, 1.7)
  } else if (name === 'hmm') {
    toNeutral(tl, 0)
    hand(tl, 'R', { x: 214, y: 182, r: -40, pose: 'fist' }, 0.1)
    tl.to(st, { lookX: -3, lookY: -3, lean: -3, duration: 0.3 }, 0.1)
    brows(tl, 0.15, { ly: -4, lr: -10, ry: 3, rr: 12 })
    mouth(tl, 0.2, 'line')
    mouth(tl, 1.1, 'o')
    brows(tl, 1.1, { ly: -7, ry: -7 })
    mouth(tl, 1.5, 'smile')
    rest(tl, 1.6)
    brows(tl, 1.6, {})
  } else if (name === 'lift') {
    toNeutral(tl, 0)
    squash(tl, 0.1, 0.16, 0.2)
    tl.to(st, { carry: 1, duration: 0.15 }, 0.05)
    hand(tl, 'L', { x: 118, y: 236, r: 30, pose: 'open' }, 0.05, 0.25)
    hand(tl, 'R', { x: 214, y: 228, r: -40, pose: 'open' }, 0.05, 0.25)
    brows(tl, 0.1, { ly: 3, lr: 6, ry: 3, rr: -6 })
    mouth(tl, 0.1, 'line')
    hand(tl, 'L', { x: 120, y: 214, r: 30 }, 0.4, 0.35, E.up)
    hand(tl, 'R', { x: 216, y: 206, r: -40 }, 0.4, 0.35, E.up)
    tl.to(st, { sx: 0.94, sy: 1.06, duration: 0.3, ease: E.up }, 0.4).to(st, { sx: 1, sy: 1, duration: 0.4 }, 0.9)
    mouth(tl, 0.8, 'closed')
    brows(tl, 0.8, { ly: -3, ry: -3 })
    tl.to(st, { carry: 0, duration: 0.2 }, 1.45)
    rest(tl, 1.5)
    mouth(tl, 1.6, 'smile')
    brows(tl, 1.6, {})
  } else if (name === 'hop') {
    hop(tl, 0, 40)
  }
  return tl
}

// idle: breath + a blink every few seconds (never with reduced motion)
let idle = null, current = null
function startIdle() {
  idle = gsap.timeline({ repeat: -1 })
  idle.to(st, { sy: 1.012, sx: 0.994, duration: 1.4, ease: E.soft, yoyo: true, repeat: 1 }, 0)
  blink(idle, 2.2)
}

function play(name) {
  current?.progress(1).kill()
  current = build(name)
  current.play(0)
  return current
}

let tick = null
onMounted(() => {
  render()
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  tick = () => render()
  gsap.ticker.add(tick)
  startIdle()
})
onBeforeUnmount(() => { if (tick) gsap.ticker.remove(tick); idle?.kill(); current?.kill() })

defineExpose({ st, poses, build, play, render, REST })
</script>

<style scoped>
.boxly-rig { width: 100%; height: auto; overflow: visible; }
</style>
