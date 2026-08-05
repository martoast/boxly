<!--
  Boxly Protection — the optional per-box add-on, shown on /precios and the
  landing page.

  The price comes live from Stripe (useProtectionPrice), never hardcoded, for
  the same reason the box price table does: what the site quotes has to be what
  Stripe charges. The coverage cap is a Terms-of-Service number, not a price,
  so it is a constant in the composable.
-->
<template>
  <section class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="rounded-3xl border border-emerald-200 bg-emerald-50/60 p-6 sm:p-8">
      <div class="flex flex-col sm:flex-row sm:items-start gap-5">
        <div class="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-2xl shrink-0">
          🛡️
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 class="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">{{ t.title }}</h2>
            <span class="text-sm font-semibold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              {{ t.optional }}
            </span>
          </div>

          <p class="text-gray-700 mt-2 leading-relaxed">{{ t.body }}</p>

          <div class="mt-4 flex flex-wrap items-end gap-x-6 gap-y-2">
            <div>
              <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ t.priceLabel }}</p>
              <p class="text-2xl font-extrabold text-gray-900">
                ${{ price.toLocaleString('es-MX') }} <span class="text-base font-bold text-gray-500">MXN</span>
                <span class="text-sm font-semibold text-gray-500"> / {{ t.perBox }}</span>
              </p>
            </div>
            <div>
              <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ t.coverLabel }}</p>
              <p class="text-2xl font-extrabold text-gray-900">
                ${{ cap.toLocaleString('es-MX') }} <span class="text-base font-bold text-gray-500">MXN</span>
              </p>
            </div>
          </div>

          <ul class="mt-4 space-y-1.5">
            <li v-for="point in points" :key="point" class="flex items-start gap-2 text-sm text-gray-700">
              <svg class="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
              </svg>
              <span>{{ point }}</span>
            </li>
          </ul>

          <p class="text-xs text-gray-500 mt-4">
            {{ t.legal }}
            <NuxtLink to="/terms-of-service" class="text-emerald-700 font-semibold underline underline-offset-2">
              {{ t.legalLink }}
            </NuxtLink>
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
const { t: createTranslations, language } = useLanguage()
const { price, load, cap } = useProtectionPrice()

const t = createTranslations({
  title:      { es: 'Boxly Protection', en: 'Boxly Protection' },
  optional:   { es: 'Opcional', en: 'Optional' },
  body: {
    es: 'Protege el contenido de tu caja contra robo, pérdida o daño verificados. Se agrega por caja, así que puedes proteger solo el envío que lo necesita.',
    en: 'Protects the contents of your box against verified theft, loss, or damage. Added per box, so you can protect only the shipment that needs it.',
  },
  priceLabel: { es: 'Precio', en: 'Price' },
  perBox:     { es: 'caja', en: 'box' },
  coverLabel: { es: 'Reembolso máximo por caja', en: 'Maximum reimbursement per box' },
  legal: {
    es: 'No es un seguro. Aplican requisitos de comprobación y exclusiones —',
    en: 'This is not insurance. Proof requirements and exclusions apply —',
  },
  legalLink:  { es: 'consulta los Términos de Servicio.', en: 'see the Terms of Service.' },
})

const pointsByLang = {
  es: [
    'Reembolsamos el valor de compra documentado de los artículos afectados.',
    'Se agrega caja por caja al momento de armar tu envío.',
    'Cubre el tiempo bajo nuestra custodia y el tránsito que coordinamos.',
  ],
  en: [
    'We reimburse the documented purchase value of the affected items.',
    'Added box by box when your shipment is put together.',
    'Covers time in our custody and the transit we coordinate.',
  ],
}

const points = computed(() => pointsByLang[language.value] ?? pointsByLang.es)

onMounted(load)
</script>
