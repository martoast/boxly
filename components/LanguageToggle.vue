<!-- components/LanguageToggle.vue -->
<template>
  <div class="flex items-center gap-1.5">
    <button
      @click="handleLanguageSwitch('es')"
      :class="['bg-transparent border-2 rounded-full w-8 h-8 cursor-pointer transition-all duration-300 p-0 flex items-center justify-center', language === 'es' ? 'border-primary-500 scale-110 shadow-md' : 'border-transparent hover:border-gray-300']"
      title="Español"
      aria-label="Cambiar a Español"
    >
      <!-- The real flag, escudo and all, from flag-icons (MIT; the flags
           themselves are public domain). It was previously drawn inline as
           three bare stripes to avoid the weight of the coat of arms — but
           green/white/red with nothing in the middle IS the flag of Italy,
           which is exactly what it read as.

           Served from /public, not hotlinked to upload.wikimedia.org as it
           once was: no third-party DNS+TLS on every page, cached by the CDN,
           and it can't break when someone else's URL moves. -->
      <img
        src="/flags/mx.svg"
        alt="Bandera de México"
        width="24"
        height="24"
        class="w-6 h-6 rounded-full object-cover shadow-sm"
      />
    </button>
    <button
      @click="handleLanguageSwitch('en')"
      :class="['bg-transparent border-2 rounded-full w-8 h-8 cursor-pointer transition-all duration-300 p-0 flex items-center justify-center', language === 'en' ? 'border-primary-500 scale-110 shadow-md' : 'border-transparent hover:border-gray-300']"
      title="English"
      aria-label="Switch to English"
    >
      <!-- Same source, so the two sit at matching size and detail. -->
      <img
        src="/flags/us.svg"
        alt="United States flag"
        width="24"
        height="24"
        class="w-6 h-6 rounded-full object-cover shadow-sm"
      />
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