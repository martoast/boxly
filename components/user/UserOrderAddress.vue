<!-- components/user/UserOrderAddress.vue -->
<template>
    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div class="px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-900">{{ t.address }}</h2>
        <NuxtLink v-if="canEdit" :to="`/app/orders/${order.id}/edit`" class="text-sm text-primary-600 hover:underline">
          {{ t.edit }}
        </NuxtLink>
      </div>
      <div class="p-4 sm:p-6 text-sm text-gray-700 space-y-3">
        <!-- Full address mode -->
        <div v-if="address.full_address">
          <p class="font-medium text-gray-900 whitespace-pre-line">{{ address.full_address }}</p>
        </div>
        <!-- Individual fields mode -->
        <div v-else-if="hasWrittenAddress">
          <p class="font-medium text-gray-900">{{ address.street }} {{ address.exterior_number }} <span v-if="address.interior_number">Int. {{ address.interior_number }}</span></p>
          <p>{{ address.colonia }}</p>
          <p>{{ address.municipio }}, {{ address.estado }}</p>
          <p>C.P. {{ address.postal_code }}</p>
          <p v-if="address.referencias" class="mt-2 text-gray-500 italic">"{{ address.referencias }}"</p>
        </div>
        <!-- Google Maps location only (no written address) -->
        <div v-else-if="address.google_maps_link">
          <p class="font-medium text-gray-900">{{ t.gmapsLocation }}</p>
          <p class="text-gray-500">{{ t.gmapsLocationHint }}</p>
        </div>
        <!-- Nothing on file -->
        <div v-else>
          <p class="text-gray-400 italic">{{ t.noAddress }}</p>
        </div>

        <!-- Google Maps link — shown whenever the order has one -->
        <a
          v-if="address.google_maps_link"
          :href="address.google_maps_link"
          target="_blank"
          rel="noopener"
          class="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-primary-50 text-primary-700 font-semibold hover:bg-primary-100 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          {{ t.viewOnMaps }}
          <svg class="w-3.5 h-3.5 opacity-70" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
        </a>
      </div>
    </div>
  </template>

  <script setup>
  import { computed } from 'vue'
  const props = defineProps(['order'])
  const address = computed(() => props.order?.delivery_address || {})
  const { t: createTranslations } = useLanguage()

  const canEdit = computed(() => ['collecting', 'awaiting_packages'].includes(props.order?.status))

  // Any written address on file (individual fields) — distinct from a Maps link.
  const hasWrittenAddress = computed(() => {
    const a = address.value
    return !!(a.street || a.colonia || a.municipio || a.estado || a.postal_code)
  })

  const translations = {
    address: { es: "Dirección de Entrega", en: "Delivery Address" },
    edit: { es: "Editar", en: "Edit" },
    viewOnMaps: { es: "Ver ubicación en Google Maps", en: "View location on Google Maps" },
    gmapsLocation: { es: "Tu ubicación de entrega", en: "Your delivery location" },
    gmapsLocationHint: { es: "Compartiste la ubicación exacta con un link de Google Maps.", en: "You shared the exact location with a Google Maps link." },
    noAddress: { es: "Sin dirección registrada.", en: "No address on file." }
  }
  const t = createTranslations(translations)
  </script>