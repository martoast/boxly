<template>
  <div class="min-h-[100dvh] bg-gradient-to-b from-white to-gray-50 flex flex-col">
    <!-- top-right: profile (logged in) -->
    <div class="flex justify-end p-3 md:p-4">
      <button v-if="user" @click="showProfile = true" class="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-primary-600 transition px-3 py-1.5 rounded-lg hover:bg-gray-100">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
        Tu perfil
      </button>
    </div>

    <!-- centered search -->
    <div class="flex-1 flex flex-col items-center justify-center px-5 pb-24 -mt-10">
      <img src="/logo.svg" alt="Boxly" class="w-20 h-20 md:w-24 md:h-24 mb-3" />
      <h1 class="text-[22px] md:text-3xl font-extrabold text-gray-900 tracking-tight text-center">¿Qué quieres comprar de USA?</h1>
      <p class="text-gray-500 mt-2 text-[14px] md:text-[15px] text-center max-w-md">Búscalo en miles de tiendas. <span class="font-semibold text-gray-700">Boxly lo compra y te lo trae a México.</span></p>

      <!-- the box -->
      <form class="w-full max-w-xl mt-7 flex items-center gap-1 bg-white border border-gray-200 rounded-full pl-5 pr-2 py-2 shadow-lg shadow-gray-200/60 focus-within:border-primary-400 focus-within:shadow-xl transition-all" @submit.prevent="go">
        <svg class="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"/></svg>
        <input
          v-model="q"
          type="text"
          inputmode="search"
          enterkeyhint="search"
          autofocus
          placeholder="Producto, marca o pega un link de EE.UU."
          class="flex-1 min-w-0 border-0 bg-transparent px-2 py-1.5 text-[16px] text-gray-900 placeholder:text-gray-400 focus:outline-none"
        />
        <button type="button" @click="pickImage" class="shrink-0 w-9 h-9 grid place-items-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition" aria-label="Buscar por imagen">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
        </button>
        <button type="submit" class="shrink-0 w-10 h-10 grid place-items-center rounded-full bg-primary-500 hover:bg-primary-600 active:scale-90 text-white transition" aria-label="Buscar">
          <svg class="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.3" d="M14 5l7 7-7 7M21 12H3"/></svg>
        </button>
        <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onImage" />
      </form>

      <!-- suggestions -->
      <div class="mt-5 flex flex-wrap justify-center gap-2 max-w-xl">
        <button v-for="s in suggestions" :key="s.text" @click="goWith(s.text)" class="px-3.5 py-2 rounded-full bg-white border border-gray-200 text-[13.5px] text-gray-700 hover:border-gray-300 hover:bg-gray-50 active:scale-95 transition">
          {{ s.emoji }} {{ s.text }}
        </button>
      </div>

      <!-- value props -->
      <div class="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 max-w-xl">
        <span v-for="v in valueProps" :key="v" class="flex items-center gap-1.5 text-[12.5px] text-gray-500">
          <svg class="w-3.5 h-3.5 text-primary-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
          {{ v }}
        </span>
      </div>
    </div>

    <CartButton />

    <!-- Profile modal -->
    <Teleport to="body">
      <Transition name="sb-fade">
        <div v-if="showProfile" class="fixed inset-0 z-[110] flex items-end md:items-center justify-center" role="dialog" aria-modal="true">
          <div class="absolute inset-0 bg-black/50 md:backdrop-blur-sm" @click="closeProfile"></div>
          <Transition name="sb-sheet" appear>
            <div v-if="showProfile" class="relative w-full md:w-auto md:max-w-lg md:mx-4 flex flex-col max-h-[92vh] md:max-h-[85vh]">
              <button @click="closeProfile" class="absolute -top-12 right-4 md:-top-3.5 md:-right-3.5 z-10 w-10 h-10 grid place-items-center rounded-full bg-white shadow-lg ring-1 ring-black/5 text-gray-600 hover:text-gray-900 active:scale-90 transition" aria-label="Cerrar">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
              <div class="overflow-y-auto bg-white rounded-t-3xl md:rounded-3xl shadow-2xl pb-[max(1rem,env(safe-area-inset-bottom))] md:pb-0 md:w-[32rem] max-w-full">
                <div class="md:hidden pt-3 pb-1 flex justify-center"><span class="w-10 h-1.5 rounded-full bg-gray-300"></span></div>
                <ShoppingProfileCard bare />
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
const { $customFetch } = useNuxtApp()
const user = useState('user')

const q = ref('')
const fileInput = ref(null)
const shoppingProfile = ref(null)
const showProfile = ref(false)

const valueProps = ['Sin VPN', 'Sin tarjeta americana', 'Boxly compra por ti', 'Entrega en México', 'Ideal para reventa']
const DEFAULT_SUGGESTIONS = [
  { emoji: '🔥', text: 'Ofertas en YoungLA' },
  { emoji: '👟', text: 'New Balance en oferta' },
  { emoji: '🦅', text: 'American Eagle' },
  { emoji: '💧', text: 'Owala' },
]
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)
const suggestions = computed(() => {
  const p = shoppingProfile.value || {}
  const out = []
  if (p.shopper_type === 'reseller') out.push({ emoji: '📈', text: 'Mejores ofertas para revender' })
  for (const b of (Array.isArray(p.favorite_brands) ? p.favorite_brands : []).slice(0, 2)) if (b) out.push({ emoji: '🔥', text: `Ofertas en ${b}` })
  for (const c of [...(Array.isArray(p.interests) ? p.interests : []), ...(Array.isArray(p.categories) ? p.categories : [])].slice(0, 2)) if (c) out.push({ emoji: '🛍️', text: cap(c) })
  const seen = new Set()
  return [...out, ...DEFAULT_SUGGESTIONS].filter((s) => { const k = s.text.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true }).slice(0, 5)
})

onMounted(async () => {
  if (!user.value) return
  try { shoppingProfile.value = (await $customFetch('/me/shopping-profile')).data } catch { /* ignore */ }
})

function go() {
  const text = q.value.trim()
  if (!text) return
  navigateTo({ path: '/buscar', query: { q: text } })
}
function goWith(text) { q.value = text; go() }

function pickImage() { fileInput.value?.click() }
function onImage(e) {
  const f = e.target.files?.[0]
  e.target.value = ''
  if (!f) return
  const reader = new FileReader()
  reader.onload = () => {
    // Stash the image for the results page to run the vision search.
    try { sessionStorage.setItem('boxly_pending_image', String(reader.result)) } catch { /* ignore */ }
    navigateTo({ path: '/buscar', query: { img: '1' } })
  }
  reader.readAsDataURL(f)
}

function closeProfile() { showProfile.value = false }
</script>

<style scoped>
.sb-fade-enter-from, .sb-fade-leave-to { opacity: 0; }
.sb-fade-enter-active, .sb-fade-leave-active { transition: opacity .2s ease; }
.sb-sheet-enter-from, .sb-sheet-leave-to { opacity: 0; transform: translateY(100%); }
.sb-sheet-enter-active, .sb-sheet-leave-active { transition: opacity .25s ease, transform .32s cubic-bezier(.2,.8,.2,1); }
@media (min-width: 768px) { .sb-sheet-enter-from, .sb-sheet-leave-to { transform: translateY(10px) scale(.97); } }
@media (prefers-reduced-motion: reduce) { .sb-sheet-enter-active, .sb-sheet-leave-active { transition: opacity .2s ease; } .sb-sheet-enter-from, .sb-sheet-leave-to { transform: none; } }
</style>
