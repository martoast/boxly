<!-- components/LanguageToggle.vue -->
<template>
  <div class="flex items-center gap-1.5">
    <button
      @click="handleLanguageSwitch('es')"
      :class="['bg-transparent border-2 rounded-full w-8 h-8 cursor-pointer transition-all duration-300 p-0 flex items-center justify-center', language === 'es' ? 'border-primary-500 scale-110 shadow-md' : 'border-transparent hover:border-gray-300']"
      title="Español"
      aria-label="Cambiar a Español"
    >
      <img 
        src="https://upload.wikimedia.org/wikipedia/commons/f/fc/Flag_of_Mexico.svg" 
        alt="Bandera de México" 
        class="w-6 h-6 rounded-full shadow-sm object-cover"
      >
    </button>
    <button
      @click="handleLanguageSwitch('en')"
      :class="['bg-transparent border-2 rounded-full w-8 h-8 cursor-pointer transition-all duration-300 p-0 flex items-center justify-center', language === 'en' ? 'border-primary-500 scale-110 shadow-md' : 'border-transparent hover:border-gray-300']"
      title="English"
      aria-label="Switch to English"
    >
      <img 
        src="https://upload.wikimedia.org/wikipedia/commons/a/a4/Flag_of_the_United_States.svg" 
        alt="United States Flag" 
        class="w-6 h-6 rounded-full shadow-sm object-cover"
      >
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