<template>
  <div>
    <WhatsAppButton />

    <!-- 1. Hero — the proven conversion hero: outlet-shopping photo, brand
            statement, register/login CTAs, store-logo marquee. -->
    <MainHeroSection />

    <!-- 2. Three service lanes — wedge (assisted online), wow (in-person),
            utility (casillero). Anchor for the hero's "see how we help" CTA. -->
    <section id="service-lanes">
      <ServiceLanes />
    </section>

    <!-- AI search — supplementary optional pipeline, promoted here and in the
         navbar; hands off to /search. The hero stays the proven funnel. -->
    <AiSearchPromo />

    <!-- Wedge CTA — "send us the link": the unlimited-access promise. -->
    <WedgeCTA />

    <!-- 8. Concierge spotlight — premium in-person section -->
    <ConciergeSpotlight />

    <!-- 9. Casillero / box pricing — utility info for forwarding users -->
    <BoxPricing />

    <FooterSection />
  </div>
</template>

<script setup>
import WhatsAppButton from '~/components/Landing/WhatsAppButton.vue'
import MainHeroSection from '~/components/Landing/Main/HeroSection.vue'
import ServiceLanes from '~/components/Landing/Main/ServiceLanes.vue'
import AiSearchPromo from '~/components/Landing/Main/AiSearchPromo.vue'
import ConciergeSpotlight from '~/components/Landing/Main/ConciergeSpotlight.vue'
import WedgeCTA from '~/components/Landing/Main/WedgeCTA.vue'
import FooterSection from '~/components/Landing/FooterSection.vue'

// BoxPricing is registered globally elsewhere; if not, import it.
// Keeping the existing reference intact.

definePageMeta({
  layout: 'default',
})
</script>
