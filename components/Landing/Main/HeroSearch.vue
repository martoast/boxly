<template>
  <!-- Landing-hero entry point into the BOXLY concierge. It does NOT chat here —
       it hands off to /search?q=... which auto-fires the query as the first
       message (works for guests; the account gate happens at purchase). This is
       the main top-of-funnel: ask → search → (eventually) create account. -->
  <div class="w-full max-w-xl">
    <form @submit.prevent="go()" class="relative">
      <input
        v-model="q"
        type="text"
        :placeholder="t.placeholder"
        :aria-label="t.placeholder"
        autocomplete="off"
        @focus="warmSearch"
        class="w-full rounded-2xl bg-white/95 backdrop-blur pl-5 pr-14 py-4 text-base text-gray-900 placeholder-gray-500 shadow-xl ring-1 ring-black/5 focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
      />
      <button
        type="submit"
        :aria-label="t.search"
        class="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 grid place-items-center rounded-xl bg-primary-600 hover:bg-primary-700 text-white shadow-md shadow-primary-600/30 active:scale-90 transition"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M13 6l6 6-6 6"/></svg>
      </button>
    </form>

    <!-- Suggestion chips — tappable example prompts (incl. a "how it works"
         question, since the concierge answers those too). -->
    <div class="mt-3.5 flex flex-wrap gap-2">
      <button
        v-for="(c, i) in chips"
        :key="i"
        type="button"
        @click="go(c.q)"
        class="px-3.5 py-1.5 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur border border-white/25 text-white text-sm font-medium active:scale-95 transition"
      >
        {{ c.label }}
      </button>
    </div>
  </div>
</template>

<script setup>
const { t: createTranslations } = useLanguage()
const { $customFetch } = useNuxtApp()
const q = ref('')

const t = createTranslations({
  placeholder: { es: 'Escribe un producto, marca o pega un link…', en: 'Type a product, brand or paste a link…' },
  search:      { es: 'Buscar', en: 'Search' },
})

function go(text) {
  warmSearch() // no-op if already warmed; covers chip taps that skip input focus
  const query = (text ?? q.value).toString().trim()
  navigateTo(query ? `/search?q=${encodeURIComponent(query)}` : '/search')
}

// We KNOW the next step is /search, so warm the path ahead of the navigation:
//  1) preload its JS chunks (the ~1.7MB AI-SDK/ShoppingAssistant bundle) so the
//     page mounts instantly with no download, and
//  2) ping the Nitro server function so the first /api/assistant call isn't a
//     cold start. Done once, on the first engagement signal (focus/idle/submit).
let warmed = false
function warmSearch() {
  if (warmed) return
  warmed = true
  preloadRouteComponents('/search')
  $fetch('/api/ping').catch(() => {})
}
// Also warm during browser idle even if they never focus — by the time they
// engage, chunks are likely already cached. Cheap; runs after hydration.
onNuxtReady(() => { requestIdleCallbackSafe(warmSearch) })
function requestIdleCallbackSafe(cb) {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) window.requestIdleCallback(cb, { timeout: 2500 })
  else setTimeout(cb, 1200)
}

// Curated bilingual defaults shown instantly (SSR, no request). Enhanced on the
// client with the admin-managed starter prompts so the hero stays in sync with
// what the team curates for /search — best of both: fast first paint + control.
const defaults = createTranslations({
  c1: { es: 'Tenis Nike para correr', en: 'Nike running shoes' },
  c2: { es: 'Bolsa Coach', en: 'Coach bag' },
  c3: { es: 'Perfumes de Sephora', en: 'Sephora perfumes' },
  c4: { es: '¿Cómo funciona Boxly?', en: 'How does Boxly work?' },
})
const chips = ref([])
watchEffect(() => {
  chips.value = [defaults.value.c1, defaults.value.c2, defaults.value.c3, defaults.value.c4].map((s) => ({ label: s, q: s }))
})

onMounted(async () => {
  try {
    const rows = (await $customFetch('/starter-prompts'))?.data
    const items = (Array.isArray(rows) ? rows : [])
      .map((r) => ({ label: r.title || r.prompt_text, q: r.prompt_text }))
      .filter((c) => c.q)
      .slice(0, 4)
    if (items.length) chips.value = items
  } catch { /* keep curated defaults */ }
})
</script>
