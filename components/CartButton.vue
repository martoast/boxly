<template>
  <Teleport to="body">
    <!-- Floating request button -->
    <button
      v-if="count > 0 || open"
      @click="open = true"
      class="fixed z-[90] bottom-5 right-5 flex items-center gap-2 pl-4 pr-5 py-3 rounded-full bg-primary-500 hover:bg-primary-600 active:scale-95 text-white font-bold shadow-xl shadow-primary-500/30 transition-all"
      aria-label="Ver mi solicitud"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>
      <span class="text-sm">Mi solicitud · {{ count }}</span>
    </button>

    <!-- Drawer -->
    <Transition name="cart-fade">
      <div v-if="open" class="fixed inset-0 z-[1100]" role="dialog" aria-modal="true">
        <div class="absolute inset-0 bg-black/50" @click="open = false"></div>
        <Transition name="cart-slide" appear>
          <aside v-if="open" class="absolute inset-y-0 right-0 w-full sm:max-w-md bg-white shadow-2xl flex flex-col">
            <header class="px-5 py-4 border-b border-gray-100 shrink-0">
              <div class="flex items-center justify-between">
                <h2 class="text-lg font-bold text-gray-900">Tu solicitud de compra</h2>
                <button @click="open = false" class="p-2 -mr-2 rounded-lg text-gray-500 hover:text-gray-900 active:scale-90 transition" aria-label="Cerrar">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
              <p class="text-xs text-gray-500 mt-0.5">Productos que quieres que Boxly compre por ti</p>
            </header>

            <!-- Success -->
            <div v-if="placed" class="flex-1 flex flex-col items-center justify-center text-center px-6">
              <div class="w-14 h-14 rounded-full bg-green-100 grid place-items-center mb-4">
                <svg class="w-7 h-7 text-green-600" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 011.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z" clip-rule="evenodd"/></svg>
              </div>
              <h3 class="text-lg font-bold text-gray-900">¡Solicitud enviada!</h3>
              <p class="text-sm text-gray-500 mt-1">{{ placed }}</p>
              <p class="text-sm text-gray-500 mt-2 max-w-xs">Boxly la revisará, comprará tus productos en EE.UU. y te enviará la <span class="font-semibold text-gray-700">cotización para que la apruebes</span>. Pagas solo cuando aceptes.</p>

              <!-- WhatsApp the shopping manager (Velonie) — answer their questions -->
              <div class="mt-5 w-full max-w-xs rounded-2xl bg-green-50 border border-green-200 p-4 text-left">
                <p class="text-sm font-bold text-gray-900">¿Tienes dudas sobre tu pedido?</p>
                <p class="text-xs text-gray-600 mt-0.5">Escríbele a Velonie, tu compradora en Boxly. Te ayuda con cualquier pregunta sobre tu solicitud.</p>
                <a :href="whatsappUrl" target="_blank" rel="noopener noreferrer" class="mt-3 w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 active:scale-[.98] text-white text-sm font-bold transition">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 018.413 3.488 11.82 11.82 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.978-1.207zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                  Escribir por WhatsApp
                </a>
              </div>

              <NuxtLink to="/app/purchase-requests" class="mt-4 text-sm font-bold text-primary-600 hover:text-primary-700" @click="open = false">Ver mis solicitudes</NuxtLink>
              <button @click="placed = null; open = false" class="mt-2 text-sm text-gray-500 font-medium">Seguir buscando</button>
            </div>

            <!-- Empty -->
            <div v-else-if="!items.length" class="flex-1 flex flex-col items-center justify-center text-center px-6">
              <p class="text-gray-500">Tu solicitud está vacía.</p>
              <p class="text-sm text-gray-400 mt-1">Busca productos de EE.UU. y agrégalos aquí.</p>
            </div>

            <!-- Items -->
            <template v-else>
              <div class="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                <div v-for="it in items" :key="lineKey(it)" class="flex gap-3 bg-gray-50 rounded-2xl p-2.5">
                  <div class="w-16 h-16 rounded-xl bg-white border border-gray-100 grid place-items-center overflow-hidden shrink-0">
                    <img v-if="it.image" :src="it.image" referrerpolicy="no-referrer" class="w-full h-full object-contain" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="text-[13px] font-semibold text-gray-900 leading-snug line-clamp-2">{{ it.title }}</p>
                    <p v-if="it.store" class="text-[10px] uppercase tracking-wide text-primary-500 font-bold">{{ it.store }}</p>
                    <p v-if="it.variant" class="text-[11px] text-gray-500">{{ it.variant }}</p>
                    <div class="flex items-center justify-between mt-1.5">
                      <div class="flex items-center gap-1.5">
                        <button @click="setQty(lineKey(it), it.quantity - 1)" class="w-6 h-6 grid place-items-center rounded-md border border-gray-200 text-gray-600 hover:bg-gray-100">−</button>
                        <span class="text-sm font-semibold w-5 text-center">{{ it.quantity }}</span>
                        <button @click="setQty(lineKey(it), it.quantity + 1)" class="w-6 h-6 grid place-items-center rounded-md border border-gray-200 text-gray-600 hover:bg-gray-100">+</button>
                      </div>
                      <div class="flex items-center gap-2">
                        <span v-if="it.price" class="text-sm font-bold text-gray-900">${{ (it.price * it.quantity).toFixed(2) }}</span>
                        <button @click="remove(lineKey(it))" class="text-gray-300 hover:text-red-500" aria-label="Quitar">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Footer -->
              <footer class="px-4 py-4 border-t border-gray-100 shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <!-- No-payment clarity banner -->
                <div class="flex gap-2.5 items-start bg-primary-50/70 border border-primary-100 rounded-xl px-3.5 py-2.5 mb-3">
                  <svg class="w-4 h-4 text-primary-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  <p class="text-[12px] text-primary-900 leading-snug"><span class="font-bold">No pagas nada ahora.</span> Esto es una solicitud para que Boxly compre estos productos por ti. Te enviaremos la cotización (producto + comisión + envío) para que la apruebes.</p>
                </div>

                <div class="flex items-center justify-between mb-3">
                  <span class="text-sm text-gray-500">Valor aprox. en tienda</span>
                  <span class="text-base font-bold text-gray-900">${{ subtotal.toFixed(2) }} USD</span>
                </div>

                <p v-if="error" class="text-sm text-red-600 mb-2">{{ error }}</p>
                <button
                  @click="send"
                  :disabled="placing"
                  class="w-full py-3 rounded-2xl bg-primary-500 hover:bg-primary-600 active:scale-[.98] disabled:bg-gray-300 text-white font-bold shadow-sm shadow-primary-500/25 transition-all"
                >
                  {{ placing ? 'Enviando solicitud…' : 'Enviar solicitud a Boxly' }}
                </button>
                <p class="text-center text-[11px] text-gray-400 mt-2">Boxly la compra por ti y te la trae a México</p>
              </footer>
            </template>
          </aside>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
const { $customFetch } = useNuxtApp()
const user = useState('user')
const { items, count, subtotal, remove, setQty, clear, lineKey, open } = useCart()

const placing = ref(false)
const placed = ref(null) // request_number on success
const error = ref('')

// WhatsApp the shopping manager (Velonie) with the new request number prefilled.
const WHATSAPP_NUMBER = '16195591910'
const whatsappUrl = computed(() => {
  const ref = placed.value && placed.value !== 'Solicitud enviada' ? ` (${placed.value})` : ''
  const msg = `Hola Boxly 👋 Acabo de enviar mi solicitud de compra${ref} y tengo una pregunta.`
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`
})

async function send() {
  error.value = ''
  if (!items.value.length) return
  // Logged-in only for now (no inline account creation).
  if (!user.value) {
    error.value = 'Inicia sesión para enviar tu solicitud.'
    return
  }

  placing.value = true
  try {
    const payload = {
      currency: 'usd',
      items: items.value.map((it) => ({
        product_name: it.title,
        product_url: it.url || undefined,
        product_image_url: it.image || undefined,
        price: Number(it.price) || 0,
        quantity: Number(it.quantity) || 1,
        notes: it.variant || it.note || undefined,
      })),
    }
    const r = await $customFetch('/purchase-requests', { method: 'POST', body: payload })
    placed.value = (r?.data?.request_number) || (r?.request_number) || 'Solicitud enviada'
    clear()
  } catch (e) {
    error.value = e?.data?.message || 'No se pudo enviar la solicitud. Intenta de nuevo.'
  } finally {
    placing.value = false
  }
}
</script>

<style scoped>
.cart-fade-enter-from, .cart-fade-leave-to { opacity: 0; }
.cart-fade-enter-active, .cart-fade-leave-active { transition: opacity .2s ease; }
.cart-slide-enter-from, .cart-slide-leave-to { transform: translateX(100%); }
.cart-slide-enter-active, .cart-slide-leave-active { transition: transform .3s cubic-bezier(.2,.8,.2,1); }
@media (prefers-reduced-motion: reduce) {
  .cart-slide-enter-active, .cart-slide-leave-active { transition: none; }
}
</style>
