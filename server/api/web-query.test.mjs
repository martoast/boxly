// What we actually send to a web engine.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
let pass = 0; const ok = (n, c) => { assert.ok(c, n); console.log('  ✓ ' + n); pass++; };

const src = readFileSync(new URL('./assistant.post.ts', import.meta.url), 'utf8');
const pick = (re) => src.match(re)[0];
const mod = [
  pick(/const INTENT_WORDS_RE = [^\n]*\n/),
  pick(/const RETAILER_RE = [^\n]*\n/),
  pick(/const productTerms = [\s\S]*?\n\}/),
  'export { productTerms }',
].join('\n');
const f = join(mkdtempSync(join(tmpdir(), 'webq-')), 'm.ts');
writeFileSync(f, mod);
const { productTerms } = await import(f);

// THE BUG: a brand is the product's identity and must survive into the web query.
ok('a brand stays in the query', /alo/i.test(productTerms('alo yoga mat', 'Alo')));
ok('and the rest of the ask stays with it', /yoga/i.test(productTerms('alo yoga mat', 'Alo')) && /mat/i.test(productTerms('alo yoga mat', 'Alo')));
ok('Nike survives too', /nike/i.test(productTerms('nike pegasus 41', 'Nike')));

// A RETAILER'S name still comes out — sending "Macy's" to Amazon returns gift cards.
ok("a retailer's name is stripped", !/macy/i.test(productTerms("promociones de Macy's", "Macy's")));
ok('Target is stripped', !/target/i.test(productTerms('deals target', 'Target')));
ok('Old Navy is stripped', !/navy/i.test(productTerms('old navy leggings', 'Old Navy')));
ok('and what remains is the product', productTerms('old navy leggings', 'Old Navy').trim() === 'leggings');

// Intent words never reach an engine.
ok('intent words are dropped', productTerms('promociones ofertas nike shorts', 'Nike').replace(/\s+/g, ' ').trim() === 'nike shorts');
ok('no store given leaves the query whole', /puma/i.test(productTerms('puma shorts de mujer')));
console.log(`\n${pass} checks passed`);
