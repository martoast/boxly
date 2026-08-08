<!-- components/LanguageToggle.vue -->
<template>
  <div class="flex items-center gap-1.5">
    <button
      @click="handleLanguageSwitch('es')"
      :class="['bg-transparent border-2 rounded-full w-8 h-8 cursor-pointer transition-all duration-300 p-0 flex items-center justify-center', language === 'es' ? 'border-primary-500 scale-110 shadow-md' : 'border-transparent hover:border-gray-300']"
      title="Español"
      aria-label="Cambiar a Español"
    >
      <!-- Inline, not an <img>. These were hotlinked from upload.wikimedia.org:
           the Mexican flag alone is a 46 KB SVG (full coat of arms) fetched over
           a separate DNS+TLS handshake to a third party — to paint a 24px circle
           that clips all of that detail away. This toggle sits in the navbar, so
           every page paid it. Inline costs nothing and can't fail. -->
      <svg viewBox="0 0 3 2" class="w-6 h-6 rounded-full shadow-sm" role="img" aria-label="Bandera de México">
        <rect width="1" height="2" x="0" fill="#006847" />
        <rect width="1" height="2" x="1" fill="#fff" />
        <rect width="1" height="2" x="2" fill="#ce1126" />
      </svg>
    </button>
    <button
      @click="handleLanguageSwitch('en')"
      :class="['bg-transparent border-2 rounded-full w-8 h-8 cursor-pointer transition-all duration-300 p-0 flex items-center justify-center', language === 'en' ? 'border-primary-500 scale-110 shadow-md' : 'border-transparent hover:border-gray-300']"
      title="English"
      aria-label="Switch to English"
    >
      <svg viewBox="0 0 19 10" class="w-6 h-6 rounded-full shadow-sm" role="img" aria-label="United States Flag">
        <rect width="19" height="10" fill="#fff" />
        <g fill="#b22234">
          <rect width="19" height="0.77" y="0" />
          <rect width="19" height="0.77" y="1.54" />
          <rect width="19" height="0.77" y="3.08" />
          <rect width="19" height="0.77" y="4.62" />
          <rect width="19" height="0.77" y="6.15" />
          <rect width="19" height="0.77" y="7.69" />
          <rect width="19" height="0.77" y="9.23" />
        </g>
        <rect width="7.6" height="5.38" fill="#3c3b6e" />
      </svg>
    </button>
  </div>
</template>

<script setup>
const { language, switchLanguage } = useLanguage()
const { $customFetch } = useNuxtApp()
const user = useUser()

const handleLanguageSwitch = async (newLang) => {
  // Switch language locally
  switchLanguage(newLang)
  
  // If user is logged in, persist the preference
  if (user.value) {
    try {
      const response = await $customFetch('/profile', {
        method: 'PUT',
        body: {
          preferred_language: newLang
        }
      })
      
      // Update the user state with the new language preference
      if (response.data) {
        user.value.preferred_language = newLang
      }
    } catch (error) {
      console.error('Failed to update language preference:', error)
    }
  }
}
</script>