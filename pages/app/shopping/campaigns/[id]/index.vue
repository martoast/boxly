<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/20">
    <!-- Header -->
    <div class="bg-white/90 backdrop-blur-sm shadow-sm border-b border-gray-100">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div class="flex items-center gap-3">
            <NuxtLink to="/app/shopping/campaigns"
              class="p-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-300">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
            </NuxtLink>
            <div>
              <h1 class="text-xl sm:text-2xl font-extrabold text-gray-900">{{ campaign?.name }}</h1>
              <span v-if="campaign" :class="getStatusBadgeClass(campaign.status)"
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1">
                {{ getStatusLabel(campaign.status) }}
              </span>
            </div>
          </div>

          <!-- Action Buttons -->
          <div v-if="campaign" class="flex gap-2">
            <button @click="showPreviewModal = true"
              class="px-4 py-2.5 bg-white text-gray-700 text-sm font-medium rounded-xl border border-gray-300 hover:bg-gray-50 shadow-sm transition-all duration-300">
              {{ t.previewEmail }}
            </button>
            <template v-if="campaign.status === 'draft'">
              <button @click="showStartModal = true"
                class="px-4 py-2.5 bg-primary-500 text-white text-sm font-medium rounded-xl hover:bg-primary-600 shadow-sm hover:shadow-md transition-all duration-300">
                {{ t.startSending }}
              </button>
              <NuxtLink :to="`/app/shopping/campaigns/${campaign.id}/edit`"
                class="px-4 py-2.5 bg-white text-gray-700 text-sm font-medium rounded-xl border border-gray-300 hover:bg-gray-50 shadow-sm transition-all duration-300">
                {{ t.edit }}
              </NuxtLink>
              <button @click="showDeleteModal = true"
                class="px-4 py-2.5 bg-white text-gray-700 text-sm font-medium rounded-xl border border-gray-300 hover:bg-gray-50 shadow-sm transition-all duration-300">
                {{ t.delete }}
              </button>
            </template>
            <template v-if="campaign.status === 'sending'">
              <button @click="pauseCampaign"
                class="px-4 py-2.5 bg-white text-gray-700 text-sm font-medium rounded-xl border border-gray-300 hover:bg-gray-50 shadow-sm transition-all duration-300">
                {{ t.pause }}
              </button>
            </template>
            <template v-if="campaign.status === 'paused'">
              <button @click="resumeCampaign"
                class="px-4 py-2.5 bg-primary-500 text-white text-sm font-medium rounded-xl hover:bg-primary-600 shadow-sm hover:shadow-md transition-all duration-300">
                {{ t.resume }}
              </button>
              <button @click="showCancelModal = true"
                class="px-4 py-2.5 bg-white text-gray-700 text-sm font-medium rounded-xl border border-gray-300 hover:bg-gray-50 shadow-sm transition-all duration-300">
                {{ t.cancelCampaign }}
              </button>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div class="flex justify-center">
        <div class="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>

    <div v-else class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      <!-- Analytics Cards -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div v-for="stat in statsCards" :key="stat.label" class="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center">
              <component :is="stat.icon" class="w-4 h-4 text-primary-600" />
            </div>
          </div>
          <p class="text-2xl font-bold text-gray-900">{{ stat.value }}</p>
          <p class="text-xs text-gray-500 mt-0.5">{{ stat.label }}</p>
          <p v-if="stat.rate !== undefined" class="text-xs text-primary-600 font-medium">{{ stat.rate }}%</p>
        </div>
      </div>

      <!-- Campaign Info -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div class="px-5 py-4 border-b border-gray-100">
          <h2 class="text-base font-semibold text-gray-900">{{ t.campaignInfo }}</h2>
        </div>
        <div class="p-5">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <div class="space-y-4">
              <div>
                <p class="text-xs font-medium text-gray-500 uppercase tracking-wider">{{ t.subject }}</p>
                <p class="text-sm text-gray-900 mt-1">{{ campaign?.subject }}</p>
              </div>
              <div>
                <p class="text-xs font-medium text-gray-500 uppercase tracking-wider">{{ t.audience }}</p>
                <p class="text-sm text-gray-900 mt-1">{{ getAudienceLabel(campaign?.audience) }}</p>
              </div>
              <div v-if="campaign?.link_url">
                <p class="text-xs font-medium text-gray-500 uppercase tracking-wider">{{ t.link }}</p>
                <a :href="campaign.link_url" target="_blank" class="text-sm text-primary-600 hover:text-primary-700 break-all mt-1 inline-block">
                  {{ campaign.link_text || campaign.link_url }}
                </a>
              </div>
              <div>
                <p class="text-xs font-medium text-gray-500 uppercase tracking-wider">{{ t.batchConfig }}</p>
                <p class="text-sm text-gray-900 mt-1">
                  {{ campaign?.batch_size }} {{ t.emailsPer }} {{ campaign?.batch_delay_seconds }}s
                </p>
              </div>
            </div>
            <div class="space-y-4">
              <div>
                <p class="text-xs font-medium text-gray-500 uppercase tracking-wider">{{ t.createdBy }}</p>
                <p class="text-sm text-gray-900 mt-1">{{ campaign?.creator?.name || '-' }}</p>
              </div>
              <div>
                <p class="text-xs font-medium text-gray-500 uppercase tracking-wider">{{ t.createdAt }}</p>
                <p class="text-sm text-gray-900 mt-1">{{ formatDate(campaign?.created_at) }}</p>
              </div>
              <div v-if="campaign?.started_at">
                <p class="text-xs font-medium text-gray-500 uppercase tracking-wider">{{ t.startedAt }}</p>
                <p class="text-sm text-gray-900 mt-1">{{ formatDate(campaign.started_at) }}</p>
              </div>
              <div v-if="campaign?.completed_at">
                <p class="text-xs font-medium text-gray-500 uppercase tracking-wider">{{ t.completedAt }}</p>
                <p class="text-sm text-gray-900 mt-1">{{ formatDate(campaign.completed_at) }}</p>
              </div>
            </div>
          </div>

          <!-- Body preview -->
          <div class="mt-5 pt-5 border-t border-gray-100">
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">{{ t.body }}</p>
            <div class="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-xl p-4 border border-gray-100">{{ campaign?.body }}</div>
          </div>
        </div>
      </div>

      <!-- Audience Preview -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <h2 class="text-base font-semibold text-gray-900">{{ t.audiencePreview }}</h2>
            <span class="text-xs font-medium text-primary-600 bg-primary-50 px-2.5 py-1 rounded-full">
              {{ getAudienceLabel(campaign?.audience) }}
            </span>
          </div>
          <span class="text-sm text-gray-500">{{ audiencePagination.total }} {{ t.recipientsLabel }}</span>
        </div>

        <div v-if="audienceLoading" class="p-12 text-center">
          <div class="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>

        <div v-else-if="audienceUsers.length === 0" class="p-12 text-center">
          <div class="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <UsersIcon class="w-6 h-6 text-gray-400" />
          </div>
          <p class="text-sm text-gray-500">{{ t.noUsersInAudience }}</p>
        </div>

        <template v-else>
          <!-- Mobile -->
          <div class="sm:hidden divide-y divide-gray-100">
            <div v-for="u in audienceUsers" :key="u.id" class="px-5 py-3 flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-900">{{ u.name || '-' }}</p>
                <p class="text-xs text-gray-500">{{ u.email }}</p>
              </div>
              <span :class="getDeliveryStatusClass(u.recipient_status)" class="text-xs px-2 py-0.5 rounded-full font-medium">
                {{ getDeliveryStatusLabel(u.recipient_status) }}
              </span>
            </div>
          </div>

          <!-- Desktop -->
          <div class="hidden sm:block overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50/80">
                <tr>
                  <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{{ t.name }}</th>
                  <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{{ t.email }}</th>
                  <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{{ t.deliveryStatus }}</th>
                  <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{{ t.joined }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="u in audienceUsers" :key="u.id" class="hover:bg-gray-50/50 transition-colors">
                  <td class="px-5 py-3.5 whitespace-nowrap text-sm text-gray-900">{{ u.name || '-' }}</td>
                  <td class="px-5 py-3.5 whitespace-nowrap text-sm text-gray-500">{{ u.email }}</td>
                  <td class="px-5 py-3.5 whitespace-nowrap">
                    <span :class="getDeliveryStatusClass(u.recipient_status)" class="text-xs px-2.5 py-1 rounded-full font-medium">
                      {{ getDeliveryStatusLabel(u.recipient_status) }}
                    </span>
                  </td>
                  <td class="px-5 py-3.5 whitespace-nowrap text-sm text-gray-500">{{ formatDate(u.created_at) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div v-if="audiencePagination.lastPage > 1" class="px-5 py-4 border-t border-gray-100">
            <div class="flex items-center justify-between">
              <p class="text-sm text-gray-500">
                {{ audiencePagination.from }}-{{ audiencePagination.to }} {{ t.of }} {{ audiencePagination.total }}
              </p>
              <div class="flex gap-2">
                <button @click="changeAudiencePage(audiencePagination.currentPage - 1)"
                  :disabled="audiencePagination.currentPage === 1"
                  class="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                  {{ t.previous }}
                </button>
                <button @click="changeAudiencePage(audiencePagination.currentPage + 1)"
                  :disabled="audiencePagination.currentPage === audiencePagination.lastPage"
                  class="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                  {{ t.next }}
                </button>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- Recipients Table (sent/sending campaigns) -->
      <div v-if="campaign?.status !== 'draft'" class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 class="text-base font-semibold text-gray-900">{{ t.recipients }}</h2>
          <span class="text-sm text-gray-500">{{ recipientPagination.total }} {{ t.totalLabel }}</span>
        </div>

        <div v-if="recipientsLoading" class="p-12 text-center">
          <div class="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>

        <div v-else-if="recipients.length === 0" class="p-12 text-center">
          <div class="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <UsersIcon class="w-6 h-6 text-gray-400" />
          </div>
          <p class="text-sm text-gray-500">{{ t.noRecipients }}</p>
        </div>

        <template v-else>
          <!-- Mobile Cards -->
          <div class="sm:hidden divide-y divide-gray-100">
            <div v-for="r in recipients" :key="r.id" class="p-4">
              <div class="flex items-center justify-between mb-2">
                <p class="font-medium text-gray-900 text-sm">{{ r.email }}</p>
                <span :class="getRecipientStatusClass(r.status)" class="text-xs px-2 py-0.5 rounded-full font-medium">
                  {{ getRecipientStatusLabel(r.status) }}
                </span>
              </div>
              <div class="flex flex-wrap gap-3 text-xs text-gray-500">
                <span v-if="r.sent_at">{{ t.sent }}: {{ formatDate(r.sent_at) }}</span>
                <span v-if="r.opened_at">{{ t.opened }}: {{ formatDate(r.opened_at) }}</span>
                <span v-if="r.clicked_at">{{ t.clicked }}: {{ formatDate(r.clicked_at) }}</span>
              </div>
            </div>
          </div>

          <!-- Desktop Table -->
          <div class="hidden sm:block overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50/80">
                <tr>
                  <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{{ t.email }}</th>
                  <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{{ t.status }}</th>
                  <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{{ t.sentAt }}</th>
                  <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{{ t.openedAt }}</th>
                  <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{{ t.clickedAt }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="r in recipients" :key="r.id" class="hover:bg-gray-50/50 transition-colors">
                  <td class="px-5 py-3.5 whitespace-nowrap text-sm text-gray-900">{{ r.email }}</td>
                  <td class="px-5 py-3.5 whitespace-nowrap">
                    <span :class="getRecipientStatusClass(r.status)" class="text-xs px-2.5 py-1 rounded-full font-medium">
                      {{ getRecipientStatusLabel(r.status) }}
                    </span>
                  </td>
                  <td class="px-5 py-3.5 whitespace-nowrap text-sm text-gray-500">{{ r.sent_at ? formatDate(r.sent_at) : '-' }}</td>
                  <td class="px-5 py-3.5 whitespace-nowrap text-sm text-gray-500">{{ r.opened_at ? formatDate(r.opened_at) : '-' }}</td>
                  <td class="px-5 py-3.5 whitespace-nowrap text-sm text-gray-500">{{ r.clicked_at ? formatDate(r.clicked_at) : '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div v-if="recipientPagination.lastPage > 1" class="px-5 py-4 border-t border-gray-100">
            <div class="flex items-center justify-between">
              <p class="text-sm text-gray-500">
                {{ recipientPagination.from }}-{{ recipientPagination.to }} {{ t.of }} {{ recipientPagination.total }}
              </p>
              <div class="flex gap-2">
                <button @click="changeRecipientPage(recipientPagination.currentPage - 1)"
                  :disabled="recipientPagination.currentPage === 1"
                  class="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                  {{ t.previous }}
                </button>
                <button @click="changeRecipientPage(recipientPagination.currentPage + 1)"
                  :disabled="recipientPagination.currentPage === recipientPagination.lastPage"
                  class="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                  {{ t.next }}
                </button>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Start Modal -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition ease-out duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition ease-in duration-150"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0">
        <div v-if="showStartModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" @click.self="showStartModal = false">
          <div class="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-2">{{ t.confirmStart }}</h3>
            <p class="text-sm text-gray-600 mb-6">{{ t.confirmStartMessage }}</p>
            <div class="flex gap-3">
              <button @click="showStartModal = false"
                class="flex-1 px-4 py-2.5 bg-white text-gray-700 text-sm font-medium rounded-xl border border-gray-300 hover:bg-gray-50 transition-all duration-300">
                {{ t.cancel }}
              </button>
              <button @click="startCampaign" :disabled="actionLoading"
                class="flex-1 px-4 py-2.5 bg-primary-500 text-white text-sm font-medium rounded-xl hover:bg-primary-600 disabled:opacity-50 shadow-sm hover:shadow-md transition-all duration-300">
                {{ actionLoading ? t.processing : t.startSending }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Cancel Modal -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition ease-out duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition ease-in duration-150"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0">
        <div v-if="showCancelModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" @click.self="showCancelModal = false">
          <div class="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-2">{{ t.confirmCancel }}</h3>
            <p class="text-sm text-gray-600 mb-6">{{ t.confirmCancelMessage }}</p>
            <div class="flex gap-3">
              <button @click="showCancelModal = false"
                class="flex-1 px-4 py-2.5 bg-white text-gray-700 text-sm font-medium rounded-xl border border-gray-300 hover:bg-gray-50 transition-all duration-300">
                {{ t.goBack }}
              </button>
              <button @click="cancelCampaign" :disabled="actionLoading"
                class="flex-1 px-4 py-2.5 bg-red-500 text-white text-sm font-medium rounded-xl hover:bg-red-600 disabled:opacity-50 shadow-sm hover:shadow-md transition-all duration-300">
                {{ actionLoading ? t.processing : t.confirmCancelAction }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Delete Modal -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition ease-out duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition ease-in duration-150"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0">
        <div v-if="showDeleteModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" @click.self="showDeleteModal = false">
          <div class="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-2">{{ t.confirmDelete }}</h3>
            <p class="text-sm text-gray-600 mb-6">{{ t.confirmDeleteMessage }}</p>
            <div class="flex gap-3">
              <button @click="showDeleteModal = false"
                class="flex-1 px-4 py-2.5 bg-white text-gray-700 text-sm font-medium rounded-xl border border-gray-300 hover:bg-gray-50 transition-all duration-300">
                {{ t.cancel }}
              </button>
              <button @click="deleteCampaign" :disabled="actionLoading"
                class="flex-1 px-4 py-2.5 bg-red-500 text-white text-sm font-medium rounded-xl hover:bg-red-600 disabled:opacity-50 shadow-sm hover:shadow-md transition-all duration-300">
                {{ actionLoading ? t.processing : t.delete }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Preview Email Modal -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition ease-out duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition ease-in duration-150"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0">
        <div v-if="showPreviewModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" @click.self="showPreviewModal = false">
          <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <!-- Modal header -->
            <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h3 class="text-base font-semibold text-gray-900">{{ t.previewEmail }}</h3>
                <p class="text-xs text-gray-500 mt-0.5">{{ t.previewSubtitle }}</p>
              </div>
              <button @click="showPreviewModal = false"
                class="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <XMarkIcon class="w-5 h-5" />
              </button>
            </div>

            <!-- Email metadata bar -->
            <div class="px-5 py-3 bg-gray-50 border-b border-gray-100 text-xs text-gray-500 space-y-1">
              <div class="flex gap-2">
                <span class="font-medium text-gray-700">{{ t.from }}:</span>
                <span>Boxly &lt;contact@boxly.mx&gt;</span>
              </div>
              <div class="flex gap-2">
                <span class="font-medium text-gray-700">{{ t.subject }}:</span>
                <span class="text-gray-900">{{ campaign?.subject }}</span>
              </div>
            </div>

            <!-- Email preview iframe -->
            <div class="flex-1 overflow-y-auto bg-gray-100 p-4 sm:p-6">
              <div class="bg-white rounded-lg shadow-sm mx-auto" style="max-width: 600px;">
                <iframe
                  ref="previewIframe"
                  :srcdoc="emailPreviewHtml"
                  class="w-full border-0"
                  style="min-height: 400px;"
                  @load="resizeIframe"
                  sandbox="allow-same-origin"
                ></iframe>
              </div>
            </div>

            <!-- Modal footer -->
            <div class="px-5 py-4 border-t border-gray-100 flex justify-end">
              <button @click="showPreviewModal = false"
                class="px-4 py-2.5 bg-white text-gray-700 text-sm font-medium rounded-xl border border-gray-300 hover:bg-gray-50 shadow-sm transition-all duration-300">
                {{ t.close }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import {
  UsersIcon,
  EnvelopeIcon,
  EnvelopeOpenIcon,
  CursorArrowRaysIcon,
  ExclamationCircleIcon,
  ClockIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline'

definePageMeta({
  layout: 'shopping',
  middleware: ['auth', 'shopping']
})

const route = useRoute()
const { $customFetch } = useNuxtApp()
const { t: createTranslations } = useLanguage()

const translations = {
  campaignInfo: { es: 'Información de la Campaña', en: 'Campaign Details' },
  subject: { es: 'Asunto', en: 'Subject' },
  audience: { es: 'Audiencia', en: 'Audience' },
  link: { es: 'Enlace', en: 'Link' },
  batchConfig: { es: 'Configuración de envío', en: 'Batch Config' },
  emailsPer: { es: 'emails cada', en: 'emails every' },
  body: { es: 'Cuerpo del email', en: 'Email Body' },
  createdBy: { es: 'Creado por', en: 'Created By' },
  createdAt: { es: 'Fecha de creación', en: 'Created' },
  startedAt: { es: 'Iniciada', en: 'Started' },
  completedAt: { es: 'Completada', en: 'Completed' },
  totalRecipients: { es: 'Total', en: 'Total' },
  sent: { es: 'Enviados', en: 'Sent' },
  opened: { es: 'Abiertos', en: 'Opened' },
  clicked: { es: 'Clics', en: 'Clicked' },
  failed: { es: 'Fallidos', en: 'Failed' },
  pending: { es: 'Pendientes', en: 'Pending' },
  recipients: { es: 'Destinatarios', en: 'Recipients' },
  totalLabel: { es: 'total', en: 'total' },
  audiencePreview: { es: 'Vista Previa de Audiencia', en: 'Audience Preview' },
  recipientsLabel: { es: 'destinatarios', en: 'recipients' },
  noUsersInAudience: { es: 'No hay usuarios en esta audiencia', en: 'No users match this audience' },
  name: { es: 'Nombre', en: 'Name' },
  joined: { es: 'Registro', en: 'Joined' },
  deliveryStatus: { es: 'Envío', en: 'Delivery' },
  notSent: { es: 'No enviado', en: 'Not sent' },
  noRecipients: { es: 'No hay destinatarios aún', en: 'No recipients yet' },
  email: { es: 'Email', en: 'Email' },
  status: { es: 'Estado', en: 'Status' },
  sentAt: { es: 'Enviado', en: 'Sent' },
  openedAt: { es: 'Abierto', en: 'Opened' },
  clickedAt: { es: 'Clic', en: 'Clicked' },
  startSending: { es: 'Iniciar Envío', en: 'Start Sending' },
  edit: { es: 'Editar', en: 'Edit' },
  delete: { es: 'Eliminar', en: 'Delete' },
  pause: { es: 'Pausar', en: 'Pause' },
  resume: { es: 'Reanudar', en: 'Resume' },
  cancelCampaign: { es: 'Cancelar Campaña', en: 'Cancel Campaign' },
  cancel: { es: 'Cancelar', en: 'Cancel' },
  goBack: { es: 'Volver', en: 'Go Back' },
  processing: { es: 'Procesando...', en: 'Processing...' },
  confirmStart: { es: 'Iniciar campaña', en: 'Start Campaign' },
  confirmStartMessage: { es: '¿Estás seguro de que quieres iniciar el envío de esta campaña? Se enviará a todos los destinatarios de la audiencia seleccionada.', en: 'Are you sure you want to start sending this campaign? It will be sent to all recipients in the selected audience.' },
  confirmCancel: { es: 'Cancelar campaña', en: 'Cancel Campaign' },
  confirmCancelMessage: { es: '¿Estás seguro de que quieres cancelar esta campaña? Los emails pendientes no se enviarán.', en: 'Are you sure you want to cancel this campaign? Pending emails will not be sent.' },
  confirmCancelAction: { es: 'Sí, cancelar', en: 'Yes, Cancel' },
  confirmDelete: { es: 'Eliminar campaña', en: 'Delete Campaign' },
  confirmDeleteMessage: { es: '¿Estás seguro de que quieres eliminar esta campaña? Esta acción no se puede deshacer.', en: 'Are you sure you want to delete this campaign? This action cannot be undone.' },
  previewEmail: { es: 'Vista Previa', en: 'Preview Email' },
  previewSubtitle: { es: 'Así se verá el email para los destinatarios', en: 'This is how the email will look to recipients' },
  from: { es: 'De', en: 'From' },
  close: { es: 'Cerrar', en: 'Close' },
  of: { es: 'de', en: 'of' },
  previous: { es: 'Anterior', en: 'Previous' },
  next: { es: 'Siguiente', en: 'Next' },
  statusDraft: { es: 'Borrador', en: 'Draft' },
  statusSending: { es: 'Enviando', en: 'Sending' },
  statusPaused: { es: 'Pausada', en: 'Paused' },
  statusCompleted: { es: 'Completada', en: 'Completed' },
  statusCancelled: { es: 'Cancelada', en: 'Cancelled' },
  statusPendingRecipient: { es: 'Pendiente', en: 'Pending' },
  statusSentRecipient: { es: 'Enviado', en: 'Sent' },
  statusFailedRecipient: { es: 'Fallido', en: 'Failed' },
  audienceAll: { es: 'Todos', en: 'All' },
  audienceHasOrders: { es: 'Con órdenes', en: 'Has Orders' },
  audienceNoOrders: { es: 'Sin órdenes', en: 'No Orders' },
  audienceActiveOrders: { es: 'Órdenes activas', en: 'Active Orders' },
  audienceExpat: { es: 'Expat', en: 'Expat' },
  audienceBusiness: { es: 'Business', en: 'Business' },
  audienceShopper: { es: 'Shopper', en: 'Shopper' },
}

const t = createTranslations(translations)

const campaign = ref(null)
const loading = ref(true)
const actionLoading = ref(false)
const recipients = ref([])
const recipientsLoading = ref(false)
const showStartModal = ref(false)
const showCancelModal = ref(false)
const showDeleteModal = ref(false)
const showPreviewModal = ref(false)
const previewIframe = ref(null)
const recipientPagination = ref({
  currentPage: 1, lastPage: 1, from: 0, to: 0, total: 0
})
const audienceUsers = ref([])
const audienceLoading = ref(false)
const audiencePagination = ref({
  currentPage: 1, lastPage: 1, from: 0, to: 0, total: 0
})

const pendingCount = computed(() => campaign.value?.pending_count || 0)
const failedCount = computed(() => campaign.value?.failed_count || 0)

const statsCards = computed(() => [
  { label: t.value.totalRecipients, value: campaign.value?.total_recipients || 0, icon: UsersIcon },
  { label: t.value.sent, value: campaign.value?.sent_count || 0, icon: EnvelopeIcon },
  { label: t.value.opened, value: campaign.value?.opened_count || 0, icon: EnvelopeOpenIcon, rate: campaign.value?.open_rate || 0 },
  { label: t.value.clicked, value: campaign.value?.clicked_count || 0, icon: CursorArrowRaysIcon, rate: campaign.value?.click_rate || 0 },
  { label: t.value.failed, value: failedCount.value, icon: ExclamationCircleIcon },
  { label: t.value.pending, value: pendingCount.value, icon: ClockIcon },
])

const emailPreviewHtml = computed(() => {
  if (!campaign.value) return ''
  const body = campaign.value.body
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color: #2E6BB7; text-decoration: underline;">$1</a>')
    .replace(/\n/g, '<br>')
  const linkHtml = campaign.value.link_url
    ? `<div style="text-align: center; margin: 30px 0;">
        <a href="#" onclick="return false" style="display: inline-block; padding: 12px 28px; background-color: #2E6BB7; color: white; text-decoration: none; font-weight: 500; border-radius: 4px;">
          ${(campaign.value.link_text || 'Learn More').replace(/</g, '&lt;').replace(/>/g, '&gt;')}
        </a>
      </div>`
    : ''
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #ffffff; }
  .container { padding: 20px; }
  .content { margin-bottom: 30px; }
  p { margin-bottom: 16px; color: #333; }
  .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 14px; color: #666; }
  .footer a { color: #2E6BB7; text-decoration: none; }
</style>
</head>
<body>
  <div class="container">
    <div class="content">
      ${body}
      ${linkHtml}
    </div>
    <div class="footer">
      <p>¿Tienes preguntas? Contáctanos:</p>
      <p><a href="mailto:contact@boxly.mx">contact@boxly.mx</a> · <a href="https://wa.me/16195591910">WhatsApp</a> · <a href="tel:+16195591910">+1 (619) 559-1910</a></p>
      <p style="font-size: 12px;">&copy; ${new Date().getFullYear()} Boxly. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>`
})

const resizeIframe = () => {
  const iframe = previewIframe.value
  if (iframe?.contentDocument?.body) {
    iframe.style.height = iframe.contentDocument.body.scrollHeight + 20 + 'px'
  }
}

const getStatusBadgeClass = (status) => {
  const classes = {
    draft: 'bg-gray-100 text-gray-700',
    sending: 'bg-primary-50 text-primary-700',
    paused: 'bg-yellow-50 text-yellow-700',
    completed: 'bg-green-50 text-green-700',
    cancelled: 'bg-red-50 text-red-700',
  }
  return classes[status] || 'bg-gray-100 text-gray-700'
}

const getStatusLabel = (status) => {
  const labels = {
    draft: t.value.statusDraft,
    sending: t.value.statusSending,
    paused: t.value.statusPaused,
    completed: t.value.statusCompleted,
    cancelled: t.value.statusCancelled,
  }
  return labels[status] || status
}

const getAudienceLabel = (audience) => {
  const labels = {
    all: t.value.audienceAll,
    has_orders: t.value.audienceHasOrders,
    no_orders: t.value.audienceNoOrders,
    active_orders: t.value.audienceActiveOrders,
    expat: t.value.audienceExpat,
    business: t.value.audienceBusiness,
    shopper: t.value.audienceShopper,
  }
  return labels[audience] || audience
}

const getDeliveryStatusClass = (status) => {
  const classes = {
    pending: 'bg-yellow-50 text-yellow-700',
    sent: 'bg-green-50 text-green-700',
    failed: 'bg-red-50 text-red-700',
  }
  return classes[status] || 'bg-gray-100 text-gray-500'
}

const getDeliveryStatusLabel = (status) => {
  if (!status) return t.value.notSent
  const labels = {
    pending: t.value.statusPendingRecipient,
    sent: t.value.statusSentRecipient,
    failed: t.value.statusFailedRecipient,
  }
  return labels[status] || status
}

const getRecipientStatusClass = (status) => {
  const classes = {
    pending: 'bg-gray-100 text-gray-700',
    sent: 'bg-green-50 text-green-700',
    failed: 'bg-red-50 text-red-700',
  }
  return classes[status] || 'bg-gray-100 text-gray-700'
}

const getRecipientStatusLabel = (status) => {
  const labels = {
    pending: t.value.statusPendingRecipient,
    sent: t.value.statusSentRecipient,
    failed: t.value.statusFailedRecipient,
  }
  return labels[status] || status
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString()
}

const fetchCampaign = async () => {
  loading.value = true
  try {
    const response = await $customFetch(`/shopping/campaigns/${route.params.id}`)
    campaign.value = response.data
  } catch (error) {
    console.error('Error fetching campaign:', error)
  } finally {
    loading.value = false
  }
}

const fetchRecipients = async (page = 1) => {
  recipientsLoading.value = true
  try {
    const response = await $customFetch(`/shopping/campaigns/${route.params.id}/recipients`, {
      params: { page }
    })
    recipients.value = response.data.data
    recipientPagination.value = {
      currentPage: response.data.current_page,
      lastPage: response.data.last_page,
      from: response.data.from || 0,
      to: response.data.to || 0,
      total: response.data.total,
    }
  } catch (error) {
    console.error('Error fetching recipients:', error)
  } finally {
    recipientsLoading.value = false
  }
}

const changeRecipientPage = (page) => {
  if (page >= 1 && page <= recipientPagination.value.lastPage) {
    fetchRecipients(page)
  }
}

const fetchAudiencePreview = async (page = 1) => {
  audienceLoading.value = true
  try {
    const response = await $customFetch(`/shopping/campaigns/${route.params.id}/preview-recipients`, {
      params: { page }
    })
    audienceUsers.value = response.data.data
    audiencePagination.value = {
      currentPage: response.data.current_page,
      lastPage: response.data.last_page,
      from: response.data.from || 0,
      to: response.data.to || 0,
      total: response.data.total,
    }
  } catch (error) {
    console.error('Error fetching audience preview:', error)
  } finally {
    audienceLoading.value = false
  }
}

const changeAudiencePage = (page) => {
  if (page >= 1 && page <= audiencePagination.value.lastPage) {
    fetchAudiencePreview(page)
  }
}

const startCampaign = async () => {
  actionLoading.value = true
  try {
    await $customFetch(`/shopping/campaigns/${route.params.id}/start`, { method: 'POST' })
    showStartModal.value = false
    await fetchCampaign()
    await fetchAudiencePreview()
    await fetchRecipients()
  } catch (error) {
    console.error('Error starting campaign:', error)
  } finally {
    actionLoading.value = false
  }
}

const pauseCampaign = async () => {
  actionLoading.value = true
  try {
    await $customFetch(`/shopping/campaigns/${route.params.id}/pause`, { method: 'POST' })
    await fetchCampaign()
  } catch (error) {
    console.error('Error pausing campaign:', error)
  } finally {
    actionLoading.value = false
  }
}

const resumeCampaign = async () => {
  actionLoading.value = true
  try {
    await $customFetch(`/shopping/campaigns/${route.params.id}/resume`, { method: 'POST' })
    await fetchCampaign()
  } catch (error) {
    console.error('Error resuming campaign:', error)
  } finally {
    actionLoading.value = false
  }
}

const cancelCampaign = async () => {
  actionLoading.value = true
  try {
    await $customFetch(`/shopping/campaigns/${route.params.id}/cancel`, { method: 'POST' })
    showCancelModal.value = false
    await fetchCampaign()
  } catch (error) {
    console.error('Error cancelling campaign:', error)
  } finally {
    actionLoading.value = false
  }
}

const deleteCampaign = async () => {
  actionLoading.value = true
  try {
    await $customFetch(`/shopping/campaigns/${route.params.id}`, { method: 'DELETE' })
    await navigateTo('/app/shopping/campaigns')
  } catch (error) {
    console.error('Error deleting campaign:', error)
  } finally {
    actionLoading.value = false
  }
}

onMounted(async () => {
  await fetchCampaign()
  fetchAudiencePreview()
  if (campaign.value?.status !== 'draft') {
    fetchRecipients()
  }
})
</script>
