# A bowling ball and an above-ground pool are not 23% of a Caja Chica

Alex added a Hammer Black Widow bowling ball and an Intex Rectangular Frame
Above Ground Pool. The card said **Caja Chica, 23% usada, te queda 77%** and
invited him to add more (2026-09-16).

Two separate defects produced that one number.

## 1. A pool does not fit in ANY box, and nothing could say so
The largest box is 52x62x53 cm. The model filed the pool as `bulky_soft` — the
tier whose examples are pillows and blankets — worth 0.80 shoe-units. There was
no classification meaning "no box takes this", so the estimator had no way to
answer anything but a box size.

## 2. Weight was never modelled
A bowling ball is ~5% of a Caja Chica by volume and **7 kg** against that box's
**15 kg** limit. The 15 kg cap was written down in a comment in `boxMath.ts`
explaining why `fits` is capped — understood, never enforced. Two balls exceed
the S box while the bar reads ~11%.

## 3. (found on the way) Two packing models that had drifted
`server/utils/boxMath.ts` calls itself "the one implementation"; the assistant
kept a private copy. `rigid_large` / `oversize_long` were added to the copy on
2026-09-15 and never to boxMath — so the chat's box card sized a PlayStation at
2.20 while the cost card beside it sized the same console at the 0.40 default.

## Todo
- [x] Fold the archetype model back into `boxMath.ts`, one table
- [x] `oversize_freight` archetype + `isUnboxable()` (pool, mattress, fridge, sofa, 65" TV...)
- [x] Weight: `ARCHETYPE_KG`, `DENSE_KG` overrides, `max_kg` per tier, `fitTier()` = larger of the two lids
- [x] `buildShipment` imports it; freight items leave the box and are named
- [x] `quoteBox` must not price a shipment it cannot ship
- [x] ShipmentCard: show the binding lid; show freight items as NOT in the box
- [x] Tool schema + prompt: `oversize_freight` -> `show_contact_whatsapp`
- [x] Tests: the exact shipment from the screenshot, plus the old ones still green

## Review

**`server/utils/boxMath.ts`** is now the only packing model. It gained
`rigid_large` and `oversize_long` (which existed only in the assistant's copy),
a weight model (`ARCHETYPE_KG` + a short `DENSE_KG` override list), `max_kg` on
every tier, and `fitTier()` — the box is the larger of what volume needs and
what weight needs. Volume keeps its 15% packing squeeze; weight gets none.

**`oversize_freight`** is a new archetype meaning *no box takes this*. Two
guards: a freight regex (pool, mattress, fridge, washer, sofa, bed frame,
treadmill, kayak, grill, ...) and a separate big-TV rule, both vetoed by
`RE_FREIGHT_ACCESSORY` so a pool float, a mattress topper and a TV wall mount
stay ordinary box items. The name beats the model here — it called the pool
`bulky_soft`, which is what a pillow is.

**`server/api/assistant.post.ts`** deleted its copy of the model and imports it.
Only the four-size display ladder stays local (pricing uses all seven).
`buildShipment` drops freight out of the volume sum, reports it by name, and
returns `limited_by` / `weight_kg` / `max_kg`. `quoteBox` returns null for a
shipment containing freight — the card already reads that as "se cotiza
aparte", which is the true answer. The tool result appends an instruction to
call `show_contact_whatsapp`; the enum and the prompt gained the tier.

**`ShipmentCard.vue`** draws freight in its own amber block outside the box with
the real reason (52×62×53 cm), hides the box chip when nothing fits one, and
labels the bar "Peso usado N%" with `kg / max kg` when weight is the binding
lid. The "te queda bastante espacio" nudge is replaced when the limit is weight
— the room is real and the allowance is not.

**The test** no longer re-implements the maths beside the code. It lifts the
real `buildShipment` out of the source and runs that, because a second copy of
the model is what caused this in the first place. 48 checks.

Alex's exact shipment now reads:

    ✗ OUT  Intex Rectangular Frame Above Ground Outdoor Pool
      in   Hammer Black Widow 3.0 Solid Bowling Ball   0.25u  7kg
    caja Chica · 47% usada (peso, 7/15 kg) · te queda 53%

**Not covered:** `server/utils/boxState.ts` (the shopper panel) sums volume only
and has no UI for either freight or weight. It reads the same corrected table,
so its archetypes are right now, but a panel box holding a bowling ball still
reads by volume alone.
