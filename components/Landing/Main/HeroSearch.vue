<template>
  <!-- Landing-hero entry point into the BOXLY concierge. It does NOT chat here —
       it hands off to /search?q=... which auto-fires the query as the first
       message (works for guests; the account gate happens at purchase). Framed as
       a conversation with an AI, not a product search box. -->
  <div class="w-full max-w-xl">
    <form @submit.prevent="go()" class="relative">
      <input
        v-model="q"
        type="text"
        :placeholder="t.placeholder"
        :aria-label="t.placeholder"
        autocomplete="off"
        @focus="warmSearch"
        class="w-full rounded-2xl bg-white/95 backdrop-blur pl-5 pr-32 py-4 text-base text-gray-900 placeholder-gray-500 shadow-xl ring-1 ring-black/5 focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
      />
      <button
        type="submit"
        class="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm pl-3 pr-3.5 py-2.5 shadow-md shadow-primary-600/30 active:scale-95 transition"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l1.6 4.6L18 8l-4.4 1.4L12 14l-1.6-4.6L6 8l4.4-1.4L12 2zM5 14l.9 2.6L8.5 17l-2.6.9L5 20l-.9-2.1L1.5 17l2.6-.4L5 14zM18 13l1 2.8 2.8 1-2.8 1L18 21l-1-3.2-2.8-1 2.8-1L18 13z"/></svg>
        {{ t.cta }}
      </button>
    </form>

    <!-- Capability strip: spells out the whole job so it's clearly a concierge,
         not a search engine. -->
    <div class="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-white/80">
      <template v-for="(cap, i) in caps" :key="i">
        <span v-if="i" class="text-white/40" aria-hidden="true">•</span>
        <span>{{ cap }}</span>
      </template>
    </div>

    <!-- Natural-language example prompts — they teach users they can just talk. -->
    <div class="mt-4 flex flex-wrap gap-2">
      <button
        v-for="(c, i) in chips"
        :key="i"
        type="button"
        @click="go(c)"
        class="px-3.5 py-1.5 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur border border-white/25 text-white text-sm font-medium active:scale-95 transition"
      >
        {{ c }}
      </button>
    </div>
  </div>
</template>

<script setup>
const { t: createTranslations } = useLanguage()
const q = ref('')

const t = createTranslations({
  placeholder: { es: 'Ej. “Quiero unos tenis New Balance blancos talla 8”', en: 'e.g. “I want white New Balance sneakers, size 8”' },
  cta:         { es: 'Preguntar', en: 'Ask' },
})

// The whole job, in four beats — concierge, not search.
const capsT = createTranslations({
  c1: { es: 'Encuentra productos', en: 'Finds products' },
  c2: { es: 'Compara tiendas', en: 'Compares stores' },
  c3: { es: 'Compra por ti', en: 'Buys for you' },
  c4: { es: 'Lo recibes en México', en: 'Delivered in Mexico' },
})
const caps = computed(() => [capsT.value.c1, capsT.value.c2, capsT.value.c3, capsT.value.c4])

// Natural-language example prompts (not product categories) — demonstrate that
// you can speak to the AI, including a non-literal request like a gift.
const chipsT = createTranslations({
  c1: { es: 'Quiero unos Jordan Retro negros talla 9', en: 'I want black Jordan Retro, size 9' },
  c2: { es: 'Encuentra la Dyson Airwrap más barata', en: 'Find the cheapest Dyson Airwrap' },
  c3: { es: 'Necesito un regalo para mi esposa', en: 'I need a gift for my wife' },
  c4: { es: 'Muéstrame bolsos Coach en oferta', en: 'Show me Coach bags on sale' },
})
const chips = computed(() => [chipsT.value.c1, chipsT.value.c2, chipsT.value.c3, chipsT.value.c4])

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
onNuxtReady(() => { requestIdleCallbackSafe(warmSearch) })
function requestIdleCallbackSafe(cb) {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) window.requestIdleCallback(cb, { timeout: 2500 })
  else setTimeout(cb, 1200)
}
</script>
