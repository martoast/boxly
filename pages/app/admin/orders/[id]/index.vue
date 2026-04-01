<template>
  <section class="min-h-screen bg-gray-50">
    <!-- Header Component -->
    <AdminOrderHeader
      :order="order"
      :show-menu="showActionsMenu"
      :next-action="nextAction"
      @toggle-menu="showActionsMenu = !showActionsMenu"
      @close-menu="showActionsMenu = false"
      @delete="openDeleteModal"
      @view-message="showJesusMessageModal = true"
      @next-action="handleNextAction"
    />

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center min-h-[60vh]">
      <div class="text-center">
        <div class="w-12 h-12 border-3 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p class="mt-4 text-sm text-gray-600">{{ t.loading }}</p>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else-if="order" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

      <!-- Arrival Image Upload Section -->
      <div
        v-if="order.status === 'awaiting_packages' && allItemsArrived && !order.arrival_image_url"
        class="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 p-5 shadow-sm"
      >
        <div class="flex flex-col sm:flex-row sm:items-center gap-4">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-2">
              <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              </div>
              <div>
                <h3 class="font-semibold text-green-800">{{ t.allItemsArrivedTitle }}</h3>
                <p class="text-sm text-green-600">{{ t.uploadArrivalImageDesc }}</p>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <input
              ref="arrivalImageInput"
              type="file"
              accept="image/*"
              class="hidden"
              @change="handleArrivalImageSelect"
            >
            <template v-if="!selectedArrivalImage">
              <button
                @click="skipArrivalImage"
                :disabled="skippingArrivalImage"
                class="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                <svg v-if="skippingArrivalImage" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"/>
                </svg>
                {{ t.skipImage }}
              </button>
              <button
                @click="$refs.arrivalImageInput.click()"
                class="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                {{ t.selectImage }}
              </button>
            </template>
            <div v-else class="flex items-center gap-2">
              <span class="text-sm text-green-700 truncate max-w-[150px]">{{ selectedArrivalImage.name }}</span>
              <button
                @click="selectedArrivalImage = null"
                class="p-1 text-green-600 hover:text-green-800"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
              <button
                @click="uploadArrivalImage"
                :disabled="uploadingArrivalImage"
                class="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                <svg v-if="uploadingArrivalImage" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                </svg>
                {{ t.uploadAndConfirm }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Arrival Photos (single section — gallery if arrival_images exist, legacy single image fallback) -->
      <div
        v-if="order.arrival_images?.length > 0 || order.arrival_image_url"
        class="mb-6 bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm"
      >
        <!-- Header -->
        <div class="px-4 py-3 sm:px-5 sm:py-4 border-b border-gray-100 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-sm">
              <svg class="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 text-sm sm:text-base">{{ t.arrivalProofImage }}</h3>
              <p class="text-xs text-gray-500 hidden sm:block">
                <template v-if="order.arrival_images?.length > 0">
                  {{ order.arrival_images.length }} photo{{ order.arrival_images.length !== 1 ? 's' : '' }} uploaded by warehouse
                </template>
                <template v-else>{{ t.arrivalImageUploaded }}</template>
              </p>
            </div>
          </div>
          <!-- Actions -->
          <div class="flex items-center gap-2">
            <input
              type="file"
              ref="replaceImageInput"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              class="hidden"
              @change="handleReplaceImageSelect"
            />
            <button
              @click="$refs.replaceImageInput.click()"
              :disabled="uploadingArrivalImage"
              class="p-2 sm:px-3 sm:py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
              :title="t.replaceImage"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              <span class="hidden sm:inline text-sm font-medium">{{ t.replaceImage }}</span>
            </button>
            <button
              @click="downloadArrivalImage"
              class="p-2 sm:px-3 sm:py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
              :title="t.download"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
              </svg>
              <span class="hidden sm:inline text-sm font-medium">{{ t.download }}</span>
            </button>
          </div>
        </div>

        <!-- Gallery view (when arrival_images records exist) -->
        <div v-if="order.arrival_images?.length > 0" class="p-4 space-y-4">
          <div v-if="order.arrival_images.filter(i => i.type === 'label').length > 0">
            <p class="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Box Labels</p>
            <div class="flex flex-wrap gap-3">
              <a
                v-for="img in order.arrival_images.filter(i => i.type === 'label')"
                :key="img.id"
                :href="img.url"
                target="_blank"
                class="block h-28 w-28 rounded-lg overflow-hidden border border-gray-200 hover:opacity-90 transition-opacity"
              >
                <img :src="img.url" alt="Label photo" class="h-full w-full object-cover" />
              </a>
            </div>
          </div>
          <div v-if="order.arrival_images.filter(i => i.type === 'contents').length > 0">
            <p class="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Contents</p>
            <div class="flex flex-wrap gap-3">
              <a
                v-for="img in order.arrival_images.filter(i => i.type === 'contents')"
                :key="img.id"
                :href="img.url"
                target="_blank"
                class="block h-28 w-28 rounded-lg overflow-hidden border border-gray-200 hover:opacity-90 transition-opacity"
              >
                <img :src="img.url" alt="Contents photo" class="h-full w-full object-cover" />
              </a>
            </div>
          </div>
        </div>

        <!-- Legacy single image fallback -->
        <div
          v-else
          class="relative group cursor-pointer"
          @click="showArrivalImageModal = true"
        >
          <img
            :src="order.arrival_image_url"
            alt="Arrival proof"
            class="w-full h-48 sm:h-56 md:h-64 object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          >
          <div class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
            <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-2 px-4 py-2 bg-white/95 rounded-full shadow-lg">
              <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"/>
              </svg>
              <span class="text-sm font-medium text-gray-700">{{ t.viewFullscreen }}</span>
            </div>
          </div>
          <div class="absolute bottom-3 right-3 sm:hidden bg-white/90 rounded-full p-2 shadow-md">
            <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- Subtle Add Arrival Photo (for orders past awaiting_packages without image) -->
      <div
        v-if="!order.arrival_image_url && !['collecting', 'awaiting_packages'].includes(order.status)"
        class="mb-6 bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
      >
        <div class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-700">{{ t.noArrivalImage }}</p>
              <p class="text-xs text-gray-500">{{ t.addArrivalImageHint }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <input
              type="file"
              ref="addImageInput"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              class="hidden"
              @change="handleArrivalImageSelect"
            />
            <button
              v-if="!selectedArrivalImage"
              @click="$refs.addImageInput.click()"
              class="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              {{ t.addPhoto }}
            </button>
            <template v-else>
              <span class="text-sm text-gray-600 truncate max-w-[120px]">{{ selectedArrivalImage.name }}</span>
              <button
                @click="selectedArrivalImage = null"
                class="p-1 text-gray-500 hover:text-gray-700"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
              <button
                @click="uploadArrivalImage"
                :disabled="uploadingArrivalImage"
                class="px-3 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-2"
              >
                <svg v-if="uploadingArrivalImage" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                </svg>
                {{ t.upload }}
              </button>
            </template>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left Column -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Customer Info -->
          <div class="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
            <h2 class="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
              {{ t.customerInformation }}
            </h2>
            <div class="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4">
              <!-- Name -->
              <div>
                <p class="text-xs sm:text-sm text-gray-500">{{ t.name }}</p>
                <p class="font-medium text-sm sm:text-base text-gray-900">{{ order.user.name }}</p>
              </div>

              <!-- Email -->
              <div class="min-w-0">
                <p class="text-xs sm:text-sm text-gray-500">{{ t.email }}</p>
                <NuxtLink
                  :to="`mailto:${order.user.email}`"
                  external
                  class="font-medium text-sm sm:text-base text-primary-600 hover:text-primary-700 hover:underline block truncate"
                  :title="order.user.email"
                >
                  {{ order.user.email }}
                </NuxtLink>
              </div>

              <!-- Delivery Address (SHIPPING orders only) -->
              <div
                v-if="!isCrossing"
                class="sm:col-span-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100"
              >
                <p class="text-xs sm:text-sm text-gray-500 mb-1">{{ t.deliveryAddress }}</p>
                <p class="text-sm font-medium text-gray-900 break-words">
                  {{ formatAddress(order.delivery_address) }}
                </p>
                <div class="flex flex-wrap gap-2 mt-2">
                  <NuxtLink
                    v-if="order.delivery_address"
                    :to="`https://maps.google.com/?q=${encodeURIComponent(formatAddress(order.delivery_address))}`"
                    target="_blank"
                    external
                    class="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-primary-600 transition-colors"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {{ t.viewOnMap }}
                  </NuxtLink>
                  <button
                    v-if="order.delivery_address"
                    @click="copyToClipboard(formatAddress(order.delivery_address))"
                    class="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-primary-600 transition-colors"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    {{ t.copyAddress }}
                  </button>
                </div>
              </div>

              <!-- Pickup Location (CROSSING orders only) -->
              <div
                v-if="isCrossing"
                class="sm:col-span-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100"
              >
                <p class="text-xs sm:text-sm text-gray-500 mb-1">{{ t.pickupLocation }}</p>
                <div class="bg-amber-50 rounded-lg p-3 border border-amber-100">
                  <div class="flex items-start gap-3">
                    <div class="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"/>
                      </svg>
                    </div>
                    <div class="flex-1">
                      <p class="text-sm font-semibold text-gray-900">{{ t.warehouseName }}</p>
                      <p class="text-xs text-gray-600 mt-0.5">{{ t.warehouseAddress }}</p>
                      <NuxtLink
                        to="https://maps.app.goo.gl/4SsEVjy2D4noFM9n8"
                        target="_blank"
                        external
                        class="inline-flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 mt-2 font-medium"
                      >
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {{ t.getDirections }}
                      </NuxtLink>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ============================================== -->
          <!-- NEW STRUCTURE: Multiple Boxes with per-box GIA -->
          <!-- ============================================== -->
          <div
            v-if="!isCrossing && hasBoxes"
            class="bg-white rounded-xl border border-indigo-200 p-4 sm:p-6"
          >
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-3">
                <div class="p-2 bg-indigo-100 rounded-lg">
                  <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div>
                  <h2 class="text-base sm:text-lg font-semibold text-gray-900">{{ t.shippingBoxes }}</h2>
                  <p class="text-xs text-gray-500">{{ t.boxesWithTracking }}</p>
                </div>
              </div>
              <span class="px-3 py-1 text-sm font-semibold rounded-full bg-indigo-100 text-indigo-700">
                {{ order.boxes.length }} {{ order.boxes.length === 1 ? t.box : t.boxes }}
              </span>
            </div>

            <div class="space-y-4">
              <div
                v-for="(box, index) in order.boxes"
                :key="box.id"
                class="p-4 bg-gray-50 rounded-xl border border-gray-200"
              >
                <!-- Box Header -->
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center gap-3">
                    <div
                      class="w-10 h-10 rounded-lg flex items-center justify-center"
                      :class="getBoxSizeColor(box.box_size)"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div>
                      <p class="font-semibold text-gray-900">{{ t.boxLabel }} {{ index + 1 }}: {{ box.box_name }}</p>
                      <p class="text-xs text-gray-500">{{ formatBoxSizeLabelFull(box.box_size) }}</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-3">
                    <p class="text-lg font-bold text-gray-900">${{ parseFloat(box.box_price).toFixed(2) }}</p>
                    <!-- Print Label Button -->
                    <button
                      v-if="!isCrossing && order.delivery_address"
                      @click="openBoxLabel(box, index + 1)"
                      class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-primary-600 hover:text-primary-800 hover:bg-primary-50 rounded transition-colors"
                      :title="t.printLabel"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      <span class="hidden sm:inline">{{ t.printLabel }}</span>
                    </button>
                  </div>
                </div>

                <!-- Box Dimensions & Weight -->
                <div v-if="box.length || box.width || box.height || box.weight" class="flex flex-wrap gap-3 text-xs text-gray-600 mb-3 pb-3 border-b border-gray-100">
                  <span v-if="box.length || box.width || box.height" class="inline-flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                    <svg class="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                    {{ box.length || '-' }} × {{ box.width || '-' }} × {{ box.height || '-' }} cm
                  </span>
                  <span v-if="box.weight" class="inline-flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                    <svg class="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                    </svg>
                    {{ box.weight }} kg
                  </span>
                </div>

                <!-- Tracking Status Card -->
                <div v-if="box.guia_number" class="mt-3 pt-3 border-t border-gray-200">
                  <div class="flex items-center justify-between mb-2">
                    <p class="text-xs font-medium text-gray-500">{{ t.trackingStatus }}</p>
                    <button
                      @click="refreshTracking(box.guia_number)"
                      :disabled="isTrackingLoading(box.guia_number)"
                      class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-primary-600 hover:text-primary-800 hover:bg-primary-50 rounded transition-colors disabled:opacity-50"
                    >
                      <svg
                        :class="['w-3 h-3', isTrackingLoading(box.guia_number) ? 'animate-spin' : '']"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      {{ t.refreshTracking }}
                    </button>
                  </div>

                  <!-- Loading State -->
                  <div v-if="isTrackingLoading(box.guia_number)" class="flex items-center gap-2 text-gray-400">
                    <svg class="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span class="text-xs">{{ t.loadingTracking }}</span>
                  </div>

                  <!-- Tracking Info Available -->
                  <div v-else-if="getBoxTrackingInfo(box.guia_number)" class="space-y-2">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <!-- Status Badge -->
                        <span
                          :class="[
                            'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border',
                            getTrackingStatusColor(getBoxTrackingInfo(box.guia_number).status.tag)
                          ]"
                        >
                          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getTrackingStatusIcon(getBoxTrackingInfo(box.guia_number).status.tag)" />
                          </svg>
                          {{ getTrackingStatusLabel(getBoxTrackingInfo(box.guia_number).status.tag) }}
                        </span>
                      </div>

                      <!-- Track Link -->
                      <NuxtLink
                        :to="`/track?tracking_number=${box.guia_number}`"
                        target="_blank"
                        class="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-800 transition-colors"
                      >
                        {{ t.viewTracking }}
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </NuxtLink>
                    </div>

                    <!-- Latest checkpoint message -->
                    <div v-if="getBoxTrackingInfo(box.guia_number).checkpoints?.length" class="text-xs text-gray-600 bg-white rounded-lg p-2 border border-gray-100">
                      <p class="font-medium">{{ getBoxTrackingInfo(box.guia_number).checkpoints[getBoxTrackingInfo(box.guia_number).checkpoints.length - 1].message }}</p>
                      <p class="text-gray-400 mt-0.5">{{ formatTrackingDate(getBoxTrackingInfo(box.guia_number).checkpoints[getBoxTrackingInfo(box.guia_number).checkpoints.length - 1].time) }}</p>
                    </div>

                    <!-- Origin/Destination mini info -->
                    <div v-if="getBoxTrackingInfo(box.guia_number).origin?.location || getBoxTrackingInfo(box.guia_number).destination?.location" class="flex items-center gap-2 text-xs text-gray-500">
                      <span v-if="getBoxTrackingInfo(box.guia_number).origin?.location">{{ getBoxTrackingInfo(box.guia_number).origin.location }}</span>
                      <svg v-if="getBoxTrackingInfo(box.guia_number).origin?.location && getBoxTrackingInfo(box.guia_number).destination?.location" class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                      <span v-if="getBoxTrackingInfo(box.guia_number).destination?.location">{{ getBoxTrackingInfo(box.guia_number).destination.location }}</span>
                    </div>
                  </div>

                  <!-- No Tracking Info Yet - Click to Track -->
                  <div v-else class="flex items-center gap-2 text-xs text-gray-400 italic">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                    </svg>
                    {{ t.clickToTrack }}
                  </div>
                </div>

                <!-- Guia & GIA Info -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-gray-200">
                  <!-- Guia Number -->
                  <div>
                    <p class="text-xs font-medium text-gray-500 mb-1">{{ t.guiaNumber }}</p>
                    <div v-if="box.guia_number" class="flex items-center gap-2">
                      <NuxtLink
                        :to="`/track?tracking_number=${box.guia_number}`"
                        target="_blank"
                        class="font-mono text-sm font-bold text-primary-700 hover:text-primary-900 hover:underline flex items-center gap-1"
                      >
                        {{ box.guia_number }}
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </NuxtLink>
                      <button
                        @click="copyToClipboard(box.guia_number)"
                        class="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        :title="t.copyGuia"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                    <span v-else class="text-xs text-gray-400 italic">{{ t.notAssigned }}</span>
                  </div>

                  <!-- GIA Document -->
                  <div>
                    <p class="text-xs font-medium text-gray-500 mb-1">{{ t.giaDocument }}</p>
                    <NuxtLink
                      v-if="box.gia_url || box.gia_full_url"
                      :to="box.gia_url || box.gia_full_url"
                      target="_blank"
                      external
                      class="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-medium rounded-lg border border-green-200 hover:bg-green-100 transition-colors"
                    >
                      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd"/>
                      </svg>
                      <span class="truncate max-w-[120px]" :title="box.gia_filename">
                        {{ box.gia_filename || 'GIA.pdf' }}
                      </span>
                      <svg class="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                      </svg>
                    </NuxtLink>
                    <span v-else class="text-xs text-gray-400 italic">{{ t.noGiaFile }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Total Box Price -->
            <div class="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
              <p class="text-sm font-semibold text-gray-700">{{ t.totalBoxPrice }}</p>
              <p class="text-xl font-bold text-gray-900">${{ totalBoxPrice.toFixed(2) }}</p>
            </div>
          </div>

          <!-- ============================================== -->
          <!-- LEGACY STRUCTURE: Single Guia/GIA at order level -->
          <!-- ============================================== -->
          <div
            v-if="!isCrossing && !hasBoxes && hasLegacyShippingInfo"
            class="bg-white rounded-xl border border-indigo-200 p-4 sm:p-6"
          >
            <div class="flex items-center gap-3 mb-4">
              <div class="p-2 bg-indigo-100 rounded-lg">
                <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <h2 class="text-base sm:text-lg font-semibold text-gray-900">{{ t.shippingInfo }}</h2>
                <p class="text-xs text-gray-500">{{ t.trackingAndDocuments }}</p>
              </div>
            </div>

            <!-- Single Box Card (Legacy) -->
            <div class="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <!-- Box Header -->
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-3">
                  <div
                    class="w-10 h-10 rounded-lg flex items-center justify-center"
                    :class="getBoxSizeColor(order.box_size)"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div>
                    <p class="font-semibold text-gray-900">{{ formatBoxSizeLabelFull(order.box_size) || t.singleBox }}</p>
                    <p class="text-xs text-gray-500">{{ t.boxLabel }}</p>
                  </div>
                </div>
                <p v-if="order.box_price" class="text-lg font-bold text-gray-900">${{ parseFloat(order.box_price).toFixed(2) }}</p>
              </div>

              <!-- Tracking Status Card (Legacy) -->
              <div v-if="order.guia_number" class="mt-3 pt-3 border-t border-gray-200">
                <div class="flex items-center justify-between mb-2">
                  <p class="text-xs font-medium text-gray-500">{{ t.trackingStatus }}</p>
                  <button
                    @click="refreshTracking(order.guia_number)"
                    :disabled="isTrackingLoading(order.guia_number)"
                    class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-primary-600 hover:text-primary-800 hover:bg-primary-50 rounded transition-colors disabled:opacity-50"
                  >
                    <svg
                      :class="['w-3 h-3', isTrackingLoading(order.guia_number) ? 'animate-spin' : '']"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {{ t.refreshTracking }}
                  </button>
                </div>

                <!-- Loading State -->
                <div v-if="isTrackingLoading(order.guia_number)" class="flex items-center gap-2 text-gray-400">
                  <svg class="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span class="text-xs">{{ t.loadingTracking }}</span>
                </div>

                <!-- Tracking Info Available -->
                <div v-else-if="getBoxTrackingInfo(order.guia_number)" class="space-y-2">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <!-- Status Badge -->
                      <span
                        :class="[
                          'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border',
                          getTrackingStatusColor(getBoxTrackingInfo(order.guia_number).status.tag)
                        ]"
                      >
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getTrackingStatusIcon(getBoxTrackingInfo(order.guia_number).status.tag)" />
                        </svg>
                        {{ getTrackingStatusLabel(getBoxTrackingInfo(order.guia_number).status.tag) }}
                      </span>
                    </div>

                    <!-- Track Link -->
                    <NuxtLink
                      :to="`/track?tracking_number=${order.guia_number}`"
                      target="_blank"
                      class="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-800 transition-colors"
                    >
                      {{ t.viewTracking }}
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </NuxtLink>
                  </div>

                  <!-- Latest checkpoint message -->
                  <div v-if="getBoxTrackingInfo(order.guia_number).checkpoints?.length" class="text-xs text-gray-600 bg-white rounded-lg p-2 border border-gray-100">
                    <p class="font-medium">{{ getBoxTrackingInfo(order.guia_number).checkpoints[getBoxTrackingInfo(order.guia_number).checkpoints.length - 1].message }}</p>
                    <p class="text-gray-400 mt-0.5">{{ formatTrackingDate(getBoxTrackingInfo(order.guia_number).checkpoints[getBoxTrackingInfo(order.guia_number).checkpoints.length - 1].time) }}</p>
                  </div>

                  <!-- Origin/Destination mini info -->
                  <div v-if="getBoxTrackingInfo(order.guia_number).origin?.location || getBoxTrackingInfo(order.guia_number).destination?.location" class="flex items-center gap-2 text-xs text-gray-500">
                    <span v-if="getBoxTrackingInfo(order.guia_number).origin?.location">{{ getBoxTrackingInfo(order.guia_number).origin.location }}</span>
                    <svg v-if="getBoxTrackingInfo(order.guia_number).origin?.location && getBoxTrackingInfo(order.guia_number).destination?.location" class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                    <span v-if="getBoxTrackingInfo(order.guia_number).destination?.location">{{ getBoxTrackingInfo(order.guia_number).destination.location }}</span>
                  </div>
                </div>

                <!-- No Tracking Info Yet - Click to Track -->
                <div v-else class="flex items-center gap-2 text-xs text-gray-400 italic">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                  {{ t.clickToTrack }}
                </div>
              </div>

              <!-- Guia & GIA Info -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-gray-200">
                <!-- Guia Number -->
                <div>
                  <p class="text-xs font-medium text-gray-500 mb-1">{{ t.guiaNumber }}</p>
                  <div v-if="order.guia_number" class="flex items-center gap-2">
                    <NuxtLink
                      :to="`/track?tracking_number=${order.guia_number}`"
                      target="_blank"
                      class="font-mono text-sm font-bold text-primary-700 hover:text-primary-900 hover:underline flex items-center gap-1"
                    >
                      {{ order.guia_number }}
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </NuxtLink>
                    <button
                      @click="copyToClipboard(order.guia_number)"
                      class="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      :title="t.copyGuia"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                  <span v-else class="text-xs text-gray-400 italic">{{ t.notAssigned }}</span>
                </div>

                <!-- GIA Document -->
                <div>
                  <p class="text-xs font-medium text-gray-500 mb-1">{{ t.giaDocument }}</p>
                  <NuxtLink
                    v-if="order.gia_url"
                    :to="order.gia_url"
                    target="_blank"
                    external
                    class="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-medium rounded-lg border border-green-200 hover:bg-green-100 transition-colors"
                  >
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd"/>
                    </svg>
                    <span class="truncate max-w-[120px]" :title="order.gia_filename">
                      {{ order.gia_filename || 'GIA.pdf' }}
                    </span>
                    <svg class="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                    </svg>
                  </NuxtLink>
                  <span v-else class="text-xs text-gray-400 italic">{{ t.noGiaFile }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Items List -->
          <AdminOrderItemsList
            :items="order.items"
            :order-status="order.status"
            @mark-arrived="openMarkArrivedModal"
          >
            <template #header-actions>
              <NuxtLink
                :to="`/app/admin/orders/${order.id}/items`"
                class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
                {{ t.manageItems }}
              </NuxtLink>
            </template>
          </AdminOrderItemsList>
        </div>

        <!-- Right Column -->
        <div class="space-y-6">
          <!-- Order Summary -->
          <div class="bg-white rounded-xl border border-gray-200 p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">{{ t.orderSummary }}</h2>
            <div class="space-y-3">
              <div class="flex justify-between">
                <p class="text-sm text-gray-500">{{ t.orderNumber }}</p>
                <p class="font-medium">{{ order.order_number }}</p>
              </div>
              <div class="flex justify-between">
                <p class="text-sm text-gray-500">{{ t.trackingNumber }}</p>
                <p class="font-medium">{{ order.tracking_number }}</p>
              </div>
              <div class="flex justify-between">
                <p class="text-sm text-gray-500">{{ t.orderType }}</p>
                <span
                  :class="[
                    'px-2 py-0.5 rounded text-xs font-medium',
                    isCrossing ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                  ]"
                >
                  {{ isCrossing ? t.crossingOnly : t.shipping }}
                </span>
              </div>
              <div class="flex justify-between">
                <p class="text-sm text-gray-500">{{ t.totalBoxWeight }}</p>
                <p class="font-medium">{{ order.total_box_weight || 0 }} kg</p>
              </div>

              <!-- Items Arrival Progress -->
              <div v-if="order.status === 'awaiting_packages'" class="border-t border-gray-100 pt-3 mt-3">
                <div class="flex justify-between items-center mb-2">
                  <p class="text-sm text-gray-500">{{ t.itemsArrived }}</p>
                  <p class="text-sm font-medium">{{ arrivedItemsCount }} / {{ totalItemsCount }}</p>
                </div>
                <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-teal-500 rounded-full transition-all duration-500"
                    :style="{ width: `${arrivalProgress}%` }"
                  ></div>
                </div>
              </div>

              <!-- Boxes Summary for CROSSING orders -->
              <div v-if="isCrossing && hasBoxes" class="border-t border-gray-100 pt-3 mt-3">
                <div class="flex items-center justify-between mb-2">
                  <p class="text-sm font-semibold text-gray-700">{{ t.boxes }}</p>
                  <span class="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                    {{ order.boxes.length }} {{ order.boxes.length === 1 ? t.box : t.boxes }}
                  </span>
                </div>
                <div class="space-y-2">
                  <div
                    v-for="box in order.boxes"
                    :key="box.id"
                    class="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                  >
                    <div class="flex items-center gap-2">
                      <div class="w-8 h-8 rounded-lg flex items-center justify-center" :class="getBoxSizeColor(box.box_size)">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                      <div>
                        <p class="text-sm font-medium text-gray-900">{{ box.box_name }}</p>
                        <p class="text-xs text-gray-500">{{ formatBoxSizeLabel(box.box_size) }}</p>
                      </div>
                    </div>
                    <p class="text-sm font-semibold text-gray-900">${{ parseFloat(box.box_price).toFixed(2) }}</p>
                  </div>
                </div>
                <div class="flex justify-between items-center mt-3 pt-2 border-t border-gray-200">
                  <p class="text-sm font-semibold text-gray-700">{{ t.totalBoxPrice }}</p>
                  <p class="text-base font-bold text-gray-900">${{ totalBoxPrice.toFixed(2) }}</p>
                </div>
              </div>

              <!-- Boxes Summary for SHIPPING orders with boxes array (compact) -->
              <div v-if="!isCrossing && hasBoxes" class="border-t border-gray-100 pt-3 mt-3">
                <div class="flex justify-between items-center">
                  <p class="text-sm text-gray-500">{{ t.boxes }}</p>
                  <span class="text-sm font-medium">
                    {{ order.boxes.length }} {{ order.boxes.length === 1 ? t.box : t.boxes }}
                  </span>
                </div>
                <div class="flex justify-between items-center mt-1">
                  <p class="text-sm text-gray-500">{{ t.totalBoxPrice }}</p>
                  <p class="font-bold text-gray-900">${{ totalBoxPrice.toFixed(2) }}</p>
                </div>
              </div>

              <!-- Single Box Display (legacy orders without boxes array) -->
              <div v-if="!hasBoxes && order.box_size" class="border-t border-gray-100 pt-3 mt-3">
                <div class="flex justify-between">
                  <p class="text-sm text-gray-500">{{ t.boxSize }}</p>
                  <div class="flex items-center gap-2">
                    <span class="w-6 h-6 rounded flex items-center justify-center" :class="getBoxSizeColor(order.box_size)">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </span>
                    <p class="font-medium capitalize">{{ order.box_size.replace('-', ' ') }}</p>
                  </div>
                </div>
                <div v-if="order.box_price" class="flex justify-between mt-1">
                  <p class="text-sm text-gray-500">{{ t.boxPrice }}</p>
                  <p class="font-bold text-gray-900">${{ parseFloat(order.box_price).toFixed(2) }}</p>
                </div>
              </div>

              <!-- FINANCIALS SECTION -->
              <div
                v-if="order.deposit_amount || order.quoted_amount || order.amount_paid || order.box_price"
                class="mt-6 pt-4 border-t-2 border-gray-100"
              >
                <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{{ t.financials }}</h3>

                <!-- NEW FLOW: Full Payment (100%) for SHIPPING orders (no deposit_amount = new flow) -->
                <div v-if="!isCrossing && !order.deposit_amount && order.box_price" class="mb-3 p-3 bg-primary-50 rounded-lg border border-primary-100">
                  <div class="flex justify-between items-center mb-2">
                    <span class="text-xs font-semibold text-primary-700">{{ t.consolidationPayment }} (100%)</span>
                    <!-- Show amount_paid when paid, otherwise show totalBoxPrice -->
                    <span class="text-sm font-bold text-gray-900">${{ order.paid_at && order.amount_paid ? parseFloat(order.amount_paid).toFixed(2) : totalBoxPrice.toFixed(2) }}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span
                      class="text-[10px] px-1.5 py-0.5 rounded font-medium"
                      :class="order.paid_at ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'"
                    >
                      {{ order.paid_at ? t.paid : t.pending }}
                    </span>
                    <div class="flex items-center gap-2">
                      <span v-if="order.paid_at" class="text-xs text-gray-500">
                        {{ formatDate(order.paid_at) }}
                      </span>
                      <NuxtLink
                        v-if="order.payment_link"
                        :to="order.payment_link"
                        target="_blank"
                        external
                        class="text-xs text-purple-600 hover:text-purple-800 hover:underline flex items-center gap-1"
                      >
                        {{ t.invoice }}
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                        </svg>
                      </NuxtLink>
                    </div>
                  </div>
                </div>

                <!-- LEGACY: SHIPPING: Deposit (50%) - for old orders with deposit_amount -->
                <div v-if="order.deposit_amount && !isCrossing" class="mb-3 p-3 bg-gray-50 rounded-lg">
                  <div class="flex justify-between items-center mb-2">
                    <span class="text-xs font-semibold text-gray-600">{{ t.deposit }} (50%)</span>
                    <span class="text-sm font-bold text-gray-900">${{ order.deposit_amount }}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span
                      class="text-[10px] px-1.5 py-0.5 rounded font-medium"
                      :class="order.deposit_paid_at ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'"
                    >
                      {{ order.deposit_paid_at ? t.paid : t.pending }}
                    </span>
                    <div class="flex items-center gap-2">
                      <span v-if="order.deposit_paid_at" class="text-xs text-gray-500">
                        {{ formatDate(order.deposit_paid_at) }}
                      </span>
                      <NuxtLink
                        v-if="order.deposit_payment_link"
                        :to="order.deposit_payment_link"
                        target="_blank"
                        external
                        class="text-xs text-primary-600 hover:text-primary-800 hover:underline flex items-center gap-1"
                      >
                        {{ t.invoice }}
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                        </svg>
                      </NuxtLink>
                    </div>
                  </div>
                </div>

                <!-- CROSSING: Full Payment (100%) - Uses paid_at NOT deposit_paid_at -->
                <div v-if="order.deposit_amount && isCrossing" class="mb-3 p-3 bg-gray-50 rounded-lg">
                  <div class="flex justify-between items-center mb-2">
                    <span class="text-xs font-semibold text-gray-600">{{ t.fullPayment }} (100%)</span>
                    <span class="text-sm font-bold text-gray-900">${{ order.deposit_amount }}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span
                      class="text-[10px] px-1.5 py-0.5 rounded font-medium"
                      :class="order.paid_at ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'"
                    >
                      {{ order.paid_at ? t.paid : t.pending }}
                    </span>
                    <div class="flex items-center gap-2">
                      <span v-if="order.paid_at" class="text-xs text-gray-500">
                        {{ formatDate(order.paid_at) }}
                      </span>
                      <NuxtLink
                        v-if="order.deposit_payment_link"
                        :to="order.deposit_payment_link"
                        target="_blank"
                        external
                        class="text-xs text-primary-600 hover:text-primary-800 hover:underline flex items-center gap-1"
                      >
                        {{ t.invoice }}
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                        </svg>
                      </NuxtLink>
                    </div>
                  </div>
                </div>

                <!-- SHIPPING: Final Balance (remaining 50%) -->
                <div v-if="order.quoted_amount && !isCrossing" class="mb-3 p-3 bg-gray-50 rounded-lg">
                  <div class="flex justify-between items-center mb-2">
                    <span class="text-xs font-semibold text-gray-600">{{ t.finalBalance }}</span>
                    <span class="text-sm font-bold text-gray-900">${{ order.quoted_amount }}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span
                      class="text-[10px] px-1.5 py-0.5 rounded font-medium"
                      :class="order.paid_at ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'"
                    >
                      {{ order.paid_at ? t.paid : t.pending }}
                    </span>
                    <div class="flex items-center gap-2">
                      <span v-if="order.paid_at" class="text-xs text-gray-500">
                        {{ formatDate(order.paid_at) }}
                      </span>
                      <NuxtLink
                        v-if="order.payment_link"
                        :to="order.payment_link"
                        target="_blank"
                        external
                        class="text-xs text-primary-600 hover:text-primary-800 hover:underline flex items-center gap-1"
                      >
                        {{ t.invoice }}
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                        </svg>
                      </NuxtLink>
                    </div>
                  </div>
                </div>

                <!-- Total Paid -->
                <div v-if="showTotalPaid" class="mt-3 pt-3 border-t border-gray-200">
                  <div class="flex justify-between items-center">
                    <span class="text-sm font-bold text-gray-700">{{ t.totalPaid }}</span>
                    <span class="text-xl font-black text-green-600">${{ actualAmountPaid.toFixed(2) }}</span>
                  </div>
                  <div class="mt-2">
                    <div class="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{{ t.paymentProgress }}</span>
                      <span>{{ paymentPercentage }}%</span>
                    </div>
                    <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        class="h-full bg-green-500 rounded-full transition-all duration-500"
                        :style="{ width: `${paymentPercentage}%` }"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Timeline -->
          <AdminOrderTimeline :order="order" />
        </div>
      </div>
    </div>

    <!-- Modals -->
    <AdminOrderModalStartProcessing
      :show="showStartProcessingModal"
      :order="order"
      @close="showStartProcessingModal = false"
      @success="handleModalSuccess"
    />

    <AdminOrderModalConsolidate
      :show="showConsolidateModal"
      :order="order"
      @close="showConsolidateModal = false"
      @success="handleModalSuccess"
    />

    <AdminOrderModalShipOrder
      :show="showShipOrderModal"
      :order="order"
      @close="showShipOrderModal = false"
      @success="handleModalSuccess"
    />

    <AdminOrderModalReadyForPickup
      :show="showReadyForPickupModal"
      :order="order"
      @close="showReadyForPickupModal = false"
      @success="handleModalSuccess"
    />

    <AdminOrderModalMarkDelivered
      :show="showMarkDeliveredModal"
      :order="order"
      @close="showMarkDeliveredModal = false"
      @success="handleModalSuccess"
    />

    <AdminOrderModalFinalInvoice
      :show="showFinalInvoiceModal"
      :order="order"
      @close="showFinalInvoiceModal = false"
      @success="handleModalSuccess"
    />

    <AdminOrderModalMarkPaid
      :show="showMarkPaidModal"
      :order="order"
      @close="showMarkPaidModal = false"
      @success="handleModalSuccess"
    />

    <AdminOrderModalMarkArrived
      :show="showMarkArrivedModal"
      :item="selectedItem"
      :order-id="order?.id"
      @close="closeMarkArrivedModal"
      @success="handleModalSuccess"
    />

    <AdminOrderModalDelete
      :show="showDeleteModal"
      :order="order"
      @close="showDeleteModal = false"
      @success="() => router.push('/app/admin/orders')"
    />

    <!-- Mark All Items Arrived Modal -->
    <div v-if="showMarkAllArrivedModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
            <svg class="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 class="text-lg font-bold text-gray-900">{{ t.markAllArrivedTitle }}</h3>
            <p class="text-sm text-gray-500">{{ t.markAllArrivedSubtitle }}</p>
          </div>
        </div>

        <div class="bg-gray-50 rounded-lg p-4 mb-4">
          <p class="text-sm text-gray-700">{{ t.markAllArrivedDesc }}</p>
          <div class="mt-3 flex items-center gap-2 text-sm">
            <span class="font-semibold text-gray-900">{{ pendingItemsCount }}</span>
            <span class="text-gray-600">{{ t.itemsWillBeMarked }}</span>
          </div>
        </div>

        <div class="flex justify-end gap-3">
          <button
            @click="showMarkAllArrivedModal = false"
            :disabled="markingAllArrived"
            class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            {{ t.cancel }}
          </button>
          <button
            @click="handleMarkAllArrived"
            :disabled="markingAllArrived"
            class="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <svg v-if="markingAllArrived" class="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            {{ markingAllArrived ? t.processing : t.confirmMarkAllArrived }}
          </button>
        </div>
      </div>
    </div>

    <!-- Shipping Label Print Modal -->
    <AdminOrderShippingLabel
      v-if="order && selectedLabelBox"
      :show="showShippingLabelModal"
      :order="order"
      :box="selectedLabelBox"
      :box-index="selectedLabelBoxIndex"
      :total-boxes="order.boxes?.length || 1"
      @close="showShippingLabelModal = false; selectedLabelBox = null"
    />

    <!-- Jesus Message Modal -->
    <AdminOrderJesusMessage
      v-if="order"
      :show="showJesusMessageModal"
      :order="order"
      @close="showJesusMessageModal = false"
    />

    <!-- Fullscreen Arrival Image Modal -->
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
          @click.self="showArrivalImageModal = false; imageZoomed = false"
        >
          <!-- Close button -->
          <button
            @click="showArrivalImageModal = false; imageZoomed = false"
            class="absolute top-4 right-4 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>

          <!-- Download button -->
          <button
            @click="downloadArrivalImage"
            class="absolute top-4 left-4 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
          </button>

          <!-- Image container with zoom -->
          <div class="w-full h-full p-4 sm:p-8 flex items-center justify-center overflow-auto">
            <img
              :src="order.arrival_image_url"
              alt="Arrival proof"
              class="max-w-full max-h-full object-contain cursor-zoom-in sm:cursor-default"
              :class="{ 'sm:max-w-none sm:max-h-none sm:w-auto sm:h-auto': imageZoomed }"
              @click="imageZoomed = !imageZoomed"
            >
          </div>

          <!-- Zoom hint (mobile) -->
          <div class="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/10 rounded-full text-white/80 text-sm sm:hidden">
            {{ imageZoomed ? t.close : 'Tap to zoom' }}
          </div>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import AdminOrderHeader from "~/components/admin/AdminOrderHeader.vue";
import AdminOrderItemsList from "~/components/admin/AdminOrderItemsList.vue";
import AdminOrderTimeline from "~/components/admin/AdminOrderTimeline.vue";
import AdminOrderModalStartProcessing from "~/components/admin/AdminOrderModalStartProcessing.vue";
import AdminOrderModalConsolidate from "~/components/admin/AdminOrderModalConsolidate.vue";
import AdminOrderModalShipOrder from "~/components/admin/AdminOrderModalShipOrder.vue";
import AdminOrderModalReadyForPickup from "~/components/admin/AdminOrderModalReadyForPickup.vue";
import AdminOrderModalMarkDelivered from "~/components/admin/AdminOrderModalMarkDelivered.vue";
import AdminOrderModalFinalInvoice from "~/components/admin/AdminOrderModalFinalInvoice.vue";
import AdminOrderModalMarkPaid from "~/components/admin/AdminOrderModalMarkPaid.vue";
import AdminOrderModalMarkArrived from "~/components/admin/AdminOrderModalMarkArrived.vue";
import AdminOrderModalDelete from "~/components/admin/AdminOrderModalDelete.vue";
import AdminOrderShippingLabel from "~/components/admin/AdminOrderShippingLabel.vue";
import AdminOrderJesusMessage from "~/components/admin/AdminOrderJesusMessage.vue";

definePageMeta({
  layout: "admin",
  middleware: ["auth", "admin"],
});

const { $customFetch, $toast } = useNuxtApp();
const route = useRoute();
const router = useRouter();
const { t: createTranslations } = useLanguage();

const order = ref(null);
const loading = ref(true);
const showActionsMenu = ref(false);

// Tracking state - per guia number loading state
const trackingData = ref({});
const trackingLoadingMap = ref({});

// Modal States
const showStartProcessingModal = ref(false);
const showConsolidateModal = ref(false);
const showShipOrderModal = ref(false);
const showReadyForPickupModal = ref(false);
const showMarkDeliveredModal = ref(false);
const showFinalInvoiceModal = ref(false);
const showMarkPaidModal = ref(false);
const showMarkArrivedModal = ref(false);
const showDeleteModal = ref(false);
const showMarkAllArrivedModal = ref(false);
const showShippingLabelModal = ref(false);
const selectedLabelBox = ref(null);
const selectedLabelBoxIndex = ref(1);
const showJesusMessageModal = ref(false);
const showArrivalImageModal = ref(false);
const imageZoomed = ref(false);
const selectedItem = ref(null);
const markingAllArrived = ref(false);
const selectedArrivalImage = ref(null);
const uploadingArrivalImage = ref(false);
const skippingArrivalImage = ref(false);

const translations = {
  orderDetails: { es: "Detalles de la Orden", en: "Order Details" },
  loading: { es: "Cargando...", en: "Loading..." },
  editOrder: { es: "Editar Orden", en: "Edit Order" },
  deleteOrder: { es: "Eliminar Orden", en: "Delete Order" },
  crossingOnly: { es: "Solo Cruce", en: "Crossing Only" },
  shipping: { es: "Envío", en: "Shipping" },
  currentStage: { es: "Etapa Actual", en: "Current Stage" },
  waitingForPackages: { es: "Esperando Paquetes", en: "Waiting for Packages" },
  markAllArrived: { es: "Marcar Todos Llegados", en: "Mark All Arrived" },
  startProcessing: { es: "Iniciar Procesamiento", en: "Start Processing" },
  consolidateOrder: { es: "Consolidar Orden", en: "Consolidate Order" },
  awaitingConsolidationPayment: { es: "Esperando Pago", en: "Awaiting Payment" },
  viewInvoice: { es: "Ver Factura", en: "View Invoice" },
  consolidationPayment: { es: "Pago de Cajas", en: "Box Payment" },
  shipOrder: { es: "Enviar Orden", en: "Ship Order" },
  markReadyForPickup: { es: "Listo para Recoger", en: "Ready for Pickup" },
  markAsDelivered: { es: "Marcar Entregado", en: "Mark Delivered" },
  markAsPickedUp: { es: "Marcar Recogido", en: "Mark Picked Up" },
  markAsPaid: { es: "Marcar Pagado", en: "Mark Paid" },
  markPaidManual: { es: "Marcar Pagado", en: "Mark Paid" },
  awaitingPayment: { es: "Listo para recoger! Esperando Pago", en: "Ready for pickup! Awaiting Payment" },
  paymentReceived: { es: "Pago Recibido", en: "Payment Received" },
  orderComplete: { es: "Orden Completada", en: "Order Complete" },
  customerInformation: { es: "Información del Cliente", en: "Customer Information" },
  name: { es: "Nombre", en: "Name" },
  email: { es: "Email", en: "Email" },
  deliveryAddress: { es: "Dirección de Entrega", en: "Delivery Address" },
  pickupLocation: { es: "Ubicación de Recolección", en: "Pickup Location" },
  warehouseName: { es: "Colectivo Las Ferias La Cacho", en: "Colectivo Las Ferias La Cacho" },
  warehouseAddress: { es: "Blvd. Insurgentes #18512, Río Tijuana 3ra Etapa, Tijuana, BC", en: "Blvd. Insurgentes #18512, Río Tijuana 3ra Etapa, Tijuana, BC" },
  getDirections: { es: "Ver en Google Maps", en: "See in Google Maps" },
  orderSummary: { es: "Resumen", en: "Summary" },
  orderNumber: { es: "Orden #", en: "Order #" },
  trackingNumber: { es: "Rastreo #", en: "Tracking #" },
  orderType: { es: "Tipo", en: "Type" },
  totalWeight: { es: "Peso Total", en: "Total Weight" },
  totalBoxWeight: { es: "Peso Cajas", en: "Box Weight" },
  itemsArrived: { es: "Artículos Llegados", en: "Items Arrived" },
  manageItems: { es: "Gestionar", en: "Manage" },
  shippingBoxes: { es: "Cajas de Envío", en: "Shipping Boxes" },
  shippingInfo: { es: "Información de Envío", en: "Shipping Info" },
  boxesWithTracking: { es: "Con guías y documentos GIA", en: "With tracking & GIA documents" },
  trackingAndDocuments: { es: "Guía de rastreo y documento GIA", en: "Tracking & GIA document" },
  boxes: { es: "Cajas", en: "Boxes" },
  box: { es: "Caja", en: "Box" },
  boxLabel: { es: "Caja", en: "Box" },
  singleBox: { es: "Caja de Envío", en: "Shipping Box" },
  boxSize: { es: "Tamaño de Caja", en: "Box Size" },
  boxPrice: { es: "Precio de Caja", en: "Box Price" },
  totalBoxPrice: { es: "Precio Total Cajas", en: "Total Box Price" },
  guiaNumber: { es: "Número de Guía", en: "Guia Number" },
  giaDocument: { es: "Documento GIA", en: "GIA Document" },
  copyGuia: { es: "Copiar guía", en: "Copy guia" },
  notAssigned: { es: "No asignado", en: "Not assigned" },
  noGiaFile: { es: "Sin archivo", en: "No file" },
  financials: { es: "Financieros", en: "Financials" },
  deposit: { es: "Depósito", en: "Deposit" },
  fullPayment: { es: "Pago Completo", en: "Full Payment" },
  finalBalance: { es: "Saldo Final", en: "Final Balance" },
  paid: { es: "PAGADO", en: "PAID" },
  pending: { es: "PENDIENTE", en: "PENDING" },
  invoice: { es: "Factura", en: "Invoice" },
  totalPaid: { es: "Total Pagado", en: "Total Paid" },
  paymentProgress: { es: "Progreso de Pago", en: "Payment Progress" },
  viewOnMap: { es: "Ver en mapa", en: "View on map" },
  copyAddress: { es: "Copiar", en: "Copy" },
  copiedToClipboard: { es: "¡Copiado!", en: "Copied!" },
  cancel: { es: "Cancelar", en: "Cancel" },
  processing: { es: "Procesando...", en: "Processing..." },
  // Mark All Arrived Modal
  markAllArrivedTitle: { es: "Marcar Todos como Llegados", en: "Mark All as Arrived" },
  markAllArrivedSubtitle: { es: "¿Confirmar llegada de todos los artículos?", en: "Confirm arrival of all items?" },
  allItemsArrivedTitle: { es: "¡Todos los artículos llegaron!", en: "All items have arrived!" },
  uploadArrivalImageDesc: { es: "Sube una foto de los paquetes para confirmar y notificar al cliente.", en: "Upload a photo of the packages to confirm and notify the customer." },
  selectImage: { es: "Seleccionar Imagen", en: "Select Image" },
  skipImage: { es: "Omitir", en: "Skip" },
  uploadAndConfirm: { es: "Subir y Confirmar", en: "Upload & Confirm" },
  upload: { es: "Subir", en: "Upload" },
  arrivalProofImage: { es: "Foto de Llegada", en: "Arrival Proof Photo" },
  arrivalImageUploaded: { es: "Foto enviada al cliente", en: "Photo sent to customer" },
  download: { es: "Descargar", en: "Download" },
  viewFullscreen: { es: "Ver en pantalla completa", en: "View fullscreen" },
  close: { es: "Cerrar", en: "Close" },
  replaceImage: { es: "Reemplazar", en: "Replace" },
  noArrivalImage: { es: "Sin foto de llegada", en: "No arrival photo" },
  addArrivalImageHint: { es: "Agrega una foto de los paquetes", en: "Add a photo of the packages" },
  addPhoto: { es: "Agregar Foto", en: "Add Photo" },
  uploadSuccess: { es: "Imagen subida. Cliente notificado.", en: "Image uploaded. Customer notified." },
  uploadError: { es: "Error al subir imagen", en: "Error uploading image" },
  markAllArrivedDesc: { es: "Esta acción marcará todos los artículos pendientes de esta orden como llegados al almacén.", en: "This action will mark all pending items in this order as arrived at the warehouse." },
  itemsWillBeMarked: { es: "artículos serán marcados como llegados", en: "items will be marked as arrived" },
  confirmMarkAllArrived: { es: "Sí, Marcar Todos", en: "Yes, Mark All" },
  markAllArrivedSuccess: { es: "Todos los artículos marcados como llegados", en: "All items marked as arrived" },
  markAllArrivedError: { es: "Error al marcar artículos", en: "Error marking items" },
  // Tracking status
  printLabel: { es: "Imprimir Etiqueta", en: "Print Label" },
  trackingStatus: { es: "Estado de Envío", en: "Shipping Status" },
  trackOnEstafeta: { es: "Rastrear en Estafeta", en: "Track on Estafeta" },
  viewTracking: { es: "Ver Rastreo", en: "View Tracking" },
  statusPending: { es: "Pendiente", en: "Pending" },
  statusInfoReceived: { es: "Info Recibida", en: "Info Received" },
  statusInTransit: { es: "En Tránsito", en: "In Transit" },
  statusOutForDelivery: { es: "En Reparto", en: "Out for Delivery" },
  statusDelivered: { es: "Entregado", en: "Delivered" },
  statusAttemptFail: { es: "Intento Fallido", en: "Attempt Failed" },
  statusException: { es: "Excepción", en: "Exception" },
  statusExpired: { es: "Expirado", en: "Expired" },
  statusUnknown: { es: "Desconocido", en: "Unknown" },
  loadingTracking: { es: "Cargando rastreo...", en: "Loading tracking..." },
  noTrackingInfo: { es: "Sin info de rastreo", en: "No tracking info" },
  lastUpdate: { es: "Última actualización", en: "Last update" },
  refreshTracking: { es: "Actualizar", en: "Refresh" },
  clickToTrack: { es: "Click para rastrear", en: "Click to track" },
};

const t = createTranslations(translations);

// Helper: Check if this is a crossing order
const isCrossing = computed(() => order.value?.order_type === 'crossing');

// Check if order has boxes array with data (NEW structure)
const hasBoxes = computed(() => {
  return order.value?.boxes && order.value.boxes.length > 0;
});

// Check if order has legacy shipping info (OLD structure - guia/gia at order level)
const hasLegacyShippingInfo = computed(() => {
  return order.value?.guia_number || order.value?.gia_url;
});

// Items arrival tracking
const totalItemsCount = computed(() => order.value?.items?.length || 0);
const arrivedItemsCount = computed(() => order.value?.items?.filter(item => item.arrived)?.length || 0);
const pendingItemsCount = computed(() => totalItemsCount.value - arrivedItemsCount.value);
const hasPendingItems = computed(() => pendingItemsCount.value > 0);
const allItemsArrived = computed(() => totalItemsCount.value > 0 && pendingItemsCount.value === 0);
const arrivalProgress = computed(() => {
  if (totalItemsCount.value === 0) return 0;
  return Math.round((arrivedItemsCount.value / totalItemsCount.value) * 100);
});

// SVG icons for next action buttons
const icons = {
  checkAll: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
  consolidate: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>',
  play: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
  ship: '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>',
  warehouse: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"/></svg>',
  check: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>',
  money: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
};

// Compute next action button for header
const nextAction = computed(() => {
  if (!order.value) return null;
  const status = order.value.status;
  const crossing = isCrossing.value;

  // awaiting_packages + has pending items → Mark All Arrived
  if (status === 'awaiting_packages' && hasPendingItems.value) {
    return {
      label: t.value.markAllArrived,
      color: 'bg-teal-600 hover:bg-teal-700',
      iconSvg: icons.checkAll,
      action: 'markAllArrived',
    };
  }

  // packages_complete → Consolidate (shipping) or Start Processing (crossing)
  if (status === 'packages_complete') {
    if (crossing) {
      return {
        label: t.value.startProcessing,
        color: 'bg-primary-600 hover:bg-primary-700',
        iconSvg: icons.play,
        action: 'startProcessing',
      };
    } else {
      return {
        label: t.value.consolidateOrder,
        color: 'bg-purple-600 hover:bg-purple-700',
        iconSvg: icons.consolidate,
        action: 'consolidate',
      };
    }
  }

  // awaiting_payment → Mark as Paid (manual payment confirmation)
  if (status === 'awaiting_payment' && !order.value.paid_at) {
    return {
      label: t.value.markAsPaid,
      color: 'bg-green-600 hover:bg-green-700',
      iconSvg: icons.money,
      action: 'markPaid',
    };
  }

  // processing/paid → Ship Order (shipping) or Mark Ready for Pickup (crossing)
  if (['processing', 'paid'].includes(status)) {
    if (crossing) {
      return {
        label: t.value.markReadyForPickup,
        color: 'bg-amber-600 hover:bg-amber-700',
        iconSvg: icons.warehouse,
        action: 'readyForPickup',
      };
    } else {
      return {
        label: t.value.shipOrder,
        color: 'bg-indigo-600 hover:bg-indigo-700',
        iconSvg: icons.ship,
        action: 'shipOrder',
      };
    }
  }

  // shipped → Mark as Delivered (shipping) or Mark as Picked Up (crossing + paid)
  if (status === 'shipped') {
    if (!crossing) {
      return {
        label: t.value.markAsDelivered,
        color: 'bg-green-600 hover:bg-green-700',
        iconSvg: icons.check,
        action: 'markDelivered',
      };
    } else if (order.value.paid_at) {
      return {
        label: t.value.markAsPickedUp,
        color: 'bg-green-600 hover:bg-green-700',
        iconSvg: icons.check,
        action: 'markDelivered',
      };
    }
  }

  return null;
});

// Handle next action button click
const handleNextAction = () => {
  if (!nextAction.value) return;

  switch (nextAction.value.action) {
    case 'markAllArrived':
      showMarkAllArrivedModal.value = true;
      break;
    case 'startProcessing':
      showStartProcessingModal.value = true;
      break;
    case 'consolidate':
      showConsolidateModal.value = true;
      break;
    case 'shipOrder':
      showShipOrderModal.value = true;
      break;
    case 'readyForPickup':
      showReadyForPickupModal.value = true;
      break;
    case 'markDelivered':
      showMarkDeliveredModal.value = true;
      break;
    case 'markPaid':
      showMarkPaidModal.value = true;
      break;
  }
};

const totalBoxPrice = computed(() => {
  if (!order.value) return 0;
  
  // New structure: sum up boxes array
  if (hasBoxes.value) {
    return order.value.boxes.reduce((sum, box) => sum + parseFloat(box.box_price || 0), 0);
  }
  
  // Legacy structure: use order-level box_price
  return parseFloat(order.value.box_price) || 0;
});

// Check if payment is complete based on order type
const isPaymentComplete = computed(() => {
  if (!order.value) return false;
  return !!order.value.paid_at;
});

// Check if deposit/initial payment is complete
const isInitialPaymentComplete = computed(() => {
  if (!order.value) return false;
  
  if (isCrossing.value) {
    return !!order.value.paid_at;
  } else {
    return !!order.value.deposit_paid_at;
  }
});

const actualAmountPaid = computed(() => {
  if (!order.value) return 0;
  
  if (order.value.amount_paid > 0) {
    return parseFloat(order.value.amount_paid);
  }
  
  if (isCrossing.value) {
    if (order.value.paid_at && order.value.deposit_amount) {
      return parseFloat(order.value.deposit_amount);
    }
  } else {
    let total = 0;
    
    if (order.value.deposit_paid_at && order.value.deposit_amount) {
      total += parseFloat(order.value.deposit_amount);
    }
    
    if (order.value.paid_at && order.value.quoted_amount) {
      total += parseFloat(order.value.quoted_amount);
    }
    
    return total;
  }
  
  return 0;
});

const paymentPercentage = computed(() => {
  if (!order.value) return 0;
  
  const totalDue = parseFloat(order.value.box_price || 0) + 
    (order.value.quote_breakdown?.reduce((s, i) => s + i.amount, 0) || 0);
  
  if (totalDue <= 0) return 0;
  
  const paid = actualAmountPaid.value;
  return Math.min(100, Math.round((paid / totalDue) * 100));
});

const showTotalPaid = computed(() => {
  if (!order.value) return false;
  
  const hasPaymentData = order.value.deposit_amount || order.value.quoted_amount;
  const hasPayment = isCrossing.value ? order.value.paid_at : (order.value.deposit_paid_at || order.value.paid_at);
  
  return hasPaymentData && hasPayment;
});

const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    $toast.success(t.value.copiedToClipboard);
  } catch (err) {
    console.error("Failed to copy:", err);
  }
};

// Open shipping label modal for a specific box
const openBoxLabel = (box, boxIndex) => {
  selectedLabelBox.value = box;
  selectedLabelBoxIndex.value = boxIndex;
  showShippingLabelModal.value = true;
};

const fetchOrder = async () => {
  loading.value = true;
  trackingData.value = {};
  try {
    const response = await $customFetch(`/admin/orders/${route.params.id}`);
    order.value = response.data;
  } catch (error) {
    $toast.error("Error loading order");
    router.push("/app/admin/orders");
  } finally {
    loading.value = false;
  }
};

const handleArrivalImageSelect = (event) => {
  const file = event.target.files?.[0];
  if (file) {
    selectedArrivalImage.value = file;
  }
};

// Auto-upload handler for replace image scenario
const handleReplaceImageSelect = async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  uploadingArrivalImage.value = true;
  try {
    const formData = new FormData();
    formData.append('arrival_image', file);

    await $customFetch(`/admin/orders/${route.params.id}/arrival-image`, {
      method: 'POST',
      body: formData
    });

    $toast.success(t.value.uploadSuccess);
    await fetchOrder();
  } catch (error) {
    $toast.error(error.data?.message || t.value.uploadError);
  } finally {
    uploadingArrivalImage.value = false;
    event.target.value = ''; // Reset input
  }
};

const uploadArrivalImage = async () => {
  if (!selectedArrivalImage.value) return;
  uploadingArrivalImage.value = true;
  try {
    const formData = new FormData();
    formData.append('arrival_image', selectedArrivalImage.value);

    await $customFetch(`/admin/orders/${route.params.id}/arrival-image`, {
      method: 'POST',
      body: formData
    });

    $toast.success(t.value.uploadSuccess);
    selectedArrivalImage.value = null;
    await fetchOrder();
  } catch (error) {
    $toast.error(error.data?.message || t.value.uploadError);
  } finally {
    uploadingArrivalImage.value = false;
  }
};

const skipArrivalImage = async () => {
  skippingArrivalImage.value = true;
  try {
    await $customFetch(`/admin/orders/${route.params.id}/status`, {
      method: 'PUT',
      body: { status: 'packages_complete' }
    });
    await fetchOrder();
  } catch (error) {
    $toast.error(error.data?.message || t.value.error);
  } finally {
    skippingArrivalImage.value = false;
  }
};

const downloadArrivalImage = async () => {
  if (!order.value?.arrival_image_url) return;

  try {
    const response = await fetch(order.value.arrival_image_url);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `order-${order.value.id}-arrival-proof.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download error:', error);
    // Fallback: open in new tab
    window.open(order.value.arrival_image_url, '_blank');
  }
};

const handleModalSuccess = async () => {
  showStartProcessingModal.value = false;
  showConsolidateModal.value = false;
  showShipOrderModal.value = false;
  showReadyForPickupModal.value = false;
  showMarkDeliveredModal.value = false;
  showFinalInvoiceModal.value = false;
  showMarkPaidModal.value = false;
  showMarkArrivedModal.value = false;
  showMarkAllArrivedModal.value = false;
  await fetchOrder();
};

const handleMarkAllArrived = async () => {
  markingAllArrived.value = true;
  try {
    const response = await $customFetch(`/admin/orders/${order.value.id}/items/mark-all-arrived`, {
      method: 'PUT',
    });
    
    if (response.success) {
      $toast.success(t.value.markAllArrivedSuccess);
      await handleModalSuccess();
    }
  } catch (error) {
    console.error(error);
    $toast.error(t.value.markAllArrivedError);
  } finally {
    markingAllArrived.value = false;
  }
};

const openMarkArrivedModal = (item) => {
  selectedItem.value = item;
  showMarkArrivedModal.value = true;
};

const closeMarkArrivedModal = () => {
  showMarkArrivedModal.value = false;
  selectedItem.value = null;
};

const openDeleteModal = () => {
  showActionsMenu.value = false;
  showDeleteModal.value = true;
};

const getStatusColor = (status) => {
  const colors = {
    collecting: "bg-primary-100 text-primary-700",
    awaiting_packages: "bg-amber-100 text-amber-700",
    packages_complete: "bg-primary-100 text-primary-700",
    processing: "bg-primary-100 text-primary-700",
    shipped: "bg-indigo-100 text-indigo-700",
    delivered: "bg-green-100 text-green-700",
    awaiting_payment: "bg-orange-100 text-orange-700",
    paid: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };
  return colors[status] || "bg-gray-100 text-gray-700";
};

const getStatusLabel = (status) => {
  return status ? status.replace(/_/g, " ").toUpperCase() : "";
};

const getBoxSizeColor = (size) => {
  const colors = {
    "extra-small": "bg-gray-100 text-gray-600",
    small: "bg-blue-100 text-blue-600",
    medium: "bg-green-100 text-green-600",
    large: "bg-amber-100 text-amber-600",
    "extra-large": "bg-red-100 text-red-600",
  };
  return colors[size] || "bg-gray-100 text-gray-600";
};

const formatBoxSizeLabel = (size) => {
  const labels = { "extra-small": "XS", small: "S", medium: "M", large: "L", "extra-large": "XL" };
  return labels[size] || size;
};

const formatBoxSizeLabelFull = (size) => {
  const labels = {
    "extra-small": "XS - Extra Small",
    small: "S - Small",
    medium: "M - Medium",
    large: "L - Large",
    "extra-large": "XL - Extra Large",
  };
  return labels[size] || size || "";
};

const formatAddress = (address) => {
  if (!address) return "-";
  if (address.full_address) return address.full_address;
  return [address.street, address.exterior_number, address.colonia, address.municipio, address.estado, address.postal_code].filter(Boolean).join(", ") || "-";
};

// Tracking helper functions
const getTrackingStatusLabel = (status) => {
  const statusMap = {
    'Pending': t.value.statusPending,
    'InfoReceived': t.value.statusInfoReceived,
    'InTransit': t.value.statusInTransit,
    'OutForDelivery': t.value.statusOutForDelivery,
    'AttemptFail': t.value.statusAttemptFail,
    'Delivered': t.value.statusDelivered,
    'AvailableForPickup': t.value.statusDelivered,
    'Exception': t.value.statusException,
    'Expired': t.value.statusExpired
  };
  return statusMap[status] || t.value.statusUnknown;
};

const getTrackingStatusColor = (status) => {
  const colors = {
    'Pending': 'bg-gray-100 text-gray-700 border-gray-200',
    'InfoReceived': 'bg-yellow-50 text-yellow-700 border-yellow-200',
    'InTransit': 'bg-blue-50 text-blue-700 border-blue-200',
    'OutForDelivery': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'AttemptFail': 'bg-orange-50 text-orange-700 border-orange-200',
    'Delivered': 'bg-green-50 text-green-700 border-green-200',
    'AvailableForPickup': 'bg-cyan-50 text-cyan-700 border-cyan-200',
    'Exception': 'bg-red-50 text-red-700 border-red-200',
    'Expired': 'bg-gray-100 text-gray-500 border-gray-200'
  };
  return colors[status] || 'bg-gray-100 text-gray-600 border-gray-200';
};

const getTrackingStatusIcon = (status) => {
  // Returns SVG path for status icon
  const icons = {
    'Pending': 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', // clock
    'InfoReceived': 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', // info
    'InTransit': 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4', // arrows right
    'OutForDelivery': 'M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0', // truck
    'AttemptFail': 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z', // warning
    'Delivered': 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', // check circle
    'AvailableForPickup': 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', // building
    'Exception': 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z', // x circle
    'Expired': 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' // clock
  };
  return icons[status] || icons['Pending'];
};

const getBoxTrackingInfo = (guiaNumber) => {
  if (!guiaNumber || !trackingData.value[guiaNumber]) return null;
  return trackingData.value[guiaNumber];
};

const formatTrackingDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-MX', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Refresh tracking for a single guia number
const refreshTracking = async (guiaNumber) => {
  if (!guiaNumber) return;

  trackingLoadingMap.value[guiaNumber] = true;

  try {
    const response = await $customFetch('/shipment-tracking/track', {
      method: 'POST',
      body: {
        tracking_number: guiaNumber
      }
    });

    if (response.success && response.data) {
      trackingData.value[guiaNumber] = response.data;
    }
  } catch (error) {
    console.error('Error fetching tracking data:', error);
  } finally {
    trackingLoadingMap.value[guiaNumber] = false;
  }
};

const isTrackingLoading = (guiaNumber) => {
  return trackingLoadingMap.value[guiaNumber] === true;
};

onMounted(() => {
  fetchOrder();
});
</script>