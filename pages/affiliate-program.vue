<template>
  <main class="min-h-screen bg-white">
    <!-- Hero Section -->
    <section class="relative w-full bg-gradient-to-br from-dark-500 via-dark-600 to-dark-700 overflow-hidden">
      <!-- Decorative Elements - Soft Gradients -->
      <div class="absolute inset-0 overflow-hidden">
        <div class="absolute -top-24 -right-24 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl"></div>
        <div class="absolute -bottom-24 -left-24 w-96 h-96 bg-accent-green/10 rounded-full blur-3xl"></div>
        <div class="absolute top-1/2 left-1/3 w-[600px] h-[600px] bg-accent-green/5 rounded-full blur-3xl"></div>
      </div>

      <!-- Floating Boxes Background (hidden on mobile) -->
      <div class="hidden md:block absolute inset-0 overflow-hidden pointer-events-none select-none">
        <!-- Layer 1: Background (Small, Slow, Low Opacity) -->
        <div class="absolute top-[10%] left-[8%] opacity-20 animate-orbit-slow">
          <img src="/box.svg" alt="" class="w-8 h-8 rotate-12" />
        </div>
        <div class="absolute top-[60%] right-[8%] opacity-15 animate-orbit-reverse-slow">
          <img src="/box.svg" alt="" class="w-6 h-6 -rotate-12" />
        </div>
        <div class="absolute bottom-[20%] left-[15%] opacity-20 animate-orbit-slow" style="animation-delay: -5s;">
          <img src="/box.svg" alt="" class="w-7 h-7 rotate-45" />
        </div>

        <!-- Layer 2: Mid-Range (Medium size, Normal Speed) -->
        <div class="absolute top-[20%] right-[25%] opacity-30 animate-orbit-medium">
          <img src="/box.svg" alt="" class="w-12 h-12 -rotate-6" />
        </div>
        <div class="absolute bottom-[35%] left-[5%] opacity-25 animate-orbit-reverse-medium" style="animation-delay: -12s;">
          <img src="/box.svg" alt="" class="w-10 h-10 rotate-180" />
        </div>

        <!-- Layer 3: Foreground (Larger, Clearer) -->
        <div class="absolute top-[70%] right-[15%] opacity-40 animate-float-horizontal" style="animation-delay: -2s;">
          <img src="/box.svg" alt="" class="w-14 h-14 drop-shadow-lg rotate-12" />
        </div>
        <div class="absolute top-[25%] left-[3%] opacity-35 animate-float-horizontal-reverse" style="animation-delay: -7s;">
          <img src="/box.svg" alt="" class="w-12 h-12 drop-shadow-md -rotate-12" />
        </div>

        <!-- Floating Dollar Signs (accent for affiliate theme) -->
        <div class="absolute top-[15%] right-[10%] opacity-40 animate-float-vertical text-accent-green font-bold text-2xl" style="animation-delay: -3s;">
          $
        </div>
        <div class="absolute bottom-[25%] right-[30%] opacity-30 animate-orbit-slow text-accent-green font-bold text-xl" style="animation-delay: -8s;">
          $
        </div>
        <div class="absolute top-[50%] left-[12%] opacity-25 animate-float-horizontal text-accent-green font-bold text-lg" style="animation-delay: -4s;">
          $
        </div>
      </div>

      <div class="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div class="grid md:grid-cols-2 gap-10 items-center">
          <!-- Left Content -->
          <div class="text-center md:text-left">
            <!-- Badge -->
            <span class="inline-flex items-center gap-2 px-4 py-2 bg-accent-green/20 text-accent-green rounded-full text-sm font-semibold mb-6 animate-fadeIn">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              {{ t.tag }}
            </span>

            <!-- Title -->
            <h1 class="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6 leading-tight animate-fadeIn" style="animation-delay: 0.1s">
              {{ t.heroTitle }}
              <span class="text-accent-green">{{ t.heroTitleHighlight }}</span>
            </h1>

            <!-- Subtitle -->
            <p class="text-lg md:text-xl text-gray-300 mb-8 max-w-lg animate-fadeIn" style="animation-delay: 0.2s">
              {{ t.heroSubtitle }}
            </p>

            <!-- CTA Buttons -->
            <div class="flex flex-col sm:flex-row gap-4 justify-center md:justify-start mb-8 animate-fadeIn" style="animation-delay: 0.3s">
              <NuxtLink
                to="/register?become_affiliate=true"
                class="inline-flex items-center justify-center gap-2 px-8 py-4 bg-accent-green hover:bg-green-400 text-dark-700 font-bold rounded-full transition-all duration-300 hover:shadow-2xl hover:scale-105"
              >
                {{ t.heroButton }}
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </NuxtLink>
              <NuxtLink
                to="/login"
                class="inline-flex items-center justify-center gap-2 px-8 py-4 bg-transparent text-white font-bold rounded-full border-2 border-white/30 hover:bg-white/10 transition-all duration-300"
              >
                {{ t.alreadyHaveAccount }}
              </NuxtLink>
            </div>

            <!-- Trust Indicators -->
            <div class="flex flex-wrap items-center justify-center md:justify-start gap-4 md:gap-6 text-white/80 animate-fadeIn" style="animation-delay: 0.4s">
              <div class="flex items-center gap-2">
                <svg class="w-5 h-5 text-accent-green" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                <span class="text-sm font-medium">{{ t.trustFree }}</span>
              </div>
              <div class="flex items-center gap-2">
                <svg class="w-5 h-5 text-accent-green" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                <span class="text-sm font-medium">{{ t.trustCommission }}</span>
              </div>
              <div class="flex items-center gap-2">
                <svg class="w-5 h-5 text-accent-green" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                <span class="text-sm font-medium">{{ t.trustPayments }}</span>
              </div>
            </div>
          </div>

          <!-- Right Image -->
          <div class="hidden md:flex justify-center animate-fadeIn" style="animation-delay: 0.3s">
            <picture>
              <source srcset="/affiliate-marketing.webp" type="image/webp" />
              <img
                src="/affiliate-marketing.png"
                alt="Affiliate marketing"
                width="2500" height="1311"
                loading="lazy" decoding="async"
                class="w-full max-w-md rounded-3xl shadow-2xl"
              />
            </picture>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works Section -->
    <section class="py-16 md:py-24 bg-gray-50">
      <div class="container mx-auto px-4 md:px-8 lg:px-12">
        <div class="text-center max-w-3xl mx-auto mb-12">
          <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{{ t.howItWorksTitle }}</h2>
          <p class="text-lg text-gray-600">{{ t.howItWorksSubtitle }}</p>
        </div>

        <div class="grid md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
          <!-- Step 1 -->
          <div class="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 text-center relative group hover:shadow-lg transition-shadow">
            <div class="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-sm">1</div>
            <div class="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <svg class="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h3 class="text-lg font-bold text-gray-900 mb-2">{{ t.step1Title }}</h3>
            <p class="text-gray-600 text-sm">{{ t.step1Desc }}</p>
          </div>

          <!-- Step 2 -->
          <div class="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 text-center relative group hover:shadow-lg transition-shadow">
            <div class="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-sm">2</div>
            <div class="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <svg class="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </div>
            <h3 class="text-lg font-bold text-gray-900 mb-2">{{ t.step2Title }}</h3>
            <p class="text-gray-600 text-sm">{{ t.step2Desc }}</p>
          </div>

          <!-- Step 3 -->
          <div class="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 text-center relative group hover:shadow-lg transition-shadow">
            <div class="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-sm">3</div>
            <div class="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <svg class="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 class="text-lg font-bold text-gray-900 mb-2">{{ t.step3Title }}</h3>
            <p class="text-gray-600 text-sm">{{ t.step3Desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Benefits Section -->
    <section class="py-16 md:py-24 bg-white">
      <div class="container mx-auto px-4 md:px-8 lg:px-12">
        <div class="text-center max-w-3xl mx-auto mb-12">
          <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{{ t.benefitsTitle }}</h2>
          <p class="text-lg text-gray-600">{{ t.benefitsSubtitle }}</p>
        </div>

        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <!-- Benefit 1 -->
          <div class="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:border-primary-200 hover:bg-primary-50/30 transition-colors">
            <div class="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h3 class="font-bold text-gray-900 mb-2">{{ t.benefit1Title }}</h3>
            <p class="text-gray-600 text-sm">{{ t.benefit1Desc }}</p>
          </div>

          <!-- Benefit 2 -->
          <div class="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:border-primary-200 hover:bg-primary-50/30 transition-colors">
            <div class="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
              </svg>
            </div>
            <h3 class="font-bold text-gray-900 mb-2">{{ t.benefit2Title }}</h3>
            <p class="text-gray-600 text-sm">{{ t.benefit2Desc }}</p>
          </div>

          <!-- Benefit 3 -->
          <div class="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:border-primary-200 hover:bg-primary-50/30 transition-colors">
            <div class="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h3 class="font-bold text-gray-900 mb-2">{{ t.benefit3Title }}</h3>
            <p class="text-gray-600 text-sm">{{ t.benefit3Desc }}</p>
          </div>

          <!-- Benefit 4 -->
          <div class="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:border-primary-200 hover:bg-primary-50/30 transition-colors">
            <div class="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
            </div>
            <h3 class="font-bold text-gray-900 mb-2">{{ t.benefit4Title }}</h3>
            <p class="text-gray-600 text-sm">{{ t.benefit4Desc }}</p>
          </div>

          <!-- Benefit 5 -->
          <div class="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:border-primary-200 hover:bg-primary-50/30 transition-colors">
            <div class="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
              </svg>
            </div>
            <h3 class="font-bold text-gray-900 mb-2">{{ t.benefit5Title }}</h3>
            <p class="text-gray-600 text-sm">{{ t.benefit5Desc }}</p>
          </div>

          <!-- Benefit 6 -->
          <div class="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:border-primary-200 hover:bg-primary-50/30 transition-colors">
            <div class="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
              </svg>
            </div>
            <h3 class="font-bold text-gray-900 mb-2">{{ t.benefit6Title }}</h3>
            <p class="text-gray-600 text-sm">{{ t.benefit6Desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Program Details Section -->
    <section class="py-16 md:py-24 bg-gradient-to-br from-primary-50 to-white">
      <div class="container mx-auto px-4 md:px-8 lg:px-12">
        <div class="max-w-4xl mx-auto">
          <div class="text-center mb-12">
            <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{{ t.detailsTitle }}</h2>
            <p class="text-lg text-gray-600">{{ t.detailsSubtitle }}</p>
          </div>

          <div class="grid sm:grid-cols-2 gap-6">
            <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div class="flex items-center gap-4 mb-4">
                <div class="w-12 h-12 bg-accent-green/10 rounded-xl flex items-center justify-center">
                  <span class="text-2xl font-bold text-accent-green">%</span>
                </div>
                <div>
                  <p class="text-sm text-gray-500">{{ t.detailCommissionLabel }}</p>
                  <p class="text-2xl font-bold text-gray-900">10%</p>
                </div>
              </div>
              <p class="text-gray-600 text-sm">{{ t.detailCommissionDesc }}</p>
            </div>

            <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div class="flex items-center gap-4 mb-4">
                <div class="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                  <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <div>
                  <p class="text-sm text-gray-500">{{ t.detailCookieLabel }}</p>
                  <p class="text-2xl font-bold text-gray-900">30 {{ t.days }}</p>
                </div>
              </div>
              <p class="text-gray-600 text-sm">{{ t.detailCookieDesc }}</p>
            </div>

            <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div class="flex items-center gap-4 mb-4">
                <div class="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                  <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                  </svg>
                </div>
                <div>
                  <p class="text-sm text-gray-500">{{ t.detailRecurringLabel }}</p>
                  <p class="text-2xl font-bold text-gray-900">{{ t.detailRecurringValue }}</p>
                </div>
              </div>
              <p class="text-gray-600 text-sm">{{ t.detailRecurringDesc }}</p>
            </div>

            <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div class="flex items-center gap-4 mb-4">
                <div class="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                  <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
                  </svg>
                </div>
                <div>
                  <p class="text-sm text-gray-500">{{ t.detailPaymentLabel }}</p>
                  <p class="text-2xl font-bold text-gray-900">{{ t.detailPaymentValue }}</p>
                </div>
              </div>
              <p class="text-gray-600 text-sm">{{ t.detailPaymentDesc }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ Section -->
    <section class="py-16 md:py-24 bg-white">
      <div class="container mx-auto px-4 md:px-8 lg:px-12">
        <div class="text-center max-w-3xl mx-auto mb-12">
          <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{{ t.faqTitle }}</h2>
        </div>

        <div class="max-w-3xl mx-auto space-y-3">
          <div v-for="(faq, index) in faqs" :key="index" class="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
            <button
              @click="toggleFaq(index)"
              class="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-100 transition-colors"
            >
              <span class="font-semibold text-gray-900 pr-4">{{ faq.question }}</span>
              <svg
                class="w-5 h-5 text-gray-500 transition-transform duration-200 flex-shrink-0"
                :class="{ 'rotate-180': openFaq === index }"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div v-show="openFaq === index" class="px-6 pb-4 text-gray-600">
              {{ faq.answer }}
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-16 md:py-24 bg-gradient-to-br from-dark-500 via-dark-600 to-dark-700">
      <div class="container mx-auto px-4 md:px-8 lg:px-12">
        <div class="text-center max-w-3xl mx-auto">
          <h2 class="text-3xl md:text-4xl font-bold text-white mb-4">{{ t.ctaTitle }}</h2>
          <p class="text-xl text-gray-300 mb-8">{{ t.ctaSubtitle }}</p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <NuxtLink
              to="/register?become_affiliate=true"
              class="inline-flex items-center justify-center gap-2 px-8 py-4 bg-accent-green hover:bg-green-400 text-dark-700 font-bold rounded-full transition-all duration-300 hover:shadow-xl hover:scale-105"
            >
              {{ t.ctaButton }}
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </NuxtLink>
            <NuxtLink
              to="/login"
              class="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-white/30 text-white font-bold rounded-full hover:bg-white/10 transition-all duration-300"
            >
              {{ t.ctaLoginButton }}
            </NuxtLink>
          </div>
          <p class="text-gray-400 text-sm mt-6">{{ t.ctaNote }}</p>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <FooterSection />
  </main>
</template>

<script setup>
import { ref, computed } from 'vue'
import FooterSection from "~/components/Landing/FooterSection.vue"

const { t: createTranslations } = useLanguage()

const openFaq = ref(null)

const toggleFaq = (index) => {
  openFaq.value = openFaq.value === index ? null : index
}

const translations = {
  // Hero
  tag: { es: 'PROGRAMA DE AFILIADOS', en: 'AFFILIATE PROGRAM' },
  heroTitle: { es: 'Gana dinero compartiendo ', en: 'Earn money sharing ' },
  heroTitleHighlight: { es: 'Boxly', en: 'Boxly' },
  heroSubtitle: { es: 'Recomienda nuestro servicio y recibe comisiones por cada envío que realicen tus referidos. Sin inversión, sin complicaciones.', en: 'Recommend our service and receive commissions on every shipment your referrals make. No investment, no hassle.' },
  heroButton: { es: 'Comenzar ahora', en: 'Get started' },
  alreadyHaveAccount: { es: 'Ya tengo cuenta', en: 'I already have an account' },
  trustFree: { es: 'Gratis', en: 'Free to join' },
  trustCommission: { es: '10% por envío', en: '10% per shipment' },
  trustPayments: { es: 'Pagos mensuales', en: 'Monthly payouts' },

  // How it works
  howItWorksTitle: { es: '¿Cómo funciona?', en: 'How does it work?' },
  howItWorksSubtitle: { es: 'Tres simples pasos para comenzar a ganar', en: 'Three simple steps to start earning' },
  step1Title: { es: 'Regístrate gratis', en: 'Sign up for free' },
  step1Desc: { es: 'Crea tu cuenta y activa tu perfil de afiliado para obtener tu link único.', en: 'Create your account and activate your affiliate profile to get your unique link.' },
  step2Title: { es: 'Comparte tu link', en: 'Share your link' },
  step2Desc: { es: 'Comparte tu link con amigos, familiares o en tus redes sociales.', en: 'Share your link with friends, family or on your social media.' },
  step3Title: { es: 'Recibe comisiones', en: 'Receive commissions' },
  step3Desc: { es: 'Gana el 10% de cada envío que realicen tus referidos.', en: 'Earn 10% on every shipment your referrals make.' },

  // Benefits
  benefitsTitle: { es: '¿Por qué ser afiliado?', en: 'Why become an affiliate?' },
  benefitsSubtitle: { es: 'Beneficios de unirte a nuestro programa', en: 'Benefits of joining our program' },
  benefit1Title: { es: 'Comisiones recurrentes', en: 'Recurring commissions' },
  benefit1Desc: { es: 'Gana por cada envío que hagan tus referidos, no solo el primero.', en: 'Earn on every shipment your referrals make, not just the first one.' },
  benefit2Title: { es: 'Sin límites', en: 'No limits' },
  benefit2Desc: { es: 'No hay tope en cuánto puedes ganar. Más referidos, más ganancias.', en: 'No cap on earnings. More referrals, more earnings.' },
  benefit3Title: { es: 'Cookie de 30 días', en: '30-day cookie' },
  benefit3Desc: { es: 'Si alguien hace clic en tu link, tienes 30 días para que se registre.', en: 'If someone clicks your link, you have 30 days for them to register.' },
  benefit4Title: { es: 'Dashboard en tiempo real', en: 'Real-time dashboard' },
  benefit4Desc: { es: 'Monitorea tus referidos, conversiones y ganancias cuando quieras.', en: 'Monitor your referrals, conversions and earnings anytime.' },
  benefit5Title: { es: 'Pagos seguros', en: 'Secure payments' },
  benefit5Desc: { es: 'Retira tus ganancias directo a tu cuenta bancaria.', en: 'Withdraw your earnings directly to your bank account.' },
  benefit6Title: { es: 'Ayuda a otros', en: 'Help others' },
  benefit6Desc: { es: 'Comparte un servicio que realmente ayuda a las personas a ahorrar.', en: 'Share a service that really helps people save money.' },

  // Program Details
  detailsTitle: { es: 'Detalles del programa', en: 'Program details' },
  detailsSubtitle: { es: 'Todo lo que necesitas saber', en: 'Everything you need to know' },
  detailCommissionLabel: { es: 'Comisión', en: 'Commission' },
  detailCommissionDesc: { es: 'Recibes el 10% del costo de cada envío que realicen tus referidos.', en: 'You receive 10% of the shipping cost for each shipment your referrals make.' },
  detailCookieLabel: { es: 'Duración del cookie', en: 'Cookie duration' },
  days: { es: 'días', en: 'days' },
  detailCookieDesc: { es: 'El link de referido se guarda por 30 días en el navegador del usuario.', en: 'The referral link is saved for 30 days in the user\'s browser.' },
  detailRecurringLabel: { es: 'Comisiones', en: 'Commissions' },
  detailRecurringValue: { es: 'Recurrentes', en: 'Recurring' },
  detailRecurringDesc: { es: 'Ganas por todos los envíos de tus referidos, no solo el primero.', en: 'You earn on all shipments from your referrals, not just the first one.' },
  detailPaymentLabel: { es: 'Pagos', en: 'Payments' },
  detailPaymentValue: { es: 'Mensuales', en: 'Monthly' },
  detailPaymentDesc: { es: 'Solicitamos tus datos bancarios y te pagamos mensualmente.', en: 'We request your bank details and pay you monthly.' },

  // FAQ
  faqTitle: { es: 'Preguntas frecuentes', en: 'Frequently asked questions' },
  faq1Q: { es: '¿Cómo me registro como afiliado?', en: 'How do I register as an affiliate?' },
  faq1A: { es: 'Crea una cuenta en Boxly y activa tu perfil de afiliado desde tu dashboard. Es completamente gratis.', en: 'Create an account on Boxly and activate your affiliate profile from your dashboard. It\'s completely free.' },
  faq2Q: { es: '¿Cómo recibo mis pagos?', en: 'How do I receive my payments?' },
  faq2A: { es: 'Los pagos se realizan por transferencia bancaria. Registra tus datos bancarios en tu portal de afiliado y te pagamos mensualmente.', en: 'Payments are made by bank transfer. Register your bank details in your affiliate portal and we pay you monthly.' },
  faq3Q: { es: '¿Cuánto puedo ganar?', en: 'How much can I earn?' },
  faq3A: { es: 'No hay límite. Ganas el 10% de cada envío que realicen tus referidos. Tus ganancias dependen de cuántas personas refieras y qué tan activos sean.', en: 'There is no limit. You earn 10% of every shipment your referrals make. Your earnings depend on how many people you refer and how active they are.' },
  faq4Q: { es: '¿Qué es el cookie de 30 días?', en: 'What is the 30-day cookie?' },
  faq4A: { es: 'Cuando alguien hace clic en tu link, guardamos tu referencia por 30 días. Si esa persona se registra dentro de ese período, queda vinculada a ti.', en: 'When someone clicks your link, we save your reference for 30 days. If that person registers within that period, they become linked to you.' },
  faq5Q: { es: '¿Qué pasa si mi referido ya tiene cuenta?', en: 'What if my referral already has an account?' },
  faq5A: { es: 'El programa solo aplica para nuevos usuarios que se registren usando tu link de referido.', en: 'The program only applies to new users who register using your referral link.' },

  // CTA
  ctaTitle: { es: '¿Listo para comenzar?', en: 'Ready to get started?' },
  ctaSubtitle: { es: 'Únete al programa de afiliados y comienza a generar ingresos.', en: 'Join the affiliate program and start generating income.' },
  ctaButton: { es: 'Crear mi cuenta', en: 'Create my account' },
  ctaLoginButton: { es: 'Ya tengo cuenta', en: 'I already have an account' },
  ctaNote: { es: 'Si ya tienes cuenta, inicia sesión y activa tu perfil de afiliado desde el dashboard.', en: 'If you already have an account, log in and activate your affiliate profile from the dashboard.' },
}

const t = createTranslations(translations)

const faqs = computed(() => [
  { question: t.value.faq1Q, answer: t.value.faq1A },
  { question: t.value.faq2Q, answer: t.value.faq2A },
  { question: t.value.faq3Q, answer: t.value.faq3A },
  { question: t.value.faq4Q, answer: t.value.faq4A },
  { question: t.value.faq5Q, answer: t.value.faq5A },
])
</script>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.6s ease-out forwards;
  opacity: 0;
}

/* Zero-gravity orbital animations for floating boxes */
@keyframes orbit-slow {
  0% { transform: translate(0, 0) rotate(0deg); }
  25% { transform: translate(20px, -15px) rotate(5deg); }
  50% { transform: translate(40px, 0px) rotate(0deg); }
  75% { transform: translate(20px, 15px) rotate(-5deg); }
  100% { transform: translate(0, 0) rotate(0deg); }
}

@keyframes orbit-reverse-slow {
  0% { transform: translate(0, 0) rotate(0deg); }
  33% { transform: translate(-30px, 20px) rotate(-8deg); }
  66% { transform: translate(-15px, -10px) rotate(4deg); }
  100% { transform: translate(0, 0) rotate(0deg); }
}

@keyframes orbit-medium {
  0% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(-40px, -40px) scale(1.05); }
  100% { transform: translate(0, 0) scale(1); }
}

@keyframes orbit-reverse-medium {
  0% { transform: translate(0, 0) rotate(0deg); }
  50% { transform: translate(40px, 20px) rotate(15deg); }
  100% { transform: translate(0, 0) rotate(0deg); }
}

@keyframes float-horizontal {
  0% { transform: translateX(0) translateY(0) rotate(12deg); }
  50% { transform: translateX(-50px) translateY(-20px) rotate(20deg); }
  100% { transform: translateX(0) translateY(0) rotate(12deg); }
}

@keyframes float-horizontal-reverse {
  0% { transform: translateX(0) translateY(0) rotate(-12deg); }
  50% { transform: translateX(60px) translateY(30px) rotate(-5deg); }
  100% { transform: translateX(0) translateY(0) rotate(-12deg); }
}

@keyframes float-vertical {
  0% { transform: translateY(0) rotate(3deg); }
  50% { transform: translateY(-40px) rotate(-3deg); }
  100% { transform: translateY(0) rotate(3deg); }
}

.animate-orbit-slow {
  animation: orbit-slow 20s ease-in-out infinite;
}

.animate-orbit-reverse-slow {
  animation: orbit-reverse-slow 25s ease-in-out infinite;
}

.animate-orbit-medium {
  animation: orbit-medium 15s ease-in-out infinite;
}

.animate-orbit-reverse-medium {
  animation: orbit-reverse-medium 18s ease-in-out infinite;
}

.animate-float-horizontal {
  animation: float-horizontal 12s ease-in-out infinite;
}

.animate-float-horizontal-reverse {
  animation: float-horizontal-reverse 14s ease-in-out infinite;
}

.animate-float-vertical {
  animation: float-vertical 10s ease-in-out infinite;
}
</style>
