<template>
  <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
    <!-- Header -->
    <div class="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
      <div class="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
        <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      </div>
      <div class="flex-1 min-w-0">
        <h2 class="text-lg font-bold text-gray-900">{{ c.title }}</h2>
        <p class="text-xs text-gray-500">{{ c.subtitle }}</p>
      </div>
      <button
        v-if="!editing && !loading"
        @click="startEdit"
        class="shrink-0 text-sm font-semibold text-primary-600 hover:text-primary-700"
      >{{ c.edit }}</button>
    </div>

    <div class="px-6 py-5">
      <!-- Loading -->
      <div v-if="loading" class="flex items-center gap-2 text-sm text-gray-400 py-4">
        <svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
        {{ c.loading }}
      </div>

      <!-- ===== READ VIEW ===== -->
      <template v-else-if="!editing">
        <p class="text-sm text-gray-600 leading-relaxed mb-4">{{ c.intro }}</p>

        <!-- Shopper type — the flow the assistant optimizes for. -->
        <div v-if="form.shopper_type" class="mb-4">
          <span :class="['inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold', form.shopper_type === 'reseller' ? 'bg-amber-50 text-amber-700' : 'bg-primary-50 text-primary-700']">
            <svg v-if="form.shopper_type === 'reseller'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5a1.99 1.99 0 011.414.586l7 7a2 2 0 010 2.828l-5 5a2 2 0 01-2.828 0l-7-7A2 2 0 014 12V7a4 4 0 014-4z"/></svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
            {{ form.shopper_type === 'reseller' ? c.reseller : c.personal }}
          </span>
        </div>

        <div v-if="isEmpty" class="rounded-xl bg-gray-50 border border-dashed border-gray-200 px-4 py-6 text-center">
          <p class="text-sm text-gray-500">{{ c.emptyTitle }}</p>
          <p class="text-xs text-gray-400 mt-1">{{ c.emptyHint }}</p>
        </div>

        <dl v-else class="space-y-4">
          <div v-if="form.gender">
            <dt class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{{ c.gender }}</dt>
            <dd class="text-sm text-gray-900">{{ genderLabel(form.gender) }}</dd>
          </div>

          <div v-if="sizesForDisplay.length">
            <dt class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">{{ c.sizes }}</dt>
            <dd class="flex flex-wrap gap-1.5">
              <span v-for="s in sizesForDisplay" :key="s.key" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 text-sm text-gray-700">
                <span class="text-gray-400">{{ sizeLabel(s.key) }}:</span> <span class="font-semibold">{{ s.values.join(', ') }}</span>
              </span>
            </dd>
          </div>

          <div v-if="form.favorite_brands.length">
            <dt class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">{{ c.favBrands }}</dt>
            <dd class="flex flex-wrap gap-1.5">
              <span v-for="b in form.favorite_brands" :key="b" class="px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 text-sm font-medium">{{ b }}</span>
            </dd>
          </div>

          <div v-if="form.disliked_brands.length">
            <dt class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">{{ c.dislikedBrands }}</dt>
            <dd class="flex flex-wrap gap-1.5">
              <span v-for="b in form.disliked_brands" :key="b" class="px-2.5 py-1 rounded-full bg-red-50 text-red-600 text-sm font-medium">{{ b }}</span>
            </dd>
          </div>

          <div v-if="form.categories.length">
            <dt class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">{{ c.categories }}</dt>
            <dd class="flex flex-wrap gap-1.5">
              <span v-for="x in form.categories" :key="x" class="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-sm">{{ x }}</span>
            </dd>
          </div>

          <div v-if="form.interests.length">
            <dt class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">{{ c.interests }}</dt>
            <dd class="flex flex-wrap gap-1.5">
              <span v-for="x in form.interests" :key="x" class="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-sm">{{ x }}</span>
            </dd>
          </div>

          <div v-if="form.budget.typical || form.budget.max">
            <dt class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{{ c.budget }}</dt>
            <dd class="text-sm text-gray-900">
              <span v-if="form.budget.typical">{{ c.typical }} ${{ form.budget.typical }}</span>
              <span v-if="form.budget.typical && form.budget.max" class="text-gray-300"> · </span>
              <span v-if="form.budget.max">{{ c.max }} ${{ form.budget.max }}</span>
              <span class="text-xs text-gray-400"> USD</span>
            </dd>
          </div>

          <div v-if="form.style_notes">
            <dt class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{{ c.styleNotes }}</dt>
            <dd class="text-sm text-gray-700 whitespace-pre-wrap">{{ form.style_notes }}</dd>
          </div>
        </dl>

        <p v-if="!isEmpty && updatedAt" class="text-[11px] text-gray-300 mt-4">{{ c.updated }} {{ updatedAt }}</p>
      </template>

      <!-- ===== EDIT VIEW ===== -->
      <template v-else>
        <div class="space-y-5">
          <!-- Shopper type — drives how the assistant helps (and the sizes UI). -->
          <div>
            <label class="block text-xs font-semibold text-gray-500 uppercase mb-1.5">{{ c.forWhom }}</label>
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                @click="form.shopper_type = 'personal'"
                :class="['text-left rounded-xl border p-3 transition-all', form.shopper_type === 'personal' ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-200' : 'border-gray-200 hover:border-gray-300']"
              >
                <span class="block font-semibold text-sm text-gray-900">{{ c.personal }}</span>
                <span class="block text-xs text-gray-500 mt-0.5">{{ c.personalDesc }}</span>
              </button>
              <button
                type="button"
                @click="form.shopper_type = 'reseller'"
                :class="['text-left rounded-xl border p-3 transition-all', form.shopper_type === 'reseller' ? 'border-amber-500 bg-amber-50 ring-1 ring-amber-200' : 'border-gray-200 hover:border-gray-300']"
              >
                <span class="block font-semibold text-sm text-gray-900">{{ c.reseller }}</span>
                <span class="block text-xs text-gray-500 mt-0.5">{{ c.resellerDesc }}</span>
              </button>
            </div>
          </div>

          <!-- Gender -->
          <div>
            <label class="block text-xs font-semibold text-gray-500 uppercase mb-1.5">{{ c.gender }}</label>
            <select v-model="form.gender" class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">{{ c.notSet }}</option>
              <option value="female">{{ c.female }}</option>
              <option value="male">{{ c.male }}</option>
              <option value="unisex">{{ c.unisex }}</option>
            </select>
          </div>

          <!-- Sizes — single value for a personal shopper, a range for a reseller. -->
          <div>
            <label class="block text-xs font-semibold text-gray-500 uppercase mb-1">{{ c.sizes }}</label>
            <p class="text-xs text-gray-400 mb-2">{{ multiSize ? c.sizesHintReseller : c.sizesHintPersonal }}</p>
            <div class="space-y-3">
              <div v-for="(s, i) in form.sizes" :key="i" class="rounded-xl border border-gray-200 p-3" :class="multiSize ? 'space-y-2' : ''">
                <div class="flex items-center gap-2">
                  <input v-model="s.key" :placeholder="c.sizeKeyPh" list="size-keys" class="w-1/3 border border-gray-200 rounded-xl px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  <input v-if="!multiSize" :value="s.values[0] || ''" @input="setSingle(s, $event.target.value)" :placeholder="c.sizeValPhSingle" class="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  <span v-else class="flex-1"></span>
                  <button @click="form.sizes.splice(i, 1)" class="shrink-0 w-9 h-9 grid place-items-center rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50" :aria-label="c.remove">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>
                <TagEditor v-if="multiSize" :placeholder="c.sizeValPh" :add-label="c.add" v-model="s.values" tone="gray" />
              </div>
              <datalist id="size-keys"><option value="shoe" /><option value="tops" /><option value="bottoms" /><option value="dress" /><option value="waist" /></datalist>
              <button @click="form.sizes.push({ key: '', values: [] })" class="text-sm font-semibold text-primary-600 hover:text-primary-700">+ {{ c.addSize }}</button>
            </div>
          </div>

          <!-- Tag lists -->
          <TagEditor :label="c.favBrands" :placeholder="c.brandPh" :add-label="c.add" v-model="form.favorite_brands" tone="primary" />
          <TagEditor :label="c.dislikedBrands" :placeholder="c.brandPh" :add-label="c.add" v-model="form.disliked_brands" tone="red" />
          <TagEditor :label="c.categories" :placeholder="c.catPh" :add-label="c.add" v-model="form.categories" tone="gray" />
          <TagEditor :label="c.interests" :placeholder="c.catPh" :add-label="c.add" v-model="form.interests" tone="gray" />

          <!-- Budget -->
          <div>
            <label class="block text-xs font-semibold text-gray-500 uppercase mb-1.5">{{ c.budget }} (USD)</label>
            <div class="flex items-center gap-2">
              <input v-model="form.budget.typical" type="number" inputmode="decimal" min="0" :placeholder="c.typical" class="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-primary-500" />
              <input v-model="form.budget.max" type="number" inputmode="decimal" min="0" :placeholder="c.max" class="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>

          <!-- Style notes -->
          <div>
            <label class="block text-xs font-semibold text-gray-500 uppercase mb-1.5">{{ c.styleNotes }}</label>
            <textarea v-model="form.style_notes" rows="3" :placeholder="c.stylePh" class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y"></textarea>
          </div>

          <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

          <div class="flex items-center gap-3 pt-1">
            <button @click="save" :disabled="saving" class="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 text-white font-bold rounded-xl transition-colors">
              <svg v-if="saving" class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" /><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
              {{ saving ? c.saving : c.save }}
            </button>
            <button @click="cancel" :disabled="saving" class="text-sm font-semibold text-gray-600 hover:text-gray-900">{{ c.cancel }}</button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
const { $customFetch } = useNuxtApp()
const { language } = useLanguage()

const loading = ref(true)
const editing = ref(false)
const saving = ref(false)
const error = ref('')
const updatedAt = ref('')

// Editable model. Lists are flat arrays; sizes is an array of {key,value} rows
// so they're easy to edit, then re-keyed into an object on save.
const form = reactive({
  shopper_type: '', // '' | 'personal' | 'reseller'
  gender: '',
  sizes: [],
  favorite_brands: [],
  disliked_brands: [],
  categories: [],
  interests: [],
  budget: { typical: '', max: '' },
  style_notes: '',
})

// Only categories that actually have one or more sizes (skip half-filled rows).
const sizesForDisplay = computed(() => form.sizes.filter((s) => s.key && s.values.length))

// Resellers carry a RANGE per category; personal shoppers have one size. Show
// the range (chip) editor for resellers, or if any category already holds >1.
const multiSize = computed(() => form.shopper_type === 'reseller' || form.sizes.some((s) => s.values.length > 1))

const isEmpty = computed(() =>
  !form.shopper_type && !form.gender && !sizesForDisplay.value.length && !form.favorite_brands.length &&
  !form.disliked_brands.length && !form.categories.length && !form.interests.length &&
  !form.budget.typical && !form.budget.max && !form.style_notes
)

function hydrate(p) {
  p = p || {}
  form.shopper_type = p.shopper_type || ''
  form.gender = p.gender || ''
  // Sizes are stored as a list per category (resellers carry a range). Accept a
  // bare string from older profiles and normalize it to a single-item list.
  form.sizes = p.sizes && typeof p.sizes === 'object' && !Array.isArray(p.sizes)
    ? Object.entries(p.sizes).map(([key, value]) => ({
        key,
        values: Array.isArray(value)
          ? value.map((v) => String(v)).filter(Boolean)
          : (value != null && value !== '' ? [String(value)] : []),
      }))
    : []
  form.favorite_brands = Array.isArray(p.favorite_brands) ? [...p.favorite_brands] : []
  form.disliked_brands = Array.isArray(p.disliked_brands) ? [...p.disliked_brands] : []
  form.categories = Array.isArray(p.categories) ? [...p.categories] : []
  form.interests = Array.isArray(p.interests) ? [...p.interests] : []
  form.budget = { typical: p.budget?.typical ?? '', max: p.budget?.max ?? '' }
  form.style_notes = p.style_notes || ''
  updatedAt.value = p.updated_at ? new Date(p.updated_at).toLocaleDateString(language.value === 'en' ? 'en-US' : 'es-MX') : ''
}

async function load() {
  loading.value = true
  try {
    const res = await $customFetch('/me/shopping-profile')
    hydrate(res.data)
  } catch (e) { console.error(e) } finally { loading.value = false }
}

// Personal shoppers have one size per category — bind a single input to a
// 1-item list so storage stays uniform with the reseller range.
function setSingle(s, v) { s.values = v ? [v] : [] }

function startEdit() { editing.value = true; error.value = '' }
function cancel() { editing.value = false; error.value = ''; load() } // discard edits

async function save() {
  error.value = ''
  saving.value = true
  try {
    // Re-key sizes (drop blank rows) and prune empty fields so the stored
    // profile stays clean. replace:true so removals actually persist.
    const sizes = {}
    for (const { key, values } of form.sizes) {
      const k = (key || '').trim()
      const vals = (values || []).map((v) => String(v).trim()).filter(Boolean)
      if (k && vals.length) sizes[k] = vals
    }
    const budget = {}
    if (form.budget.typical !== '' && form.budget.typical != null) budget.typical = Number(form.budget.typical)
    if (form.budget.max !== '' && form.budget.max != null) budget.max = Number(form.budget.max)

    const profile = {}
    if (form.shopper_type) profile.shopper_type = form.shopper_type
    if (form.gender) profile.gender = form.gender
    if (Object.keys(sizes).length) profile.sizes = sizes
    if (form.favorite_brands.length) profile.favorite_brands = form.favorite_brands
    if (form.disliked_brands.length) profile.disliked_brands = form.disliked_brands
    if (form.categories.length) profile.categories = form.categories
    if (form.interests.length) profile.interests = form.interests
    if (Object.keys(budget).length) profile.budget = budget
    if (form.style_notes.trim()) profile.style_notes = form.style_notes.trim()

    const res = await $customFetch('/me/shopping-profile', { method: 'PUT', body: { profile, replace: true } })
    hydrate(res.data)
    editing.value = false
  } catch (e) {
    error.value = e?.data?.message || c.value.saveError
  } finally {
    saving.value = false
  }
}

onMounted(load)

function genderLabel(g) { return ({ female: c.value.female, male: c.value.male, unisex: c.value.unisex }[g] || g) }
const SIZE_LABELS = {
  es: { shoe: 'Calzado', tops: 'Playeras', bottoms: 'Pantalón', dress: 'Vestido', waist: 'Cintura' },
  en: { shoe: 'Shoe', tops: 'Tops', bottoms: 'Bottoms', dress: 'Dress', waist: 'Waist' },
}
function sizeLabel(k) { return (SIZE_LABELS[language.value === 'en' ? 'en' : 'es'][k]) || k }

const COPY = {
  es: {
    title: 'Tu perfil de compras',
    subtitle: 'Lo que el asistente recuerda de ti',
    intro: 'El asistente usa esto en cada chat para personalizar tus búsquedas: tus tallas, marcas favoritas y lo que sueles comprar. Edítalo cuando quieras.',
    edit: 'Editar', loading: 'Cargando…',
    emptyTitle: 'Aún no tengo notas sobre ti.',
    emptyHint: 'Mientras compras con el asistente, iré aprendiendo tus tallas y marcas favoritas. También puedes agregarlas tú con “Editar”.',
    forWhom: '¿Para quién compras?',
    personal: 'Para mí', personalDesc: 'Compro para mí mismo',
    reseller: 'Para revender', resellerDesc: 'Compro para varios clientes',
    gender: 'Género', sizes: 'Tallas', favBrands: 'Marcas favoritas', dislikedBrands: 'Marcas que evitas',
    categories: 'Categorías', interests: 'Intereses', budget: 'Presupuesto', styleNotes: 'Notas de estilo',
    typical: 'Típico', max: 'Máx.', updated: 'Actualizado el',
    notSet: 'Sin especificar', female: 'Mujer', male: 'Hombre', unisex: 'Unisex',
    sizesHintPersonal: 'Tu talla por categoría. El asistente la usa automáticamente.',
    sizesHintReseller: 'Agrega el rango de tallas que sueles comprar por categoría (para varios clientes).',
    sizeKeyPh: 'p. ej. calzado', sizeValPh: 'Agrega una talla', sizeValPhSingle: 'p. ej. 9.5 US', addSize: 'Agregar categoría',
    brandPh: 'p. ej. YoungLA', catPh: 'p. ej. ropa de gym', stylePh: 'p. ej. oversized, colores neutros…',
    add: 'Agregar', remove: 'Quitar', save: 'Guardar', saving: 'Guardando…', cancel: 'Cancelar',
    saveError: 'No se pudo guardar. Intenta de nuevo.',
  },
  en: {
    title: 'Your shopping profile',
    subtitle: 'What the assistant remembers about you',
    intro: 'The assistant uses this in every chat to personalize your searches: your sizes, favorite brands and what you usually shop for. Edit it anytime.',
    edit: 'Edit', loading: 'Loading…',
    emptyTitle: 'No notes about you yet.',
    emptyHint: 'As you shop with the assistant, it learns your sizes and favorite brands. You can also add them yourself with “Edit”.',
    forWhom: 'Who do you shop for?',
    personal: 'For myself', personalDesc: 'I buy for myself',
    reseller: 'For resale', resellerDesc: 'I buy for multiple customers',
    gender: 'Gender', sizes: 'Sizes', favBrands: 'Favorite brands', dislikedBrands: 'Brands you avoid',
    categories: 'Categories', interests: 'Interests', budget: 'Budget', styleNotes: 'Style notes',
    typical: 'Typical', max: 'Max', updated: 'Updated',
    notSet: 'Not set', female: 'Women', male: 'Men', unisex: 'Unisex',
    sizesHintPersonal: 'Your size per category. The assistant applies it automatically.',
    sizesHintReseller: 'Add the range of sizes you usually buy per category (for multiple customers).',
    sizeKeyPh: 'e.g. shoe', sizeValPh: 'Add a size', sizeValPhSingle: 'e.g. 9.5 US', addSize: 'Add category',
    brandPh: 'e.g. YoungLA', catPh: 'e.g. gym clothes', stylePh: 'e.g. oversized, neutral colors…',
    add: 'Add', remove: 'Remove', save: 'Save', saving: 'Saving…', cancel: 'Cancel',
    saveError: "Couldn't save. Please try again.",
  },
}
const c = computed(() => COPY[language.value === 'en' ? 'en' : 'es'])
</script>
