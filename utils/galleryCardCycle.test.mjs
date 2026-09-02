// Focused regression for the H3 key-audit hazard: index-addressed hover-cycle
// state in ProductGallery could transfer to a DIFFERENT product when the store
// tab filters `visible` and indices shift. Everything here drives the pure
// module the component now consumes.
//
//   node --experimental-strip-types utils/galleryCardCycle.test.mjs
import assert from 'node:assert/strict'
import { productCardKeys, cycleSrc, startCycleState, stepCycleState, syncCycleState, IDLE_CYCLE } from './galleryCardCycle.ts'

const storeA = [
  { url: 'https://a.example/p1', store: 'A', title: 'A1', image: 'a1-hero', images: ['a1-hero', 'a1-b'] },
  { url: 'https://a.example/p2', store: 'A', title: 'A2', image: 'a2-hero', images: ['a2-hero'] },
  { url: 'https://a.example/p3', store: 'A', title: 'A3', image: 'a3-hero', images: ['a3-hero', 'a3-b', 'a3-c'] },
]
const storeB = [
  { url: 'https://b.example/p1', store: 'B', title: 'B1', image: 'b1-hero', images: ['b1-hero', 'b1-b'] },
  { url: 'https://b.example/p2', store: 'B', title: 'B2', image: 'b2-hero', images: ['b2-hero', 'b2-b'] },
]

// ── identity keys ────────────────────────────────────────────────────────────
{
  const keys = productCardKeys(storeA)
  assert.deepEqual(keys, storeA.map((p) => JSON.stringify(['url', p.url, 0])), 'URL is the identity, tuple-encoded')
  assert.deepEqual(productCardKeys(storeA), keys, 'stable across identical lists')
  assert.equal(new Set(keys).size, keys.length)

  const dupes = productCardKeys([
    { url: 'https://x/p', title: 'first' },
    { url: 'https://x/p', title: 'second' },
    { title: 'NoUrl', store: 'S' },
    { title: 'NoUrl', store: 'S' },
    { url: '   ' },
  ])
  assert.deepEqual(dupes, [
    JSON.stringify(['url', 'https://x/p', 0]),
    JSON.stringify(['url', 'https://x/p', 1]),
    JSON.stringify(['st', 'S', 'NoUrl', 0]),
    JSON.stringify(['st', 'S', 'NoUrl', 1]),
    JSON.stringify(['st', '', '', 0]),
  ], 'duplicates and missing URLs get deterministic occurrence-numbered tuples')
  assert.equal(new Set(dupes).size, dupes.length, 'keys are unique within one list')
}

// ── adversarial collisions the old concatenated encoding permitted ───────────
{
  // A LITERAL url ending "#1" vs a duplicate's occurrence numbering: with
  // string suffixing, entry 2's key ("https://x/p" + "#1") equalled entry 3's
  // literal URL. Tuple encoding keeps them distinct.
  const hash = productCardKeys([
    { url: 'https://x/p' },
    { url: 'https://x/p' },
    { url: 'https://x/p#1' },
  ])
  assert.equal(new Set(hash).size, 3, 'literal #1 URL cannot collide with an occurrence suffix')

  // store|title delimiter smuggling: 'S|No'+'Url' vs 'S'+'No|Url' were one
  // string under concatenation; they are distinct tuple fields now.
  const delim = productCardKeys([
    { store: 'S|No', title: 'Url' },
    { store: 'S', title: 'No|Url' },
  ])
  assert.equal(new Set(delim).size, 2, 'delimiter characters in store/title cannot merge identities')

  // Mixed adversarial batch: every key unique, always.
  const batch = productCardKeys([
    { url: 'https://x/p' }, { url: 'https://x/p' }, { url: 'https://x/p#1' },
    { store: 'S|No', title: 'Url' }, { store: 'S', title: 'No|Url' },
    {}, {}, { url: '  ' }, { title: 'NoUrl', store: 'S' }, { title: 'NoUrl', store: 'S' },
  ])
  assert.equal(new Set(batch).size, batch.length, 'Set size equals list length for the adversarial batch')
  assert.deepEqual(productCardKeys([
    { url: 'https://x/p' }, { url: 'https://x/p' }, { url: 'https://x/p#1' },
    { store: 'S|No', title: 'Url' }, { store: 'S', title: 'No|Url' },
    {}, {}, { url: '  ' }, { title: 'NoUrl', store: 'S' }, { title: 'NoUrl', store: 'S' },
  ]), batch, 'adversarial batch is deterministic')
}

// ── THE regression: hover/cycle state cannot transfer across a tab switch ────
{
  const keysA = productCardKeys(storeA)
  // Hover card index 2 (A3, 3 images) and let it cycle twice.
  let s = startCycleState(keysA[2], storeA[2].images)
  assert.ok(s, 'A3 has >1 image, cycling starts')
  s = stepCycleState(s, storeA[2].images.length)
  s = stepCycleState(s, storeA[2].images.length)
  assert.equal(cycleSrc(storeA[2], keysA[2], s), 'a3-c', 'hovered card is showing its own cycled frame')

  // Switch the store tab: `visible` becomes store B; index 2's occupant changes.
  const keysB = productCardKeys(storeB)

  // 1) Even BEFORE any watcher runs, a stale A3 state cannot leak into B's
  //    cards: identity mismatch pins every B card to its own hero image.
  for (let i = 0; i < storeB.length; i++) {
    assert.equal(cycleSrc(storeB[i], keysB[i], s), storeB[i].image, `B card ${i} inherits NOTHING from the stale cycle state`)
  }

  // 2) The sync step then resets the vanished identity to idle.
  const synced = syncCycleState(s, keysB)
  assert.deepEqual(synced, IDLE_CYCLE, 'identity that left the list resets to idle')
  assert.notEqual(synced, s, 'reset is observable so the component stops its timer')
}

// ── same identity surviving a filter change keeps cycling (same product) ─────
{
  const merged = [...storeA, ...storeB]
  const keysAll = productCardKeys(merged)
  const a3Key = productCardKeys(storeA)[2]
  assert.equal(a3Key, keysAll[2], 'first occurrence keeps the same key across filter changes')
  let s = startCycleState(a3Key, storeA[2].images)
  s = stepCycleState(s, 3)
  const afterFilter = syncCycleState(s, productCardKeys(storeA)) // narrowed view still contains A3
  assert.equal(afterFilter, s, 'same product still visible ⇒ cycling continues (not a transfer)')
  assert.equal(cycleSrc(storeA[2], a3Key, afterFilter), 'a3-b', 'and it still shows ITS OWN frame')
  assert.equal(keysAll.includes(a3Key), true)
}

// ── guards ───────────────────────────────────────────────────────────────────
{
  assert.equal(startCycleState('k', ['only-one']), null, 'single image never cycles')
  assert.equal(startCycleState('k', []), null)
  assert.equal(stepCycleState(IDLE_CYCLE, 5), IDLE_CYCLE, 'idle never advances')
  const s = startCycleState('k', ['x', 'y'])
  assert.deepEqual(stepCycleState(stepCycleState(s, 2), 2), { key: 'k', idx: 0 }, 'wraps modulo image count')
  assert.equal(syncCycleState(IDLE_CYCLE, ['a']), IDLE_CYCLE, 'idle sync is a no-op')
  assert.equal(cycleSrc({ image: null, images: [] }, 'k', IDLE_CYCLE), null, 'imageless card renders its fallback path')
}

console.log('PASS — gallery card identity keys and no-transfer cycle state')
