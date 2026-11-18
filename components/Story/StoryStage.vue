<template>
  <!-- The landing story (docs/landing-storyboard.md): Kiru's scroll engine ported to Vue. The section stays pinned while the
       page scrolls; one number n (0 = hero, 1..6 = worlds) drives the room colour, the copy, the window's page, the floating
       cards (springs) and which world's act plays. Each act is one GSAP timeline (storyActs.js) that plays as its world
       arrives and rewinds when it leaves. Everything's own style is its final pose: reduced motion and the server show it.
       Essentials live INSIDE the window, because on phones the board is cropped to the window and props outside it hide. -->
  <div class="story" :class="{ wait }">
    <header ref="head" class="sc-head">
      <NuxtLink to="/" class="flex items-center gap-2 font-extrabold text-lg tracking-tight"><img src="/app-icon.svg" alt="" class="w-7 h-7" />Boxly</NuxtLink>
      <nav class="flex items-center gap-2">
        <NuxtLink to="/login" class="px-3 py-2 text-sm font-semibold opacity-80 hover:opacity-100">Iniciar sesión</NuxtLink>
        <NuxtLink to="/register" class="px-4 py-2 rounded-xl text-sm font-bold bg-[#FECD04] text-[#0C254C] hover:brightness-95">Crear cuenta</NuxtLink>
      </nav>
    </header>

    <section ref="section" class="mundos" :data-worlds="WORLDS.length" aria-label="Cómo funciona Boxly">
      <div ref="stage" class="sc-stage">
        <!-- world 2's crossing warms the room on the act clock (Kiru's colour-world trick); paint() fades it as world 3 takes over -->
        <div ref="tint" class="room-tint" aria-hidden="true"></div>

        <!-- copy -->
        <div ref="copy" class="sc-copy">
          <div v-for="(w, k) in WORLDS" :key="k" class="sc-block" :data-k="k" :aria-hidden="k ? 'true' : 'false'">
            <p class="sc-kicker">{{ w.kicker }}</p>
            <component :is="k ? 'h2' : 'h1'" class="sc-h">{{ w.h }}</component>
            <p class="sc-p">{{ w.p }}</p>
            <NuxtLink v-if="w.cta" to="/register" class="sc-cta">{{ w.cta }} →</NuxtLink>
            <p v-if="k === 0" class="sc-hint">Desliza para ver cómo funciona ↓</p>
          </div>
        </div>

        <!-- art: a 960×800 board; the window sits at (150,160), 660×480 -->
        <div ref="art" class="sc-art" aria-hidden="true">
          <div ref="board" class="sc-board">
            <!-- proof cards around the window (desktop extras, never essential) -->
            <div v-for="(c, i) in CARDS" :key="'c' + i" class="prop card" :data-w="c.w" :data-from="c.from" :data-d="c.d || 0" :data-r="c.r || 0" :style="`left:${c.x}px;top:${c.y}px`">
              <img v-if="c.logo" :src="c.logo" alt="" class="h-6 w-auto max-w-[120px] object-contain" />
              <template v-else><b>{{ c.t }}</b><span v-if="c.s">{{ c.s }}</span></template>
            </div>

            <div class="win">
              <div class="win-bar"><i></i><i></i><i></i><span class="win-title">boxly.mx</span></div>
              <div class="win-screen">
                <!-- 0 · any US store -->
                <div class="page" data-w="0">
                  <div class="logo-wall" data-s="w0-wall">
                    <div v-for="row in 2" :key="row" class="lw-row" :class="row === 2 ? 'rev' : ''">
                      <div class="lw-track">
                        <img v-for="(l, i) in [...LOGOS, ...LOGOS]" :key="i" :src="l.src" :alt="l.name" class="lw-logo" />
                      </div>
                    </div>
                    <p class="lw-more">y miles de tiendas más</p>
                  </div>
                  <div v-for="(p, i) in PRODUCTS" :key="p.store" class="pcard" :data-s="'w0-card' + i" :style="`left:${24 + i * 140}px`">
                    <span class="pc-badge" :data-s="'w0-badge' + i">1</span>
                    <img :src="p.logo" :alt="p.store" class="pc-logo" />
                    <div class="pc-art" v-html="p.art"></div>
                    <p class="pc-name">{{ p.name }}</p>
                    <p class="pc-meta"><span class="pc-size" :data-s="'w0-size' + i">{{ p.size }}</span> · ${{ p.price }} USD</p>
                    <span class="pc-btn" :data-s="'w0-btn' + i">Agregar al carrito</span>
                    <span class="pc-ok" :data-s="'w0-ok' + i">{{ p.store }} ✓</span>
                  </div>
                  <div class="pill" data-s="w0-pill" style="left:24px;top:366px">🛍️ 3 tiendas · 3 pedidos</div>
                  <div class="pill soft" data-s="w0-pill2" style="left:24px;top:404px">Todo va a tu dirección Boxly en EE.UU.</div>
                  <svg class="cursor" data-s="w0-cursor" viewBox="0 0 24 24"><path d="M5 2l14 9-6 1.4 3.6 7-2.6 1.3-3.6-7L5 18z" fill="#fff" stroke="#0C254C" stroke-width="1.6" stroke-linejoin="round" /></svg>
                </div>

                <!-- 1 · received in San Diego -->
                <div class="page" data-w="1">
                  <div class="label-card">
                    <p class="lc-h">Etiqueta del paquete</p>
                    <div v-for="(pk, i) in PACKAGES" :key="i" class="lc-label" :data-s="'w1-label' + i">
                      <img :src="pk.logo" alt="" class="h-4 w-auto mb-1" />
                      <p class="font-black text-[15px] leading-tight">BOXLY MARÍA LÓPEZ</p>
                      <p class="text-[12px] leading-snug">157 Virginia Ave Suite 835<br />San Ysidro, CA 92173</p>
                      <div class="barcode"></div>
                      <span class="stamp" :data-s="'w1-stamp' + i">✓</span>
                    </div>
                  </div>
                  <div class="counter" style="left:392px;width:268px"></div>
                  <div v-for="(pk, i) in PACKAGES" :key="'p' + i" class="pkg" :class="pk.cls" :data-s="'w1-pkg' + i" :style="`left:${pk.x3}px;top:${340 - pk.h}px;width:${pk.w}px;height:${pk.h}px`">
                    <img :src="pk.logo" alt="" class="pkg-logo" />
                  </div>
                  <div v-for="(b, i) in W1_BANNERS" :key="'b' + i" class="banner" :class="{ keep: i === 3 }" :data-s="'w1-ban' + i"><img src="/app-icon.svg" alt="" /><div><b>Boxly</b><span>{{ b }}</span></div></div>
                </div>

                <!-- 2 · crossing to Tijuana -->
                <div class="page" data-w="2">
                  <div class="map-card">
                    <div class="map-us">San Diego, CA</div>
                    <div class="map-border"><span>Frontera</span></div>
                    <div class="map-mx">Tijuana, B.C.</div>
                    <i class="map-dot sd"></i><i class="map-dot tj"></i>
                    <svg class="map-route" viewBox="0 0 400 280"><path d="M190 80 C 230 140, 170 170, 205 228" fill="none" stroke="#2E6BB7" stroke-width="3" stroke-dasharray="6 7" /></svg>
                    <div class="traveler" data-s="w2-dot"><i></i><span>3 paquetes</span></div>
                    <div class="map-ok" data-s="w2-ok">Cruzando ✓</div>
                  </div>
                  <div class="door"><span>Equipo de cruce</span></div>
                  <div class="team-hands" data-s="w2-hands"><i></i><i></i></div>
                  <div class="pkg stackbox" data-s="w2-stack" style="left:430px;top:282px;width:76px;height:58px"></div>
                  <div class="counter" style="left:392px;width:140px"></div>
                </div>

                <!-- 3 · scanned in Tijuana -->
                <div class="page" data-w="3">
                  <div class="list-card">
                    <p class="lc-h">Llegaron a Tijuana</p>
                    <div v-for="(pk, i) in PACKAGES" :key="i" class="lc-row"><img :src="pk.logo" alt="" class="h-4 w-14 object-contain object-left" /><span>{{ pk.item }}</span><b :data-s="'w3-check' + i">✓</b></div>
                  </div>
                  <div class="counter" style="left:392px;width:268px"></div>
                  <div v-for="(pk, i) in PACKAGES" :key="'p' + i" class="pkg" :class="pk.cls" :style="`left:${pk.x3}px;top:${340 - pk.h}px;width:${pk.w}px;height:${pk.h}px`">
                    <img :src="pk.logo" alt="" class="pkg-logo" />
                    <span class="pkg-ok" :data-s="'w3-ok' + i">✓</span>
                  </div>
                  <div class="banner keep" data-s="w3-ban"><img src="/app-icon.svg" alt="" /><div><b>Boxly</b><span>Tus paquetes ya están en Tijuana</span></div></div>
                </div>

                <!-- 4 · your final box -->
                <div class="page" data-w="4">
                  <div class="picker">
                    <p class="lc-h">Elige tu caja</p>
                    <div v-for="s in SIZES" :key="s" class="pk-row" :data-s="'w4-row' + s" :class="{ on: s === 'M' }">
                      <b>Caja {{ s }}</b>
                      <span v-if="prices[s] > 0">${{ prices[s].toLocaleString('es-MX') }} MXN</span>
                      <em v-if="s === 'S'" :data-s="'w4-nofit'">No cabe</em>
                      <em v-if="s === 'M'" class="fit" :data-s="'w4-fit'">Cabe ✓</em>
                    </div>
                    <span class="pay" data-s="w4-pay">Pagar</span>
                    <span class="paid" data-s="w4-paid">✓ Pagado</span>
                  </div>
                  <svg class="bare-hand" data-s="w4-hand" viewBox="0 0 40 50"><path d="M15 48 C8 40 6 30 8 24 L8 10 C8 6 14 6 14 10 L14 22 L15 4 C15 0 21 0 21 4 L21 22 L22 8 C22 4 28 4 28 8 L28 24 L29 14 C29 10 35 10 35 14 L34 32 C33 40 29 46 25 48 Z" fill="#E7B58F" stroke="#9A6B4B" stroke-width="1.4" /></svg>
                  <div class="counter" style="left:300px;width:360px;top:356px"></div>
                  <div v-for="(pk, i) in PACKAGES" :key="'p' + i" class="pkg inbox" :class="pk.cls" :data-s="'w4-pkg' + i" :style="`left:${312 + i * 46}px;top:${356 - pk.h}px;width:${pk.w}px;height:${pk.h}px`"><img :src="pk.logo" alt="" class="pkg-logo" /></div>
                  <div class="bx bx-s" data-s="w4-boxS"><span>S</span></div>
                  <div class="bx bx-m" data-s="w4-boxM"><span>M</span><i class="tape" data-s="w4-tape"></i><i class="sticker" data-s="w4-sticker"><img src="/app-icon.svg" alt="" /></i></div>
                  <div class="pill" data-s="w4-card" style="left:24px;top:300px">📦 3 paquetes → 1 caja</div>
                </div>

                <!-- 5 · anywhere in Mexico -->
                <div class="page" data-w="5">
                  <div class="mx-card">
                    <svg viewBox="0 0 420 300" class="mx-map">
                      <path d="M44 30 L120 30 L170 54 L238 58 C262 78 280 98 300 104 C318 120 322 140 312 160 C304 178 312 198 336 206 C356 212 368 196 382 184 L400 170 L410 190 C404 210 384 222 370 226 L352 238 C330 246 300 246 270 240 C240 234 214 222 196 210 C176 196 160 178 150 160 C138 140 118 118 104 96 C96 84 86 72 76 62 L70 54 C60 46 52 38 44 30 Z" fill="#F4E3D3" stroke="#C9622E" stroke-width="2" stroke-linejoin="round" />
                      <path d="M22 28 L34 30 C44 60 64 96 84 126 C96 144 104 160 100 168 C90 160 72 138 58 112 C44 86 30 58 22 28 Z" fill="#F4E3D3" stroke="#C9622E" stroke-width="2" stroke-linejoin="round" />
                      <path data-s="w5-route" d="M24 30 C 70 70, 130 120, 180 188" fill="none" stroke="#C9622E" stroke-width="3.2" stroke-dasharray="7 7" />
                      <circle cx="24" cy="30" r="6" fill="#0C254C" /><text x="34" y="24" font-size="13" font-weight="700" fill="#0C254C">Tijuana</text>
                      <g data-s="w5-pin" class="pin"><circle cx="180" cy="188" r="7" fill="#C9622E" stroke="#fff" stroke-width="2.5" /><text x="192" y="193" font-size="13" font-weight="700" fill="#0C254C">Guadalajara</text></g>
                    </svg>
                  </div>
                  <div class="track" data-s="w5-track"><b>En camino</b><span>Guía 7741 2026 MX</span></div>
                  <div class="courier" data-s="w5-courier"><i></i></div>
                </div>

                <!-- 6 · delivered -->
                <div class="page" data-w="6">
                  <div class="door6"><i class="knob"></i></div>
                  <div class="mat"></div>
                  <div class="bx bx-d" data-s="w6-box"><i class="flap l" data-s="w6-flapL"></i><i class="flap r" data-s="w6-flapR"></i><i class="sticker"><img src="/app-icon.svg" alt="" /></i></div>
                  <div v-for="(p, i) in PRODUCTS" :key="p.store" class="item" :data-s="'w6-item' + i" :style="`left:${206 + (i - 1) * 74}px`">
                    <div class="pc-art" v-html="p.art"></div><img :src="p.logo" :alt="p.store" class="item-logo" />
                  </div>
                  <div class="banner keep" data-s="w6-ban"><img src="/app-icon.svg" alt="" /><div><b>Boxly</b><span>Entregado ✓ · 3 compras, 1 caja</span></div></div>
                </div>
              </div>
            </div>

            <!-- Boxly acts over the window, in its coordinates (always inside the phone crop) -->
            <div class="win-over">
              <div class="boxly-at"><BoxlyMascot ref="boxly" /></div>
            </div>
          </div>
        </div>

        <!-- progress rail -->
        <div ref="rail" class="sc-rail">
          <span ref="railLabel" class="sc-rail-label"></span>
          <div class="flex gap-1.5"><button v-for="k in WORLDS.length - 1" :key="k" type="button" :data-go="k" :aria-label="WORLDS[k].kicker"></button></div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { gsap } from 'gsap'
import BoxlyMascot from './BoxlyMascot.vue'
import { buildAct } from './storyActs.js'

const WORLDS = [
  { kicker: 'Boxly', h: 'Compra en cualquier tienda de EE.UU.', p: 'Target, Amazon, Gymshark, New Balance… Boxly lo recibe en San Diego, lo junta en una caja y te lo manda a cualquier parte de México.', cta: 'Empieza a comprar' },
  { kicker: '1 · San Diego', h: 'Lo recibimos en San Diego.', p: 'Cada paquete llega a tu dirección Boxly en EE.UU. con tu nombre. Lo escaneamos al llegar y te avisamos.' },
  { kicker: '2 · El cruce', h: 'Los cruzamos a Tijuana.', p: 'Nuestro equipo cruza tus paquetes de San Diego a Tijuana. Tú no haces nada.' },
  { kicker: '3 · Tijuana', h: 'Ya están en Tijuana.', p: 'Los escaneamos otra vez al llegar a Tijuana, para que sepas que todo cruzó.' },
  { kicker: '4 · Tu caja', h: '3 paquetes → 1 caja.', p: 'Juntamos todo en una sola caja. Pagas por tamaño de caja, en pesos, sin sorpresas.' },
  { kicker: '5 · El envío', h: 'A cualquier parte de México.', p: 'Con guía de rastreo, desde Tijuana hasta tu puerta.' },
  { kicker: '6 · Entregado', h: 'Entregado.', p: 'Abres una caja y ahí está todo: tus 3 compras de 3 tiendas.', cta: 'Empieza a comprar' },
]
// [bg, ink, accent, soft] per world — US blue → warm Tijuana → navy finale (never yellow behind the yellow mascot)
const PALETTES = [
  ['#EAF2FC', '#0C254C', '#2E6BB7', '#D6E5F7'], ['#E6F0FB', '#0C254C', '#2E6BB7', '#CFE0F5'], ['#E3EEFA', '#0C254C', '#2E6BB7', '#CFE0F5'],
  ['#FBEBDD', '#3A1F12', '#D9733A', '#F4D6BE'], ['#FAE6D3', '#3A1F12', '#C9622E', '#F1CFB2'], ['#F7E9DC', '#3A1F12', '#C9622E', '#EBD8C6'],
  ['#0C254C', '#FFFDF6', '#FECD04', '#17356B'],
]
const L = (f) => `/logos/stores/${f}`
const LOGOS = [
  { name: 'Target', src: L('target.svg') }, { name: 'Gymshark', src: L('gymshark.png') }, { name: 'New Balance', src: L('new-balance.svg') },
  { name: 'Bath & Body Works', src: L('bath-body-works.svg') }, { name: 'Nike', src: L('nike.svg') }, { name: 'Amazon', src: L('amazon.svg') },
  { name: 'Walmart', src: L('walmart.svg') }, { name: "Victoria's Secret", src: L('victorias-secret.svg') }, { name: 'Sephora', src: L('sephora.svg') },
  { name: 'Ulta Beauty', src: L('ulta.svg') }, { name: 'American Eagle', src: L('american-eagle.svg') },
]
const ART = {
  blanket: '<svg viewBox="0 0 80 60"><rect x="10" y="30" width="60" height="22" rx="6" fill="#C8102E"/><rect x="14" y="16" width="54" height="20" rx="6" fill="#E9D8C4"/><rect x="18" y="4" width="48" height="18" rx="6" fill="#C8102E"/><path d="M18 13h48M14 26h54M10 41h60" stroke="#fff" stroke-opacity=".55" stroke-width="2"/></svg>',
  leggings: '<svg viewBox="0 0 80 60"><path d="M24 4h32l2 10-6 44h-9l-3-34-3 34h-9L22 14z" fill="#2B2F3A"/><path d="M24 9h32" stroke="#555B6B" stroke-width="3"/></svg>',
  sneakers: '<svg viewBox="0 0 80 60"><path d="M8 40c0-10 8-16 16-16 6 0 9 4 14 6 8 3 20 4 28 10 4 3 6 8 6 10H8z" fill="#9CA3AF"/><path d="M8 50h64v4H8z" fill="#F3F4F6" stroke="#D1D5DB"/><path d="M26 30l10 14M34 32l8 12" stroke="#fff" stroke-width="2.5"/></svg>',
}
const PRODUCTS = [
  { store: 'Target', logo: L('target.svg'), name: 'Cobija', size: 'Queen', price: '25', art: ART.blanket },
  { store: 'Gymshark', logo: L('gymshark.png'), name: 'Leggings', size: 'M', price: '48', art: ART.leggings },
  { store: 'New Balance', logo: L('new-balance.svg'), name: 'Tenis', size: '25 MX', price: '90', art: ART.sneakers },
]
// the three packages: Target red mailer, Gymshark grey poly bag, New Balance carton (x1/x3 = spots on the counter)
const PACKAGES = [
  { logo: L('target.svg'), item: 'Cobija', cls: 'mailer', w: 66, h: 34, x1: 440, x3: 404 },
  { logo: L('gymshark.png'), item: 'Leggings', cls: 'poly', w: 60, h: 30, x1: 440, x3: 478 },
  { logo: L('new-balance.svg'), item: 'Tenis', cls: 'carton', w: 74, h: 46, x1: 436, x3: 548 },
]
const W1_BANNERS = ['Llegó 1 de 3 · Target', 'Llegó 2 de 3 · Gymshark', 'Llegó 3 de 3 · New Balance', '¡Ya llegaron todos! 🎉']
const SIZES = ['S', 'M', 'L', 'XL']
const CARDS = [
  { w: 0, x: 0, y: 150, logo: L('amazon.svg'), from: 'left' }, { w: 0, x: 818, y: 120, logo: L('walmart.svg'), from: 'right', d: 0.03 },
  { w: 0, x: 10, y: 560, logo: L('sephora.svg'), from: 'left', d: 0.06 }, { w: 0, x: 812, y: 600, t: 'Sin tarjeta americana', from: 'right', d: 0.09 },
  { w: 1, x: 0, y: 200, t: 'Escaneado 12:41', s: 'San Diego', from: 'left' }, { w: 1, x: 812, y: 590, t: 'Tu dirección en EE.UU.', s: 'con tu nombre', from: 'right', d: 0.05 },
  { w: 2, x: 0, y: 230, t: 'Cruce diario', from: 'left' }, { w: 2, x: 812, y: 590, t: 'Tú no haces nada', from: 'right', d: 0.05 },
  { w: 3, x: 0, y: 220, t: 'Escaneado 09:15', s: 'Tijuana', from: 'left' }, { w: 3, x: 820, y: 600, t: '3 de 3 ✓', from: 'right', d: 0.05 },
  { w: 4, x: 0, y: 200, t: 'Pagas en pesos', from: 'left' }, { w: 4, x: 816, y: 600, t: 'Precio fijo por caja', from: 'right', d: 0.05 },
  { w: 5, x: 0, y: 220, t: 'Guía de rastreo', from: 'left' }, { w: 5, x: 812, y: 600, t: 'Toda la República', from: 'right', d: 0.05 },
  { w: 6, x: 0, y: 200, t: '★★★★★', s: '"Llegó todo perfecto"', from: 'left' }, { w: 6, x: 812, y: 600, t: '3 tiendas → 1 caja', from: 'right', d: 0.05 },
]

// live box prices, rendered on the server (fallback = last good prices: never $0 or an empty picker)
const { prices, load } = useBoxPrices()
await load()

const head = ref(null), section = ref(null), stage = ref(null), tint = ref(null), copy = ref(null), art = ref(null), board = ref(null)
const rail = ref(null), railLabel = ref(null), boxly = ref(null)
const wait = ref(true)

// ---- the engine (Kiru's showcase.js, ported) ----
const smooth = (a, b, x) => { const r = Math.min(1, Math.max(0, (x - a) / (b - a))); return r * r * (3 - 2 * r) }
const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
const mix = (a, b, t) => { const x = hex(a), y = hex(b); return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(',')})` }
const FROM = { left: { x: -200, y: 20, r: -12, s: 0.9 }, right: { x: 200, y: 20, r: 12, s: 0.9 }, up: { x: 0, y: 160, r: 6, s: 0.9 }, pop: { x: 0, y: 30, r: 0, s: 0.3 } }
const EXIT = { x: 0, y: -120, r: 10, s: 0.85 }

let cleanup = () => {}
onMounted(async () => {
  await nextTick()
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const last = WORLDS.length - 1
  const blocks = [...copy.value.querySelectorAll('.sc-block')].map((el) => ({ el, k: Number(el.dataset.k) }))
  const pages = [...board.value.querySelectorAll('.page')].map((el) => ({ el, k: Number(el.dataset.w) }))
  const props = [...board.value.querySelectorAll('.prop')].map((el) => ({ el, k: Number(el.dataset.w), d: Number(el.dataset.d || 0), r: Number(el.dataset.r || 0), from: FROM[el.dataset.from] || FROM.pop, p: 0, v: 0, last: '' }))
  const dots = [...rail.value.querySelectorAll('button')]
  const $ = (s) => board.value.querySelector(`[data-s="${s}"]`)
  const tintAct = { v: 0 }

  // the acts: one paused timeline per world; Boxly is one shared rig, reset and re-placed when a world takes him
  const kit = boxly.value.kit
  const acts = reduce ? [] : WORLDS.map((_, k) => buildAct(k, { kit, $, tint: tintAct, gsap }))
  let current = -1
  function setAct(k) {
    if (k === current) return
    if (current >= 0) acts[current]?.pause(0)
    current = k
    boxly.value.reset()
    if (k < 0 || !acts[k]) { boxly.value.resumeIdle(); return }
    boxly.value.pauseIdle()
    acts[k].eventCallback('onComplete', () => boxly.value.resumeIdle())
    acts[k].restart()
  }

  let q = 1, top = 0, vh = 1, mobile = false, n = 0
  const probe = document.createElement('div')
  probe.style.cssText = 'position:fixed;top:0;left:0;width:0;height:100vh;height:100svh;visibility:hidden;pointer-events:none'
  document.body.appendChild(probe)
  let measured = ''

  function layout() {
    vh = probe.offsetHeight || window.innerHeight
    const vw = window.innerWidth
    const stageH = stage.value.offsetHeight || vh
    measured = `${vw}x${vh}x${stageH}`
    mobile = vw < 760
    rail.value.style.top = `${vh - 20 - (rail.value.offsetHeight || 42)}px`
    q = vh * (mobile ? 1.05 : 1.15)
    section.value.style.height = `${(last + 0.5) * q + stageH}px`
    top = section.value.getBoundingClientRect().top + window.scrollY
    const headH = mobile ? 56 : 64
    const artEl = art.value, boardEl = board.value, copyEl = copy.value
    if (mobile) {
      stage.value.classList.add('mobile')
      const cw = 700, ch = 520, cx = 130, cy = 140
      Object.assign(copyEl.style, { left: '20px', right: '20px', width: 'auto' })
      const room = vh - headH
      const tallest = Math.max(...blocks.map(({ el }) => el.offsetHeight))
      const artH = Math.round(clamp(room - tallest - 72, room * 0.3, room * 0.52))
      Object.assign(artEl.style, { left: '0', top: `${headH}px`, width: `${vw}px`, height: `${artH}px` })
      const s = Math.min(vw / cw, artH / ch)
      boardEl.style.transform = `translate(${(vw - cw * s) / 2 - cx * s}px, ${(artH - ch * s) / 2 - cy * s}px) scale(${s})`
      Object.assign(copyEl.style, { top: `${headH + artH + 14}px`, height: `${vh - headH - artH - 14 - 58}px` })
      for (const p of props) {
        const el = p.el
        const x0 = Math.max(el.offsetLeft, cx), x1 = Math.min(el.offsetLeft + el.offsetWidth, cx + cw)
        const y0 = Math.max(el.offsetTop, cy), y1 = Math.min(el.offsetTop + el.offsetHeight, cy + ch)
        el.classList.toggle('offcrop', Math.max(0, x1 - x0) * Math.max(0, y1 - y0) / Math.max(1, el.offsetWidth * el.offsetHeight) < 0.8)
      }
    } else {
      stage.value.classList.remove('mobile')
      for (const p of props) p.el.classList.remove('offcrop')
      const copyW = Math.min(500, vw * 0.34)
      const pad = Math.max(24, (vw - 1320) / 2)
      const artL = pad + copyW + 20, artW = vw - artL - pad * 0.5, artH = vh - headH
      Object.assign(artEl.style, { left: `${artL}px`, top: `${headH}px`, width: `${artW}px`, height: `${artH}px` })
      const s = Math.min(artW / 960, artH / 800, 1.15)
      boardEl.style.transform = `translate(${(artW - 960 * s) / 2}px, ${(artH - 800 * s) / 2}px) scale(${s})`
      Object.assign(copyEl.style, { left: `${pad}px`, width: `${copyW}px`, top: `${headH}px`, height: `${artH}px`, right: 'auto' })
    }
    kick()
  }
  const position = () => { n = clamp((window.scrollY - top) / q, 0, last + 0.4) }

  function paint(dt) {
    const base = Math.min(Math.floor(n), last), next = Math.min(base + 1, last)
    const f = smooth(0.34, 0.66, n - base)
    const [a, b] = [PALETTES[base], PALETTES[next]]
    ;['--bg', '--ink', '--accent', '--soft'].forEach((v, i) => {
      const c = mix(a[i], b[i], f)
      stage.value.style.setProperty(v, c)
      if (i < 2) head.value.style.setProperty(v, c)
    })
    // world 2's warm tint: its act raises it; it fades out as world 3's warm palette blends in (no double-warm room)
    tint.value.style.opacity = (tintAct.v * (1 - smooth(2.34, 2.66, n)) * (n < 1.6 ? 0 : 1)).toFixed(3)

    for (const { el, k } of blocks) {
      const d = Math.abs(n - k), o = 1 - smooth(0.3, 0.46, d), y = Math.sign(k - n) * smooth(0.24, 0.5, d) * 46
      el.style.opacity = o.toFixed(3)
      el.style.transform = mobile ? `translateY(${y.toFixed(1)}px)` : `translateY(calc(-50% + ${y.toFixed(1)}px))`
      el.style.visibility = o < 0.01 ? 'hidden' : 'visible'
      el.setAttribute('aria-hidden', o < 0.5 ? 'true' : 'false')
    }
    for (const { el, k } of pages) {
      const d = Math.abs(n - k), o = 1 - smooth(0.38, 0.62, d)
      el.style.opacity = o.toFixed(3)
      el.style.transform = `scale(${(1 + (1 - o) * 0.05).toFixed(3)})`
      el.style.visibility = o < 0.01 ? 'hidden' : 'visible'
    }
    const active = Math.round(n)

    let moving = false
    for (const p of props) {
      const t = smooth(p.k - 0.62 + p.d, p.k - 0.36 + p.d, n) * (1 - smooth(p.k + 0.42 + p.d, p.k + 0.68 + p.d, n))
      if (reduce) { p.p = t; p.v = 0 } else {
        const steps = dt > 18 ? 3 : 1, h = dt / 1000 / steps
        for (let i = 0; i < steps; i++) {
          const kk = t > p.p ? 170 : 120, c = t > p.p ? 15 : 17
          p.v += (kk * (t - p.p) - c * p.v) * h; p.p += p.v * h
        }
        if (Math.abs(t - p.p) > 6e-4 || Math.abs(p.v) > 6e-4) moving = true
        else { p.p = t; p.v = 0 }
      }
      const o = clamp(p.p * 1.35, 0, 1), fr = n > p.k ? EXIT : p.from, u = 1 - p.p
      const tr = o < 0.005 ? 'none' : `translate(${(fr.x * u).toFixed(1)}px,${(fr.y * u).toFixed(1)}px) rotate(${(p.r + fr.r * u).toFixed(2)}deg) scale(${(1 - (1 - fr.s) * clamp(u, 0, 1)).toFixed(3)})`
      const key = `${o.toFixed(3)}|${tr}`
      if (key !== p.last) { p.last = key; p.el.style.opacity = o.toFixed(3); p.el.style.transform = tr; p.el.style.visibility = o < 0.005 ? 'hidden' : 'visible' }
    }

    // the act: a world plays as it arrives and rewinds once it has left
    if (!reduce) {
      let on = -1
      for (let k = 0; k <= last; k++) if (n > k - 0.24 && n < k + 0.62) on = k
      setAct(on)
    }

    const railOn = smooth(0.4, 0.6, n) * (1 - smooth(last + 0.2, last + 0.4, n))
    rail.value.style.opacity = railOn.toFixed(3)
    rail.value.style.pointerEvents = railOn > 0.5 ? 'auto' : 'none'
    dots.forEach((d, i) => d.classList.toggle('on', i + 1 === active))
    railLabel.value.textContent = active ? WORLDS[active].kicker : ''
    head.value.classList.toggle('solid', window.scrollY > 10)
    return moving || (current === 2 && !reduce)
  }

  let raf = 0, lastT = 0
  function frame(t) {
    const dt = lastT ? Math.min(64, t - lastT) : 16
    lastT = t
    position()
    const moving = paint(dt)
    if (moving) raf = requestAnimationFrame(frame)
    else { raf = 0; lastT = 0 }
  }
  function kick() { if (!raf) raf = requestAnimationFrame(frame) }
  dots.forEach((d) => d.addEventListener('click', () => window.scrollTo({ top: top + Number(d.dataset.go) * q, behavior: reduce ? 'auto' : 'smooth' })))
  const onResize = () => {
    const stageH = stage.value.offsetHeight || probe.offsetHeight
    if (`${window.innerWidth}x${probe.offsetHeight || window.innerHeight}x${stageH}` !== measured) layout(); else kick()
  }
  window.addEventListener('scroll', kick, { passive: true })
  window.addEventListener('resize', onResize)
  layout()
  const show = () => { kick(); requestAnimationFrame(() => { wait.value = false }) }
  const shown = setTimeout(show, 700)
  document.fonts?.ready.then(() => { layout(); clearTimeout(shown); show() })
  cleanup = () => {
    window.removeEventListener('scroll', kick); window.removeEventListener('resize', onResize)
    cancelAnimationFrame(raf); probe.remove(); acts.forEach((t) => t?.kill())
  }
})
onBeforeUnmount(() => cleanup())
</script>

<style scoped>
.story { --bg: #EAF2FC; --ink: #0C254C; --accent: #2E6BB7; --soft: #D6E5F7; }
.story.wait .sc-stage { visibility: hidden; }
.sc-head { position: fixed; z-index: 40; top: 0; left: 0; right: 0; height: 64px; display: flex; align-items: center; justify-content: space-between; padding: 0 max(20px, calc((100vw - 1320px) / 2)); color: var(--ink); transition: background .25s, box-shadow .25s; }
.sc-head.solid { background: color-mix(in srgb, var(--bg) 88%, transparent); backdrop-filter: blur(10px); box-shadow: 0 1px 0 rgba(12, 37, 76, .08); }
.mundos { position: relative; }
.sc-stage { position: sticky; top: 0; height: 100vh; height: 100lvh; overflow: hidden; background: var(--bg); color: var(--ink); }
.sc-stage::before { content: ""; position: absolute; inset: -10%; background: radial-gradient(60% 55% at 68% 48%, color-mix(in srgb, var(--accent) 20%, transparent), transparent 70%); pointer-events: none; }
.room-tint { position: absolute; inset: 0; z-index: 1; pointer-events: none; opacity: 0; background: radial-gradient(80% 80% at 60% 55%, rgba(236, 140, 70, .42), rgba(217, 115, 58, .22)); }
.sc-copy { position: absolute; z-index: 3; }
.sc-block { position: absolute; left: 0; right: 0; top: 50%; will-change: opacity, transform; }
.sc-kicker { font-size: 13px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: var(--accent); }
.sc-h { margin-top: 14px; font-size: clamp(36px, 4.2vw, 58px); line-height: 1.02; font-weight: 900; letter-spacing: -.02em; }
.sc-p { margin-top: 16px; font-size: 18px; line-height: 1.55; opacity: .82; max-width: 30em; }
.sc-cta { display: inline-flex; margin-top: 24px; padding: 14px 22px; border-radius: 14px; font-weight: 800; background: #FECD04; color: #0C254C; box-shadow: 0 6px 18px rgba(12, 37, 76, .18); }
.sc-hint { margin-top: 28px; font-size: 13px; opacity: .6; }
.sc-art { position: absolute; z-index: 2; }
.sc-board { position: absolute; left: 0; top: 0; width: 960px; height: 800px; transform-origin: 0 0; }
.sc-stage.mobile .sc-art { overflow: hidden; }
.sc-stage.mobile .sc-block { top: 0; }
.sc-stage.mobile .sc-hint { display: none; }
.sc-stage.mobile .sc-h { font-size: clamp(28px, 8vw, 38px); margin-top: 10px; }
.sc-stage.mobile .sc-p { font-size: 15px; line-height: 1.5; margin-top: 8px; }
.sc-stage.mobile .sc-cta { margin-top: 14px; padding: 12px 18px; }
.prop { position: absolute; will-change: transform, opacity; z-index: 5; }
.prop.offcrop { display: none !important; }
.card { display: flex; flex-direction: column; gap: 2px; padding: 12px 16px; min-width: 130px; border-radius: 16px; background: #fff; color: #0C254C; box-shadow: 0 10px 30px rgba(12, 37, 76, .12); font-size: 14px; }
.card b { font-weight: 800; } .card span { font-size: 12px; opacity: .7; }

/* the window */
.win { position: absolute; left: 150px; top: 160px; width: 660px; height: 480px; border-radius: 18px; background: #fff; color: #0C254C; overflow: hidden; box-shadow: 0 30px 80px rgba(12, 37, 76, .22), 0 0 0 1px rgba(12, 37, 76, .06); }
.sc-stage:not(.mobile) .win, .sc-stage:not(.mobile) .win-over { transform: scale(1.04); }
.win-bar { height: 36px; display: flex; align-items: center; gap: 7px; padding: 0 14px; background: #F3F6FA; border-bottom: 1px solid #E3E8EF; }
.win-bar > i { width: 10px; height: 10px; border-radius: 9px; background: #D7DEE8; }
.win-title { margin-left: 8px; font-size: 11px; color: #6B7A90; font-weight: 600; }
.win-screen { position: absolute; left: 0; right: 0; top: 36px; bottom: 0; }
.page { position: absolute; inset: 0; will-change: opacity, transform; }
.win-over { position: absolute; left: 150px; top: 160px; width: 660px; height: 480px; z-index: 6; pointer-events: none; }
/* Boxly: a 160px rig box, feet on the floor line y 448, pivot at window x 530 (his home spot) */
.boxly-at { position: absolute; left: 454px; top: 295px; width: 160px; }

/* shared scene bits (window px; the screen starts 36px down, so page y = window y - 36) */
.pill { position: absolute; padding: 8px 14px; border-radius: 999px; background: #0C254C; color: #fff; font-size: 13px; font-weight: 800; white-space: nowrap; }
.pill.soft { background: #E8F0FB; color: #0C254C; font-weight: 700; }
.lc-h { font-size: 11px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: #6B7A90; margin-bottom: 8px; }
.counter { position: absolute; top: 340px; height: 72px; border-radius: 10px 10px 0 0; background: linear-gradient(#C99A6B, #B07F52); box-shadow: inset 0 3px 0 #DDB389; }
.pkg { position: absolute; border-radius: 6px; display: grid; place-items: center; box-shadow: 0 4px 10px rgba(0, 0, 0, .12); }
.pkg.mailer { background: #fff; border: 2px solid #C8102E; border-radius: 9px; }
.pkg.poly { background: #E5E7EB; border-radius: 12px; }
.pkg.carton { background: #C98B4E; border: 2px solid #8A5A2B; }
.pkg.stackbox { background: #C98B4E; border: 2px solid #8A5A2B; }
.pkg-logo { max-width: 70%; max-height: 50%; object-fit: contain; }
.pkg.carton .pkg-logo { background: #fff; padding: 2px 4px; border-radius: 3px; }
.banner { position: absolute; left: 160px; top: 8px; width: 340px; display: flex; gap: 10px; align-items: center; padding: 10px 12px; border-radius: 16px; background: rgba(255, 255, 255, .96); box-shadow: 0 10px 26px rgba(12, 37, 76, .18); opacity: 0; }
.banner.keep { opacity: 1; }
.banner img { width: 30px; height: 30px; border-radius: 8px; }
.banner div { display: flex; flex-direction: column; font-size: 13px; line-height: 1.25; }
.banner b { font-size: 11px; color: #6B7A90; }

/* 0 */
.logo-wall { position: absolute; left: 0; right: 0; top: 10px; height: 120px; overflow: hidden; opacity: .5; }
.lw-row { overflow: hidden; height: 46px; margin-bottom: 6px; }
.lw-track { display: flex; gap: 34px; align-items: center; width: max-content; height: 46px; animation: lw 38s linear infinite; }
.lw-row.rev .lw-track { animation-direction: reverse; animation-duration: 44s; }
.lw-logo { height: 26px; width: auto; max-width: 120px; object-fit: contain; }
.lw-more { position: absolute; right: 16px; bottom: 0; font-size: 12px; font-weight: 800; color: #2E6BB7; }
@keyframes lw { to { transform: translateX(-50%); } }
@media (prefers-reduced-motion: reduce) { .lw-track { animation: none; } }
.pcard { position: absolute; top: 140px; width: 130px; height: 176px; padding: 10px; border-radius: 16px; background: #fff; box-shadow: 0 8px 22px rgba(12, 37, 76, .12), 0 0 0 1px rgba(12, 37, 76, .06); }
.pc-logo { height: 16px; width: auto; max-width: 84px; object-fit: contain; }
.pc-art { width: 80px; height: 60px; margin: 6px auto 2px; }
.pc-name { font-size: 13px; font-weight: 800; color: #0C254C; }
.pc-meta { font-size: 11px; color: #6B7A90; }
.pc-size { display: inline-block; padding: 0 5px; border-radius: 5px; background: #0C254C; color: #fff; font-weight: 700; }
.pc-btn { position: absolute; left: 10px; right: 10px; bottom: 10px; text-align: center; padding: 5px 0; border-radius: 9px; background: #FECD04; color: #0C254C; font-size: 11px; font-weight: 800; }
.pc-badge { position: absolute; right: -8px; top: -8px; width: 22px; height: 22px; border-radius: 99px; background: #E5484D; color: #fff; font-size: 12px; font-weight: 800; display: grid; place-items: center; }
.pc-ok { position: absolute; left: 50%; top: 38%; transform: translate(-50%, -50%); padding: 5px 10px; border-radius: 99px; background: #16A34A; color: #fff; font-size: 12px; font-weight: 800; white-space: nowrap; box-shadow: 0 6px 14px rgba(22, 163, 74, .3); }
.cursor { position: absolute; left: 90px; top: 220px; width: 26px; height: 26px; opacity: 0; filter: drop-shadow(0 2px 3px rgba(0, 0, 0, .25)); }

/* 1 */
.label-card, .list-card, .picker { position: absolute; left: 24px; top: 56px; width: 250px; padding: 14px; border-radius: 16px; background: #fff; box-shadow: 0 8px 22px rgba(12, 37, 76, .12), 0 0 0 1px rgba(12, 37, 76, .06); }
.label-card { height: 190px; }
.lc-label { position: absolute; left: 14px; right: 14px; top: 34px; padding: 10px; border: 2px dashed #0C254C; border-radius: 10px; color: #0C254C; background: #fff; opacity: 0; }
.lc-label:last-of-type { opacity: 1; }
.barcode { height: 26px; margin-top: 8px; background: repeating-linear-gradient(90deg, #0C254C 0 2px, transparent 2px 4px, #0C254C 4px 7px, transparent 7px 9px); }
.stamp { position: absolute; right: 8px; top: 8px; width: 34px; height: 34px; border-radius: 99px; background: #16A34A; color: #fff; font-weight: 900; display: grid; place-items: center; font-size: 18px; transform: rotate(-12deg); }

/* 2 */
.map-card { position: absolute; left: 24px; top: 20px; width: 400px; height: 300px; border-radius: 16px; overflow: hidden; background: linear-gradient(#DCEAFB 0 52%, #F8E4D2 52%); box-shadow: 0 0 0 1px rgba(12, 37, 76, .06); }
.map-us, .map-mx { position: absolute; left: 16px; font-size: 13px; font-weight: 800; color: #0C254C; }
.map-us { top: 14px; } .map-mx { bottom: 14px; color: #8A3B12; }
.map-border { position: absolute; left: 0; right: 0; top: 52%; border-top: 3px dashed #0C254C; }
.map-border span { position: absolute; right: 12px; top: -22px; font-size: 11px; font-weight: 800; color: #0C254C; opacity: .7; }
.map-dot { position: absolute; width: 14px; height: 14px; border-radius: 99px; border: 3px solid #fff; box-shadow: 0 2px 6px rgba(0, 0, 0, .2); }
.map-dot.sd { left: 183px; top: 73px; background: #2E6BB7; } .map-dot.tj { left: 198px; top: 221px; background: #C9622E; }
.map-route { position: absolute; inset: 0; width: 400px; height: 280px; }
.traveler { position: absolute; left: 198px; top: 221px; display: flex; align-items: center; gap: 6px; transform: translate(-6px, -6px); }
.traveler i { width: 18px; height: 18px; border-radius: 5px; background: #C98B4E; border: 2px solid #8A5A2B; }
.traveler span { padding: 3px 8px; border-radius: 99px; background: #0C254C; color: #fff; font-size: 11px; font-weight: 800; white-space: nowrap; }
.map-ok { position: absolute; left: 230px; top: 250px; padding: 4px 10px; border-radius: 99px; background: #16A34A; color: #fff; font-size: 12px; font-weight: 800; }
.door { position: absolute; left: 600px; top: 216px; width: 60px; height: 196px; background: #2B3445; border-radius: 6px 0 0 0; }
.door span { position: absolute; left: -84px; top: -26px; width: 140px; font-size: 11px; font-weight: 800; color: #6B7A90; text-align: right; }
.team-hands { position: absolute; left: 600px; top: 300px; display: flex; gap: 10px; flex-direction: column; opacity: 0; }
.team-hands i { width: 34px; height: 18px; border-radius: 9px; background: #F59E0B; border: 2px solid #B45309; }

/* 3 */
.list-card { height: 176px; }
.lc-row { display: flex; align-items: center; gap: 10px; padding: 9px 4px; border-bottom: 1px solid #EEF2F7; font-size: 14px; font-weight: 700; color: #0C254C; }
.lc-row b { margin-left: auto; width: 24px; height: 24px; border-radius: 99px; background: #16A34A; color: #fff; display: grid; place-items: center; font-size: 13px; }
.pkg-ok { position: absolute; right: -8px; top: -10px; width: 22px; height: 22px; border-radius: 99px; background: #16A34A; color: #fff; display: grid; place-items: center; font-size: 12px; font-weight: 900; }

/* 4 */
.picker { top: 20px; height: 268px; }
.pk-row { position: relative; display: flex; align-items: center; gap: 10px; padding: 9px 10px; margin-bottom: 6px; border-radius: 10px; border: 2px solid #EEF2F7; font-size: 13px; color: #0C254C; }
.pk-row b { font-weight: 800; } .pk-row span { margin-left: auto; font-weight: 700; color: #6B7A90; }
.pk-row.on { border-color: #16A34A; background: #F0FDF4; }
.pk-row em { position: absolute; right: 8px; top: -9px; font-style: normal; font-size: 10px; font-weight: 800; padding: 1px 6px; border-radius: 99px; background: #9CA3AF; color: #fff; }
.pk-row em.fit { background: #16A34A; }
.pay, .paid { position: absolute; left: 14px; right: 14px; bottom: 12px; text-align: center; padding: 9px 0; border-radius: 11px; font-weight: 900; font-size: 14px; }
.pay { background: #0C254C; color: #fff; }
.paid { background: #16A34A; color: #fff; }
.bare-hand { position: absolute; left: 130px; top: 250px; width: 34px; height: 44px; opacity: 0; }
.bx { position: absolute; background: #C98B4E; border: 2px solid #8A5A2B; border-radius: 4px; display: grid; place-items: center; }
.bx span { font-weight: 900; color: #6B3F17; font-size: 15px; }
.bx-s { left: 470px; top: 308px; width: 56px; height: 48px; opacity: 0; }
.bx-m { left: 300px; top: 264px; width: 120px; height: 92px; }
.pkg.inbox { opacity: 0; } /* final pose: packed inside the M box */
.tape { position: absolute; left: -2px; right: -2px; top: 6px; height: 12px; background: rgba(214, 184, 120, .95); transform-origin: left center; }
.sticker { position: absolute; right: 8px; bottom: 8px; width: 26px; height: 26px; border-radius: 99px; background: #fff; display: grid; place-items: center; box-shadow: 0 2px 4px rgba(0, 0, 0, .15); }
.sticker img { width: 18px; height: 18px; }

/* 5 */
.mx-card { position: absolute; left: 24px; top: 16px; width: 420px; height: 300px; border-radius: 16px; background: #FFF8F1; box-shadow: 0 0 0 1px rgba(12, 37, 76, .06); }
.mx-map { width: 420px; height: 300px; }
.track { position: absolute; left: 24px; top: 330px; display: flex; flex-direction: column; padding: 10px 16px; border-radius: 14px; background: #0C254C; color: #fff; font-size: 13px; }
.track b { font-size: 14px; } .track span { opacity: .75; }
.courier { position: absolute; left: 600px; top: 340px; width: 80px; height: 26px; border-radius: 13px 0 0 13px; background: #1F3A68; opacity: 0; }
.courier i { position: absolute; left: -16px; top: 2px; width: 22px; height: 22px; border-radius: 99px; background: #E7B58F; border: 2px solid #9A6B4B; }

/* 6 */
.door6 { position: absolute; left: 24px; top: 40px; width: 104px; height: 330px; border-radius: 8px 8px 0 0; background: linear-gradient(#7C4A2A, #66391E); }
.knob { position: absolute; right: 16px; top: 160px; width: 12px; height: 12px; border-radius: 99px; background: #F2C14E; }
.mat { position: absolute; left: 20px; top: 380px; width: 330px; height: 18px; border-radius: 9px; background: #C9B8A4; }
.bx-d { left: 158px; top: 300px; width: 124px; height: 84px; overflow: visible; }
.flap { position: absolute; top: -2px; width: 62px; height: 16px; background: #B47A42; border: 2px solid #8A5A2B; }
.flap.l { left: -2px; transform-origin: left bottom; transform: rotate(-125deg); }
.flap.r { right: -2px; transform-origin: right bottom; transform: rotate(125deg); }
.item { position: absolute; top: 196px; width: 80px; text-align: center; }
.item .pc-art { margin: 0 auto; }
.item-logo { height: 14px; width: auto; max-width: 74px; margin: 2px auto 0; object-fit: contain; }

/* the rail */
.sc-rail { position: absolute; z-index: 8; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 12px; padding: 8px 14px; border-radius: 99px; background: color-mix(in srgb, var(--bg) 70%, #fff); box-shadow: 0 6px 20px rgba(12, 37, 76, .12); opacity: 0; }
.sc-rail-label { font-size: 12px; font-weight: 800; color: var(--ink); min-width: 90px; }
.sc-rail button { width: 8px; height: 8px; border-radius: 99px; background: color-mix(in srgb, var(--ink) 25%, transparent); transition: width .2s; }
.sc-rail button.on { width: 22px; background: var(--accent); }
</style>
