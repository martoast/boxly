<template>
  <section class="min-h-screen bg-gray-50 pb-32 sm:pb-20">
    <!-- ===================== BUILDER (order) SCREEN ===================== -->
    <!-- Sticky Header -->
    <div class="bg-white/90 backdrop-blur border-b border-gray-200 sticky top-0 z-30">
      <div class="max-w-3xl mx-auto px-4 py-3.5">
        <div class="flex items-center gap-3">
          <NuxtLink :to="backTo" class="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors">
            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </NuxtLink>
          <div class="flex-1 min-w-0">
            <h1 class="text-base sm:text-lg font-semibold text-gray-900 truncate">{{ t.createRequest }}</h1>
            <p class="text-xs text-gray-500">{{ t.stepAddItems }}</p>
          </div>
          <TutorialVideoButton loom-id="d0b29f8d1eb44727a1fb9799aaf04e61" />
          <div v-if="hasItems" class="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap">
            {{ totalItems }} {{ t.items }}
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-3xl mx-auto px-4 py-6 space-y-8">

      <!-- ===================== HERO (paste to add) ===================== -->
      <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-600 to-indigo-700 text-white shadow-xl shadow-primary-900/20">
        <div class="pointer-events-none absolute -top-16 -right-10 w-56 h-56 bg-white/10 rounded-full blur-2xl breathe"></div>
        <div class="pointer-events-none absolute -bottom-20 -left-10 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl breathe-slow"></div>

        <div class="relative p-6 sm:p-8">
          <span class="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold tracking-wide">
            🇺🇸 → 🇲🇽 {{ t.eyebrow }}
          </span>

          <h2 class="mt-4 text-2xl sm:text-3xl font-bold leading-tight">{{ hasItems ? t.heroTitleMore : t.heroTitle }}</h2>
          <p class="mt-2 text-sm sm:text-base text-white/85 max-w-xl leading-relaxed">{{ t.heroSubtitle }}</p>

          <form @submit.prevent="startFromUrl" class="mt-5">
            <div class="flex flex-col sm:flex-row gap-2 bg-white rounded-2xl p-2 shadow-lg">
              <div class="flex items-center flex-1 min-w-0 pl-2">
                <svg class="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <input
                  v-model="quickInput"
                  type="text"
                  inputmode="url"
                  class="w-full border-0 focus:ring-0 text-gray-900 placeholder-gray-400 text-sm sm:text-base py-2.5 px-2 bg-transparent"
                  :placeholder="t.pasteUrlPlaceholder"
                >
              </div>
              <button
                type="submit"
                class="flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white font-semibold px-5 py-3 rounded-xl transition-colors active:scale-[0.98]"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {{ t.heroCta }}
              </button>
            </div>
          </form>

          <p class="mt-3 text-xs text-white/70 flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
            <span class="truncate">{{ t.shopsLine }}</span>
          </p>
        </div>
      </div>

      <!-- ===================== 3-STEP EXPLAINER ===================== -->
      <div v-if="!hasItems" class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div
          v-for="(step, i) in steps"
          :key="i"
          class="group bg-white rounded-2xl border border-gray-100 p-5 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-[1.02] hover:shadow-xl hover:border-primary-100"
        >
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3" v-html="step.icon"></div>
            <span class="text-xs font-bold text-gray-300">0{{ i + 1 }}</span>
          </div>
          <h3 class="mt-3 font-semibold text-gray-900 text-sm">{{ step.title }}</h3>
          <p class="mt-1 text-xs text-gray-500 leading-relaxed">{{ step.desc }}</p>
        </div>
      </div>

      <!-- ===================== ITEMS LIST ===================== -->
      <div v-if="hasItems" class="space-y-4">
        <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider ml-1">{{ t.yourList }}</h3>

        <TransitionGroup name="list" tag="div" class="space-y-3">
          <div
            v-for="(item, index) in form.items"
            :key="index"
            class="group bg-white rounded-2xl border border-gray-200 shadow-sm p-4 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl hover:border-primary-100"
          >
            <div class="flex gap-4">
              <div class="flex-shrink-0">
                <img
                  v-if="item.imagePreview"
                  :src="item.imagePreview"
                  class="w-16 h-16 rounded-xl object-cover border border-gray-100 transition-transform duration-300 group-hover:scale-105"
                >
                <div
                  v-else
                  class="w-16 h-16 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-300 transition-transform duration-300 group-hover:scale-105"
                >
                  <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                </div>
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-3">
                  <h4 class="font-semibold text-gray-900 truncate">{{ item.product_name }}</h4>
                  <div class="flex items-center gap-1 flex-shrink-0 -mr-1 -mt-0.5">
                    <button @click="editItem(index)" class="p-1.5 text-gray-300 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" :aria-label="t.edit">
                      <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button @click="removeItem(index)" class="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" :aria-label="t.remove">
                      <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>

                <a :href="item.product_url" target="_blank" class="text-xs text-primary-600 hover:underline truncate flex items-center gap-1 mt-0.5">
                  {{ truncateUrl(item.product_url) }}
                  <svg class="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                </a>

                <div class="flex flex-wrap items-center gap-2 text-xs mt-2">
                  <span class="bg-gray-50 px-2 py-1 rounded-md text-gray-600 border border-gray-100">{{ t.qty }}: <strong>{{ item.quantity }}</strong></span>
                  <span class="bg-gray-50 px-2 py-1 rounded-md text-gray-600 border border-gray-100">{{ t.price }}: <strong>${{ item.price }}</strong></span>
                  <span v-for="(val, key) in item.options" :key="key" class="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs border border-blue-100">
                    <span class="font-semibold">{{ key }}:</span> {{ val }}
                  </span>
                </div>

                <p v-if="item.notes" class="mt-2 text-xs text-gray-500 italic bg-gray-50 p-2 rounded-lg border border-gray-100">{{ item.notes }}</p>
              </div>
            </div>
          </div>
        </TransitionGroup>

        <!-- Request summary — NOT a checkout. Just what we'll buy + how billing works. -->
        <div class="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mt-6">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
            </div>
            <div class="min-w-0">
              <h3 class="font-semibold text-gray-900 text-sm">{{ t.summaryTitle }}</h3>
              <p class="mt-1 text-xs text-gray-500 leading-relaxed">{{ t.summaryBody }}</p>
            </div>
          </div>

          <div class="mt-4 flex items-start gap-2 bg-emerald-50 text-emerald-700 rounded-xl p-3 text-xs">
            <svg class="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>{{ t.noChargeYet }}</span>
          </div>

          <NuxtLink :to="{ path: '/app/pricing', query: { from: route.fullPath } }" class="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors group">
            {{ t.seeBoxPrices }}
            <svg class="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
          </NuxtLink>

          <button
            @click="submitRequest"
            :disabled="loading"
            class="hidden sm:flex mt-5 w-full py-3.5 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl shadow-lg hover:shadow-primary-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed items-center justify-center gap-2"
          >
            <span v-if="loading" class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            {{ loading ? t.submitting : t.submitRequest }}
          </button>
        </div>
      </div>

      <div v-else class="text-center py-6">
        <p class="text-gray-500 font-medium text-sm">{{ t.emptyList }}</p>
        <p class="text-xs text-gray-400 mt-1">{{ t.startAddingItems }}</p>
      </div>
    </div>

    <!-- Sticky mobile submit -->
    <Transition name="slideup">
      <div
        v-if="hasItems && view === 'builder'"
        class="sm:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-gray-200 px-4 py-3"
        style="padding-bottom: calc(0.75rem + env(safe-area-inset-bottom))"
      >
        <button
          @click="submitRequest"
          :disabled="loading"
          class="w-full py-3.5 bg-primary-600 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <span v-if="loading" class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          {{ loading ? t.submitting : t.submitRequest }}
        </button>
      </div>
    </Transition>

    <!-- ===================== PRODUCT SCREEN (full-screen mode) ===================== -->
    <Transition name="screen">
      <div v-if="view === 'product'" class="fixed inset-0 z-40 bg-gray-50 flex flex-col">
        <!-- top bar -->
        <div class="bg-white border-b border-gray-200 flex-shrink-0">
          <div class="max-w-2xl mx-auto px-4 py-3.5 flex items-center gap-3">
            <button @click="cancelProduct" class="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors">
              <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div class="flex-1 min-w-0">
              <h2 class="text-base font-semibold text-gray-900 truncate">{{ editingIndex === null ? t.reviewProduct : t.editProduct }}</h2>
              <p v-if="draft.store" class="text-xs text-gray-500 truncate">{{ draft.store }}</p>
            </div>
          </div>
        </div>

        <!-- scroll area -->
        <div class="flex-1 overflow-y-auto">
          <div class="max-w-2xl mx-auto px-4 py-5 space-y-6">

            <!-- image gallery -->
            <div>
              <div class="aspect-square w-full rounded-2xl bg-white border border-gray-100 overflow-hidden flex items-center justify-center">
                <img v-if="mainImage" :src="mainImage" class="w-full h-full object-contain" @error="onImgError">
                <div v-else class="text-gray-300 flex flex-col items-center gap-2">
                  <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                  <span class="text-xs">{{ t.noImage }}</span>
                </div>
              </div>
              <div v-if="draft.images.length > 1" class="flex gap-2 mt-3 overflow-x-auto pb-1">
                <button
                  v-for="(img, i) in draft.images.slice(0, 8)"
                  :key="i"
                  @click="mainImageIndex = i"
                  class="w-14 h-14 rounded-lg border-2 overflow-hidden flex-shrink-0 transition-all"
                  :class="mainImageIndex === i ? 'border-primary-500' : 'border-gray-200 opacity-70 hover:opacity-100'"
                >
                  <img :src="img" class="w-full h-full object-cover">
                </button>
              </div>
            </div>

            <!-- title + price -->
            <div>
              <label class="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">{{ t.productName }}</label>
              <input
                v-model="draft.title"
                type="text"
                :placeholder="t.namePlaceholder"
                class="w-full border-0 border-b border-transparent hover:border-gray-200 focus:border-primary-500 focus:ring-0 px-0 py-1 text-xl font-bold text-gray-900 bg-transparent transition-colors"
              >

              <div class="mt-4 flex items-end gap-3">
                <div>
                  <label class="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">{{ t.price }} (USD)</label>
                  <div class="flex items-center">
                    <span class="text-2xl font-bold text-gray-900">$</span>
                    <input
                      v-model.number="draft.price"
                      type="number" min="0.01" step="0.01"
                      placeholder="0.00"
                      class="w-28 border-0 border-b border-transparent hover:border-gray-200 focus:border-primary-500 focus:ring-0 px-1 py-1 text-2xl font-bold text-gray-900 bg-transparent transition-colors"
                    >
                  </div>
                </div>
                <div v-if="draft.on_sale && draft.was" class="flex items-center gap-2 pb-1.5">
                  <span class="text-sm text-gray-400 line-through">${{ Number(draft.was).toFixed(2) }}</span>
                  <span class="text-xs font-semibold bg-red-50 text-red-600 px-2 py-0.5 rounded-full">{{ t.onSale }}</span>
                </div>
              </div>
              <p v-if="draft.price == null" class="mt-1 text-xs text-amber-600">{{ t.confirmPrice }}</p>
            </div>

            <!-- variant options -->
            <div v-if="draft.options.length" class="space-y-4">
              <div v-for="opt in draft.options" :key="opt.name">
                <label class="block text-sm font-semibold text-gray-700 mb-2">{{ opt.name }}</label>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="val in opt.values"
                    :key="val"
                    type="button"
                    @click="selected[opt.name] = val"
                    class="px-3.5 py-2 rounded-xl border text-sm font-medium transition-all"
                    :class="selected[opt.name] === val
                      ? 'border-primary-500 bg-primary-50 text-primary-700 ring-1 ring-primary-500'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'"
                  >
                    {{ val }}
                  </button>
                </div>
              </div>
            </div>

            <!-- manual variant (no options detected) -->
            <div v-else>
              <label class="block text-sm font-semibold text-gray-700 mb-2">{{ t.variantManual }} <span class="text-gray-400 font-normal text-xs">({{ t.optional }})</span></label>
              <input
                v-model="manualVariant"
                type="text"
                :placeholder="t.variantManualPlaceholder"
                class="block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 py-3 text-sm"
              >
            </div>

            <!-- quantity -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">{{ t.quantity }}</label>
              <div class="inline-flex items-center border border-gray-300 rounded-xl overflow-hidden">
                <button type="button" @click="decQty" class="px-4 py-3 bg-gray-50 hover:bg-gray-100 border-r border-gray-300">
                  <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" /></svg>
                </button>
                <input v-model.number="draft.quantity" type="number" min="1" class="w-16 border-none text-center focus:ring-0 py-3 text-sm font-semibold">
                <button type="button" @click="incQty" class="px-4 py-3 bg-gray-50 hover:bg-gray-100 border-l border-gray-300">
                  <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
                </button>
              </div>
            </div>

            <!-- notes -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">{{ t.notes }} <span class="text-gray-400 font-normal text-xs">({{ t.optional }})</span></label>
              <textarea v-model="draft.notes" rows="2" :placeholder="t.notesPlaceholder" class="block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm py-2"></textarea>
            </div>

            <!-- link -->
            <a v-if="draft.product_url" :href="draft.product_url" target="_blank" class="inline-flex items-center gap-1 text-xs text-primary-600 hover:underline">
              {{ t.viewOnStore }}
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
            </a>

            <div class="h-4"></div>
          </div>
        </div>

        <!-- sticky add bar -->
        <div class="flex-shrink-0 bg-white border-t border-gray-200 px-4 py-3" style="padding-bottom: calc(0.75rem + env(safe-area-inset-bottom))">
          <div class="max-w-2xl mx-auto">
            <button
              @click="commitDraft"
              :disabled="!canCommit"
              class="w-full py-3.5 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
              {{ editingIndex === null ? t.addToList : t.saveChanges }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- The beautiful full-screen product-fetch loader (reused from the AI assistant) -->
    <ProductLoader :show="scraping" />
  </section>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';

definePageMeta({
  layout: 'app',
  middleware: ['auth', 'customer', 'complete-profile']
});

const { $customFetch, $toast } = useNuxtApp();
const { t: createTranslations } = useLanguage();
const router = useRouter();
const route = useRoute();

const backTo = computed(() => (typeof route.query.from === 'string' ? route.query.from : '/app/purchase-requests'));

const translations = {
  createRequest: { es: 'Compra Asistida', en: 'Assisted Shopping' },
  stepAddItems: { es: 'Nueva solicitud', en: 'New request' },
  eyebrow: { es: 'Compra Asistida', en: 'Assisted Shopping' },
  heroTitle: { es: '¿Qué quieres que te compremos?', en: 'What can we buy for you?' },
  heroTitleMore: { es: '¿Agregamos algo más?', en: 'Add something else?' },
  heroSubtitle: {
    es: 'Pega el enlace de cualquier tienda de EE. UU. Traemos el producto listo para que solo confirmes; nosotros lo compramos y lo enviamos a México.',
    en: 'Paste a link from any US store. We pull the product ready for you to confirm; we buy it and ship it to Mexico.'
  },
  pasteUrlPlaceholder: { es: 'Pega el enlace del producto…', en: 'Paste the product link…' },
  heroCta: { es: 'Obtener cotización', en: 'Get a quote' },
  shopsLine: { es: 'Amazon, Nike, Shein, Best Buy, Sephora y miles más.', en: 'Amazon, Nike, Shein, Best Buy, Sephora and thousands more.' },
  step1Title: { es: 'Pega el enlace', en: 'Paste the link' },
  step1Desc: { es: 'Traemos fotos, precio y tallas; tú solo confirmas.', en: 'We pull photos, price and sizes; you just confirm.' },
  step2Title: { es: 'Nosotros lo compramos', en: 'We buy it for you' },
  step2Desc: { es: 'Pagamos por ti y lo recibimos en San Diego.', en: 'We pay for it and receive it in San Diego.' },
  step3Title: { es: 'Llega a México', en: 'It arrives in Mexico' },
  step3Desc: { es: 'Lo enviamos hasta la puerta de tu casa.', en: 'We ship it right to your door.' },
  items: { es: 'Artículos', en: 'Items' },
  yourList: { es: 'Tu Lista', en: 'Your List' },
  edit: { es: 'Editar', en: 'Edit' },
  remove: { es: 'Eliminar', en: 'Remove' },
  reviewProduct: { es: 'Revisa tu producto', en: 'Review your product' },
  editProduct: { es: 'Editar producto', en: 'Edit product' },
  productName: { es: 'Nombre del producto', en: 'Product name' },
  namePlaceholder: { es: 'Ej: Tenis Nike Air Force 1', en: 'Ex: Nike Air Force 1' },
  price: { es: 'Precio', en: 'Price' },
  onSale: { es: 'En oferta', en: 'On sale' },
  confirmPrice: { es: 'No pudimos leer el precio — confírmalo tú.', en: "We couldn't read the price — please confirm it." },
  variantManual: { es: 'Talla / color / especificación', en: 'Size / color / spec' },
  variantManualPlaceholder: { es: 'Ej: Talla M, color negro', en: 'Ex: Size M, black' },
  quantity: { es: 'Cantidad', en: 'Quantity' },
  notes: { es: 'Notas adicionales', en: 'Additional notes' },
  optional: { es: 'Opcional', en: 'Optional' },
  notesPlaceholder: { es: 'Cualquier otra instrucción…', en: 'Any other instructions…' },
  viewOnStore: { es: 'Ver en la tienda', en: 'View on store' },
  noImage: { es: 'Sin imagen', en: 'No image' },
  addToList: { es: 'Agregar a mi solicitud', en: 'Add to my request' },
  saveChanges: { es: 'Guardar cambios', en: 'Save changes' },
  qty: { es: 'Cant', en: 'Qty' },
  summaryTitle: { es: 'Compramos esto por ti', en: "We'll buy this for you" },
  summaryBody: {
    es: 'Estos son los productos que compraremos por ti. Te enviaremos una cotización con el costo total —producto, 10% de comisión Boxly y el envío de tu caja— antes de cobrarte nada.',
    en: "These are the products we'll buy for you. We'll send you a quote with the full cost —product, 10% Boxly commission and your box shipping— before charging you anything."
  },
  seeBoxPrices: { es: 'Ver precios de las cajas de envío', en: 'See box shipping prices' },
  noChargeYet: {
    es: 'No se te cobra nada aún. Primero recibirás una cotización con el costo total.',
    en: "You won't be charged yet. You'll first get a quote with the full cost."
  },
  submitRequest: { es: 'Enviar Solicitud', en: 'Submit Request' },
  submitting: { es: 'Enviando…', en: 'Sending…' },
  emptyList: { es: 'Aún no has agregado productos', en: "You haven't added any products yet" },
  startAddingItems: { es: 'Pega tu primer enlace arriba para empezar.', en: 'Paste your first link above to get started.' },
  successMsg: { es: 'Solicitud enviada exitosamente', en: 'Request sent successfully' },
  errorMsg: { es: 'Error al enviar solicitud', en: 'Error sending request' },
  addedToast: { es: 'Artículo agregado a tu lista', en: 'Item added to your list' },
  scrapeFailed: { es: 'No pudimos leer el producto. Complétalo manualmente.', en: "We couldn't read the product. Please fill it in manually." },
};

const t = createTranslations(translations);

const steps = computed(() => [
  { title: t.value.step1Title, desc: t.value.step1Desc, icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>' },
  { title: t.value.step2Title, desc: t.value.step2Desc, icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>' },
  { title: t.value.step3Title, desc: t.value.step3Desc, icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/></svg>' },
]);

// ── State ────────────────────────────────────────────────────────────────────
const form = ref({ items: [] });

// Keep the in-progress list alive across in-app navigation (e.g. a trip to
// /app/pricing and back) so the customer doesn't lose the request they were
// building. sessionStorage is tab-scoped — it clears when the tab closes, and we
// clear it explicitly once the request is submitted. Items hold only plain data
// (URLs, no File objects), so they serialize cleanly.
const DRAFT_KEY = 'boxly_pr_online_draft';
onMounted(() => {
  try {
    const saved = sessionStorage.getItem(DRAFT_KEY);
    const items = saved ? JSON.parse(saved) : null;
    if (Array.isArray(items) && items.length) form.value.items = items;
  } catch { /* ignore corrupt draft */ }
  watch(form, (v) => {
    try {
      if (v.items.length) sessionStorage.setItem(DRAFT_KEY, JSON.stringify(v.items));
      else sessionStorage.removeItem(DRAFT_KEY);
    } catch { /* storage blocked — no-op */ }
  }, { deep: true });
});

const loading = ref(false);
const quickInput = ref('');
const scraping = ref(false);
const view = ref('builder');          // 'builder' | 'product'
const editingIndex = ref(null);       // null = adding new; number = editing existing

// The product being reviewed/added (draft) + its variant selection.
const draft = reactive({
  product_url: '', store: '', title: '', price: null, was: null, on_sale: false,
  quantity: 1, notes: '', options: [], images: [],
});
const selected = reactive({});        // { optionName: value }
const manualVariant = ref('');
const mainImageIndex = ref(0);

const mainImage = computed(() => draft.images[mainImageIndex.value] || draft.images[0] || null);

// ── Computed ─────────────────────────────────────────────────────────────────
const hasItems = computed(() => form.value.items.length > 0);
const totalItems = computed(() => form.value.items.reduce((s, i) => s + i.quantity, 0));
const canCommit = computed(() => !!(draft.title || '').trim() && draft.price != null && draft.price > 0 && Number(draft.quantity) >= 1);

// ── Helpers ──────────────────────────────────────────────────────────────────
const fixUrl = (url) => {
  const c = (url || '').trim();
  if (!c) return '';
  return /^https?:\/\//i.test(c) ? c : 'https://' + c;
};
const looksLikeUrl = (v) => /^https?:\/\//i.test(v) || /\.[a-z]{2,}(\/|$|\?)/i.test(v);
const truncateUrl = (url) => { try { return new URL(fixUrl(url)).hostname.replace('www.', ''); } catch { return 'Link'; } };
const onImgError = (e) => { e.target.style.display = 'none'; };

const resetDraft = (over = {}) => {
  Object.assign(draft, {
    product_url: '', store: '', title: '', price: null, was: null, on_sale: false,
    quantity: 1, notes: '', options: [], images: [],
  }, over);
  Object.keys(selected).forEach((k) => delete selected[k]);
  manualVariant.value = '';
  mainImageIndex.value = 0;
};

// ── Entry points ─────────────────────────────────────────────────────────────
const startFromUrl = async () => {
  const raw = quickInput.value.trim();
  quickInput.value = '';
  if (!raw) return;
  if (!looksLikeUrl(raw)) {
    // Treat as a product name → open the product screen for manual entry.
    editingIndex.value = null;
    resetDraft({ title: raw });
    view.value = 'product';
    return;
  }
  const url = fixUrl(raw);
  scraping.value = true;
  try {
    const res = await $customFetch('/products/scrape', { method: 'POST', body: { url }, timeout: 90000 });
    const d = res?.data || {};
    editingIndex.value = null;
    resetDraft({
      product_url: d.source_url || url,
      store: d.store || truncateUrl(url),
      title: d.title || '',
      price: parsePrice(d.price),
      was: parsePrice(d.was),
      on_sale: !!d.on_sale,
      options: normalizeOptions(d.options),
      images: (d.images || []).filter((x) => typeof x === 'string' && x.startsWith('http')),
      description: d.description || '',
    });
    view.value = 'product';
  } catch (e) {
    // Best-effort — open the product screen with the URL so they can fill it in.
    editingIndex.value = null;
    resetDraft({ product_url: url, store: truncateUrl(url) });
    view.value = 'product';
    $toast.error(t.value.scrapeFailed);
  } finally {
    scraping.value = false;
  }
};

const editItem = (index) => {
  const it = form.value.items[index];
  editingIndex.value = index;
  resetDraft({
    product_url: it.product_url, store: it.store || truncateUrl(it.product_url),
    title: it.product_name, price: it.price, quantity: it.quantity, notes: it.notes || '',
    options: it._options || [], images: it.imagePreview ? [it.imagePreview] : [],
  });
  // restore previously chosen variant values
  Object.entries(it.options || {}).forEach(([k, v]) => { selected[k] = v; });
  view.value = 'product';
};

// ── Product-screen actions ───────────────────────────────────────────────────
const parsePrice = (v) => {
  if (v == null) return null;
  const n = parseFloat(String(v).replace(/[^0-9.]/g, ''));
  return !isNaN(n) && n > 0 ? n : null;
};
const normalizeOptions = (opts) => Array.isArray(opts)
  ? opts.filter((o) => o && o.name && Array.isArray(o.values) && o.values.length).map((o) => ({ name: o.name, values: o.values.filter(Boolean) }))
  : [];

const incQty = () => { if (draft.quantity < 999) draft.quantity++; };
const decQty = () => { if (draft.quantity > 1) draft.quantity--; };

const cancelProduct = () => { view.value = 'builder'; editingIndex.value = null; };

const commitDraft = () => {
  if (!canCommit.value) return;

  // Selected variant options → the item's options map.
  const options = { ...selected };

  // Manual variant text (when no structured options) rides in notes.
  let notes = (draft.notes || '').trim();
  if (manualVariant.value.trim()) {
    notes = notes ? `${manualVariant.value.trim()} · ${notes}` : manualVariant.value.trim();
  }

  const img = mainImage.value || null;
  const item = {
    product_url: fixUrl(draft.product_url),
    product_name: draft.title.trim(),
    price: draft.price,
    quantity: Number(draft.quantity) >= 1 ? Number(draft.quantity) : 1,
    notes,
    options,
    _options: draft.options,               // keep the scraped option lists for re-edit
    imagePreview: img,
    product_image_url: img && img.startsWith('http') ? img : null,
  };

  if (editingIndex.value !== null) {
    form.value.items[editingIndex.value] = item;
  } else {
    form.value.items.push(item);
    $toast.success(t.value.addedToast);
  }
  view.value = 'builder';
  editingIndex.value = null;
};

const removeItem = (index) => { form.value.items.splice(index, 1); };

// ── Submit ───────────────────────────────────────────────────────────────────
const submitRequest = async () => {
  loading.value = true;
  try {
    const formData = new FormData();
    form.value.items.forEach((item, index) => {
      formData.append(`items[${index}][product_name]`, item.product_name);
      formData.append(`items[${index}][product_url]`, item.product_url);
      formData.append(`items[${index}][price]`, item.price);
      formData.append(`items[${index}][quantity]`, item.quantity);
      if (item.notes) formData.append(`items[${index}][notes]`, item.notes);
      formData.append(`items[${index}][options]`, Object.keys(item.options).length ? JSON.stringify(item.options) : '{}');
      if (item.product_image_url) formData.append(`items[${index}][product_image_url]`, item.product_image_url);
    });

    const res = await $customFetch('/purchase-requests', { method: 'POST', body: formData });
    try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* no-op */ }
    $toast.success(t.value.successMsg);
    const newId = res?.data?.id;
    router.push(newId ? `/app/purchase-requests/${newId}` : backTo.value);
  } catch (error) {
    console.error(error);
    $toast.error(t.value.errorMsg);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.list-enter-active, .list-leave-active { transition: all 0.3s ease; }
.list-enter-from, .list-leave-to { opacity: 0; transform: translateX(-20px); }

.slideup-enter-active, .slideup-leave-active { transition: transform 0.25s ease, opacity 0.25s ease; }
.slideup-enter-from, .slideup-leave-to { transform: translateY(100%); opacity: 0; }

/* Product screen slide-in */
.screen-enter-active, .screen-leave-active { transition: transform 0.3s ease, opacity 0.3s ease; }
.screen-enter-from, .screen-leave-to { transform: translateY(2%); opacity: 0; }

/* Ambient "breathing" glows in the hero */
@keyframes breathe {
  0%, 100% { transform: scale(1); opacity: 0.9; }
  50% { transform: scale(1.15); opacity: 0.6; }
}
.breathe { animation: breathe 7s ease-in-out infinite; }
.breathe-slow { animation: breathe 10s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) { .breathe, .breathe-slow { animation: none; } }
</style>
