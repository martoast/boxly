# A real shopper's bad AI-search experience (eBay Beatles vinyls, 2026-10-12)

Alex: "this customer … tried using the AI search and he had a terrible experience, we need to take a look and fix it."
Conversations 1391, 1392, 1393 (user 1525). He wanted two Beatles 7" records from one eBay seller. It took ~1 hour, two Finalizar
taps, and he saw items added twice and a failure message in a chat he never opened.

## What went wrong → fix
- [ ] **Failure posted in another chat.** The first quote's failure ("No pude cotizar eBay …") was saved into a new conversation
      (1393) instead of the order's chat (1392). Post Finalizar results to the order's own conversation.
- [ ] **eBay app share links rejected.** `https://ebay.io/m/…` was "not a store the agent can buy from". Expand known short links
      (ebay.io, a.co, amzn.to, …) to the product page before deciding.
- [ ] **Link-less items in the box.** Items from his screenshots went into the box with no link; Finalizar refused them and later
      adds looked like duplicates. A store item the agent must buy needs its link: don't keep it link-less in the box.
- [ ] **Context lost.** "Que lo compre boxly" right after the screenshots → a generic "what do you want to buy?". Check what the
      model sees of earlier turns with images.
- [ ] **eBay full sign-in page.** First checkout: "Go to checkout" opened eBay's full "Sign in or Register" page (no guest), the
      agent reported blocked. The second time eBay showed a dialog with "Check out as guest instead". Teach the way around it.

## Review
(after)
