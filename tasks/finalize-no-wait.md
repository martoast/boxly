# Finalizar without waiting: "you can close the app, the invoice comes by email" (Alex 2026-10-04)

Problem: after Finalizar the chat opens the live store browser (video) for each store's checkout, and
the shopper sits there watching. They don't need to. The purchase request already exists for the team
the moment they tap Finalizar, and the invoice email (Stripe's plus ours) already goes out on its own
when the totals are verified.

## Plan (app only, no API change)
- [ ] 1. Chat: Finalizar no longer opens the live browser card. Drop the CheckoutCard → `@live`
      hand-off (`onCheckoutLive`) in ShoppingAssistant.vue, so no video and no progress screen pops up.
- [ ] 2. CheckoutCard, while working: the text becomes the message the shopper needs: "Ya estamos
      armando tu carrito en cada tienda. En unos minutos te llega la factura a tu correo; puedes cerrar
      la app, no necesitas esperar aquí." The quiet per-store status list stays. If they stay or come
      back, the invoice with Pagar still appears in the card.
- [ ] 3. Prompt (assistant.post.ts): after finalize_order, the assistant's own line says the same thing
      (building the carts, invoice by email in a few minutes, close the app). It never says "watch" or "live".
- [ ] 4. Tests: boxCheckout / picker suites + a type check. Then one live Finalizar on the lab account:
      no video card, the message shows, the email arrives, and the PR exists.

## Not changing
- The API: the PR is created at Finalizar; the invoice is sent automatically when quotes complete;
  a store that fails leaves the PR for the team, as today.

## Review (2026-10-04)
- ShoppingAssistant.vue: the CheckoutCard's `@live` hand-off is gone, so Finalizar opens no browser card or video.
- CheckoutCard.vue: the working text now reads "Ya estamos armando tu carrito … te llega la factura a tu correo; puedes cerrar la app".
- assistant.post.ts: the finalize_order tool note and the two prompt lines now give the same message; never "míralo en vivo".
- No API change. picker-logic 6/6, utils/server tests 21/21. nuxi typecheck fails identically on the unchanged code (npx typescript export error).
