<!-- pages/app/orders/[id]/index.vue -->
<template>
  <section class="min-h-screen bg-gray-50">
    <!-- Header -->
    <UserOrderHeader
      :order="order"
      :loading="loading"
      @delete="showDeleteOrderModal = true"
    />

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center min-h-[60vh]">
      <div class="text-center">
        <div
          class="w-12 h-12 border-3 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto"
        ></div>
        <p class="mt-4 text-sm text-gray-600">{{ t.loadingOrder }}</p>
      </div>
    </div>

    <!-- Main Content -->
    <div
      v-else-if="order"
      class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
    >
      <!-- Success/Confetti Banner -->
      <SuccessBanner
        :show="showSuccessBanner"
        :order="order"
        :trigger="bannerTrigger"
        @dismiss="dismissSuccessBanner"
      />

      <!-- Dynamic Status Banner (Handles Deposit & Final Payment CTAs) -->
      <UserOrderStatusBanner
        :order="order"
        @reopen="showReopenOrderModal = true"
        @complete="showCompleteOrderModal = true"
      />

      <!-- Arrival Proof Image - Show when all packages arrived -->
      <div
        v-if="order.arrival_image_url"
        class="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      >
        <div class="px-5 py-4 border-b border-gray-100">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <div>
              <h2 class="text-lg font-bold text-gray-900">{{ t.packagesArrived }}</h2>
              <p class="text-sm text-gray-500">{{ t.packagesArrivedDesc }}</p>
            </div>
          </div>
        </div>
        <div class="p-4">
          <div
            class="rounded-xl overflow-hidden border border-gray-200 cursor-pointer"
            @click="showArrivalImageModal = true"
          >
            <img
              :src="order.arrival_image_url"
              :alt="t.packagesArrived"
              class="w-full max-h-64 object-cover hover:opacity-95 transition-opacity"
            >
          </div>
        </div>
      </div>

      <!-- Arrival Photos Gallery (label + contents from warehouse) -->
      <div
        v-if="order.arrival_images?.length > 0"
        class="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      >
        <div class="px-5 py-4 border-b border-gray-100">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>
            <div>
              <h2 class="text-lg font-bold text-gray-900">{{ t.packagesArrived }}</h2>
              <p class="text-sm text-gray-500">{{ order.arrival_images.length }} photo{{ order.arrival_images.length !== 1 ? 's' : '' }} from the warehouse</p>
            </div>
          </div>
        </div>
        <div class="p-4">
          <!-- Label photos -->
          <div v-if="order.arrival_images.filter(i => i.type === 'label').length > 0" class="mb-4">
            <p class="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Box Labels</p>
            <div class="flex flex-wrap gap-3">
              <a
                v-for="img in order.arrival_images.filter(i => i.type === 'label')"
                :key="img.id"
                :href="img.url"
                target="_blank"
                class="block h-24 w-24 rounded-xl overflow-hidden border border-gray-200 hover:opacity-90 transition-opacity"
              >
                <img :src="img.url" alt="Label photo" class="h-full w-full object-cover" />
              </a>
            </div>
          </div>
          <!-- Contents photo -->
          <div v-if="order.arrival_images.filter(i => i.type === 'contents').length > 0">
            <p class="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Contents</p>
            <div class="flex flex-wrap gap-3">
              <a
                v-for="img in order.arrival_images.filter(i => i.type === 'contents')"
                :key="img.id"
                :href="img.url"
                target="_blank"
                class="block h-24 w-24 rounded-xl overflow-hidden border border-gray-200 hover:opacity-90 transition-opacity"
              >
                <img :src="img.url" alt="Contents photo" class="h-full w-full object-cover" />
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Grid Layout -->
      <div class="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

        <!-- Left Column (2/3) -->
        <div class="lg:col-span-2 space-y-6">

          <!-- Shipping Boxes Section - Shows boxes with tracking & GIA -->
          <div
            v-if="hasBoxes && order.order_type !== 'crossing'"
            class="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm"
          >
            <div class="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
              <div class="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                </svg>
              </div>
              <div>
                <h2 class="text-lg font-bold text-gray-900">{{ t.shippingBoxes }}</h2>
                <p class="text-sm text-gray-500">{{ order.boxes.length }} {{ order.boxes.length === 1 ? 'caja' : 'cajas' }}</p>
              </div>
            </div>
            <div class="divide-y divide-gray-100">
              <div v-for="(box, index) in order.boxes" :key="box.id || index" class="p-5">
                <!-- Box Header -->
                <div class="flex items-start justify-between gap-3 mb-3">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                      </svg>
                    </div>
                    <div>
                      <p class="font-semibold text-gray-900">{{ t.boxLabel }} {{ index + 1 }}: {{ box.box_name || box.box_size }}</p>
                      <div class="flex flex-wrap gap-2 mt-1">
                        <span v-if="box.length && box.width && box.height" class="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          {{ box.length }} × {{ box.width }} × {{ box.height }} cm
                        </span>
                        <span v-if="box.weight" class="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          {{ box.weight }} kg
                        </span>
                      </div>
                    </div>
                  </div>
                  <span class="text-lg font-bold text-gray-900">${{ formatPrice(box.box_price) }}</span>
                </div>

                <!-- Tracking & GIA Row -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                  <!-- Guia / Tracking -->
                  <div>
                    <p class="text-xs font-medium text-gray-500 mb-1.5">{{ t.trackingNumber }}</p>
                    <div v-if="box.guia_number">
                      <NuxtLink
                        :to="`/track?tracking_number=${box.guia_number}`"
                        target="_blank"
                        class="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"/>
                        </svg>
                        {{ t.trackPackage }}
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                        </svg>
                      </NuxtLink>
                    </div>
                    <span v-else class="text-xs text-gray-400 italic">{{ t.pendingTracking }}</span>
                  </div>

                  <!-- GIA Document -->
                  <div>
                    <p class="text-xs font-medium text-gray-500 mb-1.5">{{ t.giaDocument }}</p>
                    <a
                      v-if="box.gia_url || box.gia_full_url"
                      :href="box.gia_url || box.gia_full_url"
                      target="_blank"
                      class="inline-flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 text-sm font-medium rounded-lg border border-green-200 hover:bg-green-100 transition-colors"
                    >
                      <svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                      </svg>
                      {{ t.downloadGIA }}
                    </a>
                    <span v-else class="text-xs text-gray-400 italic">{{ t.pendingGIA }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Address - Only for shipping orders -->
          <UserOrderAddress v-if="order.order_type !== 'crossing'" :order="order" />

          <!-- Pickup Location - Only for crossing orders -->
          <div
            v-if="order.order_type === 'crossing'"
            class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
          >
            <div class="px-5 py-4 border-b border-gray-100">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"/>
                  </svg>
                </div>
                <div>
                  <h2 class="text-lg font-bold text-gray-900">{{ t.pickupLocation }}</h2>
                  <p class="text-sm text-gray-500">{{ t.pickupLocationDesc }}</p>
                </div>
              </div>
            </div>
            <div class="p-5">
              <div class="flex items-start gap-4 mb-4">
                <div class="flex-1">
                  <h3 class="font-semibold text-gray-900">{{ t.warehouseName }}</h3>
                  <p class="text-sm text-gray-600 mt-1">{{ t.warehouseAddress }}</p>
                  <p class="text-sm text-gray-500">Tijuana, Baja California, México</p>
                </div>
              </div>
              <a
                href="https://maps.app.goo.gl/4SsEVjy2D4noFM9n8"
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center justify-center gap-2 w-full px-5 py-3 bg-amber-600 text-white font-semibold rounded-xl hover:bg-amber-700 transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                </svg>
                {{ t.getDirections }}
              </a>
              <p class="text-xs text-gray-500 text-center mt-3">{{ t.pickupHours }}</p>
            </div>
          </div>

          <!-- Items List -->
          <UserOrderItemsList :order="order" />

          <!-- Progress Timeline -->
          <OrderProgressTimeline :order="order" />
        </div>

        <!-- Right Column (1/3) - Summary & Payment -->
        <div class="space-y-6">

          <!-- Order Summary Card -->
          <div class="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div class="px-4 py-3 border-b border-gray-100 bg-gray-50">
              <h3 class="font-semibold text-gray-900">{{ t.orderSummary }}</h3>
            </div>
            <div class="p-4 space-y-3">
              <!-- Order Number -->
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-500">{{ t.orderNumber }}</span>
                <span class="text-sm font-bold text-gray-900">#{{ order.order_number }}</span>
              </div>
              <!-- Order Type -->
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-500">{{ t.orderType }}</span>
                <span
                  :class="[
                    'px-2 py-0.5 rounded text-xs font-medium',
                    isCrossing ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                  ]"
                >
                  {{ isCrossing ? t.crossingOnly : t.homeDelivery }}
                </span>
              </div>
              <!-- Total Weight -->
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-500">{{ t.totalWeight }}</span>
                <span class="text-sm font-medium text-gray-900">{{ order.total_box_weight || 0 }} kg</span>
              </div>
              <!-- Items Count -->
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-500">{{ t.itemsCount }}</span>
                <span class="text-sm font-medium text-gray-900">{{ order.items?.length || 0 }}</span>
              </div>
              <!-- Created Date -->
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-500">{{ t.createdDate }}</span>
                <span class="text-sm text-gray-700">{{ formatDate(order.created_at) }}</span>
              </div>
            </div>
          </div>

          <!-- Payment Summary Card - Only show when there's a box total -->
          <div v-if="totalBoxPrice > 0" class="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div class="px-4 py-3 border-b border-gray-100 bg-gray-50">
              <h3 class="font-semibold text-gray-900">{{ t.paymentSummary }}</h3>
            </div>
            <div class="p-4 space-y-3">
              <!-- IVA -->
              <div v-if="order.iva_amount" class="flex justify-between items-center">
                <span class="text-sm text-gray-500">IVA</span>
                <span class="text-sm font-medium text-gray-900">${{ formatPrice(order.iva_amount) }} {{ currency }}</span>
              </div>

              <!-- Shipping Cost (if quoted) -->
              <div v-if="order.shipping_cost" class="flex justify-between items-center">
                <span class="text-sm text-gray-500">{{ t.shippingCost }}</span>
                <span class="text-sm font-medium text-gray-900">${{ formatPrice(order.shipping_cost) }} {{ currency }}</span>
              </div>

              <hr class="border-gray-100">

              <!-- Grand Total -->
              <div class="flex justify-between items-center">
                <span class="text-sm font-semibold text-gray-700">{{ t.total }}</span>
                <span class="text-lg font-bold text-gray-900">${{ formatPrice(grandTotal) }} {{ currency }}</span>
              </div>

              <!-- Amount Paid -->
              <div v-if="amountPaid > 0" class="flex justify-between items-center">
                <span class="text-sm text-green-600">{{ t.paid }}</span>
                <span class="text-sm font-medium text-green-600">-${{ formatPrice(amountPaid) }} {{ currency }}</span>
              </div>

              <!-- Amount Due -->
              <div v-if="amountDue > 0" class="flex justify-between items-center pt-2 border-t border-gray-100">
                <span class="text-sm font-bold text-orange-600">{{ t.amountDue }}</span>
                <span class="text-lg font-bold text-orange-600">${{ formatPrice(amountDue) }} {{ currency }}</span>
              </div>

              <!-- Fully Paid Badge -->
              <div v-else-if="amountPaid > 0" class="flex items-center justify-center gap-2 py-2 bg-green-50 rounded-lg">
                <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span class="text-sm font-semibold text-green-700">{{ t.fullyPaid }}</span>
              </div>
            </div>

            <!-- Payment CTA -->
            <div v-if="paymentLink && amountDue > 0" class="p-4 bg-orange-50 border-t border-orange-100">
              <a
                :href="paymentLink"
                target="_blank"
                class="flex items-center justify-center gap-2 w-full px-4 py-3 bg-orange-600 text-white font-semibold rounded-xl hover:bg-orange-700 transition-colors shadow-sm"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                </svg>
                {{ t.payNow }}
              </a>
            </div>
          </div>

          <!-- Need Help Card -->
          <div class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 p-4">
            <div class="flex items-start gap-3">
              <div class="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div>
                <h4 class="text-sm font-semibold text-gray-900">{{ t.needHelp }}</h4>
                <p class="text-xs text-gray-600 mt-1">{{ t.needHelpDesc }}</p>
                <a
                  href="https://wa.me/5216641234567"
                  target="_blank"
                  class="inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 mt-2"
                >
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  {{ t.contactUs }}
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>

    <!-- Modals Wrapper -->
    <UserOrderModals
      :order="order"
      :show-complete="showCompleteOrderModal"
      :show-reopen="showReopenOrderModal"
      :show-delete="showDeleteOrderModal"
      @close-complete="showCompleteOrderModal = false"
      @close-reopen="showReopenOrderModal = false"
      @close-delete="showDeleteOrderModal = false"
      @refresh="handleRefresh"
      @deleted="handleDeleted"
    />

    <!-- Arrival Image Modal -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="showArrivalImageModal && order?.arrival_image_url"
          class="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center"
          @click.self="showArrivalImageModal = false"
        >
          <button
            @click="showArrivalImageModal = false"
            class="absolute top-4 right-4 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
          <div class="w-full h-full p-4 sm:p-8 flex items-center justify-center overflow-auto">
            <img
              :src="order.arrival_image_url"
              alt="Arrival proof"
              class="max-w-full max-h-full object-contain"
            >
          </div>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import UserOrderHeader from "~/components/user/UserOrderHeader.vue";
import UserOrderStatusBanner from "~/components/user/UserOrderStatusBanner.vue";
import UserOrderAddress from "~/components/user/UserOrderAddress.vue";
import UserOrderItemsList from "~/components/user/UserOrderItemsList.vue";
import UserOrderModals from "~/components/user/UserOrderModals.vue";
import SuccessBanner from "~/components/SuccessBanner.vue";
import OrderProgressTimeline from "~/components/OrderProgressTimeline.vue";

definePageMeta({
  layout: "app",
  middleware: ["auth", "customer", "complete-profile"],
});

const { $customFetch, $toast } = useNuxtApp();
const route = useRoute();
const router = useRouter();
const { t: createTranslations, currentLanguage } = useLanguage();

const order = ref(null);
const loading = ref(true);
const showArrivalImageModal = ref(false);

// Modal States
const showCompleteOrderModal = ref(false);
const showReopenOrderModal = ref(false);
const showDeleteOrderModal = ref(false);

// Banner States
const showSuccessBanner = ref(false);
const bannerTrigger = ref("auto");

// Computed Properties
const isCrossing = computed(() => order.value?.order_type === 'crossing');
const hasBoxes = computed(() => order.value?.boxes && order.value.boxes.length > 0);
const currency = computed(() => (order.value?.currency || 'mxn').toUpperCase());

const totalBoxPrice = computed(() => {
  if (!order.value) return 0;
  if (hasBoxes.value) {
    return order.value.boxes.reduce((sum, box) => sum + parseFloat(box.box_price || 0), 0);
  }
  return parseFloat(order.value.box_price) || 0;
});

const grandTotal = computed(() => {
  let total = totalBoxPrice.value;
  if (order.value?.iva_amount) total += parseFloat(order.value.iva_amount);
  if (order.value?.shipping_cost) total += parseFloat(order.value.shipping_cost);
  return total;
});

const amountPaid = computed(() => {
  if (!order.value) return 0;
  let paid = 0;
  if (order.value.amount_paid) paid = parseFloat(order.value.amount_paid);
  else {
    if (order.value.deposit_paid_at && order.value.deposit_amount) {
      paid += parseFloat(order.value.deposit_amount);
    }
    if (order.value.consolidation_paid_at && order.value.quoted_amount) {
      paid += parseFloat(order.value.quoted_amount);
    }
  }
  return paid;
});

const amountDue = computed(() => {
  const due = grandTotal.value - amountPaid.value;
  return due > 0 ? due : 0;
});

const paymentLink = computed(() => {
  if (!order.value) return null;
  // Check for any available payment link (priority order)
  if (order.value.consolidation_payment_link) return order.value.consolidation_payment_link;
  if (order.value.deposit_payment_link) return order.value.deposit_payment_link;
  if (order.value.payment_link) return order.value.payment_link;
  return null;
});

// Translations
const translations = {
  loadingOrder: { es: "Cargando orden...", en: "Loading order..." },
  // Arrival Proof
  packagesArrived: { es: "Tus Paquetes Han Llegado", en: "Your Packages Have Arrived" },
  packagesArrivedDesc: { es: "Foto de tus artículos en nuestra bodega", en: "Photo of your items at our warehouse" },
  // Order Type
  crossingOnly: { es: "Solo Cruce", en: "Crossing Only" },
  homeDelivery: { es: "Envío a Domicilio", en: "Home Delivery" },
  // Order Summary
  orderSummary: { es: "Resumen de Orden", en: "Order Summary" },
  orderNumber: { es: "Número de Orden", en: "Order Number" },
  orderType: { es: "Tipo de Orden", en: "Order Type" },
  totalWeight: { es: "Peso Cajas", en: "Box Weight" },
  itemsCount: { es: "Artículos", en: "Items" },
  createdDate: { es: "Fecha de Creación", en: "Created Date" },
  // Boxes
  boxes: { es: "Cajas", en: "Boxes" },
  shippingBoxes: { es: "Cajas de Envío", en: "Shipping Boxes" },
  boxLabel: { es: "Caja", en: "Box" },
  trackingNumber: { es: "Número de Rastreo", en: "Tracking Number" },
  trackPackage: { es: "Rastrear Paquete", en: "Track Package" },
  pendingTracking: { es: "Pendiente", en: "Pending" },
  giaDocument: { es: "Documento GIA", en: "GIA Document" },
  downloadGIA: { es: "Descargar PDF", en: "Download PDF" },
  pendingGIA: { es: "Pendiente", en: "Pending" },
  // Payment
  paymentSummary: { es: "Resumen de Pago", en: "Payment Summary" },
  shippingCost: { es: "Costo de Envío", en: "Shipping Cost" },
  total: { es: "Total", en: "Total" },
  paid: { es: "Pagado", en: "Paid" },
  amountDue: { es: "Saldo Pendiente", en: "Amount Due" },
  fullyPaid: { es: "Pagado Completamente", en: "Fully Paid" },
  payNow: { es: "Pagar Ahora", en: "Pay Now" },
  // Pickup Location
  pickupLocation: { es: "Ubicación de Recolección", en: "Pickup Location" },
  pickupLocationDesc: { es: "Recoge tus paquetes en nuestra bodega", en: "Pick up your packages at our warehouse" },
  warehouseName: { es: "Colectivo Las Ferias La Cacho", en: "Colectivo Las Ferias La Cacho" },
  warehouseAddress: { es: "Blvd. Insurgentes #18512, Río Tijuana 3ra Etapa", en: "Blvd. Insurgentes #18512, Río Tijuana 3ra Etapa" },
  getDirections: { es: "Obtener Direcciones", en: "Get Directions" },
  pickupHours: { es: "Lun-Vie: 9AM-6PM | Sáb: 9AM-2PM", en: "Mon-Fri: 9AM-6PM | Sat: 9AM-2PM" },
  // Help
  needHelp: { es: "¿Necesitas Ayuda?", en: "Need Help?" },
  needHelpDesc: { es: "Estamos aquí para ayudarte con cualquier duda.", en: "We're here to help with any questions." },
  contactUs: { es: "Contáctanos", en: "Contact Us" },
};
const t = createTranslations(translations);

// Helper Functions
const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const locale = currentLanguage?.value === "es" ? "es-MX" : "en-US";
  return d.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatPrice = (price) => {
  if (!price) return "0.00";
  return parseFloat(price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Data Fetching
const fetchOrder = async () => {
  loading.value = true;
  try {
    const response = await $customFetch(`/orders/${route.params.id}`);
    order.value = response.data;
    checkBanners();
  } catch (error) {
    console.error("Error fetching order:", error);
    $toast.error("Error loading order");
  } finally {
    loading.value = false;
  }
};

const checkBanners = () => {
  if (!order.value) return;

  const confettiKey = `order-${order.value.id}-confetti-shown`;
  const dismissedKey = `order-${order.value.id}-${order.value.status}-dismissed`;

  if (
    route.query.completed === "true" &&
    order.value.status === "awaiting_packages"
  ) {
    if (!localStorage.getItem(confettiKey)) {
      bannerTrigger.value = "just_completed";
      showSuccessBanner.value = true;
      localStorage.setItem(confettiKey, "true");
      router.replace({ path: route.path, query: {} });
    }
  } else if (
    order.value.status === "awaiting_packages" &&
    !localStorage.getItem(dismissedKey)
  ) {
    bannerTrigger.value = "auto";
    showSuccessBanner.value = true;
  }
};

const dismissSuccessBanner = () => {
  showSuccessBanner.value = false;
  if (order.value) {
    localStorage.setItem(
      `order-${order.value.id}-${order.value.status}-dismissed`,
      "true"
    );
  }
};

const handleRefresh = async (triggerConfetti = false) => {
  if (triggerConfetti) {
    bannerTrigger.value = "just_completed";
    showSuccessBanner.value = true;
  }
  await fetchOrder();
};

const handleDeleted = () => {
  router.push("/app/orders");
};

onMounted(() => {
  fetchOrder();
});
</script>
