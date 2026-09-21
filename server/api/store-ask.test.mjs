// WHAT A STORE CARD PROMISES, AND WHAT IT OPENS WITH.
//
// Gabriela Pérez tapped the DFYNE card on 2026-09-21. Its text was "Quiero ver
// promociones de articulos DFYNE para mujer", DFYNE has ZERO marked-down rows of 60,
// and so the first sentence of her first Boxly search was:
//
//   "Ahorita DFYNE no tiene descuentos activos marcados en la tienda, pero…"
//
// The model was following orders — step (2) of the promos rule scripts that exact
// sentence. The card promised promotions and the prompt supplied the regret. The card
// text is admin-managed (starter_prompts id 5, now "Muéstrame todo el catálogo de
// DFYNE para mujer"); these pin the two prompt rules behind it.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
let pass = 0; const ok = (n, c) => { assert.ok(c, n); console.log('  ✓ ' + n); pass++; };
const api = readFileSync(new URL('./assistant.post.ts', import.meta.url), 'utf8');

const storeAsk = api.match(/• A STORE with no item[^\n]*/)[0];
ok('seeing a store is not automatically a deals ask', /curate_products\(\{store\}\)/.test(storeAsk));
ok("'deals' is reserved for someone who asked about deals", /intent:'deals' ONLY when they actually asked about promos/.test(storeAsk));
ok("a plain \"catálogo\" ask browses instead", /"cat[aá]logo"[\s\S]{0,80}intent:'browse'/.test(storeAsk));

const promos = api.match(/\(2\) Read relaxed \/ relaxed_filters[^\n]*/)[0];
ok('the no-promos line is now conditional', /ONLY MENTION THAT IF THEY ASKED ABOUT PROMOS/.test(promos));
ok('a plain store ask says nothing about discounts', /say NOTHING about discounts/.test(promos));
ok('and the reason is written down', /worst possible first impression of that brand/.test(promos));
ok('the honest line survives for an actual promos ask', /no tiene promociones marcadas en nuestro cat[aá]logo/.test(promos));

const named = api.match(/- A NAMED STORE \*\*OR BRAND\*\*[^\n]*/)[0];
ok('the named-store rule agrees with both of them', /intent:'deals' when they asked about promos\/ofertas, intent:'browse' when they just want to see the store/.test(named));
ok('…and still forbids web_search for a named store', /never web_search/.test(named));


// ── AN ADVERTISED CARD MUST NEVER BE HIJACKED ───────────────────────────────
//
// The audience-narrowing gate shipped on 2026-09-16 and quietly broke two starter
// cards: "Quiero ver promociones actuales de tenis Adidas" and "Quiero ver promociones
// de Tenis New Balance" name a gendered category with nobody to wear it, so a tap
// answered with "¿para quién es?" instead of the store. Card texts are admin-managed,
// so the next one to contain "tenis", "ropa" or "sudadera" would break identically.
const vue = readFileSync(new URL('../../components/ShoppingAssistant.vue', import.meta.url), 'utf8');
ok('a card tap marks itself', /cardTapped\.value = true/.test(vue));
ok('…and rides on the request for exactly one turn', /fromStarterCard: true/.test(vue) && /function consumeCardTap\(\)[\s\S]*?cardTapped\.value = false/.test(vue));
ok('the server skips the narrowing gate for it', /const mustNarrow = !body\?\.fromStarterCard && audienceGap\(messages\)/.test(api));

// The gate itself must still fire for a typed ask — the flag is the only exemption.
ok('a typed vague ask is still narrowed', /function audienceGap\(messages: any\[\]\): boolean/.test(api));

console.log(`\n${pass} checks passed`);
