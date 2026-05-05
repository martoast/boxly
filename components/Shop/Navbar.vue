<template>
  <header class="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">

        <!-- Logo + brand -->
        <div class="flex items-center gap-6">
          <NuxtLink to="/shop" class="flex items-center gap-2 shrink-0">
            <img src="/logo.svg" class="h-8 w-8" alt="Boxly" />
            <span class="hidden sm:inline font-extrabold text-gray-900 tracking-tight text-lg">Boxly</span>
          </NuxtLink>

          <!-- Desktop nav -->
          <nav class="hidden lg:flex items-center gap-1">
            <NuxtLink
              v-for="item in navItems"
              :key="item.to"
              :to="item.to"
              :class="[
                isActive(item)
                  ? 'text-gray-900 bg-gray-100'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50',
                'px-4 py-2 rounded-full text-sm font-semibold transition-colors',
              ]"
            >
              {{ item.label }}
            </NuxtLink>
          </nav>
        </div>

        <!-- Right side — cart + account + lang -->
        <div class="flex items-center gap-2 sm:gap-3">
          <NuxtLink
            to="/cart"
            class="relative inline-flex items-center justify-center h-10 w-10 rounded-full text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            aria-label="Carrito"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
            <span v-if="cartCount > 0" class="absolute -top-0.5 -right-0.5 h-5 min-w-5 px-1 inline-flex items-center justify-center text-[10px] font-bold text-white bg-primary-500 rounded-full">{{ cartCount }}</span>
          </NuxtLink>

          <NuxtLink
            v-if="isLoggedIn"
            to="/app"
            class="hidden sm:inline-flex items-center gap-2 px-3 h-10 rounded-full text-sm font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
            Mi cuenta
          </NuxtLink>
          <NuxtLink
            v-else
            to="/login"
            class="hidden sm:inline-flex items-center px-4 h-10 rounded-full text-sm font-semibold bg-gray-900 text-white hover:bg-gray-800 transition-colors"
          >
            Iniciar sesión
          </NuxtLink>

          <!-- Mobile hamburger -->
          <button
            type="button"
            @click="mobileOpen = true"
            class="lg:hidden inline-flex items-center justify-center h-10 w-10 rounded-full text-gray-700 hover:bg-gray-100"
            aria-label="Abrir menú"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile sheet -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="mobileOpen" class="fixed inset-0 z-50 bg-black/50 lg:hidden" @click="mobileOpen = false">
          <div class="absolute right-0 top-0 h-full w-72 max-w-[85vw] bg-white shadow-xl flex flex-col" @click.stop>
            <div class="flex items-center justify-between p-4 border-b border-gray-100">
              <span class="font-bold text-gray-900">Tienda</span>
              <button @click="mobileOpen = false" class="h-9 w-9 inline-flex items-center justify-center rounded-full hover:bg-gray-100">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <nav class="flex-1 overflow-y-auto p-2">
              <NuxtLink
                v-for="item in navItems"
                :key="item.to"
                :to="item.to"
                @click="mobileOpen = false"
                :class="[
                  isActive(item) ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50',
                  'block px-4 py-3 rounded-xl font-semibold',
                ]"
              >
                {{ item.label }}
              </NuxtLink>
              <div class="mt-3 pt-3 border-t border-gray-100">
                <NuxtLink
                  v-if="isLoggedIn"
                  to="/app"
                  @click="mobileOpen = false"
                  class="block px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold"
                >Mi cuenta</NuxtLink>
                <NuxtLink
                  v-else
                  to="/login"
                  @click="mobileOpen = false"
                  class="block mx-1 mt-2 px-4 py-3 rounded-xl bg-gray-900 text-white font-semibold text-center"
                >Iniciar sesión</NuxtLink>
                <NuxtLink
                  to="/"
                  @click="mobileOpen = false"
                  class="block px-4 py-3 mt-1 rounded-xl text-gray-500 hover:bg-gray-50 text-sm"
                >← Volver a Boxly</NuxtLink>
              </div>
            </nav>
          </div>
        </div>
      </Transition>
    </Teleport>
  </header>
</template>

<script setup>
const route = useRoute()
const userState = useState('user')
const isLoggedIn = computed(() => !! userState.value)

const { totalItems } = useStoreCart()
const cartCount = computed(() => totalItems.value)

const navItems = [
  { to: '/shop',            label: 'Inicio',     match: (r) => r.path === '/shop' && Object.keys(r.query).length === 0 },
  { to: '/shop?view=all',   label: 'Productos',  match: (r) => r.path === '/shop' && (r.query.view === 'all' || !!r.query.category_id || !!r.query.store_id || !!r.query.search) },
  { to: '/shop/categories', label: 'Categorías', match: (r) => r.path === '/shop/categories' },
  { to: '/shop/brands',     label: 'Marcas',     match: (r) => r.path === '/shop/brands' },
]

const isActive = (item) => item.match(route)

const mobileOpen = ref(false)

// Close on route change
watch(() => route.fullPath, () => { mobileOpen.value = false })
</script>
