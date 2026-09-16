// What reaches the gallery from the WEB leg: the right product type, official shops first.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let pass = 0;
const ok = (n, c) => { assert.ok(c, n); console.log('  ✓ ' + n); pass++; };

// Extract the real source and let node strip the types, rather than regexing them away.
const src = readFileSync(new URL('./assistant.post.ts', import.meta.url), 'utf8');
const pick = (re) => { const m = src.match(re); if (!m) throw new Error('not found: ' + re); return m[0]; };
const mod = [
  pick(/const QUERY_STOP = new Set\([\s\S]*?\)\n/),
  pick(/const plainText = [^\n]*\n/),
  pick(/const MARKETPLACE_RE = [^\n]*\n/),
  pick(/const MARKETPLACE_SELLER_RE = [^\n]*\n/),
  pick(/export function askTerms\([\s\S]*?\n\}/),
  pick(/export function echoScore\([\s\S]*?\n\}/),
  pick(/export function onlyWhatTheyAsked\([\s\S]*?\n\}/),
  pick(/export function merchantTier\([\s\S]*?\n\}/),
  pick(/export function byMerchantTrust\([\s\S]*?\n\}/),
].join('\n');
const f = join(mkdtempSync(join(tmpdir(), 'webrows-')), 'm.ts');
writeFileSync(f, mod);
const { onlyWhatTheyAsked, byMerchantTrust, merchantTier } = await import(f);

// ── the wrong product type ────────────────────────────────────────────────────────────────
{
  const rows = [
    { title: "PUMA Club 5v5 Women's Low Top Sneakers", merchant: 'eBay' },
    { title: "Puma Women's Replicat Sneakers", merchant: 'Famous Footwear' },
    { title: 'PUMA Women\'s Training Shorts 5"', merchant: 'PUMA' },
    { title: "Puma Essentials Shorts Black", merchant: "Kohl's" },
  ];
  const kept = onlyWhatTheyAsked(rows, 'Puma shorts de mujer');
  ok('shorts survive a shorts ask', kept.length === 2 && kept.every((r) => /shorts/i.test(r.title)));
  ok('sneakers do not', !kept.some((r) => /sneaker/i.test(r.title)));
}
{
  const rows = [{ title: 'Random Thing', merchant: 'eBay' }, { title: 'Other Thing', merchant: 'Amazon' }];
  ok('nothing echoing keeps the rows rather than emptying the gallery', onlyWhatTheyAsked(rows, 'shorts').length === 2);
}
{
  // The brand alone is not enough — every row in a brand search carries the brand.
  const rows = [
    { title: 'PUMA Club Sneakers', merchant: 'eBay' },
    { title: "PUMA Women's Training Shorts", merchant: 'PUMA' },
  ];
  const kept = onlyWhatTheyAsked(rows, 'Puma shorts');
  ok('a row matching only the brand loses to one matching brand + type', kept.length === 1 && /Shorts/.test(kept[0].title));
}
ok('a query with only stopwords filters nothing', onlyWhatTheyAsked([{ title: 'A' }], 'the').length === 1);

// ── who is selling ────────────────────────────────────────────────────────────────────────
ok('a marketplace is last', merchantTier({ merchant: 'eBay', title: 'Alo Warrior Mat' }, 'alo yoga mat') === 2);
ok('a marketplace SELLER is last too', merchantTier({ merchant: 'Walmart - JBay Treasures', title: 'x' }) === 2);
ok("the brand's own shop is first", merchantTier({ merchant: 'Alo Yoga', title: 'Warrior Mat' }, 'alo yoga mat') === 0);
ok('an ordinary retailer sits between', merchantTier({ merchant: "Dick's Sporting Goods", title: 'Warrior Mat' }, 'alo yoga mat') === 1);
{
  const sorted = byMerchantTrust([
    { title: 'Alo Warrior Mat', merchant: 'eBay' },
    { title: 'Alo Warrior Mat', merchant: 'Nordstrom' },
    { title: 'Alo Warrior Mat', merchant: 'Alo Yoga' },
  ], 'alo yoga mat');
  ok('the brand leads, the marketplace trails', sorted[0].merchant === 'Alo Yoga' && sorted[2].merchant === 'eBay');
}
{
  const sorted = byMerchantTrust([{ title: 't', merchant: 'eBay' }, { title: 't', merchant: 'Etsy' }], 'x');
  ok('order inside a tier is preserved', sorted[0].merchant === 'eBay' && sorted[1].merchant === 'Etsy');
}
console.log(`\n${pass} checks passed`);
