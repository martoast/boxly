<template>
  <ClientOnly>
    <ShoppingAssistant standalone />
    <!-- SSR / pre-hydration fallback. Crawlers and social scrapers that don't
         run JS see this (plus the <head> meta below), so the link is indexable
         and gets a real preview. It mirrors the chat's empty state visually so
         there's no flash when the interactive app hydrates. -->
    <template #fallback>
      <div class="h-[100dvh] flex flex-col items-center justify-center bg-white px-6 text-center">
        <img src="/logo.svg" alt="Boxly" class="h-10 mb-6" />
        <h1 class="text-2xl md:text-3xl font-bold text-gray-900 max-w-xl">
          Compra en cualquier tienda de Estados Unidos y recíbelo en México
        </h1>
        <p class="mt-3 text-gray-500 max-w-md">
          Tu asistente de compras Boxly: busca productos de tiendas de USA, te
          cotizamos el total con envío a México y nosotros lo compramos y lo
          enviamos por ti.
        </p>
        <div class="mt-8 flex items-center gap-2 text-gray-400 text-sm">
          <span class="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
          Cargando tu asistente…
        </div>
      </div>
    </template>
  </ClientOnly>
</template>

<script setup>
// BOXLY Concierge — fully PUBLIC, standalone page at /search (no app navbar).
// Guests can search; an account is only required to place an order (gated inside
// the chat). The signed-in profile + login/logout live in the sidebar's bottom-
// left (ChatGPT-style), not a top nav — this page is heading toward the landing
// page. `auth-soft` populates `user` when a session exists but never redirects.
// `empty` layout = no chrome. [[id]] keeps deep-links from remounting the page.
//
// SSR is ON for /search (see nuxt.config routeRules) so the meta below is in the
// server HTML for share previews + SEO. The interactive chat is <ClientOnly>.
definePageMeta({ layout: 'empty', middleware: ['auth-soft'] })

const title = 'Boxly — Compra en tiendas de Estados Unidos y recíbelo en México'
const description =
  'Tu asistente de compras con IA: busca productos de cualquier tienda de Estados Unidos, te cotizamos el total con envío a México y Boxly lo compra y te lo envía. Sin tarjeta en USA, sin complicaciones.'
const url = 'https://boxly.mx/search'
const image = 'https://boxly.mx/og-search.jpg'

useSeoMeta({
  title,
  description,
  ogType: 'website',
  ogUrl: url,
  ogTitle: title,
  ogDescription: description,
  ogImage: image,
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogImageAlt: 'Boxly — tu asistente de compras de Estados Unidos a México',
  ogSiteName: 'Boxly',
  ogLocale: 'es_MX',
  twitterCard: 'summary_large_image',
  twitterTitle: title,
  twitterDescription: description,
  twitterImage: image,
})

useHead({
  link: [{ rel: 'canonical', href: url }],
})
</script>
