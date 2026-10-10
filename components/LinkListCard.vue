<template>
  <!-- A LIST OF PRODUCT LINKS → ONE BOX (Alex 2026-10-10): every link the shopper pasted, read here; each one asks only for what
       its link does not already choose; "Agregar todo" puts the whole list in the box in one message (utils/linkList.ts). -->
  <div class="rounded-2xl border border-gray-200 bg-white shadow-sm max-w-md md:max-w-none md:w-full overflow-hidden">
    <div class="px-4 pt-3 pb-2 flex items-center gap-2 border-b border-gray-100">
      <p class="text-[14px] font-bold text-gray-900">Tu lista · {{ rows.length }} producto{{ rows.length === 1 ? '' : 's' }}</p>
      <p class="ml-auto text-[12px] text-gray-500">{{ readyCount }} listo{{ readyCount === 1 ? '' : 's' }}<span v-if="reading"> · leyendo {{ reading }}…</span></p>
    </div>

    <div class="divide-y divide-gray-100">
      <div v-for="row in rows" :key="row.url" class="p-2">
        <!-- Can't be bought by the Boxly agent: shown, never added; the shopper can ask for something similar. -->
        <div v-if="!row.supported" class="flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-2.5">
          <img v-if="row.image" :src="row.image" alt="" referrerpolicy="no-referrer" class="w-12 h-12 rounded-lg object-cover bg-white shrink-0" />
          <div class="min-w-0 flex-1">
            <p class="text-[13px] font-semibold text-gray-800 line-clamp-2">{{ row.title || host(row.url) }}</p>
            <p class="text-[11.5px] text-amber-700 font-semibold">No disponible: no compramos en {{ host(row.url) }}</p>
          </div>
          <button type="button" :disabled="sent" class="shrink-0 rounded-full border border-primary-200 px-3 py-1.5 text-[12px] font-bold text-primary-700 hover:bg-primary-50 disabled:opacity-50" @click="$emit('similar', row)">Buscar similar</button>
        </div>

        <!-- Chosen (on its card, or nothing to choose): one line, changeable until the list is sent. -->
        <div v-else-if="row.choice" class="flex items-center gap-3 rounded-xl px-2 py-2">
          <img v-if="row.choice.image" :src="row.choice.image" alt="" referrerpolicy="no-referrer" class="w-12 h-12 rounded-lg object-cover bg-gray-50 shrink-0" />
          <div class="min-w-0 flex-1">
            <p class="text-[10.5px] uppercase tracking-wider text-primary-500 font-bold">{{ row.store_name }}</p>
            <p class="text-[13px] font-semibold text-gray-900 line-clamp-1">{{ row.choice.title }}</p>
            <p class="text-[12px] text-gray-600">
              <span v-if="row.choice.price != null" class="font-bold text-gray-900">${{ usd(row.choice.price) }}</span>
              <span v-if="choiceText(row)"> · {{ choiceText(row) }}</span>
              <span v-if="row.choice.quantity > 1"> · ×{{ row.choice.quantity }}</span>
            </p>
          </div>
          <span class="shrink-0 text-emerald-600 text-[12px] font-bold">✓</span>
          <button v-if="!sent && row.hasChoices" type="button" class="shrink-0 text-[12px] font-semibold text-primary-600 underline underline-offset-2" @click="row.choice = null">Cambiar</button>
        </div>

        <!-- Needs a choice (or is still being read): the product's own picker card; its add button chooses this row. -->
        <LazyProductPickerCard v-else :part="row.part" :busy="row.busy" @assisted="(p) => choose(row, p)" @refresh="read(row, { readUrl: row.part?.output?.read_url || row.url, colorways: row.part?.output?.read?.colorways || null, fresh: true })"
          @colorway="(c) => read(row, { readUrl: c.url, colorways: row.part?.output?.read?.colorways || null, fresh: true })" />
      </div>
    </div>

    <div class="p-3 border-t border-gray-100">
      <button type="button" :disabled="sent || !readyCount || reading > 0" class="w-full rounded-xl bg-primary-600 py-3 text-[14px] font-bold text-white hover:bg-primary-700 disabled:opacity-50" @click="addAll">
        {{ sent ? 'Agregados a tu caja ✓' : `Agregar todo (${readyCount})` }}
      </button>
      <p v-if="!sent && waiting" class="mt-1.5 text-center text-[11.5px] text-gray-500">{{ waiting }} producto{{ waiting === 1 ? '' : 's' }} esperan que elijas talla o color — o agrega los listos ahora.</p>
    </div>
  </div>
</template>

<script setup>
import { PICKER_PART } from '~/utils/typedPick'

const props = defineProps({
  part: { type: Object, required: true },
})
const emit = defineEmits(['add-all', 'similar'])

const links = computed(() => (Array.isArray(props.part?.output?.links) ? props.part.output.links : []))
const storeKey = computed(() => `boxly-linklist:${props.part?.toolCallId || links.value.map((l) => l.url).join('|')}`)

const usd = (n) => Number(n).toFixed(2)
const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, '') } catch { return u } }

// A link that already PINS its version (Shopify ?variant=, a size/colour/sku parameter, an Amazon /dp/ page): the page's own selection
// is the shopper's. Anything else is asked on the chips — a page's default size is never taken as a choice.
const pinsVersion = (u) => /[?&](?:variant|sku|skuid|size|color|colour|dwvar_[^=]*)=/i.test(String(u)) || /amazon\.com\/(?:[^/]+\/)?dp\//i.test(String(u))
const kindKey = (a) => (a?.kind && a.kind !== 'other' ? a.kind : a?.name)

const rows = reactive(links.value.map((l) => ({
  url: l.url, supported: !!l.supported, store_id: l.store_id || null, store_name: l.store_name || host(l.url),
  title: null, image: null, part: null, busy: false, hasChoices: false, choice: null,
})))
const sent = ref(false)

// The shopper's choices survive a reload of the chat (this browser only).
onMounted(() => {
  try {
    const saved = JSON.parse(localStorage.getItem(storeKey.value) || 'null')
    if (saved?.sent) sent.value = true
    for (const r of rows) if (saved?.choices?.[r.url]) r.choice = saved.choices[r.url]
  } catch { /* storage may be off */ }
  queue()
})
function persist() {
  try { localStorage.setItem(storeKey.value, JSON.stringify({ sent: sent.value, choices: Object.fromEntries(rows.filter((r) => r.choice).map((r) => [r.url, r.choice])) })) } catch { /* storage may be off */ }
}

const product = (row) => ({ title: row.title || '', url: row.url, image: row.image, store_name: row.store_name, store_id: row.store_id })
// Four pages at a time; each row's card shows its own "reading" until its read lands.
async function queue() {
  // a link the agent cannot buy from is not read (often a walled site): its row only says so
  const todo = rows.filter((r) => r.supported && !r.part)
  let i = 0
  const worker = async () => { while (i < todo.length) { const r = todo[i++]; await read(r) } }
  await Promise.all(Array.from({ length: Math.min(4, todo.length) }, worker))
}
async function read(row, { readUrl = row.url, colorways = null, fresh = false } = {}) {
  if (row.busy) return
  row.busy = true
  if (!row.part) row.part = { type: PICKER_PART, toolCallId: `linklist-${row.url}`, state: 'input-available', input: { product: product(row) } }
  let r = null
  // the same patience as a picker card: a slow read answers "reading" before Netlify's cut, and is asked again
  for (let attempt = 0, failures = 0; attempt < 6 && failures < 2 && !r; attempt++) {
    try {
      const x = await $fetch('/api/product-variants', { method: 'POST', timeout: 28000, body: { url: readUrl, max_age_s: fresh ? 0 : 900, skip_colorways: !!colorways?.length, ...(colorways?.length ? { colorways } : {}) } })
      if (x && (!x.reason || x.reason === 'no_variants' || x.reason === 'need_url')) r = x
      else if (['blocked', 'page_not_found', 'marketplace'].includes(x?.reason) || x?.error === 'page_not_found') break
      else if (x?.reason !== 'reading') { failures++; await new Promise((res) => setTimeout(res, 1500)) }
    } catch { failures++ }
  }
  row.busy = false
  if (!r) { row.part = { ...row.part, state: 'output-error', errorText: 'read_failed' }; return }
  row.title = r.product?.title || row.title
  row.image = r.product?.image || r.product?.images?.[0] || row.image
  const axes = Array.isArray(r.axes) ? r.axes : []
  const colorwaysOf = Array.isArray(r.colorways) ? r.colorways : []
  row.hasChoices = colorwaysOf.length > 1 || axes.some((a) => (a?.values?.length || 0) > 1)
  row.part = { type: PICKER_PART, toolCallId: `linklist-${row.url}`, state: 'output-available', input: {}, output: { product: product(row), read: r, read_at: new Date().toISOString(), read_url: readUrl } }
  if (!row.supported || row.choice) return
  // nothing to choose → ready as it is; a link that pins its version, with every choice selected on its page → ready with that choice
  const multi = axes.filter((a) => (a?.values?.length || 0) > 1)
  const selected = r.selected && typeof r.selected === 'object' ? r.selected : {}
  const pinned = pinsVersion(readUrl) && multi.length && multi.every((a) => selected[a.name] != null && (a.values || []).map(String).includes(String(selected[a.name])))
  if (!row.hasChoices || pinned) {
    const variants = {}
    for (const a of axes) if (selected[a.name] != null && (pinned || (a.values?.length || 0) === 1)) variants[kindKey(a)] = String(selected[a.name])
    if (r.own_color && !variants.color) variants.color = r.own_color
    row.choice = { title: row.title || host(row.url), url: readUrl, image: row.image, price: r.product?.price ?? null, quantity: 1, variants }
    persist()
  }
}
// The row's own picker card chose (its "Agregar al carrito"): that choice is this row's — nothing is sent yet.
function choose(row, p) {
  row.choice = { title: p.title || row.title || host(row.url), url: p.url || row.url, image: p.image || row.image, price: p.price ?? null, quantity: Number(p.quantity) > 1 ? Number(p.quantity) : 1, variants: { ...(p.pick?.variants || {}) } }
  persist()
}
const choiceText = (row) => Object.values(row.choice?.variants || {}).join(', ')
const readyCount = computed(() => rows.filter((r) => r.supported && r.choice).length)
const reading = computed(() => rows.filter((r) => r.busy).length)
const waiting = computed(() => rows.filter((r) => r.supported && !r.choice && r.part?.state === 'output-available').length)

function addAll() {
  if (sent.value || !readyCount.value) return
  const list = rows.filter((r) => r.supported && r.choice).map((r) => ({ url: r.choice.url, title: r.choice.title, image: r.choice.image, price: r.choice.price, quantity: r.choice.quantity, variants: r.choice.variants }))
  sent.value = true
  persist()
  emit('add-all', list)
}
</script>
