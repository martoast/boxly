// The seven world acts of the landing story (docs/landing-storyboard.md). Each is ONE paused GSAP timeline: StoryStage
// restarts it as its world arrives and rewinds it (pause(0)) when the world leaves. Scene elements are animated FROM a
// start state into their own CSS style (their final pose), so reduced motion / no JS shows the finished scene.
// Boxly is one shared rig: `kit` tweens his state on the same timeline (BoxlyMascot.vue). He never struggles (Alex).
//
// Window coordinates: the window is 660×480, its screen starts at y 36; Boxly's pivot (between his feet) sits at window
// x 530 when st.x = 0, and st.x is in rig units (2 rig units = 1 window px).
const at = (windowX) => (windowX - 530) * 2

export function buildAct(k, { kit, $, tint, gsap }) {
  const tl = gsap.timeline({ paused: true })
  const { st, to, hand, arc, brows, mouth, blink, speak, home, loosen, hopTo, E } = kit
  const pop = (el, t, from = { scale: 0, opacity: 0 }, dur = 0.35) => el && tl.from(el, { ...from, duration: dur, ease: 'back.out(2.2)' }, t)
  const show = (el, t, dur = 0.3) => el && tl.fromTo(el, { opacity: 0, y: -40 }, { opacity: 1, y: 0, duration: dur, ease: 'back.out(1.6)' }, t)
  const hide = (el, t, dur = 0.25) => el && tl.to(el, { opacity: 0, duration: dur, ease: 'power1.in' }, t)
  const place = (x) => tl.set(st, { x }, 0)

  // scanner moves shared by worlds 1 and 3
  const scanOut = (t) => {
    hand(tl, 'L', { x: 30, y: 214, r: 15, pose: 'open' }, t, 0.25)
    hand(tl, 'R', { x: 214, y: 150, r: 20, pose: 'fist' }, t, 0.2, E.out)
    to(tl, { scan: 1 }, t + 0.18, 0.08)
    arc(tl, 'R', { x: 246, y: 186, r: -12 }, t + 0.2, 0.26, false)
  }
  const aim = (t) => {
    to(tl, { lean: 7, by: 6, sx: 1.02, sy: 0.98, lookX: 4, lookY: 3 }, t, 0.25)
    to(tl, { blinkL: 0.4, blinkR: 0.4 }, t + 0.1, 0.1)
    brows(tl, t + 0.1, { ly: 4, lr: 8, ry: 4, rr: -8 }, 0.12)
    mouth(tl, t + 0.1, 'line')
    tl.set(st, { beep: 0 }, t)
  }
  const beep = (t) => {
    tl.to(st, { beep: 1, duration: 0.01 }, t)
    to(tl, { blinkL: 0, blinkR: 0 }, t, 0.08)
    brows(tl, t, { ly: -6, ry: -7 }, 0.12, E.pop)
    mouth(tl, t, 'smile')
    to(tl, { lean: 10, by: 7 }, t + 0.08, 0.1).to(st, { lean: 4, by: 3, duration: 0.16, ease: E.io }, t + 0.18) // a pleased nod
  }

  if (k === 0) {
    // 0 · Hero: pops up, waves "¡Hola, soy Boxly!"; the customer picks, Boxly adds each item to its store's cart; thumbs up
    const cards = [0, 1, 2], spot = [at(89 - 57), at(229 - 57), at(369 - 57)]
    cards.forEach((i) => { tl.set($('w0-badge' + i), { scale: 0, opacity: 0 }, 0); tl.set($('w0-ok' + i), { opacity: 0, scale: 0.6 }, 0) })
    tl.set([$('w0-pill'), $('w0-pill2')], { opacity: 0, y: 14 }, 0)
    tl.set(st, { y: 170 }, 0)
    to(tl, { y: -14, sx: 0.94, sy: 1.07 }, 0, 0.32, E.out)
    to(tl, { y: 0 }, 0.32, 0.16, E.in)
    to(tl, { by: 6, sx: 1.06, sy: 0.94 }, 0.48, 0.07).to(st, { by: 0, sx: 1, sy: 1, duration: 0.35, ease: E.settle }, 0.55)
    loosen(tl, 0.1, 0.2)
    arc(tl, 'R', { x: 246, y: 62, r: -22, pose: 'open' }, 0.3, 0.3)
    brows(tl, 0.3, { ly: -7, ry: -8 }, 0.16, E.pop)
    ;[22, -20, 16, -10].forEach((a, i) => to(tl, { hRr: a }, 0.62 + i * 0.16, 0.16, E.soft))
    speak(tl, 0.45, '¡Hola, soy Boxly!', 1.15)
    hand(tl, 'R', { x: 226, y: 206, r: -10, pose: 'open' }, 1.35, 0.25)
    const cur = $('w0-cursor')
    tl.set(cur, { x: 120, y: 140, opacity: 0 }, 0)
    tl.to(cur, { opacity: 1, duration: 0.2 }, 1.05)
    cards.forEach((i) => {
      const tc = 1.45 + i * 0.85
      // the customer picks: the cursor goes to the card and clicks its size
      tl.to(cur, { x: i * 140 + 20, y: 30, duration: 0.3, ease: 'power2.inOut' }, tc - 0.4)
      tl.to(cur, { scale: 0.8, duration: 0.07, yoyo: true, repeat: 1 }, tc - 0.08)
      tl.fromTo($('w0-size' + i), { scale: 1 }, { scale: 1.25, duration: 0.1, yoyo: true, repeat: 1 }, tc - 0.05)
      // Boxly hops to the card and taps "Agregar al carrito"
      hopTo(tl, tc - 0.5, spot[i], 18, 0.36)
      arc(tl, 'R', { x: 238, y: 92, r: -12, pose: 'open' }, tc - 0.05, 0.2)
      hand(tl, 'R', { y: 74 }, tc + 0.16, 0.08, E.in)
      hand(tl, 'R', { y: 96 }, tc + 0.24, 0.12, E.out)
      tl.fromTo($('w0-btn' + i), { scale: 1 }, { scale: 0.9, duration: 0.07, yoyo: true, repeat: 1 }, tc + 0.18)
      tl.to($('w0-badge' + i), { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(2.6)' }, tc + 0.22)
      tl.to($('w0-ok' + i), { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(2.2)' }, tc + 0.26)
      brows(tl, tc + 0.22, { ly: -5, ry: -6 }, 0.12, E.pop)
      mouth(tl, tc + 0.22, 'smile')
    })
    tl.to(cur, { opacity: 0, duration: 0.2 }, 3.75)
    hand(tl, 'R', { x: 226, y: 206, r: -10 }, 3.75, 0.2)
    hopTo(tl, 3.85, 0, 30, 0.6)
    tl.to($('w0-pill'), { opacity: 1, y: 0, duration: 0.35, ease: 'back.out(2)' }, 4.45)
    tl.to($('w0-pill2'), { opacity: 1, y: 0, duration: 0.35, ease: 'back.out(2)' }, 4.7)
    home(tl, 4.55, 0.5)
    blink(tl, 5.15, 'R', 0.45)
    mouth(tl, 5.15, 'smirk'); mouth(tl, 5.7, 'smile')
  }

  if (k === 1) {
    // 1 · Received in San Diego: each package lands on the counter, Boxly scans it (beep ✓), the label shows her name and
    // Boxly US address, a banner says "Llegó 1 de 3…"; he sets it aside; all three → "¡Ya llegaron todos!"
    place(at(330))
    // each package's shelf slot is its CSS home (final pose); it arrives at the counter, then is put on the shelf
    const PK = [{ x: 456, dy: 144 }, { x: 528, dy: 144 }, { x: 500, dy: 40 }] // shelf slot → counter offset
    tl.set($('w1-done'), { opacity: 0 }, 0)
    PK.forEach((p, i) => {
      tl.set($('w1-dot' + i), { backgroundColor: '#CBD5E1' }, 0)
      tl.set($('w1-pkg' + i), { x: 720 - p.x, y: p.dy, opacity: 1 }, 0)
      tl.set($('w1-label' + i), { opacity: 0 }, 0)
      tl.set($('w1-stamp' + i), { scale: 0 }, 0)
    })
    ;[0, 1, 2, 3].forEach((i) => tl.set($('w1-ban' + i), { opacity: 0, y: -40 }, 0))
    scanOut(0.15)
    PK.forEach((p, i) => {
      const t = 0.45 + i * 1.35
      tl.to($('w1-pkg' + i), { x: 440 - p.x, duration: 0.45, ease: 'power3.out' }, t)
      if (i) tl.to($('w1-label' + (i - 1)), { opacity: 0, duration: 0.15 }, t + 0.25)
      tl.to($('w1-label' + i), { opacity: 1, duration: 0.2 }, t + 0.3)
      aim(t + 0.4)
      beep(t + 0.85)
      tl.to($('w1-stamp' + i), { scale: 1, duration: 0.3, ease: 'back.out(2.6)' }, t + 0.86)
      if (i) hide($('w1-ban' + (i - 1)), t + 0.8, 0.2)
      show($('w1-ban' + i), t + 0.88)
      // onto her reserved shelf (an arc: up first, then across), and the bin's progress fills
      tl.to($('w1-pkg' + i), { y: 0, duration: 0.4, ease: 'power2.out' }, t + 1.05)
      tl.to($('w1-pkg' + i), { x: 0, duration: 0.4, ease: 'power1.inOut' }, t + 1.05)
      tl.to($('w1-dot' + i), { backgroundColor: '#16A34A', duration: 0.15 }, t + 1.4)
      hand(tl, 'R', { x: 246, y: 120 }, t + 1.0, 0.2, E.out); hand(tl, 'R', { x: 246, y: 186 }, t + 1.25, 0.2)
      to(tl, { lean: 0, by: 0, sx: 1, sy: 1, lookX: 2, lookY: 1 }, t + 1.1, 0.25)
    })
    tl.to($('w1-done'), { opacity: 1, duration: 0.3 }, 4.45)
    hide($('w1-ban2'), 4.4, 0.2)
    show($('w1-ban3'), 4.5)
    to(tl, { scan: 0 }, 4.5, 0.1)
    home(tl, 4.55, 0.5)
    brows(tl, 4.6, { ly: -6, ry: -7 }, 0.15, E.pop)
  }

  if (k === 2) {
    // 2 · Loading the van (Alex: no map, no border line): Boxly starts the belt, packages from every store ride into the
    // Boxly van, he watches them in with a little nod for each, the side door slides shut, a thumbs up, the van rumbles
    // and the room warms toward Tijuana (tint act). Final pose: the loaded van with its door shut + "Rumbo a Tijuana ✓".
    place(at(96))
    const door = $('w2-door'), rollers = $('w2-rollers'), light = $('w2-light')
    tl.set(door, { x: -76 }, 0)                       // open (slid toward the back)
    tl.set($('w2-ok'), { opacity: 0, scale: 0.6 }, 0)
    tl.set($('w2-puffs'), { opacity: 0, x: 0 }, 0)
    tl.set(light, { backgroundColor: '#DC2626' }, 0)
    tl.set(tint, { v: 0 }, 0)
    tl.set($('w2-load'), { opacity: 1 }, 0); tl.set($('w2-out'), { opacity: 0 }, 0)
    const pk = [0, 1, 2, 3, 4, 5].map((i) => $('w2-pkg' + i))
    pk.forEach((el) => tl.set(el, { x: -80, opacity: 1, scale: 1 }, 0))
    // presses the start button on the panel
    to(tl, { lookX: 4, lookY: 2, lean: 5 }, 0.1, 0.2)
    hand(tl, 'R', { x: 226, y: 150, r: -20, pose: 'fist' }, 0.15, 0.25, E.out)
    hand(tl, 'R', { x: 232, y: 162 }, 0.42, 0.08, E.in)
    tl.set(light, { backgroundColor: '#16A34A' }, 0.48)
    hand(tl, 'R', { x: 226, y: 206, r: -10, pose: 'open' }, 0.55, 0.25)
    to(tl, { lean: 0 }, 0.55, 0.25)
    brows(tl, 0.5, { ly: -6, ry: -7 }, 0.12, E.pop)
    // the belt runs
    tl.to(rollers, { attr: { 'stroke-dashoffset': -180 }, duration: 3.4, ease: 'none' }, 0.5)
    pk.forEach((el, i) => {
      const t = 0.6 + i * 0.42, endX = 470 - (el ? parseFloat(el.style.width) / 2 : 30)
      tl.to(el, { x: endX, duration: 1.5, ease: 'none' }, t)
      tl.to(el, { x: endX + 30, scale: 0.6, opacity: 0, duration: 0.22, ease: 'power1.in' }, t + 1.5)
      to(tl, { by: 4, sy: 0.97 }, t + 1.5, 0.08, E.out).to(st, { by: 0, sy: 1, duration: 0.2, ease: E.io }, t + 1.58) // a nod as it goes in
    })
    to(tl, { lookX: 5, lookY: 0 }, 1.6, 0.4)
    // door shut, thumbs up, the van rumbles off-to-be
    tl.set(light, { backgroundColor: '#DC2626' }, 4.25)
    tl.to(door, { x: 0, duration: 0.45, ease: 'power2.inOut' }, 4.3)
    to(tl, { lookX: 0, lookY: 0 }, 4.3, 0.25)
    const van = $('w2-van')
    tl.set(van, { x: 0, opacity: 1, scaleX: 1, scaleY: 1, transformOrigin: '50% 100%' }, 0)
    tl.set($('w2-ok'), { opacity: 0 }, 0)
    tl.to(van, { y: -3, duration: 0.07, yoyo: true, repeat: 5, ease: 'sine.inOut' }, 4.75)          // engine on
    tl.to($('w2-puffs'), { opacity: 1, duration: 0.15 }, 4.8).to($('w2-puffs'), { x: -40, opacity: 0, duration: 0.6, ease: 'power1.out' }, 4.95)
    tl.to(van, { scaleX: 0.96, scaleY: 1.03, duration: 0.12, ease: 'power2.out' }, 5.15)          // pull-away squash
    tl.to(van, { scaleX: 1, scaleY: 1, duration: 0.3, ease: 'elastic.out(1, .5)' }, 5.27)
    tl.to(van, { x: 340, duration: 0.9, ease: 'power2.in' }, 5.15)
    tl.to(van, { opacity: 0, duration: 0.15 }, 5.95)
    ;[0, 1].forEach((w) => tl.to($('w2-wheel' + w), { rotation: 540, svgOrigin: w ? '196 126' : '46 126', duration: 0.9, ease: 'power2.in' }, 5.15))
    // waves it off, THEN the board flips and the room warms toward Tijuana
    arc(tl, 'R', { x: 246, y: 66, r: -20, pose: 'open' }, 5.1, 0.25)
    ;[18, -16, 12].forEach((a, i) => to(tl, { hRr: a }, 5.35 + i * 0.15, 0.15, E.soft))
    tl.to($('w2-load'), { opacity: 0, duration: 0.15 }, 6.0); tl.to($('w2-out'), { opacity: 1, duration: 0.2 }, 6.1)
    tl.to($('w2-ok'), { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(2.2)' }, 6.1)
    tl.to(tint, { v: 1, duration: 0.9, ease: 'sine.inOut' }, 6.1)
    home(tl, 6.0, 0.55)
    blink(tl, 6.7, 'R', 0.45)
  }

  if (k === 3) {
    // 3 · Scanned in Tijuana: three quick scans (beep, beep, beep), each package and its row get a ✓, then the banner
    place(at(330))
    ;[0, 1, 2].forEach((i) => { tl.set($('w3-ok' + i), { scale: 0 }, 0); tl.set($('w3-check' + i), { scale: 0 }, 0) })
    tl.set($('w3-ban'), { opacity: 0, y: -40 }, 0)
    scanOut(0.1)
    ;[0, 1, 2].forEach((i) => {
      const t = 0.55 + i * 0.62
      aim(t)
      to(tl, { bx: i * 8 }, t, 0.2)
      beep(t + 0.32)
      tl.to($('w3-ok' + i), { scale: 1, duration: 0.3, ease: 'back.out(2.6)' }, t + 0.33)
      tl.to($('w3-check' + i), { scale: 1, duration: 0.3, ease: 'back.out(2.6)' }, t + 0.36)
    })
    to(tl, { scan: 0 }, 2.55, 0.1)
    show($('w3-ban'), 2.6)
    to(tl, { bx: 0 }, 2.6, 0.2)
    hand(tl, 'L', { x: 26, y: 150, r: -30, pose: 'open' }, 2.65, 0.25, E.out)
    hand(tl, 'R', { x: 236, y: 150, r: 30, pose: 'open' }, 2.65, 0.25, E.out)
    brows(tl, 2.65, { ly: -8, ry: -9 }, 0.15, E.pop)
    home(tl, 3.3, 0.5)
  }

  if (k === 4) {
    // 4 · Your final box: S doesn't fit, M does; the customer pays; Boxly packs all three, tapes it, sticks the Boxly
    // sticker, winks and gives a thumbs up — "3 paquetes → 1 caja"
    place(at(610))
    const P = [0, 1, 2].map((i) => $('w4-pkg' + i)), boxS = $('w4-boxS'), boxM = $('w4-boxM')
    P.forEach((el) => tl.set(el, { x: 130, y: 0, opacity: 1, scale: 1 }, 0))
    tl.set(boxS, { x: -140, opacity: 0, scale: 0.6 }, 0)
    tl.set(boxM, { opacity: 0, scale: 0.6 }, 0)
    tl.set([$('w4-tape')], { scaleX: 0 }, 0)
    tl.set($('w4-sticker'), { scale: 0 }, 0)
    tl.set([$('w4-nofit'), $('w4-fit')], { opacity: 0, scale: 0.6 }, 0)
    tl.set($('w4-paid'), { opacity: 0, scale: 0.8 }, 0)
    tl.set($('w4-card'), { opacity: 0, y: 14 }, 0)
    const hnd = $('w4-hand')
    tl.set(hnd, { opacity: 0, x: 60, y: 60 }, 0)
    // lines them up
    loosen(tl, 0, 0.2)
    to(tl, { lookX: -4, lookY: 3, lean: -4 }, 0.05, 0.25)
    brows(tl, 0.05, { ly: 3, lr: 8, ry: 3, rr: -8 }, 0.15)
    mouth(tl, 0.05, 'line')
    // the S box: the New Balance carton pokes out
    tl.to(boxS, { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(2)' }, 0.5)
    hand(tl, 'L', { x: 20, y: 196, r: 60 }, 0.45, 0.3)
    tl.to(P[2], { x: -70, y: -40, duration: 0.3, ease: 'power2.out' }, 0.85).to(P[2], { y: -22, duration: 0.2, ease: 'power2.in' }, 1.15) // pokes out of the S box
    tl.to($('w4-nofit'), { opacity: 1, scale: 1, duration: 0.25, ease: 'back.out(2)' }, 1.2)
    mouth(tl, 1.2, 'o'); brows(tl, 1.2, { ly: -4, lr: -8, ry: 3, rr: 10 }, 0.12)
    tl.to(P[2], { x: 130, y: 0, duration: 0.3, ease: 'power2.inOut' }, 1.45)
    tl.to(boxS, { x: -260, opacity: 0, duration: 0.3, ease: 'power2.in' }, 1.5)
    // the M box: all three hop in
    tl.to(boxM, { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(2)' }, 1.75)
    mouth(tl, 1.8, 'smile'); brows(tl, 1.8, { ly: -6, ry: -6 }, 0.12, E.pop)
    tl.to($('w4-fit'), { opacity: 1, scale: 1, duration: 0.25, ease: 'back.out(2)' }, 1.9)
    P.forEach((el, i) => {
      const t = 2.0 + i * 0.22
      tl.to(el, { x: 30 - i * 46 + 20, y: -60, duration: 0.2, ease: 'power2.out' }, t)
      tl.to(el, { y: -10, scale: 0.7, opacity: 0, duration: 0.18, ease: 'power2.in' }, t + 0.2)
      hand(tl, 'L', { x: 14 + (i % 2) * 10, y: 186, r: 70 }, t, 0.2)
    })
    // the customer pays (a bare hand)
    tl.to(hnd, { opacity: 1, x: 0, y: 0, duration: 0.35, ease: 'power2.out' }, 2.45)
    tl.to(hnd, { scale: 0.88, duration: 0.07, yoyo: true, repeat: 1 }, 2.85)
    tl.to($('w4-paid'), { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(2.2)' }, 2.95)
    tl.to(hnd, { opacity: 0, y: 40, duration: 0.3 }, 3.3)
    to(tl, { lookX: -5, lookY: -2 }, 2.5, 0.2)
    // tape + sticker
    hand(tl, 'R', { x: 196, y: 196, r: -60, pose: 'fist' }, 3.25, 0.25)
    tl.to($('w4-tape'), { scaleX: 1, duration: 0.5, ease: 'power2.inOut' }, 3.4)
    hand(tl, 'L', { x: 4, y: 176, r: 80 }, 3.4, 0.5)
    tl.to($('w4-sticker'), { scale: 1, duration: 0.3, ease: 'back.out(3)' }, 4.05)
    to(tl, { by: 4, sy: 0.97 }, 4.05, 0.08).to(st, { by: 0, sy: 1, duration: 0.3, ease: E.settle }, 4.13)
    tl.to($('w4-card'), { opacity: 1, y: 0, duration: 0.35, ease: 'back.out(2)' }, 4.3)
    home(tl, 4.4, 0.5)
    blink(tl, 5.0, 'R', 0.55)
    mouth(tl, 5.0, 'smirk'); mouth(tl, 5.6, 'smile')
  }

  if (k === 5) {
    // 5 · Anywhere in Mexico: Boxly carries the sealed box to the courier and hands it over; the route draws from Tijuana to
    // the customer's city, the tracking card shows "En camino", the pin bounces
    place(at(530))
    tl.set(st, { cOn: 1, cHeld: 1, hLx: 114, hLy: 236, hLr: 95, hRx: 206, hRy: 232, hRr: -95 }, 0)
    tl.call(() => { kit.poses.L = 'open'; kit.poses.R = 'open' }, null, 0)
    const cour = $('w5-courier')
    tl.set(cour, { opacity: 0, x: 60 }, 0)
    tl.set($('w5-route'), { opacity: 0 }, 0)
    tl.set($('w5-track'), { opacity: 0, y: 14 }, 0)
    tl.set($('w5-pin'), { opacity: 0, y: -20 }, 0)
    mouth(tl, 0, 'smile')
    hopTo(tl, 0.2, at(565), 14, 0.36)
    tl.to(cour, { opacity: 1, x: 0, duration: 0.3, ease: 'power2.out' }, 0.75)
    hand(tl, 'L', { x: 150, y: 226 }, 0.9, 0.25); hand(tl, 'R', { x: 236, y: 222 }, 0.9, 0.25)
    to(tl, { lean: 8 }, 0.9, 0.25)
    to(tl, { cOn: 0 }, 1.2, 0.2)
    tl.to(cour, { x: 80, opacity: 0, duration: 0.4, ease: 'power2.in' }, 1.25)
    to(tl, { lean: 0 }, 1.25, 0.25)
    tl.to($('w5-track'), { opacity: 1, y: 0, duration: 0.35, ease: 'back.out(2)' }, 1.3)
    arc(tl, 'R', { x: 246, y: 66, r: -20, pose: 'open' }, 1.4, 0.25)
    ;[18, -16, 12].forEach((a, i) => to(tl, { hRr: a }, 1.65 + i * 0.15, 0.15, E.soft))
    tl.to($('w5-route'), { opacity: 1, duration: 1.4, ease: 'sine.inOut' }, 1.5)
    to(tl, { lookX: -5, lookY: -3 }, 1.8, 0.25)
    tl.to($('w5-pin'), { opacity: 1, y: 0, duration: 0.45, ease: 'bounce.out' }, 2.9)
    brows(tl, 3.0, { ly: -6, ry: -7 }, 0.15, E.pop)
    home(tl, 3.4, 0.55)
  }

  if (k === 6) {
    // 6 · Delivered: the box arrives at her door, the flaps open, out come the three orders (Boxly hops with joy each time),
    // the banner says "Entregado ✓", and Boxly does Erick's pose
    place(at(560))
    const box = $('w6-box')
    tl.set(box, { x: 320, opacity: 0 }, 0)
    tl.set($('w6-flapL'), { rotation: 0 }, 0); tl.set($('w6-flapR'), { rotation: 0 }, 0)
    ;[0, 1, 2].forEach((i) => tl.set($('w6-item' + i), { y: 70, opacity: 0, scale: 0.6 }, 0))
    tl.set($('w6-ban'), { opacity: 0, y: -40 }, 0)
    loosen(tl, 0, 0.2)
    to(tl, { lookX: -5, lookY: 2 }, 0.1, 0.25)
    tl.to(box, { x: 0, opacity: 1, duration: 0.55, ease: 'power3.out' }, 0.2)
    tl.to($('w6-flapL'), { rotation: -125, duration: 0.4, ease: 'back.out(1.6)' }, 0.95)
    tl.to($('w6-flapR'), { rotation: 125, duration: 0.4, ease: 'back.out(1.6)' }, 1.05)
    ;[0, 1, 2].forEach((i) => {
      const t = 1.35 + i * 0.45
      tl.to($('w6-item' + i), { y: 0, opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(2)' }, t)
      to(tl, { y: -14, sy: 1.04 }, t, 0.14, E.out).to(st, { y: 0, sy: 1, duration: 0.16, ease: E.in }, t + 0.14)
      brows(tl, t, { ly: -7, ry: -8 }, 0.1, E.pop)
    })
    show($('w6-ban'), 2.75)
    mouth(tl, 2.8, 'smile')
    home(tl, 3.0, 0.6)
    blink(tl, 3.9)
  }

  return tl
}
