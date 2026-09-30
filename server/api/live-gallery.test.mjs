// THE LIVE STORE GALLERY (Alex, 2026-09-28): a shopper's product request goes straight to the computer-use engine
// (live store browsers the shopper watches), never the catalog or SerpAPI — Boxly Lab's flow, now the product. These run the REAL
// live_gallery tool body (cut out of assistant.post.ts, with the network stubbed) and pin the wiring around it.
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs'
let pass = 0; const ok = (n, c) => { assert.ok(c, n); console.log('  ✓ ' + n); pass++ }

const api = readFileSync(new URL('./assistant.post.ts', import.meta.url), 'utf8')
const vue = readFileSync(new URL('../../components/ShoppingAssistant.vue', import.meta.url), 'utf8')
const cut = (re) => { const m = api.match(re); if (!m) throw new Error('missing ' + re); return m[0] }

// ── the tool itself, run for real ────────────────────────────────────────────
const block = cut(/      live_gallery: tool\(\{[\s\S]*?\n      \}\),\n/)
const tmp = new URL('./__live_gallery.tmp.ts', import.meta.url)
writeFileSync(tmp, [
  "import { resolveLiveStores, liveGalleryQuery } from '../../utils/liveGallery.ts'",
  // A chainable stand-in for zod: the schema is not what is under test here.
  'const chain: any = new Proxy(function () {}, { get: () => chain, apply: () => chain })',
  'const z: any = chain',
  'const tool = (x: any) => x',
  'export function make(ctx: any) {',
  '  const { token, messages, conversationId } = ctx',
  '  let liveCatalog = ctx.liveCatalog',
  '  let liveStoresCache: any = null',
  '  let galleryShown = false',
  '  let liveSearchQuiet = false',
  '  const authedNote = { ok: false, error: "not_authenticated" }',
  '  const REFUSAL = { refused: true }',
  '  const restrictedAsk = () => !!ctx.restricted',
  '  const liveStoreList = async () => ctx.liveCatalog',
  '  const callApi = async (path: string, opts: any) => { ctx.calls.push({ path, ...opts }); return ctx.reply }',
  '  const tools = {',
  block,
  '  }',
  '  return { tools, shown: () => galleryShown }',
  '}',
].join('\n'))
const { make } = await import(tmp.href)
unlinkSync(tmp)

const CATALOG = { stores: [{ id: 'gymshark', name: 'Gymshark' }, { id: 'on', name: 'On' }, { id: 'new-balance', name: 'New Balance' }, { id: 'nike', name: 'Nike' }], max: 3 }
const run = async (input, over = {}) => {
  const ctx = { token: 't0k', messages: [], conversationId: 42, liveCatalog: CATALOG, calls: [], reply: { id: 7, status: 'running', store_id: 'on' }, ...over }
  const h = make(ctx)
  const out = await h.tools.live_gallery.execute(input)
  return { out, ctx, shown: h.shown() }
}

{
  const { out, ctx, shown } = await run({ query: ' running shoes ', stores: ['On', 'New Balance', 'nike', 'Hoka'] })
  ok('one engine session carries every store the engine can open (≤ its cap), in order', ctx.calls.length === 1 && JSON.stringify(ctx.calls[0].body.store_ids) === '["on","new-balance","nike"]')
  ok('…to the API create, conversation-bound, the query as the objective', ctx.calls[0].path === '/live-shopping/sessions' && ctx.calls[0].method === 'POST' && ctx.calls[0].token === 't0k' && ctx.calls[0].body.conversation_id === 42 && ctx.calls[0].body.objective === 'running shoes' && ctx.calls[0].body.store_id === 'on')
  ok('the live card rides on the answer at once (the session shape the chat renders)', out.ok === true && out.live_session.id === 7 && out.live_session.store_name === 'On · New Balance · Nike' && /Buscando "running shoes"/.test(out.live_session.note))
  ok('a store the engine cannot open is named back, never guessed', JSON.stringify(out.skipped) === '["Hoka"]')
  ok('the model writes nothing (the chat already spoke) — or one line naming a store it could not open — and invents nothing', (out.skipped ? /ONE short line/.test(out.note) : /Write NO text/.test(out.note)) && /Do NOT list, invent/.test(out.note))
  ok('the turn counts as its gallery (no second gallery tool after it)', shown === true)
}
{
  const { ctx } = await run({ query: 'leggings', stores: ['gymshark'] })
  ok('a single store sends no store_ids (the byte-identical one-store create)', !('store_ids' in ctx.calls[0].body) && ctx.calls[0].body.store_id === 'gymshark')
}
{
  const { out, ctx, shown } = await run({ query: 'leggings', stores: ['Lululemon'] })
  ok('no openable store: nothing is created and the model gets the list to offer', ctx.calls.length === 0 && out.error === 'unknown_store' && /Gymshark, On, New Balance, Nike/.test(out.note) && shown === false)
}
{
  const { out } = await run({ query: 'x x', stores: ['On'] }, { reply: { ok: false, status: 409, message: 'running' } })
  const empty = await run({ query: ' x ', stores: ['On'] })
  ok('no words to search: nothing starts, the model asks instead', empty.out.error === 'empty_query' && empty.ctx.calls.length === 0)
  ok('a browser still running for this shopper is said honestly', out.error === 'live_busy')
  const down = await run({ query: 'x x', stores: ['On'] }, { reply: { ok: false, status: 503, code: 'engine_unavailable' } })
  ok('an engine that is down is said honestly', down.out.error === 'live_unavailable' && down.shown === false)
  const off = await run({ query: 'x x', stores: ['On'] }, { liveCatalog: null })
  ok('no engine store list: nothing is guessed', off.out.error === 'live_unavailable' && off.ctx.calls.length === 0)
}
{
  const guest = await run({ query: 'leggings', stores: ['Gymshark'] }, { token: undefined })
  ok('a signed-out visitor starts nothing and is sent to sign in', guest.out.error === 'not_authenticated' && /create_account/.test(guest.out.note) && guest.ctx.calls.length === 0)
  const noChat = await run({ query: 'leggings', stores: ['Gymshark'] }, { conversationId: undefined })
  ok('an unsaved chat (nowhere for the gallery to land) starts nothing', noChat.out.error === 'no_conversation' && noChat.ctx.calls.length === 0)
  const restricted = await run({ query: 'vape', stores: ['Gymshark'] }, { restricted: true })
  ok('a restricted ask is refused before any browser', restricted.out.refused === true && restricted.ctx.calls.length === 0)
}

// ── the wiring around it ─────────────────────────────────────────────────────
const prep = cut(/prepareStep: \(\{ steps \}: any\) => \{[\s\S]*?\n    \},\n/)
ok('the narrowing question still comes first', prep.indexOf('mustNarrow') < prep.indexOf('bareStore && '))
ok('a bare store name is answered with "¿qué buscas?" first', /bareStore && !\(steps \|\| \[\]\)\.length\) return \{ activeTools: \['ask_to_narrow'\], toolChoice: 'required' \}/.test(prep))
ok('the live gallery is the loop\'s product search', /const GALLERY_TOOLS = \['live_gallery', 'show_saved_products'\]/.test(api) && /activeTools: galleryAttempts >= 2 \? NON_GALLERY_TOOLS : LOOP_TOOLS/.test(prep))
ok('two live galleries per turn at most, like every gallery tool', /filter\(\(c: any\) => GALLERY_TOOLS\.includes\(c\.toolName\)\)/.test(prep))
ok('the prompt names the engine\'s own stores', /LIVE STORES \(the only stores live_gallery can open[\s\S]{0,400}\$\{liveCatalog\.stores\.map/.test(api) && /narrowBlock\(mustNarrow\), liveBlock, cartEventBlock/.test(api))
ok('a signed-out visitor is sent to sign in for any product request', /THIS VISITOR IS NOT SIGNED IN\. For ANY product request or order, call create_account/.test(api))
ok('history: a live-results part, a picker card (and an old catalog gallery) is replayed as text before the tool-part filters run', /stripIncompleteToolCalls\(legacyToolsAsText\(pickerCardsAsText\(liveResultsAsText\(await pdfPartsToText\(messages\)\), registryId\), LEGACY_GALLERY_TOOLS, LEGACY_TOOLS, registryId\)\)/.test(api))

ok('the chat renders a live-results part as its normal gallery', /const GALLERY_TOOLS = \['tool-live_results'/.test(vue))
ok('the live gallery\'s own spinner is its loader (no second typing indicator)', /const TOOLS_WITH_LOADER = new Set\(\[\s*'tool-live_gallery'/.test(vue))
ok('history and fresh results both read as gallery rows (price, store_id)', /parts: withLiveRows\(/.test(vue))
ok('the live card goes up for this page\'s own live_gallery answer only (never an old one from history)', /\/\^\\d\+\$\/\.test\(String\(m\.id\)\)/.test(vue) && /p\.type === 'tool-live_gallery' && p\.state === 'output-available' && p\.output\?\.live_session\?\.id/.test(vue))
ok('when that browser ends, its gallery is fetched into the chat and registered', /if \(ended && galleryLiveIds\.has\(ended\.id\)\) \{\s*galleryLiveIds\.delete\(ended\.id\)/.test(vue) && /fetchLiveGallery\(ended\.id\)\.finally\(/.test(vue) && /registerProducts\(part\.output\.products\)/.test(vue))
ok('a finished SEARCH browser card goes once its results are in (cart/checkout cards stay)', /fetchLiveGallery\(ended\.id\)\.finally\(\(\) => \{[\s\S]{0,400}liveShown\.value = next[\s\S]{0,80}if \(!next\) liveOpen\.value = false/.test(vue))
ok('the session read first reconciles a terminal whose webhook has not landed', /await \$customFetch\(`\/live-shopping\/sessions\/\$\{sessionId\}`\)/.test(vue))
// The first word is immediate (Alex, 2026-09-28): the chat draws "¡Va! Déjame revisar … por ti" from the call itself,
// and a search that started for every store asked ends the turn without a second line from the model.
{
  const chat = readFileSync(new URL('../../components/ShoppingAssistant.vue', import.meta.url), 'utf8')
  ok('the chat shows the assistant\'s first line the moment the search starts', /tool-live_gallery' && \(part\.state === 'input-streaming'/.test(chat) && /Déjame revisar \$\{names\} por ti/.test(chat))
  ok('the turn ends right after a search that started quietly', /\(\) => liveSearchQuiet,/.test(api) && /liveSearchQuiet = !unknown\.length/.test(api))
  ok('the prompt tells the model not to repeat it', /write NO text of your own before or after it/.test(api))
}
console.log(`\n${pass} checks passed`)
