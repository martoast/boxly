<template>
  <!-- Big "we'll get it from any US store" CTA for the shop landing.
       Two actions: primary opens the assisted-purchase request flow,
       secondary opens the Loom tutorial in a new tab so first-time
       visitors can watch how Boxly works before requesting. -->
  <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
    <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-500 to-amber-500 px-6 py-12 sm:px-12 sm:py-16 lg:px-16 lg:py-20 shadow-xl">
      <!-- Decorative blobs — pure background, no interaction -->
      <div class="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/10 blur-3xl pointer-events-none" aria-hidden="true"></div>
      <div class="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none" aria-hidden="true"></div>

      <div class="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 lg:gap-12">
        <div class="max-w-2xl text-white">
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-xs font-semibold uppercase tracking-wider mb-4">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            {{ t.eyebrow }}
          </span>
          <h2 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.05] drop-shadow-sm">
            {{ t.headline }}
          </h2>
          <p class="mt-4 text-base sm:text-lg lg:text-xl text-white/90 leading-relaxed max-w-xl">
            {{ t.subheadline }}
          </p>
        </div>

        <div class="flex flex-col sm:flex-row lg:flex-col gap-3 sm:gap-4 lg:shrink-0">
          <NuxtLink
            to="/shop/request"
            class="inline-flex items-center justify-center gap-2 px-7 py-4 bg-white text-gray-900 font-bold rounded-full shadow-lg hover:shadow-xl hover:bg-gray-100 transition-all text-base"
          >
            {{ t.requestCta }}
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
            </svg>
          </NuxtLink>
          <a
            :href="tutorialUrl"
            target="_blank"
            rel="noopener"
            class="inline-flex items-center justify-center gap-2 px-7 py-4 bg-white/15 backdrop-blur border border-white/30 text-white font-bold rounded-full hover:bg-white/25 transition-colors text-base"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
            {{ t.tutorialCta }}
          </a>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
const { t: createTranslations } = useLanguage()

const tutorialUrl = 'https://www.loom.com/share/839bbe3460e140babb0665c1aa3884ce'

const t = createTranslations({
  eyebrow:     { es: 'Pide cualquier cosa', en: 'Request anything' },
  headline:    { es: '¿No encuentras lo que buscas? Te lo conseguimos.', en: "Can't find it? We'll get it for you." },
  subheadline: { es: 'Mándanos el link de cualquier tienda de USA — Amazon, Shein, Nike, lo que sea — y nosotros lo compramos, lo recibimos en nuestra bodega y te lo enviamos a México.', en: "Send us a link from any US store — Amazon, Shein, Nike, anything — we'll buy it, receive it at our warehouse, and ship it to Mexico." },
  requestCta:  { es: 'Crear solicitud', en: 'Create request' },
  tutorialCta: { es: 'Ver cómo funciona', en: 'See how it works' },
})
</script>
