<template>
  <!-- Landing-hero entry point into the BOXLY concierge. It does NOT chat here —
       it hands off to /search?q=... which auto-fires the query as the first
       message (works for guests; the account gate happens at purchase). Framed as
       a conversation with an AI, not a product search box. -->
  <div class="w-full max-w-2xl mx-auto">
    <form @submit.prevent="go()" class="relative">
      <input
        v-model="q"
        type="text"
        :placeholder="t.placeholder"
        :aria-label="t.placeholder"
        autocomplete="off"
        @focus="warmSearch"
        class="w-full rounded-2xl bg-white pl-5 pr-36 py-5 text-base sm:text-lg text-gray-900 placeholder-gray-400 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.25)] ring-1 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
      />
      <button
        type="submit"
        class="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm sm:text-base pl-3.5 pr-4 py-3 shadow-md shadow-primary-600/30 active:scale-95 transition"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path stroke-linecap="round" d="M21 21l-4.3-4.3"/></svg>
        {{ t.cta }}
      </button>
    </form>

    <!-- Example prompts — managed in the admin CMS (/starter-prompts). Shows a small
         spinner until they load (NO hardcoded placeholders that would visibly swap).
         On MOBILE: one swipeable row; on desktop: wrapped + centered. min-h reserves
         space so the layout doesn't jump when chips replace the spinner. -->
    <div class="mt-4 flex gap-2 overflow-x-auto sm:flex-wrap sm:justify-center sm:overflow-visible -mx-4 px-4 sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden min-h-[2.25rem]">
      <div v-if="chips === null" class="flex items-center justify-center w-full py-1.5 text-gray-400">
        <svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
      </div>
      <button
        v-for="(c, i) in (chips || [])"
        :key="i"
        type="button"
        @click="go(c.q)"
        class="shrink-0 whitespace-nowrap px-3.5 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700 text-sm font-medium active:scale-95 transition"
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
  placeholder: { es: 'Describe lo que quieres comprar…', en: 'Describe what you want to buy…' },
  cta:         { es: 'Buscar', en: 'Search' },
})

// Suggestion chips come ONLY from the admin-managed starter prompts (/starter-prompts),
// the SAME source as the search page, so the team controls them from the CMS. We show
// a small spinner until they load — no hardcoded placeholders, which would visibly
// "switch" to the real ones once the fetch returns. null = loading; [] = loaded (none).
const chips = ref(null)

onMounted(async () => {
  try {
    const rows = (await $customFetch('/starter-prompts'))?.data
    chips.value = (Array.isArray(rows) ? rows : [])
      .map((r) => ({ label: r.prompt_text || r.title, q: r.prompt_text || r.title }))
      .filter((c) => c.q)
      .slice(0, 6)
  } catch {
    chips.value = []
  }
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
onNuxtReady(() => { requestIdleCallbackSafe(warmSearch) })
function requestIdleCallbackSafe(cb) {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) window.requestIdleCallback(cb, { timeout: 2500 })
  else setTimeout(cb, 1200)
}
</script>
