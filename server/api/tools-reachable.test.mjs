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
// LOOP_TOOLS filters the live-browse tools OUT of GALLERY_TOOLS at runtime, so mirror that here.
const browse = list('LIVE_BROWSE_TOOLS');
const loopExtra = [...loopLine.matchAll(/'([a-z_]+)'/g)].map((m) => m[1]).filter((t) => !browse.includes(t));
const offered = new Set([...gallery.filter((t) => !browse.includes(t)), ...nonGallery, ...loopExtra]);
// Boxly Lab's toolsets (2026-09-28): the live store gallery replaces the catalog/web gallery tools for its members.
const labGallery = list('LAB_GALLERY_TOOLS');
const labLoopLine = src.match(/const LAB_LOOP_TOOLS = [^\n]*/)[0];
const labOffered = new Set([...labGallery, ...nonGallery.filter((t) => t !== 'web_search'), ...[...labLoopLine.matchAll(/'([a-z_]+)'/g)].map((m) => m[1])]);

// Every tool declared in the handler.
const declared = [...src.matchAll(/^\s{6}([a-z_]+): tool\(\{/gm)].map((m) => m[1]);
ok('the handler declares tools', declared.length > 10);

// Deliberately withheld, each for a reason stated in the file.
const WITHHELD = new Set([
  'suggest_followups',          // chips are generated off-loop
  'browse_store', 'browse_stores', // engine needs a US exit IP, off since 2026-09-07
]);

const unreachable = declared.filter((t) => !offered.has(t) && !labOffered.has(t) && !WITHHELD.has(t));
ok(`no declared tool is unreachable (${unreachable.join(', ') || 'none'})`, unreachable.length === 0);

// The specific one that bit us.
ok('ask_to_narrow is offered', offered.has('ask_to_narrow'));
ok('and only BEFORE a gallery — after it, the shopper refines by looking', !nonGallery.includes('ask_to_narrow'));

// And the withheld ones really are withheld.
ok('suggest_followups is not offered to the model', !offered.has('suggest_followups'));
ok('live browsing stays off', !offered.has('browse_store') && !offered.has('browse_stores'));
// The live store gallery is the Lab member's, and only theirs.
ok('live_gallery is offered', labOffered.has('live_gallery'));
const CATALOG_OR_WEB = ['search_products', 'curate_products', 'show_collection', 'find_on_google', 'find_on_amazon', 'find_live_product', 'browse_store', 'browse_stores', 'show_products', 'web_search'];
ok('a Lab member is offered no catalog, SerpAPI or web tool', CATALOG_OR_WEB.every((t) => !labOffered.has(t)));
console.log(`\n${pass} checks passed`);
