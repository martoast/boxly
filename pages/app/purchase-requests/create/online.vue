<template>
  <section class="min-h-screen bg-gray-50 pb-40 sm:pb-32">
    <!-- Sticky header -->
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
          <div
            v-if="hasItems"
            :class="['bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap transition-transform', countPulse ? 'count-pulse' : '']"
          >
            {{ totalItems }} {{ t.items }}
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-3xl mx-auto px-4 py-6 space-y-6">

      <!-- ============ PASTE BAR — the whole product, really ============ -->
      <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-600 to-indigo-700 text-white shadow-xl shadow-primary-900/20">
        <div class="pointer-events-none absolute -top-16 -right-10 w-56 h-56 bg-white/10 rounded-full blur-2xl breathe"></div>
        <div class="pointer-events-none absolute -bottom-20 -left-10 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl breathe-slow"></div>

        <div class="relative p-6 sm:p-8">
          <span class="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold tracking-wide">
            🇺🇸 → 🇲🇽 {{ t.eyebrow }}
          </span>

          <h2 class="mt-4 text-2xl sm:text-3xl font-bold leading-tight">
            {{ hasItems ? t.heroTitleMore : t.heroTitle }}
          </h2>
          <p class="mt-2 text-sm sm:text-base text-white/85 max-w-xl leading-relaxed">{{ t.heroSubtitle }}</p>

          <form @submit.prevent="addFromInput" class="mt-5">
            <div class="flex flex-col sm:flex-row gap-2 bg-white rounded-2xl p-2 shadow-lg">
              <div class="flex items-center flex-1 min-w-0 pl-2">
                <svg class="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <input
                  ref="pasteInput"
                  v-model="quickInput"
                  type="text"
                  inputmode="url"
                  autocomplete="off"
                  class="w-full border-0 focus:ring-0 text-gray-900 placeholder-gray-400 text-sm sm:text-base py-2.5 px-2 bg-transparent"
                  :placeholder="t.pastePlaceholder"
                  @paste="onPaste"
                >
              </div>
              <button
                type="submit"
                class="flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white font-semibold px-5 py-3 rounded-xl transition-colors active:scale-[0.98]"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                {{ t.addCta }}
              </button>
            </div>
            <!--
              The add is instant, and that was the problem: testers pasted and
              couldn't tell it had worked. The confirmation has to appear HERE,
              under the input, because that's where their eyes already are — the
              list is further down and they never looked at it. Naming the product
              also answers the real question: "did I paste the right link?"
            -->
            <div class="mt-2.5 pl-1 min-h-[1.25rem]">
              <Transition name="cue" mode="out-in">
                <p v-if="cue" :key="cue.id" class="flex items-center gap-1.5 text-xs font-medium" :class="cue.kind === 'dupe' ? 'text-amber-200' : 'text-emerald-200'">
                  <svg v-if="cue.kind !== 'dupe'" class="w-3.5 h-3.5 flex-shrink-0 check-pop" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <svg v-else class="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                  <span class="truncate">{{ cue.text }}</span>
                </p>
                <p v-else key="hint" class="text-xs text-white/70">{{ t.pasteHint }}</p>
              </Transition>
            </div>
          </form>

          <div class="relative mt-5 overflow-hidden select-none -mx-6 sm:-mx-8" aria-hidden="true">
            <div class="flex w-max gap-8 whitespace-nowrap marquee-track px-6 sm:px-8">
              <span v-for="(b, i) in marqueeStores" :key="i" class="text-[12.5px] font-bold tracking-tight text-white/60">{{ b }}</span>
            </div>
            <div class="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-primary-600 to-transparent"></div>
            <div class="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-indigo-700 to-transparent"></div>
          </div>
        </div>
      </div>

      <!-- ============ EMPTY STATE ============ -->
      <div v-if="!hasItems" class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div
          v-for="(step, i) in steps"
          :key="i"
          class="group bg-white rounded-2xl border border-gray-100 p-5 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-xl hover:border-primary-100"
        >
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0" v-html="step.icon"></div>
            <span class="text-xs font-bold text-gray-300">0{{ i + 1 }}</span>
          </div>
          <h3 class="mt-3 font-semibold text-gray-900 text-sm">{{ step.title }}</h3>
          <p class="mt-1 text-xs text-gray-500 leading-relaxed">{{ step.desc }}</p>
        </div>
      </div>

      <!-- ============ THE CART ============ -->
      <div v-if="hasItems" class="space-y-3">
        <div class="flex items-baseline justify-between ml-1">
          <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider">{{ t.yourList }}</h3>
          <span class="text-xs text-gray-400">{{ storeSummary }}</span>
        </div>

        <TransitionGroup name="list" tag="div" class="space-y-2.5">
          <div
            v-for="(item, index) in form.items"
            :key="item.key"
            :class="[
              'bg-white rounded-2xl border shadow-sm px-4 py-3.5 transition-all duration-500',
              item.flash ? 'border-amber-400 ring-2 ring-amber-100' : '',
              item.justAdded && !item.flash ? 'border-emerald-400 ring-2 ring-emerald-100' : '',
              !item.flash && !item.justAdded ? 'border-gray-200' : ''
            ]"
          >
            <div class="flex items-start gap-3">
              <!--
                Thumbnail doubles as an optional photo upload. Default is the
                store's logo (instant, no backend); tap it to attach a screenshot
                when the link alone doesn't say which one they mean — a colour, a
                specific variant, a thing they saw on Instagram.
              -->
              <div class="relative flex-shrink-0 mt-0.5">
                <label
                  class="group/img relative w-11 h-11 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden cursor-pointer flex items-center justify-center"
                  :title="t.addPhoto"
                >
                  <input type="file" accept="image/*" class="sr-only" @change="(e) => pickImage(item, e)">

                  <img v-if="item.imagePreview" :src="item.imagePreview" alt="" class="w-full h-full object-cover">
                  <img
                    v-else-if="item.product_url"
                    :src="faviconFor(item.product_url)"
                    alt=""
                    class="w-6 h-6 object-contain"
                    @error="(e) => (e.target.style.visibility = 'hidden')"
                  >
                  <svg v-else class="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>

                  <span class="absolute inset-0 bg-gray-900/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                    <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </span>
                </label>

                <button
                  v-if="item.imagePreview"
                  type="button"
                  class="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 rounded-full bg-gray-900 text-white flex items-center justify-center shadow"
                  :aria-label="t.removePhoto"
                  @click="clearImage(item)"
                >
                  <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <p class="font-medium text-gray-900 text-sm leading-snug line-clamp-2">{{ item.label }}</p>
                    <a
                      v-if="item.product_url"
                      :href="item.product_url"
                      target="_blank"
                      rel="noopener"
                      class="text-xs text-gray-400 hover:text-primary-600 truncate block mt-0.5"
                    >{{ item.store }}</a>
                    <p v-else class="text-xs text-gray-400 mt-0.5">{{ t.noLink }}</p>
                  </div>

                  <div class="flex items-center gap-1 flex-shrink-0">
                    <!-- quantity stepper -->
                    <div class="flex items-center bg-gray-50 rounded-lg border border-gray-200">
                      <button type="button" class="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-gray-900 disabled:opacity-30" :disabled="item.quantity <= 1" @click="item.quantity--">−</button>
                      <span class="w-6 text-center text-sm font-semibold text-gray-900 tabular-nums">{{ item.quantity }}</span>
                      <button type="button" class="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-gray-900" @click="item.quantity++">+</button>
                    </div>
                    <button type="button" class="p-1.5 text-gray-300 hover:text-red-500 transition-colors" :aria-label="t.remove" @click="removeItem(index)">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                </div>

                <!-- the only two things we still need from them, inline -->
                <div class="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    v-model="item.variant"
                    type="text"
                    class="w-full text-sm rounded-lg border-gray-200 bg-gray-50/60 focus:bg-white focus:border-primary-400 focus:ring-primary-400 placeholder-gray-400 py-1.5"
                    :placeholder="t.variantPlaceholder"
                  >
                  <input
                    v-model="item.notes"
                    type="text"
                    class="w-full text-sm rounded-lg border-gray-200 bg-gray-50/60 focus:bg-white focus:border-primary-400 focus:ring-primary-400 placeholder-gray-400 py-1.5"
                    :placeholder="t.notesPlaceholder"
                  >
                </div>

                <!--
                  A VISIBLE control. This started life as a hover overlay on the
                  44px thumbnail, which nobody could find — and on touch there is
                  no hover at all, so it simply didn't exist on mobile.
                -->
                <div class="mt-2 flex items-center gap-2 flex-wrap">
                  <label class="inline-flex items-center gap-1.5 text-xs font-medium rounded-lg px-2.5 py-1.5 cursor-pointer border border-dashed transition-colors"
                    :class="item.imagePreview
                      ? 'border-emerald-300 text-emerald-700 bg-emerald-50/60 hover:border-emerald-400'
                      : 'border-gray-300 text-gray-500 hover:border-primary-400 hover:text-primary-600'"
                  >
                    <input type="file" accept="image/*" class="sr-only" @change="(e) => pickImage(item, e)">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {{ item.imagePreview ? t.changePhoto : t.addPhoto }}
                  </label>

                  <button
                    v-if="item.imagePreview"
                    type="button"
                    class="text-xs text-gray-400 hover:text-red-500 transition-colors"
                    @click="clearImage(item)"
                  >{{ t.removePhoto }}</button>
                </div>
              </div>
            </div>
          </div>
        </TransitionGroup>
      </div>

      <!-- ============ WHAT HAPPENS NEXT ============ -->
      <div v-if="hasItems" class="bg-white rounded-2xl border border-gray-200 p-5">
        <h3 class="font-semibold text-gray-900 text-sm">{{ t.summaryTitle }}</h3>
        <p class="mt-1.5 text-sm text-gray-500 leading-relaxed">{{ t.summaryBody }}</p>
        <NuxtLink to="/app/pricing" class="mt-2 inline-block text-sm font-medium text-primary-600 hover:text-primary-700">
          {{ t.seeBoxPrices }} →
        </NuxtLink>
      </div>
    </div>

    <!-- ============ STICKY SUBMIT ============ -->
    <Transition name="slideup">
      <div v-if="hasItems" class="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-gray-200">
        <div class="max-w-3xl mx-auto px-4 py-3.5">
          <p class="text-[11px] text-gray-400 text-center mb-2">{{ t.noChargeYet }}</p>
          <button
            :disabled="loading"
            class="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-colors active:scale-[0.99] flex items-center justify-center gap-2"
            @click="submitRequest"
          >
            <span v-if="loading">{{ t.submitting }}</span>
            <span v-else>{{ t.submitRequest }} · {{ totalItems }} {{ t.items }}</span>
          </button>
        </div>
      </div>
    </Transition>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue';

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
  heroTitle: { es: 'Pega tus links. Nosotros los compramos.', en: 'Paste your links. We buy them.' },
  heroTitleMore: { es: '¿Algo más? Pega otro link.', en: 'Anything else? Paste another link.' },
  heroSubtitle: {
    es: 'Copia el link de cualquier producto en Estados Unidos y pégalo aquí. Se agrega solo — no tienes que esperar nada.',
    en: 'Copy the link of any product in the United States and paste it here. It adds itself — nothing to wait for.'
  },
  pastePlaceholder: { es: 'Pega un link… o varios de golpe', en: 'Paste a link… or several at once' },
  pasteHint: {
    es: 'Se agrega al pegar. Puedes pegar varios links juntos, o escribir el nombre si no tienes el link.',
    en: 'Adds on paste. You can paste several links at once, or type a name if you have no link.'
  },
  addCta: { es: 'Agregar', en: 'Add' },
  step1Title: { es: 'Pega tus links', en: 'Paste your links' },
  step1Desc: { es: 'Uno por uno o todos juntos. Sin esperas.', en: 'One by one or all at once. No waiting.' },
  step2Title: { es: 'Nosotros lo compramos', en: 'We buy it for you' },
  step2Desc: { es: 'Te cotizamos y, al aprobar, lo compramos.', en: 'We quote you and, once approved, we buy it.' },
  step3Title: { es: 'Llega a México', en: 'It arrives in Mexico' },
  step3Desc: { es: 'Lo enviamos hasta la puerta de tu casa.', en: 'We ship it right to your door.' },
  items: { es: 'artículos', en: 'items' },
  yourList: { es: 'Tu lista', en: 'Your list' },
  remove: { es: 'Eliminar', en: 'Remove' },
  noLink: { es: 'Sin link — lo buscamos por ti', en: 'No link — we’ll find it' },
  variantPlaceholder: { es: 'Talla / color (opcional)', en: 'Size / color (optional)' },
  notesPlaceholder: { es: 'Nota (opcional)', en: 'Note (optional)' },
  addPhoto: { es: 'Agregar foto', en: 'Add photo' },
  changePhoto: { es: 'Cambiar foto', en: 'Change photo' },
  removePhoto: { es: 'Quitar', en: 'Remove' },
  imageTooBig: { es: 'La imagen es muy grande (máx. 10 MB)', en: 'That image is too large (max 10 MB)' },
  summaryTitle: { es: 'Qué sigue', en: "What's next" },
  summaryBody: {
    es: 'Revisamos tus productos, confirmamos precio y disponibilidad en la tienda, y te enviamos una cotización con el costo total —producto, 15% de comisión Boxly y el envío de tu caja— antes de cobrarte nada.',
    en: "We review your products, confirm price and availability at the store, and send you a quote with the full cost —product, 15% Boxly commission and your box shipping— before charging you anything."
  },
  seeBoxPrices: { es: 'Ver precios de las cajas de envío', en: 'See box shipping prices' },
  noChargeYet: {
    es: 'No se te cobra nada aún. Primero recibirás una cotización.',
    en: "You won't be charged yet. You'll get a quote first."
  },
  submitRequest: { es: 'Enviar solicitud', en: 'Submit request' },
  submitting: { es: 'Enviando…', en: 'Sending…' },
  successMsg: { es: 'Solicitud enviada', en: 'Request sent' },
  errorMsg: { es: 'Error al enviar la solicitud', en: 'Error sending request' },
  addedOne: { es: 'Agregado', en: 'Added' },
  addedMany: { es: 'links agregados', en: 'links added' },
  alreadyAdded: { es: 'Ese link ya está en tu lista', en: 'That link is already in your list' },
  stores: { es: 'tiendas', en: 'stores' },
  store: { es: 'tienda', en: 'store' },
};

const t = createTranslations(translations);

const STORE_LIST = ['Amazon', 'Costco', 'Target', 'Walmart', 'Nike', 'Apple', 'Home Depot', 'Best Buy', 'Sephora', 'Ross', 'TJ Maxx', 'Burlington', "Macy's", 'Coach', 'Michael Kors', "Levi's", 'Gap', 'Old Navy', 'Columbia', 'New Balance', 'Crocs', 'LEGO', 'Pokémon Center', 'Bath & Body Works', "Victoria's Secret", "Dick's Sporting Goods", 'y miles más'];
const marqueeStores = [...STORE_LIST, ...STORE_LIST];

const steps = computed(() => [
  { title: t.value.step1Title, desc: t.value.step1Desc, icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>' },
  { title: t.value.step2Title, desc: t.value.step2Desc, icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>' },
  { title: t.value.step3Title, desc: t.value.step3Desc, icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/></svg>' },
]);

// ── State ────────────────────────────────────────────────────────────────────
const form = ref({ items: [] });
const quickInput = ref('');
const pasteInput = ref(null);
const loading = ref(false);
let seq = 0;

const hasItems = computed(() => form.value.items.length > 0);
const totalItems = computed(() => form.value.items.reduce((n, i) => n + Number(i.quantity || 1), 0));
const storeSummary = computed(() => {
  const stores = new Set(form.value.items.filter((i) => i.store).map((i) => i.store));
  if (!stores.size) return '';
  return `${stores.size} ${stores.size === 1 ? t.value.store : t.value.stores}`;
});

// ── URL helpers — all local, zero network ────────────────────────────────────
const URL_RE = /https?:\/\/[^\s<>"'`]+/gi;

const storeOf = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
};

const faviconFor = (url) => `https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(storeOf(url))}`;

/**
 * Product name from the URL slug — the same walk the API does, so what the
 * customer sees here is exactly what gets saved. No request, no spinner.
 */
const SKIP_SEGMENTS = new Set(['p', 'dp', 'ip', 'gp', 'shop', 'product', 'products', 'item', 'items', 'pd', 'prod']);
const labelFor = (url) => {
  let path = '';
  try {
    path = new URL(url).pathname;
  } catch {
    return url;
  }
  const segments = path.split('/').filter(Boolean).reverse();
  for (const raw of segments) {
    const slug = raw.replace(/\.(html?|aspx?|php|htm)$/i, '');
    if (SKIP_SEGMENTS.has(slug.toLowerCase())) continue;
    if (!/[a-z]{3,}/i.test(slug)) continue;
    const pretty = slug.replace(/[-_+]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (!pretty) continue;
    return pretty.replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return storeOf(url) || url;
};

// ── Feedback ─────────────────────────────────────────────────────────────────
// Adding is instant, which made it feel like nothing happened. These are the
// only two cues, and both are deliberately short: a line under the input naming
// what landed, and a fading ring on the row itself so the eye can follow it down.
const cue = ref(null);
const countPulse = ref(false);
let cueTimer = null;
let pulseTimer = null;
let cueSeq = 0;

const showCue = (text, kind = 'added') => {
  cue.value = { id: ++cueSeq, text, kind };
  clearTimeout(cueTimer);
  cueTimer = setTimeout(() => { cue.value = null; }, 2600);
};

const pulseCount = () => {
  countPulse.value = false;
  clearTimeout(pulseTimer);
  // next tick so the class re-applies and the animation actually restarts
  nextTick(() => {
    countPulse.value = true;
    pulseTimer = setTimeout(() => { countPulse.value = false; }, 500);
  });
};

// ── Adding ───────────────────────────────────────────────────────────────────
const pushItem = ({ url = '', name = '' }) => {
  // Same link twice — highlight the one they already have instead of duplicating.
  if (url) {
    const existing = form.value.items.find((i) => i.product_url === url);
    if (existing) {
      existing.flash = true;
      setTimeout(() => { existing.flash = false; }, 1600);
      return null;
    }
  }
  const item = {
    key: ++seq,
    product_url: url,
    label: url ? labelFor(url) : name,
    store: url ? storeOf(url) : '',
    name: url ? '' : name,
    quantity: 1,
    variant: '',
    notes: '',
    imageFile: null,
    imagePreview: '',
    flash: false,
    justAdded: true,
  };
  form.value.items.push(item);
  setTimeout(() => { item.justAdded = false; }, 1600);
  return item;
};

const refocus = () => nextTick(() => pasteInput.value?.focus());

const ingest = (text) => {
  const raw = (text || '').trim();
  if (!raw) return 0;
  const urls = raw.match(URL_RE) || [];
  const added = [];

  if (urls.length) {
    urls.forEach((u) => {
      const item = pushItem({ url: u.replace(/[.,;]+$/, '') });
      if (item) added.push(item);
    });
  } else {
    // Not a link — they're describing something ("iPhone 15 Pro, sin link").
    const item = pushItem({ name: raw });
    if (item) added.push(item);
  }

  if (!added.length) {
    showCue(t.value.alreadyAdded, 'dupe');
  } else if (added.length === 1) {
    // Name it. The reassurance they actually want is "yes, that was the right link".
    showCue(`${t.value.addedOne} · ${added[0].label}`);
    pulseCount();
  } else {
    showCue(`${added.length} ${t.value.addedMany}`);
    pulseCount();
  }

  return added.length;
};

const addFromInput = () => {
  ingest(quickInput.value);
  quickInput.value = '';
  refocus();
};

/**
 * Paste IS the action. The real workflow is a desktop with a dozen tabs open —
 * copy, paste, copy, paste — so requiring an extra click or Enter per product
 * doubles the work for no reason. The field stays focused so the next paste
 * just lands.
 */
const onPaste = (e) => {
  const text = (e.clipboardData || window.clipboardData)?.getData('text') || '';
  if (!URL_RE.test(text)) { URL_RE.lastIndex = 0; return; }
  URL_RE.lastIndex = 0;
  e.preventDefault();
  ingest(text);
  quickInput.value = '';
  refocus();
};

const removeItem = (index) => {
  const [gone] = form.value.items.splice(index, 1);
  if (gone?.imagePreview) URL.revokeObjectURL(gone.imagePreview);
};

// ── Optional photo per item ──────────────────────────────────────────────────
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // matches the API's 10MB rule

const pickImage = (item, event) => {
  const file = event.target.files?.[0];
  event.target.value = ''; // let them re-pick the same file after removing it
  if (!file) return;
  if (!file.type.startsWith('image/')) return;
  if (file.size > MAX_IMAGE_BYTES) {
    $toast.error(t.value.imageTooBig);
    return;
  }
  if (item.imagePreview) URL.revokeObjectURL(item.imagePreview);
  item.imageFile = file;
  item.imagePreview = URL.createObjectURL(file);
};

const clearImage = (item) => {
  if (item.imagePreview) URL.revokeObjectURL(item.imagePreview);
  item.imageFile = null;
  item.imagePreview = '';
};

// ── Draft persistence (tab-scoped) ───────────────────────────────────────────
const DRAFT_KEY = 'boxly_pr_online_draft';
onMounted(() => {
  try {
    const saved = JSON.parse(sessionStorage.getItem(DRAFT_KEY) || 'null');
    if (Array.isArray(saved?.items) && saved.items.length) {
      form.value.items = saved.items.map((i) => ({ ...i, key: ++seq, flash: false }));
    }
  } catch { /* no-op */ }
  refocus();
});
watch(form, (v) => {
  try {
    // Files and their blob: URLs can't survive a reload, so they're stripped —
    // everything else (links, quantities, variants, notes) comes back.
    const items = v.items.map(({ imageFile, imagePreview, ...rest }) => rest);
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ items }));
  } catch { /* no-op */ }
}, { deep: true });

// ── Submit ───────────────────────────────────────────────────────────────────
const submitRequest = async () => {
  if (!hasItems.value) return;
  loading.value = true;
  try {
    // FormData only when a photo is attached — a plain JSON body is lighter and
    // covers the common case, which is links and nothing else.
    const hasFiles = form.value.items.some((i) => i.imageFile);
    let body;

    if (hasFiles) {
      body = new FormData();
      form.value.items.forEach((i, index) => {
        body.append(`items[${index}][product_url]`, i.product_url || '');
        if (!i.product_url) body.append(`items[${index}][product_name]`, i.name || i.label);
        body.append(`items[${index}][quantity]`, String(Number(i.quantity) || 1));
        if (i.notes) body.append(`items[${index}][notes]`, i.notes);
        body.append(`items[${index}][options]`, i.variant ? JSON.stringify({ 'Talla / Color': i.variant }) : '{}');
        if (i.imageFile) body.append(`items[${index}][image]`, i.imageFile);
      });
    } else {
      body = {
        items: form.value.items.map((i) => ({
          // A link is enough — the API derives the name from it. Name-only items
          // (no link) send what the customer typed.
          product_url: i.product_url || '',
          ...(i.product_url ? {} : { product_name: i.name || i.label }),
          quantity: Number(i.quantity) || 1,
          ...(i.notes ? { notes: i.notes } : {}),
          // The variant is free text on purpose: making it a dropdown is what
          // forced the old page to scrape the variant matrix before the customer
          // could type anything. Cart prep reads this when it builds the cart.
          options: i.variant ? { 'Talla / Color': i.variant } : {},
        })),
      };
    }

    const res = await $customFetch('/purchase-requests', { method: 'POST', body });
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
/* New rows arrive with a bit of presence so the eye can follow them down from
   the paste bar — the old 8px slide was too quiet to register. */
.list-enter-active { transition: opacity 0.35s ease, transform 0.35s cubic-bezier(0.22, 1, 0.36, 1); }
.list-enter-from { opacity: 0; transform: translateY(-14px) scale(0.98); }
.list-leave-active { transition: all 0.3s ease; }
.list-leave-to { opacity: 0; transform: translateX(-20px); }
.list-move { transition: transform 0.35s ease; }

/* Confirmation line under the input */
.cue-enter-active { transition: opacity 0.18s ease, transform 0.18s ease; }
.cue-leave-active { transition: opacity 0.25s ease; }
.cue-enter-from { opacity: 0; transform: translateY(-4px); }
.cue-leave-to { opacity: 0; }

@keyframes check-pop {
  0% { transform: scale(0.4); opacity: 0; }
  60% { transform: scale(1.25); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
.check-pop { animation: check-pop 0.32s cubic-bezier(0.22, 1, 0.36, 1); }

@keyframes count-pulse {
  0% { transform: scale(1); }
  45% { transform: scale(1.18); }
  100% { transform: scale(1); }
}
.count-pulse { animation: count-pulse 0.45s cubic-bezier(0.22, 1, 0.36, 1); }

.slideup-enter-active, .slideup-leave-active { transition: transform 0.25s ease, opacity 0.25s ease; }
.slideup-enter-from, .slideup-leave-to { transform: translateY(100%); opacity: 0; }

@keyframes breathe {
  0%, 100% { transform: scale(1); opacity: 0.9; }
  50% { transform: scale(1.15); opacity: 0.6; }
}
.breathe { animation: breathe 7s ease-in-out infinite; }
.breathe-slow { animation: breathe 10s ease-in-out infinite; }
.marquee-track { animation: marquee 70s linear infinite; }
@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
@media (prefers-reduced-motion: reduce) { .breathe, .breathe-slow, .marquee-track { animation: none; } }
</style>
