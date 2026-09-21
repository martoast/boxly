// WHAT THE SHOPPER IS TOLD THE MOMENT THEIR REQUEST EXISTS.
//
// Both confirmation cards said "nuestro equipo de compras se pondrá en contacto contigo
// en breve". True, and it never said HOW — so the WhatsApp that actually finishes the
// purchase and carries the quote arrives from an unknown number, unannounced, and reads
// like spam. A request nobody answers is a sale that stalls (Alex, 2026-09-21).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
let pass = 0; const ok = (n, c) => { assert.ok(c, n); console.log('  ✓ ' + n); pass++; };

// Comments are not rendered, and the comment beside each card QUOTES the old wording to
// explain why it changed — so a raw grep finds the very string it is asserting is gone.
// (Second time this session a comment has shadowed a source-grep assertion.)
const stripComments = (html) => html.replace(/<!--[\s\S]*?-->/g, '');
const cards = {
  'the assisted card': stripComments(readFileSync(new URL('./AssistedPurchaseCard.vue', import.meta.url), 'utf8')
    .match(/<div v-if="result" key="done"[\s\S]*?<\/div>/)[0]),
  'the create_purchase_request card': stripComments(readFileSync(new URL('./ShoppingAssistant.vue', import.meta.url), 'utf8')
    .match(/tool-create_purchase_request[\s\S]*?Ver mis solicitudes[^<]*<\/NuxtLink>/)[0]),
};
for (const [what, html] of Object.entries(cards)) {
  ok(`${what} names the channel`, /por WhatsApp/.test(html));
  ok(`${what} says to watch for it`, /Mantente pendiente de tu WhatsApp/.test(html));
  ok(`${what} says what will arrive`, /cotizaci[oó]n/.test(html));
  ok(`${what} still says they owe nothing yet`, /No pagas nada todav[ií]a/.test(html));
  ok(`${what} still shows the real request number`, /request_number/.test(html));
  // The old wording promised contact without a channel — the thing that got ignored.
  ok(`${what} no longer just says "se pondrá en contacto"`, !/se pondr[aá] en contacto/.test(html));
}

// The model's own closing line has to agree with the card it just rendered.
const api = readFileSync(new URL('../server/api/assistant.post.ts', import.meta.url), 'utf8');
const finalize = api.match(/- FINALIZE ONLY WHEN THEY'RE DONE[^\n]*/)[0];
ok('the prompt tells it to point at WhatsApp', /WATCH THEIR WHATSAPP/.test(finalize));
ok('…and explains why the shopper would otherwise ignore it', /reads like spam/.test(finalize));
ok('…and forbids inventing a number or a time', /never invent a phone number/.test(finalize) && /Never promise a time of day/.test(finalize));
ok('it still must not claim the request is created', /must NEVER say the request is created/.test(finalize));
ok('…nor state the PR number itself', /must NEVER contain a PR number/.test(finalize));

console.log(`\n${pass} checks passed`);
