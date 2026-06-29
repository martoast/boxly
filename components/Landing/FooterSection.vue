<!-- components/Landing/FooterSection.vue -->
<template>
  <footer class="bg-dark-500 text-white/70 py-8 sm:py-12 px-4 sm:px-5 text-sm sm:text-base border-t border-white/10">
    <div class="max-w-6xl mx-auto">
      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10 text-center mb-8">
        
        <!-- Contact -->
        <div>
          <h4 class="text-white mb-3 sm:mb-4 text-base sm:text-lg font-semibold">{{ t.contact }}</h4>
          <ul class="list-none p-0 m-0 space-y-2">
            <li>
              <a href="mailto:contact@boxly.mx" class="inline-flex items-center gap-2 text-white/70 no-underline hover:text-white transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
                <span class="text-sm sm:text-base break-all">contact@boxly.mx</span>
              </a>
            </li>
            <li>
              <a href="https://wa.me/16195591910" target="_blank" class="inline-flex items-center gap-2 text-white/70 no-underline hover:text-white transition-colors">
                <svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                <span class="text-sm sm:text-base">WhatsApp: +1 (619) 559-1910</span>
              </a>
            </li>
          </ul>
        </div>
        
        <!-- Business Hours -->
        <div>
          <h4 class="text-white mb-3 sm:mb-4 text-base sm:text-lg font-semibold">{{ t.businessHours }}</h4>
          <p class="m-0 leading-relaxed">
            {{ t.hoursWeekdays }}<br>
            {{ t.hoursSaturday }}
          </p>
        </div>
      </div>
      
      <!-- Social Media Section -->
      <div class="py-6 sm:py-8 border-t border-white/10">
        <div class="flex justify-center items-center gap-4 sm:gap-6">
          <!-- Facebook -->
          <a 
            href="https://www.facebook.com/profile.php?id=61577411440239"
            target="_blank"
            rel="noopener noreferrer"
            class="group p-2 rounded-full bg-white/5 hover:bg-white/10 transition-all duration-300"
            :aria-label="t.followOn + ' Facebook'"
          >
            <svg class="w-5 h-5 sm:w-6 sm:h-6 text-white/70 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
              <path fill-rule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clip-rule="evenodd"/>
            </svg>
          </a>
          
          <!-- Instagram -->
          <a 
            href="https://www.instagram.com/official_boxly?igsh=dmcyMW93OWNzODU3&utm_source=qr"
            target="_blank"
            rel="noopener noreferrer"
            class="group p-2 rounded-full bg-white/5 hover:bg-white/10 transition-all duration-300"
            :aria-label="t.followOn + ' Instagram'"
          >
            <svg class="w-5 h-5 sm:w-6 sm:h-6 text-white/70 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
              <path fill-rule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clip-rule="evenodd"/>
            </svg>
          </a>
          
          <!-- TikTok -->
          <a 
            href="https://www.tiktok.com/@official_boxly?_t=ZP-8yEE34krzqR&_r=1"
            target="_blank"
            rel="noopener noreferrer"
            class="group p-2 rounded-full bg-white/5 hover:bg-white/10 transition-all duration-300"
            :aria-label="t.followOn + ' TikTok'"
          >
            <svg class="w-5 h-5 sm:w-6 sm:h-6 text-white/70 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
            </svg>
          </a>
          
          <!-- WhatsApp -->
          <a 
            href="https://wa.me/16195591910"
            target="_blank"
            rel="noopener noreferrer"
            class="group p-2 rounded-full bg-white/5 hover:bg-white/10 transition-all duration-300"
            :aria-label="t.followOn + ' WhatsApp'"
          >
            <svg class="w-5 h-5 sm:w-6 sm:h-6 text-white/70 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
          </a>
        </div>
      </div>
      
      <!-- Legal Links Section -->
      <div class="text-center pt-6 sm:pt-8 border-t border-white/10">
        <div class="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-6 mb-4">
          <NuxtLink to="/precios" class="text-white/70 no-underline hover:text-white transition-colors text-sm sm:text-base">
            {{ t.pricingLink }}
          </NuxtLink>
          <span class="hidden sm:inline text-white/30">|</span>
          <NuxtLink to="/terms-of-service" class="text-white/70 no-underline hover:text-white transition-colors text-sm sm:text-base">
            {{ t.termsLink }}
          </NuxtLink>
          <span class="hidden sm:inline text-white/30">|</span>
          <NuxtLink to="/privacy-policy" class="text-white/70 no-underline hover:text-white transition-colors text-sm sm:text-base">
            {{ t.privacyLink }}
          </NuxtLink>
          <span class="hidden sm:inline text-white/30">|</span>
          <NuxtLink to="/sitemap" class="text-white/70 no-underline hover:text-white transition-colors text-sm sm:text-base">
            {{ t.sitemapLink }}
          </NuxtLink>
        </div>
        <p class="m-0 text-xs sm:text-sm text-white/50">{{ t.copyright }}</p>
      </div>
    </div>
  </footer>
</template>

<script setup>
const { t: createTranslations } = useLanguage()

const translations = {
  addressUSA: {
    es: 'Dirección en USA',
    en: 'USA Address'
  },
  contact: {
    es: 'Contacto',
    en: 'Contact'
  },
  businessHours: {
    es: 'Horario de Atención',
    en: 'Business Hours'
  },
  hoursWeekdays: {
    es: 'Lunes a Viernes: 9:00 AM - 6:00 PM',
    en: 'Monday to Friday: 9:00 AM - 6:00 PM'
  },
  hoursSaturday: {
    es: 'Sábado: 10:00 AM - 2:00 PM',
    en: 'Saturday: 10:00 AM - 2:00 PM'
  },
  pricingLink: {
    es: 'Precios',
    en: 'Pricing'
  },
  termsLink: {
    es: 'Términos y Condiciones',
    en: 'Terms and Conditions'
  },
  privacyLink: {
    es: 'Política de Privacidad',
    en: 'Privacy Policy'
  },
  sitemapLink: {
    es: 'Mapa del Sitio',
    en: 'Sitemap'
  },
  copyright: {
    es: '© 2025 Boxly - Todos los derechos reservados.',
    en: '© 2025 Boxly - All rights reserved.'
  },
  followOn: {
    es: 'Síguenos en',
    en: 'Follow us on'
  }
}

const t = createTranslations(translations)
</script>

<style scoped>
.bg-dark-500 { 
  background-color: #1a202c; 
}
</style>