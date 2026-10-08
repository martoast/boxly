<template>
  <section :class="isEmployee ? '' : 'min-h-screen bg-gray-50'">
    <div :class="isEmployee ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'">
      <div class="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-900">{{ t.title }}</h1>
          <p class="text-sm text-gray-500 mt-1">{{ t.subtitle }}</p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <button
            type="button"
            class="inline-flex items-center gap-2 px-3 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl transition-colors"
            :aria-label="t.upload"
            @click="picker?.click()"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
            <span class="hidden sm:inline">{{ t.upload }}</span>
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl shadow-lg shadow-primary-500/20 transition-colors"
            @click="openScanner"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.66-.9l.82-1.2A2 2 0 0110.07 4h3.86a2 2 0 011.66.9l.82 1.2a2 2 0 001.66.9H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            <span>{{ t.scan }}</span>
          </button>
        </div>
        <input ref="picker" type="file" accept="image/*" multiple class="hidden" @change="onPick">
      </div>

      <!-- Upload progress: rows land in the table below as each photo finishes -->
      <div v-if="queue.length" class="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5">
        <div class="flex items-center justify-between gap-3 text-sm">
          <p class="font-semibold text-gray-900">
            {{ busy ? t.processing : t.finished }} {{ doneCount }}/{{ queue.length }}
            <span v-if="failed.length" class="text-red-600 font-medium"> · {{ failed.length }} {{ t.failedCount }}</span>
          </p>
          <div class="flex items-center gap-3">
            <button v-if="!busy && failed.length" type="button" class="text-primary-600 font-medium hover:text-primary-700" @click="retryFailed">{{ t.retry }}</button>
            <button v-if="!busy" type="button" class="text-gray-400 hover:text-gray-600" @click="queue = []">{{ t.dismiss }}</button>
          </div>
        </div>
        <div class="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div class="h-full bg-primary-500 transition-all" :style="{ width: `${(100 * doneCount) / queue.length}%` }" />
        </div>
        <ul v-if="failed.length" class="mt-3 space-y-1 text-xs text-red-600">
          <li v-for="item in failed" :key="item.id" class="truncate">{{ item.name }} — {{ item.error }}</li>
        </ul>
      </div>

      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5 flex flex-col sm:flex-row gap-3 sm:items-center">
        <input v-model="search" :placeholder="t.searchPlaceholder" class="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
        <label class="inline-flex items-center gap-2 text-sm text-gray-600 shrink-0">
          <input v-model="onlyCheck" type="checkbox" class="rounded border-gray-300 text-primary-500 focus:ring-primary-500">
          {{ t.onlyCheck }}
        </label>
      </div>

      <div v-if="loading" class="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400">{{ t.loading }}</div>

      <div v-else-if="scans.length === 0" class="bg-white rounded-2xl border border-gray-100 p-12 text-center">
        <p class="text-gray-700 font-semibold">{{ t.emptyTitle }}</p>
        <p class="text-gray-400 text-sm mt-1">{{ t.emptyHint }}</p>
      </div>

      <div v-else class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div class="hidden sm:grid grid-cols-[3.5rem_1fr_1fr_7rem_8rem] gap-4 px-4 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <span />
          <span>{{ t.colName }}</span>
          <span>{{ t.colTracking }}</span>
          <span>{{ t.colCarrier }}</span>
          <span>{{ t.colDate }}</span>
        </div>
        <div v-for="s in scans" :key="s.id" class="border-b border-gray-100 last:border-0">
          <button type="button" class="w-full text-left grid grid-cols-[3.5rem_1fr] sm:grid-cols-[3.5rem_1fr_1fr_7rem_8rem] gap-x-4 gap-y-1 px-4 py-3 items-center hover:bg-gray-50" @click="toggle(s)">
            <img :src="s.image_url" alt="" loading="lazy" class="w-14 h-14 object-cover rounded-lg bg-gray-100 row-span-3 sm:row-span-1">
            <span class="min-w-0">
              <span class="font-medium text-gray-900 truncate block">{{ s.recipient_name || '—' }}</span>
              <span v-if="s.needs_check" class="inline-flex mt-0.5 px-2 py-0.5 rounded-full text-xs font-semibold border bg-amber-50 text-amber-700 border-amber-100">{{ t.needsCheck }}</span>
            </span>
            <span class="font-mono text-xs text-gray-600 break-all">{{ s.tracking_number || '—' }}</span>
            <span class="text-xs text-gray-500 uppercase">{{ s.carrier || '—' }}</span>
            <span class="text-xs text-gray-400 hidden sm:block">{{ formatDate(s.created_at) }}</span>
          </button>

          <div v-if="openId === s.id" class="px-4 pb-4 grid gap-4 sm:grid-cols-[16rem_1fr]">
            <a :href="s.image_url" target="_blank" rel="noopener"><img :src="s.image_url" alt="" class="w-full rounded-xl border border-gray-100"></a>
            <div class="space-y-3 text-sm">
              <div class="grid sm:grid-cols-2 gap-3">
                <label class="block">
                  <span class="text-xs text-gray-500">{{ t.colName }}</span>
                  <input v-model="edit.recipient_name" class="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                </label>
                <label class="block">
                  <span class="text-xs text-gray-500">{{ t.colTracking }}</span>
                  <input v-model="edit.tracking_number" class="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500">
                </label>
              </div>
              <label class="inline-flex items-center gap-2 text-gray-600">
                <input v-model="edit.needs_check" type="checkbox" class="rounded border-gray-300 text-primary-500 focus:ring-primary-500">
                {{ t.needsCheck }}
              </label>
              <dl class="grid grid-cols-[9rem_1fr] gap-x-3 gap-y-1 text-xs">
                <template v-for="row in details(s)" :key="row[0]">
                  <dt class="text-gray-400">{{ row[0] }}</dt>
                  <dd class="text-gray-700 break-all">{{ row[1] }}</dd>
                </template>
              </dl>
              <div class="flex flex-wrap gap-2 pt-1">
                <button type="button" :disabled="saving" class="px-3 py-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg" @click="save(s)">{{ t.save }}</button>
                <button type="button" class="px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 text-sm font-semibold rounded-lg border border-green-100" @click="copyMessage(s)">{{ t.copyMessage }}</button>
                <button type="button" class="px-3 py-2 text-red-600 hover:bg-red-50 text-sm font-semibold rounded-lg" @click="remove(s)">{{ t.delete }}</button>
              </div>
            </div>
          </div>
        </div>
        <div v-if="hasMore" class="p-4 text-center">
          <button type="button" class="text-primary-600 font-medium hover:text-primary-700 text-sm" @click="fetchScans(page + 1)">{{ t.loadMore }}</button>
        </div>
      </div>
    </div>
    <LabelCameraScanner v-if="scannerOpen" :items="queue" :english="isEmployee" @capture="onCapture" @close="scannerOpen = false" />
  </section>
</template>

<script setup>
import { prepareLabelPhoto, blobToDataUrl } from '~/utils/labelPhoto'
import LabelCameraScanner from '~/components/admin/LabelCameraScanner.vue'
import { trackingsFrom } from '~/utils/labelTracking'

const { $customFetch } = useNuxtApp()
const route = useRoute()
const toast = useToast()

const isEmployee = computed(() => route.path.includes('/employee/'))
const apiNs = computed(() => (isEmployee.value ? '/employee' : '/admin'))

const t = computed(() => (isEmployee.value
  ? {
      title: 'Label scans',
      subtitle: 'Photos of arrived packages → name + tracking number',
      upload: 'Upload photos',
      scan: 'Scan with camera',
      processing: 'Reading labels…',
      finished: 'Done',
      failedCount: 'failed',
      retry: 'Retry failed',
      dismiss: 'Hide',
      searchPlaceholder: 'Search by name or tracking number...',
      onlyCheck: 'Only to check',
      loading: 'Loading...',
      emptyTitle: 'No label scans yet',
      emptyHint: 'Upload the label photos of the packages that arrived.',
      needsCheck: 'Check',
      colName: 'Name',
      colTracking: 'Tracking',
      colCarrier: 'Carrier',
      colDate: 'Uploaded',
      save: 'Save',
      saved: 'Saved',
      copyMessage: 'Copy WhatsApp message',
      copied: 'Message copied',
      delete: 'Delete',
      confirmDelete: 'Delete this package?',
      loadMore: 'Load more',
      leaveWarning: 'Photos are still uploading. Leave anyway?',
      d: { other: 'Other tracking', barcodes: 'Barcodes', modelRead: 'Model read', confidence: 'Confidence', by: 'Uploaded by' },
    }
  : {
      title: 'Escaneo de etiquetas',
      subtitle: 'Fotos de los paquetes que llegaron → nombre + número de guía',
      upload: 'Subir fotos',
      scan: 'Escanear con cámara',
      processing: 'Leyendo etiquetas…',
      finished: 'Listo',
      failedCount: 'con error',
      retry: 'Reintentar fallidas',
      dismiss: 'Ocultar',
      searchPlaceholder: 'Buscar por nombre o número de guía...',
      onlyCheck: 'Solo por revisar',
      loading: 'Cargando...',
      emptyTitle: 'Aún no hay etiquetas',
      emptyHint: 'Sube las fotos de las etiquetas de los paquetes que llegaron.',
      needsCheck: 'Revisar',
      colName: 'Nombre',
      colTracking: 'Guía',
      colCarrier: 'Paquetería',
      colDate: 'Subida',
      save: 'Guardar',
      saved: 'Guardado',
      copyMessage: 'Copiar mensaje de WhatsApp',
      copied: 'Mensaje copiado',
      delete: 'Eliminar',
      confirmDelete: '¿Eliminar este paquete?',
      loadMore: 'Cargar más',
      leaveWarning: 'Todavía se están subiendo fotos. ¿Salir de todos modos?',
      d: { other: 'Otras guías', barcodes: 'Códigos leídos', modelRead: 'Lectura del modelo', confidence: 'Confianza', by: 'Subida por' },
    }))

// ---- table ----------------------------------------------------------------------------
const scans = ref([])
const loading = ref(true)
const search = ref('')
const onlyCheck = ref(false)
const page = ref(1)
const hasMore = ref(false)
let searchTimer = null

const formatDate = (value) => (value ? new Date(value).toLocaleString(isEmployee.value ? 'en-US' : 'es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—')

const fetchScans = async (p = 1) => {
  if (p === 1) loading.value = true
  try {
    const res = await $customFetch(`${apiNs.value}/label-scans`, {
      query: { search: search.value || undefined, needs_check: onlyCheck.value ? 1 : undefined, per_page: 100, page: p },
    })
    const rows = res.data?.data ?? []
    scans.value = p === 1 ? rows : [...scans.value, ...rows]
    page.value = p
    hasMore.value = (res.data?.current_page ?? 1) < (res.data?.last_page ?? 1)
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

watch(search, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => fetchScans(1), 300)
})
watch(onlyCheck, () => fetchScans(1))
onMounted(() => fetchScans(1))

// ---- expand / edit ----------------------------------------------------------------------
const openId = ref(null)
const edit = reactive({ recipient_name: '', tracking_number: '', needs_check: false })
const saving = ref(false)

const toggle = (s) => {
  openId.value = openId.value === s.id ? null : s.id
  Object.assign(edit, { recipient_name: s.recipient_name || '', tracking_number: s.tracking_number || '', needs_check: !!s.needs_check })
}

const details = (s) => [
  [t.value.d.other, (s.other_tracking || []).join(', ') || '—'],
  [t.value.d.barcodes, (s.barcodes || []).map((b) => b.replace(/\u001d/g, ' ')).join(' · ') || '—'],
  [t.value.d.modelRead, s.model_tracking_read || '—'],
  [t.value.d.confidence, s.confidence || '—'],
  [t.value.d.by, `${s.creator?.name || '—'} · ${formatDate(s.created_at)}`],
]

const replaceRow = (row) => {
  const i = scans.value.findIndex((x) => x.id === row.id)
  if (i >= 0) scans.value[i] = row
}

const save = async (s) => {
  saving.value = true
  try {
    const res = await $customFetch(`${apiNs.value}/label-scans/${s.id}`, {
      method: 'PUT',
      body: { recipient_name: edit.recipient_name || null, tracking_number: edit.tracking_number || null, needs_check: edit.needs_check },
    })
    replaceRow(res.data)
    toast.show({ message: t.value.saved, type: 'success' })
  } catch (e) {
    toast.show({ message: e?.data?.message || String(e), type: 'error' })
  } finally {
    saving.value = false
  }
}

const remove = async (s) => {
  if (!confirm(t.value.confirmDelete)) return
  try {
    await $customFetch(`${apiNs.value}/label-scans/${s.id}`, { method: 'DELETE' })
    scans.value = scans.value.filter((x) => x.id !== s.id)
    openId.value = null
  } catch (e) {
    toast.show({ message: e?.data?.message || String(e), type: 'error' })
  }
}

const copyMessage = async (s) => {
  const name = String(s.recipient_name || '').replace(/^BOXLY\s+/i, '').trim()
  const tracking = s.tracking_number ? `${s.tracking_number}${s.carrier ? ` (${String(s.carrier).toUpperCase()})` : ''}` : '—'
  const text = `¡Hola ${name}! 📦 Llegó un paquete tuyo a nuestra bodega en San Diego.\nNúmero de guía: ${tracking}`
  try {
    await navigator.clipboard.writeText(text)
    toast.show({ message: t.value.copied, type: 'success' })
  } catch {
    prompt('', text)
  }
}

// ---- upload: every picked photo is read and saved on its own; rows appear as they finish ----
const picker = ref(null)
const queue = ref([])
const PARALLEL = 6
let nextId = 0
let batch = ''

const busy = computed(() => queue.value.some((i) => i.status === 'waiting' || i.status === 'working'))
const doneCount = computed(() => queue.value.filter((i) => ['done', 'retake', 'duplicate'].includes(i.status)).length)
const failed = computed(() => queue.value.filter((i) => i.status === 'failed'))

/** The name read failed (network, model): keep what the barcodes alone give, flagged for a person. */
const fromBarcodesOnly = (barcodes) => {
  const codes = trackingsFrom(barcodes)
  const main = codes.find((c) => c.carrier === 'ups') || codes[0]
  return [{
    tracking_number: main?.tracking ?? null,
    carrier: main?.carrier ?? null,
    other_tracking: codes.filter((c) => c !== main).map((c) => `${c.carrier}:${c.tracking}`),
    recipient_name: main?.name ?? null,
    barcodes,
    needs_check: true,
  }]
}

const processOne = async (item) => {
  item.status = 'working'
  try {
    const { barcodes, image } = item.prepared || await prepareLabelPhoto(item.file)
    let packages
    try {
      const r = await $fetch('/api/label-read', { method: 'POST', body: { image: await blobToDataUrl(image), barcodes } })
      packages = r.packages?.length ? r.packages : fromBarcodesOnly(barcodes)
    } catch (e) {
      console.error('[label-read]', e)
      packages = fromBarcodesOnly(barcodes)
    }
    // A camera shot the AI judged bad (tilted / blurry / far…) whose read came back incomplete is
    // NOT saved: the scanner asks Mau to take it again while the box is still in his hands.
    // An upload has no second chance, so it is saved anyway (flagged for a person).
    const issue = packages[0]?.issue
    if (item.fromCamera && issue && issue !== 'ok' && packages.some((p) => p.needs_check)) {
      item.issue = issue
      item.status = 'retake'
      item.prepared = null
      return
    }
    // The same package shot twice: every tracking number on it is already saved.
    const tracks = packages.map((p) => p.tracking_number).filter(Boolean)
    if (tracks.length === packages.length && tracks.every((tr) => knownTracking.value.has(tr))) {
      item.result = { name: packages[0]?.recipient_name || '—', tracking: tracks[0], needs_check: false }
      item.status = 'duplicate'
      item.prepared = null
      return
    }
    const form = new FormData()
    form.append('image', image, 'label.jpg')
    form.append('batch', batch)
    form.append('packages', JSON.stringify(packages))
    const res = await $customFetch(`${apiNs.value}/label-scans`, { method: 'POST', body: form })
    const rows = res.data || []
    scans.value = [...rows.slice().reverse(), ...scans.value]
    item.result = { name: rows[0]?.recipient_name || '—', tracking: rows[0]?.tracking_number || '', needs_check: rows.some((r) => r.needs_check) }
    item.status = 'done'
    item.file = null
    item.prepared = null
  } catch (e) {
    item.status = 'failed'
    item.error = e?.data?.message || e?.message || String(e)
  }
}

let workers = 0
const run = () => { // picking more photos mid-upload only adds to the queue; never more than PARALLEL at once
  const worker = async () => {
    workers++
    try {
      for (;;) {
        const item = queue.value.find((i) => i.status === 'waiting')
        if (!item) return
        await processOne(item)
      }
    } finally {
      workers--
    }
  }
  while (workers < PARALLEL && queue.value.some((i) => i.status === 'waiting')) worker()
}

const onPick = (event) => {
  const files = [...(event.target.files || [])]
  event.target.value = ''
  if (!files.length) return
  if (!busy.value) {
    queue.value = queue.value.filter((i) => i.status === 'failed')
    batch = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
  }
  queue.value.push(...files.map((file) => reactive({ id: nextId++, name: file.name, file, prepared: null, status: 'waiting', error: '', result: null })))
  run()
}

// ---- live camera: each capture joins the same queue and is sent right away ----
const scannerOpen = ref(false)
const knownTracking = computed(() => new Set(scans.value.map((s) => s.tracking_number).filter(Boolean)))

const openScanner = () => { // one batch per scanning session; finished rows from before are cleared off the list
  if (!busy.value) {
    queue.value = queue.value.filter((i) => i.status === 'failed')
    batch = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
  }
  scannerOpen.value = true
}

const onCapture = ({ barcodes, image, label }) => {
  queue.value.push(reactive({ id: nextId++, name: label || '…', file: null, prepared: { barcodes, image }, fromCamera: true, issue: '', status: 'waiting', error: '', result: null }))
  run()
}

const retryFailed = () => {
  for (const item of failed.value) { item.status = 'waiting'; item.error = '' }
  run()
}

const beforeUnload = (e) => {
  if (!busy.value) return
  e.preventDefault()
  e.returnValue = ''
}
onMounted(() => window.addEventListener('beforeunload', beforeUnload))
onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnload))
onBeforeRouteLeave(() => (busy.value ? confirm(t.value.leaveWarning) : true))
</script>
