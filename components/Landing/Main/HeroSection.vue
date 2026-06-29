<template>
  <!-- Software-first AI hero. ONE job: get the user to ask Boxly AI their first
       question. No lifestyle photo, no dark overlay, no logo marquee, no benefits
       row — those moved below so nothing competes with the input. Clean, centered,
       full-height: it should feel like opening an AI assistant, not a store. -->
  <header class="relative isolate overflow-hidden bg-white min-h-[100svh] flex flex-col">
    <!-- Soft brand glow behind the input — the only decoration. -->
    <div class="pointer-events-none absolute inset-x-0 top-1/4 h-[460px] bg-[radial-gradient(55%_55%_at_50%_0%,#d5e5f5,transparent_72%)]"></div>

    <!-- Store logos scrolling near the top (cleared below the fixed navbar). -->
    <div class="relative pt-20 sm:pt-24">
      <TrustedStores />
    </div>

    <!-- Centered AI focal point — fills the rest of the screen. -->
    <div class="relative flex-1 flex flex-col items-center justify-center text-center mx-auto max-w-3xl w-full px-4 sm:px-6 pb-16">
      <div class="inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-sm font-semibold text-primary-700 mb-6">
        <span aria-hidden="true">✨</span> Boxly AI
      </div>

      <h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-[1.07] tracking-tight">
        {{ t.title }}
      </h1>
      <p class="mt-4 text-lg sm:text-xl text-gray-500">
        {{ t.subtitle }}
      </p>

      <!-- The focal point: the largest interactive element on the page. -->
      <div class="mt-8 w-full">
        <HeroSearch />
      </div>

      <!-- One subtle row of links — never competes with the input. -->
      <div class="mt-7 flex items-center gap-x-5 text-sm">
        <NuxtLink :to="primaryHref" class="font-semibold text-primary-700 hover:text-primary-800 transition-colors">{{ primaryLabel }}</NuxtLink>
        <NuxtLink :to="secondaryHref" class="text-gray-400 hover:text-gray-600 transition-colors">{{ secondaryLabel }}</NuxtLink>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import HeroSearch from './HeroSearch.vue'
import TrustedStores from './TrustedStores.vue'

const { t: createTranslations } = useLanguage()
const user = useUser()

const t = createTranslations({
  title:         { es: '¿Qué quieres comprar de Estados Unidos?', en: 'What do you want to buy from the US?' },
  subtitle:      { es: 'Dile a Boxly AI qué quieres comprar.', en: 'Tell Boxly AI what you want to buy.' },
  createAccount: { es: 'Crear cuenta gratis', en: 'Create free account' },
  myAccount:     { es: 'Ir a mi cuenta', en: 'Go to my account' },
  signIn:        { es: 'Iniciar sesión', en: 'Sign in' },
  howItWorks:    { es: 'Cómo funciona', en: 'How it works' },
})

const isAuthed = computed(() => Boolean(user?.value?.id))
const primaryHref    = computed(() => (isAuthed.value ? '/app' : '/register'))
const primaryLabel   = computed(() => (isAuthed.value ? t.value.myAccount : t.value.createAccount))
const secondaryHref  = computed(() => (isAuthed.value ? '/how-it-works' : '/login'))
const secondaryLabel = computed(() => (isAuthed.value ? t.value.howItWorks : t.value.signIn))
</script>
