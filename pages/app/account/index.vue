<template>
  <section class="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/20">
    <!-- Loading State -->
    <div v-if="loading" class="min-h-screen flex items-center justify-center">
      <div class="text-center">
        <svg class="inline-block w-16 h-16 text-primary-500 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="mt-4 text-gray-600">{{ t.loading }}</p>
      </div>
    </div>

    <!-- Content (shown when not loading) -->
    <div v-else>
      <!-- Header -->
      <div class="bg-white/90 backdrop-blur-sm shadow-sm border-b border-gray-100">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-900">{{ t.myAccount }}</h1>
              <p class="mt-1 text-sm text-gray-600">{{ t.manageYourInfo }}</p>
            </div>
            <NuxtLink
              to="/app/account/edit"
              class="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-all"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
              {{ t.editProfile }}
            </NuxtLink>
          </div>
        </div>
      </div>
  
      <!-- Main Content -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Left Column - Profile Info -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Basic Information -->
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div class="px-6 py-4 border-b border-gray-100">
                <h2 class="text-lg font-bold text-gray-900">{{ t.basicInformation }}</h2>
              </div>
              <div class="p-6 space-y-4">
                <!-- Name -->
                <div>
                  <label class="block text-sm font-medium text-gray-500 mb-1">{{ t.fullName }}</label>
                  <p class="text-base text-gray-900">{{ profileData?.name || '-' }}</p>
                </div>
                
                <!-- Email -->
                <div>
                  <label class="block text-sm font-medium text-gray-500 mb-1">{{ t.email }}</label>
                  <div class="flex items-center gap-2">
                    <p class="text-base text-gray-900">{{ profileData?.email || '-' }}</p>
                    <span v-if="!user?.email_verified_at" class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                      {{ t.unverified }}
                    </span>
                    <span v-else class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      {{ t.verified }}
                    </span>
                  </div>
                </div>
                
                <!-- Phone -->
                <div>
                  <label class="block text-sm font-medium text-gray-500 mb-1">{{ t.phone }}</label>
                  <p class="text-base text-gray-900">{{ profileData?.phone || t.notProvided }}</p>
                </div>
                
                <!-- Language -->
                <div>
                  <label class="block text-sm font-medium text-gray-500 mb-1">{{ t.preferredLanguage }}</label>
                  <p class="text-base text-gray-900">
                    {{ currentLanguageDisplay }}
                  </p>
                </div>
  
                <!-- Member Since -->
                <div>
                  <label class="block text-sm font-medium text-gray-500 mb-1">{{ t.memberSince }}</label>
                  <p class="text-base text-gray-900">{{ formatDate(profileData?.created_at) }}</p>
                </div>
              </div>
            </div>
  
            <!-- Shipping Address -->
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 class="text-lg font-bold text-gray-900">{{ t.shippingAddress }}</h2>
                <div class="flex items-center gap-2">
                  <span v-if="!profileData?.has_complete_address && !profileData?.full_address" class="text-sm text-amber-600 font-medium">
                    {{ t.incomplete }}
                  </span>
                  <NuxtLink
                    v-if="profileData?.has_complete_address || profileData?.full_address"
                    to="/app/account/shipping-address"
                    class="text-sm text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-1"
                  >
                    {{ t.editAddress }}
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                  </NuxtLink>
                </div>
              </div>
              <div class="p-6">
                <!-- Individual address fields -->
                <div v-if="profileData?.has_complete_address" class="space-y-2">
                  <p class="text-gray-900">
                    {{ profileData.address.street }} {{ profileData.address.exterior_number }}
                    <span v-if="profileData.address.interior_number">Int. {{ profileData.address.interior_number }}</span>
                  </p>
                  <p class="text-gray-900">{{ profileData.address.colonia }}</p>
                  <p class="text-gray-900">{{ profileData.address.municipio }}, {{ profileData.address.estado }}</p>
                  <p class="text-gray-900">C.P. {{ profileData.address.postal_code }}</p>
                </div>
                <!-- Full address string -->
                <div v-else-if="profileData?.full_address" class="space-y-2">
                  <p class="text-gray-900 whitespace-pre-line">{{ profileData.full_address }}</p>
                </div>
                <div v-else class="text-center py-8">
                  <div class="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-3">
                    <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                  </div>
                  <p class="text-gray-500 mb-4">{{ t.noAddressSet }}</p>
                  <NuxtLink
                    to="/app/account/shipping-address"
                    class="text-primary-600 hover:text-primary-700 font-medium text-sm"
                  >
                    {{ t.addAddress }}
                  </NuxtLink>
                </div>
              </div>
            </div>
  
            <!-- Payment Methods -->
<div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
  <!-- Header -->
  <div class="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
    <h2 class="text-lg font-bold text-gray-900">{{ t.paymentMethods }}</h2>
    <button
      @click="handleAddPaymentMethod"
      :disabled="addingPaymentMethod"
      class="text-sm text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-1.5 disabled:opacity-50 transition-colors touch-manipulation"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
      </svg>
      <span class="hidden sm:inline">{{ t.addNew }}</span>
      <span class="sm:hidden">{{ t.add }}</span>
    </button>
  </div>
  
  <div class="p-4 sm:p-6">
    <!-- Success/Error Messages -->
    <div v-if="paymentMethodMessage" class="mb-4">
      <div
        :class="[
          'p-3 sm:p-4 rounded-lg flex items-start gap-3',
          paymentMethodMessageType === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        ]"
      >
        <div class="flex-shrink-0 mt-0.5">
          <svg v-if="paymentMethodMessageType === 'success'" class="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <svg v-else class="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p class="text-sm font-medium flex-1">{{ paymentMethodMessage }}</p>
      </div>
    </div>

    <!-- Loading Payment Methods -->
    <div v-if="loadingPaymentMethods" class="text-center py-12">
      <svg class="inline-block w-8 h-8 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>

    <!-- Payment Methods List -->
    <div v-else-if="paymentMethods.length > 0" class="space-y-3">
      <div
        v-for="method in paymentMethods"
        :key="method.id"
        class="group relative bg-gray-50 border border-gray-200 rounded-xl hover:border-gray-300 hover:bg-white transition-all duration-200"
      >
        <!-- Mobile Layout -->
        <div class="sm:hidden p-4">
          <div class="flex items-start justify-between mb-3">
            <div class="flex items-center gap-3 flex-1">
              <div class="p-2.5 bg-white rounded-lg shadow-sm">
                <svg v-if="method.brand === 'visa'" class="w-8 h-6" viewBox="0 0 48 32" fill="none">
                  <rect width="48" height="32" rx="4" fill="#1A1F71"/>
                  <path d="M20.5 21H17.5L19.5 11H22.5L20.5 21Z" fill="white"/>
                  <path d="M30.5 11.3C29.9 11.1 28.9 10.9 27.7 10.9C24.8 10.9 22.7 12.4 22.7 14.5C22.7 16 24.2 16.8 25.3 17.3C26.5 17.8 26.9 18.1 26.9 18.6C26.9 19.3 26 19.6 25.2 19.6C23.9 19.6 23.2 19.4 22.1 18.9L21.7 18.7L21.3 21.1C22.1 21.5 23.6 21.8 25.2 21.8C28.3 21.8 30.3 20.3 30.3 18.1C30.3 16.8 29.5 15.8 27.6 15C26.5 14.5 25.8 14.2 25.8 13.6C25.8 13.1 26.4 12.5 27.5 12.5C28.5 12.5 29.2 12.7 29.7 12.9L30 13L30.5 11.3Z" fill="white"/>
                  <path d="M35.6 11H33.4C32.7 11 32.2 11.2 31.9 11.9L27.6 21H30.7L31.3 19.5H35.1L35.5 21H38.3L35.6 11ZM32.3 17.5C32.5 17 33.3 14.8 33.3 14.8C33.3 14.8 33.5 14.2 33.6 13.8L33.8 14.7C33.8 14.7 34.3 16.9 34.4 17.5H32.3Z" fill="white"/>
                  <path d="M14.7 11L11.8 17.9L11.5 16.2C11 14.6 9.3 12.8 7.4 11.9L10 21H13.2L17.9 11H14.7Z" fill="white"/>
                  <path d="M8.5 11H3.5L3.5 11.2C7.4 12.2 10 14.4 11 16.2L10 11.9C9.8 11.2 9.3 11 8.5 11Z" fill="#F9A51A"/>
                </svg>
                <svg v-else-if="method.brand === 'mastercard'" class="w-8 h-6" viewBox="0 0 48 32" fill="none">
                  <rect width="48" height="32" rx="4" fill="#1E1E1E"/>
                  <circle cx="19" cy="16" r="10" fill="#EB001B"/>
                  <circle cx="29" cy="16" r="10" fill="#F79E1B"/>
                  <path d="M24 9.5C25.8 11.2 27 13.5 27 16C27 18.5 25.8 20.8 24 22.5C22.2 20.8 21 18.5 21 16C21 13.5 22.2 11.2 24 9.5Z" fill="#FF5F00"/>
                </svg>
                <svg v-else-if="method.brand === 'amex'" class="w-8 h-6" viewBox="0 0 48 32" fill="none">
                  <rect width="48" height="32" rx="4" fill="#2E77BB"/>
                  <path d="M12 12H16L14 20H10L12 12Z" fill="white"/>
                  <path d="M18 12H22L24 16L26 12H30L26 20H22L20 16L18 20H14L18 12Z" fill="white"/>
                  <path d="M30 12H38V14H34V15H38V17H34V18H38V20H30V12Z" fill="white"/>
                </svg>
                <svg v-else class="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-gray-900 font-semibold text-base">
                  •••• {{ method.last4 }}
                </p>
                <p class="text-sm text-gray-500 mt-0.5">
                  {{ getCardBrandDisplay(method.brand) }}
                </p>
              </div>
            </div>
            <span v-if="method.is_default" class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
              {{ t.default }}
            </span>
          </div>
          
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-500">{{ t.expires }} {{ method.exp_month }}/{{ method.exp_year }}</span>
            <div class="flex items-center gap-3">
              <button
                v-if="!method.is_default"
                @click="setDefaultPaymentMethod(method.id)"
                :disabled="settingDefault === method.id"
                class="text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50 touch-manipulation"
              >
                {{ settingDefault === method.id ? '...' : t.makeDefault }}
              </button>
              <button
                @click="deletePaymentMethod(method.id)"
                :disabled="deletingMethod === method.id || method.is_default"
                class="text-red-600 hover:text-red-700 font-medium disabled:opacity-50 touch-manipulation"
                :title="method.is_default ? t.cannotDeleteDefault : ''"
              >
                {{ deletingMethod === method.id ? '...' : t.remove }}
              </button>
            </div>
          </div>
        </div>

        <!-- Desktop Layout -->
        <div class="hidden sm:flex items-center justify-between p-4">
          <div class="flex items-center gap-4">
            <div class="p-2.5 bg-white rounded-lg shadow-sm">
              <svg v-if="method.brand === 'visa'" class="w-10 h-7" viewBox="0 0 48 32" fill="none">
                <rect width="48" height="32" rx="4" fill="#1A1F71"/>
                <path d="M20.5 21H17.5L19.5 11H22.5L20.5 21Z" fill="white"/>
                <path d="M30.5 11.3C29.9 11.1 28.9 10.9 27.7 10.9C24.8 10.9 22.7 12.4 22.7 14.5C22.7 16 24.2 16.8 25.3 17.3C26.5 17.8 26.9 18.1 26.9 18.6C26.9 19.3 26 19.6 25.2 19.6C23.9 19.6 23.2 19.4 22.1 18.9L21.7 18.7L21.3 21.1C22.1 21.5 23.6 21.8 25.2 21.8C28.3 21.8 30.3 20.3 30.3 18.1C30.3 16.8 29.5 15.8 27.6 15C26.5 14.5 25.8 14.2 25.8 13.6C25.8 13.1 26.4 12.5 27.5 12.5C28.5 12.5 29.2 12.7 29.7 12.9L30 13L30.5 11.3Z" fill="white"/>
                <path d="M35.6 11H33.4C32.7 11 32.2 11.2 31.9 11.9L27.6 21H30.7L31.3 19.5H35.1L35.5 21H38.3L35.6 11ZM32.3 17.5C32.5 17 33.3 14.8 33.3 14.8C33.3 14.8 33.5 14.2 33.6 13.8L33.8 14.7C33.8 14.7 34.3 16.9 34.4 17.5H32.3Z" fill="white"/>
                <path d="M14.7 11L11.8 17.9L11.5 16.2C11 14.6 9.3 12.8 7.4 11.9L10 21H13.2L17.9 11H14.7Z" fill="white"/>
                <path d="M8.5 11H3.5L3.5 11.2C7.4 12.2 10 14.4 11 16.2L10 11.9C9.8 11.2 9.3 11 8.5 11Z" fill="#F9A51A"/>
              </svg>
              <svg v-else-if="method.brand === 'mastercard'" class="w-10 h-7" viewBox="0 0 48 32" fill="none">
                <rect width="48" height="32" rx="4" fill="#1E1E1E"/>
                <circle cx="19" cy="16" r="10" fill="#EB001B"/>
                <circle cx="29" cy="16" r="10" fill="#F79E1B"/>
                <path d="M24 9.5C25.8 11.2 27 13.5 27 16C27 18.5 25.8 20.8 24 22.5C22.2 20.8 21 18.5 21 16C21 13.5 22.2 11.2 24 9.5Z" fill="#FF5F00"/>
              </svg>
              <svg v-else-if="method.brand === 'amex'" class="w-10 h-7" viewBox="0 0 48 32" fill="none">
                <rect width="48" height="32" rx="4" fill="#2E77BB"/>
                <path d="M12 12H16L14 20H10L12 12Z" fill="white"/>
                <path d="M18 12H22L24 16L26 12H30L26 20H22L20 16L18 20H14L18 12Z" fill="white"/>
                <path d="M30 12H38V14H34V15H38V17H34V18H38V20H30V12Z" fill="white"/>
              </svg>
              <svg v-else class="w-7 h-7 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
              </svg>
            </div>
            <div>
              <p class="text-gray-900 font-semibold">
                {{ getCardBrandDisplay(method.brand) }} •••• {{ method.last4 }}
              </p>
              <p class="text-sm text-gray-500 mt-0.5">
                {{ t.expires }} {{ method.exp_month }}/{{ method.exp_year }}
                <span v-if="method.is_default" class="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                  {{ t.default }}
                </span>
              </p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <button
              v-if="!method.is_default"
              @click="setDefaultPaymentMethod(method.id)"
              :disabled="settingDefault === method.id"
              class="text-sm text-gray-600 hover:text-gray-800 font-medium disabled:opacity-50 transition-colors"
            >
              {{ settingDefault === method.id ? t.loading + '...' : t.setAsDefault }}
            </button>
            <button
              @click="deletePaymentMethod(method.id)"
              :disabled="deletingMethod === method.id || method.is_default"
              class="text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50 transition-colors"
              :title="method.is_default ? t.cannotDeleteDefault : ''"
            >
              {{ deletingMethod === method.id ? t.loading + '...' : t.delete }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- No Payment Methods -->
    <div v-else class="text-center py-8 sm:py-12">
      <div class="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
        <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
        </svg>
      </div>
      <p class="text-gray-500 mb-6 text-base">{{ t.noPaymentMethod }}</p>
      <button 
        @click="handleAddPaymentMethod"
        :disabled="addingPaymentMethod"
        class="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation shadow-sm"
      >
        <svg v-if="addingPaymentMethod" class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        <span>{{ addingPaymentMethod ? t.loading + '...' : t.addPaymentMethod }}</span>
      </button>
    </div>

    <!-- Additional Info -->
    <div class="mt-6 p-4 bg-gradient-to-r from-primary-50 to-indigo-50 rounded-xl border border-primary-100">
      <div class="flex items-start gap-3">
        <svg class="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <div class="flex-1">
          <p class="text-sm text-primary-900 font-medium mb-1">{{ t.acceptedCards }}</p>
          <p class="text-xs text-primary-700">{{ t.securePayments }}</p>
        </div>
      </div>
    </div>
  </div>
</div>

            <!-- Connect your AI (MCP) -->
            <AiConnectCard />
          </div>

          <!-- Right Column - Stats & Actions -->
          <div class="space-y-6">
            <!-- Account Stats -->
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div class="px-6 py-4 border-b border-gray-100">
                <h2 class="text-lg font-bold text-gray-900">{{ t.accountStats }}</h2>
              </div>
              <div class="p-6 space-y-4">
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-500">{{ t.totalOrders }}</span>
                  <span class="text-lg font-semibold text-gray-900">{{ profileData?.total_orders || 0 }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-500">{{ t.activeOrders }}</span>
                  <span class="text-lg font-semibold text-primary-600">{{ profileData?.active_orders || 0 }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-500">{{ t.completedOrders }}</span>
                  <span class="text-lg font-semibold text-green-600">{{ profileData?.completed_orders || 0 }}</span>
                </div>
              </div>
            </div>

            <!-- Support -->
            <div class="bg-gradient-to-r from-primary-50 to-primary-100/50 rounded-2xl p-6 border border-primary-200/50">
              <div class="flex items-center gap-3 mb-3">
                <div class="p-2 bg-primary-100 rounded-lg">
                  <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <h3 class="font-semibold text-gray-900">{{ t.needHelp }}</h3>
              </div>
              <p class="text-sm text-gray-700 mb-4">{{ t.supportText }}</p>
              
              <!-- Contact Options -->
              <div class="space-y-3">
                <!-- WhatsApp -->
                <a
                  href="https://wa.me/16195591910"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex items-center gap-3 p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
                >
                  <div class="p-2 bg-green-100 rounded-lg flex-shrink-0">
                    <svg class="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824zm-3.423-14.416c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm.029 18.88c-1.161 0-2.305-.292-3.318-.844l-3.677.964.98-3.686c-.592-1.02-.9-2.176-.898-3.358.002-3.808 3.105-6.912 6.913-6.912 3.809 0 6.913 3.104 6.913 6.913s-3.104 6.923-6.913 6.923z"/>
                    </svg>
                  </div>
                  <div class="flex-1">
                    <p class="text-sm font-medium text-gray-900">{{ t.whatsapp }}</p>
                    <p class="text-xs text-gray-500">+1 (619) 559-1910</p>
                  </div>
                  <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                  </svg>
                </a>
                
                <!-- Email -->
                <a
                  href="mailto:contact@boxly.mx"
                  class="flex items-center gap-3 p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
                >
                  <div class="p-2 bg-primary-100 rounded-lg flex-shrink-0">
                    <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                    </svg>
                  </div>
                  <div class="flex-1">
                    <p class="text-sm font-medium text-gray-900">{{ t.emailSupport }}</p>
                    <p class="text-xs text-gray-500">contact@boxly.mx</p>
                  </div>
                  <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'

definePageMeta({
  layout: 'app',
  middleware: ['auth', 'customer', 'complete-profile']
})

// Nuxt imports
const { $customFetch } = useNuxtApp()
const user = useUser()
const router = useRouter()

// Use the language composable
const { t: createTranslations, language } = useLanguage()

// State
const profileData = ref(null)
const loading = ref(true)
const addingPaymentMethod = ref(false)
const paymentMethodMessage = ref('')
const paymentMethodMessageType = ref('success')
const paymentMethods = ref([])
const loadingPaymentMethods = ref(false)
const deletingMethod = ref(null)
const settingDefault = ref(null)

// Computed property for current language display
const currentLanguageDisplay = computed(() => {
  return language.value === 'es' ? 'Español' : 'English'
})

// Translations
const translations = {
  myAccount: {
    es: 'Mi Cuenta',
    en: 'My Account'
  },
  manageYourInfo: {
    es: 'Administra tu información personal y preferencias',
    en: 'Manage your personal information and preferences'
  },
  editProfile: {
    es: 'Editar Perfil',
    en: 'Edit Profile'
  },
  basicInformation: {
    es: 'Información Básica',
    en: 'Basic Information'
  },
  fullName: {
    es: 'Nombre Completo',
    en: 'Full Name'
  },
  email: {
    es: 'Correo Electrónico',
    en: 'Email'
  },
  phone: {
    es: 'Teléfono',
    en: 'Phone'
  },
  preferredLanguage: {
    es: 'Idioma Preferido',
    en: 'Preferred Language'
  },
  memberSince: {
    es: 'Miembro Desde',
    en: 'Member Since'
  },
  shippingAddress: {
    es: 'Dirección de Envío',
    en: 'Shipping Address'
  },
  paymentMethod: {
    es: 'Método de Pago',
    en: 'Payment Method'
  },
  paymentMethods: {
    es: 'Métodos de Pago',
    en: 'Payment Methods'
  },
  accountStats: {
    es: 'Estadísticas de Cuenta',
    en: 'Account Stats'
  },
  totalOrders: {
    es: 'Total de Órdenes',
    en: 'Total Orders'
  },
  activeOrders: {
    es: 'Órdenes Activas',
    en: 'Active Orders'
  },
  completedOrders: {
    es: 'Órdenes Completadas',
    en: 'Completed Orders'
  },
  needHelp: {
    es: '¿Necesitas Ayuda?',
    en: 'Need Help?'
  },
  supportText: {
    es: 'Nuestro equipo está aquí para ayudarte',
    en: 'Our team is here to help you'
  },
  notProvided: {
    es: 'No proporcionado',
    en: 'Not provided'
  },
  verified: {
    es: 'Verificado',
    en: 'Verified'
  },
  unverified: {
    es: 'No verificado',
    en: 'Unverified'
  },
  incomplete: {
    es: 'Incompleto',
    en: 'Incomplete'
  },
  noAddressSet: {
    es: 'No has configurado tu dirección de envío',
    en: 'You haven\'t set up your shipping address'
  },
  addAddress: {
    es: 'Agregar Dirección',
    en: 'Add Address'
  },
  defaultPayment: {
    es: 'Método de pago predeterminado',
    en: 'Default payment method'
  },
  noPaymentMethod: {
    es: 'No has agregado un método de pago',
    en: 'You haven\'t added a payment method'
  },
  addPaymentMethod: {
    es: 'Agregar Método de Pago',
    en: 'Add Payment Method'
  },
  editAddress: {
    es: 'Editar',
    en: 'Edit'
  },
  loading: {
    es: 'Cargando',
    en: 'Loading'
  },
  whatsapp: {
    es: 'WhatsApp',
    en: 'WhatsApp'
  },
  emailSupport: {
    es: 'Correo Electrónico',
    en: 'Email'
  },
  acceptedCards: {
    es: 'Aceptamos tarjetas de débito y crédito de México y Estados Unidos',
    en: 'We accept debit and credit cards from Mexico and United States'
  },
  paymentMethodSuccess: {
    es: '¡Método de pago agregado exitosamente!',
    en: 'Payment method added successfully!'
  },
  paymentMethodCancelled: {
    es: 'Proceso de pago cancelado',
    en: 'Payment setup cancelled'
  },
  paymentMethodError: {
    es: 'Error al configurar el método de pago. Por favor intenta de nuevo.',
    en: 'Error setting up payment method. Please try again.'
  },
  addNew: {
    es: 'Agregar Nuevo',
    en: 'Add New'
  },
  expires: {
    es: 'Expira',
    en: 'Expires'
  },
  default: {
    es: 'Predeterminado',
    en: 'Default'
  },
  setAsDefault: {
    es: 'Establecer como predeterminado',
    en: 'Set as default'
  },
  delete: {
    es: 'Eliminar',
    en: 'Delete'
  },
  cannotDeleteDefault: {
    es: 'No puedes eliminar el método de pago predeterminado',
    en: 'Cannot delete default payment method'
  },
  deleteSuccess: {
    es: 'Método de pago eliminado exitosamente',
    en: 'Payment method deleted successfully'
  },
  deleteError: {
    es: 'Error al eliminar el método de pago',
    en: 'Error deleting payment method'
  },
  setDefaultSuccess: {
    es: 'Método de pago predeterminado actualizado',
    en: 'Default payment method updated'
  },
  setDefaultError: {
    es: 'Error al actualizar el método de pago predeterminado',
    en: 'Error updating default payment method'
  },
  add: {
    es: 'Agregar',
    en: 'Add'
  },
  makeDefault: {
    es: 'Predeterminado',
    en: 'Make Default'
  },
  remove: {
    es: 'Eliminar',
    en: 'Remove'
  },
  securePayments: {
    es: 'Tus pagos están protegidos con encriptación de nivel bancario',
    en: 'Your payments are protected with bank-level encryption'
  }
}

// Get reactive translations
const t = createTranslations(translations)

// Methods
const fetchProfile = async () => {
  loading.value = true
  try {
    const response = await $customFetch('/profile')
    profileData.value = response.data
    // Refresh user data
    await useUser().refresh()
  } catch (error) {
    console.error('Error fetching profile:', error)
  } finally {
    loading.value = false
  }
}

const fetchPaymentMethods = async () => {
  loadingPaymentMethods.value = true
  try {
    const response = await $customFetch('/payment-methods')
    paymentMethods.value = response.data || []
  } catch (error) {
    console.error('Error fetching payment methods:', error)
  } finally {
    loadingPaymentMethods.value = false
  }
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString(language.value === 'es' ? 'es-MX' : 'en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

const getCardBrandDisplay = (brand) => {
  const brandNames = {
    'visa': 'Visa',
    'mastercard': 'Mastercard',
    'amex': 'American Express',
    'discover': 'Discover',
    'diners': 'Diners Club',
    'jcb': 'JCB',
    'unionpay': 'UnionPay'
  }
  return brandNames[brand?.toLowerCase()] || brand || 'Card'
}

const handleAddPaymentMethod = async () => {
  addingPaymentMethod.value = true
  paymentMethodMessage.value = ''
  
  try {
    const response = await $customFetch('/payment-methods/setup-session', {
      method: 'POST'
    })
    
    if (response.success && response.checkout_url) {
      // Redirect to Stripe Checkout
      window.location.href = response.checkout_url
    } else {
      // Show error message
      paymentMethodMessage.value = t.value.paymentMethodError
      paymentMethodMessageType.value = 'error'
      
      // Clear message after 5 seconds
      setTimeout(() => {
        paymentMethodMessage.value = ''
      }, 5000)
    }
  } catch (error) {
    console.error('Error setting up payment method:', error)
    paymentMethodMessage.value = t.value.paymentMethodError
    paymentMethodMessageType.value = 'error'
    
    // Clear message after 5 seconds
    setTimeout(() => {
      paymentMethodMessage.value = ''
    }, 5000)
  } finally {
    addingPaymentMethod.value = false
  }
}

const deletePaymentMethod = async (paymentMethodId) => {
  if (confirm(language.value === 'es' ? '¿Estás seguro de que quieres eliminar este método de pago?' : 'Are you sure you want to delete this payment method?')) {
    deletingMethod.value = paymentMethodId
    
    try {
      const response = await $customFetch(`/payment-methods/${paymentMethodId}`, {
        method: 'DELETE'
      })
      
      if (response.success) {
        paymentMethodMessage.value = t.value.deleteSuccess
        paymentMethodMessageType.value = 'success'
        
        // Refresh payment methods and profile
        await fetchPaymentMethods()
        await fetchProfile()
        
        // Clear message after 3 seconds
        setTimeout(() => {
          paymentMethodMessage.value = ''
        }, 3000)
      }
    } catch (error) {
      console.error('Error deleting payment method:', error)
      paymentMethodMessage.value = t.value.deleteError
      paymentMethodMessageType.value = 'error'
      
      // Clear message after 5 seconds
      setTimeout(() => {
        paymentMethodMessage.value = ''
      }, 5000)
    } finally {
      deletingMethod.value = null
    }
  }
}

const setDefaultPaymentMethod = async (paymentMethodId) => {
  settingDefault.value = paymentMethodId
  
  try {
    const response = await $customFetch(`/payment-methods/${paymentMethodId}/default`, {
      method: 'PUT'
    })
    
    if (response.success) {
      paymentMethodMessage.value = t.value.setDefaultSuccess
      paymentMethodMessageType.value = 'success'
      
      // Refresh payment methods and profile
      await fetchPaymentMethods()
      await fetchProfile()
      
      // Clear message after 3 seconds
      setTimeout(() => {
        paymentMethodMessage.value = ''
      }, 3000)
    }
  } catch (error) {
    console.error('Error setting default payment method:', error)
    paymentMethodMessage.value = t.value.setDefaultError
    paymentMethodMessageType.value = 'error'
    
    // Clear message after 5 seconds
    setTimeout(() => {
      paymentMethodMessage.value = ''
    }, 5000)
  } finally {
    settingDefault.value = null
  }
}

// Fetch data on mount and check for payment method result
onMounted(() => {
  fetchProfile()
  fetchPaymentMethods()
  
  // Check URL params for payment method setup result
  const urlParams = new URLSearchParams(window.location.search)
  const paymentMethodResult = urlParams.get('payment_method')
  
  if (paymentMethodResult === 'success') {
    // Show success message
    paymentMethodMessage.value = t.value.paymentMethodSuccess
    paymentMethodMessageType.value = 'success'
    
    // Clean up URL
    router.replace({ query: {} })
    
    // Refresh payment methods and profile
    fetchPaymentMethods()
    fetchProfile()
    
    // Clear message after 5 seconds
    setTimeout(() => {
      paymentMethodMessage.value = ''
    }, 5000)
  } else if (paymentMethodResult === 'cancelled') {
    // Show cancelled message
    paymentMethodMessage.value = t.value.paymentMethodCancelled
    paymentMethodMessageType.value = 'error'
    
    // Clean up URL
    router.replace({ query: {} })
    
    // Clear message after 5 seconds
    setTimeout(() => {
      paymentMethodMessage.value = ''
    }, 5000)
  }
})
</script>