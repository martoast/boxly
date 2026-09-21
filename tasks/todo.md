# 90 packs of face wipes were not a Caja Chica

A real customer was told:

> "llenarías la caja **Chica (S)** con aproximadamente **85 a 90 paquetes** (con 90
> piezas se estima el 100% de la capacidad por volumen y un peso de ~13.5 kg,
> manteniéndose dentro del límite máximo de 15 kg)"

and the card said **100% · te queda 0% · "casi llena — buen momento para pedir tu
envío"**. Ninety of those is **1.9× that box's entire volume** and **~27 kg**,
well past its 15 kg limit. About 35 fit.

## Three faults

**1. The bucket was half the real size.** `rigid_small` is 403 cm³ — a 7.4 cm
cube, which is a perfume carton. It was also the bucket for "cosméticos,
accesorios, sanitizers", so a ~760 cm³ tub of wipes landed in it at half size,
and at 0.15 kg when wet goods are ~0.35.

**2. Bare substrings matching inside longer words.** Found chasing the wipes, and
this was the loudest one: `remo` (a rowing oar) matched "Makeup **REMO**ver", so
the fallback classified them as `oversize_long` — **21 shoe-units, an entire XL
box, one per pack**. Eight more of the same shape.

**3. The model stated a piece count, which the prompt forbids.** It already says
*"never state a piece-count capacity as fact — a guessed 'caben entre 100 y 140'
is a number the customer will hold us to"*. Fourth prompt-only guarantee in this
file to lose.

## Todo
- [x] `toiletry` bucket — a drugstore package, ~2× a perfume carton, and heavy
- [x] Anchor every substring short enough to live inside another word
- [x] `parfum` / `lip gloss` / `pantalla` matched nothing at all → fell to the 0.40 default
- [x] `bulk` flag: at ≥25 of one line the card stops nudging and the model is told what it may not claim
- [x] Tests pin all nine traps AND the words they were there for

## Review

| | before | after |
|---|---|---|
| 90× Neutrogena wipes | Caja **Chica**, 100%, 13.5 kg | Caja **Grande**, ~90%, 31.5/35 kg |
| reality check | 90 packs = 68,400 cm³ | Caja Grande = 87,360 cm³ → 78% raw |

**The substring bugs, each worth a box size:**

| matched | inside | became |
|---|---|---|
| `remo` | Makeup **Remo**ver | oversize_long, 21 su |
| `glass` | Sun**glass**es | fragile, the volume of a lamp |
| `case` | Suit**case** | rigid_small, a 7 cm cube |
| `boot` | **Boot**cut Jeans | shoes |
| `ring` | Sp**ring** Jacket | rigid_small |
| `card` | **Card**igan | rigid_small |
| `heel` | Steering w**heel** | shoes |
| `collar` | **Collar**ed Shirt | rigid_small |
| `vase` | **Vase**line | fragile |
| `pant` | **Pant**alla 32" | medium_soft |

A suffix-only `\b` (`coats?\b`) keeps raincoat working while blocking "coating".

**The durable guard.** Every per-piece volume here is inferred from a product
title, so it is good to maybe a factor of two. At three items that is the
difference between "half full" and "quite full" and nobody is harmed. At ninety
it is one box versus three — the error never grows, the consequence does. So at
≥25 of one line the card labels the bar `~`, drops the "casi llena, pide tu
envío" push (the worst moment to push is on a number out by two box sizes), and
the tool result tells the model: do not state how many fit, talk cost per piece,
offer the purchasing team.

90 checks in box-fit. All 13 suites green, build clean.
