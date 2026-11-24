<!-- pages/expats.vue -->
<template>
  <div>
    <!-- WhatsApp Button -->
    <WhatsAppButton />
    
    <!-- Hero Section for Expats -->
    <ExpatsHeroSection />

    <!-- Benefits Section -->
    <ExpatsBenefitsSection />

    <!-- Pain Points Section -->
    <ExpatsPainPointsSection />

    <!-- Use Cases Section -->
    <ExpatsUseCasesSection />

    <!-- Testimonials Section -->
    <ExpatsTestimonialsSection />

    <!-- Calculator Section (shared component) -->
    <BoxCalculator />

    <!-- FAQ Section -->
    <ExpatsFAQSection />

    <!-- CTA Section -->
    <ExpatsCTASection />

    <!-- Footer (shared component) -->
    <FooterSection />
    
  </div>
</template>

<script setup>
// Import Expat-specific components
import ExpatsHeroSection from '~/components/Landing/Expats/HeroSection.vue'
import ExpatsPainPointsSection from '~/components/Landing/Expats/PainPointsSection.vue'
import ExpatsBenefitsSection from '~/components/Landing/Expats/BenefitsSection.vue'
import ExpatsUseCasesSection from '~/components/Landing/Expats/UseCasesSection.vue'
import ExpatsTestimonialsSection from '~/components/Landing/Expats/TestimonialsSection.vue'
import ExpatsFAQSection from '~/components/Landing/Expats/FAQSection.vue'
import ExpatsCTASection from '~/components/Landing/Expats/CTASection.vue'
import FooterSection from '~/components/Landing/FooterSection.vue'

// Define page meta to use default layout
definePageMeta({
  layout: 'default'
})

// SEO Meta for Expats page
useSeoMeta({
  title: 'Para Expatriados - Boxly | Compra en USA desde México',
  ogTitle: 'Para Expatriados - Boxly | Compra en USA desde México',
  description: 'Servicio especializado para expatriados en México. Accede a productos de tu país de origen, compra en tiendas internacionales y recibe todo en tu domicilio en México.',
  ogDescription: 'Servicio especializado para expatriados en México. Accede a productos de tu país de origen, compra en tiendas internacionales y recibe todo en tu domicilio en México.',
  ogImage: 'https://boxly.mx/og-image.png',
  twitterCard: 'summary_large_image',
})
</script>