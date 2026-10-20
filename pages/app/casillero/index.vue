<template>
  <section class="min-h-screen bg-white">
    <div class="max-w-2xl mx-auto px-4 sm:px-6 pt-5 pb-10">
      <NuxtLink :to="backTo" class="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
        {{ t.back }}
      </NuxtLink>

      <!-- Header -->
      <h1 class="mt-3 text-[28px] sm:text-[32px] font-bold tracking-tight text-gray-900 leading-tight">{{ t.title }}</h1>
      <p class="mt-2 text-[15.5px] text-gray-500 leading-relaxed">{{ t.subtitle }}</p>
      <div class="mt-3">
        <TutorialVideoButton loom-id="34cef0546fd64ca3bf8f11fa89c156cc" variant="play" />
      </div>

      <!-- 1. THE address — the one they paste at checkout. -->
      <div class="mt-6 rounded-3xl border border-primary-100 bg-white p-5 sm:p-6 shadow-sm shadow-primary-900/5">
        <div class="flex items-center gap-2.5">
          <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"/></svg>
          <p class="text-[15.5px] font-semibold text-gray-900">{{ t.onlineShoppingAddress }}</p>
        </div>
        <div class="mt-3.5 space-y-1 text-[17px]">
          <p class="font-semibold text-gray-900">BOXLY {{ fullUserName }}</p>
          <p class="text-gray-800">157 Virginia Ave Suite 835</p>
          <p class="text-gray-800">San Ysidro, CA 92173</p>
        </div>
        <button
          type="button"
          @click="copyAddress"
          class="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-full bg-gray-900 hover:bg-black text-white py-3.5 text-[15.5px] font-semibold transition-colors active:scale-[0.99]"
        >
          <svg v-if="!copied" class="w-[18px] h-[18px]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
          <svg v-else class="w-[18px] h-[18px]" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
          {{ copied ? t.copied : t.copyAddress }}
        </button>
        <p class="mt-3.5 flex items-start gap-2.5 text-[13.5px] text-gray-500 leading-snug">
          <svg class="w-[18px] h-[18px] flex-shrink-0 mt-px" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path stroke-linecap="round" d="M12 11v5M12 8h.01"/></svg>
          {{ t.onlineHint }}
        </p>
      </div>

      <!-- 2. In-person drop-off — a different, rarer thing, so it stays folded
           and can't be mistaken for the shipping address. -->
      <div class="mt-4 rounded-3xl border border-gray-200 bg-white">
        <button
          type="button"
          class="w-full flex items-center gap-3 p-5 sm:p-6 text-left"
          :aria-expanded="dropOffOpen"
          @click="dropOffOpen = !dropOffOpen"
        >
          <svg class="w-5 h-5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          <span class="flex-1 min-w-0">
            <span class="block text-[16px] font-semibold text-gray-900 leading-snug">{{ t.dropOffQuestion }}</span>
            <span class="block mt-0.5 text-[13.5px] text-gray-500">{{ t.dropOffSub }}</span>
          </span>
          <svg :class="['w-5 h-5 text-gray-500 flex-shrink-0 transition-transform duration-200', dropOffOpen ? 'rotate-180' : '']" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
        </button>
        <div v-if="dropOffOpen" class="px-5 sm:px-6 pb-5 sm:pb-6">
          <div class="border-t border-gray-100 pt-4">
            <p class="text-[15px] text-gray-800 leading-relaxed">{{ t.dropOffExclusive }}</p>
            <div class="mt-3 space-y-1 text-[16px]">
              <p class="font-semibold text-gray-900">482 W San Ysidro Blvd #2</p>
              <p class="text-gray-500">San Diego, CA 92173</p>
            </div>
            <a
              href="https://wa.me/16195591910?text=Hola!+Quiero+agendar+una+entrega+en+persona"
              target="_blank"
              rel="noopener"
              class="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-full bg-green-600 hover:bg-green-700 text-white py-3.5 text-[15.5px] font-semibold transition-colors"
            >
              <svg class="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              {{ t.dropOffScheduleWhatsApp }}
            </a>
            <div class="mt-3 flex items-center justify-between gap-3 text-[13.5px]">
              <p class="text-gray-500">{{ t.dropOffNoWalkIns }}</p>
              <a href="https://maps.app.goo.gl/PLMDQsGLY98zN5Y19" target="_blank" rel="noopener" class="flex-shrink-0 font-medium text-gray-700 underline underline-offset-2 hover:text-gray-900">{{ t.dropOffViewOnMaps }}</a>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. Next step — once their packages are on the way, they create the envío. -->
      <div class="mt-8 rounded-3xl bg-gray-50 p-5 sm:p-6">
        <h3 class="text-[16px] font-bold text-gray-900">{{ t.nextStepTitle }}</h3>
        <p class="text-sm text-gray-500 mt-1">{{ t.nextStepDesc }}</p>
        <NuxtLink
          to="/app/orders/create"
          class="mt-4 inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary-600 text-white text-[15px] font-semibold rounded-full hover:bg-primary-700 transition-colors"
        >
          <svg class="w-[18px] h-[18px]" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
          {{ t.createOrder }}
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'

definePageMeta({ layout: 'app', middleware: ['auth', 'customer', 'complete-profile'] })

const { $toast } = useNuxtApp()
const { t: createTranslations } = useLanguage()
const user = useUser()
const route = useRoute()

// Round-trip back to whoever sent us here (?from=…) or default to /app.
const backTo = computed(() => (typeof route.query.from === 'string' ? route.query.from : '/app'))

const fullUserName = computed(() => user.value?.name || '')

const copied = ref(false)
const dropOffOpen = ref(false)
const copyAddress = async () => {
  const text = `BOXLY ${fullUserName.value}\n157 Virginia Ave Suite 835\nSan Ysidro, CA 92173`
  try {
    await navigator.clipboard.writeText(text)
    copied.value = true
    $toast.success(t.value.copied)
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    $toast.error('No se pudo copiar')
  }
}

const t = createTranslations({
  back: { es: 'Volver', en: 'Back' },
  title: { es: 'Tu dirección en USA', en: 'Your US address' },
  subtitle: { es: 'Usa esta dirección al comprar en tiendas de Estados Unidos. Nosotros recibimos tus paquetes y los enviamos a México.', en: 'Use this address when you shop at US stores. We receive your packages and ship them to Mexico.' },
  onlineShoppingAddress: { es: 'Dirección para compras en línea', en: 'Online shopping address' },
  onlineHint: { es: 'Esta es la dirección que debes usar al comprar en tiendas de USA.', en: 'This is the address to use when you shop at US stores.' },
  copyAddress: { es: 'Copiar dirección', en: 'Copy address' },
  copied: { es: '¡Copiado!', en: 'Copied!' },
  dropOffQuestion: { es: '¿Quieres entregar productos en persona?', en: 'Want to drop off products in person?' },
  dropOffSub: { es: 'Solo con cita previa en San Diego', en: 'By appointment only, in San Diego' },
  dropOffExclusive: { es: 'Esta dirección es exclusivamente para entregas presenciales. No la uses para compras en línea.', en: 'This address is only for in-person drop-offs. Do not use it for online orders.' },
  dropOffScheduleWhatsApp: { es: 'Agendar cita por WhatsApp', en: 'Schedule via WhatsApp' },
  dropOffNoWalkIns: { es: 'No se aceptan entregas sin cita previa.', en: 'No drop-offs without an appointment.' },
  dropOffViewOnMaps: { es: 'Ver en Google Maps', en: 'View on Google Maps' },
  nextStepTitle: { es: '¿Ya hiciste la compra de tus productos? Ahora crea tu envío.', en: 'Already bought your products? Now create your shipment.' },
  nextStepDesc: { es: 'Crea tu envío para que sepamos qué esperar y enviártelo a México.', en: 'Create your shipment so we know what to expect and ship it to you in Mexico.' },
  createOrder: { es: 'Crear envío', en: 'Create shipment' },
})
</script>
