<template>
    <section class="min-h-screen bg-gray-50 pb-20">
      <!-- Sticky Header -->
      <div class="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div class="max-w-4xl mx-auto px-4 py-4">
          <div class="flex items-center gap-3">
            <NuxtLink
              to="/app/shopping/purchase-requests"
              class="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
            </NuxtLink>
            <div class="flex-1">
              <h1 class="text-lg sm:text-xl font-semibold text-gray-900">
                {{ t.createAdminRequest }}
              </h1>
            </div>
          </div>
        </div>
      </div>
  
      <!-- Main Content -->
      <div class="max-w-4xl mx-auto px-4 py-6 space-y-6">
        
        <!-- Step 1: Select Customer -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 class="text-lg font-bold text-gray-900 mb-4">{{ t.customer }}</h2>
          
          <!-- Customer Search -->
          <div class="relative" v-if="!selectedCustomer">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <input 
                  v-model="customerSearch" 
                  type="text" 
                  :placeholder="t.searchCustomer" 
                  class="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  @input="searchCustomers"
              >
              
              <!-- Results Dropdown -->
              <div v-if="showCustomerDropdown && customers.length > 0" class="absolute z-10 w-full bg-white mt-1 border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  <div 
                      v-for="customer in customers" 
                      :key="customer.id" 
                      @click="selectCustomer(customer)"
                      class="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0 flex justify-between items-center"
                  >
                      <div>
                          <div class="font-medium text-gray-900">{{ customer.name }}</div>
                          <div class="text-xs text-gray-500">{{ customer.email }}</div>
                      </div>
                      <span class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{{ customer.id }}</span>
                  </div>
              </div>
          </div>
  
          <!-- Selected Customer Display -->
          <div v-if="selectedCustomer" class="p-4 bg-primary-50 border border-primary-100 rounded-lg flex justify-between items-center animate-fadeIn">
              <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-primary-200 flex items-center justify-center text-primary-700 font-bold">
                      {{ selectedCustomer.name ? selectedCustomer.name.charAt(0).toUpperCase() : 'U' }}
                  </div>
                  <div>
                      <p class="font-bold text-primary-900">{{ selectedCustomer.name }}</p>
                      <p class="text-sm text-primary-700">{{ selectedCustomer.email }}</p>
                  </div>
              </div>
              <button @click="selectedCustomer = null" class="text-primary-600 hover:text-primary-800 text-sm font-medium underline">{{ t.change }}</button>
          </div>
        </div>
  
        <!-- Step 2: Items (Only show if customer selected) -->
        <div v-if="selectedCustomer" class="space-y-6 animate-fadeIn">
            
            <!-- Items List -->
            <div v-if="hasItems" class="space-y-4">
              <div class="flex justify-between items-center px-1">
                  <h3 class="text-lg font-bold text-gray-900">{{ t.items }} ({{ totalItems }})</h3>
                  <span class="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{{ t.estTotal }}: ${{ estimatedTotal }}</span>
              </div>
              
              <TransitionGroup name="list" tag="div" class="space-y-3">
                <div
                  v-for="(item, index) in form.items"
                  :key="index"
                  class="bg-white rounded-xl border border-gray-200 shadow-sm p-4 relative overflow-hidden group cursor-pointer hover:shadow-md transition-all"
                  @click="editItem(index)"
                >
                  <div class="flex justify-between items-start gap-3">
                    <div class="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">
                      {{ index + 1 }}
                    </div>
  
                    <div class="flex-1 min-w-0">
                      <h4 class="font-medium text-gray-900 truncate">{{ item.product_name }}</h4>
                      <div class="text-xs text-primary-600 truncate mb-2 flex items-center gap-1">
                           <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                           {{ truncateUrl(item.product_url) }}
                      </div>
  
                      <div class="flex gap-3 text-xs text-gray-600 mb-2">
                          <span class="bg-gray-100 px-2 py-1 rounded">{{ t.qty }}: <strong>{{ item.quantity }}</strong></span>
                          <span class="bg-gray-100 px-2 py-1 rounded">{{ t.price }}: <strong>${{ item.price }}</strong></span>
                      </div>
                      
                      <!-- Options -->
                      <div v-if="item.options && Object.keys(item.options).length > 0" class="flex flex-wrap gap-2 mt-2">
                          <span v-for="(val, key) in item.options" :key="key" class="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100">
                              <strong>{{ key }}:</strong> {{ val }}
                          </span>
                      </div>
  
                       <!-- Image Indicator -->
                      <div v-if="item.imagePreview" class="mt-2 flex items-center gap-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100 w-fit">
                          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                          {{ t.imageAttached }}
                      </div>
                    </div>
  
                    <button @click.stop="removeItem(index)" class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                  </div>
                </div>
              </TransitionGroup>
            </div>
  
            <!-- Add Item Button -->
            <button
              @click="openAddModal"
              class="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50 transition-all flex items-center justify-center gap-2 font-medium"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
              {{ hasItems ? t.addAnotherItem : t.addItem }}
            </button>
  
            <!-- Admin Notes & Status -->
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
               <div>
                   <label class="block text-sm font-bold text-gray-900 mb-2">{{ t.status }}</label>
                   <select v-model="form.status" class="w-full border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500">
                      <option value="pending_review">Pending Review</option>
                      <option value="quoted">Quoted</option>
                      <option value="paid">Paid</option>
                      <option value="purchased">Purchased (Backfill)</option>
                   </select>
               </div>
               
               <div>
                  <label class="block text-sm font-bold text-gray-900 mb-2">{{ t.adminNotes }}</label>
                  <textarea v-model="form.admin_notes" rows="3" class="w-full border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm" :placeholder="t.notesPlaceholder"></textarea>
               </div>
            </div>
  
            <!-- Submit -->
            <div class="flex justify-end pt-4">
               <button
                  @click="submitRequest"
                  :disabled="loading || !hasItems"
                  class="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-lg hover:shadow-primary-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <span v-if="loading" class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  {{ loading ? t.saving : t.createRequest }}
                </button>
            </div>
        </div>
  
      </div>
  
      <!-- Item Modal (Same as User Create Page) -->
      <TransitionRoot as="template" :show="showModal">
        <Dialog as="div" class="relative z-50" @close="closeModal">
          <TransitionChild as="template" enter="ease-out duration-300" enter-from="opacity-0" enter-to="opacity-100" leave="ease-in duration-200" leave-from="opacity-100" leave-to="opacity-0">
            <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          </TransitionChild>
  
          <div class="fixed inset-0 z-10 overflow-y-auto">
            <div class="flex min-h-full items-end justify-center sm:items-center p-0 sm:p-4">
              <TransitionChild as="template" enter="ease-out duration-300" enter-from="opacity-0 translate-y-full sm:translate-y-0 sm:scale-95" enter-to="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200" leave-from="opacity-100 translate-y-0 sm:scale-100" leave-to="opacity-0 translate-y-full sm:translate-y-0 sm:scale-95">
                <DialogPanel class="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden">
                  <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                    <h3 class="text-lg font-bold text-gray-900">{{ isEditing ? t.editItem : t.addItem }}</h3>
                    <button @click="closeModal" class="p-1 rounded-full hover:bg-gray-200 transition-colors text-gray-500">
                      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
  
                  <form @submit.prevent="saveItem" class="p-6 space-y-4">
                     <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">{{ t.productUrl }}</label>
                      <div class="relative">
                          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg></div>
                          <input v-model="currentItem.product_url" type="text" required class="pl-10 w-full rounded-lg border-gray-300 focus:ring-primary-500 focus:border-primary-500" :placeholder="t.urlPlaceholder">
                      </div>
                    </div>
  
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">{{ t.productName }}</label>
                      <input v-model="currentItem.product_name" type="text" required class="w-full rounded-lg border-gray-300 focus:ring-primary-500 focus:border-primary-500" :placeholder="t.namePlaceholder">
                    </div>
  
                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">{{ t.price }} (USD)</label>
                        <div class="relative">
                          <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">$</span>
                          <input v-model.number="currentItem.price" type="number" min="0" step="0.01" required class="pl-6 w-full rounded-lg border-gray-300 focus:ring-primary-500 focus:border-primary-500">
                        </div>
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">{{ t.quantity }}</label>
                        <input v-model.number="currentItem.quantity" type="number" min="1" required class="w-full rounded-lg border-gray-300 focus:ring-primary-500 focus:border-primary-500 text-center">
                      </div>
                    </div>
  
                    <!-- Options -->
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">{{ t.productOptions }}</label>
                      <div class="flex gap-2 mb-2">
                          <select v-model="newOptionType" class="rounded-lg border-gray-300 text-sm flex-1">
                              <option value="" disabled selected>{{ t.selectOptionType }}</option>
                              <option value="Size">Size</option>
                              <option value="Color">Color</option>
                              <option value="Model">Model</option>
                              <option value="Other">Other</option>
                          </select>
                          <input v-model="newOptionValue" type="text" :placeholder="t.optionValue" class="rounded-lg border-gray-300 text-sm flex-1">
                          <button type="button" @click="addOption" :disabled="!newOptionType || !newOptionValue" class="px-3 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 disabled:opacity-50"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg></button>
                      </div>
                      <div class="space-y-2 mt-2">
                          <div v-for="(val, key) in currentItem.options" :key="key" class="flex justify-between bg-gray-50 p-2 rounded border border-gray-200 text-sm items-center">
                              <span><strong class="text-gray-700">{{ key }}:</strong> {{ val }}</span>
                              <button type="button" @click="removeOption(key)" class="text-red-500 hover:text-red-700 p-1"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                          </div>
                      </div>
                    </div>
  
                    <!-- Image Upload -->
                    <div>
                       <label class="block text-sm font-medium text-gray-700 mb-1">{{ t.productImage }}</label>
                       <input type="file" ref="imageInput" accept="image/*" @change="handleImageSelect" class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer"/>
                       <div v-if="currentItem.imagePreview" class="mt-2 relative w-24">
                          <img :src="currentItem.imagePreview" class="w-24 h-24 object-cover rounded-lg border border-gray-200 shadow-sm">
                          <button type="button" @click="removeImage" class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                       </div>
                    </div>
  
                    <button type="submit" class="w-full py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-all shadow-md">{{ t.saveItem }}</button>
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
  import { ref, computed, watch } from 'vue';
  import { Dialog, DialogPanel, TransitionChild, TransitionRoot } from '@headlessui/vue';
  
  definePageMeta({
    layout: 'shopping',
    middleware: ['auth', 'shopping']
  });
  
  const { $customFetch, $toast } = useNuxtApp();
  const router = useRouter();
  
  const t = {
      createAdminRequest: 'Crear Solicitud (Admin)',
      customer: 'Cliente',
      searchCustomer: 'Buscar cliente por nombre o email...',
      items: 'Artículos',
      estTotal: 'Total Est.',
      addItem: 'Agregar Artículo',
      addAnotherItem: 'Agregar Otro Artículo',
      saveItem: 'Guardar Artículo',
      productUrl: 'URL del Producto',
      productName: 'Nombre del Producto',
      price: 'Precio (USD)',
      quantity: 'Cantidad',
      productOptions: 'Opciones',
      selectOptionType: 'Tipo',
      optionValue: 'Valor',
      productImage: 'Imagen',
      adminNotes: 'Notas de Admin',
      createRequest: 'Crear Solicitud',
      saving: 'Guardando...',
      urlPlaceholder: 'https://...',
      namePlaceholder: 'Nombre del producto...',
      qty: 'Cant',
      change: 'Cambiar',
      successMsg: 'Solicitud creada exitosamente',
      errorMsg: 'Error al crear solicitud',
      editItem: 'Editar Artículo',
      addItemTitle: 'Agregar Artículo',
      howItWorks: 'Modo Manual',
      howItWorksDesc: 'Como administrador, puedes crear solicitudes en nombre de un cliente.',
      pasteLinkHint: 'Ingresa los detalles del producto manualmente.',
      yourList: 'Lista de Artículos',
      imageAttached: 'Imagen adjunta',
      notesPlaceholder: 'Notas internas...',
      status: 'Estado',
  };
  
  // State
  const customerSearch = ref('');
  const customers = ref([]);
  const selectedCustomer = ref(null);
  const showCustomerDropdown = ref(false);
  const searchDebounce = ref(null);
  
  const form = ref({
      items: [],
      status: 'pending_review',
      admin_notes: ''
  });
  
  const loading = ref(false);
  const showModal = ref(false);
  const isEditing = ref(false);
  const editingIndex = ref(-1);
  
  // Item State
  const currentItem = ref({
    product_url: '',
    product_name: '',
    price: null,
    quantity: 1,
    options: {},
    image: null,
    imagePreview: null
  });
  const newOptionType = ref('');
  const newOptionValue = ref('');
  
  // Computed
  const hasItems = computed(() => form.value.items.length > 0);
  const totalItems = computed(() => form.value.items.reduce((sum, i) => sum + i.quantity, 0));
  const estimatedTotal = computed(() => form.value.items.reduce((sum, i) => sum + (i.price * i.quantity), 0).toFixed(2));
  
  // Customer Search
  const searchCustomers = async () => {
      if (searchDebounce.value) clearTimeout(searchDebounce.value);
      if (customerSearch.value.length < 2) {
          customers.value = [];
          return;
      }
  
      searchDebounce.value = setTimeout(async () => {
          try {
              const { data } = await $customFetch('/shopping/customers', {
                  params: { search: customerSearch.value, limit: 5 }
              });
              customers.value = data.data;
              showCustomerDropdown.value = true;
          } catch (e) {
              console.error(e);
          }
      }, 300);
  };
  
  const selectCustomer = (customer) => {
      selectedCustomer.value = customer;
      showCustomerDropdown.value = false;
      customerSearch.value = '';
  };
  
  // Item Logic
  const openAddModal = () => {
      isEditing.value = false;
      currentItem.value = { product_url: '', product_name: '', price: null, quantity: 1, options: {}, image: null, imagePreview: null };
      newOptionType.value = '';
      newOptionValue.value = '';
      showModal.value = true;
  };
  
  const editItem = (index) => {
      isEditing.value = true;
      editingIndex.value = index;
      // Deep copy item, including options
      const item = form.value.items[index];
      currentItem.value = { ...item, options: { ...item.options } };
      
      // Restore image file reference if it exists in memory
      if (form.value.items[index].image) {
          currentItem.value.image = form.value.items[index].image;
          currentItem.value.imagePreview = form.value.items[index].imagePreview;
      }
      
      showModal.value = true;
  };
  
  const closeModal = () => showModal.value = false;
  
  const incrementQty = () => { if (currentItem.value.quantity < 999) currentItem.value.quantity++; };
  const decrementQty = () => { if (currentItem.value.quantity > 1) currentItem.value.quantity--; };
  
  const addOption = () => {
      if (newOptionType.value && newOptionValue.value) {
          currentItem.value.options[newOptionType.value] = newOptionValue.value;
          newOptionType.value = '';
          newOptionValue.value = '';
      }
  };
  const removeOption = (key) => delete currentItem.value.options[key];
  
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
      if (!url.match(/^https?:\/\//i)) return 'https://' + url;
      return url;
  };
  
  const saveItem = () => {
      // Auto-add pending option
      if (newOptionType.value && newOptionValue.value) {
           currentItem.value.options[newOptionType.value] = newOptionValue.value;
           newOptionType.value = '';
           newOptionValue.value = '';
      }
  
      currentItem.value.product_url = fixUrl(currentItem.value.product_url);
      
      // Create deep copy of the item to store
      const newItem = { 
          ...currentItem.value, 
          options: { ...currentItem.value.options },
          // Preserve file references
          image: currentItem.value.image,
          imagePreview: currentItem.value.imagePreview
      };
  
      if (isEditing.value) {
          form.value.items[editingIndex.value] = newItem;
      } else {
          form.value.items.push(newItem);
      }
      closeModal();
  };
  
  const removeItem = (index) => {
      form.value.items.splice(index, 1);
  };
  
  const truncateUrl = (url) => {
    try {
      const { hostname } = new URL(fixUrl(url));
      return hostname.replace('www.', '');
    } catch { return 'Link'; }
  };
  
  const submitRequest = async () => {
      if (!selectedCustomer.value) return;
      
      loading.value = true;
      try {
          const formData = new FormData();
          
          formData.append('user_id', selectedCustomer.value.id);
          formData.append('status', form.value.status);
          formData.append('admin_notes', form.value.admin_notes);
          
          form.value.items.forEach((item, index) => {
              formData.append(`items[${index}][product_name]`, item.product_name);
              formData.append(`items[${index}][product_url]`, item.product_url);
              formData.append(`items[${index}][price]`, item.price);
              formData.append(`items[${index}][quantity]`, item.quantity);
              
              // Serialize Options Correctly
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
  
          await $customFetch('/shopping/purchase-requests', {
              method: 'POST',
              body: formData
          });
          
          $toast.success(t.successMsg);
          router.push('/app/shopping/purchase-requests');
      } catch (e) {
          console.error(e);
          $toast.error(t.errorMsg);
      } finally {
          loading.value = false;
      }
  };
  </script>
  
  <style scoped>
  .list-enter-active, .list-leave-active { transition: all 0.3s ease; }
  .list-enter-from, .list-leave-to { opacity: 0; transform: translateX(-20px); }
  </style>