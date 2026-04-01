<!-- pages/app/admin/orders/create.vue -->
<template>
  <section class="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/20">
    <!-- Header -->
    <div class="bg-white/90 backdrop-blur-sm shadow-sm border-b border-gray-100">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div class="flex items-center gap-3 sm:gap-4">
          <NuxtLink 
            to="/app/admin/orders" 
            class="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
          >
            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
          </NuxtLink>
          <div>
            <h1 class="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{{ t.createNewOrder }}</h1>
            <p class="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">{{ t.createOrderSubtitle }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      <!-- Error Alert -->
      <Transition
        enter-active-class="transform ease-out duration-300 transition"
        enter-from-class="translate-y-2 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition ease-in duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="errorMessage" class="mb-4 sm:mb-6 bg-red-50 border-l-4 border-red-500 rounded-lg p-3 sm:p-4 shadow-sm">
          <div class="flex">
            <svg class="w-5 h-5 text-red-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
            </svg>
            <p class="ml-3 text-sm font-medium text-red-800 flex-1">{{ errorMessage }}</p>
            <button @click="errorMessage = ''" class="ml-3 flex-shrink-0">
              <svg class="w-5 h-5 text-red-400 hover:text-red-600 transition-colors" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
              </svg>
            </button>
          </div>
        </div>
      </Transition>

      <!-- Create Form -->
      <form @submit.prevent="handleSubmit" class="space-y-4 sm:space-y-6">
        
        <!-- Order Type Selection Card -->
        <div class="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 lg:p-8">
          <h2 class="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">{{ t.orderType }}</h2>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Shipping Option -->
            <button
              type="button"
              @click="form.order_type = 'shipping'"
              :class="[
                'relative p-4 sm:p-6 rounded-xl border-2 text-left transition-all duration-200',
                form.order_type === 'shipping' 
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              ]"
            >
              <div class="flex items-start gap-4">
                <div :class="[
                  'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                  form.order_type === 'shipping' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'
                ]">
                  <!-- Plane Icon -->
                  <svg class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <p :class="[
                    'font-semibold text-base sm:text-lg',
                    form.order_type === 'shipping' ? 'text-blue-900' : 'text-gray-900'
                  ]">
                    {{ t.shippingOption }}
                  </p>
                  <p :class="[
                    'text-sm mt-1',
                    form.order_type === 'shipping' ? 'text-blue-700' : 'text-gray-500'
                  ]">
                    {{ t.shippingDescription }}
                  </p>
                </div>
              </div>
              
              <!-- Checkmark -->
              <div v-if="form.order_type === 'shipping'" class="absolute top-3 right-3">
                <svg class="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
              </div>
            </button>

            <!-- Crossing Option -->
            <button
              type="button"
              @click="form.order_type = 'crossing'"
              :class="[
                'relative p-4 sm:p-6 rounded-xl border-2 text-left transition-all duration-200',
                form.order_type === 'crossing' 
                  ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-200' 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              ]"
            >
              <div class="flex items-start gap-4">
                <div :class="[
                  'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                  form.order_type === 'crossing' ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-500'
                ]">
                  <!-- Truck Icon -->
                  <svg class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <p :class="[
                    'font-semibold text-base sm:text-lg',
                    form.order_type === 'crossing' ? 'text-amber-900' : 'text-gray-900'
                  ]">
                    {{ t.crossingOption }}
                  </p>
                  <p :class="[
                    'text-sm mt-1',
                    form.order_type === 'crossing' ? 'text-amber-700' : 'text-gray-500'
                  ]">
                    {{ t.crossingDescription }}
                  </p>
                </div>
              </div>
              
              <!-- Checkmark -->
              <div v-if="form.order_type === 'crossing'" class="absolute top-3 right-3">
                <svg class="w-6 h-6 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
              </div>
            </button>
          </div>
        </div>

        <!-- Customer Selection Card -->
        <div class="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 lg:p-8">
          <h2 class="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">{{ t.selectCustomer }}</h2>
          
          <!-- Customer Search -->
          <div class="relative" ref="searchContainer">
            <label for="user_search" class="block text-sm font-medium text-gray-700 mb-2">
              {{ t.customerLabel }} <span class="text-red-500">*</span>
            </label>
            
            <div class="relative">
              <input
                v-model="userSearch"
                @focus="showUserDropdown = true"
                type="text"
                id="user_search"
                class="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 rounded-lg sm:rounded-xl border border-gray-200 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                :placeholder="selectedUser ? selectedUser.name + ' - ' + selectedUser.email : t.searchUserPlaceholder"
              >
              <!-- Loading spinner or chevron -->
              <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg v-if="loadingUsers" class="animate-spin w-5 h-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <svg v-else class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
              </div>
            </div>
            
            <!-- Dropdown -->
            <Transition
              enter-active-class="transition ease-out duration-100"
              enter-from-class="transform opacity-0 scale-95"
              enter-to-class="transform opacity-100 scale-100"
              leave-active-class="transition ease-in duration-75"
              leave-from-class="transform opacity-100 scale-100"
              leave-to-class="transform opacity-0 scale-95"
            >
              <div v-if="showUserDropdown && !loadingUsers && users.length > 0" class="absolute z-20 mt-1 w-full bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-200 max-h-48 sm:max-h-60 overflow-auto">
                <div
                  v-for="user in users"
                  :key="user.id"
                  @click="selectUser(user)"
                  class="px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 last:border-0"
                >
                  <p class="text-sm font-medium text-gray-900">{{ user.name }}</p>
                  <p class="text-xs text-gray-500 mt-0.5">{{ user.email }} • {{ user.phone || t.noPhone }}</p>
                </div>
              </div>
            </Transition>

            <!-- No results message -->
            <Transition
              enter-active-class="transition ease-out duration-100"
              enter-from-class="transform opacity-0 scale-95"
              enter-to-class="transform opacity-100 scale-100"
              leave-active-class="transition ease-in duration-75"
              leave-from-class="transform opacity-100 scale-100"
              leave-to-class="transform opacity-0 scale-95"
            >
              <div v-if="showUserDropdown && !loadingUsers && users.length === 0 && userSearch.length > 0" class="absolute z-20 mt-1 w-full bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-200 p-4">
                <p class="text-sm text-gray-500 text-center">{{ t.noResultsFound }}</p>
              </div>
            </Transition>
          </div>
          
          <!-- Selected User Display -->
          <Transition
            enter-active-class="transition ease-out duration-200"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition ease-in duration-150"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
          >
            <div v-if="selectedUser" class="mt-3 p-3 bg-primary-50 rounded-lg border border-primary-200">
              <div class="flex items-start justify-between">
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold text-primary-900 truncate">{{ selectedUser.name }}</p>
                  <p class="text-xs text-primary-700 truncate">{{ selectedUser.email }}</p>
                  <p v-if="selectedUser.phone" class="text-xs text-primary-700">{{ selectedUser.phone }}</p>
                </div>
                <button
                  type="button"
                  @click="clearUserSelection"
                  class="ml-2 p-1 text-primary-600 hover:text-primary-700 hover:bg-primary-100 rounded transition-colors"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>
          </Transition>
        </div>

        <!-- Delivery Address Card (SHIPPING ONLY) -->
        <Transition
          enter-active-class="transition ease-out duration-200"
          enter-from-class="opacity-0 -translate-y-2"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition ease-in duration-150"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 -translate-y-2"
        >
          <div v-if="form.order_type === 'shipping'" class="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 lg:p-8">
            <div class="flex items-center justify-between mb-4 sm:mb-6">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                </div>
                <h2 class="text-lg sm:text-xl font-bold text-gray-900">{{ t.deliveryAddressTitle }}</h2>
              </div>
              
              <div class="flex items-center gap-3">
                <!-- Copy from User Button (only in detailed mode) -->
                <button
                  v-if="!useSimpleAddress && selectedUser && selectedUser.street"
                  type="button"
                  @click="copyUserAddress"
                  class="inline-flex items-center px-2.5 sm:px-3 py-1.5 bg-primary-50 text-primary-700 text-xs sm:text-sm font-medium rounded-lg hover:bg-primary-100 transition-colors"
                >
                  <svg class="w-3.5 sm:w-4 h-3.5 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                  </svg>
                  <span class="hidden sm:inline">{{ t.copyFromUser }}</span>
                  <span class="sm:hidden">{{ t.copy }}</span>
                </button>
                
                <!-- Simple Address Toggle -->
                <label class="flex items-center gap-2 cursor-pointer">
                  <span class="text-xs sm:text-sm text-gray-600">{{ t.simpleMode }}</span>
                  <button
                    type="button"
                    @click="useSimpleAddress = !useSimpleAddress"
                    :class="[
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                      useSimpleAddress ? 'bg-primary-600' : 'bg-gray-200'
                    ]"
                  >
                    <span
                      :class="[
                        'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                        useSimpleAddress ? 'translate-x-6' : 'translate-x-1'
                      ]"
                    />
                  </button>
                </label>
              </div>
            </div>
            
            <!-- Simple Address Mode -->
            <div v-if="useSimpleAddress" class="space-y-3 sm:space-y-4">
              <div>
                <label for="full_address" class="block text-sm font-medium text-gray-700 mb-1.5">
                  {{ t.fullAddressLabel }} <span class="text-red-500">*</span>
                </label>
                <textarea
                  v-model="form.delivery_address.full_address"
                  id="full_address"
                  rows="3"
                  :placeholder="t.fullAddressPlaceholder"
                  class="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border border-gray-200 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 resize-none"
                  required
                ></textarea>
                <p class="text-xs text-gray-500 mt-1">{{ t.fullAddressHint }}</p>
              </div>

              <!-- Rural Checkbox (in simple mode) -->
              <div class="bg-amber-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-amber-200">
                <label class="flex items-start gap-3 cursor-pointer">
                  <input
                    v-model="form.is_rural"
                    type="checkbox"
                    class="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                  >
                  <div class="flex-1">
                    <span class="text-sm font-medium text-gray-900">{{ t.ruralAreaLabel }}</span>
                    <p class="text-xs sm:text-sm text-gray-600 mt-0.5">{{ t.ruralAreaDescription }}</p>
                  </div>
                </label>
              </div>
            </div>

            <!-- Detailed Address Mode -->
            <div v-else class="space-y-3 sm:space-y-4">
              <!-- Street -->
              <div>
                <label for="street" class="block text-sm font-medium text-gray-700 mb-1.5">
                  {{ t.streetLabel }} <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="form.delivery_address.street"
                  type="text"
                  id="street"
                  :placeholder="t.streetPlaceholder"
                  class="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border border-gray-200 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                  required
                >
              </div>

              <!-- Numbers Grid -->
              <div class="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label for="exterior_number" class="block text-sm font-medium text-gray-700 mb-1.5">
                    {{ t.exteriorNumberLabel }} <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="form.delivery_address.exterior_number"
                    type="text"
                    id="exterior_number"
                    :placeholder="t.exteriorNumberPlaceholder"
                    class="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border border-gray-200 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    required
                  >
                </div>
                <div>
                  <label for="interior_number" class="block text-sm font-medium text-gray-700 mb-1.5">
                    {{ t.interiorNumberLabel }}
                  </label>
                  <input
                    v-model="form.delivery_address.interior_number"
                    type="text"
                    id="interior_number"
                    :placeholder="t.interiorNumberPlaceholder"
                    class="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border border-gray-200 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                  >
                </div>
              </div>

              <!-- Colonia and Municipio -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label for="colonia" class="block text-sm font-medium text-gray-700 mb-1.5">
                    {{ t.coloniaLabel }} <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="form.delivery_address.colonia"
                    type="text"
                    id="colonia"
                    :placeholder="t.coloniaPlaceholder"
                    class="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border border-gray-200 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    required
                  >
                </div>
                <div>
                  <label for="municipio" class="block text-sm font-medium text-gray-700 mb-1.5">
                    {{ t.municipioLabel }} <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="form.delivery_address.municipio"
                    type="text"
                    id="municipio"
                    :placeholder="t.municipioPlaceholder"
                    class="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border border-gray-200 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    required
                  >
                </div>
              </div>

              <!-- Estado and Postal Code -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label for="estado" class="block text-sm font-medium text-gray-700 mb-1.5">
                    {{ t.estadoLabel }} <span class="text-red-500">*</span>
                  </label>
                  <select
                    v-model="form.delivery_address.estado"
                    id="estado"
                    class="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border border-gray-200 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    required
                  >
                    <option value="">{{ t.selectEstado }}</option>
                    <option v-for="estado in mexicanStates" :key="estado" :value="estado">
                      {{ estado }}
                    </option>
                  </select>
                </div>
                <div>
                  <label for="postal_code" class="block text-sm font-medium text-gray-700 mb-1.5">
                    {{ t.postalCodeLabel }} <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="form.delivery_address.postal_code"
                    type="text"
                    id="postal_code"
                    :placeholder="t.postalCodePlaceholder"
                    maxlength="5"
                    pattern="[0-9]{5}"
                    class="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border border-gray-200 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    required
                  >
                </div>
              </div>

              <!-- Referencias -->
              <div>
                <label for="referencias" class="block text-sm font-medium text-gray-700 mb-1.5">
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
              <div class="bg-amber-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-amber-200">
                <label class="flex items-start gap-3 cursor-pointer">
                  <input
                    v-model="form.is_rural"
                    type="checkbox"
                    class="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                  >
                  <div class="flex-1">
                    <span class="text-sm font-medium text-gray-900">{{ t.ruralAreaLabel }}</span>
                    <p class="text-xs sm:text-sm text-gray-600 mt-0.5">{{ t.ruralAreaDescription }}</p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </Transition>

        <!-- Pickup Location Card (CROSSING ONLY) -->
        <Transition
          enter-active-class="transition ease-out duration-200"
          enter-from-class="opacity-0 -translate-y-2"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition ease-in duration-150"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 -translate-y-2"
        >
          <div v-if="form.order_type === 'crossing'" class="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 lg:p-8">
            <div class="flex items-center gap-3 mb-4 sm:mb-6">
              <div class="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-amber-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
                </svg>
              </div>
              <h2 class="text-lg sm:text-xl font-bold text-gray-900">{{ t.pickupLocation }}</h2>
            </div>

            <!-- Pickup Info -->
            <div class="bg-amber-50 rounded-xl p-4 sm:p-6 border border-amber-200">
              <div class="flex items-start gap-4">
                <div class="w-12 h-12 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                  <svg class="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                </div>
                <div class="flex-1">
                  <p class="font-semibold text-gray-900">{{ t.warehouseName }}</p>
                  <p class="text-sm text-gray-600 mt-1">{{ t.warehouseAddress }}</p>
                  <a
                    href="https://maps.app.goo.gl/Qeq2cdHjXtfVnFwZA"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-amber-700 hover:text-amber-800 transition-colors"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                    </svg>
                    {{ t.getDirections }}
                  </a>
                </div>
              </div>
            </div>

            <!-- Info Note -->
            <div class="mt-4 flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <svg class="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <p class="text-sm text-gray-600">{{ t.crossingNote }}</p>
            </div>
          </div>
        </Transition>

        <!-- Action Buttons -->
        <div class="flex flex-col-reverse sm:flex-row gap-3 sm:justify-between pt-2">
          <NuxtLink
            to="/app/admin/orders"
            class="px-4 sm:px-6 py-2.5 sm:py-3 bg-white text-gray-700 font-medium rounded-lg sm:rounded-xl border border-gray-300 hover:bg-gray-50 transition-all duration-200 text-center text-sm sm:text-base"
          >
            {{ t.cancel }}
          </NuxtLink>
          
          <button
            type="submit"
            :disabled="creating || !selectedUser || !isFormValid"
            :class="[
              'px-6 sm:px-8 py-2.5 sm:py-3 font-medium rounded-lg sm:rounded-xl shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base text-white',
              form.order_type === 'crossing' 
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700' 
                : 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700'
            ]"
          >
            <svg v-if="creating" class="animate-spin -ml-1 mr-2 h-4 w-4 sm:h-5 sm:w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span v-if="!creating">
              {{ form.order_type === 'crossing' ? t.createCrossingOrder : t.createShippingOrder }}
            </span>
            <span v-else>{{ t.creating }}</span>
          </button>
        </div>
      </form>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin']
})

const { $customFetch, $toast } = useNuxtApp()
const router = useRouter()
const { t: createTranslations } = useLanguage()

// State
const creating = ref(false)
const errorMessage = ref('')
const users = ref([])
const selectedUser = ref(null)
const userSearch = ref('')
const showUserDropdown = ref(false)
const loadingUsers = ref(false)
const useSimpleAddress = ref(true)
const searchContainer = ref(null)
const searchTimeout = ref(null)

// Form data
const form = ref({
  user_id: null,
  status: 'collecting',
  order_type: 'shipping',
  delivery_address: {
    full_address: '',
    street: '',
    exterior_number: '',
    interior_number: '',
    colonia: '',
    municipio: '',
    estado: '',
    postal_code: '',
    referencias: ''
  },
  is_rural: false
})

// Mexican states
const mexicanStates = [
  'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas',
  'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima', 'Durango', 'Guanajuato',
  'Guerrero', 'Hidalgo', 'Jalisco', 'México', 'Michoacán', 'Morelos', 'Nayarit',
  'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí',
  'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas'
]

// Translations
const translations = {
  createNewOrder: { es: 'Crear Nueva Orden', en: 'Create New Order' },
  createOrderSubtitle: { es: 'Selecciona el tipo de orden, cliente y configura los detalles', en: 'Select order type, customer and configure details' },
  
  // Order Type
  orderType: { es: 'Tipo de Orden', en: 'Order Type' },
  shippingOption: { es: 'Envío a Domicilio', en: 'Home Delivery' },
  shippingDescription: { es: 'Entrega en la dirección del cliente en México', en: 'Delivery to customer address in Mexico' },
  crossingOption: { es: 'Solo Cruce', en: 'Crossing Only' },
  crossingDescription: { es: 'El cliente recoge en nuestra bodega de Tijuana', en: 'Customer picks up at our Tijuana warehouse' },
 
  // Customer
  selectCustomer: { es: 'Cliente', en: 'Customer' },
  customerLabel: { es: 'Buscar Cliente', en: 'Search Customer' },
  searchUserPlaceholder: { es: 'Buscar por nombre o email...', en: 'Search by name or email...' },
  noPhone: { es: 'Sin teléfono', en: 'No phone' },
  noResultsFound: { es: 'No se encontraron resultados', en: 'No results found' },
  
  // Delivery Address
  copyFromUser: { es: 'Copiar Dirección', en: 'Copy Address' },
  copy: { es: 'Copiar', en: 'Copy' },
  simpleMode: { es: 'Modo simple', en: 'Simple mode' },
  deliveryAddressTitle: { es: 'Dirección de Entrega', en: 'Delivery Address' },
  fullAddressLabel: { es: 'Dirección Completa', en: 'Full Address' },
  fullAddressPlaceholder: { es: 'Ej: Av. Revolución 123, Col. Centro, Tijuana, Baja California 22000', en: 'E.g.: Av. Revolución 123, Col. Centro, Tijuana, Baja California 22000' },
  fullAddressHint: { es: 'Pega la dirección completa en un solo campo', en: 'Paste the complete address in a single field' },
  streetLabel: { es: 'Calle', en: 'Street' },
  streetPlaceholder: { es: 'Nombre de la calle', en: 'Street name' },
  exteriorNumberLabel: { es: 'Número Exterior', en: 'Exterior Number' },
  exteriorNumberPlaceholder: { es: '123', en: '123' },
  interiorNumberLabel: { es: 'Número Interior', en: 'Interior Number' },
  interiorNumberPlaceholder: { es: 'Opcional', en: 'Optional' },
  coloniaLabel: { es: 'Colonia', en: 'Neighborhood' },
  coloniaPlaceholder: { es: 'Nombre de la colonia', en: 'Neighborhood name' },
  municipioLabel: { es: 'Municipio/Delegación', en: 'Municipality' },
  municipioPlaceholder: { es: 'Municipio o delegación', en: 'Municipality' },
  estadoLabel: { es: 'Estado', en: 'State' },
  selectEstado: { es: 'Selecciona un estado', en: 'Select a state' },
  postalCodeLabel: { es: 'Código Postal', en: 'Postal Code' },
  postalCodePlaceholder: { es: '12345', en: '12345' },
  referenciasLabel: { es: 'Referencias', en: 'References' },
  referenciasPlaceholder: { es: 'Entre calles, puntos de referencia, color de la casa, etc.', en: 'Between streets, landmarks, house color, etc.' },
  ruralAreaLabel: { es: 'Zona Rural', en: 'Rural Area' },
  ruralAreaDescription: { es: 'Marca si la dirección está en una zona rural (cargo adicional)', en: 'Check if the address is in a rural area (additional charge)' },
  
  // Pickup Location
  pickupLocation: { es: 'Ubicación de Recolección', en: 'Pickup Location' },
  warehouseName: { es: 'Bodega Boxly - Tijuana', en: 'Boxly Warehouse - Tijuana' },
  warehouseAddress: { es: 'Blvd. Insurgentes #18512, Río Tijuana 3ra Etapa, Tijuana, BC', en: 'Blvd. Insurgentes #18512, Río Tijuana 3ra Etapa, Tijuana, BC' },
  getDirections: { es: 'Ver en Google Maps', en: 'See in Google Maps' },
  crossingNote: { es: 'El cliente deberá pagar el 100% del total antes de poder recoger sus paquetes. Se le enviará una factura por correo cuando la orden esté lista.', en: 'Customer must pay 100% of the total before picking up. An invoice will be sent via email when the order is ready.' },
  
  // Actions
  cancel: { es: 'Cancelar', en: 'Cancel' },
  createShippingOrder: { es: 'Crear Orden de Envío', en: 'Create Shipping Order' },
  createCrossingOrder: { es: 'Crear Orden de Cruce', en: 'Create Crossing Order' },
  creating: { es: 'Creando...', en: 'Creating...' },
  orderCreatedSuccess: { es: 'Orden creada exitosamente', en: 'Order created successfully' },
  generalError: { es: 'Ocurrió un error. Por favor, intenta de nuevo.', en: 'An error occurred. Please try again.' },
  selectCustomerError: { es: 'Por favor selecciona un cliente', en: 'Please select a customer' },
  addressRequiredError: { es: 'Por favor ingresa la dirección de entrega', en: 'Please enter the delivery address' },
  addressCopied: { es: 'Dirección copiada del cliente', en: 'Address copied from customer' }
}

const t = createTranslations(translations)

// Computed
const isFormValid = computed(() => {
  if (!selectedUser.value) return false
  
  // For crossing orders, no address needed
  if (form.value.order_type === 'crossing') return true
  
  // For shipping orders, need address
  if (useSimpleAddress.value) {
    return !!form.value.delivery_address.full_address?.trim()
  } else {
    return !!(
      form.value.delivery_address.street?.trim() &&
      form.value.delivery_address.exterior_number?.trim() &&
      form.value.delivery_address.colonia?.trim() &&
      form.value.delivery_address.municipio?.trim() &&
      form.value.delivery_address.estado?.trim() &&
      form.value.delivery_address.postal_code?.trim()
    )
  }
})

// Methods
const fetchUsers = async (search = '') => {
  loadingUsers.value = true
  try {
    const params = new URLSearchParams({ limit: '20' })
    if (search.trim()) {
      params.append('search', search.trim())
    }
    
    const response = await $customFetch(`/admin/customers?${params}`)
    if (response.success && response.data) {
      users.value = response.data.data || response.data
    }
  } catch (error) {
    console.error('Error fetching users:', error)
    $toast.error('Error loading customers')
  } finally {
    loadingUsers.value = false
  }
}

// Debounced search watcher
watch(userSearch, (newValue) => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }
  
  searchTimeout.value = setTimeout(() => {
    fetchUsers(newValue)
  }, 300)
})

const selectUser = (user) => {
  selectedUser.value = user
  form.value.user_id = user.id
  userSearch.value = ''
  showUserDropdown.value = false
  
  // Only auto-fill address for shipping orders
  const hasAddress = user.street || user.full_address
  if (form.value.order_type === 'shipping' && hasAddress) {
    if (useSimpleAddress.value) {
      if (user.full_address) {
        form.value.delivery_address.full_address = user.full_address
      } else {
        const parts = [
          user.street,
          user.exterior_number,
          user.colonia,
          user.municipio,
          user.estado,
          user.postal_code
        ].filter(Boolean)
        form.value.delivery_address.full_address = parts.join(', ')
      }
    } else {
      form.value.delivery_address = {
        full_address: user.full_address || '',
        street: user.street || '',
        exterior_number: user.exterior_number || '',
        interior_number: user.interior_number || '',
        colonia: user.colonia || '',
        municipio: user.municipio || '',
        estado: user.estado || '',
        postal_code: user.postal_code || '',
        referencias: ''
      }
    }

    setTimeout(() => {
      $toast.success(t.value.addressCopied)
    }, 300)
  }
}

const clearUserSelection = () => {
  selectedUser.value = null
  form.value.user_id = null
  userSearch.value = ''
}

const copyUserAddress = () => {
  if (!selectedUser.value) return

  const user = selectedUser.value
  form.value.delivery_address = {
    full_address: user.full_address || '',
    street: user.street || '',
    exterior_number: user.exterior_number || '',
    interior_number: user.interior_number || '',
    colonia: user.colonia || '',
    municipio: user.municipio || '',
    estado: user.estado || '',
    postal_code: user.postal_code || '',
    referencias: ''
  }

  $toast.success(t.value.addressCopied)
}

const handleSubmit = async () => {
  if (!selectedUser.value) {
    errorMessage.value = t.value.selectCustomerError
    return
  }

  // Validate address for shipping orders
  if (form.value.order_type === 'shipping' && !isFormValid.value) {
    errorMessage.value = t.value.addressRequiredError
    return
  }

  creating.value = true
  errorMessage.value = ''

  try {
    // Build request body
    const body = {
      user_id: form.value.user_id,
      status: form.value.status,
      order_type: form.value.order_type,
    }

    // Only include delivery address for shipping orders
    if (form.value.order_type === 'shipping') {
      if (useSimpleAddress.value) {
        body.delivery_address = {
          full_address: form.value.delivery_address.full_address
        }
      } else {
        body.delivery_address = {
          street: form.value.delivery_address.street,
          exterior_number: form.value.delivery_address.exterior_number,
          interior_number: form.value.delivery_address.interior_number,
          colonia: form.value.delivery_address.colonia,
          municipio: form.value.delivery_address.municipio,
          estado: form.value.delivery_address.estado,
          postal_code: form.value.delivery_address.postal_code,
          referencias: form.value.delivery_address.referencias
        }
      }
      body.is_rural = form.value.is_rural
    }

    const response = await $customFetch('/admin/management/orders', {
      method: 'POST',
      body
    })

    if (response.success) {
      $toast.success(t.value.orderCreatedSuccess)
      await router.push(`/app/admin/orders/${response.data.id}`)
    }
  } catch (error) {
    console.error('Error creating order:', error)
    errorMessage.value = error.data?.message || t.value.generalError
    $toast.error(errorMessage.value)
  } finally {
    creating.value = false
  }
}

const handleClickOutside = (event) => {
  if (searchContainer.value && !searchContainer.value.contains(event.target)) {
    showUserDropdown.value = false
  }
}

onMounted(() => {
  fetchUsers()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }
})
</script>

<style scoped>
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fadeIn {
  animation: fadeIn 0.6s ease-out forwards;
  opacity: 0;
}
</style>