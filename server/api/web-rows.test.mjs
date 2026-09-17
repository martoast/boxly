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
  pick(/const SUPPRESSED_MARKETS: [\s\S]*?\n\]/),
  pick(/export function marketsAskedFor\([\s\S]*?\n\}/),
  pick(/export function rowMarket\([\s\S]*?\n\}/),
  pick(/export function dropMarkets\([\s\S]*?\n\}/),
].join('\n');
const f = join(mkdtempSync(join(tmpdir(), 'webrows-')), 'm.ts');
writeFileSync(f, mod);
const { onlyWhatTheyAsked, byMerchantTrust, merchantTier, marketsAskedFor, rowMarket, dropMarkets } = await import(f);

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

// ── RESALE MARKETPLACES ARE OPT-IN ──────────────────────────────────────────
//
// Ranking marketplaces last still left their listings on screen for shoppers who never
// asked ("I don't want us to be searching for eBay, that's kind of making it look bad",
// then "remove Etsy and Poshmark and Mercari too" — Alex, 2026-09-17).
{
  const rows = [
    { title: 'Alo Yoga Warrior Mat', merchant: 'Alo Yoga', source: 'google' },
    { title: 'Alo Warrior Mat 5mm', merchant: 'eBay', source: 'google' },        // Google reselling eBay
    { title: 'Alo Yoga Mat Purple', merchant: 'ThriftySeller', source: 'ebay' },  // the eBay engine
    { title: 'Alo Warrior Mat', merchant: 'eBay - matdealz', source: 'web' },     // a marketplace seller
    { title: 'Handmade Mat Strap', merchant: 'Etsy', source: 'google' },
    { title: 'Alo Mat used', merchant: 'Poshmark', source: 'google' },
    { title: 'Alo Mat', merchant: 'Mercari', source: 'google' },
    { title: 'Alo Yoga Mat', merchant: 'Nordstrom', source: 'google' },
    { title: 'Alo Mat', merchant: 'Shop', url: 'https://www.ebay.com/itm/12345' },
  ];
  const kept = dropMarkets(rows, 'alo yoga mat');
  ok('a plain search keeps none of the four', kept.every((r) => !rowMarket(r)));
  ok('…and keeps everything that is not one of them', kept.length === 2);

  ok('the eBay ENGINE is caught', rowMarket({ merchant: 'ThriftySeller', source: 'ebay' }) === 'ebay');
  ok('an eBay MERCHANT under another engine is caught', rowMarket({ merchant: 'eBay', source: 'google' }) === 'ebay');
  ok('an eBay SELLER row is caught', rowMarket({ merchant: 'eBay - matdealz' }) === 'ebay');
  ok('and a row that merely LINKS to ebay.com is caught', rowMarket({ merchant: 'Shop', url: 'https://www.ebay.com/itm/12345' }) === 'ebay');
  ok('Etsy is caught', rowMarket({ merchant: 'Etsy', source: 'google' }) === 'etsy');
  ok('Poshmark is caught', rowMarket({ merchant: 'Poshmark' }) === 'poshmark');
  ok('Mercari is caught', rowMarket({ merchant: 'Mercari' }) === 'mercari');
  ok('and so is a poshmark.com link', rowMarket({ merchant: 'Seller', url: 'https://poshmark.com/listing/9' }) === 'poshmark');

  // The advertised store card has to keep working.
  ok('asking for eBay keeps the eBay rows', dropMarkets(rows, 'Ayúdame a encontrar y comparar las mejores opciones en eBay.').filter((r) => rowMarket(r) === 'ebay').length === 4);
  ok('a store param naming eBay is consent too', marketsAskedFor(null, 'eBay').has('ebay'));
  ok('"búscalo en etsy" is consent for Etsy', marketsAskedFor('búscalo en etsy').has('etsy'));
  ok('but an ordinary ask consents to nothing', marketsAskedFor('alo yoga mat', null, undefined).size === 0);

  // CONSENT IS PER MARKETPLACE — naming one must not let the other three back in.
  {
    const etsyOnly = dropMarkets(rows, 'algo bonito de Etsy');
    ok('asking for Etsy shows Etsy', etsyOnly.some((r) => rowMarket(r) === 'etsy'));
    ok('…and still hides eBay, Poshmark and Mercari', !etsyOnly.some((r) => ['ebay', 'poshmark', 'mercari'].includes(rowMarket(r))));
  }

  // THE TRAP: productTerms() strips a retailer's own name out of the web query, so by the
  // time the words reach the engines the name is gone. Consent has to travel separately or
  // the store card silently suppresses its own results.
  const outgoing = 'yoga mat';            // what productTerms('mats en eBay', 'eBay') leaves
  ok('the stripped outgoing query alone would wrongly suppress', !marketsAskedFor(outgoing).has('ebay'));
  ok('so the raw ask + store is what is asked', marketsAskedFor(outgoing, 'eBay').has('ebay'));

  // The ones Alex did NOT name stay ranked-last rather than removed.
  for (const m of ['StockX', 'GOAT', 'Depop', 'Reverb', 'Temu'])
    ok(`${m} is ranked last, not removed`, !rowMarket({ merchant: m }) && merchantTier({ merchant: m }) === 2);
  ok('a Best Buy row is untouched', !rowMarket({ merchant: 'Best Buy', source: 'google' }));
}

// ── The wiring, not just the helper ─────────────────────────────────────────
ok('the fan-out drops them before they reach the gallery', /products: dropMarkets\(raw\.map/.test(src));
ok('Google Shopping rows go through it too', /products: dropMarkets\(raw\.map\(\(p\) => \(\{ \.\.\.toGalleryProduct\(p\), merchant/.test(src));
ok('a dropped engine is not reported as a source', /if \(engineMarket && !allowedMarkets\.has\(engineMarket\)\) continue/.test(src));
ok('the store card carries its consent past productTerms', /const marketAsk = \[rawQuery, store, asked\]/.test(src));
ok('the tool description no longer promises eBay', !/plus Amazon and eBay\)/.test(src));

console.log(`\n${pass} checks passed`);
