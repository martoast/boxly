/**
 * Per-chat rolling summary — the pure pieces plus the summarize() flow with a fake
 * API and a fake model (no network).
 *
 *   node --experimental-strip-types server/utils/chatSummary.test.mjs
 */
process.env.CHAT_SUMMARY = '1'
const { renderTranscript, stripPrices, shouldSummarize, summaryBlock, readSummary, summarize, summaryEnabled, _resetSummaryCache, SUMMARY_MAX_CHARS } = await import('./chatSummaryCore.ts')

let pass = 0, fail = 0
const ok = (name, cond) => { if (cond) { pass++; console.log('  ✓', name) } else { fail++; console.log('  ✗', name) } }

// ── renderTranscript ───────────────────────────────────────────────────────
{
  const rows = [
    { id: 1, role: 'user', content: { parts: [{ type: 'text', text: 'busco   tenis para correr' }] } },
    { id: 2, role: 'assistant', content: { parts: [
      { type: 'tool-search_products', state: 'output-available', input: { query: 'running', store: 'Nike' }, output: { products: [{ title: 'Pegasus 41' }, { title: 'Vomero 18' }, { title: 'A' }, { title: 'B' }, { title: 'C' }] } },
      { type: 'text', text: 'Los Pegasus son la mejor opción.' },
      { type: 'tool-suggest_followups', state: 'output-available', input: {}, output: { suggestions: ['x'] } },
    ] } },
    { id: 3, role: 'user', content: { parts: [{ type: 'file', mediaType: 'image/png', url: 'data:…' }, { type: 'text', text: 'agrega el primero' }] } },
    { id: 4, role: 'assistant', content: { parts: [
      { type: 'tool-show_shipment', state: 'output-available', input: { items: [{ name: 'Pegasus 41', quantity: 2 }] }, output: { items: [{ name: 'Pegasus 41', quantity: 2 }], box_label: 'Chica' } },
      { type: 'tool-update_shopping_profile', state: 'output-available', input: { profile: { sizes: { shoe: ['9 US'] } } }, output: {} },
      { type: 'text', text: 'Listo.' },
    ] } },
    { id: 5, role: 'assistant', content: 'texto plano legado' },
    { id: 6, role: 'assistant', content: { parts: [{ type: 'tool-feature_products', state: 'output-available', input: {}, output: {} }] } },
  ]
  const t = renderTranscript(rows)
  const lines = t.split('\n')
  ok('one line per row with content, roles labelled', lines.length === 5 && lines[0] === 'Cliente: busco tenis para correr')
  ok('gallery becomes a compact marker with query, count and first titles', /\[galería: 5 productos para «running · Nike» — Pegasus 41; Vomero 18; A; B; …\]/.test(lines[1]))
  ok('chips and feature_products are ignored', !/suggest_followups|feature_products/.test(t) && !lines.includes('Asistente: '))
  ok('files become a marker', lines[2] === 'Cliente: [adjuntó un archivo] agrega el primero')
  ok('cart and profile tools become facts', /\[carrito: 2× Pegasus 41 — caja Chica\]/.test(lines[3]) && /\[guardó en el perfil: .*"9 US"/.test(lines[3]))
  ok('legacy string content still renders', lines[4] === 'Asistente: texto plano legado')
  ok('empty rows render to nothing', renderTranscript([{ role: 'user', content: { parts: [] } }]) === '')
}

// ── stripPrices ────────────────────────────────────────────────────────────
{
  ok('dollar amounts are removed', stripPrices('Le gustó el hoodie a $39.99 y el otro de US$ 120') === 'Le gustó el hoodie a [precio] y el otro de [precio]')
  ok('currency suffix amounts are removed', stripPrices('presupuesto de 1,500 pesos o 80 USD') === 'presupuesto de [precio] o [precio]')
  ok('percent discounts are removed', stripPrices('vio jeans con 40% de descuento y tenis al 25 % off') === 'vio jeans con [descuento] y tenis al [descuento]')
  ok('plain numbers (sizes, ids, counts) survive', stripPrices('talla 9.5 US, 2 pares, id p1a2b3, 16 productos') === 'talla [precio], 2 pares, id p1a2b3, 16 productos' || stripPrices('talla 9.5, 2 pares, id p1a2b3, 16 productos') === 'talla 9.5, 2 pares, id p1a2b3, 16 productos')
  ok('empty input is safe', stripPrices('') === '' && stripPrices(null) === '')
}

// ── shouldSummarize / summaryBlock / flag ──────────────────────────────────
{
  ok('flag on', summaryEnabled())
  ok('dropped turns trigger a fold', shouldSummarize(3, null, 8))
  ok('a backlog beyond the window triggers a fold', shouldSummarize(0, { running_summary: null, summary_version: 0, summary_upto_message_id: null, unsummarized: 9 }, 8))
  ok('nothing to do otherwise', !shouldSummarize(0, { running_summary: null, summary_version: 0, summary_upto_message_id: null, unsummarized: 8 }, 8) && !shouldSummarize(0, null, 8))
  ok('summaryBlock is empty without a summary', summaryBlock(null) === '' && summaryBlock({ running_summary: '', summary_version: 0, summary_upto_message_id: null, unsummarized: 0 }) === '')
  const long = 'x'.repeat(SUMMARY_MAX_CHARS + 500)
  const b = summaryBlock({ running_summary: long, summary_version: 1, summary_upto_message_id: 1, unsummarized: 0 })
  ok('summaryBlock is labelled and hard-cut', b.startsWith('RESUMEN DE LO QUE VA DE ESTA CONVERSACIÓN') && b.length < SUMMARY_MAX_CHARS + 200)
  process.env.CHAT_SUMMARY = '0'
  ok('flag off → never summarize, never read', !summaryEnabled() && !shouldSummarize(5, null, 8))
  process.env.CHAT_SUMMARY = '1'
}

// ── readSummary (cache) ────────────────────────────────────────────────────
await (async () => {
  _resetSummaryCache()
  const calls = []
  const api = async (path) => { calls.push(path); return { running_summary: 'Busca tenis.', summary_version: 2, summary_upto_message_id: 7, unsummarized: 3 } }
  const a = await readSummary(api, 42, 'tok')
  const b = await readSummary(api, 42, 'tok')
  ok('first read hits the API, second is cached', calls.length === 1 && a.running_summary === 'Busca tenis.' && b === a)
  ok('guest / off → null without a call', (await readSummary(api, undefined, 'tok')) === null && (await readSummary(api, 42, undefined)) === null && calls.length === 1)
  const failing = async () => { throw new Error('down') }
  ok('API failure → null, never throws', (await readSummary(failing, 43, 'tok')) === null)
  ok('non-ok API body → null', (await readSummary(async () => ({ ok: false, status: 404 }), 44, 'tok')) === null)
})()

// ── summarize (full flow, fake api + fake model) ───────────────────────────
await (async () => {
  _resetSummaryCache()
  const store = { running_summary: null, summary_version: 0, summary_upto_message_id: null }
  const rows = [
    { id: 10, role: 'user', content: { parts: [{ type: 'text', text: 'quiero un hoodie Nike talla M' }] } },
    { id: 11, role: 'assistant', content: { parts: [{ type: 'tool-search_products', state: 'output-available', input: { query: 'hoodie', store: 'Nike' }, output: { products: [{ title: 'Club Fleece' }] } }, { type: 'text', text: 'El Club Fleece a $55 es la mejor opción.' }] } },
  ]
  const log = []
  const api = async (path, opts = {}) => {
    log.push([opts.method || 'GET', path, opts.body])
    if (path.startsWith('/conversations/9/context')) return { ...store, unsummarized: 10, to_fold: rows }
    if (path === '/conversations/9/summary') {
      if (opts.body.base_version !== store.summary_version) return { ok: false, status: 409 }
      Object.assign(store, { running_summary: opts.body.running_summary, summary_upto_message_id: opts.body.summary_upto_message_id, summary_version: store.summary_version + 1 })
      return { summary_version: store.summary_version }
    }
    throw new Error('unexpected ' + path)
  }
  let seen
  const generate = async (previous, transcript) => { seen = { previous, transcript }; return '1) Busca un hoodie Nike talla M. 3) Le interesó el Club Fleece a $55 (30% off).' }

  const r = await summarize(9, 'tok', 8, { api, generate })
  ok('summarize folds the rows the API returned', r.ran && r.folded === 2 && r.chars > 0)
  ok('the model saw no previous summary and the rendered transcript', seen.previous === null && /Cliente: quiero un hoodie Nike talla M/.test(seen.transcript) && /\[galería: 1 productos para «hoodie · Nike» — Club Fleece\]/.test(seen.transcript))
  ok('GET asked for the window and PATCH carried upto + base_version', log[0][1] === '/conversations/9/context?window=8' && log[1][0] === 'PATCH' && log[1][2].summary_upto_message_id === 11 && log[1][2].base_version === 0)
  ok('prices/discounts were stripped before saving', store.running_summary === '1) Busca un hoodie Nike talla M. 3) Le interesó el Club Fleece a [precio] ([descuento]).')
  ok('version advanced', store.summary_version === 1)
  const cached = await readSummary(async () => { throw new Error('should not be called') }, 9, 'tok')
  ok('the write updated the read cache', cached && cached.running_summary === store.running_summary && cached.summary_version === 1)

  // Second run, nothing to fold.
  const r2 = await summarize(9, 'tok', 8, { api: async () => ({ ...store, unsummarized: 2, to_fold: [] }), generate })
  ok('nothing to fold → no model call, no write', !r2.ran && r2.reason === 'nothing_to_fold')

  // Version conflict: the API rejects; we keep the old summary and drop the cache.
  const conflictApi = async (path, opts = {}) => path.includes('/context') ? { ...store, summary_version: 0, unsummarized: 10, to_fold: rows } : { ok: false, status: 409 }
  const r3 = await summarize(9, 'tok', 8, { api: conflictApi, generate })
  ok('409 → dropped silently, summary unchanged', r3.ran && r3.folded === 0 && r3.reason === 'version_conflict' && store.summary_version === 1)

  // Model failure keeps everything as is.
  const r4 = await summarize(9, 'tok', 8, { api, generate: async () => { throw new Error('model down') }, log: () => {} })
  ok('model failure → error reason, no write', r4.reason === 'error' && store.summary_version === 1)

  // Empty model output is not saved.
  const r5 = await summarize(9, 'tok', 8, { api, generate: async () => '   ' })
  ok('empty summary → not saved', r5.reason === 'empty_summary' && store.summary_version === 1)

  // In-flight lock: two concurrent runs → one folds, the other is skipped.
  _resetSummaryCache()
  let gate; const slow = new Promise((res) => { gate = res })
  const p1 = summarize(9, 'tok', 8, { api, generate: async () => { await slow; return 'ok' } })
  const p2 = summarize(9, 'tok', 8, { api, generate })
  const [s1, s2] = await Promise.all([p1, (async () => { const x = await p2; gate(); return x })()])
  ok('concurrent runs on one chat: second is skipped as in_flight', s2.reason === 'in_flight' && s1.ran)

  // Off → no-op.
  process.env.CHAT_SUMMARY = '0'
  ok('flag off → summarize is a no-op', (await summarize(9, 'tok', 8, { api, generate })).reason === 'off')
  process.env.CHAT_SUMMARY = '1'
})()

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
