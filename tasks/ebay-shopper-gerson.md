# A real shopper's bad AI-search experience (eBay Beatles vinyls, 2026-10-12)

Alex: "this customer … tried using the AI search and he had a terrible experience, we need to take a look and fix it."
Conversations 1391, 1392, 1393 (user 1525). He wanted two Beatles 7" records from one eBay seller. It took ~1 hour, two Finalizar
taps, and he saw items added twice and a failure message in a chat he never opened.

## What went wrong → fix
- [x] **Failure posted in another chat.** The first quote's failure ("No pude cotizar eBay …") was saved into a new conversation
      (1393) instead of the order's chat (1392). Post Finalizar results to the order's own conversation.
- [x] **eBay app share links rejected.** `https://ebay.io/m/…` was "not a store the agent can buy from". Expand known short links
      (ebay.io, a.co, amzn.to, …) to the product page before deciding.
- [x] **Link-less items in the box.** Items from his screenshots went into the box with no link; Finalizar refused them and later
      adds looked like duplicates. A store item the agent must buy needs its link: don't keep it link-less in the box.
- [x] **Context lost.** "Que lo compre boxly" right after the screenshots → a generic "what do you want to buy?". Check what the
      model sees of earlier turns with images.
- [~] **eBay full sign-in page.** First checkout: "Go to checkout" opened eBay's full "Sign in or Register" page (no guest), the
      agent reported blocked. The second time eBay showed a dialog with "Check out as guest instead". Teach the way around it.

## Review
- **Short links** (`utils/shortLinks.ts`): ebay.io / a.co / amzn.to are expanded server-side before the turn. Live replay: his two
  ebay.io links read as the two records and went in the box in ~60 s.
- **Order lines in the order's chat**: CheckoutCard passes the PR's conversation_id; ShoppingAssistant saves store lines and the
  invoice there, and shows them only when that chat is on screen.
- **Prompt**: eBay was still named as a store we can't buy from (it is live) — removed; rule ②c for screenshots of listings; a
  link-less store item gets a NO LINK note (find it or ask for its link).
- **Context after screenshots**: images are saved as "📎 (imagen)" markers, so only the AI's own words about them survive; ②c
  tells it "sí / que lo compre Boxly" means those products.
- **eBay sign-in page** (engine): supervisor steps (cart → Go to checkout → Check out as guest instead) + hints. Replays reached
  the guest checkout, then eBay answered "Something went wrong" (likely our many test sessions today). Not yet verified end to end.

