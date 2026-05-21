<template>
  <!-- Shipping calculator. User enters package weight + 3 dimensions in
       cm, we match against the box tier table and show the matching
       size + price. Algorithm sorts both user and box dims ascending so
       rotation orientations are considered automatically — a 50×10×10
       item still fits in a 32×24×13 box because we check 10≤13, 10≤24,
       50≤32 (which fails, bumping to a larger size).

       Estimate-only — copy explicitly notes the final quote is at
       receipt in San Diego. -->
  <TransitionRoot as="template" :show="modelValue">
    <Dialog as="div" class="relative z-50" @close="$emit('update:modelValue', false)">
      <TransitionChild
        as="template"
        enter="ease-out duration-200"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="ease-in duration-150"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4">
          <TransitionChild
            as="template"
            enter="ease-out duration-200"
            enter-from="opacity-0 translate-y-4 sm:scale-95"
            enter-to="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-150"
            leave-from="opacity-100"
            leave-to="opacity-0"
          >
            <DialogPanel class="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">
              <!-- Header -->
              <div class="px-6 py-5 border-b border-gray-100 flex items-start justify-between gap-3">
                <div>
                  <h3 class="text-lg sm:text-xl font-extrabold text-gray-900 tracking-tight">{{ t.title }}</h3>
                  <p class="text-xs sm:text-sm text-gray-500 mt-1">{{ t.subtitle }}</p>
                </div>
                <button
                  type="button"
                  @click="$emit('update:modelValue', false)"
                  class="p-2 -mr-2 rounded-full hover:bg-gray-100 text-gray-500 flex-shrink-0"
                  :aria-label="t.close"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>

              <!-- Body -->
              <div class="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                <!-- Inputs -->
                <div>
                  <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">{{ t.weight }}</label>
                  <div class="relative">
                    <input
                      v-model.number="weight"
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="0"
                      class="w-full px-4 py-3 pr-12 rounded-xl border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none text-base"
                    >
                    <span class="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">kg</span>
                  </div>
                </div>

                <div>
                  <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">{{ t.dimensions }}</label>
                  <div class="grid grid-cols-3 gap-2">
                    <div v-for="(label, key) in dimLabels" :key="key" class="relative">
                      <input
                        v-model.number="dims[key]"
                        type="number"
                        min="0"
                        step="0.1"
                        :placeholder="label"
                        class="w-full px-3 py-3 pr-10 rounded-xl border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none text-base"
                      >
                      <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400">cm</span>
                    </div>
                  </div>
                  <p class="text-[11px] text-gray-400 mt-1.5">{{ t.dimensionsHint }}</p>
                </div>

                <!-- Result -->
                <div v-if="result" class="border-t border-gray-100 pt-5">
                  <div v-if="result.box" class="rounded-2xl bg-primary-50 border border-primary-100 p-5">
                    <div class="flex items-center gap-2 text-sm font-semibold text-primary-700">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                      {{ t.fitsLabel }}
                    </div>
                    <div class="mt-3 flex items-baseline gap-3">
                      <span class="text-3xl font-extrabold text-gray-900">{{ result.box.size }}</span>
                      <span v-if="result.box.size === 'M'" class="px-2 py-0.5 rounded-full bg-primary-600 text-white text-[10px] font-bold uppercase tracking-wider">{{ t.popular }}</span>
                    </div>
                    <div class="mt-1 text-sm text-gray-600">
                      {{ result.box.dimensions }} · {{ t.upTo }} {{ result.box.maxKg }} kg
                    </div>
                    <div class="mt-3 pt-3 border-t border-primary-200/60">
                      <div class="flex items-baseline justify-between">
                        <span class="text-xs uppercase tracking-wider font-semibold text-primary-700">{{ t.estimate }}</span>
                        <span class="text-2xl font-extrabold text-gray-900">${{ result.box.priceMxn.toLocaleString('es-MX') }} <span class="text-sm font-medium text-gray-500">MXN</span></span>
                      </div>
                    </div>
                  </div>
                  <div v-else class="rounded-2xl bg-amber-50 border border-amber-200 p-5">
                    <div class="flex items-start gap-3">
                      <svg class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                      <div>
                        <p class="text-sm font-semibold text-amber-900">{{ t.noFitTitle }}</p>
                        <p class="text-xs text-amber-800 mt-1 leading-relaxed">{{ t.noFitDesc }}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Disclaimer -->
                <div class="rounded-xl bg-gray-50 border border-gray-200 p-4 flex gap-3 items-start">
                  <svg class="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  <p class="text-[11px] text-gray-600 leading-relaxed">
                    {{ t.disclaimer }}
                  </p>
                </div>

                <!-- Quick reference table -->
                <details class="rounded-xl border border-gray-200 overflow-hidden">
                  <summary class="px-4 py-3 text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-50 select-none">{{ t.allSizes }}</summary>
                  <table class="w-full text-xs">
                    <thead class="bg-gray-50 text-gray-500 uppercase tracking-wider">
                      <tr>
                        <th class="px-3 py-2 text-left">{{ t.size }}</th>
                        <th class="px-3 py-2 text-left">{{ t.dimensions }}</th>
                        <th class="px-3 py-2 text-left">{{ t.maxKg }}</th>
                        <th class="px-3 py-2 text-right">{{ t.price }}</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100">
                      <tr v-for="b in BOXES" :key="b.size" :class="result?.box?.size === b.size ? 'bg-primary-50' : ''">
                        <td class="px-3 py-2 font-bold text-gray-900">{{ b.size }}</td>
                        <td class="px-3 py-2 text-gray-600">{{ b.dimensions }}</td>
                        <td class="px-3 py-2 text-gray-600">{{ b.maxKg }} kg</td>
                        <td class="px-3 py-2 text-right font-semibold text-gray-900">${{ b.priceMxn.toLocaleString('es-MX') }}</td>
                      </tr>
                    </tbody>
                  </table>
                </details>
              </div>

              <!-- Footer CTA -->
              <div class="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3">
                <button
                  type="button"
                  @click="$emit('update:modelValue', false)"
                  class="text-sm font-semibold text-gray-600 hover:text-gray-900"
                >{{ t.close }}</button>
                <NuxtLink
                  to="/register"
                  class="inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-full text-sm transition-colors"
                >
                  {{ t.cta }}
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
                </NuxtLink>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { Dialog, DialogPanel, TransitionChild, TransitionRoot } from '@headlessui/vue'

defineProps({
  modelValue: { type: Boolean, default: false },
})
defineEmits(['update:modelValue'])

const { t: createTranslations } = useLanguage()

const t = createTranslations({
  title:          { es: 'Calculadora de envío', en: 'Shipping calculator' },
  subtitle:       { es: 'Estima cuánto te costará enviar tu paquete a México.', en: 'Estimate the cost of shipping your package to Mexico.' },
  weight:         { es: 'Peso del paquete', en: 'Package weight' },
  dimensions:     { es: 'Dimensiones', en: 'Dimensions' },
  dimensionsHint: { es: 'Largo × Ancho × Alto (cm)', en: 'Length × Width × Height (cm)' },
  fitsLabel:      { es: 'Tu paquete cabe en una caja', en: 'Your package fits in a' },
  noFitTitle:     { es: 'Excede nuestros tamaños estándar', en: 'Exceeds our standard sizes' },
  noFitDesc:      { es: 'No te preocupes — escríbenos por WhatsApp y cotizamos un envío especial.', en: "Don't worry — message us on WhatsApp and we'll quote a custom shipment." },
  estimate:       { es: 'Estimado', en: 'Estimate' },
  popular:        { es: 'Más popular', en: 'Most popular' },
  upTo:           { es: 'hasta', en: 'up to' },
  disclaimer:     { es: 'Este monto es un estimado basado en los datos que ingresaste. Tu cotización final se determina cuando recibimos físicamente todos tus productos en nuestra bodega en San Diego.', en: 'This is an estimate based on the details you entered. Your final quote is determined once we physically receive all your products at our San Diego warehouse.' },
  allSizes:       { es: 'Ver todas las tallas y precios', en: 'See all sizes and prices' },
  size:           { es: 'Caja', en: 'Box' },
  maxKg:          { es: 'Peso máx', en: 'Max weight' },
  price:          { es: 'Precio', en: 'Price' },
  close:          { es: 'Cerrar', en: 'Close' },
  cta:            { es: 'Crear mi cuenta', en: 'Create my account' },
})

const dimLabels = computed(() => ({
  length: 'L',
  width:  'A',
  height: 'H',
}))

const weight = ref(null)
const dims = reactive({ length: null, width: null, height: null })

// Box tiers — single source of truth here. If pricing changes, update
// the same list on the landing's BoxPricing component too.
const BOXES = [
  { size: 'XS', dims: [32, 24, 13], maxKg: 8,  priceMxn: 1200, dimensions: '32×24×13 cm' },
  { size: 'S',  dims: [42, 27, 32], maxKg: 15, priceMxn: 2200, dimensions: '42×27×32 cm' },
  { size: 'M',  dims: [42, 52, 40], maxKg: 25, priceMxn: 4000, dimensions: '42×52×40 cm' },
  { size: 'L',  dims: [52, 42, 40], maxKg: 35, priceMxn: 5100, dimensions: '52×42×40 cm' },
  { size: 'XL', dims: [52, 62, 53], maxKg: 50, priceMxn: 6250, dimensions: '52×62×53 cm' },
]

// Calculate matching box: sort both user dims and box dims ascending so
// rotation is automatic (a long-thin item that doesn't fit in standard
// orientation might fit rotated). Picks the smallest box that fits.
const result = computed(() => {
  const w = Number(weight.value)
  const userDims = [Number(dims.length), Number(dims.width), Number(dims.height)]

  // All inputs must be present + positive to even attempt a match.
  if (!w || w <= 0 || userDims.some((d) => !d || d <= 0)) return null

  const sortedUser = [...userDims].sort((a, b) => a - b)

  for (const box of BOXES) {
    if (w > box.maxKg) continue
    const sortedBox = [...box.dims].sort((a, b) => a - b)
    const fits = sortedUser.every((d, i) => d <= sortedBox[i])
    if (fits) return { box }
  }

  return { box: null }
})
</script>
