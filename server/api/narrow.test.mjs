// The narrowing card: a question the shopper answers by TAPPING.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
let pass = 0; const ok = (n, c) => { assert.ok(c, n); console.log('  ✓ ' + n); pass++; };

const api = readFileSync(new URL('./assistant.post.ts', import.meta.url), 'utf8');
const vue = readFileSync(new URL('../../components/ShoppingAssistant.vue', import.meta.url), 'utf8');
const tool = api.match(/ask_to_narrow: tool\(\{[\s\S]*?\n      \}\),/)[0];

ok('it takes a question', /question: z\.string\(\)/.test(tool));
ok('and between two and four answers', /\.min\(2\)\.max\(4\)/.test(tool));
ok('it fetches nothing — the card IS the answer', /execute: async \(\{ question, options \}[^)]*\) => \(\{ question, options \}\)/.test(tool));
ok('the description forbids searching in the same turn', /do NOT call a product tool in the same turn/i.test(tool));
ok("and forbids size/colour, which the picker owns", /never use it for size or colour/i.test(tool));
ok('and forbids asking a specific ask', /must go straight to the search/i.test(tool));

const card = vue.match(/tool-ask_to_narrow[\s\S]*?<\/div>\s*<\/div>/)[0];
ok('the card renders the question', /part\.output\.question/.test(card));
ok('each option is a BUTTON, not text to retype', /<button[\s\S]*v-for="\(o, oi\) in part\.output\.options"/.test(card));
ok('tapping one sends it as the answer', /@click="sendFollowup\(o\)"/.test(card));
ok('it is disabled mid-turn', /:disabled="isBusy"/.test(card));
ok('it only renders once the tool answered', /part\.state === 'output-available'/.test(card));

// Anchored on the full rule heading — a code COMMENT that began the same way shadowed
// this match once already and the assertions silently moved to the wrong line.
const prompt = api.match(/ONE QUESTION BEFORE A VAGUE SEARCH, NEVER MORE\.[^\n]*/)[0];
ok('the prompt caps it at one question', /NEVER more|never twice in a row/i.test(prompt));
ok('and tells it to browse rather than interrogate', /if in doubt, search first/i.test(prompt));

// ── WHETHER IT ASKS AT ALL IS NOT THE MODEL'S CALL ───────────────────────────
//
// "Camisa polo" searched blind and led with a girls' polo (Alex, 2026-09-17), with
// the tool reachable and the prompt rule in place. Two other rules outranked it, so
// the decision moved into code. These run the real audienceGap().
import { readFileSync as rf, writeFileSync as wf, unlinkSync } from 'node:fs';
const cut = (re) => { const m = api.match(re); if (!m) throw new Error('missing ' + re); return m[0]; };
const tmp = new URL('./__narrow.tmp.ts', import.meta.url);
wf(tmp, [
  'const plainText = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "")',
  cut(/function lastUserText\(messages: any\[\]\): string \{[\s\S]*?\n\}/),
  ...['RE_AUDIENCE', 'RE_GENDERED_CATEGORY', 'RE_SELF_GENDERED'].map((n) => cut(new RegExp(`const ${n} = [^\\n]*`))),
  cut(/function askedToNarrowLast\(messages: any\[\]\): boolean \{[\s\S]*?\n\}/),
  cut(/function audienceGap\(messages: any\[\]\): boolean \{[\s\S]*?\n\}/),
  'export { audienceGap }',
].join('\n'));
let audienceGap;
try { ({ audienceGap } = await import(tmp.href)); } finally { unlinkSync(tmp); }
const said = (...texts) => texts.map((t, i) => ({ role: i % 2 ? 'assistant' : 'user', parts: [{ type: 'text', text: t }] }));
const asks = (t) => audienceGap(said(t));

// The screenshot.
ok('"Camisa poll" has an audience-shaped hole in it', asks('Camisa poll'));
ok('so does "camisa polo"', asks('camisa polo'));
for (const q of ['unos tenis', 'sudadera Hot Topic', 'busco un disfraz de Batman', 'perfume', 'un reloj bonito', 'shorts de mezclilla', 'winter coat', 'ropa deportiva'])
  ok(`"${q}" is asked about`, asks(q));

// Already answered — never ask twice.
for (const q of ['camisa polo para hombre', 'tenis de mujer', 'sudadera para niño', "men's polo shirt", 'disfraz de Batman para niña', 'perfume unisex'])
  ok(`"${q}" already says who`, !asks(q));

// Gendered by the word itself.
for (const q of ['un vestido negro', 'una falda larga', 'corbata de seda', 'bikini'])
  ok(`"${q}" needs no question`, !asks(q));

// Specific enough to shop, or not a search at all.
for (const q of ['tenis Nike Pegasus 41 talla 9', 'https://www.gap.com/browse/product.do?pid=455069002',
  'agrégalo a mi carrito', '¿cuánto cuesta el envío?', 'quiero una camisa polo azul marino de algodón pima, manga corta, de Ralph Lauren o Hugo Boss, con descuento'])
  ok(`"${q.slice(0, 34)}…" goes straight through`, !asks(q));

// Never twice in a row.
{
  const after = [
    { role: 'user', parts: [{ type: 'text', text: 'camisa polo' }] },
    { role: 'assistant', parts: [{ type: 'tool-ask_to_narrow', state: 'output-available', output: { question: '¿Para quién es?', options: ['Para hombre'] } }] },
    { role: 'user', parts: [{ type: 'text', text: 'unos tenis' }] },
  ];
  ok('a second question in a row is not asked', !audienceGap(after));
  ok('but a later turn can ask again', audienceGap([...after, { role: 'assistant', parts: [{ type: 'text', text: 'Aquí tienes 👇' }] }, { role: 'user', parts: [{ type: 'text', text: 'ahora una sudadera' }] }]));
}

// ── The gate itself ─────────────────────────────────────────────────────────
const step = api.match(/prepareStep: \(\{ steps \}: any\) => \{[\s\S]*?\n    \},/)[0];
ok('when it fires, ask_to_narrow is the only tool on offer', /mustNarrow && !\(steps \|\| \[\]\)\.length\) return \{ activeTools: \['ask_to_narrow'\]/.test(step));
ok('and calling it is mandatory, not encouraged', /toolChoice: 'required'/.test(step));

// ── Memory must not answer it on the shopper's behalf ───────────────────────
const mem = api.match(/LONG-TERM MEMORY FOR THIS SHOPPER \(persists[^`]*/)[0];
ok('memory no longer claims the saved gender', !/use their saved gender/.test(mem));
ok('and says a saved gender is the shopper\'s, not the recipient\'s', /never answers .{0,4}¿para qui[eé]n es\?/i.test(mem));
ok('it may still order the options', /only to ORDER the options/.test(mem));

console.log(`\n${pass} checks passed`);
