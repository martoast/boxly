# Boxly Lab — the whole checkout happens in the chat

Alex (2026-09-24): "the entire pipeline and interface for the user happens in the chat" → "yes build it all in the chat".

Lab member taps **Finalizar carrito** on the box card →
1. the box goes into their Boxly cart and is finalized (purchase request + one checkout quote per store),
2. a checkout card appears in the thread: each store's status, the live store browser of the store being worked (watch / take control, existing C4 panel), totals as they land,
3. when every store is verified the automatic invoice is created and the card shows **Pagar** (the Stripe link).

Customers (non-Lab) keep today's flow untouched.

## Todo
- [ ] API: `store_quotes[].live_session_id` while a quote is running (the browser to watch)
- [ ] Chat server: client tells it `boxlyLab` + `labFinalize` (button tap)
- [ ] Chat server: `finalize_lab_order` tool — box (last show_shipment) → reconcile /cart → POST /cart/finalize
      - web rows with no catalog store → blocked with a clear line (the agent can't buy there yet)
- [ ] prepareStep: Lab gets finalize_lab_order instead of show_assisted_summary; the button forces it
- [ ] Client: `LabCheckoutCard` (polls the request; stores + totals; Pagar when invoiced; team fallback note)
- [ ] Client: running store's browser shown with the existing live card/panel
- [ ] Tests (API + app), local e2e, then ask before deploy

## Review
