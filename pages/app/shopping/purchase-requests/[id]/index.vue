<template>
  <section class="min-h-screen bg-gray-50 pb-20">
    <!-- Header -->
    <div class="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-30">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 py-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <NuxtLink to="/app/shopping/purchase-requests" class="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors">
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
            <!-- Pending Review -> Create Quote -->
            <button 
              v-if="request.status === 'pending_review'"
              @click="showQuoteModal = true"
              class="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
              {{ t.createQuote }}
            </button>

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

            <!-- Quoted + Manual Deposit -> Mark as Paid -->
            <button 
              v-if="request.status === 'quoted' && request.payment_method === 'manual_deposit'"
              @click="showMarkPaidModal = true"
              :disabled="processing"
              class="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {{ t.markAsPaid }}
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
                                    :to="`/app/shopping/purchase-requests/${request.id}/edit`"
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

      <!-- Manual Deposit Awaiting Payment Banner -->
      <div v-if="request.status === 'quoted' && request.payment_method === 'manual_deposit'" class="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-start gap-4">
        <div class="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border border-purple-100">
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Nubank_logo_2021.svg/2560px-Nubank_logo_2021.svg.png" 
            alt="NU Bank" 
            class="w-8 h-8 object-contain"
          >
        </div>
        <div class="flex-1">
          <p class="font-semibold text-purple-900">{{ t.awaitingBankTransfer }}</p>
          <p class="text-sm text-purple-700 mt-1">{{ t.awaitingBankTransferDesc }}</p>
          <button 
            @click="showMarkPaidModal = true"
            class="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {{ t.confirmPaymentReceived }}
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Items List -->
        <div class="lg:col-span-2 space-y-6">
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 class="font-semibold text-gray-900">{{ t.items }} ({{ request.items?.length || 0 }})</h3>
              <span class="text-sm text-gray-500">{{ t.estMerchandise }}: {{ formatCurrency(estimatedTotal) }}</span>
            </div>
            <div class="divide-y divide-gray-100">
              <div v-for="(item, index) in request.items" :key="item.id" class="p-6 hover:bg-gray-50 transition-colors">
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
                    <div class="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <svg class="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                    </div>
                  </a>
                  
                  <!-- Fallback Icon -->
                  <div v-else class="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 font-bold text-sm border border-gray-200">
                    {{ index + 1 }}
                  </div>

                  <div class="flex-1 min-w-0">
                    <h4 class="font-medium text-gray-900 text-lg leading-snug">{{ item.product_name }}</h4>
                    
                    <!-- Link -->
                    <a :href="item.product_url" target="_blank" class="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-1 mb-3 w-fit">
                      {{ truncateUrl(item.product_url) }}
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                    </a>
                    
                    <!-- Details Grid -->
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-3">
                      <div class="bg-gray-50 p-2 rounded border border-gray-100">
                        <span class="text-xs text-gray-500 block uppercase">{{ t.qty }}</span>
                        <span class="font-semibold">{{ item.quantity }}</span>
                      </div>
                      <div class="bg-gray-50 p-2 rounded border border-gray-100">
                        <span class="text-xs text-gray-500 block uppercase">{{ t.price }}</span>
                        <span class="font-semibold">{{ formatCurrency(item.price) }}</span>
                      </div>
                      <div class="bg-gray-50 p-2 rounded border border-gray-100 col-span-2">
                        <span class="text-xs text-gray-500 block uppercase">{{ t.subtotal }}</span>
                        <span class="font-semibold">{{ formatCurrency(item.price * item.quantity) }}</span>
                      </div>
                    </div>

                    <!-- Options -->
                    <div v-if="item.options && Object.keys(item.options).length > 0" class="flex flex-wrap gap-2 mb-2">
                        <span v-for="(val, key) in item.options" :key="key" class="text-xs bg-primary-50 text-primary-700 border border-primary-100 px-2 py-1 rounded">
                            <strong>{{ key }}:</strong> {{ val }}
                        </span>
                    </div>

                    <!-- Notes -->
                    <div v-if="item.notes" class="text-sm bg-yellow-50 text-yellow-800 p-3 rounded border border-yellow-100">
                      <span class="font-bold text-xs uppercase block mb-1 text-yellow-600">{{ t.customerNotes }}</span>
                      {{ item.notes }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar: Financials -->
        <div class="lg:col-span-1 space-y-6">
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div class="flex justify-between items-center mb-4 border-b pb-2">
              <h3 class="font-semibold text-gray-900">{{ t.financials }}</h3>
              <span class="px-2 py-1 rounded text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200">
                {{ currencyLabel }}
              </span>
            </div>
            
            <!-- If pending, showing estimate -->
            <div v-if="request.status === 'pending_review'" class="text-center py-4">
              <div class="bg-gray-100 rounded-lg p-3 mb-3">
                <span class="text-gray-500 text-sm block">{{ t.estMerchandise }}</span>
                <span class="text-xl font-bold text-gray-900">{{ formatCurrency(estimatedTotal) }}</span>
              </div>
              <button 
                @click="showQuoteModal = true"
                class="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                {{ t.calculateQuote }}
              </button>
            </div>

            <!-- If quoted/paid/purchased, show breakdown -->
            <div v-else class="space-y-3 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">{{ t.yourCost }}</span>
                <span class="font-medium">{{ formatCurrency(request.items_total) }}</span>
              </div>
              <div class="flex justify-between text-green-600">
                <span>{{ t.yourMargin }}</span>
                <span class="font-medium">{{ formatCurrency(request.processing_fee) }} ({{ marginPercent }}%)</span>
              </div>
              <div class="flex justify-between pt-3 border-t border-gray-200 text-lg font-bold text-gray-900">
                <span>{{ t.customerPays }}</span>
                <span>{{ formatCurrency(request.total_amount) }}</span>
              </div>
              
              <!-- Payment Method Badge -->
              <div class="mt-4 pt-4 border-t border-gray-100">
                <p class="text-xs text-gray-500 mb-2">{{ t.paymentMethod }}</p>
                <div v-if="request.payment_method === 'stripe'" class="flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-3 py-2 rounded-lg">
                  <svg class="w-5 h-5 text-indigo-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
                  </svg>
                  <span class="font-medium text-indigo-700">Stripe Invoice</span>
                </div>
                <div v-else class="flex items-center gap-2 bg-purple-50 border border-purple-100 px-3 py-2 rounded-lg">
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Nubank_logo_2021.svg/2560px-Nubank_logo_2021.svg.png" 
                    alt="NU" 
                    class="w-5 h-5 object-contain"
                  >
                  <span class="font-medium text-purple-700">NU Bank Transfer</span>
                </div>
              </div>

              <!-- Payment Info -->
              <div v-if="request.payment_link" class="mt-4 pt-4 border-t border-gray-100">
                <p class="text-xs text-gray-500 mb-1">{{ t.stripeLink }}</p>
                <a :href="request.payment_link" target="_blank" class="text-blue-600 hover:underline truncate block text-xs">
                  {{ request.payment_link }}
                </a>
              </div>
            </div>
          </div>

          <!-- Customer Info -->
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
  
      <!-- Quote Modal -->
      <QuoteModal 
        v-if="showQuoteModal"
        :show="showQuoteModal"
        :estimated-total="estimatedTotal"
        @close="showQuoteModal = false"
        @confirm="handleCreateQuote"
      />
  
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

      <!-- Mark as Paid Modal (Manual Deposit) -->
      <div v-if="showMarkPaidModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div class="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
              <div class="flex items-center gap-3 mb-4">
                  <div class="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                  </div>
                  <div>
                      <h3 class="text-lg font-bold text-gray-900">{{ t.confirmPaymentTitle }}</h3>
                      <p class="text-sm text-gray-500">{{ t.confirmPaymentSubtitle }}</p>
                  </div>
              </div>
              
              <div class="bg-purple-50 rounded-lg p-4 mb-4 flex items-start gap-3">
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Nubank_logo_2021.svg/2560px-Nubank_logo_2021.svg.png" 
                    alt="NU" 
                    class="w-8 h-8 object-contain flex-shrink-0"
                  >
                  <div>
                      <p class="text-sm text-purple-800 font-medium">{{ t.confirmPaymentDesc }}</p>
                      <p class="text-xs text-purple-600 mt-1">{{ t.confirmPaymentAmount }}: <strong>{{ formatCurrency(request?.total_amount) }}</strong></p>
                  </div>
              </div>

              <div class="flex justify-end gap-3">
                  <button 
                      @click="showMarkPaidModal = false" 
                      :disabled="processing"
                      class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                  >
                      {{ t.cancel }}
                  </button>
                  <button 
                      @click="handleMarkPaid" 
                      :disabled="processing"
                      class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                      <svg v-if="!processing" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <svg v-else class="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {{ processing ? t.processing : t.yesPaymentReceived }}
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
import { ref, computed, onMounted } from 'vue';
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue';
import QuoteModal from '~/components/admin/QuoteModal.vue';

definePageMeta({
  layout: 'shopping',
  middleware: ['auth', 'shopping']
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
  financials: { es: 'Finanzas', en: 'Financials' },
  calculateQuote: { es: 'Calcular Cotización', en: 'Calculate Quote' },
  yourCost: { es: 'Costo', en: 'Cost' },
  yourMargin: { es: 'Ganancia', en: 'Margin' },
  customerPays: { es: 'Cliente Paga', en: 'Customer Pays' },
  paymentMethod: { es: 'Método de Pago', en: 'Payment Method' },
  stripeLink: { es: 'Enlace de Pago Stripe', en: 'Stripe Payment Link' },
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
  confirmPaymentAmount: { es: 'Monto esperado', en: 'Expected amount' },
  yesPaymentReceived: { es: 'Sí, Pago Recibido', en: 'Yes, Payment Received' },
  deleteConfirmTitle: { es: 'Eliminar Solicitud', en: 'Delete Request' },
  deleteConfirmSubtitle: { es: 'Esta acción no se puede deshacer', en: 'This action cannot be undone' },
  deleteConfirmDesc: { es: '¿Estás seguro de que deseas eliminar esta solicitud de compra? Toda la información asociada se perderá permanentemente.', en: 'Are you sure you want to delete this purchase request? All associated information will be permanently lost.' },
  confirmDelete: { es: 'Sí, Eliminar', en: 'Yes, Delete' },
  viewImage: { es: 'Ver Imagen', en: 'View Image' },
};

const t = createTranslations(translations);
const request = ref(null);
const loading = ref(true);
const processing = ref(false);
const showQuoteModal = ref(false);
const showRejectModal = ref(false);
const showPurchaseModal = ref(false);
const showMarkPaidModal = ref(false);
const showDeleteModal = ref(false);
const rejectReason = ref('');

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
    const response = await $customFetch(`/shopping/purchase-requests/${route.params.id}`);
    request.value = response.data || response; 
  } catch (e) {
    console.error(e);
    $toast.error('Error loading request');
  } finally {
    loading.value = false;
  }
};

const estimatedTotal = computed(() => {
  if(!request.value || !request.value.items) return 0;
  return request.value.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2);
});

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

const handleCreateQuote = async (quoteData) => {
  try {
    const response = await $customFetch(`/shopping/purchase-requests/${request.value.id}/quote`, {
      method: 'POST',
      body: quoteData
    });
    
    request.value = response.data || response;
    
    showQuoteModal.value = false;
    
    if (quoteData.payment_method === 'manual_deposit') {
      $toast.success('Quote created - Bank transfer instructions sent');
    } else {
      $toast.success('Quote created and Stripe invoice sent');
    }
  } catch (e) {
    console.error(e);
    $toast.error('Error creating quote');
  }
};

const handleMarkPurchased = async () => {
  processing.value = true;
  try {
    const response = await $customFetch(`/shopping/purchase-requests/${request.value.id}/mark-purchased`, {
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

const handleMarkPaid = async () => {
  processing.value = true;
  try {
    await $customFetch(`/shopping/purchase-requests/${request.value.id}`, {
      method: 'PUT',
      body: { 
        status: 'paid',
        paid_at: new Date().toISOString()
      }
    });
    await fetchRequest();
    showMarkPaidModal.value = false;
    $toast.success('Payment confirmed successfully');
  } catch (e) {
    console.error(e);
    $toast.error('Error confirming payment');
  } finally {
    processing.value = false;
  }
};

const handleReject = async () => {
    try {
        await $customFetch(`/shopping/purchase-requests/${request.value.id}/reject`, {
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
        await $customFetch(`/shopping/purchase-requests/${request.value.id}`, {
            method: 'DELETE'
        });
        $toast.success('Request deleted');
        showDeleteModal.value = false;
        router.push('/app/shopping/purchase-requests');
    } catch (e) {
        console.error(e);
        $toast.error('Failed to delete request');
    }
};

onMounted(() => {
  fetchRequest();
});
</script>