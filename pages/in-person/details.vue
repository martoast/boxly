<template>
  <!-- Step 3: minimum budget, per-store category interests, wishlist, notes.
       Budget is the only required input. Categories are picked PER STORE
       (Nike → Sneakers; Coach → Bags) so the shopper has a clear scope
       once they're at the mall instead of one generic mixed list. -->
  <section class="min-h-screen bg-gray-50 pb-32">
    <div class="bg-white border-b border-gray-200">
      <div class="max-w-3xl mx-auto px-4 py-5">
        <div class="flex items-start gap-3 mb-5">
          <NuxtLink to="/in-person/stores" class="p-2 -ml-2 hover:bg-gray-100 rounded-lg" :aria-label="t.back">
            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
          </NuxtLink>
          <div class="flex-1 min-w-0">
            <h1 class="text-xl font-bold text-gray-900">{{ t.title }}</h1>
            <p class="text-sm text-gray-500 mt-0.5">{{ t.subtitle }}</p>
          </div>
        </div>
        <InPersonStepper :current="3" :steps="stepLabels" />
      </div>
    </div>

    <div class="max-w-3xl mx-auto px-4 py-5 space-y-4">
      <!-- Budget -->
      <div class="bg-white rounded-2xl border border-gray-200 p-5">
        <label class="block text-sm font-semibold text-gray-900 mb-1">{{ t.budgetLabel }} <span class="text-red-500">*</span></label>
        <p class="text-xs text-gray-500 mb-3">{{ t.budgetHint }}</p>
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 font-bold">$</div>
          <input
            :value="minimumBudgetUsd"
            @input="setBudget($event.target.value ? Number($event.target.value) : null)"
            type="number"
            min="1"
            step="1"
            placeholder="500"
            class="pl-7 pr-16 w-full rounded-xl border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 py-3 text-lg font-semibold"
          >
          <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-500 text-sm">USD</div>
        </div>
      </div>

      <!-- Per-store categories -->
      <div class="bg-white rounded-2xl border border-gray-200 p-5">
        <label class="block text-sm font-semibold text-gray-900 mb-1">{{ t.categoriesLabel }} <span class="text-gray-400 font-normal text-xs">({{ t.optional }})</span></label>
        <p class="text-xs text-gray-500 mb-3">{{ t.categoriesHint }}</p>

        <div v-if="loading" class="text-sm text-gray-400">{{ t.loading }}</div>
        <div v-else-if="selectedStores.length === 0" class="text-sm text-gray-500 italic">{{ t.noStores }}</div>
        <div v-else class="space-y-2.5">
          <div
            v-for="store in selectedStores"
            :key="store.id"
            class="border border-gray-200 rounded-xl p-3"
          >
            <div class="flex items-center gap-2.5 mb-2.5">
              <div class="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 font-semibold text-sm flex-shrink-0">{{ store.name.charAt(0).toUpperCase() }}</div>
              <div class="font-semibold text-gray-900 text-sm leading-tight flex-1 min-w-0">{{ store.name }}</div>
              <div v-if="categoriesForStore(store.id).length > 0" class="text-[10px] uppercase tracking-wider font-semibold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full">
                {{ categoriesForStore(store.id).length }}
              </div>
            </div>
            <div v-if="categories.length === 0" class="text-xs text-gray-400 italic">{{ t.noCategories }}</div>
            <div v-else class="flex flex-wrap gap-1.5">
              <button
                v-for="cat in categories"
                :key="cat.id"
                type="button"
                @click="toggleStoreCategory(store.id, cat.id)"
                :class="[
                  'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                  categoriesForStore(store.id).includes(cat.id)
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-primary-400'
                ]"
              >{{ cat.name }}</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Wishlist -->
      <div class="bg-white rounded-2xl border border-gray-200 p-5">
        <label class="block text-sm font-semibold text-gray-900 mb-1">{{ t.wishlistLabel }} <span class="text-gray-400 font-normal text-xs">({{ t.optional }})</span></label>
        <p class="text-xs text-gray-500 mb-3">{{ t.wishlistHint }}</p>

        <div v-if="wishlist.length > 0" class="space-y-2 mb-3">
          <div
            v-for="(item, i) in wishlist"
            :key="i"
            class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
          >
            <div class="w-10 h-10 rounded-md bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
              <img v-if="item.imagePreview || item.product_image_url" :src="item.imagePreview || item.product_image_url" class="w-full h-full object-cover">
              <svg v-else class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01"/></svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium text-gray-900 truncate">{{ item.product_name }}</div>
              <div v-if="item.product_url" class="text-xs text-primary-600 truncate">{{ shortUrl(item.product_url) }}</div>
              <div v-if="item.notes" class="text-xs text-gray-500 italic mt-1">"{{ item.notes }}"</div>
            </div>
            <button @click="removeWishlistItem(i)" class="p-1 text-gray-400 hover:text-red-500" :aria-label="t.remove">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        <div v-if="showAddForm" class="border border-primary-200 bg-primary-50/40 rounded-xl p-4 space-y-3">
          <input v-model="draft.product_name" type="text" :placeholder="t.draftName" class="w-full rounded-lg border-gray-300 text-sm py-2.5">
          <input v-model="draft.product_url" type="text" :placeholder="t.draftUrl" class="w-full rounded-lg border-gray-300 text-sm py-2.5">
          <textarea v-model="draft.notes" rows="2" :placeholder="t.draftNotes" class="w-full rounded-lg border-gray-300 text-sm py-2.5"></textarea>
          <div class="flex items-center gap-3">
            <label class="cursor-pointer text-xs text-primary-700 font-medium hover:underline">
              <input type="file" accept="image/*" class="hidden" @change="handleImage">
              📎 {{ draft.image ? t.imagePicked : t.addImage }}
            </label>
            <div v-if="draft.imagePreview" class="flex items-center gap-2">
              <img :src="draft.imagePreview" class="w-10 h-10 rounded object-cover">
              <button type="button" @click="clearDraftImage" class="text-xs text-red-500">×</button>
            </div>
          </div>
          <div class="flex gap-2">
            <button @click="cancelDraft" class="flex-1 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">{{ t.cancel }}</button>
            <button
              @click="saveDraft"
              :disabled="!draft.product_name"
              class="flex-1 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50"
            >{{ t.saveItem }}</button>
          </div>
        </div>

        <button
          v-else
          @click="openAdd"
          class="w-full py-3 border-2 border-dashed border-gray-300 hover:border-primary-400 hover:bg-primary-50/30 rounded-xl text-sm font-medium text-gray-600 transition-colors"
        >+ {{ wishlist.length === 0 ? t.addFirst : t.addAnother }}</button>
      </div>

      <!-- Notes -->
      <div class="bg-white rounded-2xl border border-gray-200 p-5">
        <label class="block text-sm font-semibold text-gray-900 mb-1">{{ t.notesLabel }} <span class="text-gray-400 font-normal text-xs">({{ t.optional }})</span></label>
        <p class="text-xs text-gray-500 mb-3">{{ t.notesHint }}</p>
        <textarea
          :value="customerNotes"
          @input="setNotes($event.target.value)"
          rows="4"
          :placeholder="t.notesPlaceholder"
          class="w-full rounded-xl border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 py-3 text-sm"
        ></textarea>
      </div>
    </div>

    <div class="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 px-4 py-3.5 shadow-[0_-4px_12px_rgba(0,0,0,0.04)]">
      <div class="max-w-3xl mx-auto">
        <NuxtLink
          v-if="canContinue"
          to="/in-person/review"
          class="w-full inline-flex items-center justify-center gap-2 py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors"
        >
          {{ t.continue }}
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
        </NuxtLink>
        <button v-else disabled class="w-full py-3.5 bg-gray-100 text-gray-400 font-semibold rounded-xl cursor-not-allowed">{{ t.budgetRequired }}</button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'

definePageMeta({
  layout: 'default',
  middleware: ['auth', 'customer', 'complete-profile'],
})

const { $customFetch } = useNuxtApp()
const { t: createTranslations, language } = useLanguage()
const router = useRouter()
const {
  selectedTrip, selectedStoreIds, minimumBudgetUsd, customerNotes, wishlist,
  setBudget, setNotes, toggleStoreCategory, categoriesForStore,
  addWishlistItem, removeWishlistItem,
} = useInPersonRequest()

const t = createTranslations({
  back:            { es: 'Volver', en: 'Back' },
  title:           { es: '¿Qué estás buscando?', en: "What are you looking for?" },
  subtitle:        { es: 'Cuéntanos más para que sepamos qué buscar en cada tienda.', en: "Tell us what to look for at each store." },
  budgetLabel:     { es: 'Presupuesto mínimo', en: 'Minimum budget' },
  budgetHint:      { es: 'Aproximado de cuánto estás dispuesto a gastar en mercancía (USD).', en: "Roughly how much you're willing to spend on merchandise (USD)." },
  categoriesLabel: { es: 'Categorías por tienda', en: 'Categories per store' },
  categoriesHint:  { es: 'Marca lo que te interesa en cada tienda — así sabemos qué buscar.', en: 'Tap what interests you at each store — that\'s what we\'ll focus on.' },
  noStores:        { es: 'Vuelve atrás y elige al menos una tienda.', en: 'Go back and pick at least one store.' },
  noCategories:    { es: 'Sin categorías disponibles', en: 'No categories available' },
  wishlistLabel:   { es: 'Productos específicos', en: 'Specific products' },
  wishlistHint:    { es: 'Si tienes algo en mente, agrégalo. Si no, déjanos elegir buenas ofertas.', en: "Got something specific in mind? Add it. Otherwise, leave it to us to find good deals." },
  notesLabel:      { es: 'Notas para el equipo', en: 'Notes for the team' },
  notesHint:       { es: 'Tallas, colores, marcas favoritas, lo que sea útil.', en: 'Sizes, colors, favorite brands, anything useful.' },
  notesPlaceholder:{ es: 'Ej: Talla M en playeras, no me gustan los logos grandes…', en: 'Ex: Size M in tees, no big logos…' },
  optional:        { es: 'opcional', en: 'optional' },
  remove:          { es: 'Eliminar', en: 'Remove' },
  addFirst:        { es: 'Agregar producto específico', en: 'Add specific product' },
  addAnother:      { es: 'Agregar otro', en: 'Add another' },
  draftName:       { es: 'Nombre del producto (obligatorio)', en: 'Product name (required)' },
  draftUrl:        { es: 'Link de referencia (opcional)', en: 'Reference link (optional)' },
  draftNotes:      { es: 'Notas: talla, color, etc.', en: 'Notes: size, color, etc.' },
  addImage:        { es: 'Adjuntar imagen', en: 'Attach image' },
  imagePicked:     { es: 'Imagen adjunta', en: 'Image attached' },
  cancel:          { es: 'Cancelar', en: 'Cancel' },
  saveItem:        { es: 'Guardar', en: 'Save' },
  loading:         { es: 'Cargando…', en: 'Loading…' },
  continue:        { es: 'Revisar y enviar', en: 'Review and submit' },
  budgetRequired:  { es: 'Ingresa un presupuesto para continuar', en: 'Enter a budget to continue' },
})

const stepLabels = computed(() => [
  language.value === 'es' ? 'Fecha' : 'Date',
  language.value === 'es' ? 'Tiendas' : 'Stores',
  language.value === 'es' ? 'Detalles' : 'Details',
  language.value === 'es' ? 'Revisar' : 'Review',
])

const categories = ref([])
const allStores = ref([])
const loading = ref(true)

const showAddForm = ref(false)
const blankDraft = () => ({
  product_name: '',
  product_url: '',
  product_image_url: '',
  notes: '',
  options: {},
  quantity: 1,
  image: null,
  imagePreview: null,
})
const draft = reactive(blankDraft())

const canContinue = computed(() => minimumBudgetUsd.value !== null && minimumBudgetUsd.value > 0)
const selectedStores = computed(() => allStores.value.filter((s) => selectedStoreIds.value.includes(s.id)))

function openAdd() {
  Object.assign(draft, blankDraft())
  showAddForm.value = true
}

function cancelDraft() {
  showAddForm.value = false
  Object.assign(draft, blankDraft())
}

function handleImage(e) {
  const file = e.target.files?.[0]
  if (!file) return
  draft.image = file
  draft.imagePreview = URL.createObjectURL(file)
}

function clearDraftImage() {
  draft.image = null
  draft.imagePreview = null
}

function saveDraft() {
  if (!draft.product_name) return
  addWishlistItem({ ...draft })
  showAddForm.value = false
  Object.assign(draft, blankDraft())
}

function shortUrl(url) {
  try {
    const u = new URL(url.startsWith('http') ? url : 'https://' + url)
    return u.hostname.replace('www.', '')
  } catch {
    return url.slice(0, 40)
  }
}

onMounted(async () => {
  // This step has been removed — redirect to review.
  return router.replace('/in-person/review')

  try {
    const [catsRes, storesRes] = await Promise.all([
      $customFetch('/shopping-trips/categories'),
      $customFetch('/shopping-trips/in-person-stores'),
    ])
    categories.value = catsRes?.data ?? catsRes ?? []
    allStores.value = storesRes?.data?.stores ?? []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})
</script>
