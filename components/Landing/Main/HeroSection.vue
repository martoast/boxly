<template>
  <!-- Software-first AI hero. ONE job: get the user to ask Boxly AI their first
       question. No lifestyle photo, no dark overlay, no logo marquee, no benefits
       row — those moved below so nothing competes with the input. Clean, centered,
       full-height: it should feel like opening an AI assistant, not a store. -->
  <header class="relative isolate overflow-hidden bg-white min-h-[100svh] flex flex-col">
    <!-- Soft brand glow behind the input — the only decoration. -->
    <div class="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(50%_45%_at_50%_42%,#d5e5f5,transparent_72%)]"></div>

    <!-- Store logos near the top. On MOBILE it sits in normal flow (so it can't
         overlap the title); on desktop it's an absolute overlay so the content
         stays perfectly centered. Top padding clears the fixed navbar. -->
    <div class="relative sm:absolute sm:top-0 sm:inset-x-0 pt-20 sm:pt-24">
      <TrustedStores />
    </div>

    <!-- Centered AI focal point — fills the remaining space. -->
    <div class="relative flex-1 flex flex-col items-center justify-center text-center w-full max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <h1 class="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-[1.08] tracking-tight">
        {{ t.title }}
      </h1>
      <p class="mt-3 sm:mt-4 text-base sm:text-xl text-gray-500">
        {{ t.subtitle }}
      </p>

      <!-- The focal point: the largest interactive element on the page. -->
      <div class="mt-6 sm:mt-8 w-full">
        <HeroSearch />
      </div>

      <!-- One subtle row of links — never competes with the input. -->
      <div class="mt-6 sm:mt-7 flex items-center justify-center gap-x-5 text-sm">
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
