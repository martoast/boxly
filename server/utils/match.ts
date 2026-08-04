/**
 * Is this listing the SAME thing, or merely a similar one?
 *
 * Stage 5 of tasks/product-index.md, and the distinction Phia states plainly:
 * it surfaces "better-priced exact matches AND similar alternatives". We put
 * both in one list and let a discount badge speak for either — which is how an
 * orange FreeSip Sway ended up offered to someone looking at a blue 24oz, at a
 * price that read like a deal on the thing they were actually viewing.
 *
 * The fix is NOT to filter the similar ones out. A different colourway at a
 * lower price is a real find for a shopper still deciding whether to buy at all
 * — that is why the variant was scoped out of the retail search (see the note in
 * panel.post.ts). It is to LABEL them, so the shopper knows which is which.
 *
 * Deliberately conservative: anything we cannot positively confirm is the same
 * product is called "similar". An exact-match claim is a promise, and the panel
 * only has the words in a title to keep it with.
 */

/** Words worth matching on — drops "the", "with", and other filler. */
function tokens(s: string): string[] {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1)
}

/** Model designations — "574", "990v4", "u20107pt". The distinguishing part. */
function modelTokens(s: string): string[] {
  return tokens(s).filter((w) => /\d/.test(w) && w.length >= 2)
}

/**
 * Size words, which are NOT variant identity.
 *
 * "24oz" distinguishes one FreeSip from another and must match. A shoe size
 * ("size 9", "8.5") does not: every listing of the same shoe carries a
 * different one, and requiring it would mean nothing is ever an exact match.
 */
const SIZE_NOISE = /^(size|sz|us|uk|eu|men|mens|women|womens|kids|youth|d|m|w|xl|xxl|lg|sm|med)$/

/**
 * Filler inside a colourway name.
 *
 * "Out of the Blue" is listed by real sellers as "Out Of Blue" — same bottle,
 * one dropped article. Requiring every word turned a genuine exact match into a
 * "similar", so the joining words don't count. The distinctive ones ("out",
 * "blue") still all have to be there.
 */
const FILLER = /^(the|of|and|with|in|a|an|for)$/

export type MatchLevel = 'exact' | 'similar'

/**
 * Classify one listing against the product on the page.
 *
 * `exact` requires BOTH:
 *   - every model designation from the page title appears in the listing, and
 *   - every meaningful variant word the shopper selected appears too.
 *
 * When the page gives us neither — no model number and no variant, which is a
 * plain apparel title — there is nothing to be confident with, so everything is
 * "similar" and the panel simply won't draw the distinction.
 */
export function matchLevel(
  page: { title?: string | null; brand?: string | null; variant?: string | null },
  listingTitle: string,
): MatchLevel {
  const want = modelTokens(page.title || '')
  const variantWords = tokens(page.variant || '').filter((w) => !SIZE_NOISE.test(w) && !FILLER.test(w))

  // Nothing distinctive to check against — don't claim exactness we can't back.
  if (!want.length && !variantWords.length) return 'similar'

  const got = new Set(tokens(listingTitle))

  if (want.length && !want.every((w) => got.has(w))) return 'similar'
  if (variantWords.length && !variantWords.every((w) => got.has(w))) return 'similar'

  return 'exact'
}

/**
 * Does this set contain BOTH kinds?
 *
 * The panel only draws the divider when it separates something. A heading over
 * an empty group, or over the entire list, is noise — and this panel is already
 * fighting a word budget.
 */
export function worthSplitting(levels: MatchLevel[]): boolean {
  return levels.includes('exact') && levels.includes('similar')
}
