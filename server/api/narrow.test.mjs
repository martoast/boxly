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

const prompt = api.match(/ONE QUESTION BEFORE A VAGUE SEARCH[^\n]*/)[0];
ok('the prompt caps it at one question', /NEVER more|never twice in a row/i.test(prompt));
ok('and tells it to browse rather than interrogate', /if in doubt, search first/i.test(prompt));
console.log(`\n${pass} checks passed`);
