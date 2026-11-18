# Landing storyboard: Boxly does the work in every world

**Boxly** is Erick's mascot: a yellow cube with navy edges, white gloves, navy legs and navy sneakers with a yellow stripe.
He is drawn **exactly as Erick designed him**. The cube is closed, the **brows carry the mood**, and no parts are added.
In every world Boxly does the real work Boxly does at that step, and the window shows what the customer sees
as a result. No gags. With the sound off and the copy unread, each world should still show what happens to the order.

**Personality:** cheerful, careful, quick, proud of a well-packed box.
**Signature moves:** the wave (one glove up, a small hop), the scan (scanner raised, beep, a nod when the ✓ shows), the
lift (a squash before lifting, a stretch while carrying), and Erick's pose (the right glove thumbs up, the left on his
hip, the body leaning toward you, a big smile).

**The face does the acting.** The brows rise when he is happy or surprised, pull together when he concentrates (lining
up packages, trying box sizes), and tilt when he thinks. The eyes blink, look at the thing he works on and look at you
at the end of most worlds. Mouths: Erick's open smile (default), a closed smile, a small "o" (surprise), a concentrating
line, and 2–3 talking shapes. *These are expressions of Erick's existing face, not new parts. Erick approves them
with the rig (step 2).*

## The order we follow

One shopper, **María López**, buys from 3 US stores. These are among the stores Boxly customers buy from most:

| # | Store | Item | Package |
|---|-------|------|---------|
| A | Bath & Body Works | body care set (mist + lotion) | small mailer bag |
| B | Gymshark | leggings | poly bag |
| C | Nike | sneakers | orange shoe box in a brown carton |

Each package carries the label exactly as customers write it: **BOXLY MARÍA LÓPEZ**, 157 Virginia Ave Suite 835, San
Ysidro, CA 92173. Suite 835 is Boxly's own address, the same one the app gives every customer (only the name line
changes), so it is not a private customer suite. Showing it on the labels explains the address; there is no separate
address world.

## How it is built (Kiru's engine, ported)

- One number `n` drives the stage: 0 = hero, 1–6 = worlds, from how far the pinned section has been scrolled. From
  `n`, every frame: the room colour, which copy block shows, what the window holds, where the floating cards sit
  (on springs, so a fast scroll overshoots and settles).
- Each world's scene is **one GSAP timeline**, built paused. It plays from the start when the world arrives and rewinds
  to 0 when it leaves, so scrolling back plays it again. With reduced motion it jumps to the end.
- **Boxly is a rig**: layers of flat SVG traced from Erick's render, moved only by transforms. Back to front: contact
  shadow · root (x) › hop (y) › breath (idle) › body (squash, lean, a slight 3/4 turn) › [legs, sneakers, cube (top,
  left and front faces with Erick's navy edges), face (brows, eyes with whites, pupils, catchlights and a blink,
  mouths), arms, gloves (open, thumbs up, fist/holding), held props] · speech bubble.
- Arms are drawn every frame from the shoulder to wherever the glove is. A held prop (scanner, package, tape) sits in
  the glove and swings against its motion on a spring.
- Only transforms and opacity are animated. Each element's own style is its final pose, which is what reduced motion
  shows and what the server renders.
- **Mobile crop (Henry's review):** on phones the board is cropped to the window plus ~20 px, and every prop outside the
  window that is less than 80% visible is hidden (`.offcrop`). So **everything essential lives inside the window**:
  the store logos (a logo wall on the window's screen), the notifications and the prices. Floating cards outside the
  window are extras on desktop only and never carry essential information.
- **Notifications** are an iOS-style banner that slides down from the window's top edge, inside the window, and stacks
  there. There is no separate drawn phone.
- **Room colours follow scroll, not the act clock**: the engine blends one palette into the next over n 0.34–0.66
  between worlds. Palettes: 0–1 US blue (#2E6BB7 tints), 2 US blue, 3–4 warm Tijuana (sand → terracotta), 5 warm,
  6 navy (#0C254C) with warm-white and yellow accents (never yellow behind the yellow mascot). The one timed colour beat,
  world 2's crossing, is a `.room-tint` overlay that is itself part of world 2's act (Kiru's colour-world trick).
- **Prices** in world 4 are rendered on the server into the final pose from the site's live box prices (the ones
  `BoxPricing` uses). With reduced motion, without JS, or if prices fail to load, the picker still shows S/M/L/XL;
  a missing price hides its number and never shows $0 or an empty picker.

### One stage, in window coordinates

Like Kiru: the window is **660×480** on the board at (150,160); its screen starts at **y 36**; everything below is
window-local px. Boxly lives in `.win-over` at window scale, in a **120×120 box (10em at 12px)**, with his feet on the
**floor line y 448**. His home spot is **x 470–590** (bottom right of the window), so the screen's content keeps the
left two thirds.

| Station | Where (window px) | Worlds |
|---|---|---|
| Store tabs + logo wall (screen) | x 24–440, y 56–300 | 0 |
| Counter / table top | x 300–640, top y 376 | 1, 3, 4 |
| Shelf behind Boxly | x 520–650, y 250–320 | 1 |
| Loading door (right edge) | x 600–660, y 300–448 | 2 |
| Map (screen) | x 24–440, y 56–330 | 2, 5 |
| Box picker (screen) | x 24–300, y 60–220 | 4 |
| Notification banner (slides in) | x 160–500, y 40–92 | 1, 3, 4, 6 |
| Proof-card corner (desktop extras) | outside the window, left and right | all |

---

## 0 · Hero: "Compra en cualquier tienda de EE.UU." (5.6 s, plays on load)

**Copy:** *Compra en cualquier tienda de EE.UU.* / Amazon, Bath & Body Works, Nike, Gymshark… Boxly lo recibe en
San Diego, lo junta en una caja y te lo manda a cualquier parte de México.
**Store logos, inside the window:** the window's screen opens on a **logo wall** (a slow two-row marquee) of real
logos, unaltered: Bath & Body Works, Gymshark, Nike, Amazon, Walmart, Victoria's Secret, Coach Outlet, Sephora, Ulta
Beauty, American Eagle, then "y miles más". It stays behind the tabs, dimmed, so the logos survive the mobile crop. On
desktop, a few extra logos also float outside the window on springs (extras). Footer line: *Las marcas mostradas
pertenecen a sus respectivos dueños. Boxly no está afiliado con ellas.*
**Who does what (Henry's review):** the customer chooses (a bare hand cursor picks the item and size in Boxly AI), and
Boxly adds it to that store's cart. That is the real Boxly AI flow: the agent builds the cart in the store itself.

| t | Boxly | Window |
|---|-------|--------|
| 0–0.6 s | Pops up from below the window (squash → stretch → settle), looks at you and waves: **"¡Hola, soy Boxly!"** Brows up | The logo wall drifts; three store tabs slide over it: Bath & Body Works, Gymshark, Nike |
| 0.9 s | Turns to the window, brows tilt (reading) | Tab A: the customer's hand cursor picks the body care set |
| 1.3 s | Taps "Agregar al carrito" with his glove (a small lean in) | Cart badge pops **1**; a small "Bath & Body Works ✓" chip lands in the tab |
| 2.1 s | Hops to tab B (arcing hop, squash on landing) | The cursor picks the Gymshark leggings, size M; Boxly taps: badge **1**, chip "Gymshark ✓" |
| 2.9 s | Hops to tab C | The cursor picks the Nike sneakers, size 25 MX; Boxly taps: badge **1**, chip "Nike ✓" |
| 3.6 s | Steps back, brows up, looks over the three cards | The three cards line up: **"3 tiendas · 3 pedidos"** |
| 4.4 s | Faces you, Erick's pose (thumbs up, glove on hip), smile | A pill: "Todo va a tu dirección Boxly en EE.UU." |
| 5.0 s | Idle breath, blink | — |

**Payoff:** you can buy from any US store, and Boxly is the one who takes care of it.

## 1 · "Lo recibimos en EE.UU." (5.4 s)

**Copy:** *Lo recibimos en San Diego.* / Cada paquete llega a tu dirección Boxly en EE.UU. con tu nombre. Lo
escaneamos al llegar y te avisamos.

| t | Boxly | Window |
|---|-------|--------|
| 0–0.8 s | Stands at a counter with a handheld scanner in his right glove | A delivery hand (the carrier's, gloveless, cut by the window edge) slides package A onto the counter |
| 0.9 s | Leans in, raises the scanner, brows together | Label close-up: **MARÍA LÓPEZ · BOXLY**, 157 Virginia Ave Suite 835, San Ysidro |
| 1.3 s | **Beep**, a small nod | ✓ stamps on the label. The banner slides down from the window's top edge: **"Llegó 1 de 3 · Bath & Body Works"** |
| 2.0–2.4 s | Sets A on a shelf behind him (lift: squash, carry, set down) | Package B slides in |
| 2.7 s | Scan, beep, nod | ✓. Notification stacks: **"Llegó 2 de 3 · Gymshark"** |
| 3.4–3.8 s | Shelves B; the Nike carton slides in, heavier: he squats a little to scan it | — |
| 4.1 s | Scan, beep, brows up | ✓. Notification: **"Llegó 3 de 3 · Nike"**, and the stack collapses into **"¡Ya llegaron todos!"** |
| 4.8 s | Looks at you, closed smile, small nod | — |

**Payoff:** your packages arrive at your own US address, and you know the moment each one lands.

## 2 · "Cruzamos a Tijuana" (5.0 s)

**Copy:** *Los cruzamos a Tijuana.* / Nuestro equipo cruza tus paquetes de San Diego a Tijuana. Tú no haces nada.

| t | Boxly | Window |
|---|-------|--------|
| 0–0.9 s | Pushes a hand cart with the three packages toward the right, walking (bob, arms forward) | A simple map: San Diego ● and Tijuana ● with the border line between them |
| 1.0 s | Stops at a loading door, wipes his brow with the back of a glove (brows relaxed) | — |
| 1.4–2.4 s | Lifts each package (A, B, then the heavier C) and hands it through the door to the crossing team (two gloved hands, cut by the frame) | A dot leaves San Diego on the map with a "3 paquetes" tag |
| 2.6 s | Waves the team off | The dot crosses the border line. **A warm `.room-tint` overlay (part of this act) washes over the room**, so the colour turns as the dot crosses; world 3's warm palette takes over by scroll |
| 3.6 s | Turns and watches it go, brows up | The dot reaches Tijuana: "Cruzando ✓" |
| 4.4 s | Looks at you, thumbs up | — |

**Payoff:** crossing the border is Boxly's job, not yours.

## 3 · "Ya están en Tijuana" (4.8 s)

**Copy:** *Ya están en Tijuana.* / Los escaneamos otra vez al llegar a Tijuana, para que sepas que todo cruzó.

| t | Boxly | Window |
|---|-------|--------|
| 0–0.6 s | Already in the warm room; the three packages come off the cart onto a table | — |
| 0.8 / 1.6 / 2.4 s | Scans A, B, C in a quicker rhythm: beep, beep, beep, a nod each | A ✓ lights next to each package in a 3-row list |
| 3.0 s | Brows up, both gloves open (all there) | The banner slides down: **"Tus paquetes ya están en Tijuana"** |
| 3.8 s | Looks at you, closed smile | — |

**Payoff:** every package is accounted for on both sides of the border.

## 4 · "Tu caja final" (6.2 s, the second wow)

**Copy:** *3 paquetes → 1 caja.* / Juntamos todo en una sola caja. Pagas por tamaño de caja, en pesos, sin sorpresas.

| t | Boxly | Window |
|---|-------|--------|
| 0–0.7 s | Lines up A, B and C on the table, brows together (concentrating) | The box picker appears: **S · M · L · XL** with their prices in pesos *(server-rendered from the live box prices; the retired XS box never shows)* |
| 0.9 s | Brings over an **S** box and tries the Nike carton: it pokes out | **S** highlights, then "No cabe" in grey |
| 1.4 s | Pushes S aside with a small "hmm" mouth and tilted brows (one beat, not two) | — |
| 1.7 s | Brings an **M** box; A, B and C slide in one by one, each with a small settle | **M** highlights: "Cabe ✓" and its price |
| 2.6 s | Brows up, looks at the screen | **The customer's bare hand** taps **Pagar** |
| 3.0 s | — | **✓ Pagado** blooms; the banner: "Pago recibido · Caja M" |
| 3.4–4.4 s | Closes the flaps of the **shipping box** (the box, not Boxly) and runs the tape across (the tape gun swings on a spring) | — |
| 4.6 s | Presses a small Boxly-logo sticker on the side | — |
| 5.1 s | Looks at you, **winks**, thumbs up | Card: **"3 paquetes → 1 caja"** (inside the window) |

**Payoff:** three orders become one box, priced by size, paid in pesos.

## 5 · "A cualquier parte de México" (5.0 s)

**Copy:** *Te lo mandamos a cualquier parte de México.* / Con guía de rastreo, desde Tijuana hasta tu puerta.

| t | Boxly | Window |
|---|-------|--------|
| 0–0.8 s | Carries the sealed box (lift: squash, carry with a stretch) | A map of Mexico, a pin in Tijuana |
| 1.0 s | Hands it to the courier (a uniformed arm through the frame) | A tracking card: "En camino · Guía 7741…" |
| 1.4–3.6 s | Waves, then watches with brows up | A dashed route draws from Tijuana to the customer's city (for example Guadalajara) |
| 3.8 s | — | The pin in the destination bounces |
| 4.3 s | Looks at you, closed smile | — |

**Payoff:** one shipment, tracked, to anywhere in Mexico.

## 6 · "Entregado" (5.2 s)

**Copy:** *Entregado.* / Abres una caja y ahí está todo: tus 3 compras de 3 tiendas.

| t | Boxly | Window |
|---|-------|--------|
| 0–0.8 s | Stands at his home spot, brows up, watching | The box arrives at a front door, then the customer's bare hands open it |
| 1.0 / 1.5 / 2.0 s | A small hop of joy for each item | Out come the body care set, the leggings and the Nike box, each with its store name |
| 2.6 s | — | The banner: **"Entregado ✓"** |
| 3.2 s | **Erick's pose exactly**: right glove thumbs up, left glove on hip, leaning toward you, open smile | The navy room (set by scroll) makes the yellow cube pop |
| 4.4 s | Blink, idle breath | CTA under the story: **"Empieza a comprar"** |

**Payoff:** three stores, one box, at your door.

---

## Proof cards (desktop extras, 2–3 per world)

Floating outside the window like Kiru's, on springs. They vanish on phones, so they **never carry essential
information**; everything they say is also in the window or the copy.

| World | Cards |
|---|---|
| 0 | extra store logos; "Sin tarjeta americana" |
| 1 | "Escaneado 12:41 · San Diego"; "Tu dirección en EE.UU." |
| 2 | "Cruce diario"; "Tú no haces nada" |
| 3 | "Escaneado 09:15 · Tijuana"; "3 de 3 ✓" |
| 4 | the M price card; "Pagas en pesos" |
| 5 | "Guía de rastreo"; "Toda la República" |
| 6 | a 5-star review snippet; "3 tiendas → 1 caja" |

## Below the story (regular sections)

1. Price calculator by box size (the live prices `BoxPricing` already uses)
2. Stores (logos + "y miles más")
3. Reviews
4. FAQ (reuse `Landing/FAQSection`)
5. Sign-up CTA

## Changes after Henry's review (2026-11-18)

Logos and notifications moved inside the window (mobile crop); room colour by scroll, with a `.room-tint` act only for
world 2's crossing; world 6 room navy; customer picks and Boxly adds to the cart; bare hands for the customer; world 4
6.2 s with the "hmm" merged; prices server-rendered with a safe fallback; proof cards per world; one stage in window
coordinates. Suite 835 kept: it is Boxly's shared address, not a customer's.

## Open questions

- Hidden URL (proposal `/nueva-7kq3`, noindex, not in the sitemap).
- Erick approves the extra expressions (mouths, wink, brow poses) with the rig in step 2.
