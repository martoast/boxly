<template>
  <section class="min-h-screen bg-white pb-40 sm:pb-36">
    <!-- Header -->
    <div class="bg-white/95 backdrop-blur sticky top-0 z-30">
      <div class="max-w-2xl mx-auto px-4 pt-3.5 pb-3">
        <div class="flex items-center gap-2">
          <NuxtLink :to="backTo" class="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors" :aria-label="t.back">
            <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </NuxtLink>
          <div class="flex-1 min-w-0">
            <h1 class="text-[17px] sm:text-lg font-bold text-gray-900 truncate leading-tight">{{ t.createRequest }}</h1>
            <p class="text-[13px] text-gray-500">{{ t.stepAddItems }}</p>
          </div>
          <TutorialVideoButton loom-id="d0b29f8d1eb44727a1fb9799aaf04e61" variant="link" />
        </div>
      </div>
      <div class="max-w-2xl mx-auto px-4"><div class="border-b border-gray-100"></div></div>
    </div>

    <div class="max-w-2xl mx-auto px-4">

      <!-- ============ PASTE — the whole product, really ============ -->
      <div class="pt-6 pb-6 border-b border-gray-100">
        <h2 class="text-[22px] sm:text-2xl font-bold text-gray-900 tracking-tight">{{ t.heroTitle }}</h2>
        <p class="mt-1 text-[15px] text-gray-500">{{ t.heroSubtitle }}</p>

        <form @submit.prevent="addFromInput" class="mt-4">
          <div class="flex gap-2">
            <input
              ref="pasteInput"
              v-model="quickInput"
              type="text"
              inputmode="url"
              autocomplete="off"
              class="flex-1 min-w-0 rounded-full border border-gray-300 bg-white px-4 py-3 text-[15px] text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:ring-0 transition-colors"
              :placeholder="t.pastePlaceholder"
              @paste="onPaste"
            >
            <button
              type="submit"
              :class="[
                'flex-shrink-0 inline-flex items-center gap-1.5 rounded-full px-5 py-3 text-[15px] font-semibold transition-colors active:scale-[0.98]',
                quickInput.trim() ? 'bg-gray-900 text-white hover:bg-black' : 'bg-gray-100 text-gray-400'
              ]"
            >
              {{ t.addCta }}
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 5v14m7-7H5" /></svg>
            </button>
          </div>
          <!--
            The add is instant, and that was the problem: testers pasted and
            couldn't tell it had worked. The confirmation has to appear HERE,
            under the input, because that's where their eyes already are.
            Naming the product also answers "did I paste the right link?"
          -->
          <div class="mt-2.5 pl-1 min-h-[1.25rem]">
            <Transition name="cue" mode="out-in">
              <p v-if="cue" :key="cue.id" class="flex items-center gap-1.5 text-[13px] font-medium" :class="cue.kind === 'dupe' ? 'text-amber-600' : 'text-emerald-600'">
                <svg v-if="cue.kind !== 'dupe'" class="w-3.5 h-3.5 flex-shrink-0 check-pop" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <svg v-else class="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                <span class="truncate">{{ cue.text }}</span>
              </p>
              <p v-else key="hint" class="text-[13px] text-gray-500">{{ t.pasteHint }}</p>
            </Transition>
          </div>
        </form>
      </div>

      <!-- ============ EMPTY STATE ============ -->
      <div v-if="!hasItems" class="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div
          v-for="(step, i) in steps"
          :key="i"
          class="rounded-2xl border border-gray-200 p-5"
        >
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center flex-shrink-0" v-html="step.icon"></div>
            <span class="text-xs font-bold text-gray-300">0{{ i + 1 }}</span>
          </div>
          <h3 class="mt-3 font-semibold text-gray-900 text-sm">{{ step.title }}</h3>
          <p class="mt-1 text-xs text-gray-500 leading-relaxed">{{ step.desc }}</p>
        </div>
      </div>

      <!-- ============ THE LIST — the products are the point of the page ============ -->
      <div v-if="hasItems" class="pt-6">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-[20px] font-bold text-gray-900">{{ t.yourList }}</h3>
          <span :class="['rounded-full bg-gray-100 px-3 py-1 text-[13px] font-semibold text-gray-700 tabular-nums', countPulse ? 'count-pulse' : '']">{{ itemsLabel(totalItems) }}</span>
        </div>

        <TransitionGroup name="list" tag="div" class="space-y-3">
          <div
            v-for="(item, index) in form.items"
            :key="item.key"
            :class="[
              'relative bg-white rounded-3xl border p-4 transition-all duration-500',
              item.flash ? 'border-amber-400 ring-2 ring-amber-100' : '',
              item.justAdded && !item.flash ? 'border-emerald-400 ring-2 ring-emerald-100' : '',
              !item.flash && !item.justAdded ? 'border-gray-200' : ''
            ]"
          >
            <button type="button" class="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" :aria-label="t.remove" @click="removeItem(index)">
              <svg class="w-[18px] h-[18px]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 002 2h8a2 2 0 002-2l1-12M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" /></svg>
            </button>

            <div class="flex gap-3.5">
              <!-- The product's own photo (from its page), or the one they attached. -->
              <div class="relative flex-shrink-0 w-[84px] h-[84px] sm:w-24 sm:h-24 rounded-2xl bg-gray-100 overflow-hidden grid place-items-center">
                <img
                  v-if="thumbFor(item)"
                  :src="thumbFor(item)"
                  alt=""
                  referrerpolicy="no-referrer"
                  class="absolute inset-0 w-full h-full object-cover"
                  @error="onThumbError(item)"
                >
                <span v-else-if="item.resolving" class="absolute inset-0 shimmer"></span>
                <svg v-else class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16 10V7a4 4 0 00-8 0v3M5 8h14l1 13H4L5 8z" /></svg>
              </div>

              <div class="flex-1 min-w-0 pr-7">
                <p :class="['text-[16px] font-bold leading-snug line-clamp-2 transition-colors', item.resolving && !item.title ? 'text-gray-300' : 'text-gray-900']">{{ displayName(item) }}</p>
                <a
                  v-if="item.product_url"
                  :href="item.product_url"
                  target="_blank"
                  rel="noopener"
                  class="mt-0.5 block text-[13.5px] text-gray-500 hover:text-gray-900 truncate"
                >{{ item.store }}</a>
                <p v-else class="mt-0.5 text-[13.5px] text-gray-500">{{ t.noLink }}</p>

                <div class="mt-2 flex items-center justify-between gap-2">
                  <span class="text-[13.5px] text-gray-500">{{ t.quantity }}</span>
                  <div class="flex items-center">
                    <button type="button" class="w-8 h-8 grid place-items-center rounded-full text-gray-900 hover:bg-gray-100 disabled:opacity-25 text-lg leading-none" :disabled="item.quantity <= 1" :aria-label="t.less" @click="item.quantity--">−</button>
                    <span class="w-7 text-center text-[16px] font-semibold text-gray-900 tabular-nums">{{ item.quantity }}</span>
                    <button type="button" class="w-8 h-8 grid place-items-center rounded-full text-gray-900 hover:bg-gray-100 text-lg leading-none" :aria-label="t.more" @click="item.quantity++">+</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Variant: the one thing we still need from them. -->
            <label class="mt-3.5 block rounded-2xl bg-gray-100 px-4 pt-2.5 pb-2 focus-within:ring-2 focus-within:ring-gray-900/10">
              <span class="block text-[12.5px] text-gray-500">{{ t.variantLabel }}</span>
              <input
                v-model="item.variant"
                type="text"
                class="w-full border-0 bg-transparent p-0 pt-0.5 text-[16px] text-gray-900 placeholder-gray-400 focus:ring-0"
                :placeholder="t.variantPlaceholder"
              >
            </label>

            <!-- Photo + note stay folded until they want them. -->
            <button
              v-if="!item.extrasOpen && !item.notes && !item.imagePreview"
              type="button"
              class="mt-3 inline-flex items-center gap-2 text-[14px] text-gray-500 hover:text-gray-900 transition-colors"
              @click="item.extrasOpen = true"
            >
              <svg class="w-[18px] h-[18px]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {{ t.addExtras }}
            </button>
            <div v-else class="mt-3 space-y-2">
              <input
                v-model="item.notes"
                type="text"
                class="w-full rounded-xl border-gray-200 text-[15px] placeholder-gray-400 focus:border-gray-900 focus:ring-0 py-2"
                :placeholder="t.notesPlaceholder"
              >
              <div class="flex items-center gap-3">
                <label class="inline-flex items-center gap-1.5 text-[13.5px] font-medium rounded-lg px-3 py-1.5 cursor-pointer border border-dashed transition-colors"
                  :class="item.imagePreview ? 'border-emerald-300 text-emerald-700 bg-emerald-50/60' : 'border-gray-300 text-gray-600 hover:border-gray-500'"
                >
                  <input type="file" accept="image/*" class="sr-only" @change="(e) => pickImage(item, e)">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {{ item.imagePreview ? t.changePhoto : t.addPhoto }}
                </label>
                <button v-if="item.imagePreview" type="button" class="text-[13.5px] text-gray-400 hover:text-red-500 transition-colors" @click="clearImage(item)">{{ t.removePhoto }}</button>
              </div>
            </div>
          </div>
        </TransitionGroup>

        <!-- What happens next -->
        <div class="mt-5 rounded-2xl bg-gray-50 p-5">
          <h3 class="font-semibold text-gray-900 text-sm">{{ t.summaryTitle }}</h3>
          <p class="mt-1.5 text-sm text-gray-500 leading-relaxed">{{ t.summaryBody }}</p>
          <NuxtLink to="/app/pricing" class="mt-2 inline-block text-sm font-medium text-gray-900 underline underline-offset-2 hover:text-black">
            {{ t.seeBoxPrices }} →
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- ============ STICKY SUBMIT ============ -->
    <Transition name="slideup">
      <div v-if="hasItems" class="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-gray-100">
        <div class="max-w-2xl mx-auto px-4 pt-3 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
          <p class="text-[13px] text-gray-500 text-center mb-2">{{ t.noChargeYet }}</p>
          <button
            :disabled="loading"
            class="w-full bg-gray-900 hover:bg-black disabled:opacity-60 text-white text-[16px] font-semibold py-3.5 rounded-full transition-colors active:scale-[0.99] flex items-center justify-center gap-2"
            @click="submitRequest"
          >
            <span v-if="loading">{{ t.submitting }}</span>
            <span v-else>{{ t.submitRequest }} · {{ itemsLabel(totalItems) }}</span>
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
  back: { es: 'Regresar', en: 'Back' },
  heroTitle: { es: '¿Qué quieres comprar?', en: 'What do you want to buy?' },
  heroSubtitle: { es: 'Pega el link de cualquier producto de USA.', en: 'Paste the link of any US product.' },
  pastePlaceholder: { es: 'https://tienda.com/producto…', en: 'https://store.com/product…' },
  pasteHint: { es: 'También puedes pegar varios links a la vez.', en: 'You can also paste several links at once.' },
  addCta: { es: 'Agregar', en: 'Add' },
  step1Title: { es: 'Pega tus links', en: 'Paste your links' },
  step1Desc: { es: 'Uno por uno o todos juntos. Sin esperas.', en: 'One by one or all at once. No waiting.' },
  step2Title: { es: 'Nosotros lo compramos', en: 'We buy it for you' },
  step2Desc: { es: 'Te cotizamos y, al aprobar, lo compramos.', en: 'We quote you and, once approved, we buy it.' },
  step3Title: { es: 'Llega a México', en: 'It arrives in Mexico' },
  step3Desc: { es: 'Lo enviamos hasta la puerta de tu casa.', en: 'We ship it right to your door.' },
  item: { es: 'artículo', en: 'item' },
  items: { es: 'artículos', en: 'items' },
  productOf: { es: 'Producto de', en: 'Product from' },
  quantity: { es: 'Cantidad', en: 'Quantity' },
  less: { es: 'Menos', en: 'Less' },
  more: { es: 'Más', en: 'More' },
  variantLabel: { es: 'Color / talla / variante', en: 'Color / size / variant' },
  addExtras: { es: 'Agregar foto o nota (opcional)', en: 'Add a photo or note (optional)' },
  yourList: { es: 'Tu lista', en: 'Your list' },
  remove: { es: 'Eliminar', en: 'Remove' },
  noLink: { es: 'Sin link — lo buscamos por ti', en: 'No link — we’ll find it' },
  variantPlaceholder: { es: 'Ej. Rosa, talla M', en: 'E.g. Pink, size M' },
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
  noChargeYet: { es: 'Recibirás una cotización antes de pagar.', en: "You'll get a quote before you pay." },
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

const itemsLabel = (n) => `${n} ${n === 1 ? t.value.item : t.value.items}`;

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
    // A real slug has words ("align-pant-2"); a lone token must be a plain word
    // ("leggings") — short-link codes like "J7xj0lxatg" and SKUs are not names.
    if (/[-_+]/.test(slug) ? !/[a-z]{3,}/i.test(slug) : !/^[a-z]{4,}$/i.test(slug)) continue;
    const pretty = slug.replace(/[-_+]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (!pretty) continue;
    return pretty.replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return '';
};

/** "shop.lululemon.com" → "lululemon". */
const brandOf = (url) => {
  const parts = storeOf(url).split('.').filter(Boolean);
  return parts.length >= 2 ? parts[parts.length - 2] : parts[0] || '';
};

// The store page's real title once we have it; until then the slug; failing
// that, "Producto de lululemon" rather than a meaningless code.
const displayName = (item) => {
  if (!item.product_url) return item.label;
  return item.title || item.label || `${t.value.productOf} ${brandOf(item.product_url)}`;
};

// ── Product preview (name + photo) ──────────────────────────────────────────
// Adding never waits on this: the row lands instantly with its slug name, and
// the real title and photo fill in when the store page answers. A few at a
// time, so pasting a dozen links stays inside the endpoint's rate limit.
const PREVIEW_CONCURRENCY = 3;
const previewQueue = [];
let previewsRunning = 0;

const resolveItem = (item) => {
  if (!item?.product_url) return;
  item.resolving = true;
  previewQueue.push(item);
  pumpPreviews();
};

const pumpPreviews = () => {
  while (previewsRunning < PREVIEW_CONCURRENCY && previewQueue.length) {
    const item = previewQueue.shift();
    // Removed while it waited — skip it.
    if (!form.value.items.some((i) => i.key === item.key)) continue;
    previewsRunning++;
    $customFetch('/products/extract', { method: 'POST', body: { url: item.product_url } })
      .then((res) => {
        const d = res?.data || {};
        const live = form.value.items.find((i) => i.key === item.key);
        if (!live) return;
        if (typeof d.title === 'string' && d.title.trim()) live.title = d.title.trim().slice(0, 255);
        if (typeof d.image === 'string' && /^https?:\/\//.test(d.image)) live.image = d.image;
      })
      .catch(() => { /* no preview — the slug / brand name stands */ })
      .finally(() => {
        const live = form.value.items.find((i) => i.key === item.key);
        if (live) live.resolving = false;
        previewsRunning--;
        pumpPreviews();
      });
  }
};

const thumbFor = (item) => item.imagePreview || (!item.imageFailed && item.image) || '';
const onThumbError = (item) => {
  if (item.imagePreview) return;
  item.imageFailed = true;
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
    title: '',
    image: '',
    imageFailed: false,
    resolving: false,
    extrasOpen: false,
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
  // Work on the reactive row, not the raw object we pushed.
  const live = form.value.items[form.value.items.length - 1];
  setTimeout(() => { live.justAdded = false; }, 1600);
  resolveItem(live);
  return live;
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
    showCue(`${t.value.addedOne} · ${displayName(added[0])}`);
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
      form.value.items = saved.items.map((i) => ({ ...i, key: ++seq, flash: false, justAdded: false, resolving: false, imageFailed: false }));
      // A draft saved before its preview landed gets one more try.
      form.value.items.filter((i) => i.product_url && !i.title && !i.image).forEach(resolveItem);
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
        else if (i.title) body.append(`items[${index}][product_name]`, i.title);
        if (!i.imageFile && i.image && !i.imageFailed) body.append(`items[${index}][product_image_url]`, i.image);
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
          // The store page's real title when the preview found it; otherwise the
          // API derives the name from the link's slug.
          ...(i.product_url ? (i.title ? { product_name: i.title } : {}) : { product_name: i.name || i.label }),
          // The product photo, re-hosted by the API so the request keeps it.
          ...(i.image && !i.imageFailed ? { product_image_url: i.image } : {}),
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

/* Photo placeholder while the product preview loads. */
.shimmer {
  background: linear-gradient(100deg, rgba(229, 231, 235, 0) 30%, rgba(255, 255, 255, 0.7) 50%, rgba(229, 231, 235, 0) 70%) #f3f4f6;
  background-size: 200% 100%;
  animation: shimmer 1.3s linear infinite;
}
@keyframes shimmer { from { background-position: 150% 0; } to { background-position: -50% 0; } }
@media (prefers-reduced-motion: reduce) { .shimmer { animation: none; } }
</style>
