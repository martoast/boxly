<!-- pages/app/orders/[id]/items.vue -->
<template>
  <section class="min-h-screen bg-gray-50 pb-20">
    <!-- Fixed Header with Progress -->
    <div class="bg-white border-b sticky top-0 z-40 shadow-sm">
      <div class="max-w-3xl mx-auto px-4 py-4">
        <div class="flex items-center gap-3 mb-4">
          <NuxtLink
            :to="'/app/orders/' + order?.id"
            class="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-900"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7 7-7" />
            </svg>
          </NuxtLink>
          <div class="flex-1">
            <h1 class="text-lg sm:text-xl font-bold text-gray-900">
              {{ t.addYourProducts }}
            </h1>
            <p class="text-sm text-gray-500 font-medium">
              {{ t.orderNumber }} <span class="text-gray-900">#{{ order?.tracking_number }}</span>
            </p>
          </div>
          <div v-if="hasItems" class="sm:hidden bg-primary-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-sm">
            {{ totalItemQuantity }}
          </div>
        </div>

        <div class="relative mt-2">
          <div class="bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div :class="[
                'h-full bg-primary-600 rounded-full transition-all duration-500 ease-out',
                !isCollecting ? 'w-full' : hasItems ? 'w-2/3' : 'w-1/3',
              ]"></div>
          </div>
          <div class="flex justify-between mt-2 text-xs font-medium text-gray-400">
            <span class="text-primary-600">{{ t.stepAddress }}</span>
            <span :class="hasItems ? 'text-primary-600' : 'text-primary-600'">{{ t.stepAddItems }}</span>
            <span :class="!isCollecting ? 'text-primary-600' : ''">{{ t.stepComplete }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-3xl mx-auto px-4 py-8">
      <!-- Loading -->
      <div v-if="loading" class="flex justify-center py-12">
        <div class="animate-spin h-8 w-8 border-3 border-primary-600 border-t-transparent rounded-full"></div>
      </div>

      <div v-else-if="order">
        <!-- Desktop Add/Edit Form — only once there's a product to add to (or
             while editing). When empty, the guided "PASO FINAL" hero below is
             the single centerpiece call-to-action. -->
        <div v-if="canEdit && (hasItems || editingItemId)" id="desktop-form" class="hidden sm:block bg-white rounded-2xl ring-1 ring-gray-900/5 shadow-sm p-6 mb-8 transition-all duration-300 ease-out hover:shadow-md">
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl grid place-items-center text-white shadow-sm bg-gradient-to-br from-primary-500 to-indigo-600">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
              </div>
              <div>
                <h2 class="text-lg font-bold text-gray-900">
                  {{ editingItemId ? t.editProduct : (hasItems ? t.addAnotherProduct : t.addProduct) }}
                </h2>
                <p class="text-sm text-gray-500">{{ t.addProductSub }}</p>
              </div>
            </div>
            <button v-if="editingItemId" @click="cancelEdit" class="text-sm text-red-600 hover:text-red-700 font-medium px-3 py-1 hover:bg-red-50 rounded-lg transition-colors">
              {{ t.cancelEdit }}
            </button>
          </div>

          <form @submit.prevent="handleSubmit" class="space-y-6">
            <!-- HERO SECTION -->
            <div class="flex items-start gap-4">
                <div class="flex-1">
                    <label for="product_name_desktop" class="block text-sm font-semibold text-gray-700 mb-1.5">{{ t.productName }} <span class="text-red-500">*</span></label>
                    <input v-model="itemForm.product_name" type="text" id="product_name_desktop" :placeholder="t.productPlaceholder" class="w-full px-4 py-3 border-gray-200 bg-gray-50 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all font-medium text-gray-900 placeholder-gray-400" required />
                </div>
                <div class="w-32 flex-shrink-0">
                    <label class="block text-sm font-semibold text-gray-700 mb-1.5">{{ t.quantity }} <span class="text-red-500">*</span></label>
                    <div class="flex items-center bg-gray-50 rounded-xl border border-gray-200 p-1">
                        <button type="button" @click="decrementQuantity" class="w-8 h-[38px] flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-gray-500 hover:text-primary-600 transition-all"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" /></svg></button>
                        <input v-model.number="itemForm.quantity" type="number" min="1" max="9999" class="w-full bg-transparent border-0 text-center font-bold text-gray-900 focus:ring-0 p-0" />
                        <button type="button" @click="incrementQuantity" class="w-8 h-[38px] flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-gray-500 hover:text-primary-600 transition-all"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg></button>
                    </div>
                </div>
            </div>

            <!-- OPTIONAL TOGGLE -->
            <div>
                <button type="button" @click="showDetails = !showDetails" class="flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors focus:outline-none">
                    <svg :class="{'rotate-180': showDetails}" class="w-4 h-4 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
                    {{ showDetails ? t.hideOptional : t.showOptional }}
                </button>
            </div>

            <!-- OPTIONAL DETAILS -->
            <div v-show="showDetails" class="bg-gray-50/80 rounded-xl p-5 border border-gray-100 space-y-5">
                <div class="grid sm:grid-cols-2 gap-5">
                    <div><label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{{ t.productUrl }}</label><input v-model="itemForm.product_url" type="url" :placeholder="t.productUrlPlaceholder" class="w-full px-3 py-2.5 border-gray-200 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm" /></div>
                    <div><label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{{ t.merchantOrderId }}</label><input v-model="itemForm.merchant_order_id" type="text" :placeholder="t.merchantOrderPlaceholder" class="w-full px-3 py-2.5 border-gray-200 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm" /></div>
                </div>
                <div class="grid sm:grid-cols-3 gap-5">
                    <div><label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{{ t.trackingNumber }}</label><input v-model="itemForm.tracking_number" type="text" :placeholder="t.trackingPlaceholder" class="w-full px-3 py-2.5 border-gray-200 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm" /></div>
                    <div><label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{{ t.declaredValue }}</label><div class="relative"><span class="absolute left-3 top-2.5 text-gray-400">$</span><input v-model="itemForm.declared_value" type="text" inputmode="decimal" class="w-full pl-7 px-3 py-2.5 border-gray-200 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm" /></div></div>
                    <div><label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{{ t.estimatedDeliveryDate }}</label><input v-model="itemForm.estimated_delivery_date" type="date" :min="todayDate" class="w-full px-3 py-2.5 border-gray-200 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm" /></div>
                </div>

                <!-- Product Image (Desktop) -->
                <div>
                    <!-- Image -->
                    <div>
                        <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{{ t.productImage }}</label>
                        <input ref="productImageInputDesktop" type="file" accept=".jpg,.jpeg,.png,.webp" @change="handleProductImageSelect" class="hidden" />
                        <div v-if="selectedProductImage" class="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between">
                            <span class="text-xs text-green-700 font-medium truncate pr-2">{{ selectedProductImage.name }}</span>
                            <button type="button" @click="removeProductImage" class="text-green-600 hover:text-green-800"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                        </div>
                        <div v-else-if="existingFiles.image.url && !markedForDeletion.image" class="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between group">
                            <div class="flex items-center gap-3 overflow-hidden">
                                <img :src="existingFiles.image.url" class="w-8 h-8 rounded object-cover border border-gray-100 flex-shrink-0" />
                                <a :href="existingFiles.image.url" target="_blank" class="text-xs font-medium text-blue-600 hover:underline truncate">{{ existingFiles.image.name }}</a>
                            </div>
                            <div class="flex items-center gap-1">
                                <button type="button" @click="productImageInputDesktop?.click()" class="p-1.5 text-gray-400 hover:text-primary-600 rounded hover:bg-gray-100" title="Replace"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg></button>
                                <button type="button" @click="markedForDeletion.image = true" class="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50" title="Delete"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                            </div>
                        </div>
                        <div v-else @click="productImageInputDesktop?.click()" class="bg-white border border-dashed border-gray-300 rounded-lg p-3 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-all"><span class="text-xs text-gray-500">{{ t.clickToUploadImage }}</span></div>
                    </div>
                </div>
            </div>

            <button
              type="submit"
              :disabled="submitting || !itemForm.product_name.trim()"
              :class="[
                'w-full py-3.5 rounded-xl font-bold text-lg transition-all duration-200 active:scale-[0.99] flex items-center justify-center gap-2',
                (submitting || !itemForm.product_name.trim())
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-900 text-white hover:bg-black shadow-lg shadow-gray-900/10 hover:-translate-y-0.5'
              ]"
            >
              <svg v-if="!submitting" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" /></svg>
              <svg v-else class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              {{ submitting ? t.processing : (editingItemId ? t.updateProductButton : t.addProductButton) }}
            </button>
          </form>
        </div>

        <!-- Products List -->
        <div v-if="hasItems" class="space-y-4">
          <div class="flex items-end justify-between border-b border-gray-100 pb-2">
            <h3 class="text-lg font-bold text-gray-900">{{ t.yourProducts }}</h3>
            <span class="text-sm font-medium text-gray-500">{{ totalItemQuantity }} {{ totalItemQuantity === 1 ? t.product : t.products }}</span>
          </div>

          <TransitionGroup name="list" tag="div" class="space-y-3">
            <div v-for="(item, index) in order.items" :key="item.id" class="group bg-white rounded-xl border border-gray-200 p-4 hover:border-primary-300 hover:shadow-md transition-all duration-200">
              <div class="flex items-start gap-4">
                
                <!-- Product Image / Thumbnail -->
                <a v-if="item.product_image_url" :href="item.product_image_url" target="_blank" class="w-14 h-14 flex-shrink-0 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden relative group/img cursor-zoom-in">
                    <img :src="item.product_image_url" class="w-full h-full object-cover" alt="Product">
                    <div class="absolute inset-0 bg-black/5 group-hover/img:bg-black/0 transition-colors"></div>
                </a>
                <div v-else class="w-14 h-14 flex-shrink-0 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center">
                  <span class="text-gray-400 font-bold text-lg">{{ index + 1 }}</span>
                </div>

                <!-- Product Details -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between">
                    <h4 class="font-bold text-gray-900 truncate text-base">{{ item.product_name }}</h4>
                    <a v-if="item.product_url" :href="item.product_url" target="_blank" class="ml-2 text-gray-400 hover:text-primary-600 flex-shrink-0" title="Open Product Link"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg></a>
                  </div>
                  
                  <!-- Meta Badges -->
                  <div class="flex flex-wrap items-center gap-2 mt-2">
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">{{ t.qty }}: {{ item.quantity }}</span>
                    <a v-if="item.proof_of_purchase_url" :href="item.proof_of_purchase_url" target="_blank" class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-100 hover:bg-green-100 transition-colors cursor-pointer" title="View Receipt"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{{ t.receiptAttached }}</a>
                    <span v-if="item.declared_value" class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{{ formatCurrency(item.declared_value) }}</span>
                    <span v-if="item.tracking_number" class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" /></svg>{{ item.tracking_number }}</span>
                    <span v-if="item.estimated_delivery_date" class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-orange-50 text-orange-700 border border-orange-100"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>{{ formatDate(item.estimated_delivery_date) }}</span>
                    <span v-if="item.merchant_order_id" class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200"><span class="text-[10px] font-bold uppercase tracking-wider text-gray-400">Ref</span> {{ item.merchant_order_id }}</span>
                  </div>
                </div>

                <div v-if="canEdit" class="flex items-center">
                    <button @click="editItem(item)" class="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                    <button @click="removeItem(item.id)" class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                </div>
              </div>
            </div>
          </TransitionGroup>

          <!-- Add another (mobile) -->
          <button v-if="canEdit" @click="openAddModal" class="sm:hidden w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-dashed border-gray-300 text-primary-600 font-semibold hover:border-primary-400 hover:bg-primary-50/40 transition-all active:scale-[0.99]">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" /></svg>
            {{ t.addAnother }}
          </button>

          <!-- ORDER PROOF OF PURCHASE — required before confirming. One array
               of files for the whole order so the customer can upload a
               receipt per store in this final step. -->
          <div v-if="canEdit" class="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6">
            <!-- Header with icon -->
            <div class="flex items-start gap-3">
              <div class="hidden sm:flex w-10 h-10 rounded-xl bg-primary-50 text-primary-600 items-center justify-center flex-shrink-0">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <div class="min-w-0">
                <h3 class="text-base font-bold text-gray-900">{{ t.proofTitle }} <span class="text-red-500">*</span></h3>
                <p class="text-sm text-gray-500 mt-1 leading-relaxed">{{ t.proofHelp }}</p>
              </div>
            </div>

            <!-- Help link: opens a small modal explaining how to save the
                 order-confirmation email as a PDF. -->
            <button
              type="button"
              @click="showPdfHelp = true"
              class="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {{ t.proofGuide }}
            </button>

            <input ref="proofInput" type="file" multiple accept="application/pdf,.pdf" @change="handleProofSelect" class="hidden" />

            <!-- Uploaded PDFs -->
            <div v-if="orderProofs.length" class="mt-5 space-y-2">
              <div v-for="(f, i) in orderProofs" :key="i" class="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl p-2.5 pr-3">
                <span class="flex items-center justify-center w-9 h-9 rounded-lg bg-red-50 text-red-600 text-[10px] font-extrabold tracking-wide flex-shrink-0">PDF</span>
                <a :href="f.url" target="_blank" class="flex-1 min-w-0">
                  <span class="block text-sm font-medium text-gray-800 truncate group-hover:underline">{{ f.filename || `${t.receipt} ${i + 1}` }}</span>
                  <span class="block text-xs text-primary-600">{{ t.viewFile }}</span>
                </a>
                <button type="button" @click="deleteOrderProof(i)" class="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0" :title="t.remove"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
              </div>
            </div>

            <!-- Upload dropzone -->
            <button type="button" @click="proofInput?.click()" :disabled="proofUploading" class="mt-4 w-full px-4 py-5 border-2 border-dashed border-gray-200 rounded-xl text-center hover:border-primary-400 hover:bg-primary-50/30 transition-all disabled:opacity-60 flex flex-col items-center justify-center gap-1.5">
              <svg v-if="!proofUploading" class="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
              <svg v-else class="w-6 h-6 text-primary-500 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              <span class="text-sm font-semibold text-primary-600">{{ proofUploading ? t.uploading : (orderProofs.length ? t.addMoreProof : t.uploadProof) }}</span>
              <span class="text-xs text-gray-400">{{ t.proofUploadHint }}</span>
            </button>
          </div>

          <!-- Footer Action -->
          <div v-if="canEdit" class="hidden sm:block mt-8">
            <div class="bg-gradient-to-r from-primary-50 to-white rounded-xl p-6 border border-primary-100 flex items-center justify-between shadow-sm">
                <div>
                    <h3 class="font-bold text-gray-900 text-lg mb-1">{{ isCollecting ? t.reviewAndConfirm : t.finishedEditing }}</h3>
                    <p v-if="isCollecting && !canContinue" class="text-sm text-amber-700 font-medium flex items-center gap-1.5">
                      <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M5.07 19h13.86a2 2 0 001.74-3L13.74 4a2 2 0 00-3.48 0L3.33 16a2 2 0 001.74 3z" /></svg>
                      {{ !hasItems ? t.needProductHint : t.needPdfHint }}
                    </p>
                    <p v-else class="text-sm text-gray-600">{{ isCollecting ? t.confirmExplanation : t.returnToOrder }}</p>
                </div>
                <button
                  @click="handleFooterAction"
                  :disabled="isCollecting && !canContinue"
                  :class="[
                    'px-8 py-3 font-bold rounded-xl transition-all shadow-md',
                    (isCollecting && !canContinue)
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                      : 'bg-green-600 text-white hover:bg-green-700 hover:shadow-lg active:scale-95'
                  ]"
                >
                    {{ isCollecting ? t.continueReview : t.saveAndReturn }}
                </button>
            </div>
          </div>
        </div>

        <!-- Guided final step — the single, dominant centerpiece when the
             order has no products yet. -->
        <div v-else class="relative overflow-hidden text-center py-14 sm:py-20 px-6 bg-white rounded-2xl ring-1 ring-gray-900/5 mt-2">
          <div class="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-primary-400/10 blur-3xl"></div>
          <div class="relative max-w-md mx-auto">
            <span class="inline-block text-[11px] font-extrabold tracking-[0.18em] text-primary-700 bg-primary-50 border border-primary-100 rounded-full px-3 py-1 mb-6">{{ t.finalStep }}</span>
            <div class="w-20 h-20 rounded-2xl grid place-items-center mx-auto mb-6 text-white shadow-lg shadow-primary-500/20 bg-gradient-to-br from-primary-500 to-indigo-600 empty-float">
              <svg class="w-10 h-10" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
            </div>
            <h2 class="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">{{ t.emptyTitle }}</h2>
            <p class="text-[15px] sm:text-base text-gray-500 mt-3 leading-relaxed">{{ t.emptyCopy }}</p>
            <button
              @click="openAddModal"
              class="mt-7 w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-base shadow-lg shadow-primary-600/25 active:scale-[0.98] transition-all"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" /></svg>
              {{ t.addFirstProduct }}
            </button>
            <p class="text-xs text-gray-400 mt-4">{{ t.emptyHelper }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile Sticky Footer — appears once at least one product exists; the
         "Continue to review" button stays disabled until the PDF is uploaded. -->
    <div v-if="hasItems && order && canEdit" class="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-30 pb-safe">
      <div class="px-4 py-3">
        <p v-if="isCollecting && !canContinue" class="text-xs text-amber-700 font-medium flex items-center gap-1.5 mb-2">
          <svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M5.07 19h13.86a2 2 0 001.74-3L13.74 4a2 2 0 00-3.48 0L3.33 16a2 2 0 001.74 3z" /></svg>
          {{ t.needPdfHint }}
        </p>
        <button
          @click="handleFooterAction"
          :disabled="isCollecting && !canContinue"
          :class="[
            'w-full py-3.5 font-bold rounded-xl transition-colors shadow-lg relative flex items-center justify-center gap-2',
            (isCollecting && !canContinue)
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
              : 'bg-gray-900 text-white hover:bg-black'
          ]"
        >
            <span>{{ isCollecting ? t.continueReview : t.saveAndReturn }}</span>
            <span v-if="isCollecting && canContinue" class="flex h-3 w-3 relative"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span></span>
        </button>
      </div>
    </div>

    <!-- Mobile Modal -->
    <TransitionRoot as="template" :show="showAddProductModal">
      <Dialog class="relative z-50" @close="closeModal">
        <TransitionChild as="template" enter="ease-out duration-300" enter-from="opacity-0" enter-to="opacity-100" leave="ease-in duration-200" leave-from="opacity-100" leave-to="opacity-0"><div class="fixed inset-0 bg-gray-900/40 backdrop-blur-sm" /></TransitionChild>
        <div class="fixed inset-0 z-10 overflow-y-auto">
          <div class="flex min-h-full items-end justify-center">
            <TransitionChild as="template" enter="ease-out duration-300" enter-from="opacity-0 translate-y-full" enter-to="opacity-100 translate-y-0" leave="ease-in duration-200" leave-from="opacity-100 translate-y-0" leave-to="opacity-0 translate-y-full">
              <DialogPanel class="w-full bg-white rounded-t-3xl shadow-2xl">
                <div class="px-6 pb-6 pt-6">
                  <div class="flex items-center justify-between mb-6">
                    <DialogTitle class="text-xl font-bold text-gray-900">{{ editingItemId ? t.editProduct : t.addProduct }}</DialogTitle>
                    <button @click="closeModal" class="p-2 -mr-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-full transition-colors"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                  </div>
                  <form @submit.prevent="handleSubmitMobile" class="space-y-6">
                    <div class="space-y-4">
                        <div><label class="block text-sm font-bold text-gray-900 mb-2">{{ t.productName }} <span class="text-red-500">*</span></label><input v-model="itemForm.product_name" type="text" :placeholder="t.productPlaceholder" class="w-full px-4 py-3.5 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all font-medium text-lg" required /></div>
                        <div>
                          <label class="block text-sm font-bold text-gray-900 mb-2">{{ t.quantity }} <span class="text-red-500">*</span></label>
                          <div class="flex items-center gap-4">
                            <button type="button" @click="decrementQuantity" class="w-14 h-14 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors flex items-center justify-center"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" /></svg></button>
                            <div class="flex-1 bg-gray-50 rounded-xl border border-transparent h-14 flex items-center justify-center"><span class="text-2xl font-bold text-gray-900">{{ itemForm.quantity }}</span></div>
                            <button type="button" @click="incrementQuantity" class="w-14 h-14 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors flex items-center justify-center"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg></button>
                          </div>
                        </div>
                    </div>

                    <button type="button" @click="showDetails = !showDetails" class="w-full py-3 flex items-center justify-center gap-2 text-primary-600 font-semibold bg-primary-50/50 rounded-xl hover:bg-primary-50 transition-colors">{{ showDetails ? t.hideOptional : t.showOptional }}<svg :class="{'rotate-180': showDetails}" class="w-5 h-5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg></button>
                    <div v-show="showDetails" class="space-y-4 pt-2">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">{{ t.productUrl }}</label>
                            <input v-model="itemForm.product_url" type="url" :placeholder="t.productUrlPlaceholder" class="w-full px-4 py-3 bg-gray-50 border-gray-100 rounded-xl text-sm" />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">{{ t.merchantOrderId }}</label>
                            <input v-model="itemForm.merchant_order_id" type="text" :placeholder="t.merchantOrderPlaceholder" class="w-full px-4 py-3 bg-gray-50 border-gray-100 rounded-xl text-sm" />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">{{ t.trackingNumber }}</label>
                            <input v-model="itemForm.tracking_number" type="text" :placeholder="t.trackingPlaceholder" class="w-full px-4 py-3 bg-gray-50 border-gray-100 rounded-xl text-sm" />
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">{{ t.declaredValue }}</label>
                                <input v-model="itemForm.declared_value" type="number" :placeholder="t.declaredValue" class="w-full px-4 py-3 bg-gray-50 border-gray-100 rounded-xl text-sm" />
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">{{ t.estimatedDeliveryDate }}</label>
                                <input v-model="itemForm.estimated_delivery_date" type="date" :min="todayDate" class="w-full px-4 py-3 bg-gray-50 border-gray-100 rounded-xl text-sm" />
                            </div>
                        </div>
                        
                        <!-- Mobile Product Image -->
                        <div>
                            <!-- Mobile Image -->
                            <div @click="productImageInputMobile?.click()" class="border border-dashed rounded-xl p-3 text-center h-24 flex flex-col items-center justify-center relative overflow-hidden cursor-pointer" :class="selectedProductImage ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-300 hover:bg-gray-100'">
                                <input ref="productImageInputMobile" type="file" accept=".jpg,.jpeg,.png,.webp" @change="handleProductImageSelect" class="hidden" />
                                <div v-if="selectedProductImage" class="w-full text-center"><span class="text-xs text-green-700 font-bold block mb-1">New Selected</span><span class="text-[10px] text-green-600 truncate block px-2">{{ selectedProductImage.name }}</span></div>
                                <div v-else-if="existingFiles.image.url && !markedForDeletion.image" class="w-full h-full absolute inset-0">
                                    <img :src="existingFiles.image.url" class="w-full h-full object-cover opacity-50" />
                                    <div class="absolute inset-0 flex flex-col items-center justify-center bg-white/60">
                                        <a :href="existingFiles.image.url" target="_blank" @click.stop class="text-xs font-bold text-blue-800 underline mb-1">View Image</a>
                                        <div class="flex gap-2">
                                            <button type="button" @click.stop="productImageInputMobile?.click()" class="text-[10px] font-bold text-gray-600 bg-white/90 px-2 py-1 rounded shadow-sm">Replace</button>
                                            <button type="button" @click.stop="markedForDeletion.image = true" class="text-[10px] font-bold text-red-600 bg-white/90 px-2 py-1 rounded shadow-sm">Del</button>
                                        </div>
                                    </div>
                                </div>
                                <div v-else><span class="text-xs font-semibold text-gray-500 block mb-1">{{ t.productImage }}</span><span class="text-[10px] text-primary-600 font-bold truncate max-w-full px-1">{{ editingItemId ? t.tapToReplace : t.tapToUpload }}</span></div>
                            </div>
                        </div>
                    </div>
                    <button type="submit" :disabled="submitting || !itemForm.product_name.trim()" class="w-full py-4 bg-gray-900 text-white font-bold text-lg rounded-xl hover:bg-black disabled:opacity-50 transition-all shadow-xl shadow-gray-200">{{ submitting ? t.processing : (editingItemId ? t.updateProductButton : t.addProductButton) }}</button>
                    <div class="h-6"></div>
                  </form>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>

    <!-- Confirmation Modal -->
    <TransitionRoot as="template" :show="showCompleteModal">
      <Dialog class="relative z-50" @close="showCompleteModal = false">
        <TransitionChild as="template" enter="ease-out duration-300" enter-from="opacity-0" enter-to="opacity-100" leave="ease-in duration-200" leave-from="opacity-100" leave-to="opacity-0"><div class="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" /></TransitionChild>
        <div class="fixed inset-0 z-10 overflow-y-auto">
          <div class="flex min-h-full items-center justify-center p-4">
            <TransitionChild as="template" enter="ease-out duration-300" enter-from="opacity-0 scale-95" enter-to="opacity-100 scale-100" leave="ease-in duration-200" leave-from="opacity-100 scale-100" leave-to="opacity-0 scale-95">
              <DialogPanel class="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6">
                <div class="text-center mb-6"><div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg></div><DialogTitle class="text-xl font-bold text-gray-900 mb-2">{{ t.confirmOrder }}</DialogTitle><p class="text-sm text-gray-500">{{ t.confirmMessage }}</p></div>
                <div class="flex gap-3"><button @click="showCompleteModal = false" class="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-bold transition-colors">{{ t.cancel }}</button><button @click="confirmOrderAction" :disabled="completingOrder" class="flex-1 py-3 bg-gray-900 text-white rounded-xl hover:bg-black disabled:opacity-50 font-bold transition-colors shadow-lg">{{ completingOrder ? t.confirming : t.confirm }}</button></div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>

    <!-- PDF help modal — how to save the confirmation email as a PDF -->
    <TransitionRoot as="template" :show="showPdfHelp">
      <Dialog class="relative z-50" @close="showPdfHelp = false">
        <TransitionChild as="template" enter="ease-out duration-300" enter-from="opacity-0" enter-to="opacity-100" leave="ease-in duration-200" leave-from="opacity-100" leave-to="opacity-0"><div class="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" /></TransitionChild>
        <div class="fixed inset-0 z-10 overflow-y-auto">
          <div class="flex min-h-full items-center justify-center p-4">
            <TransitionChild as="template" enter="ease-out duration-300" enter-from="opacity-0 scale-95" enter-to="opacity-100 scale-100" leave="ease-in duration-200" leave-from="opacity-100 scale-100" leave-to="opacity-0 scale-95">
              <DialogPanel class="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6">
                <div class="flex items-start justify-between mb-5">
                  <DialogTitle class="text-lg font-bold text-gray-900 pr-4">{{ t.pdfHelpTitle }}</DialogTitle>
                  <button @click="showPdfHelp = false" class="p-1.5 -mr-1.5 -mt-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-full transition-colors flex-shrink-0"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
                <ol class="space-y-4">
                  <li v-for="(step, i) in pdfSteps" :key="i" class="flex items-start gap-3">
                    <span class="flex-shrink-0 w-7 h-7 rounded-full bg-primary-600 text-white text-sm font-bold grid place-items-center">{{ i + 1 }}</span>
                    <span class="text-sm text-gray-700 leading-relaxed pt-0.5">{{ step }}</span>
                  </li>
                </ol>
                <a
                  v-if="proofGuideUrl"
                  :href="proofGuideUrl"
                  target="_blank"
                  rel="noopener"
                  class="mt-5 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-primary-200 text-primary-700 font-semibold text-sm hover:bg-primary-50 transition-colors"
                >
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                  {{ t.pdfHelpVideo }}
                </a>
                <button @click="showPdfHelp = false" class="mt-3 w-full py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-colors">{{ t.gotIt }}</button>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>
  </section>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from "@headlessui/vue";

definePageMeta({ layout: "app", middleware: ["auth", "customer", "complete-profile"] });

const { $customFetch, $toast } = useNuxtApp();
const route = useRoute();
const router = useRouter();
const { t: createTranslations } = useLanguage();

// State
const order = ref(null);
const loading = ref(true);
const submitting = ref(false); 
const completingOrder = ref(false);
const showCompleteModal = ref(false);
const showAddProductModal = ref(false);
const showPdfHelp = ref(false);
const selectedProductImage = ref(null);
const editingItemId = ref(null);
const showDetails = ref(false);

// Per-item product image state (proof of purchase is per-order, below)
const existingFiles = ref({ image: { url: null, name: null } });
const markedForDeletion = ref({ image: false });
const productImageInputDesktop = ref(null);
const productImageInputMobile = ref(null);

// Order-level proof of purchase — an array of PDF files for the whole order.
const proofInput = ref(null);
const proofUploading = ref(false);
const orderProofs = computed(() => order.value?.proof_of_purchase_files ?? []);

// Loom walkthrough showing how to save the order-confirmation email as a PDF.
// Leave empty to hide the button until the video URL is ready.
const proofGuideUrl = 'https://www.loom.com/share/664bd2439c57458bb8f4474bb818d93b';

const itemForm = ref({ product_name: "", product_url: "", merchant_order_id: "", quantity: 1, declared_value: "", tracking_number: "", estimated_delivery_date: "" });

// Computed
const todayDate = computed(() => { const today = new Date(); return today.toISOString().split('T')[0]; });
const hasItems = computed(() => order.value?.items && order.value.items.length > 0);
const totalItemQuantity = computed(() => order.value?.items ? order.value.items.reduce((total, item) => total + item.quantity, 0) : 0);
const isCollecting = computed(() => order.value?.status === 'collecting');
const canEdit = computed(() => order.value?.can_add_items ?? false);
// Ready to continue to review: at least one product AND the confirmation PDF.
const canContinue = computed(() => hasItems.value && orderProofs.value.length > 0);

const translations = {
  addYourProducts: { es: "Agrega tus productos", en: "Add your products" },
  orderNumber: { es: "Orden", en: "Order" },
  stepAddress: { es: "Dirección", en: "Address" },
  stepAddItems: { es: "Productos", en: "Products" },
  stepComplete: { es: "Confirmar", en: "Confirm" },
  reviewAndConfirm: { es: "Revisa y confirma tus productos", en: "Review & Confirm" },
  confirmExplanation: { es: "Confirma que estos son los productos que vas a enviar.", en: "Confirm these are the items you are shipping." },
  confirmProducts: { es: "Confirmar todo", en: "Confirm All" },
  confirmAndContinue: { es: "Continuar", en: "Continue" },
  saveAndReturn: { es: "Guardar y Volver", en: "Save & Return" },
  finishedEditing: { es: "¿Terminaste de editar?", en: "Finished editing?" },
  returnToOrder: { es: "Vuelve al detalle de la orden.", en: "Return to order details." },
  orderConfirmed: { es: "Orden confirmada", en: "Order confirmed" },
  confirmOrder: { es: "¿Confirmar orden?", en: "Confirm Order?" },
  confirmMessage: { es: "¿Has agregado todos los productos?", en: "Have you added all your products?" },
  confirming: { es: "Confirmando...", en: "Confirming..." },
  addProduct: { es: "Agregar producto", en: "Add product" },
  addProductSub: { es: "Dinos qué compraste. Toma segundos.", en: "Tell us what you bought. Takes seconds." },
  emptyHint: { es: "Agrega tu primer producto arriba", en: "Add your first product above" },
  editProduct: { es: "Editar producto", en: "Edit product" },
  addAnotherProduct: { es: "Agregar otro producto", en: "Add another product" },
  tapToStart: { es: "Toca para comenzar", en: "Tap to add item" },
  productName: { es: "Nombre del producto", en: "Product Name" },
  productPlaceholder: { es: "ej: iPhone 15 Pro", en: "e.g. iPhone 15 Pro" },
  productUrl: { es: "Link (URL)", en: "Product Link" },
  productUrlPlaceholder: { es: "https://...", en: "https://..." },
  merchantOrderId: { es: "No. Orden Tienda", en: "Store Order No." },
  merchantOrderPlaceholder: { es: "ej: #114-1234...", en: "e.g. #114-1234..." },
  quantity: { es: "Cant.", en: "Qty" },
  qty: { es: "Cant", en: "Qty" },
  receipt: { es: "Recibo", en: "Receipt" },
  receiptAttached: { es: "Recibo", en: "Receipt" },
  proofTitle: { es: "PDF de confirmación de compra", en: "Purchase confirmation PDF" },
  proofHelp: { es: "Sube el correo de confirmación de tu compra en PDF. Nos sirve para identificar tu orden y ayudarte con productos faltantes, aclaraciones o problemas con la tienda. Si compraste en varias tiendas, sube un PDF por tienda.", en: "Upload the order confirmation email as a PDF. We use it to identify your order and help with missing items, disputes, or store issues. If you bought from several stores, upload one PDF per store." },
  proofGuide: { es: "¿Cómo guardo mi correo como PDF?", en: "How do I save my email as a PDF?" },
  proofPdfOnly: { es: "Solo se aceptan archivos PDF.", en: "Only PDF files are accepted." },
  proofUploadHint: { es: "Solo PDF · máx 10 MB", en: "PDF only · max 10 MB" },
  viewFile: { es: "Ver archivo", en: "View file" },
  uploadProof: { es: "Subir comprobantes", en: "Upload receipts" },
  addMoreProof: { es: "Subir más comprobantes", en: "Upload more receipts" },
  uploading: { es: "Subiendo...", en: "Uploading..." },
  proofUploaded: { es: "Comprobantes subidos", en: "Receipts uploaded" },
  proofRequired: { es: "Sube al menos un comprobante de compra para confirmar tu orden.", en: "Upload at least one proof of purchase to confirm your order." },
  productImage: { es: "Imagen", en: "Image" },
  showOptional: { es: "Agregar detalles (opcional)", en: "Add more details (optional)" },
  hideOptional: { es: "Ocultar detalles", en: "Hide details" },
  clickToUpload: { es: "Subir archivo", en: "Upload file" },
  clickToReplace: { es: "Reemplazar", en: "Replace" },
  tapToUpload: { es: "Subir", en: "Upload" },
  tapToReplace: { es: "Reemplazar", en: "Replace" },
  clickToUploadImage: { es: "Subir imagen", en: "Upload img" },
  clickToReplaceImage: { es: "Reemplazar", en: "Replace" },
  tapToUploadImage: { es: "Subir", en: "Upload" },
  tapToReplaceImage: { es: "Reemplazar", en: "Replace" },
  remove: { es: "Quitar", en: "Remove" },
  processing: { es: "Guardando...", en: "Saving..." },
  addProductButton: { es: "Agregar producto", en: "Add Product" },
  updateProductButton: { es: "Actualizar producto", en: "Update Product" },
  cancelEdit: { es: "Cancelar", en: "Cancel" },
  yourProducts: { es: "Tus productos", en: "Your Products" },
  noProducts: { es: "Tu lista está vacía", en: "Your list is empty" },
  startByAdding: { es: "Agrega los productos que compraste", en: "Add the items you purchased" },
  finalStep: { es: "PASO FINAL", en: "FINAL STEP" },
  emptyTitle: { es: "Agrega los productos de tu orden", en: "Add the products in your order" },
  emptyCopy: { es: "Registra lo que ya compraste o vas a enviar a nuestra dirección en San Diego.", en: "Register anything you already purchased or will ship to our San Diego address." },
  addFirstProduct: { es: "Agregar mi primer producto", en: "Add my first product" },
  emptyHelper: { es: "Puedes registrar productos antes de que lleguen.", en: "You can register products before they arrive." },
  addAnother: { es: "Agregar otro producto", en: "Add another product" },
  continueReview: { es: "Continuar a revisar", en: "Continue to review" },
  needPdfHint: { es: "Sube el PDF de confirmación para continuar.", en: "Upload the confirmation PDF to continue." },
  needProductHint: { es: "Agrega al menos un producto para continuar.", en: "Add at least one product to continue." },
  pdfHelpTitle: { es: "¿Cómo guardo mi correo como PDF?", en: "How to save your email as a PDF" },
  pdfStep1: { es: "Abre el correo de confirmación que te mandó la tienda.", en: "Open the confirmation email the store sent you." },
  pdfStep2: { es: "Toca Imprimir (en el menú del correo o del navegador).", en: "Tap Print (in the email or browser menu)." },
  pdfStep3: { es: "En destino elige \"Guardar como PDF\".", en: "Under destination choose \"Save as PDF\"." },
  pdfStep4: { es: "Sube el PDF aquí en Boxly.", en: "Upload the PDF here on Boxly." },
  pdfHelpVideo: { es: "Ver video", en: "Watch video" },
  gotIt: { es: "Entendido", en: "Got it" },
  product: { es: "item", en: "item" },
  products: { es: "items", en: "items" },
  cancel: { es: "Volver", en: "Back" },
  confirm: { es: "Sí, confirmar", en: "Yes, Confirm" },
  declaredValue: { es: "Valor", en: "Value" },
  totalProducts: { es: "Total productos", en: "Total items" },
  estimatedDeliveryDate: { es: "Entrega estimada", en: "Est. Delivery" },
  trackingNumber: { es: "Rastreo (Tracking)", en: "Tracking No." },
  trackingPlaceholder: { es: "ej: 1Z999...", en: "e.g. 1Z999..." },
};
const t = createTranslations(translations);

// Steps shown in the "how to save as PDF" help modal.
const pdfSteps = computed(() => [t.value.pdfStep1, t.value.pdfStep2, t.value.pdfStep3, t.value.pdfStep4]);

const incrementQuantity = () => { if (itemForm.value.quantity < 999) itemForm.value.quantity++; };
const decrementQuantity = () => { if (itemForm.value.quantity > 1) itemForm.value.quantity--; };
const formatCurrency = (value) => value ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value) : '';
const formatDate = (date) => date ? `${date.split('T')[0].split('-')[1]}/${date.split('T')[0].split('-')[2]}/${date.split('T')[0].split('-')[0]}` : '';

const handleProductImageSelect = (event) => {
  const file = event.target.files[0];
  if (file) {
    if (file.size > 5 * 1024 * 1024) { $toast.error("Image too large"); return; }
    selectedProductImage.value = file;
    markedForDeletion.value.image = false; 
  }
};

const removeProductImage = () => { selectedProductImage.value = null; if (productImageInputMobile.value) productImageInputMobile.value.value = ""; if (productImageInputDesktop.value) productImageInputDesktop.value.value = ""; };

// Order-level proof handlers — upload multiple files at once, append to order.
const handleProofSelect = async (event) => {
  const files = Array.from(event.target.files || []);
  if (!files.length) return;

  // PDF only — law enforcement/legal need the order-confirmation PDF, not images.
  const isPdf = (f) => f.type === 'application/pdf' || /\.pdf$/i.test(f.name);
  if (!files.every(isPdf)) { $toast.error(t.value.proofPdfOnly); event.target.value = ""; return; }

  const tooBig = files.find(f => f.size > 10 * 1024 * 1024);
  if (tooBig) { $toast.error("File too large (max 10MB)"); event.target.value = ""; return; }

  proofUploading.value = true;
  try {
    const formData = new FormData();
    files.forEach(f => formData.append("files[]", f));
    await $customFetch(`/orders/${order.value.id}/proofs`, { method: "POST", body: formData });
    // Re-fetch the full order — the upload response omits the items relation.
    await fetchOrder(true);
    $toast.success(t.value.proofUploaded);
  } catch (error) {
    console.error('Error uploading proof:', error);
    $toast.error(error?.data?.message ?? "Error uploading file");
  } finally {
    proofUploading.value = false;
    if (proofInput.value) proofInput.value.value = "";
  }
};

const deleteOrderProof = async (index) => {
  try {
    await $customFetch(`/orders/${order.value.id}/proofs/${index}`, { method: "DELETE" });
    // Re-fetch the full order — the delete response omits the items relation.
    await fetchOrder(true);
  } catch (error) {
    $toast.error("Error removing file");
  }
};

const fetchOrder = async (background = false) => {
  if (!background) loading.value = true;
  try {
    const response = await $customFetch(`/orders/${route.params.id}`);
    order.value = response.data;
  } catch (error) { $toast.error("Error loading order"); navigateTo("/app/orders"); } 
  finally { if (!background) loading.value = false; }
};

const editItem = (item) => {
    editingItemId.value = item.id;
    itemForm.value = { product_name: item.product_name, product_url: item.product_url || '', merchant_order_id: item.merchant_order_id || '', quantity: item.quantity, declared_value: item.declared_value || '', tracking_number: item.tracking_number || item.tracking_url || '', estimated_delivery_date: item.estimated_delivery_date ? item.estimated_delivery_date.split('T')[0] : '' };
    existingFiles.value = { image: { url: item.product_image_url, name: item.product_image_filename || 'Product Image' } };
    markedForDeletion.value = { image: false };
    selectedProductImage.value = null; showDetails.value = true;
    if (window.innerWidth < 640) { showAddProductModal.value = true; } else { document.getElementById('desktop-form')?.scrollIntoView({ behavior: 'smooth' }); }
};

const cancelEdit = () => { editingItemId.value = null; resetForm(); };
const resetForm = () => { itemForm.value = { product_name: "", product_url: "", merchant_order_id: "", quantity: 1, declared_value: "", tracking_number: "", estimated_delivery_date: "" }; existingFiles.value = { image: { url: null, name: null } }; markedForDeletion.value = { image: false }; removeProductImage(); showDetails.value = false; };
const openAddModal = () => { if (editingItemId.value) cancelEdit(); showAddProductModal.value = true; };
const closeModal = () => { showAddProductModal.value = false; cancelEdit(); };

const handleSubmit = async () => {
  if (!itemForm.value.product_name.trim()) return;

  submitting.value = true;
  
  try {
    const formData = new FormData();
    
    // Required fields
    formData.append("product_name", itemForm.value.product_name.trim());
    formData.append("quantity", itemForm.value.quantity);
    
    // Optional fields - ALWAYS send them so empty values can clear the field
    formData.append("product_url", itemForm.value.product_url || '');
    formData.append("merchant_order_id", itemForm.value.merchant_order_id || '');
    formData.append("declared_value", itemForm.value.declared_value || '');
    // A pasted tracking LINK belongs in tracking_url (max 1000), not
    // tracking_number (max 100) — otherwise a long URL fails validation.
    const trackingValue = (itemForm.value.tracking_number || '').trim();
    const trackingIsUrl = /^https?:\/\//i.test(trackingValue);
    formData.append("tracking_number", trackingIsUrl ? '' : trackingValue);
    formData.append("tracking_url", trackingIsUrl ? trackingValue : '');
    formData.append("estimated_delivery_date", itemForm.value.estimated_delivery_date || '');
    
    // Product image - only send if new file selected
    if (selectedProductImage.value) {
      formData.append("product_image", selectedProductImage.value);
    }
    if (markedForDeletion.value.image) {
      formData.append("remove_product_image", "1");
    }

    let url = `/orders/${order.value.id}/items`;
    
    if (editingItemId.value) {
      url = `/orders/${order.value.id}/items/${editingItemId.value}`;
      formData.append('_method', 'PUT');
    }

    await $customFetch(url, { method: "POST", body: formData });
    
    const wasEditing = !!editingItemId.value;
    
    // Reset form state
    resetForm();
    editingItemId.value = null;
    showAddProductModal.value = false;
    
    $toast.success(wasEditing ? t.value.updateProductButton : (t.value.productAdded || "Added!"));
    
    await fetchOrder(true);
    
  } catch (error) {
    console.error('Error saving product:', error);
    // Surface the real server message (e.g. validation errors) instead of a
    // generic toast, so the customer knows exactly what to fix.
    const firstFieldError = error?.data?.errors ? Object.values(error.data.errors)[0]?.[0] : null;
    $toast.error(firstFieldError || error?.data?.message || "Error saving product");
  } finally {
    submitting.value = false;
  }
};

const handleSubmitMobile = async () => { await handleSubmit(); };

const removeItem = async (itemId) => {
  if (!confirm(t.value.confirmMessage || "Are you sure?")) return;
  try { await $customFetch(`/orders/${order.value.id}/items/${itemId}`, { method: "DELETE" }); $toast.success("Removed"); if (editingItemId.value === itemId) cancelEdit(); await fetchOrder(true); } catch (error) { $toast.error("Error removing"); }
};

// Smart Footer Logic
const handleFooterAction = () => {
    if (isCollecting.value) {
        // Proof of purchase is required before the order can be confirmed.
        if (orderProofs.value.length === 0) {
            $toast.error(t.value.proofRequired);
            proofInput.value?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
            return;
        }
        showCompleteModal.value = true; // Open confirmation modal
    } else {
        navigateTo(`/app/orders/${order.value.id}`); // Just go back
    }
};

const confirmOrderAction = async () => {
  completingOrder.value = true;
  try {
    await $customFetch(`/orders/${order.value.id}/complete`, { method: "PUT" });
    showCompleteModal.value = false;
    $toast.success("Order confirmed!");
    return navigateTo({ path: `/app/orders/${order.value.id}`, query: { completed: "true" } });
  } catch (error) { $toast.error("Error confirming order"); } finally { completingOrder.value = false; }
};

onMounted(() => { fetchOrder(false); });
</script>

<style scoped>
.pb-safe { padding-bottom: env(safe-area-inset-bottom); }
.list-enter-active, .list-leave-active { transition: all 0.3s ease; }
.list-enter-from, .list-leave-to { opacity: 0; transform: translateX(-10px); }

/* gentle float on the empty-state icon */
.empty-float { animation: emptyFloat 3.5s ease-in-out infinite; }
@keyframes emptyFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
@media (prefers-reduced-motion: reduce) { .empty-float { animation: none; } }
</style>