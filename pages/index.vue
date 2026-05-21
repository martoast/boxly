<template>
  <div>
    <WhatsAppButton />

    <!-- 1. Hero — positioning + brand statement -->
    <MainHeroSection />

    <!-- 2. Three service lanes — wedge (assisted online), wow (in-person),
            utility (casillero). Anchor for the hero's "see how we help" CTA. -->
    <section id="service-lanes">
      <ServiceLanes />
    </section>

    <!-- 5. Brands showcase — clickable store cards from the Boxly Store catalog -->
    <BrandsRail />

    <!-- 6. Trending in USA — curated product rail (Boxly Store window) -->
    <TrendingRail />

    <!-- 7. Wedge CTA — "send us the link". Sits right after the product
            rail so customers who didn't find what they wanted in the
            catalog land here next: the unlimited-access promise. -->
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
import TrendingRail from '~/components/Landing/Main/TrendingRail.vue'
import BrandsRail from '~/components/Landing/Main/BrandsRail.vue'
import ConciergeSpotlight from '~/components/Landing/Main/ConciergeSpotlight.vue'
import WedgeCTA from '~/components/Landing/Main/WedgeCTA.vue'
import FooterSection from '~/components/Landing/FooterSection.vue'

// BoxPricing is registered globally elsewhere; if not, import it.
// Keeping the existing reference intact.

definePageMeta({
  layout: 'default',
})
</script>
