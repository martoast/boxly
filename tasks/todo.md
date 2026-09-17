# "Camisa polo" searched blind instead of asking who it was for

Alex searched *Camisa poll* and got a gallery led by a **girls'** Ralph Lauren
polo (2026-09-17). The man/woman toggle never appeared — the second time he has
reported this.

## Why it didn't ask
`ask_to_narrow` was reachable (fixed in 6763062), had a card, a prompt rule and
tests. Two OTHER prompt rules outranked it:

1. The narrowing rule ends *"if in doubt, search first and let them refine"*.
2. The long-term memory block said *"use their saved **gender**, sizes, favorite
   brands … automatically, and **never re-ask for anything already here**"* —
   absolute, and it names gender first. Alex spotted this one himself.

A rule with an escape hatch is a suggestion. This is the third prompt-only
guarantee in this file to lose (see prepareStep's web_search note and
show_shipment's forced variant read).

## Todo
- [x] `audienceGap()` — does this ask have an audience-shaped hole in it?
- [x] `prepareStep`: when it fires, `ask_to_narrow` is the ONLY tool + `toolChoice: 'required'`
- [x] `narrowBlock()` tells the model what the question is about; it still writes it
- [x] Memory stops answering "¿para quién es?" — a saved gender is the shopper's, not the recipient's
- [x] Tests run the real `audienceGap`, not a copy

## Review

**The decision moved from the prompt into code.** `audienceGap(messages)` returns
true only when the shopper named a category whose men's and women's versions are
different products (ropa, calzado, relojes, perfumes, disfraces) and never said
who it's for. It stays quiet for an ask that is already specific (a size, a
pasted link, a sentence over 14 words), for a category gendered by its own name
(vestido, falda, corbata, bikini), and for a second question in a row.

When it fires, `prepareStep` hands the model **one** tool and `toolChoice:
'required'`. It cannot search. It still writes the question and picks the
language — code decides *whether*, the model decides *how*.

**Memory keeps everything except the veto.** Sizes, brands, budget and interests
still apply silently and are still never re-asked. A saved gender no longer
answers "who is this for", because it is the *shopper's* gender and people buy
for other people — a man shopping for a polo may be shopping for his wife. It is
now used only to put his own option first in the list.

**The test runs the real `audienceGap`**, lifted out of the source, not a copy
beside it. 45 checks. It also caught two of my own bugs: `relojes?` is
"reloje"+s, which matches the plural and misses the singular (same in pantalón,
calcetín, bañador, tacón); and my new code comment began with the same words as
the prompt rule, so the existing prompt assertions silently re-anchored onto the
comment and passed against the wrong text. That match is now anchored on the
full heading.

**Not done:** removing long-term memory outright — Alex chose to keep it.
