<template>
  <section class="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/20">
    <!-- Header -->
    <div class="bg-white/90 backdrop-blur-sm shadow-sm border-b border-gray-100">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <NuxtLink :to="backTo" class="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors mb-3">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
          {{ t.back }}
        </NuxtLink>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-900">{{ t.title }}</h1>
        <p class="mt-2 text-gray-600">{{ t.subtitle }}</p>
      </div>
    </div>

    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      <!-- 1. Addresses — two clearly-labeled options side by side on desktop. -->
      <div>
        <h2 class="text-base sm:text-lg font-bold text-gray-900 mb-3 px-1">{{ t.addressesHeading }}</h2>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <!-- Online Shopping Address -->
          <div class="bg-white rounded-2xl border border-gray-200 p-6 sm:p-7 flex flex-col">
            <div class="flex items-center gap-2 mb-3">
              <span class="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-primary-50 text-primary-600">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
              </span>
              <p class="text-[11px] font-bold uppercase tracking-widest text-primary-700">{{ t.onlineShoppingAddress }}</p>
            </div>
            <div class="space-y-1 text-[15px]">
              <p class="font-semibold text-gray-900">BOXLY {{ fullUserName }}</p>
              <p class="text-gray-700">157 Virginia Ave Suite 835</p>
              <p class="text-gray-700">San Ysidro, CA 92173</p>
            </div>
            <button
              type="button"
              @click="copyAddress"
              class="mt-auto pt-5 self-start"
            >
              <span class="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-colors">
                <svg v-if="!copied" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                {{ copied ? t.copied : t.copyAddress }}
              </span>
            </button>
          </div>

          <!-- Drop-off Address (in-person delivery) -->
          <div class="bg-white rounded-2xl border border-gray-200 p-6 sm:p-7 flex flex-col">
            <div class="flex items-center gap-2 mb-3">
              <span class="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-50 text-amber-600">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              </span>
              <p class="text-[11px] font-bold uppercase tracking-widest text-amber-700">{{ t.dropOffAddressLabel }}</p>
            </div>
            <div class="space-y-1 text-[15px]">
              <p class="text-gray-700">482 W San Ysidro Blvd # 2</p>
              <p class="text-gray-700">San Diego, CA 92173, United States</p>
            </div>
            <p class="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              {{ t.dropOffAppointmentRequired }}
            </p>
            <div class="mt-auto pt-4 flex flex-col gap-2">
              <a
                href="https://wa.me/16195591910?text=Hola!+Quiero+agendar+una+entrega+en+persona"
                target="_blank"
                rel="noopener"
                class="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-green-500 text-white text-sm font-semibold rounded-xl hover:bg-green-600 transition-colors"
              >
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                {{ t.dropOffScheduleWhatsApp }}
              </a>
              <a
                href="https://maps.app.goo.gl/PLMDQsGLY98zN5Y19"
                target="_blank"
                rel="noopener"
                class="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-white text-gray-700 text-sm font-semibold rounded-xl border border-gray-300 hover:bg-gray-100 transition-colors"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                {{ t.dropOffViewOnMaps }}
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. Primary CTA — once their packages are on the way, they create the envío. -->
      <div class="bg-gradient-to-r from-primary-50 to-white rounded-2xl border border-primary-100 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div class="min-w-0">
          <h3 class="text-lg font-bold text-gray-900">{{ t.nextStepTitle }}</h3>
          <p class="text-sm text-gray-600 mt-1">{{ t.nextStepDesc }}</p>
        </div>
        <NuxtLink
          to="/app/orders/create"
          class="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors shadow-sm flex-shrink-0"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
          {{ t.createOrder }}
        </NuxtLink>
      </div>

      <!-- 3. Tutorial video — sits at the bottom as a helper for customers who need a walkthrough. -->
      <div class="relative w-full max-w-2xl mx-auto rounded-xl overflow-hidden shadow-sm bg-black" style="aspect-ratio: 16 / 9">
        <iframe
          src="https://www.loom.com/embed/34cef0546fd64ca3bf8f11fa89c156cc"
          frameborder="0"
          allowfullscreen
          allow="autoplay; fullscreen; picture-in-picture"
          class="absolute inset-0 w-full h-full"
        ></iframe>
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
  title: { es: 'Tu casillero en USA', en: 'Your US locker' },
  subtitle: { es: 'Compra en cualquier tienda de Estados Unidos y envía a estas direcciones. Nosotros recibimos por ti y enviamos a México.', en: 'Shop from any US store and ship to these addresses. We receive the packages for you and ship them to Mexico.' },
  videoTitle: { es: 'Mira cómo funciona', en: 'See how it works' },
  videoSubtitle: { es: 'Aprende el proceso completo en menos de 3 minutos.', en: 'Learn the full process in under 3 minutes.' },
  addressesHeading: { es: 'Tus direcciones', en: 'Your addresses' },
  onlineShoppingAddress: { es: 'Dirección para compras en línea', en: 'Online shopping address' },
  copyAddress: { es: 'Copiar dirección', en: 'Copy address' },
  copied: { es: '¡Copiado!', en: 'Copied!' },
  dropOffAddressLabel: { es: 'Dirección para entrega en persona (San Diego)', en: 'In-person drop-off address (San Diego)' },
  dropOffAppointmentRequired: { es: 'Debes agendar una cita antes de presentarte. No se aceptan entregas sin cita previa.', en: 'You must schedule an appointment before arriving. Drop-offs without appointment are not accepted.' },
  dropOffScheduleWhatsApp: { es: 'Agendar cita por WhatsApp', en: 'Schedule via WhatsApp' },
  dropOffViewOnMaps: { es: 'Ver en Google Maps', en: 'View on Google Maps' },
  nextStepTitle: { es: '¿Ya hiciste la compra de tus productos? Ahora crea tu envío.', en: 'Already bought your products? Now create your shipment.' },
  nextStepDesc: { es: 'Crea tu envío para que sepamos qué esperar y enviártelo a México.', en: 'Create your shipment so we know what to expect and ship it to you in Mexico.' },
  createOrder: { es: 'Crear envío', en: 'Create shipment' },
})
</script>
