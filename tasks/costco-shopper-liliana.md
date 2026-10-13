# A real shopper's bad AI-search experience (Costco "Banana Republic" cardigans, 2026-10-13)

Conversation 1400 (user 1528). She pasted a Costco link to a "Banana Republic Women's Button-Up Cardigan" and wanted it in Gray,
Navy and Tan, size M. The quote failed after ~5 min and the team had to quote it by hand (PR 570).

## What went wrong → fix
- [x] **Wrong store.** The Costco page was sent to Banana Republic's site (its title names the brand); BR's search found another
      cardigan and the agent refused it. A link the shopper pasted is now bought where she found it (`pastedPages` → wantedFromBox).
- [x] **Three colours became "Tan ×3".** The picker's option fixes were keyed by the link; the last (Tan) applied to all three and
      the cart merged them. Every fix of a page is kept; an item takes the one of its own colour.
- [x] **Price $4.** Costco's price line "$17.99" "$4" "OFF" was read as a was/now pair. An amount followed by "OFF" is a discount
      (engine variant_widget `onSavingsLine`).
- [ ] **Costco checkout needs a member login.** The quote reaches Costco's cart with her item, our ZIP and $17.99, but tax is only
      shown at checkout, so it stays unverified and the team quotes it (the shopper is told by WhatsApp). Possible follow-up: accept
      Costco's cart total with estimated tax.
- [ ] Typing several colours in one message ("los 3 colores en talla M") still asks her to pick one at a time on the card.

## Review
Live replay (lab): her link goes in as costco-com with Gray / Medium; Costco's cart shows exactly that item at $17.99, free shipping.
Tests: boxCheckout 61 pass (4 new for this case); engine reader suites pass (Costco fixture added).
