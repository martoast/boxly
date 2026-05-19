<template>
  <section class="min-h-screen bg-gray-50 pb-20">
    <!-- Header -->
    <div class="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-30">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 py-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <NuxtLink to="/app/admin/purchase-requests" class="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors">
              <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </NuxtLink>
            <div>
              <h1 class="text-xl font-bold text-gray-900 flex items-center gap-3">
                {{ request?.request_number }}
                <span v-if="request" :class="['px-2.5 py-0.5 rounded-full text-xs font-medium border', getStatusColor(request.status)]">
                  {{ getStatusLabel(request.status) }}
                </span>
                <!-- Currency Badge -->
                <span v-if="request?.currency" class="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                  {{ request.currency.toUpperCase() }}
                </span>
              </h1>
              <p class="text-sm text-gray-500">{{ request?.user?.name }} ({{ request?.user?.email }})</p>
            </div>
          </div>
          
          <!-- Actions based on Status -->
          <div v-if="request" class="flex items-center gap-3">
            <!-- Pending Review -> Reject -->
            <button
              v-if="request.status === 'pending_review'"
              @click="showRejectModal = true"
              class="px-4 py-2 bg-white border border-red-300 text-red-600 font-medium rounded-lg hover:bg-red-50 transition-colors"
            >
              {{ t.reject }}
            </button>

            <!-- Paid -> Mark Purchased -->
            <button
              v-if="request.status === 'paid'"
              @click="showPurchaseModal = true"
              :disabled="processing"
              class="px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
            >
              <svg v-if="!processing" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
              <svg v-else class="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              {{ processing ? t.processing : t.markPurchased }}
            </button>

            <!-- Edit Menu -->
            <Menu as="div" class="relative ml-2">
                <MenuButton class="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 bg-white">
                    <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                </MenuButton>
                <transition
                    enter-active-class="transition duration-100 ease-out"
                    enter-from-class="transform scale-95 opacity-0"
                    enter-to-class="transform scale-100 opacity-100"
                    leave-active-class="transition duration-75 ease-in"
                    leave-from-class="transform scale-100 opacity-100"
                    leave-to-class="transform scale-95 opacity-0"
                >
                    <MenuItems class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 focus:outline-none z-50 origin-top-right">
                        <div class="p-1">
                            <MenuItem v-slot="{ active }">
                                <NuxtLink 
                                    :to="`/app/admin/purchase-requests/${request.id}/edit`"
                                    :class="[active ? 'bg-gray-50' : '', 'group flex w-full items-center rounded-md px-2 py-2 text-sm text-gray-900']"
                                >
                                    <svg class="mr-2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                    {{ t.editFullDetails }}
                                </NuxtLink>
                            </MenuItem>
                            <MenuItem v-slot="{ active }">
                                <button 
                                    @click="showDeleteModal = true"
                                    :class="[active ? 'bg-red-50 text-red-700' : 'text-red-600', 'group flex w-full items-center rounded-md px-2 py-2 text-sm']"
                                >
                                    <svg class="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    {{ t.deleteRequest }}
                                </button>
                            </MenuItem>
                        </div>
                    </MenuItems>
                </transition>
            </Menu>

          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-20">
      <div class="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
    </div>

    <div v-else-if="request" class="max-w-6xl mx-auto px-4 sm:px-6 mt-8 space-y-6">
      
      <!-- Reject Note -->
      <div v-if="request.status === 'rejected'" class="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800">
        <strong>{{ t.rejected }}:</strong> {{ request.admin_notes }}
      </div>

      <!-- Success Note -->
      <div v-if="request.status === 'purchased'" class="bg-green-50 border border-green-200 rounded-xl p-4 text-green-800 flex items-center gap-3">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <div>
          <p class="font-medium">{{ t.purchaseComplete }}</p>
          <p class="text-sm">{{ t.purchaseCompleteDesc }}</p>
        </div>
      </div>

      <!-- Stripe payment link banner — once a Stripe invoice has been
           created, surface the link here so the operator can re-share
           it or open it to verify the invoice on Stripe's hosted page. -->
      <div v-if="request.payment_link && request.payment_method === 'stripe'" class="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-start gap-4">
        <div class="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border border-indigo-100">
          <svg class="w-7 h-7 text-indigo-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
          </svg>
        </div>
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-indigo-900">{{ t.stripeLinkReady }}</p>
          <p class="text-sm text-indigo-700 mt-0.5">{{ t.stripeLinkReadyDesc }}</p>
          <div class="mt-3 flex items-stretch gap-2">
            <a
              :href="request.payment_link"
              target="_blank"
              rel="noopener"
              class="flex-1 min-w-0 truncate px-3 py-2 rounded-lg bg-white border border-indigo-100 text-xs text-indigo-700 font-mono hover:underline self-stretch flex items-center"
              :title="request.payment_link"
            >{{ request.payment_link }}</a>
            <button
              type="button"
              @click="copyPaymentLink"
              class="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-indigo-200 hover:bg-indigo-100 text-indigo-700 text-sm font-medium rounded-lg transition-colors flex-shrink-0"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
              {{ t.copy }}
            </button>
            <a
              :href="request.payment_link"
              target="_blank"
              rel="noopener"
              class="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors flex-shrink-0"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
              {{ t.openLink }}
            </a>
          </div>
        </div>
      </div>

      <!-- In-person context — renders only for source=in_person PRs.
           Surfaces what the customer asked for on the /shop/in-person
           flow: trip date, mall, stores to visit, categories of interest,
           minimum budget, and customer-facing notes. Items below remain
           the source of truth for billing — wishlist items there are
           the customer's pre-trip list. -->
      <div v-if="request.source === 'in_person'" class="bg-white rounded-xl shadow-sm border-2 border-indigo-200 overflow-hidden">
        <div class="px-6 py-4 border-b border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50 flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center flex-shrink-0">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          </div>
          <div>
            <h3 class="font-bold text-gray-900">{{ t.inPersonPanelTitle }}</h3>
            <p class="text-xs text-gray-500">{{ t.inPersonPanelDesc }}</p>
          </div>
        </div>
        <div class="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
          <div>
            <div class="text-xs uppercase tracking-wider text-gray-500 font-semibold">{{ t.inPersonTripLabel }}</div>
            <div v-if="request.shopping_trip" class="mt-1">
              <div class="font-bold text-gray-900">{{ formatTripDate(request.shopping_trip.trip_date) }}</div>
              <div class="text-gray-600">{{ request.shopping_trip.location }}</div>
            </div>
            <div v-else class="text-gray-500 mt-1 italic">{{ t.inPersonNoTrip }}</div>
          </div>
          <div>
            <div class="text-xs uppercase tracking-wider text-gray-500 font-semibold">{{ t.inPersonBudgetLabel }}</div>
            <div class="mt-1 font-bold text-gray-900">${{ Number(request.minimum_budget_usd ?? 0).toFixed(2) }} USD</div>
          </div>
          <div class="sm:col-span-2">
            <div class="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">
              {{ t.inPersonStoresLabel }} ({{ request.in_person_breakdown?.length ?? 0 }})
            </div>
            <div v-if="request.in_person_breakdown?.length" class="space-y-2">
              <div
                v-for="row in request.in_person_breakdown"
                :key="row.store_id"
                class="bg-white border border-gray-200 rounded-lg px-3 py-2"
              >
                <div class="font-semibold text-gray-900 text-sm">{{ row.store_name }}</div>
                <div class="mt-1 text-xs">
                  <template v-if="row.category_names.length">
                    <span
                      v-for="(name, i) in row.category_names"
                      :key="i"
                      class="inline-block mr-1.5 mt-0.5 px-2 py-0.5 bg-primary-50 text-primary-700 rounded"
                    >{{ name }}</span>
                  </template>
                  <span v-else class="text-gray-400 italic">{{ t.inPersonAnyCategory }}</span>
                </div>
              </div>
            </div>
            <div v-else class="text-gray-500 italic">—</div>
          </div>
          <div v-if="request.customer_notes" class="sm:col-span-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div class="text-xs uppercase tracking-wider text-amber-700 font-semibold mb-1">{{ t.inPersonCustomerNotes }}</div>
            <p class="text-sm text-amber-900 whitespace-pre-wrap">{{ request.customer_notes }}</p>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Items List -->
        <div class="lg:col-span-2 space-y-6">
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-100 bg-gray-50 flex flex-wrap justify-between items-center gap-3">
              <h3 class="font-semibold text-gray-900">{{ t.items }} ({{ request.items?.length || 0 }})</h3>
              <div class="flex items-center gap-3">
                <span v-if="request.status !== 'pending_review'" class="text-sm text-gray-500">{{ t.estMerchandise }}: ${{ itemsSubtotalUsd.toFixed(2) }} USD</span>
                <span v-else class="text-xs text-gray-500">{{ t.unavailableExcluded }}</span>
                <button
                  v-if="canEditItems"
                  type="button"
                  @click="openAddItemModal"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white text-xs font-semibold rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
                  {{ t.addItem }}
                </button>
              </div>
            </div>

            <div v-if="!request.items?.length" class="p-12 text-center text-sm text-gray-500">
              {{ t.noItems }}
            </div>

            <!-- Items grouped by store domain — each group is one US store
                 Velonie will check out at, so shipping + sales tax inputs
                 live in the group footer (pending_review only). -->
            <div class="divide-y divide-gray-200">
              <div v-for="group in itemGroups" :key="group.domain" class="bg-white">
                <div class="px-6 py-3 bg-gray-50/60 border-b border-gray-100 flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold rounded-full bg-white border border-gray-200 text-gray-700">
                      <svg class="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7h18M5 7v12a2 2 0 002 2h10a2 2 0 002-2V7M9 7V4a3 3 0 016 0v3"/></svg>
                      {{ group.domain }}
                    </span>
                    <span class="text-xs text-gray-500">· {{ group.items.length }} {{ t.items.toLowerCase() }}</span>
                  </div>
                  <span class="text-xs text-gray-500">${{ groupSubtotalUsd(group).toFixed(2) }} USD</span>
                </div>
                <div class="divide-y divide-gray-100">
                  <div v-for="(item, index) in group.items" :key="item.id" class="p-6">
                <div class="flex gap-4 items-start">
                  <!-- Image Thumbnail -->
                  <a
                    v-if="item.image_full_url"
                    :href="item.image_full_url"
                    target="_blank"
                    class="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 relative group"
                    :title="t.viewImage"
                  >
                    <img :src="item.image_full_url" class="w-full h-full object-cover" alt="Product Image">
                  </a>
                  <div v-else class="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 font-bold text-sm border border-gray-200">
                    {{ index + 1 }}
                  </div>

                  <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between gap-3">
                      <div class="min-w-0">
                        <h4 class="font-medium text-gray-900 text-lg leading-snug">{{ item.product_name }}</h4>
                        <a :href="item.product_url" target="_blank" class="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-1 w-fit">
                          {{ truncateUrl(item.product_url) }}
                          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                        </a>
                      </div>
                      <!-- Per-item delete (editable through `paid`) -->
                      <button
                        v-if="canEditItems"
                        type="button"
                        @click="onDeleteItem(item)"
                        :disabled="itemBusy[item.id]"
                        class="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors flex-shrink-0"
                        :title="t.deleteItem"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </div>

                    <!-- Editable price + qty (open through `paid`) -->
                    <div v-if="canEditItems" class="grid grid-cols-2 gap-3 mt-3">
                      <div>
                        <label class="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">{{ t.price }} USD</label>
                        <div class="relative">
                          <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                          <input
                            type="number" step="0.01" min="0"
                            :value="itemDraft(item.id, 'price', item.price)"
                            @input="setItemDraft(item.id, 'price', $event.target.value)"
                            @blur="commitItemEdit(item)"
                            @keydown.enter.prevent="$event.target.blur()"
                            class="w-full text-sm pl-6 pr-2 py-1.5 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label class="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">{{ t.qty }}</label>
                        <input
                          type="number" step="1" min="1"
                          :value="itemDraft(item.id, 'quantity', item.quantity)"
                          @input="setItemDraft(item.id, 'quantity', $event.target.value)"
                          @blur="commitItemEdit(item)"
                          @keydown.enter.prevent="$event.target.blur()"
                          class="w-full text-sm px-2 py-1.5 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </div>

                    <!-- Display-only (after the editing window closes) -->
                    <div v-else class="grid grid-cols-3 gap-3 text-sm mt-3">
                      <div class="bg-gray-50 p-2 rounded border border-gray-100">
                        <span class="text-xs text-gray-500 block uppercase">{{ t.qty }}</span>
                        <span class="font-semibold">{{ item.quantity }}</span>
                      </div>
                      <div class="bg-gray-50 p-2 rounded border border-gray-100">
                        <span class="text-xs text-gray-500 block uppercase">{{ t.price }}</span>
                        <span class="font-semibold">${{ Number(item.price).toFixed(2) }}</span>
                      </div>
                      <div class="bg-gray-50 p-2 rounded border border-gray-100">
                        <span class="text-xs text-gray-500 block uppercase">{{ t.subtotal }}</span>
                        <span class="font-semibold">${{ (item.price * item.quantity).toFixed(2) }}</span>
                      </div>
                    </div>

                    <!-- Line subtotal — live while items are editable -->
                    <div v-if="canEditItems" class="mt-2 text-sm">
                      <span class="text-gray-500">{{ t.subtotal }}:</span>
                      <span class="font-semibold text-gray-900 ml-1">${{ (Number(itemDraft(item.id, 'price', item.price)) * Number(itemDraft(item.id, 'quantity', item.quantity))).toFixed(2) }} USD</span>
                    </div>

                    <!-- Options -->
                    <div v-if="item.options && Object.keys(item.options).length > 0" class="flex flex-wrap gap-2 mt-3">
                      <span v-for="(val, key) in item.options" :key="key" class="text-xs bg-primary-50 text-primary-700 border border-primary-100 px-2 py-1 rounded">
                        <strong>{{ key }}:</strong> {{ val }}
                      </span>
                    </div>

                    <!-- Notes from customer -->
                    <div v-if="item.notes" class="mt-3 text-sm bg-yellow-50 text-yellow-800 p-3 rounded border border-yellow-100">
                      <span class="font-bold text-xs uppercase block mb-1 text-yellow-600">{{ t.customerNotes }}</span>
                      {{ item.notes }}
                    </div>

                    <!-- Stock status toggle (open through `paid`) -->
                    <div v-if="canEditItems" class="mt-3 flex items-center gap-2">
                      <span class="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{{ t.status }}:</span>
                      <button
                        type="button"
                        @click="setItemStock(item, 'available')"
                        :disabled="itemBusy[item.id]"
                        :class="[
                          'px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors',
                          item.stock_status === 'available'
                            ? 'bg-green-600 text-white border-green-600'
                            : 'bg-white text-green-700 border-green-300 hover:bg-green-50',
                        ]"
                      >{{ t.stockAvailable }}</button>
                      <button
                        type="button"
                        @click="setItemStock(item, 'unavailable')"
                        :disabled="itemBusy[item.id]"
                        :class="[
                          'px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors',
                          item.stock_status === 'unavailable'
                            ? 'bg-red-600 text-white border-red-600'
                            : 'bg-white text-red-700 border-red-300 hover:bg-red-50',
                        ]"
                      >{{ t.stockUnavailable }}</button>
                      <button
                        v-if="item.stock_status && item.stock_status !== 'unverified'"
                        type="button"
                        @click="setItemStock(item, 'unverified')"
                        :disabled="itemBusy[item.id]"
                        class="px-1.5 py-1 text-xs text-gray-500 hover:text-gray-800 underline"
                      >{{ t.resetStock }}</button>
                    </div>

                    <!-- Stock badge (after the editing window closes) -->
                    <div v-else-if="item.stock_status && item.stock_status !== 'unverified'" class="mt-3">
                      <span
                        :class="[
                          'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border',
                          item.stock_status === 'available'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-red-50 text-red-700 border-red-200',
                        ]"
                      >
                        {{ item.stock_status === 'available' ? t.stockAvailable : t.stockUnavailable }}
                      </span>
                    </div>
                  </div>
                </div>
                  </div>
                </div>

                <!-- Per-store shipping + tax (pending_review only). One row
                     per group — what Velonie pays at this specific store's
                     checkout. Saved on blur to PR.store_costs. -->
                <div v-if="request.status === 'pending_review'" class="px-6 py-4 border-t border-gray-100 bg-gray-50/40 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label class="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">{{ t.shippingUsa }} — {{ group.domain }} (USD)</label>
                    <div class="relative">
                      <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                      <input
                        type="number" step="0.01" min="0"
                        :value="storeCost(group.domain, 'shipping')"
                        @input="setStoreCost(group.domain, 'shipping', $event.target.value)"
                        @blur="persistStoreCosts"
                        @keydown.enter.prevent="$event.target.blur()"
                        class="w-full text-sm pl-6 pr-2 py-1.5 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div>
                    <label class="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">{{ t.salesTax }} — {{ group.domain }} (USD)</label>
                    <div class="relative">
                      <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                      <input
                        type="number" step="0.01" min="0"
                        :value="storeCost(group.domain, 'tax')"
                        @input="setStoreCost(group.domain, 'tax', $event.target.value)"
                        @blur="persistStoreCosts"
                        @keydown.enter.prevent="$event.target.blur()"
                        class="w-full text-sm pl-6 pr-2 py-1.5 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Quote settings + preview + send (pending_review only) -->
          <div v-if="request.status === 'pending_review'" class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h3 class="font-semibold text-gray-900">{{ t.quoteSettings }}</h3>
              <p class="text-xs text-gray-500 mt-0.5">{{ t.quoteSettingsDesc }}</p>
            </div>

            <div class="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{{ t.serviceFee }} (%)</label>
                <input v-model.number="quoteForm.processing_fee_percent" type="number" step="0.1" min="0" max="100" class="w-full text-sm px-2 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div class="sm:col-span-2 flex items-end">
                <p class="text-xs text-gray-500 leading-snug">{{ t.shippingTaxPerStoreHint }}</p>
              </div>
              <div class="sm:col-span-3">
                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{{ t.adminNotes }} <span class="font-normal lowercase text-gray-400">— {{ t.optional }}</span></label>
                <textarea v-model="quoteForm.admin_notes" rows="2" class="w-full text-sm px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500" :placeholder="t.adminNotesPlaceholder"></textarea>
              </div>
            </div>

            <!-- Live preview -->
            <div class="px-6 pb-6">
              <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2 text-sm">
                <div class="flex justify-between text-gray-700">
                  <span>{{ t.itemsSubtotal }} ({{ billableCount }} {{ t.items.toLowerCase() }})</span>
                  <span class="font-mono">${{ itemsSubtotalUsd.toFixed(2) }} USD</span>
                </div>
                <div v-if="aggregateShipping > 0" class="flex justify-between text-gray-700">
                  <span>+ {{ t.shippingUsa }} ({{ itemGroups.length }} {{ itemGroups.length === 1 ? t.storeOne : t.storeMany }})</span>
                  <span class="font-mono">${{ aggregateShipping.toFixed(2) }} USD</span>
                </div>
                <div v-if="aggregateTax > 0" class="flex justify-between text-gray-700">
                  <span>+ {{ t.salesTax }}</span>
                  <span class="font-mono">${{ aggregateTax.toFixed(2) }} USD</span>
                </div>
                <div v-if="(quoteForm.processing_fee_percent || 0) > 0" class="flex justify-between text-gray-700">
                  <span>+ {{ t.serviceFee }} ({{ Number(quoteForm.processing_fee_percent).toFixed(1) }}%)</span>
                  <span class="font-mono">${{ feeUsd.toFixed(2) }} USD</span>
                </div>
                <div class="pt-2 border-t border-gray-200 flex justify-between font-semibold text-gray-900">
                  <span>{{ t.totalUsd }}</span>
                  <span class="font-mono">${{ totalUsd.toFixed(2) }} USD</span>
                </div>
                <div class="text-xs text-gray-500 italic">
                  {{ t.usdInvoiceNote }}
                </div>
              </div>

              <button
                type="button"
                @click="onSendQuote"
                :disabled="sendingQuote || !canSendQuote"
                class="mt-4 w-full px-4 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <svg v-if="!sendingQuote" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <svg v-else class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                {{ sendingQuote ? t.sending : t.confirmAndSend }}
              </button>
              <p v-if="!canSendQuote" class="mt-2 text-xs text-gray-500 text-center">{{ noBillableMessage }}</p>
            </div>
          </div>
        </div>

        <!-- Sidebar: Customer Info (Finanzas card removed — the
             "Crear cotización" action lives in the page header above
             and the quote totals are persisted on the PR itself). -->
        <div class="lg:col-span-1 space-y-6">
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
             <h3 class="font-semibold text-gray-900 mb-4 border-b pb-2">{{ t.customerInfo }}</h3>
             <div class="space-y-2 text-sm">
                <p><span class="text-gray-500">{{ t.name }}:</span> {{ request.user?.name }}</p>
                <p><span class="text-gray-500">{{ t.email }}:</span> {{ request.user?.email }}</p>
                <p><span class="text-gray-500">{{ t.phone }}:</span> {{ request.user?.phone }}</p>
                <p><span class="text-gray-500">{{ t.language }}:</span> {{ request.user?.preferred_language }}</p>
             </div>
          </div>
        </div>
      </div>
  
      <!-- Reject Modal -->
      <div v-if="showRejectModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div class="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
              <h3 class="text-lg font-bold text-gray-900 mb-2">{{ t.rejectRequest }}</h3>
              <p class="text-sm text-gray-500 mb-4">{{ t.rejectDesc }}</p>
              <textarea 
                  v-model="rejectReason" 
                  rows="3" 
                  class="w-full border border-gray-300 rounded-lg p-2 mb-4 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  :placeholder="t.reasonPlaceholder"
              ></textarea>
              <div class="flex justify-end gap-3">
                  <button @click="showRejectModal = false" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">{{ t.cancel }}</button>
                  <button 
                      @click="handleReject" 
                      :disabled="!rejectReason"
                      class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                      {{ t.confirmReject }}
                  </button>
              </div>
          </div>
      </div>

      <!-- Mark as Purchased Modal -->
      <div v-if="showPurchaseModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div class="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
              <div class="flex items-center gap-3 mb-4">
                  <div class="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                  </div>
                  <div>
                      <h3 class="text-lg font-bold text-gray-900">{{ t.confirmPurchaseTitle }}</h3>
                      <p class="text-sm text-gray-500">{{ t.confirmPurchaseSubtitle }}</p>
                  </div>
              </div>
              
              <div class="bg-gray-50 rounded-lg p-4 mb-4 space-y-2">
                  <p class="text-sm text-gray-700">{{ t.purchaseModalDesc }}</p>
                  <ul class="text-sm text-gray-600 space-y-1 ml-4 list-disc">
                      <li>{{ t.purchaseModalPoint1 }}</li>
                      <li>{{ t.purchaseModalPoint2 }}</li>
                      <li>{{ t.purchaseModalPoint3 }}</li>
                  </ul>
              </div>

              <div class="flex justify-end gap-3">
                  <button 
                      @click="showPurchaseModal = false" 
                      :disabled="processing"
                      class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                  >
                      {{ t.cancel }}
                  </button>
                  <button 
                      @click="handleMarkPurchased" 
                      :disabled="processing"
                      class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                      <svg v-if="!processing" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      <svg v-else class="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {{ processing ? t.processing : t.confirmPurchase }}
                  </button>
              </div>
          </div>
      </div>

      <!-- Add Item Modal — open through `paid` so admin can patch in a
           substituted product before clicking "Marcar como Comprado". -->
      <div v-if="showAddItemModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div class="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl">
              <h3 class="text-lg font-bold text-gray-900 mb-1">{{ t.addItemTitle }}</h3>
              <p class="text-sm text-gray-500 mb-5">{{ t.addItemSubtitle }}</p>

              <div class="space-y-3">
                  <div>
                      <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{{ t.addItemName }}</label>
                      <input v-model="addItemForm.product_name" type="text" class="w-full px-3 py-2 text-sm rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500" :placeholder="t.addItemNamePh" />
                  </div>
                  <div>
                      <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{{ t.addItemUrl }}</label>
                      <input v-model="addItemForm.product_url" type="url" class="w-full px-3 py-2 text-sm rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="https://..." />
                  </div>
                  <div class="grid grid-cols-2 gap-3">
                      <div>
                          <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{{ t.addItemPrice }} (USD)</label>
                          <div class="relative">
                              <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                              <input v-model.number="addItemForm.price" type="number" step="0.01" min="0" class="w-full text-sm pl-6 pr-2 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                          </div>
                      </div>
                      <div>
                          <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{{ t.qty }}</label>
                          <input v-model.number="addItemForm.quantity" type="number" step="1" min="1" class="w-full text-sm px-2 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                      </div>
                  </div>
                  <div>
                      <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{{ t.addItemNotes }} <span class="font-normal lowercase text-gray-400">— {{ t.optional }}</span></label>
                      <textarea v-model="addItemForm.notes" rows="2" class="w-full px-3 py-2 text-sm rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"></textarea>
                  </div>
              </div>

              <p v-if="addItemError" class="mt-3 text-xs text-red-600">{{ addItemError }}</p>

              <div class="flex justify-end gap-3 mt-5">
                  <button @click="closeAddItemModal" :disabled="addItemSaving" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50">{{ t.cancel }}</button>
                  <button
                      @click="submitAddItem"
                      :disabled="addItemSaving || !addItemForm.product_name || !addItemForm.product_url || addItemForm.price === '' || !addItemForm.quantity"
                      class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                      {{ addItemSaving ? t.adding : t.addItem }}
                  </button>
              </div>
          </div>
      </div>

      <!-- Delete Confirmation Modal -->
      <div v-if="showDeleteModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div class="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
              <div class="flex items-center gap-3 mb-4">
                  <div class="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                      <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                  </div>
                  <div>
                      <h3 class="text-lg font-bold text-gray-900">{{ t.deleteConfirmTitle }}</h3>
                      <p class="text-sm text-gray-500">{{ t.deleteConfirmSubtitle }}</p>
                  </div>
              </div>
              
              <p class="text-sm text-gray-600 mb-4">{{ t.deleteConfirmDesc }}</p>

              <div class="flex justify-end gap-3">
                  <button 
                      @click="showDeleteModal = false" 
                      class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                      {{ t.cancel }}
                  </button>
                  <button 
                      @click="confirmDelete" 
                      class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                      {{ t.confirmDelete }}
                  </button>
              </div>
          </div>
      </div>
      </div>
  
    </section>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue';

definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin']
});

const route = useRoute();
const router = useRouter();
const { $customFetch, $toast } = useNuxtApp();
const { t: createTranslations } = useLanguage();
const user = useUser().value;

const translations = {
  createQuote: { es: 'Crear Cotización', en: 'Create Quote' },
  reject: { es: 'Rechazar', en: 'Reject' },
  markPurchased: { es: 'Marcar como Comprado', en: 'Mark as Purchased' },
  markAsPaid: { es: 'Marcar como Pagado', en: 'Mark as Paid' },
  processing: { es: 'Procesando...', en: 'Processing...' },
  rejected: { es: 'Rechazado', en: 'Rejected' },
  purchaseComplete: { es: 'Compra Completada', en: 'Purchase Complete' },
  purchaseCompleteDesc: { 
    es: 'Los artículos se han convertido en una orden de envío y están esperando llegada.', 
    en: 'Items have been converted to a shipping order and are awaiting arrival.' 
  },
  awaitingBankTransfer: { es: 'Esperando Transferencia Bancaria', en: 'Awaiting Bank Transfer' },
  awaitingBankTransferDesc: { 
    es: 'El cliente ha recibido las instrucciones de pago por NU Bank. Una vez confirmes el pago, podrás proceder con la compra.', 
    en: 'Customer has received NU Bank payment instructions. Once you confirm payment, you can proceed with the purchase.' 
  },
  confirmPaymentReceived: { es: 'Confirmar Pago Recibido', en: 'Confirm Payment Received' },
  items: { es: 'Artículos', en: 'Items' },
  estMerchandise: { es: 'Total', en: 'Total' },
  qty: { es: 'Cant', en: 'Qty' },
  price: { es: 'Precio', en: 'Price' },
  subtotal: { es: 'Subtotal', en: 'Subtotal' },
  customerNotes: { es: 'Notas del Cliente', en: 'Customer Notes' },
  inPersonPanelTitle:    { es: 'Visita en persona a Las Américas', en: 'In-person trip to Las Americas' },
  inPersonPanelDesc:     { es: 'Lo que el cliente agendó. Los items abajo (estado "wishlist") son su lista — confírmalos después de la visita con el precio real.', en: 'What the customer scheduled. Items below in "wishlist" state are their list — confirm after the trip with the real price.' },
  inPersonTripLabel:     { es: 'Fecha de la visita', en: 'Visit date' },
  inPersonBudgetLabel:   { es: 'Presupuesto mínimo del cliente', en: "Customer's minimum budget" },
  inPersonStoresLabel:    { es: 'Tiendas a visitar', en: 'Stores to visit' },
  inPersonAnyCategory:    { es: 'Cualquier categoría', en: 'Any category' },
  inPersonCustomerNotes: { es: 'Notas del cliente', en: 'Customer notes' },
  inPersonNoTrip:        { es: 'Sin fecha asignada — la visita fue eliminada', en: 'No date — the trip was deleted' },
  financials: { es: 'Finanzas', en: 'Financials' },
  calculateQuote: { es: 'Calcular Cotización', en: 'Calculate Quote' },
  yourCost: { es: 'Costo', en: 'Cost' },
  yourMargin: { es: 'Ganancia', en: 'Margin' },
  customerPays: { es: 'Cliente Paga', en: 'Customer Pays' },
  paymentMethod: { es: 'Método de Pago', en: 'Payment Method' },
  stripeLink: { es: 'Enlace de Pago Stripe', en: 'Stripe Payment Link' },
  stripeLinkReady: { es: 'Cotización Stripe enviada', en: 'Stripe invoice sent' },
  stripeLinkReadyDesc: {
    es: 'El cliente recibió un email con el enlace de pago. Aquí está por si necesitas reenviarlo o verificarlo.',
    en: 'Customer received an email with the payment link. Here it is if you need to resend or verify it.',
  },
  openLink: { es: 'Abrir', en: 'Open' },
  copy: { es: 'Copiar', en: 'Copy' },
  copied: { es: 'Copiado', en: 'Copied' },
  customerInfo: { es: 'Cliente', en: 'Customer Info' },
  name: { es: 'Nombre', en: 'Name' },
  email: { es: 'Email', en: 'Email' },
  phone: { es: 'Teléfono', en: 'Phone' },
  language: { es: 'Idioma', en: 'Language' },
  rejectRequest: { es: 'Rechazar Solicitud', en: 'Reject Request' },
  rejectDesc: { es: 'Por favor indica la razón del rechazo. Esto se enviará al cliente.', en: 'Please provide a reason. This will be sent to the customer.' },
  reasonPlaceholder: { es: 'Ej: Artículos prohibidos, fuera de stock...', en: 'Ex: Prohibited items, out of stock...' },
  cancel: { es: 'Cancelar', en: 'Cancel' },
  confirmReject: { es: 'Confirmar Rechazo', en: 'Confirm Reject' },
  editFullDetails: { es: 'Editar Detalles', en: 'Edit Full Details' },
  deleteRequest: { es: 'Eliminar Solicitud', en: 'Delete Request' },
  confirmPurchaseTitle: { es: 'Confirmar Compra', en: 'Confirm Purchase' },
  confirmPurchaseSubtitle: { es: '¿Compraste estos artículos?', en: 'Did you purchase these items?' },
  confirmPurchase: { es: 'Sí, Compré Todo', en: 'Yes, I Purchased Everything' },
  purchaseModalDesc: { es: 'Esta acción hará lo siguiente:', en: 'This action will:' },
  purchaseModalPoint1: { es: 'Marcar la solicitud como "Comprado"', en: 'Mark the request as "Purchased"' },
  purchaseModalPoint2: { es: 'Agregar los artículos a la orden de envío del cliente', en: 'Add items to the customer\'s shipping order' },
  purchaseModalPoint3: { es: 'Notificar al cliente que los artículos están en camino', en: 'Notify the customer that items are on the way' },
  confirmPaymentTitle: { es: 'Confirmar Pago', en: 'Confirm Payment' },
  confirmPaymentSubtitle: { es: '¿Recibiste la transferencia?', en: 'Did you receive the transfer?' },
  confirmPaymentDesc: { es: 'Confirma que recibiste el pago por transferencia bancaria en la cuenta NU.', en: 'Confirm that you received the bank transfer payment to the NU account.' },
  // Unified quote flow
  status: { es: 'Estado', en: 'Status' },
  stockAvailable: { es: 'Disponible', en: 'Available' },
  stockUnavailable: { es: 'No disponible', en: 'Unavailable' },
  resetStock: { es: 'Restablecer', en: 'Reset' },
  deleteItem: { es: 'Eliminar artículo', en: 'Delete item' },
  addItem: { es: 'Agregar artículo', en: 'Add item' },
  addItemTitle: { es: 'Agregar artículo a la solicitud', en: 'Add item to request' },
  addItemSubtitle: { es: 'Útil cuando el cliente cambia lo que pidió después del pago.', en: 'Useful when the customer swaps what they ordered after payment.' },
  addItemName: { es: 'Nombre del producto', en: 'Product name' },
  addItemNamePh: { es: 'Ej: Nike Air Max 90, talla 9', en: 'Ex: Nike Air Max 90, size 9' },
  addItemUrl: { es: 'Link del producto', en: 'Product URL' },
  addItemPrice: { es: 'Precio', en: 'Price' },
  addItemNotes: { es: 'Notas internas', en: 'Internal notes' },
  adding: { es: 'Agregando...', en: 'Adding...' },
  noItems: { es: 'No hay artículos en esta solicitud', en: 'No items in this request' },
  unavailableExcluded: { es: 'Artículos no disponibles se excluyen del total', en: 'Unavailable items are excluded from the total' },
  quoteSettings: { es: 'Configurar Cotización', en: 'Quote Settings' },
  quoteSettingsDesc: { es: 'Se cobra al cliente en una sola línea en Stripe — el desglose por tienda queda guardado para tu referencia.', en: 'Customer is billed as a single Stripe line — the per-store breakdown is saved for your reference.' },
  shippingTaxPerStoreHint: { es: 'El envío y los impuestos se ingresan por tienda arriba — Velonie compra cada tienda por separado.', en: 'Shipping and tax are entered per store above — Velonie checks out at each store separately.' },
  storeOne: { es: 'tienda', en: 'store' },
  storeMany: { es: 'tiendas', en: 'stores' },
  shippingUsa: { es: 'Envío a USA', en: 'Shipping to USA' },
  salesTax: { es: 'Impuestos USA', en: 'US Sales Tax' },
  serviceFee: { es: 'Tarifa de servicio', en: 'Service fee' },
  adminNotes: { es: 'Notas para el cliente', en: 'Notes to customer' },
  adminNotesPlaceholder: { es: 'Aparecerá en el correo de cotización...', en: 'Will appear in the quote email...' },
  optional: { es: 'opcional', en: 'optional' },
  itemsSubtotal: { es: 'Subtotal de artículos', en: 'Items subtotal' },
  totalUsd: { es: 'Total', en: 'Total' },
  usdInvoiceNote: {
    es: 'La factura se emite en USD. Stripe muestra el monto convertido a MXN al cliente y su banco hace la conversión al pagar.',
    en: 'Invoice is issued in USD. Stripe shows the MXN-converted amount to the customer; their bank handles conversion at payment time.',
  },
  confirmAndSend: { es: 'Confirmar y Enviar Cotización', en: 'Confirm & Send Quote' },
  sending: { es: 'Enviando...', en: 'Sending...' },
  noBillableItems: { es: 'Marca al menos un artículo como disponible para enviar la cotización.', en: 'Mark at least one item as available to send the quote.' },
  confirmPaymentAmount: { es: 'Monto esperado', en: 'Expected amount' },
  yesPaymentReceived: { es: 'Sí, Pago Recibido', en: 'Yes, Payment Received' },
  deleteConfirmTitle: { es: 'Eliminar Solicitud', en: 'Delete Request' },
  deleteConfirmSubtitle: { es: 'Esta acción no se puede deshacer', en: 'This action cannot be undone' },
  deleteConfirmDesc: { es: '¿Estás seguro de que deseas eliminar esta solicitud de compra? Toda la información asociada se perderá permanentemente.', en: 'Are you sure you want to delete this purchase request? All associated information will be permanently lost.' },
  confirmDelete: { es: 'Sí, Eliminar', en: 'Yes, Delete' },
  viewImage: { es: 'Ver Imagen', en: 'View Image' },
};

const t = createTranslations(translations);

// Robust to both 'YYYY-MM-DD' and full ISO date-time strings — Laravel's
// default `date` cast emits the latter on some models.
const formatTripDate = (d) => {
  if (!d) return '';
  const datePart = String(d).substring(0, 10);
  const dt = new Date(datePart + 'T12:00');
  return isNaN(dt.getTime()) ? d : dt.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

const request = ref(null);
const loading = ref(true);
const processing = ref(false);
const showRejectModal = ref(false);
const showPurchaseModal = ref(false);
const showDeleteModal = ref(false);
const showAddItemModal = ref(false);
const addItemSaving = ref(false);
const addItemError = ref(null);
const addItemForm = ref({ product_name: '', product_url: '', price: '', quantity: 1, notes: '' });
const rejectReason = ref('');

// Unified quote settings (filled in on the detail page, sent to /quote).
//
// Per-store cost capture: Velonie buys from each US store separately, so
// shipping + sales tax are entered per domain (amazon.com, youngla.com …).
// We sum across stores to produce the final invoice — the customer sees
// one charge but the breakdown survives reloads via PR.store_costs.
const quoteForm = ref({
  store_costs: {},                // { 'amazon.com': { shipping: 0, tax: 0 } }
  processing_fee_percent: 10,
  admin_notes: '',
});
const sendingQuote = ref(false);
const persistingCosts = ref(false);

// Per-item editing state — keyed by item.id
const itemBusy = ref({});      // request in flight (delete, stock toggle, etc.)
const itemDrafts = ref({});    // unsaved local edits to price/quantity inputs

const itemDraft = (id, field, fallback) => {
  const d = itemDrafts.value[id];
  if (d && d[field] !== undefined) return d[field];
  return fallback ?? '';
};
const setItemDraft = (id, field, value) => {
  if (! itemDrafts.value[id]) itemDrafts.value[id] = {};
  itemDrafts.value[id][field] = value;
};
const clearItemDraft = (id) => {
  delete itemDrafts.value[id];
};

// Currency helpers
const currencySymbol = computed(() => {
  return request.value?.currency === 'mxn' ? '$' : '$';
});

const currencyLabel = computed(() => {
  const currency = request.value?.currency || 'usd';
  return currency.toUpperCase();
});

const formatCurrency = (amount) => {
  const value = Number(amount || 0).toFixed(2);
  const currency = request.value?.currency || 'usd';
  return `$${value} ${currency.toUpperCase()}`;
};

// Margin percentage for display
const marginPercent = computed(() => {
  const cost = request.value?.items_total || 0;
  if (cost <= 0) return '0';
  const fee = request.value?.processing_fee || 0;
  return ((fee / cost) * 100).toFixed(1);
});

const fetchRequest = async () => {
  loading.value = true;
  try {
    const response = await $customFetch(`${apiNs.value}/purchase-requests/${route.params.id}`);
    request.value = response.data || response; 
  } catch (e) {
    console.error(e);
    $toast.error('Error loading request');
  } finally {
    loading.value = false;
  }
};

const getStatusColor = (status) => {
  const map = {
    pending_review: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    quoted: 'bg-blue-100 text-blue-800 border-blue-200',
    paid: 'bg-primary-100 text-primary-800 border-primary-200',
    purchased: 'bg-green-100 text-green-800 border-green-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
  };
  return map[status] || 'bg-gray-100 text-gray-800';
};

const getStatusLabel = (status) => status?.replace('_', ' ').toUpperCase();

const truncateUrl = (url) => {
  try {
    let safeUrl = url;
    if (!safeUrl.match(/^https?:\/\//i)) {
        safeUrl = 'https://' + safeUrl;
    }
    const { hostname } = new URL(safeUrl);
    return hostname.replace('www.', '');
  } catch {
    return 'Link';
  }
};

// ---- Unified quote flow ----

// API namespace — admin vs shopping (same page is reused under /shopping)
const apiNs = computed(() => route.path.includes('/shopping/') ? '/shopping' : '/admin');

// Statuses where the line-up is still mutable. Matches ITEM_EDITABLE_STATUSES
// on the backend — pending_review through paid. Once the PR is `purchased`
// the items have been materialised into an Order and edits would silently
// drift the two records apart.
const canEditItems = computed(() => {
  const s = request.value?.status
  return s === 'pending_review' || s === 'quoted' || s === 'paid'
});

// Extract the bare domain from a product URL ("amazon.com", "youngla.com").
// Falls back to "otros" for items missing or with broken URLs so they still
// land in a visible group rather than disappearing.
const extractDomain = (url) => {
  try {
    let safeUrl = url || '';
    if (!safeUrl) return 'otros';
    if (!safeUrl.match(/^https?:\/\//i)) safeUrl = 'https://' + safeUrl;
    const { hostname } = new URL(safeUrl);
    return hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return 'otros';
  }
};

// Items billable in the quote = anything not explicitly marked unavailable.
// (Unverified items still count — the admin can leave them unverified and
// just send the quote, OR explicitly mark unavailable to exclude.)
const billableItems = computed(() =>
  (request.value?.items || []).filter(i => i.stock_status !== 'unavailable'),
);
const billableCount = computed(() => billableItems.value.length);

// Group items (all of them — including unavailable, so the admin can still
// see them in context) by their product_url domain. One group = one store
// Velonie will check out at, so shipping + tax are entered per group.
const itemGroups = computed(() => {
  const items = request.value?.items || [];
  const byDomain = new Map();
  for (const item of items) {
    const d = extractDomain(item.product_url);
    if (!byDomain.has(d)) byDomain.set(d, []);
    byDomain.get(d).push(item);
  }
  return Array.from(byDomain.entries()).map(([domain, items]) => ({ domain, items }));
});

// Sum of price*qty for billable items inside a single store group — used
// for the per-store header and the overall items subtotal.
const groupSubtotalUsd = (group) =>
  group.items
    .filter(i => i.stock_status !== 'unavailable')
    .reduce((sum, i) => {
      const price = Number(itemDraft(i.id, 'price', i.price)) || 0;
      const qty = Number(itemDraft(i.id, 'quantity', i.quantity)) || 0;
      return sum + price * qty;
    }, 0);

const itemsSubtotalUsd = computed(() =>
  itemGroups.value.reduce((s, g) => s + groupSubtotalUsd(g), 0),
);

// Per-store cost helpers — keyed by domain in quoteForm.store_costs
const storeCost = (domain, field) => {
  const c = quoteForm.value.store_costs?.[domain];
  return c?.[field] ?? 0;
};
const setStoreCost = (domain, field, value) => {
  if (!quoteForm.value.store_costs[domain]) {
    quoteForm.value.store_costs[domain] = { shipping: 0, tax: 0 };
  }
  quoteForm.value.store_costs[domain][field] = Number(value) || 0;
};

const aggregateShipping = computed(() =>
  Object.values(quoteForm.value.store_costs || {}).reduce(
    (s, c) => s + (Number(c?.shipping) || 0), 0,
  ),
);
const aggregateTax = computed(() =>
  Object.values(quoteForm.value.store_costs || {}).reduce(
    (s, c) => s + (Number(c?.tax) || 0), 0,
  ),
);

const feeUsd = computed(() => {
  const pre = itemsSubtotalUsd.value + aggregateShipping.value + aggregateTax.value;
  const pct = Number(quoteForm.value.processing_fee_percent) || 0;
  return Math.round(pre * (pct / 100) * 100) / 100;
});

const totalUsd = computed(() => {
  const pre = itemsSubtotalUsd.value + aggregateShipping.value + aggregateTax.value;
  return Math.round((pre + feeUsd.value) * 100) / 100;
});

// Strip empty entries before persisting — saves a sparse object to the PR.
const cleanStoreCosts = () => {
  const clean = {};
  for (const [domain, c] of Object.entries(quoteForm.value.store_costs || {})) {
    const ship = Number(c?.shipping) || 0;
    const tax = Number(c?.tax) || 0;
    if (ship > 0 || tax > 0) clean[domain] = { shipping: ship, tax };
  }
  return clean;
};

// Save per-store costs to the PR on blur so reloads stay in sync.
const persistStoreCosts = async () => {
  if (persistingCosts.value) return;
  persistingCosts.value = true;
  try {
    await $customFetch(`${apiNs.value}/purchase-requests/${request.value.id}`, {
      method: 'PUT',
      body: { store_costs: cleanStoreCosts() },
    });
  } catch (e) {
    console.error(e);
  } finally {
    persistingCosts.value = false;
  }
};

// Seed quoteForm.store_costs from the PR (or empty per-domain rows on first
// load) once item groups are known. Watch domain list — adds missing rows
// without clobbering admin edits-in-progress.
watch(itemGroups, (groups) => {
  const existing = quoteForm.value.store_costs || {};
  const seeded = request.value?.store_costs || {};
  const next = { ...existing };
  for (const g of groups) {
    if (next[g.domain]) continue;
    next[g.domain] = seeded[g.domain]
      ? { shipping: Number(seeded[g.domain].shipping) || 0, tax: Number(seeded[g.domain].tax) || 0 }
      : { shipping: 0, tax: 0 };
  }
  quoteForm.value.store_costs = next;
}, { immediate: true });

const canSendQuote = computed(() => billableCount.value > 0);
const noBillableMessage = computed(() => canSendQuote.value ? '' : t.value.noBillableItems);

// Commit a draft (price or qty) to the backend on blur
const commitItemEdit = async (item) => {
  const draft = itemDrafts.value[item.id];
  if (! draft) return;
  const payload = {};
  if (draft.price !== undefined) payload.price = Number(draft.price);
  if (draft.quantity !== undefined) payload.quantity = parseInt(draft.quantity, 10);
  // Skip no-op edits
  if (
    (payload.price === undefined || payload.price === Number(item.price)) &&
    (payload.quantity === undefined || payload.quantity === Number(item.quantity))
  ) {
    clearItemDraft(item.id);
    return;
  }
  itemBusy.value[item.id] = true;
  try {
    const resp = await $customFetch(`${apiNs.value}/purchase-requests/${request.value.id}/items/${item.id}`, {
      method: 'PUT',
      body: payload,
    });
    const next = resp?.data || resp;
    const idx = request.value.items.findIndex(x => x.id === item.id);
    if (idx >= 0 && next) request.value.items[idx] = { ...request.value.items[idx], ...next };
    clearItemDraft(item.id);
  } catch (e) {
    console.error(e);
    $toast.error(e?.data?.message || 'No se pudo guardar el cambio');
  } finally {
    itemBusy.value[item.id] = false;
  }
};

const setItemStock = async (item, stockStatus) => {
  if (itemBusy.value[item.id]) return;
  itemBusy.value[item.id] = true;
  try {
    const resp = await $customFetch(`${apiNs.value}/purchase-requests/${request.value.id}/items/${item.id}`, {
      method: 'PUT',
      body: { stock_status: stockStatus },
    });
    const next = resp?.data || resp;
    const idx = request.value.items.findIndex(x => x.id === item.id);
    if (idx >= 0 && next) request.value.items[idx] = { ...request.value.items[idx], ...next };
  } catch (e) {
    console.error(e);
    $toast.error(e?.data?.message || 'No se pudo actualizar');
  } finally {
    itemBusy.value[item.id] = false;
  }
};

const openAddItemModal = () => {
  addItemForm.value = { product_name: '', product_url: '', price: '', quantity: 1, notes: '' };
  addItemError.value = null;
  showAddItemModal.value = true;
};

const closeAddItemModal = () => {
  if (addItemSaving.value) return;
  showAddItemModal.value = false;
};

const submitAddItem = async () => {
  if (addItemSaving.value) return;
  addItemSaving.value = true;
  addItemError.value = null;
  try {
    const resp = await $customFetch(`${apiNs.value}/purchase-requests/${request.value.id}/items`, {
      method: 'POST',
      body: {
        product_name: addItemForm.value.product_name,
        product_url:  addItemForm.value.product_url,
        price:        Number(addItemForm.value.price) || 0,
        quantity:     parseInt(addItemForm.value.quantity, 10) || 1,
        notes:        addItemForm.value.notes || null,
      },
    });
    const created = resp?.data || resp;
    if (created && !request.value.items.some(x => x.id === created.id)) {
      request.value.items.push(created);
    }
    showAddItemModal.value = false;
    $toast.success('Artículo agregado');
  } catch (e) {
    console.error(e);
    addItemError.value = e?.data?.message || 'No se pudo agregar el artículo';
  } finally {
    addItemSaving.value = false;
  }
};

const onDeleteItem = async (item) => {
  if (! confirm(`¿Eliminar "${item.product_name}"?`)) return;
  if (itemBusy.value[item.id]) return;
  itemBusy.value[item.id] = true;
  try {
    await $customFetch(`${apiNs.value}/purchase-requests/${request.value.id}/items/${item.id}`, {
      method: 'DELETE',
    });
    request.value.items = request.value.items.filter(x => x.id !== item.id);
    clearItemDraft(item.id);
  } catch (e) {
    console.error(e);
    $toast.error(e?.data?.message || 'No se pudo eliminar el artículo');
  } finally {
    itemBusy.value[item.id] = false;
  }
};

const onSendQuote = async () => {
  if (sendingQuote.value || ! canSendQuote.value) return;
  // Force any in-flight blur to save before sending
  if (Object.keys(itemDrafts.value).length > 0) {
    const pending = (request.value?.items || []).filter(i => itemDrafts.value[i.id]);
    await Promise.all(pending.map(i => commitItemEdit(i)));
  }
  sendingQuote.value = true;
  try {
    const resp = await $customFetch(`${apiNs.value}/purchase-requests/${request.value.id}/quote`, {
      method: 'POST',
      body: {
        store_costs: cleanStoreCosts(),
        processing_fee_percent: Number(quoteForm.value.processing_fee_percent) || 0,
        admin_notes: quoteForm.value.admin_notes || null,
      },
    });
    request.value = resp?.data || resp;
    $toast.success('Cotización enviada al cliente');
  } catch (e) {
    console.error(e);
    $toast.error(e?.data?.message || 'No se pudo enviar la cotización');
  } finally {
    sendingQuote.value = false;
  }
};

const copyPaymentLink = async () => {
  const link = request.value?.payment_link;
  if (!link) return;
  try {
    await navigator.clipboard.writeText(link);
    $toast.success(t.value.copied);
  } catch (e) {
    $toast.error('No se pudo copiar');
  }
};

const handleMarkPurchased = async () => {
  processing.value = true;
  try {
    const response = await $customFetch(`${apiNs.value}/purchase-requests/${request.value.id}/mark-purchased`, {
      method: 'POST'
    });
    await fetchRequest();
    showPurchaseModal.value = false;
    $toast.success('Marked as purchased successfully');
  } catch (e) {
    console.error(e);
    $toast.error('Error marking as purchased');
  } finally {
    processing.value = false;
  }
};

const handleReject = async () => {
    try {
        await $customFetch(`${apiNs.value}/purchase-requests/${request.value.id}/reject`, {
            method: 'PUT',
            body: { reason: rejectReason.value }
        });
        showRejectModal.value = false;
        await fetchRequest();
        $toast.success('Request rejected');
    } catch (e) {
        $toast.error('Error rejecting request');
    }
};

const confirmDelete = async () => {
    try {
        await $customFetch(`${apiNs.value}/purchase-requests/${request.value.id}`, {
            method: 'DELETE'
        });
        $toast.success('Request deleted');
        showDeleteModal.value = false;
        router.push('/app/admin/purchase-requests');
    } catch (e) {
        console.error(e);
        $toast.error('Failed to delete request');
    }
};

onMounted(() => {
  fetchRequest();
});
</script>