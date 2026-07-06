<template>
  <section
    class="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/20"
  >
    <!-- Header -->
    <div
      class="bg-white/90 backdrop-blur-sm shadow-sm border-b border-gray-100"
    >
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3 sm:gap-4">
            <NuxtLink
              :to="`/app/admin/orders/${orderId}`"
              class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg
                class="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </NuxtLink>
            <div>
              <h1 class="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900">
                {{ t.editOrder }}
              </h1>
              <p class="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">
                {{ order?.order_number }} - {{ order?.user?.name }}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <!-- Order Type Badge -->
            <span
              v-if="order"
              :class="[
                'px-2 sm:px-3 py-1 rounded-full text-xs font-medium',
                isCrossing ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
              ]"
            >
              {{ isCrossing ? t.crossingType : t.shippingType }}
            </span>

            <!-- Status Badge -->
            <span
              v-if="order"
              :class="[
                'px-2 sm:px-3 py-1 rounded-full text-xs font-medium',
                getStatusColor(order.status),
              ]"
            >
              {{ getStatusLabel(order.status) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-16">
        <div
          class="inline-flex items-center justify-center w-16 h-16 bg-primary-50 rounded-2xl"
        >
          <svg
            class="animate-spin h-8 w-8 text-primary-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>
      </div>

      <!-- Error Alert -->
      <Transition
        enter-active-class="transform ease-out duration-300 transition"
        enter-from-class="translate-y-2 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition ease-in duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="errorMessage"
          class="mb-4 sm:mb-6 bg-red-50 border-l-4 border-red-500 rounded-lg p-3 sm:p-4 shadow-sm animate-shake"
        >
          <div class="flex">
            <div class="flex-shrink-0">
              <svg
                class="w-5 h-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <div class="ml-3 flex-1">
              <p class="text-sm font-medium text-red-800">{{ errorMessage }}</p>
            </div>
            <button @click="errorMessage = ''" class="ml-3 flex-shrink-0">
              <svg
                class="w-5 h-5 text-red-400 hover:text-red-600 transition-colors"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clip-rule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </Transition>

      <!-- Edit Form -->
      <form v-if="order" @submit.prevent="handleSubmit" class="space-y-4 sm:space-y-6">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <!-- Left Column - Main Fields -->
          <div class="lg:col-span-2 space-y-4 sm:space-y-6">
            
            <!-- Order Type Section -->
            <div
              class="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 lg:p-8 animate-fadeIn"
            >
              <h2 class="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">
                {{ t.orderType }}
              </h2>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <!-- Shipping Option -->
                <label
                  :class="[
                    'relative flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all',
                    form.order_type === 'shipping'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  ]"
                >
                  <input
                    v-model="form.order_type"
                    type="radio"
                    value="shipping"
                    class="sr-only"
                  />
                  <div class="flex items-center gap-3">
                    <div
                      :class="[
                        'w-10 h-10 rounded-lg flex items-center justify-center',
                        form.order_type === 'shipping' ? 'bg-blue-100' : 'bg-gray-100'
                      ]"
                    >
                      <svg
                        :class="[
                          'w-5 h-5',
                          form.order_type === 'shipping' ? 'text-blue-600' : 'text-gray-500'
                        ]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
                        />
                      </svg>
                    </div>
                    <div>
                      <p
                        :class="[
                          'font-semibold text-sm',
                          form.order_type === 'shipping' ? 'text-blue-900' : 'text-gray-900'
                        ]"
                      >
                        {{ t.shippingTypeLabel }}
                      </p>
                      <p class="text-xs text-gray-500 mt-0.5">100% {{ t.fullPayment }}</p>
                    </div>
                  </div>
                  <div
                    v-if="form.order_type === 'shipping'"
                    class="absolute top-2 right-2"
                  >
                    <svg class="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </div>
                </label>

                <!-- Crossing Option -->
                <label
                  :class="[
                    'relative flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all',
                    form.order_type === 'crossing'
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-gray-200 hover:border-gray-300'
                  ]"
                >
                  <input
                    v-model="form.order_type"
                    type="radio"
                    value="crossing"
                    class="sr-only"
                  />
                  <div class="flex items-center gap-3">
                    <div
                      :class="[
                        'w-10 h-10 rounded-lg flex items-center justify-center',
                        form.order_type === 'crossing' ? 'bg-amber-100' : 'bg-gray-100'
                      ]"
                    >
                      <svg
                        :class="[
                          'w-5 h-5',
                          form.order_type === 'crossing' ? 'text-amber-600' : 'text-gray-500'
                        ]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="1.5"
                          d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p
                        :class="[
                          'font-semibold text-sm',
                          form.order_type === 'crossing' ? 'text-amber-900' : 'text-gray-900'
                        ]"
                      >
                        {{ t.crossingTypeLabel }}
                      </p>
                      <p class="text-xs text-gray-500 mt-0.5">100% {{ t.fullPayment }}</p>
                    </div>
                  </div>
                  <div
                    v-if="form.order_type === 'crossing'"
                    class="absolute top-2 right-2"
                  >
                    <svg class="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </div>
                </label>
              </div>

              <!-- Crossing Pickup Info -->
              <Transition
                enter-active-class="transition ease-out duration-200"
                enter-from-class="opacity-0 -translate-y-2"
                enter-to-class="opacity-100 translate-y-0"
                leave-active-class="transition ease-in duration-150"
                leave-from-class="opacity-100 translate-y-0"
                leave-to-class="opacity-0 -translate-y-2"
              >
                <div
                  v-if="isCrossing"
                  class="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl"
                >
                  <div class="flex items-start gap-3">
                    <div class="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"/>
                      </svg>
                    </div>
                    <div>
                      <p class="font-semibold text-amber-900 text-sm">{{ t.crossingPickupInfo }}</p>
                      <p class="text-xs text-amber-700 mt-1">{{ t.crossingPickupAddress }}</p>
                      <a
                        href="https://maps.app.goo.gl/4SsEVjy2D4noFM9n8"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="inline-flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 mt-2 font-medium"
                      >
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Ver en Google Maps
                      </a>
                    </div>
                  </div>
                </div>
              </Transition>
            </div>

            <!-- Basic Order Info -->
            <div
              class="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 lg:p-8 animate-fadeIn"
              style="animation-delay: 0.05s"
            >
              <h2 class="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">
                {{ t.orderInformation }}
              </h2>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <!-- Status -->
                <div>
                  <label
                    for="status"
                    class="block text-sm font-semibold text-gray-900 mb-2"
                  >
                    {{ t.statusLabel }}
                  </label>
                  <select
                    v-model="form.status"
                    id="status"
                    class="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border border-gray-200 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="collecting">{{ t.collecting }}</option>
                    <option value="awaiting_packages">{{ t.awaitingPackages }}</option>
                    <option value="packages_complete">{{ t.packagesComplete }}</option>
                    <option value="awaiting_payment">{{ t.awaitingPayment }}</option>
                    <option value="paid">{{ t.paidStatus }}</option>
                    <option value="shipped">{{ isCrossing ? t.readyForPickup : t.shipped }}</option>
                    <option value="delivered">{{ isCrossing ? t.pickedUp : t.delivered }}</option>
                    <option value="cancelled">{{ t.cancelled }}</option>
                  </select>
                </div>

                <!-- Weight Fields -->
                <div class="sm:col-span-2 space-y-3">
                  <label class="block text-sm font-semibold text-gray-900">
                    {{ t.weightSectionLabel }}
                  </label>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <!-- Total Box Weight (calculated, read-only) -->
                    <div>
                      <label class="block text-xs font-medium text-gray-500 mb-1">
                        {{ t.totalBoxWeightLabel }}
                      </label>
                      <div class="relative">
                        <input
                          :value="order?.total_box_weight || calculatedBoxWeight"
                          type="text"
                          disabled
                          class="w-full px-3 py-2.5 pr-12 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-600 cursor-not-allowed"
                        />
                        <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span class="text-gray-400 text-xs">kg</span>
                        </div>
                      </div>
                      <p class="text-xs text-gray-400 mt-1">{{ t.autoCalculated }}</p>
                    </div>

                    <!-- Total Weight (manual override) -->
                    <div>
                      <label for="total_weight" class="block text-xs font-medium text-gray-500 mb-1">
                        {{ t.totalWeightLabel }}
                      </label>
                      <div class="relative">
                        <input
                          v-model.number="form.total_weight"
                          type="number"
                          step="0.01"
                          id="total_weight"
                          placeholder="0.00"
                          class="w-full px-3 py-2.5 pr-12 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        />
                        <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span class="text-gray-500 text-xs">kg</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Declared Value -->
                <div class="sm:col-span-2">
                  <label
                    for="declared_value"
                    class="block text-sm font-semibold text-gray-900 mb-2"
                  >
                    {{ t.declaredValueLabel }}
                  </label>
                  <div class="relative">
                    <input
                      v-model.number="form.declared_value"
                      type="number"
                      step="0.01"
                      id="declared_value"
                      placeholder="0.00"
                      class="w-full px-3 sm:px-4 py-2.5 sm:py-3 pl-7 sm:pl-8 rounded-lg sm:rounded-xl border border-gray-200 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    />
                    <div
                      class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                    >
                      <span class="text-gray-500">$</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Boxes Section -->
            <div
              :class="[
                'bg-white rounded-xl sm:rounded-2xl shadow-sm border p-4 sm:p-6 lg:p-8 animate-fadeIn',
                isCrossing ? 'border-amber-200' : 'border-indigo-200'
              ]"
              style="animation-delay: 0.1s"
            >
              <!-- Section Header -->
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
                <div class="flex items-center gap-3">
                  <div :class="['p-2 rounded-lg', isCrossing ? 'bg-amber-100' : 'bg-indigo-100']">
                    <svg
                      :class="['w-5 h-5', isCrossing ? 'text-amber-600' : 'text-indigo-600']"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 class="text-lg sm:text-xl font-bold text-gray-900">
                      {{ t.boxes }}
                    </h2>
                    <p class="text-xs sm:text-sm text-gray-500">
                      {{ t.boxesDescription }}
                    </p>
                  </div>
                </div>

                <!-- Box Count Badge -->
                <span
                  v-if="form.boxes.length > 0"
                  :class="[
                    'self-start sm:self-auto px-3 py-1 text-sm font-semibold rounded-full',
                    isCrossing ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'
                  ]"
                >
                  {{ form.boxes.length }} {{ form.boxes.length === 1 ? t.box : t.boxesLabel }}
                </span>
              </div>

              <!-- Box List -->
              <div v-if="form.boxes.length > 0" class="space-y-4 mb-4">
                <div
                  v-for="(box, index) in form.boxes"
                  :key="box.id || index"
                  class="p-4 bg-gray-50 rounded-xl border border-gray-200"
                >
                  <!-- Box Header Row -->
                  <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center gap-3">
                      <div
                        class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        :class="getBoxSizeColorClass(box.box_size)"
                      >
                        <svg
                          class="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                          />
                        </svg>
                      </div>
                      <div class="min-w-0">
                        <p class="font-semibold text-gray-900 text-sm sm:text-base">
                          {{ t.boxLabel }} {{ index + 1 }}: {{ box.box_name }}
                        </p>
                        <p class="text-xs sm:text-sm text-gray-500">
                          {{ formatBoxSizeLabel(box.box_size) }} · <span class="font-medium text-gray-700">${{ formatNumber(box.box_price) }}</span>
                        </p>
                      </div>
                    </div>

                    <!-- Remove Button -->
                    <button
                      type="button"
                      @click="removeBox(index)"
                      class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                    >
                      <svg
                        class="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>

                  <!-- Box Dimensions & Weight -->
                  <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-gray-200">
                    <div>
                      <label class="block text-xs font-medium text-gray-600 mb-1">{{ t.lengthLabel }}</label>
                      <input
                        v-model.number="box.length"
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="cm"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-gray-600 mb-1">{{ t.widthLabel }}</label>
                      <input
                        v-model.number="box.width"
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="cm"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-gray-600 mb-1">{{ t.heightLabel }}</label>
                      <input
                        v-model.number="box.height"
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="cm"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-gray-600 mb-1">{{ t.weightLabel }}</label>
                      <input
                        v-model.number="box.weight"
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="kg"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  <!-- Shipping Details (Guia & GIA) - Only for shipping orders -->
                  <div v-if="!isCrossing" class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-gray-200">
                    <!-- Guia Number -->
                    <div>
                      <label class="block text-xs font-medium text-gray-600 mb-1">
                        {{ t.guiaNumberLabel }}
                      </label>
                      <input
                        v-model="box.guia_number"
                        type="text"
                        placeholder="1234567890"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <!-- GIA Document -->
                    <div>
                      <label class="block text-xs font-medium text-gray-600 mb-1">
                        {{ t.giaDocument }}
                      </label>

                      <!-- Show existing GIA file -->
                      <div v-if="box.gia_url" class="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                        <svg class="w-4 h-4 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd"/>
                        </svg>
                        <span class="text-xs text-green-800 truncate flex-1" :title="box.gia_filename">
                          {{ box.gia_filename || 'GIA.pdf' }}
                        </span>
                        <a
                          :href="box.gia_url"
                          target="_blank"
                          class="p-1 text-green-600 hover:text-green-800 hover:bg-green-100 rounded transition-colors"
                          :title="t.downloadGia"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                          </svg>
                        </a>
                      </div>

                      <!-- Upload new GIA file -->
                      <div v-else class="flex items-center gap-2">
                        <input
                          type="file"
                          @change="(e) => handleGiaFileChange(e, index)"
                          accept=".pdf"
                          class="w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                        />
                      </div>

                      <!-- Show pending upload -->
                      <p v-if="box.new_gia_file" class="text-xs text-blue-600 mt-1 flex items-center gap-1">
                        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                        </svg>
                        {{ t.pendingUpload }}: {{ box.new_gia_file.name }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Empty State -->
              <div v-else class="text-center py-6 sm:py-8 mb-4">
                <div class="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <svg class="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                  </svg>
                </div>
                <p class="text-sm text-gray-500 mb-1">{{ t.noBoxesYet }}</p>
                <p class="text-xs text-gray-400">{{ t.addBoxToStart }}</p>
              </div>

              <!-- Add Box Button -->
              <button
                type="button"
                @click="showAddBoxModal = true"
                :class="[
                  'w-full py-3 border-2 border-dashed rounded-lg sm:rounded-xl transition-all flex items-center justify-center gap-2 text-sm sm:text-base',
                  isCrossing 
                    ? 'border-gray-300 text-gray-500 hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50'
                    : 'border-gray-300 text-gray-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50'
                ]"
              >
                <svg
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                {{ t.addBox }}
              </button>

              <!-- Totals -->
              <div v-if="form.boxes.length > 0" class="mt-4 sm:mt-6 pt-4 border-t border-gray-200">
                <div class="flex justify-between items-center mb-2">
                  <span class="text-sm text-gray-600">{{ t.totalBoxPrice }}:</span>
                  <span class="text-lg font-bold text-gray-900">${{ formatNumber(calculatedTotalBoxPrice) }}</span>
                </div>
                <!-- Shipping: 50% deposit -->
                <div v-if="!isCrossing" class="flex justify-between items-center">
                  <span class="text-sm text-indigo-600 font-medium">{{ t.depositAmount }} (50%):</span>
                  <span class="text-lg font-bold text-indigo-600">${{ formatNumber(calculatedTotalBoxPrice * 0.5) }}</span>
                </div>
                <!-- Crossing: 100% full payment -->
                <div v-else class="flex justify-between items-center">
                  <span class="text-sm text-amber-600 font-medium">{{ t.fullPayment }} (100%):</span>
                  <span class="text-lg font-bold text-amber-600">${{ formatNumber(calculatedTotalBoxPrice) }}</span>
                </div>
              </div>
            </div>

            <!-- Financial Information -->
            <div
              class="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 lg:p-8 animate-fadeIn"
              style="animation-delay: 0.15s"
            >
              <h2 class="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">
                {{ t.financialInformation }}
              </h2>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <!-- Deposit/Full Payment Amount -->
                <div>
                  <label
                    for="deposit_amount"
                    class="block text-sm font-semibold text-gray-900 mb-2"
                  >
                    {{ isCrossing ? t.fullPaymentAmountLabel : t.depositAmountLabel }} {{ isCrossing ? '(100%)' : '(50%)' }}
                  </label>
                  <div class="relative">
                    <input
                      v-model.number="form.deposit_amount"
                      type="number"
                      step="0.01"
                      id="deposit_amount"
                      :class="[
                        'w-full px-3 sm:px-4 py-2.5 sm:py-3 pl-7 sm:pl-8 rounded-lg sm:rounded-xl border text-sm sm:text-base focus:outline-none focus:ring-2',
                        isCrossing 
                          ? 'border-amber-200 bg-amber-50 focus:ring-amber-500'
                          : 'border-blue-200 bg-blue-50 focus:ring-blue-500'
                      ]"
                    />
                    <div
                      class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                    >
                      <span :class="isCrossing ? 'text-amber-500' : 'text-blue-500'">$</span>
                    </div>
                  </div>
                </div>

                <!-- Total Paid -->
                <div>
                  <label
                    for="amount_paid"
                    class="block text-sm font-semibold text-gray-900 mb-2"
                  >
                    {{ t.amountPaidLabel }}
                  </label>
                  <div class="relative">
                    <input
                      v-model.number="form.amount_paid"
                      type="number"
                      step="0.01"
                      id="amount_paid"
                      class="w-full px-3 sm:px-4 py-2.5 sm:py-3 pl-7 sm:pl-8 rounded-lg sm:rounded-xl border border-green-200 bg-green-50 font-bold text-green-700 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <div
                      class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                    >
                      <span class="text-green-500">$</span>
                    </div>
                  </div>
                  <p class="text-xs text-gray-500 mt-1">
                    {{ t.updatedViaStripe }}
                  </p>
                </div>
              </div>

              <!-- Payment location — which account the payment goes to (War Chest) -->
              <div class="mt-4 sm:mt-6">
                <label class="block text-sm font-semibold text-gray-900 mb-2">{{ t.paidLocationLabel }}</label>
                <div class="flex flex-wrap gap-2">
                  <button
                    type="button"
                    @click="form.paid_location = ''"
                    :class="[
                      'px-4 py-2.5 rounded-lg sm:rounded-xl text-sm font-medium border transition-colors',
                      !form.paid_location ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    ]"
                  >
                    {{ t.paidLocationNone }}
                  </button>
                  <button
                    v-for="pm in paymentMethods"
                    :key="pm"
                    type="button"
                    @click="form.paid_location = pm"
                    :class="[
                      'px-4 py-2.5 rounded-lg sm:rounded-xl text-sm font-medium border transition-colors',
                      form.paid_location === pm ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    ]"
                  >
                    {{ pm }}
                  </button>
                </div>
                <p class="text-xs text-gray-500 mt-1.5">{{ t.paidLocationHint }}</p>
              </div>

              <!-- Payment Summary -->
              <div
                v-if="calculatedTotalBoxPrice > 0"
                class="mt-4 sm:mt-6 p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl"
              >
                <h3 class="text-sm font-semibold text-gray-700 mb-3">
                  {{ t.paymentSummary }}
                </h3>
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span class="text-gray-600">{{ t.totalBoxPrice }}:</span>
                    <span class="font-medium">${{ formatNumber(calculatedTotalBoxPrice) }}</span>
                  </div>
                  <!-- Shipping: Show deposit -->
                  <div v-if="!isCrossing" class="flex justify-between text-blue-600">
                    <span>{{ t.depositAmount }} (50%):</span>
                    <span class="font-medium">${{ formatNumber(form.deposit_amount || 0) }}</span>
                  </div>
                  <!-- Crossing: Show full payment -->
                  <div v-else class="flex justify-between text-amber-600">
                    <span>{{ t.fullPayment }} (100%):</span>
                    <span class="font-medium">${{ formatNumber(form.deposit_amount || 0) }}</span>
                  </div>
                  <div class="flex justify-between pt-2 border-t border-gray-200 text-green-600 font-bold">
                    <span>{{ t.totalPaid }}:</span>
                    <span>${{ formatNumber(form.amount_paid || 0) }}</span>
                  </div>
                </div>
                <!-- Crossing note -->
                <p v-if="isCrossing" class="text-xs text-amber-600 mt-3">
                  {{ t.fullPaymentNote }}
                </p>
              </div>
            </div>

            <!-- Delivery Address Section - ONLY FOR SHIPPING -->
            <div
              v-if="!isCrossing"
              class="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 lg:p-8 animate-fadeIn"
              style="animation-delay: 0.2s"
            >
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
                <h2 class="text-lg sm:text-xl font-bold text-gray-900">
                  {{ t.deliveryAddressTitle }}
                </h2>

                <!-- Simple Address Toggle -->
                <label class="flex items-center gap-2 cursor-pointer">
                  <span class="text-xs sm:text-sm text-gray-600">{{ t.simpleMode }}</span>
                  <button
                    type="button"
                    @click="useSimpleAddress = !useSimpleAddress"
                    :class="[
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                      useSimpleAddress ? 'bg-primary-600' : 'bg-gray-200',
                    ]"
                  >
                    <span
                      :class="[
                        'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                        useSimpleAddress ? 'translate-x-6' : 'translate-x-1',
                      ]"
                    />
                  </button>
                </label>
              </div>

              <!-- Simple Address Mode -->
              <div v-if="useSimpleAddress" class="space-y-4">
                <div>
                  <label
                    for="full_address"
                    class="block text-sm font-semibold text-gray-900 mb-2"
                  >
                    {{ t.fullAddressLabel }}
                  </label>
                  <textarea
                    v-model="form.delivery_address.full_address"
                    id="full_address"
                    rows="3"
                    :placeholder="t.fullAddressPlaceholder"
                    class="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border border-gray-200 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 resize-none"
                  ></textarea>
                  <p class="text-xs text-gray-500 mt-1">
                    {{ t.fullAddressHint }}
                  </p>
                </div>

                <!-- Rural Checkbox in Simple Mode -->
                <div class="bg-yellow-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-yellow-200">
                  <label class="flex items-start gap-3 cursor-pointer">
                    <input
                      v-model="form.is_rural"
                      type="checkbox"
                      class="mt-1 h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                    />
                    <div class="flex-1">
                      <span class="text-sm font-semibold text-gray-900">{{ t.ruralAreaLabel }}</span>
                      <p class="text-xs sm:text-sm text-gray-600 mt-1">
                        {{ t.ruralAreaDescription }}
                      </p>
                      <div v-if="form.is_rural" class="mt-2">
                        <label class="block text-xs font-medium text-yellow-700 mb-1">{{ t.ruralSurchargeLabel }}</label>
                        <div class="relative">
                          <input
                            v-model.number="form.rural_surcharge"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            class="w-full px-3 py-2 pl-6 rounded-lg border border-yellow-300 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                          />
                          <div class="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                            <span class="text-yellow-600 text-sm">$</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <!-- Detailed Address Mode -->
              <div v-else class="space-y-4">
                <!-- Street -->
                <div>
                  <label
                    for="street"
                    class="block text-sm font-semibold text-gray-900 mb-2"
                  >
                    {{ t.streetLabel }}
                  </label>
                  <input
                    v-model="form.delivery_address.street"
                    type="text"
                    id="street"
                    :placeholder="t.streetPlaceholder"
                    class="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border border-gray-200 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                <!-- Numbers -->
                <div class="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label
                      for="exterior_number"
                      class="block text-sm font-semibold text-gray-900 mb-2"
                    >
                      {{ t.exteriorNumberLabel }}
                    </label>
                    <input
                      v-model="form.delivery_address.exterior_number"
                      type="text"
                      id="exterior_number"
                      :placeholder="t.exteriorNumberPlaceholder"
                      class="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border border-gray-200 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label
                      for="interior_number"
                      class="block text-sm font-semibold text-gray-900 mb-2"
                    >
                      {{ t.interiorNumberLabel }}
                    </label>
                    <input
                      v-model="form.delivery_address.interior_number"
                      type="text"
                      id="interior_number"
                      :placeholder="t.interiorNumberPlaceholder"
                      class="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border border-gray-200 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </div>

                <!-- Colonia and Municipio -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label
                      for="colonia"
                      class="block text-sm font-semibold text-gray-900 mb-2"
                    >
                      {{ t.coloniaLabel }}
                    </label>
                    <input
                      v-model="form.delivery_address.colonia"
                      type="text"
                      id="colonia"
                      :placeholder="t.coloniaPlaceholder"
                      class="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border border-gray-200 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label
                      for="municipio"
                      class="block text-sm font-semibold text-gray-900 mb-2"
                    >
                      {{ t.municipioLabel }}
                    </label>
                    <input
                      v-model="form.delivery_address.municipio"
                      type="text"
                      id="municipio"
                      :placeholder="t.municipioPlaceholder"
                      class="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border border-gray-200 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </div>

                <!-- Estado and Postal Code -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label
                      for="estado"
                      class="block text-sm font-semibold text-gray-900 mb-2"
                    >
                      {{ t.estadoLabel }}
                    </label>
                    <select
                      v-model="form.delivery_address.estado"
                      id="estado"
                      class="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border border-gray-200 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="">{{ t.selectEstado }}</option>
                      <option
                        v-for="estado in mexicanStates"
                        :key="estado"
                        :value="estado"
                      >
                        {{ estado }}
                      </option>
                    </select>
                  </div>
                  <div>
                    <label
                      for="postal_code"
                      class="block text-sm font-semibold text-gray-900 mb-2"
                    >
                      {{ t.postalCodeLabel }}
                    </label>
                    <input
                      v-model="form.delivery_address.postal_code"
                      type="text"
                      id="postal_code"
                      :placeholder="t.postalCodePlaceholder"
                      maxlength="5"
                      pattern="[0-9]{5}"
                      class="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border border-gray-200 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </div>

                <!-- Referencias -->
                <div>
                  <label
                    for="referencias"
                    class="block text-sm font-semibold text-gray-900 mb-2"
                  >
                    {{ t.referenciasLabel }}
                  </label>
                  <textarea
                    v-model="form.delivery_address.referencias"
                    id="referencias"
                    rows="3"
                    :placeholder="t.referenciasPlaceholder"
                    class="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border border-gray-200 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 resize-none"
                  ></textarea>
                </div>

                <!-- Rural Checkbox -->
                <div class="bg-yellow-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-yellow-200">
                  <label class="flex items-start gap-3 cursor-pointer">
                    <input
                      v-model="form.is_rural"
                      type="checkbox"
                      class="mt-1 h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                    />
                    <div class="flex-1">
                      <span class="text-sm font-semibold text-gray-900">{{ t.ruralAreaLabel }}</span>
                      <p class="text-xs sm:text-sm text-gray-600 mt-1">
                        {{ t.ruralAreaDescription }}
                      </p>
                      <div v-if="form.is_rural" class="mt-2">
                        <label class="block text-xs font-medium text-yellow-700 mb-1">{{ t.ruralSurchargeLabel }}</label>
                        <div class="relative">
                          <input
                            v-model.number="form.rural_surcharge"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            class="w-full px-3 py-2 pl-6 rounded-lg border border-yellow-300 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                          />
                          <div class="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                            <span class="text-yellow-600 text-sm">$</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column - Additional Fields & Dates -->
          <div class="space-y-4 sm:space-y-6">
            <!-- Payment Links -->
            <div
              class="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 animate-fadeIn"
              style="animation-delay: 0.3s"
            >
              <h2 class="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">
                {{ t.paymentLinks }}
              </h2>

              <div class="space-y-3 sm:space-y-4">
                <!-- NEW FLOW: Consolidation Payment Link (100%) -->
                <div v-if="isNewConsolidationFlow && !isCrossing">
                  <label
                    for="consolidation_payment_link"
                    class="block text-sm font-semibold text-gray-900 mb-1.5 sm:mb-2"
                  >
                    {{ t.consolidationPaymentLinkLabel }}
                  </label>
                  <input
                    v-model="form.consolidation_payment_link"
                    type="url"
                    id="consolidation_payment_link"
                    placeholder="https://invoice.stripe.com/..."
                    class="w-full px-3 py-2 rounded-lg border border-purple-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-purple-50"
                  />
                  <a
                    v-if="form.consolidation_payment_link"
                    :href="form.consolidation_payment_link"
                    target="_blank"
                    class="text-xs text-purple-600 hover:underline mt-1 inline-flex items-center gap-1"
                  >
                    {{ t.openLink }}
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                    </svg>
                  </a>
                  <p class="text-xs text-purple-600 mt-1">{{ t.consolidationFlowNote }}</p>
                </div>

                <!-- LEGACY FLOW: Deposit/Full Payment Link -->
                <div v-if="!isNewConsolidationFlow || isCrossing">
                  <label
                    for="deposit_payment_link"
                    class="block text-sm font-semibold text-gray-900 mb-1.5 sm:mb-2"
                  >
                    {{ isCrossing ? t.fullPaymentLinkLabel : t.depositPaymentLinkLabel }}
                  </label>
                  <input
                    v-model="form.deposit_payment_link"
                    type="url"
                    id="deposit_payment_link"
                    placeholder="https://invoice.stripe.com/..."
                    class="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <a
                    v-if="form.deposit_payment_link"
                    :href="form.deposit_payment_link"
                    target="_blank"
                    class="text-xs text-primary-600 hover:underline mt-1 inline-flex items-center gap-1"
                  >
                    {{ t.openLink }}
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                    </svg>
                  </a>
                </div>

                <!-- LEGACY FLOW: Final Payment Link - Only for old shipping flow -->
                <div v-if="!isCrossing && !isNewConsolidationFlow">
                  <label
                    for="payment_link"
                    class="block text-sm font-semibold text-gray-900 mb-1.5 sm:mb-2"
                  >
                    {{ t.paymentLinkLabel }}
                  </label>
                  <input
                    v-model="form.payment_link"
                    type="url"
                    id="payment_link"
                    placeholder="https://invoice.stripe.com/..."
                    class="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <a
                    v-if="form.payment_link"
                    :href="form.payment_link"
                    target="_blank"
                    class="text-xs text-primary-600 hover:underline mt-1 inline-flex items-center gap-1"
                  >
                    {{ t.openLink }}
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            <!-- Important Dates -->
            <div
              class="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 animate-fadeIn"
              style="animation-delay: 0.4s"
            >
              <h2 class="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">
                {{ t.importantDates }}
              </h2>

              <div class="space-y-3 sm:space-y-4">
                <!-- NEW FLOW: Consolidation Paid At -->
                <div v-if="isNewConsolidationFlow && !isCrossing">
                  <label
                    for="consolidation_paid_at"
                    class="block text-sm font-semibold text-gray-900 mb-1.5 sm:mb-2"
                  >
                    {{ t.consolidationPaidAtLabel }}
                  </label>
                  <input
                    v-model="form.consolidation_paid_at"
                    type="datetime-local"
                    id="consolidation_paid_at"
                    class="w-full px-3 py-2 rounded-lg border border-purple-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-purple-50"
                  />
                </div>

                <!-- LEGACY: Deposit Paid At (Shipping only, old flow) -->
                <div v-if="!isCrossing && !isNewConsolidationFlow">
                  <label
                    for="deposit_paid_at"
                    class="block text-sm font-semibold text-gray-900 mb-1.5 sm:mb-2"
                  >
                    {{ t.depositPaidAtLabel }}
                  </label>
                  <input
                    v-model="form.deposit_paid_at"
                    type="datetime-local"
                    id="deposit_paid_at"
                    class="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <!-- Final Paid At -->
                <div>
                  <label
                    for="paid_at"
                    class="block text-sm font-semibold text-gray-900 mb-1.5 sm:mb-2"
                  >
                    {{ isCrossing ? t.fullPaymentPaidAtLabel : t.paidAtLabel }}
                  </label>
                  <input
                    v-model="form.paid_at"
                    type="datetime-local"
                    id="paid_at"
                    class="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <!-- Shipped At / Ready for Pickup At -->
                <div>
                  <label
                    for="shipped_at"
                    class="block text-sm font-semibold text-gray-900 mb-1.5 sm:mb-2"
                  >
                    {{ isCrossing ? t.readyForPickupAtLabel : t.shippedAtLabel }}
                  </label>
                  <input
                    v-model="form.shipped_at"
                    type="datetime-local"
                    id="shipped_at"
                    class="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <!-- Delivered At / Picked Up At -->
                <div>
                  <label
                    for="delivered_at"
                    class="block text-sm font-semibold text-gray-900 mb-1.5 sm:mb-2"
                  >
                    {{ isCrossing ? t.pickedUpAtLabel : t.deliveredAtLabel }}
                  </label>
                  <input
                    v-model="form.delivered_at"
                    type="datetime-local"
                    id="delivered_at"
                    class="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <!-- Planned Ship Date (Operations Board) -->
                <div>
                  <label
                    for="planned_ship_date"
                    class="block text-sm font-semibold text-gray-900 mb-1.5 sm:mb-2"
                  >
                    {{ t.plannedShipDateLabel }}
                  </label>
                  <input
                    v-model="form.planned_ship_date"
                    type="date"
                    id="planned_ship_date"
                    class="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <p class="text-xs text-gray-500 mt-1">{{ t.plannedShipDateHelp }}</p>
                </div>
              </div>
            </div>

            <!-- Notes -->
            <div
              class="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 animate-fadeIn"
              style="animation-delay: 0.5s"
            >
              <h2 class="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">
                {{ t.notesTitle }}
              </h2>
              <textarea
                v-model="form.notes"
                rows="4"
                :placeholder="t.notesPlaceholder"
                class="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-col-reverse sm:flex-row gap-3 sm:justify-between pt-2 sm:pt-4">
          <NuxtLink
            :to="`/app/admin/orders/${orderId}`"
            class="px-4 sm:px-6 py-2.5 sm:py-3 bg-white text-gray-700 font-semibold rounded-lg sm:rounded-xl border border-gray-300 hover:bg-gray-50 transition-all duration-300 text-center text-sm sm:text-base"
          >
            {{ t.cancel }}
          </NuxtLink>

          <button
            type="submit"
            :disabled="saving || !hasChanges"
            class="px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-lg sm:rounded-xl shadow-lg hover:from-primary-600 hover:to-primary-700 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 text-sm sm:text-base"
          >
            <svg
              v-if="saving"
              class="animate-spin -ml-1 mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white inline-block"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span v-if="!saving">{{ t.saveChanges }}</span>
            <span v-else>{{ t.saving }}</span>
          </button>
        </div>
      </form>
    </div>

    <!-- Add Box Modal -->
<TransitionRoot :show="showAddBoxModal" as="template">
  <Dialog class="relative z-50" @close="closeAddBoxModal">
    <div class="fixed inset-0 bg-black/30 backdrop-blur-sm" />
    <div class="fixed inset-0 overflow-y-auto">
      <div class="flex min-h-full items-center justify-center p-4">
        <DialogPanel
          class="w-full max-w-md rounded-xl sm:rounded-2xl bg-white p-4 sm:p-6 shadow-xl"
        >
          <DialogTitle class="text-base sm:text-lg font-semibold mb-4">
            {{ t.addBoxTitle }}
          </DialogTitle>

          <div class="space-y-4">
            <!-- Box Size Selection -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                {{ t.selectProduct }}
              </label>
              <select
                v-model="newBox.stripe_price_id"
                class="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm"
              >
                <option value="" disabled>{{ t.selectBoxSize }}</option>
                <option
                  v-for="prod in filteredProducts"
                  :key="prod.id"
                  :value="prod.price_id"
                >
                  {{ prod.name }} - ${{ prod.price }} {{ prod.currency }}
                </option>
              </select>
            </div>

            <!-- Dimensions & Weight -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ t.dimensionsLabel }}
                <span class="text-gray-400 font-normal">({{ t.optional }})</span>
              </label>
              <div class="grid grid-cols-4 gap-2">
                <div>
                  <input
                    v-model.number="newBox.length"
                    type="number"
                    step="0.1"
                    min="0"
                    :placeholder="t.lengthLabel"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm"
                  />
                </div>
                <div>
                  <input
                    v-model.number="newBox.width"
                    type="number"
                    step="0.1"
                    min="0"
                    :placeholder="t.widthLabel"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm"
                  />
                </div>
                <div>
                  <input
                    v-model.number="newBox.height"
                    type="number"
                    step="0.1"
                    min="0"
                    :placeholder="t.heightLabel"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm"
                  />
                </div>
                <div>
                  <input
                    v-model.number="newBox.weight"
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="kg"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm"
                  />
                </div>
              </div>
            </div>

            <!-- Guia Number (only for shipping orders) -->
            <div v-if="!isCrossing">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                {{ t.guiaNumberLabel }}
                <span class="text-gray-400 font-normal">({{ t.optional }})</span>
              </label>
              <input
                v-model="newBox.guia_number"
                type="text"
                placeholder="1234567890"
                class="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm"
              />
            </div>

            <!-- GIA Document (only for shipping orders) -->
            <div v-if="!isCrossing">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                {{ t.giaDocument }}
                <span class="text-gray-400 font-normal">({{ t.optional }})</span>
              </label>
              <input
                type="file"
                @change="handleNewBoxGiaFile"
                accept=".pdf"
                class="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
              <p v-if="newBox.gia_file" class="text-xs text-green-600 mt-1 flex items-center gap-1">
                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
                {{ newBox.gia_file.name }}
              </p>
            </div>
          </div>

          <div class="mt-6 flex gap-3 justify-end">
            <button
              type="button"
              @click="closeAddBoxModal"
              class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
            >
              {{ t.cancel }}
            </button>
            <button
              type="button"
              @click="addNewBox"
              :disabled="!newBox.stripe_price_id"
              :class="[
                'px-4 py-2 text-white rounded-lg disabled:opacity-50 text-sm',
                isCrossing ? 'bg-amber-600 hover:bg-amber-700' : 'bg-primary-600 hover:bg-primary-700'
              ]"
            >
              {{ t.addBox }}
            </button>
          </div>
        </DialogPanel>
      </div>
    </div>
  </Dialog>
</TransitionRoot>
  </section>
</template>
<script setup>
import { ref, computed, onMounted, watch, nextTick } from "vue";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionRoot,
} from "@headlessui/vue";

definePageMeta({
  layout: "admin",
  middleware: ["auth", "admin"],
});

const { $customFetch, $toast } = useNuxtApp();
const route = useRoute();
const router = useRouter();
const { t: createTranslations } = useLanguage();

// State
const orderId = route.params.id;
const order = ref(null);
const loading = ref(true);
const saving = ref(false);
const errorMessage = ref("");
const originalData = ref(null);
const products = ref([]);
const showAddBoxModal = ref(false);
const newBox = ref({ stripe_price_id: "", guia_number: "", gia_file: null, length: null, width: null, height: null, weight: null });
const useSimpleAddress = ref(false);
const isInitialLoad = ref(true);

// War Chest accounts an order's payment can be credited to (on mark-paid).
const paymentMethods = ['NU', 'HSBC', 'Stripe'];

// Form data
const form = ref({
  order_type: 'shipping',
  status: "",
  boxes: [],
  box_price: null,
  deposit_amount: null,
  amount_paid: null,
  paid_location: "",
  declared_value: null,
  is_rural: false,
  rural_surcharge: null,
  delivery_address: {
    full_address: "",
    street: "",
    exterior_number: "",
    interior_number: "",
    colonia: "",
    municipio: "",
    estado: "",
    postal_code: "",
    referencias: "",
  },
  total_weight: null,
  shipping_cost: null,
  handling_fee: null,
  insurance_fee: null,
  currency: "mxn",
  notes: "",
  paid_at: null,
  deposit_paid_at: null,
  completed_at: null,
  processing_started_at: null,
  shipped_at: null,
  delivered_at: null,
  estimated_delivery_date: null,
  planned_ship_date: null,
  actual_delivery_date: null,
  deposit_invoice_id: "",
  deposit_payment_link: "",
  stripe_invoice_id: "",
  payment_link: "",
  consolidation_payment_link: "",
  consolidation_paid_at: null,
});

// Mexican states
const mexicanStates = [
  "Aguascalientes",
  "Baja California",
  "Baja California Sur",
  "Campeche",
  "Chiapas",
  "Chihuahua",
  "Ciudad de México",
  "Coahuila",
  "Colima",
  "Durango",
  "Guanajuato",
  "Guerrero",
  "Hidalgo",
  "Jalisco",
  "México",
  "Michoacán",
  "Morelos",
  "Nayarit",
  "Nuevo León",
  "Oaxaca",
  "Puebla",
  "Querétaro",
  "Quintana Roo",
  "San Luis Potosí",
  "Sinaloa",
  "Sonora",
  "Tabasco",
  "Tamaulipas",
  "Tlaxcala",
  "Veracruz",
  "Yucatán",
  "Zacatecas",
];

// Translations
const translations = {
  editOrder: { es: "Editar Orden", en: "Edit Order" },
  orderInformation: { es: "Información de la Orden", en: "Order Information" },
  financialInformation: { es: "Información Financiera", en: "Financial Information" },
  paymentLinks: { es: "Links de Pago", en: "Payment Links" },
  importantDates: { es: "Fechas Importantes", en: "Important Dates" },
  notesTitle: { es: "Notas", en: "Notes" },
  statusLabel: { es: "Estado", en: "Status" },
  orderType: { es: "Tipo de Orden", en: "Order Type" },
  shippingType: { es: "Envío", en: "Shipping" },
  crossingType: { es: "Solo Cruce", en: "Crossing Only" },
  shippingTypeLabel: { es: "Envío (Entrega a domicilio)", en: "Shipping (Home Delivery)" },
  crossingTypeLabel: { es: "Solo Cruce (Recolección en bodega)", en: "Crossing Only (Warehouse Pickup)" },
  crossingPickupInfo: { es: "El cliente recogerá en nuestra bodega de Tijuana", en: "Customer will pick up at our Tijuana warehouse" },
  crossingPickupAddress: { es: "Av. Jalisco 2850, Local 5, Col. Madero (Cacho), Tijuana, BC 22040", en: "Av. Jalisco 2850, Local 5, Col. Madero (Cacho), Tijuana, BC 22040" },
  boxes: { es: "Cajas", en: "Boxes" },
  boxesDescription: { es: "Administra las cajas de este pedido", en: "Manage boxes for this order" },
  noBoxesYet: { es: "No hay cajas agregadas", en: "No boxes added yet" },
  addBoxToStart: { es: "Agrega una caja para comenzar", en: "Add a box to get started" },
  totalWeightLabel: { es: "Peso Total", en: "Total Weight" },
  declaredValueLabel: { es: "Valor Declarado (USD)", en: "Declared Value (USD)" },
  amountPaidLabel: { es: "Monto Pagado (Total)", en: "Amount Paid (Total)" },
  depositAmountLabel: { es: "Monto Depósito", en: "Deposit Amount" },
  fullPaymentAmountLabel: { es: "Monto Pago Completo", en: "Full Payment Amount" },
  depositAmount: { es: "Depósito", en: "Deposit" },
  fullPayment: { es: "Pago Completo", en: "Full Payment" },
  fullPaymentNote: { es: "Ordenes de solo cruce requieren 100% de pago por adelantado", en: "Crossing-only orders require 100% payment upfront" },
  totalBoxPrice: { es: "Precio Total Cajas", en: "Total Box Price" },
  updatedViaStripe: { es: "Actualizado automáticamente vía Stripe", en: "Automatically updated via Stripe" },
  guiaNumberLabel: { es: "Número de Guía", en: "Waybill Number" },
  giaDocument: { es: "Documento GIA", en: "GIA Document" },
  dimensionsLabel: { es: "Dimensiones (cm)", en: "Dimensions (cm)" },
  lengthLabel: { es: "Largo", en: "Length" },
  widthLabel: { es: "Ancho", en: "Width" },
  heightLabel: { es: "Alto", en: "Height" },
  weightLabel: { es: "Peso (kg)", en: "Weight (kg)" },
  weightSectionLabel: { es: "Peso del Envío", en: "Shipment Weight" },
  totalBoxWeightLabel: { es: "Peso Cajas", en: "Box Weight" },
  autoCalculated: { es: "Auto-calculado", en: "Auto-calculated" },
  downloadGia: { es: "Descargar GIA", en: "Download GIA" },
  pendingUpload: { es: "Pendiente de subir", en: "Pending upload" },
  optional: { es: "Opcional", en: "Optional" },
  depositPaymentLinkLabel: { es: "Link Depósito", en: "Deposit Link" },
  fullPaymentLinkLabel: { es: "Link de Pago", en: "Payment Link" },
  paymentLinkLabel: { es: "Link Pago Final", en: "Final Payment Link" },
  consolidationPaymentLinkLabel: { es: "Link de Pago (100%)", en: "Payment Link (100%)" },
  consolidationFlowNote: { es: "Nuevo flujo: pago completo antes del envío", en: "New flow: full payment before shipping" },
  consolidationPaidAtLabel: { es: "Fecha de Pago (Consolidación)", en: "Payment Date (Consolidation)" },
  openLink: { es: "Abrir enlace", en: "Open link" },
  paidAtLabel: { es: "Fecha Pago Final", en: "Final Paid At" },
  fullPaymentPaidAtLabel: { es: "Fecha de Pago", en: "Payment Date" },
  depositPaidAtLabel: { es: "Fecha Pago Depósito", en: "Deposit Paid At" },
  shippedAtLabel: { es: "Fecha de Envío", en: "Shipped At" },
  plannedShipDateLabel: { es: "Fecha Programada de Envío (Tablero)", en: "Planned Ship Date (Board)" },
  plannedShipDateHelp: { es: "Día en que se enviará. Controla el Tablero de Operaciones.", en: "Day it will ship. Drives the Operations Board." },
  readyForPickupAtLabel: { es: "Fecha Listo para Recoger", en: "Ready for Pickup At" },
  deliveredAtLabel: { es: "Fecha de Entrega", en: "Delivered At" },
  pickedUpAtLabel: { es: "Fecha de Recolección", en: "Picked Up At" },
  notesPlaceholder: { es: "Notas internas sobre esta orden...", en: "Internal notes about this order..." },
  deliveryAddressTitle: { es: "Dirección de Entrega", en: "Delivery Address" },
  simpleMode: { es: "Modo simple", en: "Simple mode" },
  fullAddressLabel: { es: "Dirección Completa", en: "Full Address" },
  fullAddressPlaceholder: { es: "Ej: Av. Revolución 123, Col. Centro, Tijuana, BC 22000", en: "E.g.: Av. Revolución 123, Col. Centro, Tijuana, BC 22000" },
  fullAddressHint: { es: "Pega la dirección completa en un solo campo", en: "Paste the complete address in a single field" },
  streetLabel: { es: "Calle", en: "Street" },
  streetPlaceholder: { es: "Nombre de la calle", en: "Street name" },
  exteriorNumberLabel: { es: "Núm. Exterior", en: "Ext. Number" },
  exteriorNumberPlaceholder: { es: "123", en: "123" },
  interiorNumberLabel: { es: "Núm. Interior", en: "Int. Number" },
  interiorNumberPlaceholder: { es: "Opcional", en: "Optional" },
  coloniaLabel: { es: "Colonia", en: "Neighborhood" },
  coloniaPlaceholder: { es: "Nombre de la colonia", en: "Neighborhood name" },
  municipioLabel: { es: "Municipio", en: "Municipality" },
  municipioPlaceholder: { es: "Municipio o delegación", en: "Municipality" },
  estadoLabel: { es: "Estado", en: "State" },
  selectEstado: { es: "Selecciona un estado", en: "Select a state" },
  postalCodeLabel: { es: "Código Postal", en: "Postal Code" },
  postalCodePlaceholder: { es: "12345", en: "12345" },
  referenciasLabel: { es: "Referencias", en: "References" },
  referenciasPlaceholder: { es: "Entre calles, puntos de referencia...", en: "Between streets, landmarks..." },
  ruralAreaLabel: { es: "Zona Rural", en: "Rural Area" },
  ruralAreaDescription: { es: "Marca si la dirección está en una zona rural.", en: "Check if the address is in a rural area." },
  ruralSurchargeLabel: { es: "Recargo Rural", en: "Rural Surcharge" },
  cancel: { es: "Cancelar", en: "Cancel" },
  saveChanges: { es: "Guardar Cambios", en: "Save Changes" },
  saving: { es: "Guardando...", en: "Saving..." },
  orderUpdatedSuccess: { es: "Orden actualizada exitosamente", en: "Order updated successfully" },
  generalError: { es: "Ocurrió un error.", en: "An error occurred." },
  collecting: { es: "Agregando Artículos", en: "Adding Items" },
  awaitingPackages: { es: "Esperando Paquetes", en: "Awaiting Packages" },
  packagesComplete: { es: "Paquetes Completos", en: "Packages Complete" },
  processing: { es: "Procesando", en: "Processing" },
  shipped: { es: "Enviado", en: "Shipped" },
  readyForPickup: { es: "Listo para Recoger", en: "Ready for Pickup" },
  delivered: { es: "Entregado", en: "Delivered" },
  pickedUp: { es: "Recogido", en: "Picked Up" },
  awaitingPayment: { es: "Esperando Pago", en: "Awaiting Payment" },
  paidStatus: { es: "Pagado", en: "Paid" },
  cancelled: { es: "Cancelado", en: "Cancelled" },
  box: { es: "caja", en: "box" },
  boxesLabel: { es: "cajas", en: "boxes" },
  boxLabel: { es: "Caja", en: "Box" },
  addBox: { es: "Agregar Caja", en: "Add Box" },
  addBoxTitle: { es: "Agregar Nueva Caja", en: "Add New Box" },
  selectProduct: { es: "Seleccionar Producto", en: "Select Product" },
  selectBoxSize: { es: "Seleccionar tamaño", en: "Select size" },
  paymentSummary: { es: "Resumen de Pagos", en: "Payment Summary" },
  totalPaid: { es: "Total Pagado", en: "Total Paid" },
  paidLocationLabel: { es: "¿A qué cuenta se paga? (War Chest)", en: "Which account is it paid to? (War Chest)" },
  paidLocationNone: { es: "Ninguna", en: "None" },
  paidLocationHint: { es: "Al marcar la orden como pagada, el monto se abona a esta cuenta del War Chest.", en: "When the order is marked paid, the amount is credited to this War Chest account." },
};

const t = createTranslations(translations);

// Computed
const isCrossing = computed(() => form.value.order_type === 'crossing');
const isNewConsolidationFlow = computed(() => !!order.value?.consolidation_payment_link);

const calculatedTotalBoxPrice = computed(() => {
  if (!form.value.boxes || form.value.boxes.length === 0) return 0;
  return form.value.boxes.reduce((sum, box) => {
    const price = parseFloat(box.box_price) || 0;
    return sum + price;
  }, 0);
});

const calculatedBoxWeight = computed(() => {
  if (!form.value.boxes || form.value.boxes.length === 0) return null;
  const total = form.value.boxes.reduce((sum, box) => {
    const weight = parseFloat(box.weight) || 0;
    return sum + weight;
  }, 0);
  return total > 0 ? total.toFixed(2) : null;
});

const hasChanges = computed(() => {
  // Create comparison copies without File objects
  const formCopy = JSON.parse(JSON.stringify(form.value, (key, value) => {
    if (key === 'new_gia_file' || key === 'gia_file') return undefined;
    return value;
  }));
  const originalCopy = JSON.parse(JSON.stringify(originalData.value, (key, value) => {
    if (key === 'new_gia_file' || key === 'gia_file') return undefined;
    return value;
  }));
  
  // Check if any box has a new GIA file to upload
  const hasNewGiaFiles = form.value.boxes.some(box => box.new_gia_file);
  
  return JSON.stringify(formCopy) !== JSON.stringify(originalCopy) || hasNewGiaFiles;
});

// Filter products based on order type
const filteredProducts = computed(() => {
  if (isCrossing.value) {
    return products.value.filter(p => {
      return p.shipping === 'false' || p.shipping === false || !p.shipping;
    });
  } else {
    return products.value.filter(p => {
      return p.shipping === 'true' || p.shipping === true;
    });
  }
});

// Helper function to infer box size from product name
const inferBoxSizeFromName = (name) => {
  if (!name) return 'medium';
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('extra large') || lowerName.includes('extra-large') || lowerName.includes('xl box') || lowerName.includes('xlarge')) {
    return 'extra-large';
  }
  if (lowerName.includes('extra small') || lowerName.includes('extra-small') || lowerName.includes('xs box') || lowerName.includes('xsmall')) {
    return 'extra-small';
  }
  if (lowerName.includes('large')) {
    return 'large';
  }
  if (lowerName.includes('small')) {
    return 'small';
  }
  if (lowerName.includes('medium') || lowerName.includes('med ')) {
    return 'medium';
  }
  
  return 'medium';
};

// Find matching product by stripe_price_id
const findProductByPriceId = (priceId) => {
  return products.value.find(p => p.price_id === priceId);
};

// Find matching product by stripe_product_id
const findProductByProductId = (productId) => {
  return products.value.find(p => p.id === productId);
};

// Helper functions
const formatNumber = (value) => {
  const num = parseFloat(value) || 0;
  return num.toFixed(2);
};

const getStatusColor = (status) => {
  const colors = {
    collecting: "bg-blue-100 text-blue-700",
    awaiting_packages: "bg-amber-100 text-amber-700",
    packages_complete: "bg-purple-100 text-purple-700",
    processing: "bg-indigo-100 text-indigo-700",
    shipped: "bg-cyan-100 text-cyan-700",
    delivered: "bg-green-100 text-green-700",
    awaiting_payment: "bg-orange-100 text-orange-700",
    paid: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-red-100 text-red-700",
  };
  return colors[status] || "bg-gray-100 text-gray-700";
};

const getStatusLabel = (status) => {
  if (status === 'shipped' && isCrossing.value) {
    return t.value.readyForPickup;
  }
  if (status === 'delivered' && isCrossing.value) {
    return t.value.pickedUp;
  }
  
  const statusMap = {
    collecting: "collecting",
    awaiting_packages: "awaitingPackages",
    packages_complete: "packagesComplete",
    processing: "processing",
    shipped: "shipped",
    delivered: "delivered",
    awaiting_payment: "awaitingPayment",
    paid: "paidStatus",
    cancelled: "cancelled",
  };
  return t.value[statusMap[status]] || status;
};

const getBoxSizeColorClass = (size) => {
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
  const labels = {
    "extra-small": "XS - Extra Small",
    small: "S - Small",
    medium: "M - Medium",
    large: "L - Large",
    "extra-large": "XL - Extra Large",
  };
  return labels[size] || size || "";
};

const formatDateTimeForInput = (date) => {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const formatDateForInput = (date) => {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Watch for order_type changes
watch(() => form.value.order_type, (newType, oldType) => {
  if (isInitialLoad.value) return;
  
  if (newType === 'crossing' && oldType === 'shipping') {
    form.value.delivery_address = {
      full_address: "",
      street: "",
      exterior_number: "",
      interior_number: "",
      colonia: "",
      municipio: "",
      estado: "",
      postal_code: "",
      referencias: "",
    };
    form.value.is_rural = false;
    form.value.rural_surcharge = null;
    form.value.payment_link = "";
    
    // Clear guia/gia from boxes when switching to crossing
    form.value.boxes.forEach(box => {
      box.guia_number = "";
      box.gia_url = null;
      box.gia_filename = null;
      box.gia_path = null;
      box.new_gia_file = null;
    });
  }
});

// Watch for box changes to update total price
watch(
  () => form.value.boxes,
  () => {
    if (form.value.boxes.length > 0) {
      form.value.box_price = calculatedTotalBoxPrice.value;
    }
  },
  { deep: true }
);

// Methods
const removeBox = (index) => {
  form.value.boxes.splice(index, 1);
  form.value.box_price = calculatedTotalBoxPrice.value;
};

const closeAddBoxModal = () => {
  showAddBoxModal.value = false;
  newBox.value = { stripe_price_id: "", guia_number: "", gia_file: null, length: null, width: null, height: null, weight: null };
};

const handleNewBoxGiaFile = (e) => {
  newBox.value.gia_file = e.target.files[0] || null;
};

const addNewBox = () => {
  const selectedProduct = filteredProducts.value.find(
    (p) => p.price_id === newBox.value.stripe_price_id
  );
  
  if (!selectedProduct) {
    console.error('Product not found for price_id:', newBox.value.stripe_price_id);
    return;
  }

  const boxSize = inferBoxSizeFromName(selectedProduct.name);

  form.value.boxes.push({
    id: null,
    stripe_price_id: selectedProduct.price_id,
    stripe_product_id: selectedProduct.id,
    box_size: boxSize,
    box_name: selectedProduct.name,
    box_price: parseFloat(selectedProduct.price) || 0,
    currency: selectedProduct.currency?.toLowerCase() || "mxn",
    guia_number: newBox.value.guia_number || "",
    gia_url: null,
    gia_filename: null,
    gia_path: null,
    new_gia_file: newBox.value.gia_file || null,
    length: newBox.value.length || null,
    width: newBox.value.width || null,
    height: newBox.value.height || null,
    weight: newBox.value.weight || null,
  });

  form.value.box_price = calculatedTotalBoxPrice.value;
  closeAddBoxModal();
};

const handleGiaFileChange = (e, index) => {
  const file = e.target.files[0] || null;
  form.value.boxes[index].new_gia_file = file;
};

const fetchProducts = async () => {
  try {
    const res = await $customFetch("/products");
    products.value = res.data || [];
  } catch (e) {
    console.error("Error fetching products:", e);
    products.value = [];
  }
};

const fetchOrder = async () => {
  loading.value = true;
  isInitialLoad.value = true;
  
  try {
    const response = await $customFetch(`/admin/orders/${orderId}`);
    order.value = response.data;

    const hasFullAddress = order.value.delivery_address?.full_address;
    useSimpleAddress.value = !!hasFullAddress;

    let boxesArray = [];
    
    if (order.value.boxes && order.value.boxes.length > 0) {
      boxesArray = order.value.boxes.map((box) => ({
        id: box.id,
        stripe_price_id: box.stripe_price_id,
        stripe_product_id: box.stripe_product_id,
        box_size: box.box_size,
        box_name: box.box_name,
        box_price: parseFloat(box.box_price) || 0,
        currency: box.currency?.toLowerCase() || "mxn",
        guia_number: box.guia_number || "",
        gia_url: box.gia_url || box.gia_full_url || null,
        gia_filename: box.gia_filename || null,
        gia_path: box.gia_path || null,
        new_gia_file: null,
        length: box.length || null,
        width: box.width || null,
        height: box.height || null,
        weight: box.weight || null,
      }));
    } else if (order.value.box_size && order.value.stripe_price_id) {
      const matchingProduct = findProductByPriceId(order.value.stripe_price_id) 
        || findProductByProductId(order.value.stripe_product_id);
      
      boxesArray = [{
        id: null,
        stripe_price_id: order.value.stripe_price_id,
        stripe_product_id: order.value.stripe_product_id || matchingProduct?.id || null,
        box_size: order.value.box_size,
        box_name: matchingProduct?.name || formatBoxSizeLabel(order.value.box_size),
        box_price: parseFloat(order.value.box_price) || matchingProduct?.price || 0,
        currency: order.value.currency?.toLowerCase() || matchingProduct?.currency?.toLowerCase() || "mxn",
        guia_number: order.value.guia_number || "",
        gia_url: order.value.gia_url || null,
        gia_filename: order.value.gia_filename || null,
        gia_path: order.value.gia_path || null,
        new_gia_file: null,
      }];
    }

    form.value = {
      order_type: order.value.order_type || 'shipping',
      status: order.value.status || "",
      boxes: boxesArray,
      box_price: parseFloat(order.value.box_price) || null,
      declared_value: parseFloat(order.value.declared_value) || null,
      is_rural: order.value.is_rural || false,
      rural_surcharge: parseFloat(order.value.rural_surcharge) || null,
      delivery_address: {
        full_address: order.value.delivery_address?.full_address || "",
        street: order.value.delivery_address?.street || "",
        exterior_number: order.value.delivery_address?.exterior_number || "",
        interior_number: order.value.delivery_address?.interior_number || "",
        colonia: order.value.delivery_address?.colonia || "",
        municipio: order.value.delivery_address?.municipio || "",
        estado: order.value.delivery_address?.estado || "",
        postal_code: order.value.delivery_address?.postal_code || "",
        referencias: order.value.delivery_address?.referencias || "",
      },
      total_weight: parseFloat(order.value.total_weight) || null,
      shipping_cost: parseFloat(order.value.shipping_cost) || null,
      handling_fee: parseFloat(order.value.handling_fee) || null,
      insurance_fee: parseFloat(order.value.insurance_fee) || null,
      amount_paid: parseFloat(order.value.amount_paid) || null,
      paid_location: order.value.paid_location || "",
      currency: order.value.currency?.toLowerCase() || "mxn",
      notes: order.value.notes || "",
      paid_at: formatDateTimeForInput(order.value.paid_at),
      deposit_paid_at: formatDateTimeForInput(order.value.deposit_paid_at),
      completed_at: formatDateTimeForInput(order.value.completed_at),
      processing_started_at: formatDateTimeForInput(order.value.processing_started_at),
      shipped_at: formatDateTimeForInput(order.value.shipped_at),
      delivered_at: formatDateTimeForInput(order.value.delivered_at),
      estimated_delivery_date: formatDateForInput(order.value.estimated_delivery_date),
      planned_ship_date: formatDateForInput(order.value.planned_ship_date),
      actual_delivery_date: formatDateForInput(order.value.actual_delivery_date),
      deposit_amount: parseFloat(order.value.deposit_amount) || null,
      deposit_invoice_id: order.value.deposit_invoice_id || "",
      deposit_payment_link: order.value.deposit_payment_link || "",
      stripe_invoice_id: order.value.stripe_invoice_id || "",
      payment_link: order.value.payment_link || "",
      consolidation_payment_link: order.value.consolidation_payment_link || "",
      consolidation_paid_at: formatDateTimeForInput(order.value.consolidation_paid_at),
    };

    originalData.value = JSON.parse(JSON.stringify(form.value, (key, value) => {
      if (key === 'new_gia_file' || key === 'gia_file') return null;
      return value;
    }));
    
    nextTick(() => {
      isInitialLoad.value = false;
    });
    
  } catch (error) {
    console.error("Error fetching order:", error);
    $toast.error(t.value.generalError);
    await router.push("/app/admin/orders");
  } finally {
    loading.value = false;
  }
};

const handleSubmit = async () => {
  if (!hasChanges.value) return;

  saving.value = true;
  errorMessage.value = "";

  try {
    // Check if we have any GIA files to upload (new or replacement)
    const hasGiaFiles = form.value.boxes.some(box => box.new_gia_file);
    
    // Always use FormData since backend now expects it for boxes with GIA support
    const formData = new FormData();
    
    // Add basic fields only if changed
    if (form.value.order_type !== originalData.value.order_type) {
      formData.append('order_type', form.value.order_type);
    }
    if (form.value.status !== originalData.value.status) {
      formData.append('status', form.value.status);
    }
    if (form.value.total_weight !== originalData.value.total_weight) {
      formData.append('total_weight', form.value.total_weight ?? '');
    }
    if (form.value.declared_value !== originalData.value.declared_value) {
      formData.append('declared_value', form.value.declared_value ?? '');
    }
    if (form.value.is_rural !== originalData.value.is_rural) {
      formData.append('is_rural', form.value.is_rural ? '1' : '0');
    }
    if (form.value.rural_surcharge !== originalData.value.rural_surcharge) {
      formData.append('rural_surcharge', form.value.rural_surcharge ?? '');
    }
    if (form.value.deposit_amount !== originalData.value.deposit_amount) {
      formData.append('deposit_amount', form.value.deposit_amount ?? '');
    }
    if (form.value.amount_paid !== originalData.value.amount_paid) {
      formData.append('amount_paid', form.value.amount_paid ?? '');
    }
    if (form.value.paid_location !== originalData.value.paid_location) {
      formData.append('paid_location', form.value.paid_location ?? '');
    }
    if (form.value.notes !== originalData.value.notes) {
      formData.append('notes', form.value.notes ?? '');
    }
    if (form.value.deposit_payment_link !== originalData.value.deposit_payment_link) {
      formData.append('deposit_payment_link', form.value.deposit_payment_link ?? '');
    }
    if (form.value.payment_link !== originalData.value.payment_link) {
      formData.append('payment_link', form.value.payment_link ?? '');
    }
    if (form.value.consolidation_payment_link !== originalData.value.consolidation_payment_link) {
      formData.append('consolidation_payment_link', form.value.consolidation_payment_link ?? '');
    }
    if (form.value.consolidation_paid_at !== originalData.value.consolidation_paid_at) {
      formData.append('consolidation_paid_at', form.value.consolidation_paid_at ?? '');
    }
    if (form.value.paid_at !== originalData.value.paid_at) {
      formData.append('paid_at', form.value.paid_at ?? '');
    }
    if (form.value.deposit_paid_at !== originalData.value.deposit_paid_at) {
      formData.append('deposit_paid_at', form.value.deposit_paid_at ?? '');
    }
    if (form.value.shipped_at !== originalData.value.shipped_at) {
      formData.append('shipped_at', form.value.shipped_at ?? '');
    }
    if (form.value.delivered_at !== originalData.value.delivered_at) {
      formData.append('delivered_at', form.value.delivered_at ?? '');
    }
    if (form.value.planned_ship_date !== originalData.value.planned_ship_date) {
      formData.append('planned_ship_date', form.value.planned_ship_date ?? '');
    }

    // Handle delivery address
    if (form.value.order_type === 'crossing') {
      formData.append('delivery_address', '');
    } else if (
      JSON.stringify(form.value.delivery_address) !==
      JSON.stringify(originalData.value.delivery_address)
    ) {
      if (useSimpleAddress.value) {
        formData.append('delivery_address[full_address]', form.value.delivery_address.full_address ?? '');
      } else {
        formData.append('delivery_address[street]', form.value.delivery_address.street ?? '');
        formData.append('delivery_address[exterior_number]', form.value.delivery_address.exterior_number ?? '');
        formData.append('delivery_address[interior_number]', form.value.delivery_address.interior_number ?? '');
        formData.append('delivery_address[colonia]', form.value.delivery_address.colonia ?? '');
        formData.append('delivery_address[municipio]', form.value.delivery_address.municipio ?? '');
        formData.append('delivery_address[estado]', form.value.delivery_address.estado ?? '');
        formData.append('delivery_address[postal_code]', form.value.delivery_address.postal_code ?? '');
        formData.append('delivery_address[referencias]', form.value.delivery_address.referencias ?? '');
      }
    }

    // Check if boxes changed (including dimensions)
    const originalBoxesCompare = originalData.value.boxes.map(b => ({
      id: b.id,
      stripe_price_id: b.stripe_price_id,
      guia_number: b.guia_number,
      length: b.length,
      width: b.width,
      height: b.height,
      weight: b.weight,
    }));
    const currentBoxesCompare = form.value.boxes.map(b => ({
      id: b.id,
      stripe_price_id: b.stripe_price_id,
      guia_number: b.guia_number,
      length: b.length,
      width: b.width,
      height: b.height,
      weight: b.weight,
    }));
    
    const boxesChanged = JSON.stringify(originalBoxesCompare) !== JSON.stringify(currentBoxesCompare) || hasGiaFiles;

    if (boxesChanged) {
      if (form.value.boxes.length === 0) {
        // Send empty boxes to tell backend to delete all boxes
        formData.append('boxes', '');
      } else {
        // Add all boxes with their GIA data and dimensions
        form.value.boxes.forEach((box, index) => {
          if (box.id) {
            formData.append(`boxes[${index}][id]`, box.id);
          }
          formData.append(`boxes[${index}][stripe_price_id]`, box.stripe_price_id);
          formData.append(`boxes[${index}][guia_number]`, box.guia_number ?? '');
          if (box.new_gia_file) {
            formData.append(`boxes[${index}][gia_file]`, box.new_gia_file);
          }
          // Add dimensions
          if (box.length != null) formData.append(`boxes[${index}][length]`, box.length);
          if (box.width != null) formData.append(`boxes[${index}][width]`, box.width);
          if (box.height != null) formData.append(`boxes[${index}][height]`, box.height);
          if (box.weight != null) formData.append(`boxes[${index}][weight]`, box.weight);
        });
      }
    }

    // Use POST with _method=PUT for FormData (Laravel convention)
    formData.append('_method', 'PUT');

    const response = await $customFetch(`/admin/management/orders/${orderId}`, {
      method: "POST",
      body: formData,
    });

    if (response.success) {
      $toast.success(t.value.orderUpdatedSuccess);
      await router.push(`/app/admin/orders/${orderId}`);
    }
  } catch (error) {
    console.error("Error updating order:", error);
    errorMessage.value = error.data?.message || t.value.generalError;
    $toast.error(errorMessage.value);
  } finally {
    saving.value = false;
  }
};

onMounted(async () => {
  await fetchProducts();
  await fetchOrder();
});
</script>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  10%,
  30%,
  50%,
  70%,
  90% {
    transform: translateX(-2px);
  }
  20%,
  40%,
  60%,
  80% {
    transform: translateX(2px);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.6s ease-out forwards;
  opacity: 0;
}

.animate-shake {
  animation: shake 0.5s ease-in-out;
}
</style>