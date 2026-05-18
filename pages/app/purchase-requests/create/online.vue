<template>
  <section class="min-h-screen bg-gray-50 pb-20">
    <!-- Sticky Header -->
    <div class="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div class="max-w-3xl mx-auto px-4 py-4">
        <div class="flex items-center gap-3">
          <NuxtLink
            to="/app/purchase-requests"
            class="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </NuxtLink>
          <div class="flex-1">
            <h1 class="text-lg sm:text-xl font-semibold text-gray-900">
              {{ t.createRequest }}
            </h1>
            <p class="text-sm text-gray-500">
              {{ t.stepAddItems }}
            </p>
          </div>
          <!-- Item Counter Badge -->
          <div
            v-if="hasItems"
            class="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-semibold"
          >
            {{ totalItems }} {{ t.items }}
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-3xl mx-auto px-4 py-6 space-y-6">
      
      <!-- Intro / Help Card -->
      <div class="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 items-start">
        <div class="p-2 bg-blue-100 rounded-full text-blue-600 flex-shrink-0">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h3 class="font-medium text-blue-900 text-sm">{{ t.howItWorks }}</h3>
          <p class="text-xs text-blue-700 mt-1 leading-relaxed">{{ t.howItWorksDesc }}</p>
        </div>
      </div>

      <!-- Add Item Button (Mobile & Desktop) -->
      <button
        @click="openAddModal"
        class="w-full flex items-center justify-between py-4 px-5 bg-white border border-gray-200 shadow-sm rounded-xl hover:border-primary-300 hover:shadow-md transition-all group"
      >
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center group-hover:bg-primary-100 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div class="text-left">
            <span class="block font-semibold text-gray-900">{{ hasItems ? t.addAnotherItem : t.addItem }}</span>
            <span class="block text-xs text-gray-500">{{ t.pasteLinkHint }}</span>
          </div>
        </div>
        <svg class="w-5 h-5 text-gray-400 group-hover:text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <!-- Items List -->
      <div v-if="hasItems" class="space-y-4">
        <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wider ml-1">{{ t.yourList }}</h3>
        
        <TransitionGroup name="list" tag="div" class="space-y-3">
          <div
            v-for="(item, index) in form.items"
            :key="index"
            class="bg-white rounded-xl border border-gray-200 shadow-sm p-4 relative overflow-hidden"
          >
            <div class="flex justify-between items-start gap-3">
              <!-- Item Index -->
              <div class="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">
                {{ index + 1 }}
              </div>

              <!-- Content -->
              <div class="flex-1 min-w-0">
                <h4 class="font-medium text-gray-900 truncate">{{ item.product_name }}</h4>
                <a :href="item.product_url" target="_blank" class="text-xs text-primary-600 hover:underline truncate block mb-2 flex items-center gap-1">
                  {{ truncateUrl(item.product_url) }}
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                </a>

                <div class="flex flex-wrap gap-2 text-xs mb-2">
                  <span class="bg-gray-50 px-2 py-1 rounded-md text-gray-600 border border-gray-100">
                    {{ t.qty }}: <strong>{{ item.quantity }}</strong>
                  </span>
                  <span class="bg-gray-50 px-2 py-1 rounded-md text-gray-600 border border-gray-100">
                    {{ t.price }}: <strong>${{ item.price }}</strong>
                  </span>
                </div>
                
                <!-- Structured Options Display -->
                <div v-if="item.options && Object.keys(item.options).length > 0" class="flex flex-wrap gap-2 mt-2">
                    <span v-for="(val, key) in item.options" :key="key" class="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs border border-blue-100">
                        <span class="font-semibold">{{ key }}:</span> {{ val }}
                    </span>
                </div>

                <!-- Image Preview in List -->
                <div v-if="item.imagePreview" class="mt-2 flex items-center gap-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100 w-fit">
                   <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                   {{ t.imageAttached }}
                </div>

                <!-- Notes -->
                <div v-if="item.notes" class="mt-2 text-xs text-gray-500 italic bg-gray-50 p-2 rounded border border-gray-100">
                    {{ item.notes }}
                </div>

              </div>

              <!-- Actions -->
              <button
                @click="removeItem(index)"
                class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </TransitionGroup>

        <!-- Summary Card -->
        <div class="bg-gray-900 rounded-2xl p-6 text-white shadow-lg mt-8">
          <div class="flex justify-between items-center mb-4 border-b border-gray-700 pb-4">
            <span class="text-gray-400 text-sm">{{ t.estimatedMerchandise }}</span>
            <span class="text-2xl font-bold">${{ estimatedTotal.toFixed(2) }} USD</span>
          </div>
          
          <div class="space-y-2 text-xs text-gray-400 mb-6">
            <div class="flex justify-between">
              <span>+ {{ t.shippingTax }}</span>
              <span>{{ t.tbd }}</span>
            </div>
            <div class="flex justify-between">
              <span>+ {{ t.serviceFee }} (8%)</span>
              <span>{{ t.tbd }}</span>
            </div>
          </div>

          <button
            @click="submitRequest"
            :disabled="loading"
            class="w-full py-3.5 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl shadow-lg hover:shadow-primary-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <span v-if="loading" class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            {{ loading ? t.submitting : t.submitRequest }}
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-16">
        <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <p class="text-gray-500 font-medium">{{ t.emptyList }}</p>
        <p class="text-sm text-gray-400 mt-1">{{ t.startAddingItems }}</p>
      </div>

    </div>

    <!-- Add Item Modal -->
    <TransitionRoot as="template" :show="showAddModal">
      <Dialog as="div" class="relative z-50" @close="closeAddModal">
        <TransitionChild
          as="template"
          enter="ease-out duration-300"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="ease-in duration-200"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </TransitionChild>

        <div class="fixed inset-0 z-10 overflow-y-auto">
          <div class="flex min-h-full items-end justify-center sm:items-center p-0 sm:p-4">
            <TransitionChild
              as="template"
              enter="ease-out duration-300"
              enter-from="opacity-0 translate-y-full sm:translate-y-0 sm:scale-95"
              enter-to="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leave-from="opacity-100 translate-y-0 sm:scale-100"
              leave-to="opacity-0 translate-y-full sm:translate-y-0 sm:scale-95"
            >
              <DialogPanel class="w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden">
                <!-- Modal Header -->
                <div class="px-4 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                  <h3 class="text-lg font-semibold text-gray-900">{{ t.addItemTitle }}</h3>
                  <button @click="closeAddModal" class="p-1 rounded-full hover:bg-gray-200 transition-colors">
                    <svg class="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <!-- Modal Body -->
                <form @submit.prevent="saveItem" class="p-5 space-y-5">
                  
                  <!-- URL Input (TYPE=TEXT to allow lazy copying without protocol) -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">{{ t.productUrl }} <span class="text-red-500">*</span></label>
                    <div class="relative">
                      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      </div>
                      <input
                        v-model="currentItem.product_url"
                        type="text" 
                        required
                        class="pl-10 block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 py-3 text-sm"
                        :placeholder="t.urlPlaceholder"
                        autofocus
                      >
                    </div>
                    <p class="mt-1 text-xs text-gray-400">{{ t.pasteLinkHint }}</p>
                  </div>

                  <!-- Name Input -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">{{ t.productName }} <span class="text-red-500">*</span></label>
                    <input
                      v-model="currentItem.product_name"
                      type="text"
                      required
                      class="block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 py-3 text-sm"
                      :placeholder="t.namePlaceholder"
                    >
                  </div>

                  <div class="grid grid-cols-2 gap-4">
                    <!-- Price -->
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">{{ t.price }} (USD) <span class="text-red-500">*</span></label>
                      <div class="relative">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span class="text-gray-500 font-bold">$</span>
                        </div>
                        <input
                          v-model.number="currentItem.price"
                          type="number"
                          min="0.01"
                          step="0.01"
                          required
                          class="pl-7 block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 py-3 text-sm"
                          placeholder="0.00"
                        >
                      </div>
                    </div>

                    <!-- Quantity -->
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">{{ t.quantity }}</label>
                      <div class="flex items-center border border-gray-300 rounded-xl overflow-hidden">
                        <button type="button" @click="decrementQty" class="px-3 py-3 bg-gray-50 hover:bg-gray-100 border-r border-gray-300">
                          <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" /></svg>
                        </button>
                        <input
                          v-model.number="currentItem.quantity"
                          type="number"
                          min="1"
                          class="block w-full border-none text-center focus:ring-0 py-3 text-sm"
                        >
                        <button type="button" @click="incrementQty" class="px-3 py-3 bg-gray-50 hover:bg-gray-100 border-l border-gray-300">
                          <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- Product Options (Structured) -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">{{ t.productOptions }}</label>
                    
                    <!-- Add Option Row -->
                    <div class="flex gap-2 mb-2">
                        <select v-model="newOptionType" class="rounded-lg border-gray-300 text-sm flex-1 py-2">
                            <option value="" disabled selected>{{ t.selectOptionType }}</option>
                            <option value="Size">{{ t.size }}</option>
                            <option value="Color">{{ t.color }}</option>
                            <option value="Style">{{ t.style }}</option>
                            <option value="Model">{{ t.model }}</option>
                            <option value="Other">{{ t.other }}</option>
                        </select>
                        <input v-model="newOptionValue" type="text" :placeholder="t.optionValue" class="rounded-lg border-gray-300 text-sm flex-1 py-2">
                        <button type="button" @click="addOption" :disabled="!newOptionType || !newOptionValue" class="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
                        </button>
                    </div>

                    <!-- Options List -->
                    <div v-if="Object.keys(currentItem.options).length > 0" class="space-y-2 mt-3">
                        <div v-for="(val, key) in currentItem.options" :key="key" class="flex items-center justify-between bg-gray-50 p-2 rounded-lg border border-gray-200 text-sm">
                            <span class="text-gray-700"><span class="font-medium">{{ key }}:</span> {{ val }}</span>
                            <button type="button" @click="removeOption(key)" class="text-red-500 hover:text-red-700 p-1">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    </div>
                  </div>

                  <!-- Image Upload -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">{{ t.productImage }} <span class="text-gray-400 font-normal">({{ t.optional }})</span></label>
                    <div class="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:border-primary-400 transition-colors" @click="$refs.imageInput.click()">
                        <input ref="imageInput" type="file" class="hidden" accept="image/*" @change="handleImageSelect">
                        
                        <div v-if="!currentItem.imagePreview" class="text-gray-500">
                            <svg class="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                            <span class="text-xs">{{ t.uploadImage }}</span>
                        </div>
                        <div v-else class="relative">
                            <img :src="currentItem.imagePreview" class="h-24 mx-auto rounded-lg shadow-sm object-cover">
                            <button @click.stop="removeImage" class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-md"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                        </div>
                    </div>
                  </div>

                  <!-- Notes -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">{{ t.notes }} <span class="text-gray-400 font-normal">({{ t.optional }})</span></label>
                    <textarea
                      v-model="currentItem.notes"
                      rows="2"
                      class="block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm py-2"
                      :placeholder="t.notesPlaceholder"
                    ></textarea>
                  </div>

                  <!-- Submit Button -->
                  <button
                    type="submit"
                    class="w-full py-3.5 bg-primary-600 text-white font-bold rounded-xl shadow-md hover:bg-primary-700 transition-all"
                  >
                    {{ t.addItem }}
                  </button>

                </form>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue';
import { Dialog, DialogPanel, TransitionChild, TransitionRoot } from '@headlessui/vue';

definePageMeta({
  layout: 'app',
  middleware: ['auth', 'customer', 'complete-profile']
});

const { $customFetch, $toast } = useNuxtApp();
const { t: createTranslations } = useLanguage();
const router = useRouter();

const translations = {
  createRequest: { es: 'Nueva Solicitud', en: 'New Request' },
  stepAddItems: { es: 'Agregar Artículos', en: 'Add Items' },
  howItWorks: { es: '¿Cómo funciona?', en: 'How it works?' },
  howItWorksDesc: { 
    es: 'Agrega los enlaces de los productos que deseas comprar. Nosotros nos encargamos de la compra, envío e importación.',
    en: 'Add links to the products you want to buy. We handle the purchase, shipping, and import.'
  },
  items: { es: 'Artículos', en: 'Items' },
  addItem: { es: 'Agregar Artículo', en: 'Add Item' },
  addAnotherItem: { es: 'Agregar Otro Artículo', en: 'Add Another Item' },
  addItemTitle: { es: 'Detalles del Artículo', en: 'Item Details' },
  pasteLinkHint: { es: 'Pega el enlace, nombre y precio', en: 'Paste link, name and price' },
  yourList: { es: 'Tu Lista', en: 'Your List' },
  productName: { es: 'Nombre del Producto', en: 'Product Name' },
  productUrl: { es: 'Enlace (URL)', en: 'Link (URL)' },
  urlPlaceholder: { es: 'https://...', en: 'https://...' },
  namePlaceholder: { es: 'Ej: Zapatos Nike Talla 10', en: 'Ex: Nike Shoes Size 10' },
  price: { es: 'Precio', en: 'Price' },
  quantity: { es: 'Cantidad', en: 'Quantity' },
  qty: { es: 'Cant', en: 'Qty' },
  productOptions: { es: 'Opciones del Producto', en: 'Product Options' },
  selectOptionType: { es: 'Tipo de Opción', en: 'Option Type' },
  optionValue: { es: 'Valor (Ej: Rojo, M)', en: 'Value (Ex: Red, M)' },
  size: { es: 'Talla', en: 'Size' },
  color: { es: 'Color', en: 'Color' },
  style: { es: 'Estilo', en: 'Style' },
  model: { es: 'Modelo', en: 'Model' },
  other: { es: 'Otro', en: 'Other' },
  notes: { es: 'Notas Adicionales', en: 'Additional Notes' },
  optional: { es: 'Opcional', en: 'Optional' },
  notesPlaceholder: { es: 'Cualquier otra instrucción...', en: 'Any other instructions...' },
  estimatedMerchandise: { es: 'Estimado Mercancía', en: 'Est. Merchandise' },
  shippingTax: { es: 'Envío e Impuestos (USA)', en: 'Shipping & Tax (USA)' },
  serviceFee: { es: 'Tarifa de Servicio', en: 'Service Fee' },
  tbd: { es: 'Por Calcular', en: 'TBD' },
  submitRequest: { es: 'Enviar Solicitud', en: 'Submit Request' },
  submitting: { es: 'Enviando...', en: 'Sending...' },
  emptyList: { es: 'Tu lista está vacía', en: 'Your list is empty' },
  startAddingItems: { es: 'Agrega productos para comenzar', en: 'Add products to start' },
  successMsg: { es: 'Solicitud enviada exitosamente', en: 'Request sent successfully' },
  errorMsg: { es: 'Error al enviar solicitud', en: 'Error sending request' },
  productImage: { es: 'Imagen del Producto', en: 'Product Image' },
  uploadImage: { es: 'Haz clic para subir imagen', en: 'Click to upload image' },
  imageAttached: { es: 'Imagen adjunta', en: 'Image attached' },
  saveItem: { es: 'Guardar Artículo', en: 'Save Item' },
};

const t = createTranslations(translations);

// State
const form = ref({ items: [] });
const loading = ref(false);
const showAddModal = ref(false);

// Current Item State
const currentItem = ref({
  product_url: '',
  product_name: '',
  price: null,
  quantity: 1,
  notes: '',
  options: {},
  image: null,
  imagePreview: null
});

// Option Inputs
const newOptionType = ref('');
const newOptionValue = ref('');

// Computed
const hasItems = computed(() => form.value.items.length > 0);
const totalItems = computed(() => form.value.items.reduce((sum, i) => sum + i.quantity, 0));
const estimatedTotal = computed(() => form.value.items.reduce((sum, i) => sum + (i.price * i.quantity), 0));

// Methods
const openAddModal = () => {
  currentItem.value = { product_url: '', product_name: '', price: null, quantity: 1, notes: '', options: {}, image: null, imagePreview: null };
  newOptionType.value = '';
  newOptionValue.value = '';
  showAddModal.value = true;
};

const closeAddModal = () => {
  showAddModal.value = false;
};

const incrementQty = () => {
  if (currentItem.value.quantity < 999) currentItem.value.quantity++;
};

const decrementQty = () => {
  if (currentItem.value.quantity > 1) currentItem.value.quantity--;
};

const addOption = () => {
    if (newOptionType.value && newOptionValue.value) {
        currentItem.value.options[newOptionType.value] = newOptionValue.value;
        newOptionType.value = '';
        newOptionValue.value = '';
    }
};

const removeOption = (key) => {
    delete currentItem.value.options[key];
};

const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
        currentItem.value.image = file;
        currentItem.value.imagePreview = URL.createObjectURL(file);
    }
};

const removeImage = () => {
    currentItem.value.image = null;
    currentItem.value.imagePreview = null;
};

const fixUrl = (url) => {
  if (!url) return '';
  let cleanUrl = url.trim();
  if (!cleanUrl.match(/^https?:\/\//i)) {
    return 'https://' + cleanUrl;
  }
  return cleanUrl;
};

const saveItem = () => {
  // Auto-add pending option if user typed but forgot to click +
  if (newOptionType.value && newOptionValue.value) {
     currentItem.value.options[newOptionType.value] = newOptionValue.value;
     newOptionType.value = '';
     newOptionValue.value = '';
  }

  currentItem.value.product_url = fixUrl(currentItem.value.product_url);

  form.value.items.push({ 
      ...currentItem.value,
      options: { ...currentItem.value.options },
      image: currentItem.value.image,
      imagePreview: currentItem.value.imagePreview 
  });
  closeAddModal();
  $toast.success(t.value.addItem);
};

const removeItem = (index) => {
  form.value.items.splice(index, 1);
};

const truncateUrl = (url) => {
  try {
    const { hostname } = new URL(fixUrl(url));
    return hostname.replace('www.', '');
  } catch {
    return 'Link';
  }
};

// IMPORTANT: SUBMIT USING FORMDATA FOR FILE UPLOADS & PROPER JSON SERIALIZATION
const submitRequest = async () => {
  loading.value = true;
  
  try {
    const formData = new FormData();
    
    form.value.items.forEach((item, index) => {
        formData.append(`items[${index}][product_name]`, item.product_name);
        formData.append(`items[${index}][product_url]`, item.product_url);
        formData.append(`items[${index}][price]`, item.price);
        formData.append(`items[${index}][quantity]`, item.quantity);
        
        if (item.notes) {
            formData.append(`items[${index}][notes]`, item.notes);
        }
        
        // FIX: Correctly serialize options object
        if (Object.keys(item.options).length > 0) {
            formData.append(`items[${index}][options]`, JSON.stringify(item.options));
        } else {
             formData.append(`items[${index}][options]`, '{}');
        }
        
        // Append Image
        if (item.image) {
            formData.append(`items[${index}][image]`, item.image);
        }
    });

    await $customFetch('/purchase-requests', {
      method: 'POST',
      body: formData
    });
    
    $toast.success(t.value.successMsg);
    router.push('/app/purchase-requests');
  } catch (error) {
    console.error(error);
    $toast.error(t.value.errorMsg);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>