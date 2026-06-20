<template>
  <Teleport to="body">
    <!-- Floating cart button -->
    <button
      v-if="count > 0 || open"
      @click="open = true"
      class="fixed z-[90] bottom-5 right-5 flex items-center gap-2 pl-4 pr-5 py-3 rounded-full bg-primary-500 hover:bg-primary-600 active:scale-95 text-white font-bold shadow-xl shadow-primary-500/30 transition-all"
      aria-label="Ver carrito"
    >
      <span class="relative">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
      </span>
      <span class="text-sm">{{ count }} {{ count === 1 ? 'artículo' : 'artículos' }}</span>
    </button>

    <!-- Drawer -->
    <Transition name="cart-fade">
      <div v-if="open" class="fixed inset-0 z-[110]" role="dialog" aria-modal="true">
        <div class="absolute inset-0 bg-black/50" @click="open = false"></div>
        <Transition name="cart-slide" appear>
          <aside v-if="open" class="absolute inset-y-0 right-0 w-full sm:max-w-md bg-white shadow-2xl flex flex-col">
            <header class="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
              <h2 class="text-lg font-bold text-gray-900">Tu pedido</h2>
              <button @click="open = false" class="p-2 -mr-2 rounded-lg text-gray-500 hover:text-gray-900 active:scale-90 transition" aria-label="Cerrar">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </header>

            <!-- Success -->
            <div v-if="placed" class="flex-1 flex flex-col items-center justify-center text-center px-6">
              <div class="w-14 h-14 rounded-full bg-green-100 grid place-items-center mb-4">
                <svg class="w-7 h-7 text-green-600" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 011.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z" clip-rule="evenodd"/></svg>
              </div>
              <h3 class="text-lg font-bold text-gray-900">¡Solicitud creada!</h3>
              <p class="text-sm text-gray-500 mt-1">{{ placed }}</p>
              <p class="text-sm text-gray-500 mt-2 max-w-xs">Boxly la revisará, comprará tus productos en EE.UU. y te enviará la cotización con el envío a México.</p>
              <NuxtLink to="/app/purchase-requests" class="mt-5 px-5 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-bold transition" @click="open = false">Ver mis solicitudes</NuxtLink>
              <button @click="placed = null; open = false" class="mt-2 text-sm text-gray-500 font-medium">Seguir buscando</button>
            </div>

            <!-- Empty -->
            <div v-else-if="!items.length" class="flex-1 flex flex-col items-center justify-center text-center px-6">
              <p class="text-gray-500">Tu pedido está vacío.</p>
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

              <!-- Guest account form -->
              <div v-if="needAccount" class="px-4 pt-3 border-t border-gray-100 space-y-2">
                <p class="text-sm font-bold text-gray-900">Crea tu cuenta para enviar tu pedido</p>
                <input v-model="acct.name" placeholder="Nombre completo" class="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-primary-500" />
                <input v-model="acct.email" type="email" inputmode="email" placeholder="Correo electrónico" class="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-primary-500" />
                <input v-model="acct.phone" type="tel" inputmode="tel" placeholder="Teléfono (+52...)" class="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>

              <!-- Footer / checkout -->
              <footer class="px-4 py-4 border-t border-gray-100 shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-sm text-gray-500">Subtotal (precio de tienda)</span>
                  <span class="text-base font-bold text-gray-900">${{ subtotal.toFixed(2) }} USD</span>
                </div>
                <p class="text-[11px] text-gray-400 mb-3">Boxly suma su comisión y el envío a México. Te lo cotizamos después de tu solicitud.</p>
                <p v-if="error" class="text-sm text-red-600 mb-2">{{ error }}</p>
                <button
                  @click="checkout"
                  :disabled="placing"
                  class="w-full py-3 rounded-2xl bg-primary-500 hover:bg-primary-600 active:scale-[.98] disabled:bg-gray-300 text-white font-bold shadow-sm shadow-primary-500/25 transition-all"
                >
                  {{ placing ? 'Creando solicitud…' : (needAccount ? 'Crear cuenta y pedir' : 'Crear solicitud de compra') }}
                </button>
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
const acct = reactive({ name: '', email: '', phone: '' })
const needAccount = computed(() => !user.value)

async function checkout() {
  error.value = ''
  if (!items.value.length) return
  placing.value = true
  try {
    // Guest → create the account inline first (signs them in via cookie).
    if (!user.value) {
      if (!acct.name || !acct.email || !acct.phone) {
        error.value = 'Completa tus datos para enviar el pedido.'
        placing.value = false
        return
      }
      const res = await $customFetch('/auth/chat-register', { method: 'POST', body: { name: acct.name, email: acct.email, phone: acct.phone } })
      user.value = res.user
    }

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
    error.value = e?.data?.message || 'No se pudo crear la solicitud. Intenta de nuevo.'
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
