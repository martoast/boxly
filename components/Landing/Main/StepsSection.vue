<template>
  <!-- 3-step explainer — Apple-clean. Each step is a soft-tinted square
       containing a proper Heroicon, with a numbered chip floating in the
       top-left corner. No hand-rolled SVG paths, no broken house/truck
       hybrid icon. Title + description below in tight hierarchy. -->
  <section class="bg-white py-14 sm:py-20 lg:py-24">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
        <p class="text-xs sm:text-sm font-semibold text-primary-600 uppercase tracking-wider mb-2">{{ t.eyebrow }}</p>
        <h2 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight">{{ t.title }}</h2>
        <p class="text-sm sm:text-base text-gray-600 mt-3 leading-relaxed">{{ t.subtitle }}</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-6 lg:gap-10">
        <div
          v-for="(step, i) in steps"
          :key="i"
          class="text-center sm:text-left"
        >
          <!-- Icon tile with floating step number -->
          <div class="relative inline-flex">
            <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center">
              <component :is="step.icon" class="w-8 h-8 sm:w-10 sm:h-10" />
            </div>
            <span class="absolute -top-2 -right-2 inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-900 text-white text-xs font-bold ring-4 ring-white">{{ i + 1 }}</span>
          </div>

          <h3 class="mt-6 text-lg sm:text-xl font-bold text-gray-900 tracking-tight">{{ step.title }}</h3>
          <p class="mt-2 text-sm sm:text-[15px] text-gray-500 leading-relaxed max-w-xs sm:max-w-none mx-auto sm:mx-0">{{ step.desc }}</p>
        </div>
      </div>

      <p class="text-center text-xs sm:text-sm text-gray-400 mt-14 max-w-xl mx-auto">
        {{ t.disclaimer }}
      </p>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { ShoppingBagIcon, ArchiveBoxIcon, TruckIcon } from '@heroicons/vue/24/outline'

const { t: createTranslations } = useLanguage()

const t = createTranslations({
  eyebrow:    { es: 'Así funciona', en: 'How it works' },
  title:      { es: 'Compra en USA, recibe en México', en: 'Shop in the US, receive in Mexico' },
  subtitle:   { es: 'Sin tarjetas bloqueadas. Sin envíos imposibles. Sin sorpresas en aduana.', en: 'No blocked cards. No impossible shipping. No customs surprises.' },
  step1Title: { es: 'Elige cómo comprar', en: 'Pick how you shop' },
  step1Desc:  { es: 'Mándanos el link, agenda una visita en persona, o envía a tu casillero BOXLY.', en: 'Send us the link, schedule an in-person visit, or ship to your BOXLY locker.' },
  step2Title: { es: 'Recibimos en San Diego', en: 'We receive in San Diego' },
  step2Desc:  { es: 'Llega a nuestra bodega, te mandamos foto y consolidamos con tus otros paquetes.', en: 'Arrives at our warehouse, we send you photos and consolidate with your other packages.' },
  step3Title: { es: 'Lo enviamos a tu casa', en: 'We ship to your door' },
  step3Desc:  { es: 'Por Estafeta a tu dirección en México con guía y seguimiento.', en: 'Via Estafeta to your address in Mexico with tracking number.' },
  disclaimer: { es: 'Soporte por WhatsApp y fotos en cada etapa.', en: 'WhatsApp support and photos at every stage.' },
})

const steps = computed(() => [
  { icon: ShoppingBagIcon, title: t.value.step1Title, desc: t.value.step1Desc },
  { icon: ArchiveBoxIcon,  title: t.value.step2Title, desc: t.value.step2Desc },
  { icon: TruckIcon,       title: t.value.step3Title, desc: t.value.step3Desc },
])
</script>
