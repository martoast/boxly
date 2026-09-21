# Tell them the WhatsApp is coming, and why it matters

> "when the user does their purchase request, we should include in the messaging
> there that they will be contacted by our team via WhatsApp so that they can be
> on standby and not ignore it… to finish up their purchase request and send them
> their invoice." — Alex, 2026-09-21

Both confirmation cards said:

> "Nuestro equipo de compras se pondrá en contacto contigo en breve."

True, and it never said **how**. So the WhatsApp that actually finishes the
purchase — and carries the quote — arrives from an unknown number, unannounced.
A shopper who was expecting nothing reads that as spam, and a request nobody
answers is a sale that stalls.

## Changed

**Two cards, identical wording** (they confirm the same thing by two routes —
`show_assisted_summary`'s success footer, and the `create_purchase_request`
card — and a shopper may see either):

    Solicitud BX-…  creada. No pagas nada todavía.
    💬 Nuestro equipo de compras te escribe POR WHATSAPP en breve para afinar los
       últimos detalles y enviarte tu cotización (producto + servicio + envío)
       para que la apruebes.
    👀 MANTENTE PENDIENTE DE TU WHATSAPP — tu pedido avanza en cuanto nos contestes.

The last line is the point: it gives the shopper a reason to watch, and says
plainly that the order waits on them.

**The prompt.** The model's own closing line now has to point at WhatsApp too,
with the reason written down (they are expecting nothing, so an unannounced
message from an unknown number reads like spam). It still must never claim the
request is created and never state a PR number — the card does that. And two
things it may not invent: a phone number, or a time of day.

## Todo
- [x] Assisted-purchase card
- [x] create_purchase_request card, same words
- [x] Prompt: the spoken line agrees with the card
- [x] Tests for both surfaces and the prompt

## Note for later
No phone number is shown, because the chat doesn't have one to hand — the user
model has `phone`, but nothing in the assistant fetches it. Saying "te escribimos
al 55…" would be better still, and would need that one field plumbed through.
Worth doing if shoppers still miss the message.

17 checks in purchase-confirm. All 15 suites green, build clean.
