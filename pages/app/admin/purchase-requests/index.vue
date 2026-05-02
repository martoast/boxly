<template>
  <section
    class="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/20"
  >
    <!-- Admin Header -->
    <div
      class="bg-white/90 backdrop-blur-sm shadow-sm border-b border-gray-100"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div class="flex items-center justify-between">
          <!-- Left: Title & Count -->
          <div class="flex items-center gap-3 sm:gap-4">
            <h1
              class="text-lg sm:text-2xl font-extrabold text-gray-900 truncate"
            >
              {{ t.purchaseRequests }}
            </h1>
            <span
              class="bg-primary-100 text-primary-700 px-2.5 py-0.5 rounded-full text-xs sm:text-sm font-medium"
            >
              {{ pagination.total }}
            </span>
          </div>

          <!-- Right: Create Button -->
          <NuxtLink
            to="/app/admin/purchase-requests/create"
            class="inline-flex items-center justify-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 shadow-sm transition-all hover:-translate-y-0.5"
          >
            <svg
              class="w-5 h-5 sm:mr-2"
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
            <span class="hidden sm:inline">{{ t.createRequest }}</span>
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <!-- Filter Section -->
      <div
        class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6 p-4 animate-fadeIn"
      >
        <div class="space-y-3">
          <!-- Bulk Actions Bar -->
          <div
            v-if="selectedRequests.length > 0"
            class="flex items-center justify-between p-3 bg-primary-50 border border-primary-200 rounded-xl"
          >
            <div class="flex items-center gap-3">
              <span class="text-sm font-medium text-primary-900">
                {{ selectedRequests.length }} {{ t.selected }}
              </span>
              <button
                @click="clearSelection"
                class="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                {{ t.clearSelection }}
              </button>
            </div>
            <div class="flex flex-wrap items-center gap-2">
            <!-- Bulk Status Dropdown -->
            <select
              v-model="bulkStatusTarget"
              @change="onBulkStatusPick"
              :disabled="updatingBulkStatus"
              class="text-sm bg-white border border-primary-300 text-primary-900 rounded-lg px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="" disabled>{{ updatingBulkStatus ? t.updating : t.bulkSetStatus }}</option>
              <option value="pending_review">{{ t.pendingReview }}</option>
              <option value="quoted">{{ t.quoted }}</option>
              <option value="paid">{{ t.paid }}</option>
              <option value="purchased">{{ t.purchased }}</option>
              <option value="rejected">{{ t.rejected }}</option>
              <option value="cancelled">{{ t.cancelled }}</option>
            </select>

            <!-- Merge Button -->
            <button
              v-if="canMergeRequests"
              @click="confirmMerge"
              :disabled="mergingRequests"
              class="inline-flex items-center px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              <svg
                v-if="!mergingRequests"
                class="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              <svg
                v-else
                class="animate-spin h-4 w-4 mr-2"
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
              {{ mergingRequests ? t.merging : t.mergeRequests }} ({{ selectedRequests.length }})
            </button>

            <!-- Delete Button -->
            <button
              @click="confirmBulkDelete"
              :disabled="deletingBulk"
              class="inline-flex items-center px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              <svg
                v-if="!deletingBulk"
                class="w-4 h-4 mr-2"
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
              <svg
                v-else
                class="animate-spin h-4 w-4 mr-2"
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
              {{ deletingBulk ? t.deleting : t.deleteSelected }}
            </button>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row gap-4">
            <!-- Search -->
            <div class="relative flex-1">
              <div
                class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
              >
                <svg
                  class="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                v-model="searchQuery"
                type="text"
                :placeholder="t.searchPlaceholder"
                class="block w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <!-- Status Filter -->
            <select
              v-model="statusFilter"
              class="w-full sm:w-48 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">{{ t.allStatuses }}</option>
              <option value="pending_review">{{ t.pendingReview }}</option>
              <option value="quoted">{{ t.quoted }}</option>
              <option value="paid">{{ t.paid }}</option>
              <option value="purchased">{{ t.purchased }}</option>
              <option value="rejected">{{ t.rejected }}</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="py-20 text-center">
        <div
          class="inline-block w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"
        ></div>
        <p class="mt-4 text-gray-500">{{ t.loading }}</p>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="requests.length === 0"
        class="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100"
      >
        <div
          class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400"
        >
          <svg
            class="w-8 h-8"
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
        <h3 class="text-lg font-medium text-gray-900">{{ t.noRequests }}</h3>
        <p class="text-gray-500">{{ t.noRequestsDesc }}</p>
      </div>

      <!-- List Table -->
      <div
        v-else
        class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fadeIn"
        style="animation-delay: 0.1s"
      >
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-100">
              <tr>
                <th class="px-6 py-3 text-left w-4">
                  <input
                    type="checkbox"
                    :checked="allSelected"
                    @change="toggleSelectAll"
                    class="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer"
                  />
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {{ t.customer }}
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {{ t.status }}
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {{ t.items }}
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {{ t.date }}
                </th>
                <th class="relative px-6 py-3">
                  <span class="sr-only">{{ t.actions }}</span>
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="req in requests"
                :key="req.id"
                class="hover:bg-gray-50 transition-colors cursor-pointer group"
                :class="{ 'bg-primary-50/30': isSelected(req.id) }"
                @click="navigateTo(`/app/admin/purchase-requests/${req.id}`)"
              >
                <td class="px-6 py-4 whitespace-nowrap" @click.stop>
                  <input
                    type="checkbox"
                    :checked="isSelected(req.id)"
                    @change="toggleSelection(req.id)"
                    class="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer"
                  />
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900 font-medium">
                    {{ req.user?.name }}
                  </div>
                  <div class="text-xs text-gray-500">{{ req.user?.email }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    :class="[
                      'px-2.5 py-0.5 rounded-full text-xs font-medium border',
                      getStatusColor(req.status),
                    ]"
                  >
                    {{ getStatusLabel(req.status) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ req.items?.length || 0 }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ formatDate(req.created_at) }}
                </td>
                <td
                  class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
                >
                  <svg
                    class="w-5 h-5 text-gray-400 group-hover:text-primary-600 inline-block"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div
          v-if="pagination.lastPage > 1"
          class="px-6 py-4 border-t border-gray-100 flex items-center justify-between"
        >
          <div class="text-sm text-gray-500">
            {{ t.showing }} {{ pagination.from }} {{ t.to }}
            {{ pagination.to }} {{ t.of }} {{ pagination.total }}
          </div>
          <div class="flex gap-2">
            <button
              @click="changePage(pagination.currentPage - 1)"
              :disabled="pagination.currentPage === 1"
              class="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm transition-colors"
            >
              {{ t.previous }}
            </button>
            <button
              @click="changePage(pagination.currentPage + 1)"
              :disabled="pagination.currentPage === pagination.lastPage"
              class="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm transition-colors"
            >
              {{ t.next }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <div v-if="showDeleteModal" class="fixed inset-0 z-50 overflow-y-auto">
        <div
          class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0"
        >
          <div
            class="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
            @click="showDeleteModal = false"
          ></div>

          <div
            class="inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-2xl shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full p-6"
          >
            <div class="sm:flex sm:items-start">
              <div
                class="flex items-center justify-center flex-shrink-0 w-12 h-12 mx-auto bg-red-100 rounded-full sm:mx-0 sm:h-10 sm:w-10"
              >
                <svg
                  class="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 class="text-lg font-medium leading-6 text-gray-900">
                  {{ t.confirmDelete }}
                </h3>
                <div class="mt-2">
                  <p class="text-sm text-gray-500">
                    {{
                      t.confirmDeleteMessage.replace(
                        "{count}",
                        selectedRequests.length
                      )
                    }}
                  </p>
                </div>
              </div>
            </div>
            <div class="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
              <button
                @click="bulkDelete"
                :disabled="deletingBulk"
                class="inline-flex justify-center w-full px-4 py-2 text-base font-medium text-white bg-red-600 border border-transparent rounded-lg shadow-sm hover:bg-red-700 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {{ deletingBulk ? t.deleting : t.yesDelete }}
              </button>
              <button
                @click="showDeleteModal = false"
                :disabled="deletingBulk"
                class="inline-flex justify-center w-full px-4 py-2 mt-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {{ t.cancel }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Merge Confirmation Modal -->
    <Teleport to="body">
      <div v-if="showMergeModal" class="fixed inset-0 z-50 overflow-y-auto">
        <div
          class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0"
        >
          <div
            class="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
            @click="showMergeModal = false"
          ></div>

          <div
            class="inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-2xl shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full p-6"
          >
            <div class="sm:flex sm:items-start">
              <div
                class="flex items-center justify-center flex-shrink-0 w-12 h-12 mx-auto bg-amber-100 rounded-full sm:mx-0 sm:h-10 sm:w-10"
              >
                <svg
                  class="w-6 h-6 text-amber-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                <h3 class="text-lg font-medium leading-6 text-gray-900">
                  {{ t.confirmMerge }}
                </h3>
                <div class="mt-3">
                  <!-- Selected requests list -->
                  <div class="max-h-48 overflow-y-auto space-y-2 mb-3">
                    <div
                      v-for="req in requests.filter((r) =>
                        selectedRequests.includes(r.id)
                      )"
                      :key="req.id"
                      class="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                    >
                      <div class="flex items-center gap-2">
                        <span class="font-medium text-sm text-gray-900">{{
                          req.request_number
                        }}</span>
                        <span class="text-xs text-gray-500"
                          >({{ req.items?.length || 0 }} items)</span
                        >
                      </div>
                      <span
                        :class="[
                          'px-2 py-0.5 rounded-full text-xs font-medium',
                          getStatusColor(req.status),
                        ]"
                      >
                        {{ getStatusLabel(req.status) }}
                      </span>
                    </div>
                  </div>
                  <p class="text-sm text-gray-500">
                    {{ t.mergeDescription }}
                  </p>
                  <p class="text-sm text-amber-600 mt-2 font-medium">
                    {{ t.mergeWarning }}
                  </p>
                </div>
              </div>
            </div>
            <div class="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
              <button
                @click="mergeRequests"
                :disabled="mergingRequests"
                class="inline-flex justify-center w-full px-4 py-2 text-base font-medium text-white bg-amber-500 border border-transparent rounded-lg shadow-sm hover:bg-amber-600 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {{ mergingRequests ? t.merging : t.yesMerge }}
              </button>
              <button
                @click="showMergeModal = false"
                :disabled="mergingRequests"
                class="inline-flex justify-center w-full px-4 py-2 mt-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {{ t.cancel }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Bulk Status Confirmation Modal -->
    <Teleport to="body">
      <div v-if="showBulkStatusModal" class="fixed inset-0 z-50 overflow-y-auto">
        <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div class="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" @click="cancelBulkStatus"></div>
          <div class="inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-2xl shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full p-6">
            <div class="sm:flex sm:items-start">
              <div class="flex items-center justify-center flex-shrink-0 w-12 h-12 mx-auto bg-primary-100 rounded-full sm:mx-0 sm:h-10 sm:w-10">
                <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                </svg>
              </div>
              <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 class="text-lg font-medium leading-6 text-gray-900">{{ t.confirmBulkStatus }}</h3>
                <p class="mt-2 text-sm text-gray-500">
                  {{ t.confirmBulkStatusMessage
                      .replace('{count}', selectedRequests.length)
                      .replace('{status}', statusLabel(bulkStatusTarget)) }}
                </p>
                <p v-if="bulkStatusTarget === 'purchased'" class="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  {{ t.purchasedNote }}
                </p>
              </div>
            </div>
            <div class="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
              <button
                @click="bulkUpdateStatus"
                :disabled="updatingBulkStatus"
                class="inline-flex justify-center w-full px-4 py-2 text-base font-medium text-white bg-primary-600 border border-transparent rounded-lg shadow-sm hover:bg-primary-700 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {{ updatingBulkStatus ? t.updating : t.yesUpdate }}
              </button>
              <button
                @click="cancelBulkStatus"
                :disabled="updatingBulkStatus"
                class="inline-flex justify-center w-full px-4 py-2 mt-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {{ t.cancel }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>

<script setup>
import { ref, onMounted, watch, computed } from "vue";

definePageMeta({
  layout: "admin",
  middleware: ["auth", "admin"],
});

const { $customFetch, $toast } = useNuxtApp();
const { t: createTranslations } = useLanguage();
const router = useRouter();

const translations = {
  purchaseRequests: { es: "Solicitudes de Compra", en: "Purchase Requests" },
  searchPlaceholder: {
    es: "Buscar por #, cliente...",
    en: "Search by #, customer...",
  },
  allStatuses: { es: "Todos los estados", en: "All Statuses" },
  loading: { es: "Cargando...", en: "Loading..." },
  noRequests: { es: "No se encontraron solicitudes", en: "No requests found" },
  noRequestsDesc: {
    es: "Intenta con otros filtros.",
    en: "Try different filters.",
  },
  request: { es: "Solicitud", en: "Request" },
  customer: { es: "Cliente", en: "Customer" },
  status: { es: "Estado", en: "Status" },
  items: { es: "Artículos", en: "Items" },
  date: { es: "Fecha", en: "Date" },
  actions: { es: "Acciones", en: "Actions" },
  showing: { es: "Mostrando", en: "Showing" },
  to: { es: "a", en: "to" },
  of: { es: "de", en: "of" },
  previous: { es: "Anterior", en: "Previous" },
  next: { es: "Siguiente", en: "Next" },
  selected: { es: "seleccionado(s)", en: "selected" },
  clearSelection: { es: "Limpiar selección", en: "Clear selection" },
  deleteSelected: { es: "Eliminar seleccionadas", en: "Delete selected" },
  deleting: { es: "Eliminando...", en: "Deleting..." },
  confirmDelete: { es: "¿Eliminar solicitudes?", en: "Delete requests?" },
  confirmDeleteMessage: {
    es: "¿Estás seguro de eliminar {count} solicitud(es)? Esta acción no se puede deshacer.",
    en: "Are you sure you want to delete {count} request(s)? This action cannot be undone.",
  },
  yesDelete: { es: "Sí, eliminar", en: "Yes, delete" },
  cancel: { es: "Cancelar", en: "Cancel" },
  // Merge
  mergeRequests: { es: "Unir Solicitudes", en: "Merge Requests" },
  merging: { es: "Uniendo...", en: "Merging..." },
  confirmMerge: { es: "¿Unir estas solicitudes?", en: "Merge these requests?" },
  mergeDescription: { es: "Todos los artículos de las solicitudes seleccionadas se moverán a una sola solicitud. Las otras solicitudes serán eliminadas.", en: "All items from selected requests will be moved to a single request. Other requests will be deleted." },
  mergeWarning: { es: "La solicitud con el estado más avanzado será la que se mantenga.", en: "The request with the furthest status will be kept." },
  yesMerge: { es: "Sí, unir", en: "Yes, merge" },
  mergeSuccess: { es: "Solicitudes unidas exitosamente", en: "Requests merged successfully" },
  mergeError: { es: "Error al unir solicitudes", en: "Error merging requests" },
  differentUsers: { es: "Las solicitudes seleccionadas deben pertenecer al mismo usuario", en: "Selected requests must belong to the same user" },
  // Statuses
  pendingReview: { es: "Pendiente Revisión", en: "Pending Review" },
  quoted: { es: "Cotizado", en: "Quoted" },
  paid: { es: "Pagado", en: "Paid" },
  purchased: { es: "Comprado", en: "Purchased" },
  rejected: { es: "Rechazado", en: "Rejected" },
  cancelled: { es: "Cancelado", en: "Cancelled" },
  // Bulk status update
  bulkSetStatus: { es: "Cambiar estado…", en: "Change status…" },
  updating: { es: "Actualizando…", en: "Updating…" },
  confirmBulkStatus: { es: "¿Actualizar estado?", en: "Update status?" },
  confirmBulkStatusMessage: {
    es: "Cambiar el estado de {count} solicitud(es) a \"{status}\".",
    en: "Change status of {count} request(s) to \"{status}\".",
  },
  yesUpdate: { es: "Sí, actualizar", en: "Yes, update" },
  bulkStatusSuccess: { es: "Estado actualizado", en: "Status updated" },
  bulkStatusError: { es: "Error al actualizar estado", en: "Error updating status" },
  purchasedNote: {
    es: "Solo se procesan las solicitudes en estado 'Pagado'. Por cada una se creará una orden de envío que entrará al flujo del almacén.",
    en: "Only requests in 'Paid' status will be processed. Each one creates a shipping order that enters the warehouse flow.",
  },
};

const t = createTranslations(translations);
const requests = ref([]);
const loading = ref(true);
const searchQuery = ref("");
const statusFilter = ref("");
const searchDebounce = ref(null);
const pagination = ref({
  currentPage: 1,
  lastPage: 1,
  total: 0,
  from: 0,
  to: 0,
});

// Bulk State
const selectedRequests = ref([]);
const showDeleteModal = ref(false);
const deletingBulk = ref(false);
const showMergeModal = ref(false);
const mergingRequests = ref(false);
const showBulkStatusModal = ref(false);
const updatingBulkStatus = ref(false);
const bulkStatusTarget = ref("");

const allSelected = computed(() => {
  return (
    requests.value.length > 0 &&
    selectedRequests.value.length === requests.value.length
  );
});

// Check if selected requests can be merged (same user, 2+ requests)
const canMergeRequests = computed(() => {
  if (selectedRequests.value.length < 2) return false;
  const selectedData = requests.value.filter((r) =>
    selectedRequests.value.includes(r.id)
  );
  const userIds = [...new Set(selectedData.map((r) => r.user_id))];
  return userIds.length === 1;
});

const fetchRequests = async (page = 1) => {
  loading.value = true;
  try {
    const { data } = await $customFetch("/admin/purchase-requests", {
      params: {
        page,
        search: searchQuery.value || undefined,
        status: statusFilter.value || undefined,
      },
    });
    requests.value = data.data;
    pagination.value = {
      currentPage: data.current_page,
      lastPage: data.last_page,
      total: data.total,
      from: data.from,
      to: data.to,
    };
    // Reset selection on page change
    selectedRequests.value = [];
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const changePage = (page) => {
  if (page >= 1 && page <= pagination.value.lastPage) fetchRequests(page);
};

const getStatusColor = (status) => {
  const map = {
    pending_review: "bg-yellow-100 text-yellow-800 border-yellow-200",
    quoted: "bg-blue-100 text-blue-800 border-blue-200",
    paid: "bg-primary-100 text-primary-800 border-primary-200",
    purchased: "bg-green-100 text-green-800 border-green-200",
    rejected: "bg-red-100 text-red-800 border-red-200",
  };
  return map[status] || "bg-gray-100 text-gray-800";
};

const getStatusLabel = (status) => status?.replace("_", " ").toUpperCase();
const formatDate = (date) => new Date(date).toLocaleDateString();
const navigateTo = (path) => router.push(path);

// Bulk Selection Logic
const isSelected = (id) => selectedRequests.value.includes(id);

const toggleSelection = (id) => {
  const idx = selectedRequests.value.indexOf(id);
  if (idx > -1) selectedRequests.value.splice(idx, 1);
  else selectedRequests.value.push(id);
};

const toggleSelectAll = () => {
  if (allSelected.value) selectedRequests.value = [];
  else selectedRequests.value = requests.value.map((r) => r.id);
};

const clearSelection = () => (selectedRequests.value = []);

const confirmBulkDelete = () => {
  if (selectedRequests.value.length > 0) showDeleteModal.value = true;
};

const bulkDelete = async () => {
  deletingBulk.value = true;
  try {
    await $customFetch("/admin/purchase-requests/bulk", {
      method: "DELETE",
      body: { ids: selectedRequests.value },
    });
    $toast.success("Requests deleted successfully");
    showDeleteModal.value = false;
    selectedRequests.value = [];
    fetchRequests(pagination.value.currentPage);
  } catch (e) {
    console.error(e);
    $toast.error("Error deleting requests");
  } finally {
    deletingBulk.value = false;
  }
};

// Merge Requests
const confirmMerge = () => {
  if (!canMergeRequests.value) {
    $toast.error(t.value.differentUsers);
    return;
  }
  showMergeModal.value = true;
};

const mergeRequests = async () => {
  if (selectedRequests.value.length < 2) return;

  if (!canMergeRequests.value) {
    $toast.error(t.value.differentUsers);
    return;
  }

  mergingRequests.value = true;
  try {
    const response = await $customFetch("/admin/purchase-requests/merge", {
      method: "POST",
      body: { request_ids: selectedRequests.value },
    });

    if (response.success) {
      $toast.success(t.value.mergeSuccess);
      selectedRequests.value = [];
      showMergeModal.value = false;
      await fetchRequests(pagination.value.currentPage);
    }
  } catch (e) {
    console.error("Error merging requests:", e);
    $toast.error(e.data?.message || t.value.mergeError);
  } finally {
    mergingRequests.value = false;
  }
};

watch(searchQuery, () => {
  clearTimeout(searchDebounce.value);
  searchDebounce.value = setTimeout(() => {
    fetchRequests(1);
    clearSelection();
  }, 300);
});

watch(statusFilter, () => {
  fetchRequests(1);
  clearSelection();
});

// Bulk status update
const statusLabel = (s) => {
  const map = {
    pending_review: t.value.pendingReview,
    quoted: t.value.quoted,
    paid: t.value.paid,
    purchased: t.value.purchased,
    rejected: t.value.rejected,
    cancelled: t.value.cancelled,
  };
  return map[s] ?? s;
};

const onBulkStatusPick = () => {
  if (!bulkStatusTarget.value || selectedRequests.value.length === 0) return;
  showBulkStatusModal.value = true;
};

const cancelBulkStatus = () => {
  showBulkStatusModal.value = false;
  bulkStatusTarget.value = "";
};

const bulkUpdateStatus = async () => {
  if (!bulkStatusTarget.value || selectedRequests.value.length === 0) return;
  updatingBulkStatus.value = true;
  try {
    const res = await $customFetch("/admin/purchase-requests/bulk-status", {
      method: "PUT",
      body: {
        ids: selectedRequests.value,
        status: bulkStatusTarget.value,
      },
    });
    // The endpoint may report skipped items (e.g. when bulk-marking purchased
    // and some PRs aren't in `paid` state). Surface that in the toast.
    $toast.success(res?.message || t.value.bulkStatusSuccess);
    showBulkStatusModal.value = false;
    bulkStatusTarget.value = "";
    selectedRequests.value = [];
    await fetchRequests(pagination.value.currentPage);
  } catch (e) {
    console.error(e);
    $toast.error(e?.data?.message || t.value.bulkStatusError);
  } finally {
    updatingBulkStatus.value = false;
  }
};

onMounted(() => fetchRequests());
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
