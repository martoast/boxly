<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 class="text-2xl font-extrabold text-gray-900">Base de conocimiento</h1>
          <p class="text-sm text-gray-500 mt-1">Lo que el asistente de IA sabe para responder preguntas sobre Boxly. Edita y se actualiza en segundos.</p>
        </div>
        <button @click="newArticle" class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold shadow-lg shadow-primary-500/20 transition">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          Nuevo artículo
        </button>
      </div>

      <div class="grid lg:grid-cols-3 gap-6">
        <!-- List -->
        <div class="lg:col-span-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <input v-model="search" type="text" placeholder="Buscar artículo…" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 mb-3" />

          <div v-if="loading" class="py-12 text-center text-gray-400">
            <svg class="inline-block w-7 h-7 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
          </div>

          <div v-else-if="!grouped.length" class="py-12 text-center text-sm text-gray-400">Sin artículos todavía.</div>

          <div v-else class="space-y-4 max-h-[70vh] overflow-y-auto">
            <div v-for="g in grouped" :key="g.section">
              <p class="text-[11px] font-bold text-gray-400 uppercase tracking-wide px-1 mb-1">{{ g.section }}</p>
              <ul class="space-y-1">
                <li v-for="a in g.items" :key="a.id">
                  <button @click="selectArticle(a)" class="w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between gap-2 transition" :class="selected && selected.id === a.id ? 'bg-primary-50 text-primary-800 font-semibold' : 'hover:bg-gray-50 text-gray-700'">
                    <span class="truncate">{{ a.title }}</span>
                    <span v-if="!a.is_published" class="shrink-0 text-[10px] font-bold uppercase text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded">Borrador</span>
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Editor -->
        <div class="lg:col-span-2">
          <div v-if="!selected" class="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-gray-400">
            Selecciona un artículo o crea uno nuevo.
          </div>

          <div v-else class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <!-- AI author — type an idea, the AI drafts the whole article. -->
            <div class="rounded-2xl border border-primary-100 bg-gradient-to-br from-primary-50/70 via-white to-white p-4">
              <div class="flex items-center gap-2 mb-2">
                <span class="grid place-items-center w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-sm">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.7 5.6L19 9l-5.3 1.4L12 16l-1.7-5.6L5 9l5.3-1.4z"/></svg>
                </span>
                <div>
                  <p class="text-sm font-bold text-gray-900">Escríbelo con IA</p>
                  <p class="text-[11px] text-gray-500 leading-tight">Describe la idea y la IA redacta el artículo. Tú lo revisas antes de guardar.</p>
                </div>
              </div>
              <textarea
                v-model="aiIdea"
                rows="2"
                :disabled="aiBusy"
                :placeholder="selected.content ? 'Ej: agrega los tiempos del cruce y que mandamos foto…' : 'Ej: explica cuánto tarda el envío a México y qué pasa en la bodega…'"
                class="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y"
                @keydown.meta.enter.prevent="generateWithAI"
                @keydown.ctrl.enter.prevent="generateWithAI"
              ></textarea>
              <div class="flex items-center justify-between gap-2 mt-2">
                <p class="text-[11px] text-gray-400">No inventa precios ni datos: si falta uno, lo marca <span class="font-mono text-gray-500">[por confirmar]</span>.</p>
                <button
                  @click="generateWithAI"
                  :disabled="aiBusy || !aiIdea.trim()"
                  class="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-semibold shadow-md shadow-primary-600/20 transition active:scale-95"
                >
                  <svg v-if="aiBusy" class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
                  <svg v-else class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.7 5.6L19 9l-5.3 1.4L12 16l-1.7-5.6L5 9l5.3-1.4z"/></svg>
                  {{ aiBusy ? 'Escribiendo…' : (selected.content ? 'Mejorar con IA' : 'Generar con IA') }}
                </button>
              </div>
            </div>

            <div class="grid sm:grid-cols-2 gap-3">
              <div class="sm:col-span-2">
                <label class="block text-xs font-semibold text-gray-500 mb-1">Título</label>
                <input v-model="selected.title" type="text" placeholder="¿Cómo funciona Boxly?" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-500 mb-1">Sección</label>
                <input v-model="selected.section" type="text" list="kb-sections" placeholder="General, Precios, Envíos…" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                <datalist id="kb-sections"><option v-for="s in sections" :key="s" :value="s" /></datalist>
              </div>
              <div class="flex items-end">
                <label class="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input v-model="selected.is_published" type="checkbox" class="rounded border-gray-300 text-primary-500 focus:ring-primary-500" />
                  Publicado (visible para el asistente)
                </label>
              </div>
            </div>

            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="block text-xs font-semibold text-gray-500">Contenido (Markdown)</label>
                <div class="flex items-center gap-1 text-xs">
                  <button @click="preview = false" :class="!preview ? 'text-primary-600 font-bold' : 'text-gray-400'" class="px-2 py-1">Editar</button>
                  <button @click="preview = true" :class="preview ? 'text-primary-600 font-bold' : 'text-gray-400'" class="px-2 py-1">Vista previa</button>
                </div>
              </div>
              <textarea v-if="!preview" v-model="selected.content" rows="16" placeholder="Escribe en Markdown. Usa títulos, listas y **negritas** para que el asistente lo entienda mejor." class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary-500"></textarea>
              <div v-else class="border border-gray-100 rounded-xl px-4 py-3 bg-gray-50 min-h-[16rem]">
                <MarkdownText :text="selected.content || '_Sin contenido_'" />
              </div>
            </div>

            <div class="flex items-center justify-between pt-1">
              <button v-if="selected.id" @click="remove" :disabled="busy" class="text-sm font-semibold text-red-600 hover:text-red-700 disabled:opacity-50">Eliminar</button>
              <span v-else></span>
              <div class="flex items-center gap-2">
                <button @click="selected = null" class="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition">Cancelar</button>
                <button @click="save" :disabled="busy || !canSave" class="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white text-sm font-semibold shadow-lg shadow-primary-500/20 transition">
                  <svg v-if="busy" class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
                  {{ selected.id ? 'Guardar' : 'Crear' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'] })
useHead({ title: 'Base de conocimiento — Admin' })

const { $customFetch } = useNuxtApp()
const articles = ref([])
const loading = ref(true)
const busy = ref(false)
const search = ref('')
const selected = ref(null)
const preview = ref(false)
const aiIdea = ref('')
const aiBusy = ref(false)

let searchTimer = null
watch(search, () => { if (searchTimer) clearTimeout(searchTimer); searchTimer = setTimeout(fetchList, 300) })

const sections = computed(() => [...new Set(articles.value.map((a) => a.section).filter(Boolean))])
const grouped = computed(() => {
  const map = {}
  for (const a of articles.value) {
    const s = a.section || 'General'
    ;(map[s] ||= []).push(a)
  }
  return Object.keys(map).sort().map((section) => ({ section, items: map[section] }))
})
const canSave = computed(() => selected.value && selected.value.title?.trim() && selected.value.content?.trim())

async function fetchList() {
  loading.value = true
  try {
    const res = await $customFetch('/admin/knowledge', { query: { search: search.value || undefined } })
    articles.value = res.data ?? []
  } catch (e) { console.error(e) } finally { loading.value = false }
}

function selectArticle(a) {
  selected.value = { ...a }
  preview.value = false
  aiIdea.value = ''
}
function newArticle() {
  selected.value = { title: '', section: '', content: '', is_published: true, sort_order: 0 }
  preview.value = false
  aiIdea.value = ''
}

// AI author — turn the admin's plain-language idea into a full article, filling
// the title/section/content fields for review. Never auto-saves. When the editor
// already has content it REFINES it (the server treats the current content as the
// article to improve), otherwise it writes a fresh one.
async function generateWithAI() {
  if (!selected.value || aiBusy.value || !aiIdea.value.trim()) return
  aiBusy.value = true
  try {
    const draft = await $fetch('/api/knowledge-draft', {
      method: 'POST',
      body: {
        idea: aiIdea.value.trim(),
        currentTitle: selected.value.title || '',
        currentContent: selected.value.content || '',
        sections: sections.value,
      },
    })
    if (draft?.content) {
      // Keep the admin's title/section if they already set one; otherwise take the AI's.
      selected.value.title = selected.value.title?.trim() || draft.title || ''
      selected.value.section = selected.value.section?.trim() || draft.section || ''
      selected.value.content = draft.content
      preview.value = true // show them the result immediately
      aiIdea.value = ''
    } else {
      alert(draft?.message || 'La IA no pudo generar el artículo.')
    }
  } catch (e) {
    console.error(e)
    alert(e?.data?.message || 'La IA no pudo generar el artículo. Intenta de nuevo.')
  } finally {
    aiBusy.value = false
  }
}

async function save() {
  if (!canSave.value || busy.value) return
  busy.value = true
  try {
    const body = {
      title: selected.value.title,
      section: selected.value.section || null,
      content: selected.value.content,
      is_published: !!selected.value.is_published,
      sort_order: selected.value.sort_order || 0,
    }
    const res = selected.value.id
      ? await $customFetch(`/admin/knowledge/${selected.value.id}`, { method: 'PUT', body })
      : await $customFetch('/admin/knowledge', { method: 'POST', body })
    selected.value = { ...res.data }
    await fetchList()
  } catch (e) { console.error(e); alert('No se pudo guardar.') } finally { busy.value = false }
}

async function remove() {
  if (!selected.value?.id || busy.value) return
  if (!confirm('¿Eliminar este artículo? El asistente dejará de usarlo.')) return
  busy.value = true
  try {
    await $customFetch(`/admin/knowledge/${selected.value.id}`, { method: 'DELETE' })
    selected.value = null
    await fetchList()
  } catch (e) { console.error(e); alert('No se pudo eliminar.') } finally { busy.value = false }
}

onMounted(fetchList)
</script>
