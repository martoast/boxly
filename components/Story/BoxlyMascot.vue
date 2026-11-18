<template>
  <!-- Boxly, Erick's mascot, as a rig (landing story, 2026-11-18). Drawn exactly as Erick designed him: a closed yellow cube
       with navy edges, brows that carry the mood, puffy white mitts, navy legs with sock rolls and chunky navy sneakers.
       No added parts.
       How it moves (Pixar's principles, Alex 2026-11-18: "think like the animation team from Pixar"):
       - one state object `st`; GSAP timelines tween it and render() draws it every frame;
       - the BODY (cube + face) has its own crouch / squash / lean around the feet; the FEET are planted in the scene, so the
         legs are redrawn hip → knee → ankle every frame and the knees bend when he crouches (weight, anticipation);
       - arms are redrawn shoulder → elbow → glove every frame; gloves live in body space, so they ride with the body;
       - springs give follow-through: the face lags fast body moves, a carried carton sags and bobs against the gloves.
       The default state IS the final pose (Erick's thumbs up), which reduced motion and the server show. -->
  <svg class="boxly-rig" viewBox="-30 -10 320 320" role="img" aria-label="Boxly">
    <defs>
      <clipPath id="bx-eye-l"><ellipse cx="0" cy="0" rx="12.5" ry="15.5" /></clipPath>
      <clipPath id="bx-eye-r"><ellipse cx="0" cy="0" rx="12.5" ry="15.5" /></clipPath>
    </defs>
    <ellipse ref="shadow" cx="122" cy="288" rx="80" ry="9" fill="#0C254C" opacity=".12" />
    <g ref="root">
      <!-- legs (behind the cube): hip → knee → ankle, a sock roll round the ankle, the sneaker on the floor -->
      <path ref="legLp" :d="init.legL" stroke="#14306A" stroke-width="26" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      <path ref="legRp" :d="init.legR" stroke="#14306A" stroke-width="26" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      <rect ref="sockL" :transform="init.sockL" x="-17" y="-14" width="34" height="16" rx="8" class="sock" />
      <rect ref="sockR" :transform="init.sockR" x="-17" y="-14" width="34" height="16" rx="8" class="sock" />
      <g ref="shoeL" :transform="init.shoeL"><BoxlyShoe /></g>
      <g ref="shoeR" :transform="init.shoeR"><BoxlyShoe /></g>
      <!-- back arm (left), under the cube -->
      <path ref="armL" :d="init.armL" stroke="#14306A" stroke-width="24" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      <g ref="body">
        <g stroke="#0C254C" stroke-width="9" stroke-linejoin="round">
          <path d="M40 78 L126 46 L196 74 L104 98 Z" fill="#FFD62E" />
          <path d="M40 78 L104 98 L108 206 L46 182 Z" fill="#F4B800" />
          <path d="M104 98 L196 74 L200 184 L108 206 Z" fill="#FECD04" />
        </g>
        <g ref="face">
          <g transform="translate(134 141) rotate(-6)">
            <g ref="eyeL">
              <ellipse rx="12.5" ry="15.5" fill="#FFFDF6" />
              <g clip-path="url(#bx-eye-l)">
                <g ref="pupilL"><circle cx="2" cy="1.5" r="10" fill="#4A2A14" /><circle cx="2.5" cy="2" r="5.2" fill="#140904" /><circle cx="-1.6" cy="-2.8" r="2.8" fill="#fff" /></g>
                <rect ref="lidL" x="-14" y="-17" width="28" height="34" fill="#FECD04" transform="translate(0 -17) scale(1 0) translate(0 17)" />
              </g>
              <!-- ONE outline (Alex: no doubled lid line) -->
              <ellipse rx="12.5" ry="15.5" fill="none" stroke="#0C254C" stroke-width="3.2" />
            </g>
            <path ref="shutL" d="M-11 2 Q0 -9 11 2" stroke="#0C254C" stroke-width="3.8" stroke-linecap="round" fill="none" opacity="0" />
          </g>
          <g transform="translate(173 134) rotate(-6)">
            <g ref="eyeR">
              <ellipse rx="12.5" ry="15.5" fill="#FFFDF6" />
              <g clip-path="url(#bx-eye-r)">
                <g ref="pupilR"><circle cx="2" cy="1.5" r="10" fill="#4A2A14" /><circle cx="2.5" cy="2" r="5.2" fill="#140904" /><circle cx="-1.6" cy="-2.8" r="2.8" fill="#fff" /></g>
                <rect ref="lidR" x="-14" y="-17" width="28" height="34" fill="#FECD04" transform="translate(0 -17) scale(1 0) translate(0 17)" />
              </g>
              <ellipse rx="12.5" ry="15.5" fill="none" stroke="#0C254C" stroke-width="3.2" />
            </g>
            <path ref="shutR" d="M-11 2 Q0 -9 11 2" stroke="#0C254C" stroke-width="3.8" stroke-linecap="round" fill="none" opacity="0" />
          </g>
          <path ref="browL" :transform="`translate(${BROW.L[0]} ${BROW.L[1]})`" d="M-11 3 Q0 -5 11 0" stroke="#0C254C" stroke-width="6" stroke-linecap="round" fill="none" />
          <path ref="browR" :transform="`translate(${BROW.R[0]} ${BROW.R[1]})`" d="M-11 3 Q0 -6 11 -1" stroke="#0C254C" stroke-width="6" stroke-linecap="round" fill="none" />
          <g ref="mouths" :transform="`translate(${MOUTH[0]} ${MOUTH[1]})`">
            <g data-m="smile">
              <path d="M-18 -4 Q-1 2 17 -9 Q15 12 -1 13 Q-15 12 -18 -4 Z" fill="#7A2414" stroke="#0C254C" stroke-width="1.6" />
              <path d="M-15 -2.6 Q-1 2.4 14.5 -7.4 L13.6 -3.6 Q-1 4.6 -14.4 0.6 Z" fill="#FFFDF6" />
              <path d="M-8 9 Q0 4 9 7 Q3 13 -2 12.6 Q-6 12 -8 9 Z" fill="#E8775A" />
            </g>
            <path data-m="closed" opacity="0" d="M-15 -3 Q0 8 15 -7" stroke="#0C254C" stroke-width="3.6" stroke-linecap="round" fill="none" />
            <path data-m="smirk" opacity="0" d="M-12 1 Q2 6 15 -7" stroke="#0C254C" stroke-width="3.6" stroke-linecap="round" fill="none" />
            <ellipse data-m="o" opacity="0" cx="0" cy="2" rx="6" ry="7.5" fill="#7A2414" stroke="#0C254C" stroke-width="1.6" />
            <path data-m="line" opacity="0" d="M-10 1 Q0 -1 10 0" stroke="#0C254C" stroke-width="3.4" stroke-linecap="round" fill="none" />
            <g data-m="strain" opacity="0">
              <rect x="-13" y="-4" width="26" height="10" rx="5" fill="#FFFDF6" stroke="#0C254C" stroke-width="2.4" />
              <path d="M-6 -4 V6 M0 -4 V6 M6 -4 V6" stroke="#0C254C" stroke-width="1.4" />
            </g>
            <g data-m="talk" opacity="0">
              <path d="M-13 -3 Q0 1 13 -6 Q11 9 0 9.5 Q-11 9 -13 -3 Z" fill="#7A2414" stroke="#0C254C" stroke-width="1.6" />
              <path d="M-10 -1.6 Q0 1.6 10 -4.4 L9.4 -1.6 Q0 3.6 -9.6 0.8 Z" fill="#FFFDF6" />
            </g>
          </g>
        </g>
      </g>
      <!-- the carton lives in the scene: on the floor until he picks it up -->
      <g ref="carton" opacity="0">
        <rect x="-34" y="-26" width="68" height="52" rx="5" fill="#C98B4E" stroke="#8A5A2B" stroke-width="2.5" />
        <path d="M-34 -10 H34 M0 -26 V-10" stroke="#8A5A2B" stroke-width="2" />
        <rect x="-12" y="4" width="24" height="12" rx="2" fill="#FFFDF6" />
      </g>
      <g ref="handL" :transform="init.handL"><BoxlyGlove :pose="poses.L" side="L" /></g>
      <path ref="armR" :d="init.armR" stroke="#14306A" stroke-width="24" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      <g ref="handR" :transform="init.handR">
        <g ref="scanner" opacity="0">
          <rect x="-11" y="-58" width="22" height="44" rx="6" fill="#2B3445" stroke="#0C254C" stroke-width="2" />
          <rect ref="scanLight" x="-8" y="-58" width="16" height="9" rx="3" fill="#E5484D" />
        </g>
        <BoxlyGlove :pose="poses.R" side="R" />
      </g>
    </g>
    <g ref="say" opacity="0">
      <rect x="-4" y="-18" :width="sayW" height="30" rx="15" fill="#fff" stroke="#0C254C" stroke-width="2" />
      <text x="10" y="2" font-size="14" font-weight="700" fill="#0C254C" font-family="inherit">{{ sayText }}</text>
    </g>
  </svg>
</template>

<script setup>
import { gsap } from 'gsap'
import BoxlyGlove from './BoxlyGlove.vue'
import BoxlyShoe from './BoxlyShoe.vue'

// ---- skeleton (body space = the cube's own drawing coordinates) ----
const PIVOT = [122, 286]                       // the body squashes / leans around the point between his feet
const SHOULDER = { L: [46, 150], R: [199, 172] } // left: mid-height of the side face; right: mouth level on the front edge
const HIP = { L: [94, 198], R: [146, 200] }
const ARM = 90, LEG = 50
const ANKLE = { L: [80, 244], R: [148, 246] }  // where the feet stand (scene space)
const SHOE_AT = { L: [-6, 22], R: [8, 22] }     // the sneaker relative to the ankle
// Erick's pose: the left fist on the hip, the right thumb up
const REST = { L: { x: 52, y: 202, r: 10, pose: 'fist' }, R: { x: 244, y: 116, r: -8, pose: 'thumb' } }
const EYE = { L: [134, 141], R: [173, 134] }, BROW = { L: [132, 117], R: [172, 109] }, MOUTH = [155, 171]

const refsList = ['root', 'body', 'shadow', 'face', 'legLp', 'legRp', 'sockL', 'sockR', 'shoeL', 'shoeR', 'armL', 'armR', 'handL', 'handR',
  'pupilL', 'pupilR', 'lidL', 'lidR', 'eyeL', 'eyeR', 'shutL', 'shutR', 'browL', 'browR', 'mouths', 'scanner', 'scanLight', 'carton', 'say']
const R = Object.fromEntries(refsList.map((k) => [k, ref(null)]))
const { root, body, shadow, face, legLp, legRp, sockL, sockR, shoeL, shoeR, armL, armR, handL, handR, pupilL, pupilR, lidL, lidR,
  eyeL, eyeR, shutL, shutR, browL, browR, mouths, scanner, scanLight, carton, say } = R
const poses = reactive({ L: REST.L.pose, R: REST.R.pose })
const sayText = ref('')
const sayW = computed(() => 22 + sayText.value.length * 7.6)

const base = () => ({
  x: 0, y: 0,                                  // root (the whole character: hops, walks)
  bx: 0, by: 0, sx: 1, sy: 1, lean: 0,         // the body: shift, crouch (down +), squash, lean (deg)
  fLx: ANKLE.L[0], fLy: ANKLE.L[1], fLr: 0, fRx: ANKLE.R[0], fRy: ANKLE.R[1], fRr: 0,
  lookX: 0, lookY: 0, blinkL: 0, blinkR: 0,
  browLy: 0, browLr: 0, browRy: 0, browRr: 0, mouthX: 0, mouth: 'smile',
  hLx: REST.L.x, hLy: REST.L.y, hLr: REST.L.r, hRx: REST.R.x, hRy: REST.R.y, hRr: REST.R.r,
  scan: 0, beep: 0, say: 0,
  cOn: 0, cHeld: 0, cFx: 214, cFy: 256,        // carton: shown, held (0 floor → 1 in the gloves), its floor spot
})
const st = reactive(base())

// body space → scene space, with the current crouch / squash / lean
function T(p, s = st) {
  const rad = (s.lean * Math.PI) / 180, c = Math.cos(rad), si = Math.sin(rad)
  const dx = (p[0] - PIVOT[0]) * s.sx, dy = (p[1] - PIVOT[1]) * s.sy
  return [PIVOT[0] + s.bx + dx * c - dy * si, PIVOT[1] + s.by + dx * si + dy * c]
}
// scene space → body space, for a planned body pose (to put the gloves on something in the scene)
function inv(q, s) {
  const rad = (-s.lean * Math.PI) / 180, c = Math.cos(rad), si = Math.sin(rad)
  const dx = q[0] - PIVOT[0] - s.bx, dy = q[1] - PIVOT[1] - s.by
  return [PIVOT[0] + (dx * c - dy * si) / s.sx, PIVOT[1] + (dx * si + dy * c) / s.sy]
}
// a two-bone limb: root → joint → tip, the joint bent toward `prefer` (a unit-ish direction)
function limb(a, b, len, prefer, cap) {
  const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1
  const bend = Math.min(cap, d < len ? Math.sqrt((len / 2) ** 2 - (d / 2) ** 2) : 0)
  let nx = -dy / d, ny = dx / d
  if (nx * prefer[0] + ny * prefer[1] < 0) { nx = -nx; ny = -ny }
  const j = [(a[0] + b[0]) / 2 + nx * bend, (a[1] + b[1]) / 2 + ny * bend]
  return `M${a[0].toFixed(1)} ${a[1].toFixed(1)} L${j[0].toFixed(1)} ${j[1].toFixed(1)} L${b[0].toFixed(1)} ${b[1].toFixed(1)}`
}

// the rest pose as attributes, rendered on the server too
const init = (() => {
  const a = (side) => [st['f' + side + 'x'], st['f' + side + 'y']]
  const hL = T([st.hLx, st.hLy]), hR = T([st.hRx, st.hRy])
  return {
    legL: limb(T(HIP.L), a('L'), LEG, [1, -0.15], 30), legR: limb(T(HIP.R), a('R'), LEG, [1, -0.15], 30),
    sockL: `translate(${a('L')[0]} ${a('L')[1] + 2})`, sockR: `translate(${a('R')[0]} ${a('R')[1] + 2})`,
    shoeL: `translate(${a('L')[0] + SHOE_AT.L[0]} ${a('L')[1] + SHOE_AT.L[1]})`, shoeR: `translate(${a('R')[0] + SHOE_AT.R[0]} ${a('R')[1] + SHOE_AT.R[1]})`,
    armL: limb(T(SHOULDER.L), hL, ARM, [-1, 0.7], 22), armR: limb(T(SHOULDER.R), hR, ARM, [1, 0.7], 34),
    handL: `translate(${hL[0]} ${hL[1]}) rotate(${st.hLr})`, handR: `translate(${hR[0]} ${hR[1]}) rotate(${st.hRr})`,
  }
})()

// ---- springs (follow-through), stepped every frame ----
const spr = { face: { x: 0, y: 0, vx: 0, vy: 0 }, box: { x: 0, y: 0, vx: 0, vy: 0 } }
let lastBody = null, lastVel = [0, 0], lastHands = null
function step(s, k, damp, ax, ay, lim) {
  s.vx = (s.vx + ax - s.x * k) * damp; s.vy = (s.vy + ay - s.y * k) * damp
  s.x = Math.max(-lim, Math.min(lim, s.x + s.vx)); s.y = Math.max(-lim, Math.min(lim, s.y + s.vy))
}

const at = (el, v) => el.setAttribute('transform', v)
function render() {
  if (!root.value) return
  // springs: the face lags the body's acceleration; the carton lags the gloves
  const bc = T([122, 140]); const bodyW = [bc[0] + st.x, bc[1] + st.y]
  if (lastBody) {
    const v = [bodyW[0] - lastBody[0], bodyW[1] - lastBody[1]]
    step(spr.face, 0.16, 0.72, -(v[0] - lastVel[0]) * 0.55, -(v[1] - lastVel[1]) * 0.55, 4)
    lastVel = v
  }
  lastBody = bodyW
  const hands = [(st.hLx + st.hRx) / 2, (st.hLy + st.hRy) / 2]
  if (lastHands && st.cHeld > 0.5) step(spr.box, 0.2, 0.7, -(hands[0] - lastHands[0]) * 0.35, -(hands[1] - lastHands[1]) * 0.5, 9)
  lastHands = hands

  at(root.value, `translate(${st.x} ${st.y})`)
  at(body.value, `translate(${PIVOT[0] + st.bx} ${PIVOT[1] + st.by}) rotate(${st.lean}) scale(${st.sx} ${st.sy}) translate(${-PIVOT[0]} ${-PIVOT[1]})`)
  const air = Math.min(0.55, Math.max(0, -st.y) / 120)
  at(shadow.value, `translate(${st.x + (st.fLx + st.fRx) / 2 - 114} 0) translate(122 288) scale(${1 - air} 1) translate(-122 -288)`)
  shadow.value.setAttribute('opacity', 0.12 * (1 - air))

  // legs: hip (on the body) → knee (bends forward, toward the front face) → ankle (planted)
  for (const [side, path, sock, shoe] of [['L', legLp, sockL, shoeL], ['R', legRp, sockR, shoeR]]) {
    const hip = T(HIP[side]), ank = [st['f' + side + 'x'], st['f' + side + 'y']]
    path.value.setAttribute('d', limb(hip, ank, LEG, [1, -0.15], 30))
    at(sock.value, `translate(${ank[0]} ${ank[1] + 2})`)
    at(shoe.value, `translate(${ank[0] + SHOE_AT[side][0]} ${ank[1] + SHOE_AT[side][1]}) rotate(${st['f' + side + 'r']})`)
  }

  // face: lags (spring), looks, blinks (lids close from the top; fully shut = a happy arc)
  at(face.value, `translate(${st.lookX * 0.6 + spr.face.x} ${st.lookY * 0.5 + spr.face.y})`)
  for (const [side, pupil, lid, eye, shut] of [['L', pupilL, lidL, eyeL, shutL], ['R', pupilR, lidR, eyeR, shutR]]) {
    const b = st['blink' + side]
    at(pupil.value, `translate(${st.lookX} ${st.lookY})`)
    at(lid.value, `translate(0 -17) scale(1 ${b}) translate(0 17)`)
    eye.value.setAttribute('opacity', b > 0.85 ? 0 : 1)
    shut.value.setAttribute('opacity', b > 0.85 ? 1 : 0)
  }
  at(browL.value, `translate(${BROW.L[0]} ${BROW.L[1] + st.browLy}) rotate(${st.browLr})`)
  at(browR.value, `translate(${BROW.R[0]} ${BROW.R[1] + st.browRy}) rotate(${st.browRr})`)
  at(mouths.value, `translate(${MOUTH[0] + st.mouthX} ${MOUTH[1]})`)
  for (const m of mouths.value.children) m.setAttribute('opacity', m.dataset.m === st.mouth ? 1 : 0)

  // arms: shoulder → elbow (down and out) → glove; the gloves are in body space
  const hL = T([st.hLx, st.hLy]), hR = T([st.hRx, st.hRy])
  armL.value.setAttribute('d', limb(T(SHOULDER.L), hL, ARM, [-1, 0.7], 22))
  armR.value.setAttribute('d', limb(T(SHOULDER.R), hR, ARM, [1, 0.7], 34))
  at(handL.value, `translate(${hL[0]} ${hL[1]}) rotate(${st.hLr + st.lean})`)
  at(handR.value, `translate(${hR[0]} ${hR[1]}) rotate(${st.hRr + st.lean})`)
  scanner.value.setAttribute('opacity', st.scan)
  scanLight.value.setAttribute('fill', st.beep > 0.5 ? '#3DD68C' : '#E5484D')

  // carton: on the floor, or between the gloves (sagging on its spring)
  const held = [(hL[0] + hR[0]) / 2 + spr.box.x, (hL[1] + hR[1]) / 2 - 18 + spr.box.y]
  const cx = st.cFx + (held[0] - st.cFx) * st.cHeld, cy = st.cFy + (held[1] - st.cFy) * st.cHeld
  carton.value.setAttribute('opacity', st.cOn)
  at(carton.value, `translate(${cx} ${cy}) rotate(${spr.box.x * 0.8})`)

  say.value.setAttribute('opacity', st.say)
  at(say.value, `translate(${148 + st.x} ${16 + st.y + (1 - st.say) * 8})`)
}

// ---- choreography helpers ----
const E = { out: 'power2.out', in: 'power2.in', io: 'power2.inOut', soft: 'sine.inOut', pop: 'back.out(2.4)', over: 'back.out(1.6)', heavy: 'power3.inOut', settle: 'elastic.out(1, .45)' }
const to = (tl, vars, t, dur = 0.3, ease = E.io) => tl.to(st, { ...vars, duration: dur, ease }, t)
function hand(tl, side, p, t, dur = 0.3, ease = E.io) {
  const k = side === 'L' ? 'hL' : 'hR', v = {}
  if (p.x !== undefined) v[k + 'x'] = p.x
  if (p.y !== undefined) v[k + 'y'] = p.y
  if (p.r !== undefined) v[k + 'r'] = p.r
  to(tl, v, t, dur, ease)
  if (p.pose) tl.call(() => { poses[side] = p.pose }, null, t + (p.poseAt ?? 0))
}
// a hand on an ARC: x eases out while y eases in (or the other way), never a straight slide
function arc(tl, side, p, t, dur, up = true) {
  const k = side === 'L' ? 'hL' : 'hR'
  tl.to(st, { [k + 'x']: p.x, duration: dur, ease: up ? 'power1.out' : 'power2.in' }, t)
  tl.to(st, { [k + 'y']: p.y, duration: dur, ease: up ? 'power2.out' : 'power1.in' }, t)
  if (p.r !== undefined) tl.to(st, { [k + 'r']: p.r, duration: dur * 1.15, ease: E.out }, t + dur * 0.12) // the wrist trails
  if (p.pose) tl.call(() => { poses[side] = p.pose }, null, t + dur * 0.4)
}
const brows = (tl, t, b = {}, dur = 0.18, ease = E.out) => to(tl, { browLy: b.ly ?? 0, browLr: b.lr ?? 0, browRy: b.ry ?? 0, browRr: b.rr ?? 0 }, t, dur, ease)
const mouth = (tl, t, m) => tl.call(() => { st.mouth = m }, null, t)
function blink(tl, t, which = 'both', hold = 0.06) {
  const ks = which === 'both' ? ['blinkL', 'blinkR'] : ['blink' + which]
  tl.to(st, { ...Object.fromEntries(ks.map((k) => [k, 1])), duration: 0.06, ease: 'none' }, t)
  tl.to(st, { ...Object.fromEntries(ks.map((k) => [k, 0])), duration: 0.1, ease: 'none' }, t + 0.06 + hold)
}
function speak(tl, t, text, hold = 1.2) {
  tl.call(() => { sayText.value = text }, null, t)
  to(tl, { say: 1 }, t, 0.2, E.pop)
  for (let u = t; u < t + Math.min(hold, 0.95); u += 0.17) { mouth(tl, u, 'talk'); mouth(tl, u + 0.085, 'smile') }
  to(tl, { say: 0 }, t + hold, 0.2, E.in)
}
// back to Erick's pose, overlapping: the body settles first, the arms follow, the face last
function home(tl, t, dur = 0.5) {
  to(tl, { bx: 0, by: 0, sx: 1, sy: 1, lean: 0 }, t, dur, E.over)
  hand(tl, 'L', REST.L, t + 0.05, dur, E.over)
  arc(tl, 'R', REST.R, t + 0.08, dur)
  to(tl, { lookX: 0, lookY: 0, mouthX: 0, scan: 0 }, t + 0.12, dur, E.soft)
  brows(tl, t + 0.15, {}, dur)
  mouth(tl, t + 0.2, 'smile')
  to(tl, { fLx: ANKLE.L[0], fLy: ANKLE.L[1], fLr: 0, fRx: ANKLE.R[0], fRy: ANKLE.R[1], fRr: 0 }, t, dur * 0.8, E.out)
}
// out of Erick's pose into a loose stance (gloves down at his sides)
function loosen(tl, t, dur = 0.25) {
  hand(tl, 'L', { x: 30, y: 214, r: 15, pose: 'open', poseAt: 0.08 }, t, dur)
  hand(tl, 'R', { x: 222, y: 218, r: -15, pose: 'open', poseAt: 0.08 }, t, dur)
}
// a foot step on an arc (lift, move, plant with a heel-toe roll)
function stepFoot(tl, side, dx, t, dur = 0.28, h = 10) {
  const k = 'f' + side
  tl.to(st, { [k + 'x']: `+=${dx}`, duration: dur, ease: E.io }, t)
  tl.to(st, { [k + 'y']: `-=${h}`, duration: dur / 2, ease: E.out }, t).to(st, { [k + 'y']: `+=${h}`, duration: dur / 2, ease: E.in }, t + dur / 2)
  tl.to(st, { [k + 'r']: dx > 0 ? -12 : 12, duration: dur / 2, ease: E.out }, t).to(st, { [k + 'r']: 0, duration: dur / 2, ease: E.over }, t + dur / 2)
}

// a travelling hop (the story moves him between stations): anticipation, a stretched arc, a squashed landing
function hopTo(tl, t, x, h = 22, dur = 0.42) {
  to(tl, { by: 6, sx: 1.05, sy: 0.95 }, t, 0.1, E.out)
  to(tl, { by: -3, sx: 0.96, sy: 1.04 }, t + 0.1, 0.12, E.out)
  tl.to(st, { x, duration: dur, ease: 'power1.inOut' }, t + 0.1)
  tl.to(st, { y: -h, duration: dur / 2, ease: E.out }, t + 0.1).to(st, { y: 0, duration: dur / 2, ease: E.in }, t + 0.1 + dur / 2)
  to(tl, { fLy: ANKLE.L[1] - 8, fRy: ANKLE.R[1] - 5, fLr: 10, fRr: -6 }, t + 0.12, dur / 2, E.out)
  to(tl, { fLy: ANKLE.L[1], fRy: ANKLE.R[1], fLr: 0, fRr: 0 }, t + 0.1 + dur / 2, dur / 2, E.in)
  to(tl, { by: 5, sx: 1.05, sy: 0.95 }, t + 0.1 + dur, 0.07, E.out)
  to(tl, { by: 0, sx: 1, sy: 1 }, t + 0.17 + dur, 0.3, E.settle)
}

// ---- the moves ----
const MOVES = {
  // WAVE: dip (anticipation) → spring up onto his toes with a stretch → the arm swings up on an arc → a wave whose wrist
  // trails the hand and loses energy → the arm drops past rest and settles (follow-through)
  wave(tl) {
    to(tl, { by: 8, sx: 1.05, sy: 0.95, lean: -4 }, 0, 0.16, E.out)
    loosen(tl, 0, 0.16)
    brows(tl, 0, { ly: 2, ry: 2 }, 0.12)
    tl.addLabel('up', 0.16)
    to(tl, { by: -6, sx: 0.96, sy: 1.05, lean: 5 }, 'up', 0.22, E.out)
    to(tl, { y: -14 }, 'up', 0.2, E.out).to(st, { y: 0, duration: 0.2, ease: E.in }, 'up+=0.2')
    arc(tl, 'R', { x: 246, y: 62, r: -22, pose: 'open' }, 0.16, 0.3)
    brows(tl, 0.18, { ly: -7, ry: -8 }, 0.16, E.pop)
    mouth(tl, 0.18, 'o')
    to(tl, { by: 4, sx: 1.05, sy: 0.95 }, 0.56, 0.08, E.out)
    to(tl, { by: 0, sx: 1, sy: 1 }, 0.64, 0.35, E.settle)
    speak(tl, 0.55, '¡Hola, soy Boxly!', 1.35)
    const amp = [26, -22, 18, -14, 9]
    amp.forEach((a, i) => {
      const t = 0.62 + i * 0.17
      to(tl, { hRx: 246 + (a > 0 ? 7 : -5) * (1 - i / 6) }, t, 0.17, E.soft)
      to(tl, { hRr: a }, t + 0.04, 0.17, E.soft) // the wrist trails the hand
    })
    to(tl, { lookX: 2, lookY: -1 }, 0.6, 0.3, E.soft)
    blink(tl, 1.55)
    // arm down past rest, then settle
    arc(tl, 'R', { x: 228, y: 210, r: -10, pose: 'open' }, 1.75, 0.22, false)
    home(tl, 1.97, 0.55)
  },
  // SCAN: spots the package (eyes first) → reaches back for the scanner (anticipation) → pulls it out on an arc → leans in,
  // squints, holds steady → BEEP: a tiny recoil, brows pop, a pleased double nod → holsters it
  scan(tl) {
    to(tl, { lookX: 4, lookY: 3 }, 0, 0.12, E.out)
    brows(tl, 0, { ly: -5, ry: -5 }, 0.12, E.pop)
    loosen(tl, 0.06, 0.22)
    hand(tl, 'R', { x: 214, y: 150, r: 20, pose: 'fist', poseAt: 0.1 }, 0.14, 0.2, E.out)
    to(tl, { lean: -3, by: -2 }, 0.14, 0.2)
    to(tl, { scan: 1 }, 0.32, 0.08)
    arc(tl, 'R', { x: 246, y: 190, r: -12 }, 0.34, 0.26, false)
    to(tl, { lean: 7, by: 7, sx: 1.03, sy: 0.97, bx: 4 }, 0.36, 0.3, E.io)
    stepFoot(tl, 'R', 8, 0.36, 0.26, 6)
    to(tl, { blinkL: 0.42, blinkR: 0.42 }, 0.62, 0.1)
    brows(tl, 0.62, { ly: 4, lr: 9, ry: 4, rr: -9 }, 0.12)
    mouth(tl, 0.62, 'line')
    to(tl, { mouthX: 3 }, 0.62, 0.1)
    for (let i = 0; i < 3; i++) to(tl, { hRy: 190 + (i % 2 ? 1.2 : -1.2) }, 0.7 + i * 0.06, 0.06, 'none') // holding steady
    tl.addLabel('beep', 0.95)
    tl.to(st, { beep: 1, duration: 0.01 }, 'beep') // stays green (scanned ✓) until it is put away
    to(tl, { blinkL: 0, blinkR: 0, mouthX: 0 }, 'beep', 0.08)
    brows(tl, 'beep', { ly: -7, ry: -8 }, 0.12, E.pop)
    mouth(tl, 'beep', 'smile')
    to(tl, { by: 1, sy: 1.04, lean: 3, hRy: 182 }, 'beep', 0.08, E.out)
    to(tl, { lean: 9, by: 5 }, 'beep+=0.12', 0.12, E.io).to(st, { lean: 4, by: 3, duration: 0.12, ease: E.io }, 'beep+=0.24')
    to(tl, { lean: 9, by: 5 }, 'beep+=0.36', 0.1, E.io).to(st, { lean: 4, by: 3, duration: 0.14, ease: E.io }, 'beep+=0.46')
    hand(tl, 'R', { x: 214, y: 160, r: 30 }, 'beep+=0.65', 0.2, E.in)
    to(tl, { scan: 0 }, 'beep+=0.82', 0.06)
    tl.set(st, { beep: 0 }, 'beep+=0.9')
    home(tl, 1.85, 0.5)
  },
  // LIFT: notices the carton → a breath in (anticipation) → a light squat with bent knees, grips it → lifts it in one
  // smooth, confident rise with a little bounce (no struggling — Alex) → proud → sets it down → dusts his gloves off
  lift(tl) {
    const crouch = { bx: 12, by: 7, sx: 1.04, sy: 0.96, lean: 13 }
    // the mitts on the carton's SIDES, under its bottom corners, so the box stays in view between them
    const gripL = inv([st.cFx - 40, st.cFy + 18], crouch), gripR = inv([st.cFx + 40, st.cFy + 18], crouch)
    const carry = { bx: 0, by: -3, sx: 0.98, sy: 1.03, lean: -2 }
    const cL = [114, 236], cR = [206, 232]
    tl.set(st, { cOn: 1, cHeld: 0 }, 0)
    // notice
    to(tl, { lookX: 4, lookY: 4, lean: 3 }, 0, 0.18, E.out)
    brows(tl, 0.04, { ly: -6, ry: -6 }, 0.14, E.pop)
    mouth(tl, 0.06, 'o')
    loosen(tl, 0.1, 0.25)
    // breath in (rises a little: anticipation of the squat)
    to(tl, { by: -4, sx: 0.97, sy: 1.04, lean: -2 }, 0.32, 0.22, E.out)
    mouth(tl, 0.36, 'closed')
    // squat + reach (knees bend because the feet stay planted)
    tl.addLabel('down', 0.56)
    to(tl, crouch, 'down', 0.26, E.io)
    stepFoot(tl, 'R', 12, 'down', 0.26, 7)
    hand(tl, 'L', { x: gripL[0], y: gripL[1], r: 100, pose: 'open' }, 'down+=0.06', 0.3, E.io)
    hand(tl, 'R', { x: gripR[0], y: gripR[1], r: -100, pose: 'open' }, 'down+=0.06', 0.3, E.io)
    brows(tl, 'down+=0.1', { ly: 1, ry: 1 }, 0.15)
    mouth(tl, 'down+=0.12', 'closed')
        // the lift: easy and confident (Alex: no struggling) — one smooth rise with a little bounce, a happy carry
    tl.addLabel('heave', 1.0)
    to(tl, { cHeld: 1 }, 'heave', 0.12, E.out)
    to(tl, carry, 'heave', 0.38, E.over)
    hand(tl, 'L', { x: cL[0], y: cL[1], r: 95 }, 'heave', 0.38, E.over)
    hand(tl, 'R', { x: cR[0], y: cR[1], r: -95 }, 'heave', 0.38, E.over)
    brows(tl, 'heave', { ly: -5, ry: -6 }, 0.14, E.pop)
    mouth(tl, 'heave', 'smile')
    to(tl, { lookX: 1, lookY: 0 }, 'heave', 0.2)
    // proud
    tl.addLabel('proud', 1.45)
    to(tl, { blinkL: 0, blinkR: 0, lookX: -1, lookY: -2 }, 'proud', 0.12)
    brows(tl, 'proud', { ly: -6, ry: -7 }, 0.14, E.pop)
    mouth(tl, 'proud', 'smile')
    to(tl, { by: -8, sy: 1.07 }, 'proud+=0.05', 0.14, E.out).to(st, { by: -4, sy: 1.05, duration: 0.3, ease: E.settle }, 'proud+=0.19')
    // set it down (knees bend again, gently)
    tl.addLabel('set', 2.15)
    const setDown = { bx: 10, by: 6, sx: 1.04, sy: 0.96, lean: 11 }
    to(tl, setDown, 'set', 0.4, E.io)
    mouth(tl, 'set', 'closed')
    to(tl, { lookX: 4, lookY: 4 }, 'set', 0.2)
    const putL = inv([st.cFx - 40 - 22, st.cFy + 18], setDown), putR = inv([st.cFx + 40 - 22, st.cFy + 18], setDown)
    hand(tl, 'L', { x: putL[0], y: putL[1], r: 100 }, 'set', 0.4, E.io)
    hand(tl, 'R', { x: putR[0], y: putR[1], r: -100 }, 'set', 0.4, E.io)
    tl.set(st, { cFx: st.cFx - 22 }, 'set')
    to(tl, { cHeld: 0 }, 'set+=0.34', 0.12, E.in)
        // stand, dust the gloves off (secondary action), back to Erick's pose
    tl.addLabel('dust', 2.7)
    to(tl, { bx: 0, by: 0, sx: 1, sy: 1, lean: 0, lookX: 0, lookY: 0 }, 'dust', 0.3, E.over)
    hand(tl, 'L', { x: 126, y: 226, r: 10 }, 'dust', 0.22)
    hand(tl, 'R', { x: 154, y: 224, r: -10 }, 'dust', 0.22)
    for (let i = 0; i < 2; i++) {
      to(tl, { hLx: 140, hRx: 140 }, `dust+=${0.24 + i * 0.16}`, 0.07, E.in)
      to(tl, { hLx: 124, hRx: 156 }, `dust+=${0.31 + i * 0.16}`, 0.09, E.out)
    }
    mouth(tl, 'dust+=0.24', 'smile')
    brows(tl, 'dust+=0.24', { ly: -3, ry: -3 }, 0.2)
    home(tl, 3.3, 0.55)
    to(tl, { cOn: 0 }, 3.5, 0.3)
  },
  // THINK: looks up and aside, one brow up, glove to the chin, the mouth slides to one side, eyes dart → AHA: brows shoot
  // up, a little hop, the glove springs open → settles happy
  hmm(tl) {
    to(tl, { lookX: -3, lookY: -4, lean: -3 }, 0, 0.25, E.out)
    brows(tl, 0.05, { ly: -8, lr: -10, ry: 4, rr: 12 }, 0.2)
    mouth(tl, 0.08, 'line')
    to(tl, { mouthX: -4 }, 0.08, 0.2)
    hand(tl, 'L', { x: 30, y: 214, r: 15, pose: 'open', poseAt: 0.05 }, 0.05, 0.25)
    arc(tl, 'R', { x: 172, y: 186, r: -40, pose: 'fist' }, 0.05, 0.3, false)
    for (let i = 0; i < 3; i++) to(tl, { hRr: i % 2 ? -40 : -28 }, 0.45 + i * 0.16, 0.1, E.soft) // tapping the chin
    to(tl, { lookX: 3 }, 0.6, 0.14, E.io).to(st, { lookX: -2, duration: 0.14, ease: E.io }, 0.9)
    to(tl, { mouthX: 3 }, 0.62, 0.14, E.io)
    tl.addLabel('aha', 1.25)
    to(tl, { by: 5, sy: 0.96, sx: 1.04 }, 'aha', 0.1, E.out)
    to(tl, { by: -6, sy: 1.05, sx: 0.96, lean: 3 }, 'aha+=0.1', 0.16, E.out)
    to(tl, { y: -16 }, 'aha+=0.1', 0.16, E.out).to(st, { y: 0, duration: 0.16, ease: E.in }, 'aha+=0.26')
    to(tl, { lookX: 0, lookY: 0, mouthX: 0 }, 'aha+=0.1', 0.12)
    brows(tl, 'aha+=0.1', { ly: -9, ry: -10 }, 0.1, E.pop)
    mouth(tl, 'aha+=0.1', 'o')
    arc(tl, 'R', { x: 236, y: 92, r: -10, pose: 'open' }, 1.35, 0.2)
    to(tl, { by: 4, sx: 1.05, sy: 0.95 }, 'aha+=0.42', 0.06).to(st, { by: 0, sx: 1, sy: 1, duration: 0.35, ease: E.settle }, 'aha+=0.48')
    mouth(tl, 'aha+=0.5', 'smile')
    home(tl, 2.15, 0.5)
  },
  // THUMBS: winds back (anticipation, a cocky look) → punches the thumb forward on an arc, leaning in with a stretch →
  // a held wink with a smirk → settles with an overshoot
  thumbs(tl) {
    to(tl, { lean: -6, by: 5, sx: 1.04, sy: 0.96, bx: -4 }, 0, 0.22, E.out)
    hand(tl, 'R', { x: 206, y: 176, r: 20, pose: 'fist' }, 0, 0.22, E.out)
    brows(tl, 0, { ly: 2, lr: 6, ry: -2, rr: -4 }, 0.2)
    mouth(tl, 0.02, 'smirk')
    tl.addLabel('punch', 0.24)
    to(tl, { lean: 7, by: -3, sx: 0.96, sy: 1.04, bx: 4 }, 'punch', 0.16, E.out)
    arc(tl, 'R', { x: 252, y: 108, r: -12, pose: 'thumb' }, 0.24, 0.18)
    stepFoot(tl, 'R', 8, 'punch', 0.22, 6)
    brows(tl, 'punch', { ly: -6, ry: -7 }, 0.12, E.pop)
    mouth(tl, 'punch+=0.06', 'smile')
    to(tl, { lean: 4, by: 1, sx: 1, sy: 1, hRx: 246, hRy: 114 }, 'punch+=0.18', 0.4, E.settle)
    blink(tl, 0.7, 'R', 0.6)
    mouth(tl, 0.7, 'smirk')
    brows(tl, 0.7, { ly: -6, ry: 3, rr: 8 }, 0.1)
    mouth(tl, 1.42, 'smile')
    home(tl, 1.55, 0.6)
  },
  // HOP: a deep crouch (anticipation) → a stretched take-off → tucked feet and arms up at the top → a squashed landing that
  // overshoots and settles; the arms follow through after the body
  hop(tl) {
    loosen(tl, 0, 0.18)
    to(tl, { by: 12, sx: 1.07, sy: 0.935 }, 0, 0.2, E.out)
    brows(tl, 0, { ly: 3, ry: 3 }, 0.15)
    mouth(tl, 0.05, 'closed')
    tl.addLabel('off', 0.22)
    to(tl, { by: -8, sx: 0.94, sy: 1.065 }, 'off', 0.12, E.out)
    to(tl, { y: -64 }, 'off', 0.32, 'power2.out').to(st, { y: 0, duration: 0.28, ease: 'power2.in' }, 'off+=0.32')
    to(tl, { by: 0, sx: 1, sy: 1 }, 'off+=0.14', 0.2, E.io)
    to(tl, { fLy: '-=14', fRy: '-=10', fLr: 14, fRr: -10 }, 'off+=0.06', 0.18, E.out).to(st, { fLy: ANKLE.L[1], fRy: ANKLE.R[1], fLr: 0, fRr: 0, duration: 0.22, ease: E.in }, 'off+=0.38')
    hand(tl, 'L', { x: 20, y: 150, r: -20 }, 'off', 0.22, E.out)
    hand(tl, 'R', { x: 232, y: 150, r: 20 }, 'off', 0.22, E.out)
    brows(tl, 'off+=0.05', { ly: -8, ry: -9 }, 0.12, E.pop)
    mouth(tl, 'off+=0.08', 'o')
    tl.addLabel('land', 0.82)
    to(tl, { by: 13, sx: 1.08, sy: 0.925 }, 'land', 0.07, E.out)
    to(tl, { by: 0, sx: 1, sy: 1 }, 'land+=0.07', 0.45, E.settle)
    hand(tl, 'L', { x: 34, y: 228, r: 20 }, 'land', 0.12, E.in)
    hand(tl, 'R', { x: 220, y: 232, r: -20 }, 'land', 0.12, E.in)
    mouth(tl, 'land+=0.1', 'smile')
    brows(tl, 'land+=0.1', {}, 0.3)
    home(tl, 1.25, 0.5)
  },
}

function build(name) {
  const tl = gsap.timeline({ paused: true })
  MOVES[name]?.(tl)
  return tl
}

// idle: breathing, a slow weight shift, blinks (sometimes a double), a glance away and back — never with reduced motion
let idle = null, current = null
function startIdle() {
  idle = gsap.timeline({ repeat: -1 })
  idle.to(st, { sy: 1.014, sx: 0.993, by: -1, duration: 1.5, ease: E.soft, yoyo: true, repeat: 3 }, 0)
  idle.to(st, { bx: 2, lean: 1, duration: 3, ease: E.soft, yoyo: true, repeat: 1 }, 0)
  blink(idle, 1.4)
  idle.to(st, { lookX: -2.5, lookY: -1, duration: 0.18, ease: E.out }, 2.6).to(st, { lookX: 0, lookY: 0, duration: 0.25, ease: E.io }, 3.5)
  blink(idle, 4.3); blink(idle, 4.55)
}

function reset() {
  current?.kill(); current = null
  Object.assign(st, base())
  poses.L = REST.L.pose; poses.R = REST.R.pose
  spr.face.x = spr.face.y = spr.face.vx = spr.face.vy = 0
  spr.box.x = spr.box.y = spr.box.vx = spr.box.vy = 0
  lastBody = null; lastHands = null
}
const pauseIdle = () => idle?.pause()
const resumeIdle = () => idle?.restart()
// what a story world uses to choreograph him on its own timeline
const kit = { st, poses, to, hand, arc, brows, mouth, blink, speak, home, loosen, stepFoot, hopTo, inv, T, E, REST, ANKLE, MOVES, reset }

function play(name) {
  idle?.pause()
  current?.kill()
  Object.assign(st, base())
  poses.L = REST.L.pose; poses.R = REST.R.pose
  current = build(name)
  current.eventCallback('onComplete', () => idle?.restart())
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

defineExpose({ st, poses, build, play, render, REST, kit, reset, pauseIdle, resumeIdle })
</script>

<style scoped>
.boxly-rig { width: 100%; height: auto; overflow: visible; }
.sock { fill: #FFFDF6; stroke: #D8D2C2; stroke-width: 1.8; }
</style>
