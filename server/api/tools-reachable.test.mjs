// EVERY TOOL THE MODEL CAN SEE, AND NOTHING IT CANNOT.
//
// ask_to_narrow shipped dead: declared, described, card built, tests passing — and absent
// from both toolset lists, so the model was never offered it and went on searching
// "Halloween costume" blind (Alex, 2026-09-16). A tool that is not in a toolset does not
// exist, and nothing in its own tests can tell you that.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
let pass = 0; const ok = (n, c) => { assert.ok(c, n); console.log('  ✓ ' + n); pass++; };

const src = readFileSync(new URL('./assistant.post.ts', import.meta.url), 'utf8');
// Non-greedy to the FIRST closing bracket, so a single-line array does not swallow the next declaration.
const list = (name) => {
  const m = src.match(new RegExp(`const ${name} = \\[[\\s\\S]*?\\]`));
  if (!m) throw new Error('list not found: ' + name);
  return [...m[0].matchAll(/'([a-z_]+)'/g)].map((x) => x[1]);
};
// Tools the model is actually handed.
const gallery = list('GALLERY_TOOLS');
const nonGallery = list('NON_GALLERY_TOOLS');
const loopLine = src.match(/const LOOP_TOOLS = [^\n]*/)[0];
ok('the loop toolset is the gallery tools, the rest, and the narrowing question', /\[\.\.\.GALLERY_TOOLS, \.\.\.NON_GALLERY_TOOLS, 'ask_to_narrow'\]/.test(loopLine));
const offered = new Set([...gallery, ...nonGallery, 'ask_to_narrow']);

// Every tool declared in the handler.
const declared = [...src.matchAll(/^\s{6}([a-z_]+): tool\(\{/gm)].map((m) => m[1]);
ok('the handler declares tools', declared.length > 10);

// Deliberately withheld, each for a reason stated in the file.
const WITHHELD = new Set([
  'suggest_followups',          // chips are generated off-loop
]);

const unreachable = declared.filter((t) => !offered.has(t) && !WITHHELD.has(t));
ok(`no declared tool is unreachable (${unreachable.join(', ') || 'none'})`, unreachable.length === 0);
const undeclared = [...offered].filter((t) => !declared.includes(t));
ok(`every offered tool is declared (${undeclared.join(', ') || 'none'})`, undeclared.length === 0);

// The specific one that bit us.
ok('ask_to_narrow is offered', offered.has('ask_to_narrow'));
ok('and only BEFORE a gallery — after it, the shopper refines by looking', !nonGallery.includes('ask_to_narrow'));
ok('suggest_followups is not offered to the model', !offered.has('suggest_followups'));

// THE LIVE STORE GALLERY IS THE ONLY PRODUCT SEARCH (Alex, 2026-09-28): no catalog, SerpAPI or web tool exists.
ok('live_gallery is the product search', gallery.includes('live_gallery'));
ok('Finalizar is offered after the gallery', nonGallery.includes('finalize_order'));
const REMOVED = ['search_products', 'curate_products', 'show_collection', 'find_on_google', 'find_on_amazon', 'find_live_product', 'browse_store', 'browse_stores', 'show_products', 'web_search', 'extract_product', 'show_assisted_summary', 'finalize_lab_order'];
ok('no catalog, SerpAPI, web or assisted-purchase tool is declared or offered', REMOVED.every((t) => !declared.includes(t) && !offered.has(t)));
console.log(`\n${pass} checks passed`);
