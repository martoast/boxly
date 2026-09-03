<template>
  <!-- Remote store browser — pick a store card; there is no URL input anywhere.
       The cards are the engine's catalog (GET /live-shopping/stores): the only
       places a live session can open. -->
  <div class="max-w-5xl mx-auto px-4 py-8">
    <h1 class="text-2xl font-semibold text-gray-900">Tiendas en vivo</h1>
    <p class="mt-1 text-sm text-gray-500">Abre la tienda en un navegador seguro y agrega lo que te guste a tu carrito de Boxly.</p>

    <div v-if="pending" class="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4" aria-busy="true">
      <div v-for="n in 6" :key="n" class="h-32 rounded-2xl bg-gray-100 animate-pulse" />
    </div>
    <div v-else-if="error" role="alert" class="mt-8 border border-red-200 bg-red-50 text-red-700 rounded-xl px-4 py-3 text-sm">
      Las tiendas en vivo no están disponibles en este momento. Intenta de nuevo en un rato.
    </div>
    <div v-else class="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      <NuxtLink
        v-for="s in stores" :key="s.id" :to="`/app/browse/${s.id}`"
        class="group flex flex-col items-center justify-center gap-3 h-32 rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md hover:border-primary-300 transition focus:outline-none focus:ring-2 focus:ring-primary-400"
        :aria-label="`Abrir ${s.name} en vivo`"
      >
        <img v-if="s.image" :src="s.image" alt="" width="40" height="40" class="w-10 h-10 rounded-lg object-contain" @error="s.image = null" />
        <span v-else aria-hidden="true" class="w-10 h-10 rounded-lg bg-primary-50 text-primary-700 font-semibold flex items-center justify-center">{{ s.name.slice(0, 1) }}</span>
        <span class="text-sm font-medium text-gray-800 group-hover:text-primary-700">{{ s.name }}</span>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeCardImage } from '../../../utils/liveBrowse'
definePageMeta({ layout: 'app', middleware: ['auth', 'customer', 'complete-profile'] })
useHead({ title: 'Boxly — Tiendas en vivo' })

const { $customFetch } = useNuxtApp() as any
const STORE_ID_RE = /^[a-z0-9][a-z0-9_-]{0,39}$/
const { data: stores, pending, error } = await useAsyncData('live-stores', async () => {
  const r: any = await $customFetch('/live-shopping/stores')
  // The API serves the catalog as a list of {id, name, url?} (url only when
  // the engine gave an https storefront). Anything malformed is skipped.
  const raw = Array.isArray(r?.stores) ? r.stores : []
  const list: Array<{ id: string; name: string; image: string | null }> = []
  for (const v of raw) {
    if (!v || typeof v.id !== 'string' || !STORE_ID_RE.test(v.id) || typeof v.name !== 'string') continue
    list.push({ id: v.id, name: v.name, image: typeof v.url === 'string' ? storeCardImage(v.url) : null })
  }
  return list.sort((a, b) => a.name.localeCompare(b.name))
}, { server: false })
</script>
