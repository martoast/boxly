<template>
  <ClientOnly>
    <ShoppingAssistant standalone />
    <!-- Pre-hydration fallback: just a spinner, no text. SEO/share crawlers
         rely on the <head> meta below, not on visible body copy. -->
    <template #fallback>
      <div class="h-[100dvh] flex items-center justify-center bg-white">
        <svg class="w-8 h-8 animate-spin text-primary-500" viewBox="0 0 24 24" fill="none" aria-label="Cargando">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    </template>
  </ClientOnly>
</template>

<script setup>
// BOXLY Concierge — standalone page at /search (no app navbar), AUTHENTICATED ONLY.
// The AI search is no longer open to the public: a guest hitting /search (e.g. from
// the landing hero's `?q=...` hand-off) is bounced by `auth` to /login?redirect=…;
// after logging in or registering they return here and the query auto-fires
// (ShoppingAssistant.initLoggedIn → sendInitialQuery reads ?q). The signed-in
// profile + logout live in the sidebar's bottom-left (ChatGPT-style), not a top nav.
// `empty` layout = no chrome. [[id]] keeps deep-links from remounting the page.
//
// SSR is ON for /search (see nuxt.config routeRules) so the meta below is in the
// server HTML for share previews + SEO. The interactive chat is <ClientOnly>.
definePageMeta({ layout: 'empty', middleware: ['auth'] })

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
