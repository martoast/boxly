<template>
  <section
    class="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/20"
  >
    <!-- Header -->
    <div
      class="bg-white/90 backdrop-blur-sm shadow-sm border-b border-gray-100"
    >
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div class="flex items-start sm:items-center justify-between gap-3">
          <div class="flex items-center gap-3 min-w-0">
            <NuxtLink
              to="/app/orders"
              class="p-2 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
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
            <div class="min-w-0">
              <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-900">
                {{ t.createOrderTitle }}
              </h1>
              <p class="text-sm text-gray-600 mt-1">
                {{ t.createOrderSubtitle }}
              </p>
            </div>
          </div>
          <!-- Casillero/shipping tutorial (same video as the /app hub). -->
          <TutorialVideoButton loom-id="46437a61757f41aea84c37842cb3f805" class="shrink-0 mt-1 sm:mt-0" />
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <!-- Loading State -->
      <div v-if="loadingProfile" class="flex items-center justify-center py-12">
        <div class="text-center">
          <svg
            class="inline-block w-12 h-12 text-primary-500 animate-spin"
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
          <p class="mt-4 text-gray-600">{{ t.loadingAddress }}</p>
        </div>
      </div>

      <!-- Form Content -->
      <div v-else>
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
            class="mb-6 bg-red-50 border-l-4 border-red-500 rounded-lg p-4 shadow-sm"
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
                <p class="text-sm font-medium text-red-800">
                  {{ errorMessage }}
                </p>
              </div>
            </div>
          </div>
        </Transition>

        <form @submit.prevent="handleCreateOrder">
          <!-- Order Type Selection -->
          <div
            class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 animate-fadeIn"
          >
            <h2 class="text-lg font-bold text-gray-900 mb-2">
              {{ t.orderTypeTitle }}
            </h2>
            <p class="text-sm text-gray-500 mb-6">
              {{ t.orderTypeDescription }}
            </p>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Shipping Option (Plane) -->
              <button
                type="button"
                @click="form.order_type = 'shipping'"
                :class="[
                  'relative p-5 rounded-xl border-2 transition-all duration-300 ease-out text-left group hover:-translate-y-1 hover:shadow-lg',
                  form.order_type === 'shipping'
                    ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
                ]"
              >
                <!-- Selected Indicator -->
                <div
                  v-if="form.order_type === 'shipping'"
                  class="absolute top-3 right-3 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center"
                >
                  <svg
                    class="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="3"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>

                <div class="flex items-start gap-4">
                  <div
                    :class="[
                      'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                      form.order_type === 'shipping'
                        ? 'bg-primary-100'
                        : 'bg-gray-100',
                    ]"
                  >
                    <!-- Plane Icon -->
                    <svg
                      :class="[
                        'w-6 h-6',
                        form.order_type === 'shipping'
                          ? 'text-primary-600'
                          : 'text-gray-500',
                      ]"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path
                        d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3
                      :class="[
                        'font-semibold text-base',
                        form.order_type === 'shipping'
                          ? 'text-primary-900'
                          : 'text-gray-900',
                      ]"
                    >
                      {{ t.shippingOption }}
                    </h3>
                    <p class="text-sm text-gray-500 mt-1">
                      {{ t.shippingOptionDesc }}
                    </p>
                  </div>
                </div>
              </button>

              <!-- Crossing Only Option (Truck) -->
              <button
                type="button"
                @click="form.order_type = 'crossing'"
                :class="[
                  'relative p-5 rounded-xl border-2 transition-all duration-300 ease-out text-left group hover:-translate-y-1 hover:shadow-lg',
                  form.order_type === 'crossing'
                    ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-200'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
                ]"
              >
                <!-- Selected Indicator -->
                <div
                  v-if="form.order_type === 'crossing'"
                  class="absolute top-3 right-3 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center"
                >
                  <svg
                    class="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="3"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>

                <div class="flex items-start gap-4">
                  <div
                    :class="[
                      'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                      form.order_type === 'crossing'
                        ? 'bg-amber-100'
                        : 'bg-gray-100',
                    ]"
                  >
                    <!-- Truck Icon -->
                    <svg
                      :class="[
                        'w-6 h-6',
                        form.order_type === 'crossing'
                          ? 'text-amber-600'
                          : 'text-gray-500',
                      ]"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path
                        d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3
                      :class="[
                        'font-semibold text-base',
                        form.order_type === 'crossing'
                          ? 'text-amber-900'
                          : 'text-gray-900',
                      ]"
                    >
                      {{ t.crossingOption }}
                    </h3>
                    <p class="text-sm text-gray-500 mt-1">
                      {{ t.crossingOptionDesc }}
                    </p>
                  </div>
                </div>
              </button>
            </div>

            <!-- Crossing Info Section - Expanded -->
            <Transition
              enter-active-class="transition ease-out duration-300"
              enter-from-class="opacity-0 -translate-y-2 max-h-0"
              enter-to-class="opacity-100 translate-y-0 max-h-[600px]"
              leave-active-class="transition ease-in duration-200"
              leave-from-class="opacity-100 translate-y-0 max-h-[600px]"
              leave-to-class="opacity-0 -translate-y-2 max-h-0"
            >
              <div
                v-if="form.order_type === 'crossing'"
                class="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 overflow-hidden"
              >
                <p class="text-[12px] font-semibold text-gray-400 uppercase tracking-[0.18em] mb-6">{{ t.crossHowTitle }}</p>

                <!-- Animated 3-step timeline (amber accent, truck payoff) -->
                <div class="how-timeline amber relative flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0 pt-1">
                  <div class="hidden sm:block how-line absolute top-5 left-[16%] right-[16%] h-0.5 rounded-full"></div>
                  <template v-for="(s, i) in crossSteps" :key="i">
                    <div class="how-step relative flex sm:flex-col sm:items-center sm:text-center items-center gap-3 sm:gap-0 sm:flex-1" :style="{ '--i': i }">
                      <span
                        class="how-dot grid place-items-center w-10 h-10 rounded-full shrink-0 ring-1"
                        :class="s.premium ? 'bg-gradient-to-br from-amber-400 to-amber-500 ring-0 text-white shadow-md shadow-amber-500/30' : 'bg-white ring-gray-200 text-gray-400'"
                      >
                        <svg class="w-[18px] h-[18px]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" :d="s.icon"/></svg>
                      </span>
                      <p class="sm:mt-2.5 text-[13px] font-medium text-gray-800 leading-tight sm:px-1">{{ s.title }}</p>
                    </div>
                    <div v-if="i < crossSteps.length - 1" class="sm:hidden ml-5 h-3 border-l border-gray-200"></div>
                  </template>
                </div>

                <!-- WhatsApp CTA -->
                <a
                  :href="whatsappLink"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="mt-6 flex sm:inline-flex w-full sm:w-auto items-center justify-center gap-2 px-5 py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold rounded-xl transition-colors shadow-sm hover:shadow active:scale-[0.99]"
                >
                  <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  {{ t.contactWhatsApp }}
                </a>

                <!-- Warehouse addresses (drop-off + pickup) -->
                <div class="mt-5 grid gap-3 sm:grid-cols-2">
                  <div class="rounded-xl border border-gray-200 p-4">
                    <p class="text-[11px] font-semibold text-amber-600 uppercase tracking-wide">{{ t.crossDropoffCaption }}</p>
                    <p class="font-semibold text-gray-900 text-sm mt-1.5">Bodega San Diego</p>
                    <p class="text-gray-600 text-sm">482 W San Ysidro Blvd</p>
                    <p class="text-gray-400 text-sm">San Ysidro, CA 92173, USA</p>
                    <a href="https://maps.app.goo.gl/WdAQUazcDSTdV9WV8" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 mt-2.5 text-sm font-semibold text-amber-600 hover:text-amber-700 transition-colors">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                      {{ t.openInGoogleMaps }}
                    </a>
                  </div>
                  <div class="rounded-xl border border-gray-200 p-4">
                    <p class="text-[11px] font-semibold text-amber-600 uppercase tracking-wide">{{ t.crossPickupCaption }}</p>
                    <p class="font-semibold text-gray-900 text-sm mt-1.5">Bodega Tijuana</p>
                    <p class="text-gray-600 text-sm">Av. Jalisco 2850, Local 5</p>
                    <p class="text-gray-400 text-sm">Col. Madero (Cacho), Tijuana, BC 22040</p>
                    <a href="https://maps.app.goo.gl/4SsEVjy2D4noFM9n8" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 mt-2.5 text-sm font-semibold text-amber-600 hover:text-amber-700 transition-colors">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                      {{ t.openInGoogleMaps }}
                    </a>
                  </div>
                </div>

                <!-- Important note -->
                <div class="mt-4 flex items-start gap-2 bg-amber-50 rounded-xl p-3 text-xs text-amber-800 leading-snug">
                  <svg class="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  <span>{{ t.crossingImportantNote }}</span>
                </div>
              </div>
            </Transition>
          </div>

          <!-- How it works + when do I pay (process education) -->
          <div
            v-if="form.order_type === 'shipping'"
            class="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 overflow-hidden animate-fadeIn transition-all duration-300 ease-out hover:shadow-md"
          >
            <button
              type="button"
              @click="showHow = !showHow"
              class="w-full flex items-center justify-between gap-3 p-5 text-left hover:bg-gray-50/60 transition-colors"
            >
              <div class="flex items-center gap-3 min-w-0">
                <span class="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 grid place-items-center flex-shrink-0">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </span>
                <div class="min-w-0">
                  <h2 class="text-base font-bold text-gray-900">{{ t.howTitle }}</h2>
                  <p class="text-sm text-gray-500 truncate">{{ t.howSubtitle }}</p>
                </div>
              </div>
              <svg
                class="w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-300"
                :class="showHow ? 'rotate-180' : ''"
                fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"
              ><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
            </button>

            <Transition
              enter-active-class="transition ease-out duration-300"
              enter-from-class="opacity-0 max-h-0"
              enter-to-class="opacity-100 max-h-[900px]"
              leave-active-class="transition ease-in duration-200"
              leave-from-class="opacity-100 max-h-[900px]"
              leave-to-class="opacity-0 max-h-0"
            >
              <div v-if="showHow" class="px-5 pb-5 overflow-hidden">
                <!-- Visual timeline with a highlight that glides from stage to stage -->
                <div class="how-timeline relative flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0 pt-1">
                  <div class="hidden sm:block how-line absolute top-5 left-[10%] right-[10%] h-0.5 rounded-full"></div>
                  <template v-for="(s, i) in howSteps" :key="i">
                    <div class="how-step relative flex sm:flex-col sm:items-center sm:text-center items-center gap-3 sm:gap-0 sm:flex-1" :style="{ '--i': i }">
                      <span
                        class="how-dot grid place-items-center w-10 h-10 rounded-full shrink-0 ring-1"
                        :class="s.trust ? 'bg-white ring-primary-200 text-primary-600 how-dot-trust'
                          : s.premium ? 'bg-gradient-to-br from-primary-500 to-indigo-600 ring-0 text-white shadow-md shadow-primary-500/30'
                          : 'bg-white ring-gray-200 text-gray-400'"
                      >
                        <svg class="w-[18px] h-[18px]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" :d="s.icon"/></svg>
                      </span>
                      <p class="sm:mt-2.5 text-[13px] font-medium text-gray-800 leading-tight sm:px-1">{{ s.title }}</p>
                    </div>
                    <div v-if="i < howSteps.length - 1" class="sm:hidden ml-5 h-3 border-l border-gray-200"></div>
                  </template>
                </div>

                <!-- One concise trust line -->
                <p class="mt-6 text-center text-xs text-gray-500 leading-relaxed">
                  <span class="font-semibold text-gray-700">{{ t.howTrustStrong }}</span> {{ t.howTrustRest }}
                </p>

                <!-- Pricing catalog link (new tab so the form isn't lost) -->
                <NuxtLink
                  to="/app/pricing"
                  target="_blank"
                  class="mt-4 flex items-center justify-between gap-3 rounded-xl border border-primary-100 bg-primary-50/50 hover:bg-primary-50 p-3.5 transition-colors group"
                >
                  <span class="flex items-center gap-2.5 min-w-0">
                    <span class="w-8 h-8 rounded-lg bg-white border border-primary-100 grid place-items-center text-primary-600 flex-shrink-0">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                    </span>
                    <span class="min-w-0">
                      <span class="block text-sm font-semibold text-gray-900">{{ t.howPricingLink }}</span>
                      <span class="block text-xs text-gray-500 truncate">{{ t.howPricingBody }}</span>
                    </span>
                  </span>
                  <svg class="w-4 h-4 text-primary-600 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                </NuxtLink>
              </div>
            </Transition>
          </div>

          <!-- Delivery Address Form (Only for Shipping) -->
          <Transition
            enter-active-class="transition ease-out duration-300"
            enter-from-class="opacity-0 translate-y-4"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition ease-in duration-200"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 -translate-y-4"
          >
            <div v-if="form.order_type === 'shipping'">
              <!-- Address Mode Toggle (hidden while a Maps link is provided) -->
              <div v-if="!hasGmapsLink" class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 animate-fadeIn">
                <div class="flex items-center justify-between">
                  <div>
                    <h2 class="text-lg font-bold text-gray-900">{{ t.deliveryAddressTitle }}</h2>
                    <p class="text-sm text-gray-500 mt-1">{{ useFullAddress ? t.pasteAddressDescription : t.individualFieldsDescription }}</p>
                  </div>
                  <!-- Toggle: OFF = paste (default), ON = one-by-one campos individuales -->
                  <div class="flex items-center gap-2">
                    <span class="text-sm text-gray-500">{{ t.useIndividualFields }}</span>
                    <button
                      type="button"
                      @click="useFullAddress = !useFullAddress"
                      :class="[
                        'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                        !useFullAddress ? 'bg-primary-500' : 'bg-gray-200'
                      ]"
                    >
                      <span
                        :class="[
                          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                          !useFullAddress ? 'translate-x-5' : 'translate-x-0'
                        ]"
                      />
                    </button>
                  </div>
                </div>
              </div>

              <!-- Google Maps link — the most accurate + seamless option -->
              <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 animate-fadeIn">
                <label for="gmaps_link" class="block text-sm font-semibold text-gray-900">{{ t.gmapsLinkLabel }}</label>
                <p class="text-sm text-gray-500 mt-1 mb-3">{{ t.gmapsLinkDescription }}</p>
                <div class="relative">
                  <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  </span>
                  <input
                    id="gmaps_link"
                    type="text"
                    inputmode="url"
                    v-model="form.delivery_address.google_maps_link"
                    :placeholder="t.gmapsLinkPlaceholder"
                    class="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>
                <a href="https://maps.google.com" target="_blank" rel="noopener" class="inline-flex items-center gap-1 mt-2.5 text-xs font-medium text-primary-600 hover:text-primary-700">
                  {{ t.gmapsLinkHelp }}
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                </a>
              </div>

              <!-- Maps-link confirmation — the written address is optional once we have a link -->
              <div v-if="hasGmapsLink" class="bg-green-50 rounded-2xl border border-green-200 p-5 mb-6 flex items-start gap-3 animate-fadeIn">
                <span class="flex-shrink-0 w-9 h-9 rounded-full bg-green-100 text-green-600 grid place-items-center">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </span>
                <div class="min-w-0">
                  <p class="font-semibold text-gray-900 text-sm">{{ t.gmapsConfirmTitle }}</p>
                  <p class="text-sm text-gray-600 mt-1">{{ t.gmapsConfirmBody }}</p>
                  <label class="mt-3 flex items-center gap-2 cursor-pointer">
                    <input v-model="form.save_address" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500" />
                    <span class="text-sm text-gray-700">{{ t.saveAddressLabel }}</span>
                  </label>
                </div>
              </div>

              <!-- Manual address entry (removed from the DOM while a Maps link is provided,
                   so its required fields never block submission) -->
              <template v-if="!hasGmapsLink">
              <!-- Full Address Mode -->
              <div v-if="useFullAddress" class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 animate-fadeIn">
                <div class="space-y-4">
                  <div>
                    <label for="full_address" class="block text-sm font-semibold text-gray-900 mb-2">
                      {{ t.fullAddressLabel }}
                    </label>
                    <textarea
                      id="full_address"
                      v-model="form.delivery_address.full_address"
                      rows="3"
                      class="w-full px-4 py-3 rounded-xl border text-base focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 resize-none"
                      :class="detectedPostal ? 'border-emerald-300 focus:ring-emerald-400' : 'border-gray-200 focus:ring-primary-500'"
                      :placeholder="t.fullAddressPlaceholder"
                    ></textarea>

                    <!-- Live postal-code check — the one thing we must verify -->
                    <div class="mt-2 min-h-[20px]">
                      <p v-if="detectedPostal" class="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {{ t.postalDetected }} <span class="font-mono font-bold tracking-wide">{{ detectedPostal }}</span>
                      </p>
                      <p v-else-if="(form.delivery_address.full_address || '').trim()" class="inline-flex items-center gap-1.5 text-sm font-medium text-amber-600">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
                        {{ t.postalMissing }}
                      </p>
                      <p v-else class="text-xs text-gray-400">{{ t.postalHint }}</p>
                    </div>
                  </div>

                  <!-- Save Address Checkbox -->
                  <div class="bg-green-50 rounded-xl p-4 border border-green-200">
                    <label class="flex items-start gap-3 cursor-pointer">
                      <input
                        v-model="form.save_address"
                        type="checkbox"
                        class="mt-1 h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                      />
                      <div class="flex-1">
                        <span class="text-sm font-semibold text-gray-900">{{ t.saveAddressLabel }}</span>
                        <p class="text-sm text-gray-600 mt-1">{{ t.saveAddressDescription }}</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <!-- Individual Fields Mode -->
              <div v-else>
                <DeliveryAddressStep
                  :delivery-address="form.delivery_address"
                  :is-rural="form.is_rural"
                  :save-address="form.save_address"
                  :rural-surcharge="null"
                  :mexican-states="mexicanStates"
                  :t="t"
                  @update:delivery-address="form.delivery_address = $event"
                  @update:is-rural="form.is_rural = $event"
                  @update:save-address="form.save_address = $event"
                />
              </div>
              </template>
            </div>
          </Transition>

          <!-- Submit Button -->
          <div class="mt-8 flex justify-end">
            <button
              type="submit"
              :disabled="!isFormValid || loading"
              :class="[
                'px-8 py-3 font-semibold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0',
                form.order_type === 'crossing'
                  ? 'bg-amber-500 hover:bg-amber-600 text-white'
                  : 'bg-primary-500 hover:bg-primary-600 text-white'
              ]"
            >
              <span v-if="loading" class="flex items-center">
                <svg
                  class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                {{ t.creating }}
              </span>
              <span v-else>
                {{ t.createOrder }}
                <svg
                  class="inline-block w-5 h-5 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import DeliveryAddressStep from "~/components/CheckoutStep4.vue";

definePageMeta({
  layout: "app",
  middleware: ["auth", "customer", "complete-profile"],
});

const { $customFetch, $toast } = useNuxtApp();
const user = useUser().value;
const { t: createTranslations, language } = useLanguage();

const loading = ref(false);
const loadingProfile = ref(true);
const errorMessage = ref("");
const hasLoadedSavedAddress = ref(false);
// Default to the easy paste mode (Google Maps link or the address as it appears on
// Maps). The one-by-one "campos individuales" is the opt-in alternative.
const useFullAddress = ref(true);

// Process-education panel (open by default so customers are informed before they start).
const showHow = ref(true);
const howSteps = computed(() => [
  // 1) shop in the US + send to your Boxly locker — shopping bag
  { title: t.value.howStep1, icon: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" },
  // 2) create the shipment (free) — document + plus
  { title: t.value.howStep2, icon: "M9 12h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  // 3) we receive, consolidate & cross it for you — shield check (we handle it)
  { title: t.value.howStep3, icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
  // 4) you pay ONLY once it's crossed & in Mexico, ready to fly — banknotes (the value moment)
  { title: t.value.howStep4, icon: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z", trust: true },
  // 5) same day it flies by plane to your door — paper airplane (premium payoff)
  { title: t.value.howStep5, icon: "M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5", premium: true },
]);

// Crossing-only ("Solo Cruce") process — chat → drop-off → truck pickup (premium).
const crossSteps = computed(() => [
  { title: t.value.crossStep1, icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
  { title: t.value.crossStep2, icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
  { title: t.value.crossStep3, icon: "M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1", premium: true },
]);

// WhatsApp number and pre-filled message
const whatsappNumber = "16195591910"; // Your WhatsApp number
const whatsappMessage = computed(() => {
  return language.value === "es"
    ? "Hola! Me gustaría coordinar la entrega de mi mercancía para un cruce."
    : "Hi! I would like to coordinate the delivery of my merchandise for a crossing.";
});
const whatsappLink = computed(() => {
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage.value)}`;
});

const form = ref({
  order_type: "shipping", // 'shipping' or 'crossing'
  delivery_address: {
    street: "",
    exterior_number: "",
    interior_number: "",
    colonia: "",
    municipio: "",
    estado: "",
    postal_code: "",
    referencias: "",
    full_address: "",
    google_maps_link: "",
  },
  is_rural: false,
  save_address: false,
  notes: "",
});

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

// A pasted Google Maps link (a real URL) is treated as a complete, accurate
// address — it makes the written-address fields optional and hides them.
const hasGmapsLink = computed(() =>
  /^https?:\/\//i.test((form.value.delivery_address.google_maps_link || "").trim())
);

// The free-text address can be written however the customer likes (references,
// landmarks, etc.) — the ONE thing we require to continue is a valid 5-digit
// Mexican postal code somewhere in the text, since every address needs it.
const detectedPostal = computed(() => {
  // Find digit groups and pick one that's EXACTLY 5 long (a Mexican CP). Using
  // \d{5,} + a length check avoids regex lookbehind, which older iOS Safari can't
  // parse — and it ignores 4-digit street numbers and long phone numbers.
  const groups = (form.value.delivery_address.full_address || "").match(/\d{5,}/g) || [];
  return groups.find((g) => g.length === 5) || null;
});

const isFormValid = computed(() => {
  // For crossing orders, no address needed
  if (form.value.order_type === "crossing") {
    return true;
  }

  // For shipping orders, validate address
  const addr = form.value.delivery_address;

  // A Google Maps link is a complete, accurate address on its own — the most
  // seamless option — so it satisfies the address requirement by itself.
  const gmaps = (addr.google_maps_link || "").trim();
  if (/^https?:\/\//i.test(gmaps)) {
    return true;
  }

  // Full address mode — allow any free text, but require a valid postal code in it.
  if (useFullAddress.value) {
    return !!detectedPostal.value;
  }

  // Individual fields mode
  return (
    addr.street &&
    addr.exterior_number &&
    addr.colonia &&
    addr.municipio &&
    addr.estado &&
    addr.postal_code &&
    /^\d{5}$/.test(addr.postal_code)
  );
});

const translations = {
  createOrderTitle: { es: "Crear Nuevo Envío", en: "Create New Shipment" },
  createOrderSubtitle: {
    es: "Selecciona el tipo de servicio que necesitas",
    en: "Select the type of service you need",
  },
  orderTypeTitle: { es: "Tipo de Servicio", en: "Service Type" },
  orderTypeDescription: {
    es: "¿Cómo quieres recibir tus paquetes?",
    en: "How do you want to receive your packages?",
  },
  shippingOption: { es: "Envío a Domicilio", en: "Home Delivery" },
  shippingOptionDesc: {
    es: "Cruzamos y enviamos tus paquetes directamente a tu dirección en México.",
    en: "We cross and deliver your packages directly to your address in Mexico.",
  },
  crossingOption: { es: "Solo Cruce", en: "Crossing Only" },
  crossingOptionDesc: {
    es: "Trae tu mercancía a nuestra bodega en San Diego y recógela en Tijuana.",
    en: "Bring your merchandise to our San Diego warehouse and pick it up in Tijuana.",
  },
  // Crossing Steps
  crossingStep1Title: { es: "Contactar por WhatsApp", en: "Contact via WhatsApp" },
  crossingStep1Desc: {
    es: "Primero, contáctanos por WhatsApp para coordinar la fecha y hora de entrega de tu mercancía.",
    en: "First, contact us via WhatsApp to coordinate the date and time for your merchandise delivery.",
  },
  contactWhatsApp: { es: "Enviar WhatsApp", en: "Send WhatsApp" },
  crossingStep2Title: { es: "Entregar en San Diego", en: "Drop off in San Diego" },
  crossingStep2Desc: {
    es: "Una vez confirmado, trae tu mercancía a nuestra bodega en San Ysidro.",
    en: "Once confirmed, bring your merchandise to our warehouse in San Ysidro.",
  },
  dropoffLocationLabel: { es: "Bodega San Diego", en: "San Diego Warehouse" },
  crossingStep3Title: { es: "Recoger en Tijuana", en: "Pick up in Tijuana" },
  crossingStep3Desc: {
    es: "Te notificaremos cuando tu mercancía esté lista para recoger en nuestra bodega de Tijuana.",
    en: "We'll notify you when your merchandise is ready for pickup at our Tijuana warehouse.",
  },
  pickupLocationLabel: { es: "Bodega Tijuana", en: "Tijuana Warehouse" },
  openInGoogleMaps: { es: "Ver en Google Maps", en: "View in Google Maps" },
  crossingImportantNote: {
    es: "Importante: No te presentes en la bodega sin antes coordinar por WhatsApp. Esto nos ayuda a atenderte mejor y evitar tiempos de espera.",
    en: "Important: Please don't show up at the warehouse without coordinating via WhatsApp first. This helps us serve you better and avoid wait times.",
  },
  createOrder: { es: "Continuar", en: "Continue" },
  creating: { es: "Creando envío...", en: "Creating shipment..." },
  loadingAddress: {
    es: "Cargando tu dirección guardada...",
    en: "Loading your saved address...",
  },
  // Google Maps link — the most accurate way to pin the delivery address
  gmapsLinkLabel: {
    es: "Link de Google Maps (recomendado)",
    en: "Google Maps link (recommended)",
  },
  gmapsLinkDescription: {
    es: "Pega el link de tu ubicación en Google Maps — es lo más preciso para entregarte.",
    en: "Paste your Google Maps location link — it's the most accurate way for us to deliver.",
  },
  gmapsLinkPlaceholder: {
    es: "https://maps.app.goo.gl/...",
    en: "https://maps.app.goo.gl/...",
  },
  gmapsLinkHelp: {
    es: "¿Cómo copio mi link? Abrir Google Maps",
    en: "How do I copy my link? Open Google Maps",
  },
  gmapsConfirmTitle: {
    es: "Usaremos tu ubicación de Google Maps",
    en: "We'll use your Google Maps location",
  },
  gmapsConfirmBody: {
    es: "Es la forma más precisa de entregarte, así que no necesitas escribir tu dirección. Si prefieres capturarla a mano, borra el link de arriba.",
    en: "It's the most accurate way to deliver, so you don't need to type your address. If you'd rather enter it by hand, clear the link above.",
  },
  // Address form translations
  quickAddressSearchTitle: {
    es: "Búsqueda Rápida de Dirección",
    en: "Quick Address Search",
  },
  quickAddressSearchDescription: {
    es: "Pega tu link de Google Maps o llena los campos de tu dirección",
    en: "Paste your Google Maps link or fill in your address fields",
  },
  searchPlaceholder: {
    es: "Buscar dirección, ciudad o código postal",
    en: "Search address, city or zip code",
  },
  addressFoundMessage: {
    es: "Dirección encontrada. Por favor revisa y completa los campos faltantes.",
    en: "Address found. Please review and complete any missing fields.",
  },
  streetLabel: { es: "Calle", en: "Street" },
  streetPlaceholder: { es: "Nombre de la calle", en: "Street name" },
  exteriorNumberLabel: { es: "Número Exterior", en: "Exterior Number" },
  exteriorNumberPlaceholder: { es: "123", en: "123" },
  interiorNumberLabel: { es: "Número Interior", en: "Interior Number" },
  interiorNumberPlaceholder: { es: "Opcional", en: "Optional" },
  coloniaLabel: { es: "Colonia", en: "Neighborhood" },
  coloniaPlaceholder: { es: "Nombre de la colonia", en: "Neighborhood name" },
  municipioLabel: { es: "Municipio/Delegación", en: "Municipality" },
  municipioPlaceholder: { es: "Municipio o delegación", en: "Municipality" },
  estadoLabel: { es: "Estado", en: "State" },
  selectEstado: { es: "Selecciona un estado", en: "Select a state" },
  postalCodeLabel: { es: "Código Postal", en: "Postal Code" },
  postalCodePlaceholder: { es: "12345", en: "12345" },
  referenciasLabel: { es: "Referencias", en: "References" },
  referenciasPlaceholder: {
    es: "Entre calles, puntos de referencia, color de la casa, etc.",
    en: "Between streets, landmarks, house color, etc.",
  },
  ruralAreaLabel: { es: "Zona Rural", en: "Rural Area" },
  ruralAreaDescription: {
    es: "Marca esta casilla si tu dirección está en una zona rural.",
    en: "Check this box if your address is in a rural area.",
  },
  saveAddressLabel: {
    es: "Guardar esta dirección para futuros pedidos",
    en: "Save this address for future orders",
  },
  saveAddressDescription: {
    es: "Guarda tu dirección de entrega para no tener que ingresarla nuevamente",
    en: "Save your delivery address so you don't have to enter it again",
  },
  // Full address mode
  useFullAddress: {
    es: "Dirección completa",
    en: "Full address",
  },
  useIndividualFields: {
    es: "Campos individuales",
    en: "Individual fields",
  },
  fullAddressLabel: {
    es: "O pega tu dirección (como aparece en Google Maps)",
    en: "Or paste your address (as it appears on Google Maps)",
  },
  fullAddressPlaceholder: {
    es: "Ej: Av. Jalisco 3415, Madero Sur, 22046 Tijuana, B.C.",
    en: "E.g.: Av. Jalisco 3415, Madero Sur, 22046 Tijuana, B.C.",
  },
  fullAddressDescription: {
    es: "Ingresa tu dirección completa en un solo campo",
    en: "Enter your complete address in a single field",
  },
  postalDetected: { es: "Código postal detectado:", en: "Postal code detected:" },
  postalMissing: { es: "Incluye tu código postal de 5 dígitos para continuar.", en: "Include your 5-digit postal code to continue." },
  postalHint: { es: "Escribe tu dirección — incluye tu código postal de 5 dígitos (puedes agregar referencias).", en: "Write your address — include your 5-digit postal code (you can add landmarks)." },
  pasteAddressDescription: {
    es: "Pega el link de Google Maps o tu dirección tal como aparece en Google Maps.",
    en: "Paste your Google Maps link or your address exactly as it appears on Google Maps.",
  },
  individualFieldsDescription: {
    es: "Captura tu dirección campo por campo.",
    en: "Enter your address field by field.",
  },
  deliveryAddressTitle: {
    es: "Dirección de Entrega",
    en: "Delivery Address",
  },
  // Process-education panel
  howTitle: { es: "¿Cómo funciona y cuándo pago?", en: "How it works & when do I pay?" },
  howSubtitle: { es: "Y lo mejor: pagas hasta el final.", en: "And best of all: you pay only at the end." },
  howStep1: { es: "Compra y envía", en: "Shop & send" },
  howStep2: { es: "Creas tu envío", en: "Create your shipment" },
  howStep3: { es: "Recibimos y cruzamos", en: "We receive & cross it" },
  howStep4: { es: "Pagas ya en México", en: "You pay — already in Mexico" },
  howStep5: { es: "Vuela el mismo día", en: "It flies the same day" },
  howTrustStrong: { es: "Pagas hasta que tu caja ya cruzó y está lista para volar.", en: "You pay only once your box has crossed and is ready to fly." },
  howTrustRest: {
    es: "Sin pagos por adelantado — nosotros nos encargamos de la recepción, la consolidación y el cruce. El mismo día que pagas recibes tu guía y tu caja vuela por avión. ✈️",
    en: "No upfront payments — we handle receiving, consolidation and the border crossing. The same day you pay you get your guía and your box flies by air. ✈️",
  },
  howPricingLink: { es: "Ver catálogo de precios", en: "See pricing catalog" },
  howPricingBody: { es: "Tamaños de caja, tarifas y cómo funciona.", en: "Box sizes, rates and how it works." },
  // Crossing-only process
  crossHowTitle: { es: "Cómo funciona el cruce", en: "How the crossing works" },
  crossStep1: { es: "Coordina por WhatsApp", en: "Coordinate on WhatsApp" },
  crossStep2: { es: "Entrega en San Diego", en: "Drop off in San Diego" },
  crossStep3: { es: "Recoge en Tijuana", en: "Pick up in Tijuana" },
  crossDropoffCaption: { es: "Entregas aquí", en: "Drop off here" },
  crossPickupCaption: { es: "Recoges aquí", en: "Pick up here" },
};

const t = createTranslations(translations);

const fetchUserProfile = async () => {
  loadingProfile.value = true;
  try {
    const response = await $customFetch("/profile");

    if (response.success && response.data) {
      const profileData = response.data;

      // Check if user has individual address fields
      if (profileData.has_complete_address && profileData.address) {
        form.value.delivery_address = {
          street: profileData.address.street || "",
          exterior_number: profileData.address.exterior_number || "",
          interior_number: profileData.address.interior_number || "",
          colonia: profileData.address.colonia || "",
          municipio: profileData.address.municipio || "",
          estado: profileData.address.estado || "",
          postal_code: profileData.address.postal_code || "",
          referencias: "",
          full_address: "",
        };
        hasLoadedSavedAddress.value = true;
        form.value.save_address = false;
        useFullAddress.value = false;
      }
      // Check if user has full_address
      else if (profileData.full_address) {
        form.value.delivery_address = {
          street: "",
          exterior_number: "",
          interior_number: "",
          colonia: "",
          municipio: "",
          estado: "",
          postal_code: "",
          referencias: "",
          full_address: profileData.full_address,
        };
        hasLoadedSavedAddress.value = true;
        form.value.save_address = false;
        useFullAddress.value = true;
      } else {
        if (user) {
          form.value.delivery_address = {
            street: user.street || "",
            exterior_number: user.exterior_number || "",
            interior_number: user.interior_number || "",
            colonia: user.colonia || "",
            municipio: user.municipio || "",
            estado: user.estado || "",
            postal_code: user.postal_code || "",
            referencias: "",
            full_address: user.full_address || "",
          };
          // Auto-select mode based on what data exists
          if (user.full_address && !user.street) {
            useFullAddress.value = true;
          }
        }
        form.value.save_address = true;
      }
    }
  } catch (error) {
    console.error("Error fetching user profile:", error);
    if (user) {
      form.value.delivery_address = {
        street: user.street || "",
        exterior_number: user.exterior_number || "",
        interior_number: user.interior_number || "",
        colonia: user.colonia || "",
        municipio: user.municipio || "",
        estado: user.estado || "",
        postal_code: user.postal_code || "",
        referencias: "",
        full_address: user.full_address || "",
      };
      if (user.full_address && !user.street) {
        useFullAddress.value = true;
      }
    }
  } finally {
    loadingProfile.value = false;
  }
};

const handleCreateOrder = async () => {
  if (!isFormValid.value) return;

  loading.value = true;
  errorMessage.value = "";

  // Save address if requested (only for shipping orders)
  if (form.value.order_type === "shipping" && form.value.save_address) {
    try {
      const profileBody = useFullAddress.value
        ? { full_address: form.value.delivery_address.full_address }
        : {
            street: form.value.delivery_address.street,
            exterior_number: form.value.delivery_address.exterior_number,
            interior_number: form.value.delivery_address.interior_number,
            colonia: form.value.delivery_address.colonia,
            municipio: form.value.delivery_address.municipio,
            estado: form.value.delivery_address.estado,
            postal_code: form.value.delivery_address.postal_code,
          };
      // Save the Google Maps link to the profile too (most accurate)
      const gmapsForProfile = (form.value.delivery_address.google_maps_link || "").trim();
      if (gmapsForProfile) profileBody.google_maps_link = gmapsForProfile;
      await $customFetch("/profile", {
        method: "PUT",
        body: profileBody,
      });
    } catch (error) {
      console.error("Error saving address:", error);
    }
  }

  try {
    const body = {
      order_type: form.value.order_type,
      notes: form.value.notes,
    };

    // Only include delivery address for shipping orders
    if (form.value.order_type === "shipping") {
      // Build delivery address based on mode
      if (useFullAddress.value) {
        body.delivery_address = {
          full_address: form.value.delivery_address.full_address,
        };
        // Capture the postal code we detected in the free text, structured too.
        if (detectedPostal.value) body.delivery_address.postal_code = detectedPostal.value;
      } else {
        body.delivery_address = {
          street: form.value.delivery_address.street,
          exterior_number: form.value.delivery_address.exterior_number,
          interior_number: form.value.delivery_address.interior_number,
          colonia: form.value.delivery_address.colonia,
          municipio: form.value.delivery_address.municipio,
          estado: form.value.delivery_address.estado,
          postal_code: form.value.delivery_address.postal_code,
          referencias: form.value.delivery_address.referencias,
        };
        body.is_rural = form.value.is_rural;
      }
      // Google Maps link — attach if provided (most accurate; works in either mode)
      const gmaps = (form.value.delivery_address.google_maps_link || "").trim();
      if (gmaps) body.delivery_address.google_maps_link = gmaps;
    }

    const response = await $customFetch("/orders", {
      method: "POST",
      body,
    });

    if (response.success) {
      const successMsg =
        form.value.order_type === "crossing"
          ? language.value === "es"
            ? "¡Orden creada! Ahora registra los artículos que vas a traer."
            : "Order created! Now register the items you'll be bringing."
          : language.value === "es"
          ? "¡Orden creada! Ahora agrega los productos que vas a comprar."
          : "Order created! Now add the products you plan to buy.";

      $toast.success(successMsg);
      await navigateTo(`/app/orders/${response.data.order.id}/items`);
    }
  } catch (error) {
    console.error("Error creating order:", error);
    const errorMsg =
      error.data?.message ||
      (language.value === "es"
        ? "Error al crear la orden. Por favor intenta de nuevo."
        : "Error creating order. Please try again.");
    $toast.error(errorMsg);
    errorMessage.value = errorMsg;
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchUserProfile();
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
.animate-fadeIn {
  animation: fadeIn 0.5s ease-out;
}

/* --- Process timeline: a highlight that glides stage → stage --- */
/* Theme colour (R,G,B) — blue for shipping, amber for crossing (.amber). */
.how-timeline { --glow: 37, 99, 235; }
.how-timeline.amber { --glow: 245, 158, 11; }

.how-line {
  background: #e5e7eb;
  overflow: hidden;
}
/* a soft coloured band that sweeps along the connector line, looping */
.how-line::after {
  content: "";
  position: absolute;
  inset: 0;
  width: 32%;
  background: linear-gradient(90deg, transparent, rgba(var(--glow), 0.55), transparent);
  animation: howSweep 4.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}
@keyframes howSweep {
  0% { transform: translateX(-120%); }
  100% { transform: translateX(430%); }
}

/* each stage lights up as the sweep passes it (staggered by its index) */
.how-dot {
  transition: box-shadow 0.3s ease, transform 0.3s ease;
  animation: howPulse 4.5s ease-in-out infinite;
  animation-delay: calc(var(--i) * 0.62s);
}
.how-dot-trust {
  box-shadow: 0 0 0 4px rgba(var(--glow), 0.08);
}
@keyframes howPulse {
  0% { box-shadow: 0 0 0 0 rgba(var(--glow), 0); transform: scale(1); }
  6% { box-shadow: 0 10px 26px -8px rgba(var(--glow), 0.55); transform: scale(1.14); }
  16%, 100% { box-shadow: 0 0 0 0 rgba(var(--glow), 0); transform: scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  .how-line::after,
  .how-dot {
    animation: none;
  }
}
</style>