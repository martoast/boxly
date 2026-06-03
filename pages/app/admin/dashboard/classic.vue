<template>
  <section
    class="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/20"
  >
    <!-- Admin Header -->
    <div
      class="bg-white/90 backdrop-blur-sm shadow-sm border-b border-gray-100"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <!-- Top Row: Title + Refresh -->
        <div class="flex items-center justify-between mb-4 sm:mb-0">
          <div>
            <h1
              class="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900"
            >
              {{ t.dashboard }}
            </h1>
            <p class="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">
              {{ t.welcomeBack }}, {{ user?.name }}
            </p>
          </div>

          <!-- Refresh Button (always visible) -->
          <button
            @click="refreshData"
            :disabled="loading"
            class="p-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-300 disabled:opacity-50 sm:hidden"
          >
            <svg
              :class="['w-5 h-5', loading && 'animate-spin']"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>

        <!-- Controls Row -->
        <div
          class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        >
          <!-- Period Selector - Full width on mobile -->
          <select
            v-model="selectedPeriod"
            @change="fetchDashboard"
            class="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          >
            <!-- All Time Option -->
            <option value="all">{{ t.allTime }}</option>

            <!-- Separator -->
            <option disabled>────────────</option>

            <!-- Monthly Options -->
            <option
              v-for="month in availableMonths"
              :key="month.value"
              :value="month.value"
            >
              {{ month.label }}
            </option>
          </select>

          <!-- Action Buttons -->
          <div class="flex items-center gap-2 sm:gap-3">
            <!-- Edit Metrics Button -->
            <NuxtLink
              v-if="selectedPeriod !== 'all'"
              :to="`/app/admin/dashboard/edit-metrics?year=${selectedYear}&month=${selectedMonthNum}`"
              class="flex-1 sm:flex-none inline-flex items-center justify-center px-3 sm:px-4 py-2.5 sm:py-2 bg-primary-500 text-white text-sm font-medium rounded-xl hover:bg-primary-600 shadow-sm hover:shadow-md transition-all duration-300"
            >
              <svg
                class="w-4 h-4 sm:mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              <span class="hidden sm:inline">{{ t.editMetrics }}</span>
              <span class="sm:hidden ml-1.5">{{ t.edit }}</span>
            </NuxtLink>

            <!-- Manage Expenses Button -->
            <NuxtLink
              to="/app/admin/expenses"
              class="flex-1 sm:flex-none inline-flex items-center justify-center px-3 sm:px-4 py-2.5 sm:py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 shadow-sm hover:shadow-md transition-all duration-300"
            >
              <svg
                class="w-4 h-4 sm:mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span class="hidden sm:inline">{{ t.manageExpenses }}</span>
              <span class="sm:hidden ml-1.5">{{ t.expenses }}</span>
            </NuxtLink>

            <!-- Refresh Button (desktop only - mobile is in top row) -->
            <button
              @click="refreshData"
              :disabled="loading"
              class="hidden sm:flex p-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-300 disabled:opacity-50"
            >
              <svg
                :class="['w-5 h-5', loading && 'animate-spin']"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <!-- Loading State -->
      <div
        v-if="loading && !dashboardData"
        class="flex items-center justify-center py-16"
      >
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

      <div v-else class="space-y-6">
        <!-- Combined Data Badge for All Time -->
        <div
          v-if="
            selectedPeriod === 'all' &&
            dashboardData?.financial?.source === 'combined'
          "
          class="bg-accent-blue-light border border-primary-200 rounded-xl p-4 flex items-center gap-3"
        >
          <div class="flex-shrink-0">
            <svg
              class="w-5 h-5 text-primary-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <div class="flex-1">
            <p class="text-sm font-medium text-primary-900">
              {{ t.combinedData }}
            </p>
            <p class="text-xs text-primary-700 mt-0.5">
              {{ t.combinedDataDescription }}
            </p>
          </div>
        </div>

        <!-- Quick Stats Row -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <!-- Total Orders Card -->
          <div
            :class="[
              'bg-white rounded-2xl shadow-sm border p-6 animate-fadeIn relative overflow-hidden',
              isOrdersManual
                ? 'border-blue-300 ring-2 ring-blue-100'
                : 'border-border',
            ]"
          >
            <!-- Manual Mode Indicator -->
            <div v-if="isOrdersManual" class="absolute top-2 right-2">
              <span
                class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 uppercase"
              >
                {{ t.manual }}
              </span>
            </div>
            <div class="flex items-center justify-between mb-4">
              <div class="p-2.5 rounded-xl bg-primary-50">
                <svg
                  class="w-5 h-5 text-primary-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
            </div>
            <p
              class="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1"
            >
              {{ t.totalOrders }}
            </p>
            <p class="text-2xl font-bold text-text-primary">
              {{ totalOrdersCount }}
            </p>
            <!-- Show calculated value if manual -->
            <p
              v-if="isOrdersManual && calculatedOrdersCount !== null"
              class="text-xs text-gray-400 mt-1"
            >
              {{ t.calculated }}: {{ calculatedOrdersCount }}
            </p>
            <p v-else class="text-xs text-text-secondary mt-1">
              {{ periodLabel }}
            </p>
          </div>

          <!-- Total Boxes Card -->
          <div
            :class="[
              'bg-white rounded-2xl shadow-sm border p-6 animate-fadeIn relative overflow-hidden',
              isBoxesManual
                ? 'border-amber-300 ring-2 ring-amber-100'
                : 'border-border',
            ]"
            style="animation-delay: 0.1s"
          >
            <!-- Manual Mode Indicator -->
            <div v-if="isBoxesManual" class="absolute top-2 right-2">
              <span
                class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 uppercase"
              >
                {{ t.manual }}
              </span>
            </div>
            <div class="flex items-center justify-between mb-4">
              <div class="p-2.5 rounded-xl bg-amber-50">
                <svg
                  class="w-5 h-5 text-amber-600"
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
            </div>
            <p
              class="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1"
            >
              {{ t.totalBoxes }}
            </p>
            <p class="text-2xl font-bold text-text-primary">
              {{ totalBoxes }}
            </p>
            <p class="text-xs text-text-secondary mt-1">
              {{ dashboardData?.packages?.total_items || 0 }} {{ t.packages }}
            </p>
          </div>

          <!-- Purchase Requests Card -->
          <div
            class="bg-white rounded-2xl shadow-sm border border-border p-6 animate-fadeIn"
            style="animation-delay: 0.15s"
          >
            <div class="flex items-center justify-between mb-4">
              <div class="p-2.5 rounded-xl bg-blue-50">
                <svg
                  class="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
              </div>
            </div>
            <p
              class="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1"
            >
              {{ t.purchaseRequests }}
            </p>
            <p class="text-2xl font-bold text-text-primary">
              {{
                dashboardData?.financial?.metrics?.purchase_requests_count || 0
              }}
            </p>
            <p class="text-xs text-text-secondary mt-1">
              {{
                dashboardData?.financial?.metrics?.purchased_items_count || 0
              }}
              {{ t.itemsPurchased }} {{ periodLabel }}
            </p>
          </div>

          <!-- Customers Card -->
          <div
            class="bg-white rounded-2xl shadow-sm border border-border p-6 animate-fadeIn"
            style="animation-delay: 0.2s"
          >
            <div class="flex items-center justify-between mb-4">
              <div class="p-2.5 rounded-xl bg-accent-green-light">
                <svg
                  class="w-5 h-5 text-accent-green"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
            </div>
            <p
              class="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1"
            >
              {{ t.totalCustomers }}
            </p>
            <p class="text-2xl font-bold text-text-primary">
              {{ dashboardData?.overview?.total_customers || 0 }}
            </p>
            <p class="text-xs text-text-secondary mt-1">
              {{ periodLabel }}
            </p>
          </div>

          <!-- Conversations Card -->
          <div
            class="bg-white rounded-2xl shadow-sm border border-purple-200 ring-2 ring-purple-100 p-6 animate-fadeIn relative overflow-hidden"
            style="animation-delay: 0.3s"
          >
            <div class="flex items-center justify-between mb-4">
              <div class="p-2.5 rounded-xl bg-purple-50">
                <svg
                  class="w-5 h-5 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
            </div>
            <p
              class="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1"
            >
              {{ t.conversations }}
            </p>
            <p class="text-2xl font-bold text-text-primary">
              {{ dashboardData?.financial?.metrics?.total_conversations || 0 }}
            </p>
            <p class="text-xs text-text-secondary mt-1">{{ periodLabel }}</p>
          </div>
        </div>

        <!-- Financial Overview Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Revenue Card -->
          <div
            :class="[
              'rounded-2xl shadow-sm border p-6 animate-fadeIn relative overflow-hidden',
              isFinancialManual
                ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-300 ring-2 ring-emerald-100'
                : 'bg-gradient-to-br from-green-50 to-green-100 border-green-200',
            ]"
            style="animation-delay: 0.4s"
          >
            <!-- Manual Mode Indicator -->
            <div v-if="isFinancialManual" class="absolute top-2 right-2">
              <span
                class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-200 text-emerald-800 uppercase"
              >
                {{ t.manual }}
              </span>
            </div>
            <div class="flex items-center justify-between mb-4">
              <div
                :class="[
                  'p-3 rounded-xl text-white',
                  isFinancialManual ? 'bg-emerald-500' : 'bg-green-500',
                ]"
              >
                <svg
                  class="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <p
              :class="[
                'text-sm font-medium uppercase tracking-wider',
                isFinancialManual ? 'text-emerald-900' : 'text-green-900',
              ]"
            >
              {{ t.totalRevenue }}
            </p>
            <p
              :class="[
                'mt-2 text-3xl font-bold',
                isFinancialManual ? 'text-emerald-900' : 'text-green-900',
              ]"
            >
              ${{
                formatMoney(
                  dashboardData?.financial?.revenue?.period_total || 0
                )
              }}
            </p>

            <!-- Revenue Breakdown (only in auto mode) -->
            <div
              v-if="
                !isFinancialManual &&
                dashboardData?.financial?.revenue?.breakdown
              "
              class="mt-3 pt-3 border-t border-green-200/50 text-xs space-y-1"
            >
              <div class="flex justify-between text-green-800">
                <span>{{ t.shippingRevenue }}:</span>
                <span class="font-semibold"
                  >${{
                    formatMoney(
                      dashboardData.financial.revenue.breakdown.shipping || 0
                    )
                  }}</span
                >
              </div>
              <div class="flex justify-between text-green-800">
                <span>{{ t.serviceFeeRevenue }}:</span>
                <span class="font-semibold"
                  >${{
                    formatMoney(
                      dashboardData.financial.revenue.breakdown.service_fees ||
                        0
                    )
                  }}</span
                >
              </div>
            </div>

            <p
              v-else-if="!isFinancialManual"
              class="text-xs text-green-700 mt-1"
            >
              {{ periodLabelFull }}
            </p>
          </div>

          <!-- Expenses Card -->
          <div
            :class="[
              'bg-gradient-to-br from-red-50 to-red-100 rounded-2xl shadow-sm border p-6 animate-fadeIn relative overflow-hidden',
              isFinancialManual
                ? 'border-red-300 ring-2 ring-red-100'
                : 'border-red-200',
            ]"
            style="animation-delay: 0.5s"
          >
            <!-- Manual Mode Indicator -->
            <div v-if="isFinancialManual" class="absolute top-2 right-2">
              <span
                class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-200 text-red-800 uppercase"
              >
                {{ t.manual }}
              </span>
            </div>
            <div class="flex items-center justify-between mb-4">
              <div class="p-3 rounded-xl bg-red-500 text-white">
                <svg
                  class="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                  />
                </svg>
              </div>
            </div>
            <p
              class="text-sm font-medium text-red-900 uppercase tracking-wider"
            >
              {{ t.totalExpenses }}
            </p>
            <p class="mt-2 text-3xl font-bold text-red-900">
              ${{ formatMoney(dashboardData?.financial?.expenses?.total || 0) }}
            </p>
            <p v-if="!isFinancialManual" class="text-xs text-red-700 mt-1">
              {{ periodLabel }}
            </p>
          </div>

          <!-- Profit Card -->
          <div
            :class="[
              'rounded-2xl shadow-sm border p-6 animate-fadeIn relative overflow-hidden',
              isFinancialManual
                ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-300 ring-2 ring-emerald-100'
                : 'bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200',
            ]"
            style="animation-delay: 0.6s"
          >
            <!-- Manual Mode Indicator -->
            <div v-if="isFinancialManual" class="absolute top-2 right-2">
              <span
                class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-200 text-emerald-800 uppercase"
              >
                {{ t.manual }}
              </span>
            </div>
            <div class="flex items-center justify-between mb-4">
              <div
                :class="[
                  'p-3 rounded-xl text-white',
                  isFinancialManual ? 'bg-emerald-500' : 'bg-primary-500',
                ]"
              >
                <svg
                  class="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>
            <p
              :class="[
                'text-sm font-medium uppercase tracking-wider',
                isFinancialManual ? 'text-emerald-900' : 'text-primary-900',
              ]"
            >
              {{ t.netProfit }}
            </p>
            <p
              :class="[
                'mt-2 text-3xl font-bold',
                profit >= 0
                  ? isFinancialManual
                    ? 'text-emerald-900'
                    : 'text-primary-900'
                  : 'text-red-600',
              ]"
            >
              {{ profit < 0 ? "-" : "" }}${{ formatMoney(Math.abs(profit)) }}
            </p>
            <p
              :class="[
                'text-xs mt-1',
                isFinancialManual ? 'text-emerald-700' : 'text-primary-700',
              ]"
            >
              {{ formatPercentage(profitMargin) }}% {{ t.margin }}
            </p>
          </div>

          <!-- Accounts Receivable Card -->
          <div
            class="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl shadow-sm border border-orange-200 p-6 animate-fadeIn relative overflow-hidden"
            style="animation-delay: 0.7s"
          >
            <div class="flex items-center justify-between mb-4">
              <div class="p-3 rounded-xl bg-orange-500 text-white">
                <svg
                  class="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <p class="text-sm font-medium text-orange-900 uppercase tracking-wider">
              {{ t.accountsReceivable }}
            </p>
            <p class="mt-2 text-3xl font-bold text-orange-900">
              ${{ formatMoney(dashboardData?.financial?.accounts_receivable?.total || 0) }}
            </p>
            <p class="text-xs text-orange-700 mt-1">
              {{ dashboardData?.financial?.accounts_receivable?.count || 0 }} {{ t.unpaidOrders }}
            </p>
          </div>
        </div>

        <!-- Marketing Metrics Row (Show when conversations > 0) -->
        <div
          v-if="hasConversations"
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <!-- CAC Card -->
          <div
            class="bg-white rounded-2xl shadow-sm border border-border p-6 animate-fadeIn"
            style="animation-delay: 0.7s"
          >
            <div class="flex items-center justify-between mb-4">
              <div class="p-2.5 rounded-xl bg-amber-50">
                <svg
                  class="w-5 h-5 text-amber-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
            </div>
            <p
              class="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1"
            >
              {{ t.cac }}
            </p>
            <p class="text-2xl font-bold text-text-primary">
              ${{ formatMoney(dashboardData?.financial?.metrics?.cac || 0) }}
            </p>
            <p class="text-xs text-text-secondary mt-1">
              {{ t.costPerCustomer }}
            </p>
          </div>

          <!-- ROAS Card -->
          <div
            class="bg-white rounded-2xl shadow-sm border border-border p-6 animate-fadeIn"
            style="animation-delay: 0.8s"
          >
            <div class="flex items-center justify-between mb-4">
              <div class="p-2.5 rounded-xl bg-primary-50">
                <svg
                  class="w-5 h-5 text-primary-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
            </div>
            <p
              class="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1"
            >
              {{ t.roas }}
            </p>
            <p class="text-2xl font-bold text-text-primary">
              {{ formatRatio(dashboardData?.financial?.metrics?.roas || 0) }}x
            </p>
            <p class="text-xs text-text-secondary mt-1">
              {{ t.returnOnAdSpend }}
            </p>
          </div>

          <!-- Conversion Rate Card -->
          <div
            class="bg-white rounded-2xl shadow-sm border border-border p-6 animate-fadeIn"
            style="animation-delay: 0.9s"
          >
            <div class="flex items-center justify-between mb-4">
              <div class="p-2.5 rounded-xl bg-accent-green-light">
                <svg
                  class="w-5 h-5 text-accent-green"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
            </div>
            <p
              class="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1"
            >
              {{ t.conversionRate }}
            </p>
            <p class="text-2xl font-bold text-text-primary">
              {{
                formatPercentage(
                  dashboardData?.financial?.metrics?.conversion_rate || 0
                )
              }}%
            </p>
            <p class="text-xs text-text-secondary mt-1">
              {{ t.conversationsToOrders }}
            </p>
          </div>

          <!-- Ad Spend Card -->
          <div
            class="bg-white rounded-2xl shadow-sm border border-border p-6 animate-fadeIn"
            style="animation-delay: 1s"
          >
            <div class="flex items-center justify-between mb-4">
              <div class="p-2.5 rounded-xl bg-red-50">
                <svg
                  class="w-5 h-5 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>
              </div>
            </div>
            <p
              class="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1"
            >
              {{ t.adSpend }}
            </p>
            <p class="text-2xl font-bold text-text-primary">
              ${{
                formatMoney(dashboardData?.financial?.metrics?.ad_spend || 0)
              }}
            </p>
            <p class="text-xs text-text-secondary mt-1">{{ t.thisMonth }}</p>
          </div>
        </div>

        <!-- Expense Breakdown & Box Sizes -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Expense Categories -->
          <div
            class="bg-white rounded-2xl shadow-sm border border-border p-6 animate-fadeIn"
            style="animation-delay: 1.1s"
          >
            <h3 class="text-lg font-bold text-text-primary mb-4">
              {{ t.expenseBreakdown }}
            </h3>
            <div v-if="Object.keys(expenses).length > 0" class="space-y-2">
              <div
                v-for="(amount, category) in expenses"
                :key="category"
                class="flex items-center justify-between py-2 border-b border-border-light last:border-0"
              >
                <span class="text-sm font-medium text-text-primary">{{
                  getCategoryLabel(category)
                }}</span>
                <span class="text-lg font-bold text-text-primary"
                  >${{ formatMoney(amount) }}</span
                >
              </div>
            </div>
            <div v-else class="text-center py-8">
              <svg
                class="w-12 h-12 text-gray-300 mx-auto mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <p class="text-sm text-text-secondary">{{ t.noExpenses }}</p>
            </div>
          </div>

          <!-- Box Sizes Distribution -->
          <div
            :class="[
              'bg-white rounded-2xl shadow-sm border p-6 animate-fadeIn',
              isBoxesManual
                ? 'border-amber-300 ring-2 ring-amber-100'
                : 'border-border',
            ]"
            style="animation-delay: 1.2s"
          >
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-bold text-text-primary">
                {{ t.boxSizeDistribution }}
              </h3>
              <div class="flex items-center gap-2">
                <!-- Manual indicator -->
                <span
                  v-if="isBoxesManual"
                  class="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium"
                >
                  {{ t.manual }}
                </span>
              </div>
            </div>

            <div v-if="Object.keys(boxDistribution).length > 0">
              <!-- Box Size Bars -->
              <div class="space-y-3">
                <div
                  v-for="(count, size) in boxDistribution"
                  :key="size"
                  class="group"
                >
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-sm font-medium text-text-primary">{{
                      formatBoxSize(size)
                    }}</span>
                    <div class="flex items-center gap-2">
                      <span class="text-lg font-bold text-text-primary">{{
                        count
                      }}</span>
                    </div>
                  </div>
                  <!-- Progress bar showing relative distribution -->
                  <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      class="h-full rounded-full transition-all duration-500"
                      :class="getBoxSizeColor(size)"
                      :style="{ width: `${(count / totalBoxes) * 100}%` }"
                    ></div>
                  </div>
                </div>
              </div>

              <!-- Total Row -->
              <div
                :class="[
                  'mt-6 pt-4 border-t-2 rounded-xl p-4',
                  isBoxesManual
                    ? 'border-amber-200 bg-gradient-to-r from-amber-50 to-amber-100'
                    : 'border-primary-200 bg-gradient-to-r from-primary-50 to-primary-100',
                ]"
              >
                <div class="flex items-center justify-between">
                  <div>
                    <span
                      :class="[
                        'text-base font-bold uppercase tracking-wide',
                        isBoxesManual ? 'text-amber-900' : 'text-primary-900',
                      ]"
                      >{{ t.totalBoxes }}</span
                    >
                    <p
                      :class="[
                        'text-xs mt-0.5',
                        isBoxesManual ? 'text-amber-700' : 'text-primary-700',
                      ]"
                    >
                      {{ t.acrossAllOrders }}
                    </p>
                  </div>
                  <div class="text-right">
                    <span
                      :class="[
                        'text-3xl font-black',
                        isBoxesManual ? 'text-amber-600' : 'text-primary-600',
                      ]"
                      >{{ totalBoxes }}</span
                    >
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="text-center py-8">
              <svg
                class="w-12 h-12 text-gray-300 mx-auto mb-3"
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
              <p class="text-sm text-text-secondary">{{ t.noBoxes }}</p>
            </div>

            <!-- Source indicators -->
            <div
              v-if="isBoxesManual"
              class="mt-4 pt-4 border-t border-border-light"
            >
              <p class="text-xs text-amber-700 italic flex items-center gap-2">
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
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                {{ t.manualBoxData }}
              </p>
            </div>
            <div
              v-else-if="dashboardData?.box_distribution?.source === 'combined'"
              class="mt-4 pt-4 border-t border-border-light"
            >
              <p
                class="text-xs text-text-secondary italic flex items-center gap-2"
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
                    d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
                  />
                </svg>
                {{ t.combinedBoxData }}
              </p>
            </div>
            <div
              v-else-if="
                dashboardData?.box_distribution?.source === 'calculated'
              "
              class="mt-4 pt-4 border-t border-border-light"
            >
              <p
                class="text-xs text-text-secondary italic flex items-center gap-2"
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
                    d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                {{ t.calculatedBoxData }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- ALL-TIME BUSINESS TRAJECTORY -->
      <div class="mt-8">
        <div class="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 class="text-lg font-bold text-gray-900">{{ t.trajectoryTitle }}</h2>
            <p class="text-xs text-gray-400 mt-0.5">{{ t.trajectorySubtitle }}</p>
          </div>
          <div class="inline-flex rounded-xl border border-gray-200 bg-white p-0.5 text-xs font-semibold shrink-0">
            <button
              @click="trajectoryMode = 'monthly'"
              :class="trajectoryMode === 'monthly' ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'"
              class="px-3 py-1.5 rounded-lg transition-colors"
            >{{ t.monthly }}</button>
            <button
              @click="trajectoryMode = 'cumulative'"
              :class="trajectoryMode === 'cumulative' ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'"
              class="px-3 py-1.5 rounded-lg transition-colors"
            >{{ t.cumulative }}</button>
          </div>
        </div>

        <div v-if="trajectory === null" class="bg-white rounded-2xl border border-border p-12 text-center text-gray-300">
          {{ t.loadingChart }}
        </div>
        <div v-else-if="trajectory.length === 0" class="bg-white rounded-2xl border border-border p-12 text-center text-gray-400">
          {{ t.noData }}
        </div>
        <div v-else class="space-y-6">
          <TrajectoryChart
            :key="`rev-${trajectoryMode}`"
            :title="t.revenueSeries"
            :subtitle="trajectoryMode === 'cumulative' ? t.cumulativeHint : ''"
            type="area"
            format="currency"
            :categories="categories"
            :series="financialSeries"
            :colors="['#2E6BB7']"
            :height="360"
          />
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TrajectoryChart
              :key="`cust-${trajectoryMode}`"
              :title="t.customerGrowth"
              type="area"
              format="number"
              :categories="categories"
              :series="customerSeries"
              :colors="['#10b981']"
            />
            <TrajectoryChart
              :key="`sales-${trajectoryMode}`"
              :title="t.ordersSeries"
              type="bar"
              format="number"
              :categories="categories"
              :series="salesSeries"
              :colors="['#2E6BB7']"
            />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import TrajectoryChart from "~/components/admin/TrajectoryChart.vue";

definePageMeta({
  layout: "admin",
  middleware: ["auth", "admin"],
});

const { $customFetch } = useNuxtApp();
const user = useUser().value;
const { t: createTranslations } = useLanguage();

// State
const loading = ref(true);
const dashboardData = ref(null);
const selectedPeriod = ref("");

// All-time trajectory charts (independent of the period selector)
const trajectory = ref(null);
const trajectoryMode = ref("monthly"); // monthly | cumulative

const fetchTimeSeries = async () => {
  try {
    const response = await $customFetch("/admin/dashboard/time-series");
    trajectory.value = response.data?.months ?? [];
  } catch (error) {
    console.error("Error fetching time-series:", error);
    trajectory.value = [];
  }
};

const runningTotal = (arr) => {
  let sum = 0;
  return arr.map((v) => (sum += v));
};

const categories = computed(() => (trajectory.value ?? []).map((m) => m.label));

const financialSeries = computed(() => {
  const rows = trajectory.value ?? [];
  const rev = rows.map((m) => m.revenue);
  const cum = trajectoryMode.value === "cumulative";
  return [{ name: t.value.revenueSeries, data: cum ? runningTotal(rev) : rev }];
});

const customerSeries = computed(() => {
  const rows = trajectory.value ?? [];
  // cumulative_customers already accumulates; monthly shows new sign-ups
  const data =
    trajectoryMode.value === "cumulative"
      ? rows.map((m) => m.cumulative_customers)
      : rows.map((m) => m.new_customers);
  const name =
    trajectoryMode.value === "cumulative"
      ? t.value.totalCustomersSeries
      : t.value.newCustomersSeries;
  return [{ name, data }];
});

const salesSeries = computed(() => {
  const rows = trajectory.value ?? [];
  const orders = rows.map((m) => m.orders_count);
  const cum = trajectoryMode.value === "cumulative";
  return [{ name: t.value.ordersSeries, data: cum ? runningTotal(orders) : orders }];
});

// Get current date
const currentDate = new Date();
const currentYear = currentDate.getFullYear();
const currentMonth = currentDate.getMonth() + 1;

// Available months (last 12 months + current)
const availableMonths = computed(() => {
  const months = [];
  for (let i = 11; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const label = date.toLocaleDateString(
      user?.preferred_language === "es" ? "es-MX" : "en-US",
      {
        month: "long",
        year: "numeric",
      }
    );
    months.push({
      value: `${year}-${String(month).padStart(2, "0")}`,
      label,
    });
  }
  return months;
});

// Computed - Selected year and month
const selectedYear = computed(() => {
  if (selectedPeriod.value === "all") return null;
  const [year] = selectedPeriod.value.split("-");
  return parseInt(year);
});

const selectedMonthNum = computed(() => {
  if (selectedPeriod.value === "all") return null;
  const [, month] = selectedPeriod.value.split("-");
  return parseInt(month);
});

// Computed - Period label
const periodLabel = computed(() => {
  if (selectedPeriod.value === "all") {
    return t.value.allTime;
  }
  return t.value.thisMonth;
});

const periodLabelFull = computed(() => {
  if (selectedPeriod.value === "all") {
    return t.value.allTime;
  }
  return `${dashboardData.value?.period?.month_name || ""} ${
    dashboardData.value?.period?.year || ""
  }`;
});

// Computed - Granular manual mode flags
const isFinancialManual = computed(() => {
  return (
    dashboardData.value?.financial?.revenue?.is_manual ||
    dashboardData.value?.financial?.manual_metrics?.is_financial_manual ||
    false
  );
});

const isOrdersManual = computed(() => {
  return (
    dashboardData.value?.financial?.metrics?.total_orders_is_manual ||
    dashboardData.value?.financial?.manual_metrics?.is_orders_manual ||
    false
  );
});

const isBoxesManual = computed(() => {
  return (
    dashboardData.value?.box_distribution?.is_manual ||
    dashboardData.value?.financial?.manual_metrics?.is_boxes_manual ||
    false
  );
});

const hasAnyManualMode = computed(() => {
  return isFinancialManual.value || isOrdersManual.value || isBoxesManual.value;
});

// Computed - Calculated values for comparison
const calculatedOrdersCount = computed(() => {
  return (
    dashboardData.value?.financial?.metrics?.total_orders_calculated || null
  );
});

const calculatedBoxDistribution = computed(() => {
  return dashboardData.value?.box_distribution?.calculated || {};
});

const calculatedTotalBoxes = computed(() => {
  return dashboardData.value?.box_distribution?.calculated?.total || null;
});

// Computed - Total orders count
const totalOrdersCount = computed(() => {
  if (
    dashboardData.value?.financial?.source === "manual" ||
    dashboardData.value?.financial?.source === "combined" ||
    dashboardData.value?.financial?.source === "mixed"
  ) {
    return dashboardData.value?.financial?.metrics?.total_orders || 0;
  }
  if (!dashboardData.value?.orders?.by_status) return 0;
  const orders = dashboardData.value.orders.by_status;
  return Object.values(orders).reduce((sum, count) => sum + count, 0);
});

// Computed - Financial metrics
const profit = computed(
  () => dashboardData.value?.financial?.profit?.amount || 0
);
const profitMargin = computed(
  () => dashboardData.value?.financial?.profit?.margin || 0
);

// Computed - Check if conversations exist (for showing marketing metrics)
const hasConversations = computed(() => {
  return dashboardData.value?.financial?.metrics?.total_conversations > 0;
});

// Computed - Expenses (excluding total)
const expenses = computed(() => {
  if (!dashboardData.value?.financial?.expenses) return {};
  const exp = { ...dashboardData.value.financial.expenses };
  delete exp.total;
  return exp;
});

// Computed - Box distribution
const boxDistribution = computed(() => {
  if (!dashboardData.value?.box_distribution) return {};
  const dist = { ...dashboardData.value.box_distribution };
  // Remove non-size keys
  delete dist.not_selected;
  delete dist.total;
  delete dist.source;
  delete dist.is_manual;
  delete dist.calculated;
  return dist;
});

// Computed - Total boxes
const totalBoxes = computed(() => {
  if (!dashboardData.value?.box_distribution) return 0;
  if (dashboardData.value.box_distribution.total) {
    return dashboardData.value.box_distribution.total;
  }
  const dist = boxDistribution.value;
  return Object.values(dist).reduce((sum, count) => sum + count, 0);
});

const calculatedProfit = computed(() => {
  if (!isFinancialManual.value) return null;
  const calcRevenue =
    dashboardData.value?.financial?.revenue?.calculated_value || 0;
  const calcExpenses =
    dashboardData.value?.financial?.expenses?.calculated_total || 0;
  return calcRevenue - calcExpenses;
});

// Translations
const translations = {
  dashboard: { es: "Panel de Control", en: "Dashboard" },
  welcomeBack: { es: "Bienvenido de vuelta", en: "Welcome back" },
  editMetrics: { es: "Editar Métricas", en: "Edit Metrics" },
  manageExpenses: { es: "Gestionar Gastos", en: "Manage Expenses" },
  totalRevenue: { es: "Ingresos Totales", en: "Total Revenue" },
  totalExpenses: { es: "Gastos Totales", en: "Total Expenses" },
  netProfit: { es: "Ganancia Neta", en: "Net Profit" },
  margin: { es: "margen", en: "margin" },
  conversations: { es: "Leads", en: "Leads" },
  thisMonth: { es: "este mes", en: "this month" },
  allTime: { es: "Todo el Tiempo", en: "All Time" },
  totalOrders: { es: "Envios Totales", en: "Total Shipments" },
  totalPackages: { es: "Paquetes Totales", en: "Total Packages" },
  totalCustomers: { es: "Clientes Totales", en: "Total Customers" },
  awaiting: { es: "esperando", en: "awaiting" },
  expenseBreakdown: { es: "Desglose de Gastos", en: "Expense Breakdown" },
  boxSizeDistribution: {
    es: "Distribución de Cajas",
    en: "Box Size Distribution",
  },
  totalBoxes: { es: "Total de Cajas", en: "Total Boxes" },
  acrossAllOrders: { es: "en todos los pedidos", en: "across all orders" },
  includesMultiBox: { es: "Incluye multi-caja", en: "Includes multi-box" },
  combinedData: { es: "Datos Combinados", en: "Combined Data" },
  combinedDataDescription: {
    es: "Mostrando totales históricos: métricas manuales + datos calculados del sistema.",
    en: "Showing historical totals: manual metrics + calculated system data.",
  },
  editData: { es: "Editar", en: "Edit" },
  manualBoxData: {
    es: "Datos de cajas ingresados manualmente",
    en: "Box data manually entered",
  },
  combinedBoxData: {
    es: "Cajas combinadas: métricas manuales + sistema",
    en: "Combined boxes: manual metrics + system",
  },
  calculatedBoxData: {
    es: "Calculado del sistema",
    en: "Calculated from system",
  },
  alwaysFromDatabase: {
    es: "siempre desde base de datos",
    en: "always from database",
  },
  noExpenses: { es: "No hay gastos registrados", en: "No expenses recorded" },
  noBoxes: { es: "No hay cajas registradas", en: "No boxes recorded" },
  cac: { es: "CAC", en: "CAC" },
  costPerCustomer: { es: "Costo por cliente", en: "Cost per customer" },
  roas: { es: "ROAS", en: "ROAS" },
  returnOnAdSpend: {
    es: "Retorno de inversión publicitaria",
    en: "Return on ad spend",
  },
  conversionRate: { es: "Tasa de Conversión", en: "Conversion Rate" },
  conversationsToOrders: {
    es: "leads a órdenes",
    en: "conversations to orders",
  },
  adSpend: { es: "Gasto Publicitario", en: "Ad Spend" },
  shipping: { es: "Envíos", en: "Shipping" },
  ads: { es: "Publicidad", en: "Advertising" },
  software: { es: "Software", en: "Software" },
  office: { es: "Oficina", en: "Office" },
  po_box: { es: "Apartado Postal", en: "PO Box" },
  misc: { es: "Varios", en: "Miscellaneous" },
  shippingRevenue: { es: "Ingresos Envíos", en: "Shipping Revenue" },
  serviceFeeRevenue: { es: "Ingresos Compras", en: "Purchase Fees" },
  purchaseRequests: { es: "Personal Shopping", en: "Personal Shopping" },
  itemsPurchased: { es: "artículos", en: "items" },
  // Granular manual mode translations
  granularManualMode: {
    es: "Modo Manual Granular Activo",
    en: "Granular Manual Mode Active",
  },
  financialManual: { es: "Financiero", en: "Financial" },
  ordersManual: { es: "Órdenes", en: "Orders" },
  boxesManual: { es: "Cajas", en: "Boxes" },
  manual: { es: "Manual", en: "Manual" },
  calculated: { es: "Calculado", en: "Calculated" },
  fromDatabase: { es: "desde base de datos", en: "from database" },
  packages: { es: "paquetes", en: "packages" },
  edit: { es: "Editar", en: "Edit" },
  expenses: { es: "Gastos", en: "Expenses" },
  accountsReceivable: { es: "Cuentas por Cobrar", en: "Accounts Receivable" },
  unpaidOrders: { es: "órdenes pendientes", en: "unpaid orders" },
  trajectoryTitle: { es: "Trayectoria del negocio", en: "Business trajectory" },
  trajectorySubtitle: { es: "Todo el historial desde el inicio", en: "Full history since inception" },
  monthly: { es: "Mensual", en: "Monthly" },
  cumulative: { es: "Acumulado", en: "Cumulative" },
  cumulativeHint: { es: "Totales acumulados", en: "Running totals" },
  revVsExp: { es: "Ingresos, Gastos y Ganancia", en: "Revenue, Expenses & Profit" },
  revenueSeries: { es: "Ingresos", en: "Revenue" },
  expensesSeries: { es: "Gastos", en: "Expenses" },
  profitSeries: { es: "Ganancia", en: "Profit" },
  customerGrowth: { es: "Crecimiento de clientes", en: "Customer growth" },
  newCustomersSeries: { es: "Clientes nuevos", en: "New customers" },
  totalCustomersSeries: { es: "Clientes totales", en: "Total customers" },
  salesAndOrders: { es: "Ventas y órdenes", en: "Sales & orders" },
  salesSeries: { es: "Ventas (PRs)", en: "Sales (PRs)" },
  ordersSeries: { es: "Órdenes", en: "Orders" },
  loadingChart: { es: "Cargando gráficos...", en: "Loading charts..." },
  noData: { es: "Aún no hay datos para graficar", en: "No data to chart yet" },
};

const t = createTranslations(translations);

// Methods
const fetchDashboard = async () => {
  loading.value = true;
  try {
    let params = {};

    if (selectedPeriod.value === "all") {
      params = { period: "all" };
    } else {
      const [year, month] = selectedPeriod.value.split("-");
      params = {
        period: "month",
        year: parseInt(year),
        month: parseInt(month),
      };
    }

    const response = await $customFetch("/admin/dashboard", { params });
    dashboardData.value = response.data;
  } catch (error) {
    console.error("Error fetching dashboard:", error);
  } finally {
    loading.value = false;
  }
};

const refreshData = async () => {
  await fetchDashboard();
};

const getCategoryLabel = (category) => {
  return t.value[category] || category;
};

const formatMoney = (amount) => {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const formatRatio = (ratio) => {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(ratio);
};

const formatPercentage = (percent) => {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(percent);
};

const formatBoxSize = (size) => {
  const labels = {
    "extra-small": "XS - Extra Small",
    small: "S - Small",
    medium: "M - Medium",
    large: "L - Large",
    "extra-large": "XL - Extra Large",
  };
  return labels[size] || size;
};

const getBoxSizeColor = (size) => {
  const colors = {
    "extra-small": "bg-gray-400",
    small: "bg-blue-400",
    medium: "bg-green-500",
    large: "bg-amber-500",
    "extra-large": "bg-red-500",
  };
  return colors[size] || "bg-primary-500";
};

onMounted(() => {
  selectedPeriod.value = `${currentYear}-${String(currentMonth).padStart(
    2,
    "0"
  )}`;
  fetchDashboard();
  fetchTimeSeries();
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
  animation: fadeIn 0.6s ease-out forwards;
  opacity: 0;
}
</style>
