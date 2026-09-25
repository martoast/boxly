// "Gym shark" is Gymshark. The search tools drop a store the shopper never named (the model invents
// them), and that guard used to match whole words only — so "Gym shark" lost the store and the search
// ran across every store for "gym apparel" (Alex, 2026-09-25, production conversation 796).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
let pass = 0; const ok = (n, c) => { assert.ok(c, n); console.log('  ✓ ' + n); pass++; };
const api = readFileSync(new URL('./assistant.post.ts', import.meta.url), 'utf8');
const src = [api.match(/const plain = \(s: string\) =>[^\n]*/)[0], api.match(/function shopperNamed\([\s\S]*?\n}\n/)[0]]
  .join('\n').replace(/: string \| undefined|: any\[\]|: boolean|: any|: string/g, '');
const shopperNamed = new Function(`${src}; return shopperNamed`)();
const said = (t) => [{ role: 'user', parts: [{ type: 'text', text: t }] }];

ok('"Gym shark" names Gymshark', shopperNamed('Gymshark', said('Gym shark')));
ok('"new balance" still names New Balance', shopperNamed('New Balance', said('tenis new balance')));
ok('"NewBalance" names New Balance', shopperNamed('New Balance', said('NewBalance 9060')));
ok('"old-navy" names Old Navy', shopperNamed('Old Navy', said('jeans de old-navy')));
ok('an unnamed store is still dropped', !shopperNamed('Gymshark', said('ropa para el gym')));
ok('a short name never matches inside other words', !shopperNamed('Alo', said('algo a lo loco')));
ok('Nike is not named by "nikes"-free text', !shopperNamed('Nike', said('tenis para correr')));
console.log(`\n${pass} checks passed`);
