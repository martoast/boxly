<template>
  <header class="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
      <div class="flex items-center justify-between h-16">

        <!-- Logo + brand -->
        <div class="flex items-center gap-6">
          <NuxtLink to="/shop" class="flex items-center shrink-0" aria-label="Tienda Boxly">
            <img src="/logo.svg" class="h-8 w-auto" alt="Boxly" />
          </NuxtLink>

          <!-- Desktop nav -->
          <nav
            class="hidden lg:flex items-center gap-1"
            @mouseleave="scheduleClose"
          >
            <NuxtLink
              to="/shop"
              :class="[
                isHomeActive ? 'text-gray-900 bg-gray-100' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50',
                'px-4 py-2 rounded-full text-sm font-semibold transition-colors',
              ]"
              @mouseenter="closeMenu"
            >Inicio</NuxtLink>

            <NuxtLink
              to="/shop?view=all"
              :class="[
                isProductsActive ? 'text-gray-900 bg-gray-100' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50',
                'px-4 py-2 rounded-full text-sm font-semibold transition-colors',
              ]"
              @mouseenter="closeMenu"
            >Comprar en USA</NuxtLink>

            <!-- Categorías dropdown trigger -->
            <button
              type="button"
              @mouseenter="openMenu = 'categories'"
              @click="toggleMenu('categories')"
              :class="[
                openMenu === 'categories' || isCategoriesActive ? 'text-gray-900 bg-gray-100' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50',
                'inline-flex items-center gap-1 px-4 py-2 rounded-full text-sm font-semibold transition-colors',
              ]"
              :aria-expanded="openMenu === 'categories'"
            >
              Categorías
              <svg class="w-3.5 h-3.5 transition-transform" :class="{ 'rotate-180': openMenu === 'categories' }" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
            </button>

            <!-- Marcas dropdown trigger -->
            <button
              type="button"
              @mouseenter="openMenu = 'brands'"
              @click="toggleMenu('brands')"
              :class="[
                openMenu === 'brands' || isBrandsActive ? 'text-gray-900 bg-gray-100' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50',
                'inline-flex items-center gap-1 px-4 py-2 rounded-full text-sm font-semibold transition-colors',
              ]"
              :aria-expanded="openMenu === 'brands'"
            >
              Marcas
              <svg class="w-3.5 h-3.5 transition-transform" :class="{ 'rotate-180': openMenu === 'brands' }" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
            </button>

            <NuxtLink
              to="/shop/help"
              :class="[
                isHelpActive ? 'text-gray-900 bg-gray-100' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50',
                'px-4 py-2 rounded-full text-sm font-semibold transition-colors',
              ]"
              @mouseenter="closeMenu"
            >Ayuda</NuxtLink>
          </nav>
        </div>

        <!-- Right side — exit, cart, account -->
        <div class="flex items-center gap-2 sm:gap-3">
          <NuxtLink
            to="/"
            class="hidden lg:inline-flex items-center gap-1 px-3 h-10 rounded-full text-xs font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
            Salir de la tienda
          </NuxtLink>

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

      <!-- Categorías mega-menu panel -->
      <Transition
        enter-active-class="transition duration-150 ease-out"
        enter-from-class="opacity-0 -translate-y-1"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-100 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="openMenu === 'categories'"
          @mouseenter="cancelClose"
          @mouseleave="scheduleClose"
          class="hidden lg:block absolute left-0 right-0 top-full mt-2 mx-4 sm:mx-6 lg:mx-8 bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden"
        >
          <div class="grid grid-cols-3 gap-8 p-8">
            <!-- Género column -->
            <div>
              <p class="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-4">Género</p>
              <div class="space-y-1">
                <NuxtLink
                  v-for="g in genders"
                  :key="g.id"
                  :to="`/shop?gender_id=${g.id}`"
                  @click="closeMenu"
                  class="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div class="relative h-10 w-10 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center text-gray-400 shrink-0">
                    <StoreImage
                      v-if="g.image_url"
                      :src="g.image_url"
                      :alt="g.name"
                      class="absolute inset-0 w-full h-full object-cover"
                    />
                    <span v-else class="text-sm font-bold">{{ g.name.charAt(0) }}</span>
                  </div>
                  <span class="font-semibold text-gray-900 group-hover:text-primary-600">{{ g.name }}</span>
                </NuxtLink>
              </div>
            </div>

            <!-- Categorías columns (top 8, two cols) -->
            <div class="col-span-2">
              <div class="flex items-center justify-between mb-4">
                <p class="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Categorías</p>
                <NuxtLink
                  to="/shop/categories"
                  @click="closeMenu"
                  class="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700"
                >
                  Ver todas
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
                </NuxtLink>
              </div>
              <div class="grid grid-cols-2 gap-x-6 gap-y-1">
                <NuxtLink
                  v-for="c in topCategories"
                  :key="c.id"
                  :to="`/shop?category_id=${c.id}`"
                  @click="closeMenu"
                  class="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div class="relative h-9 w-9 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center text-gray-300 shrink-0">
                    <StoreImage
                      v-if="c.image_url"
                      :src="c.image_url"
                      :alt="c.name"
                      class="absolute inset-0 w-full h-full object-cover"
                    />
                    <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z"/></svg>
                  </div>
                  <span class="font-medium text-sm text-gray-900 group-hover:text-primary-600">{{ c.name }}</span>
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Marcas mega-menu panel -->
      <Transition
        enter-active-class="transition duration-150 ease-out"
        enter-from-class="opacity-0 -translate-y-1"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-100 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="openMenu === 'brands'"
          @mouseenter="cancelClose"
          @mouseleave="scheduleClose"
          class="hidden lg:block absolute left-0 right-0 top-full mt-2 mx-4 sm:mx-6 lg:mx-8 bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden"
        >
          <div class="p-8">
            <div class="flex items-center justify-between mb-5">
              <p class="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Marcas</p>
              <NuxtLink
                to="/shop/brands"
                @click="closeMenu"
                class="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700"
              >
                Ver todas
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
              </NuxtLink>
            </div>
            <div v-if="topBrands.length === 0" class="text-center py-6 text-sm text-gray-400">
              Cargando marcas...
            </div>
            <div v-else class="grid grid-cols-4 gap-3">
              <NuxtLink
                v-for="s in topBrands"
                :key="s.id"
                :to="`/shop?store_id=${s.id}`"
                @click="closeMenu"
                class="group flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-primary-300 hover:shadow-md transition-all"
              >
                <div class="relative h-12 w-12 rounded-lg bg-gray-50 overflow-hidden flex items-center justify-center shrink-0">
                  <StoreImage
                    v-if="s.logo_url"
                    :src="s.logo_url"
                    :alt="s.name"
                    class="absolute inset-0 w-full h-full object-contain p-1"
                  />
                  <span v-else class="text-xs font-bold text-gray-500">{{ s.name.charAt(0) }}</span>
                </div>
                <span class="font-semibold text-sm text-gray-900 group-hover:text-primary-600 truncate">{{ s.name }}</span>
              </NuxtLink>
            </div>
          </div>
        </div>
      </Transition>
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
                v-for="item in mobileNavItems"
                :key="item.to"
                :to="item.to"
                @click="mobileOpen = false"
                :class="[
                  isMobileActive(item) ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50',
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
                >← Salir de la tienda</NuxtLink>
              </div>
            </nav>
          </div>
        </div>
      </Transition>
    </Teleport>
  </header>
</template>

<script setup>
import StoreImage from '~/components/store/StoreImage.vue'

const route = useRoute()
const userState = useState('user')
const isLoggedIn = computed(() => !! userState.value)

const { totalItems } = useStoreCart()
const cartCount = computed(() => totalItems.value)

// Mega-menu state — null | 'categories' | 'brands'.
// Open on hover, click to toggle (touch + keyboard parity).
// Close-on-leave is delayed so the user can move from button → panel
// without the panel disappearing under the cursor.
const openMenu = ref(null)
let closeTimer = null

const cancelClose = () => {
  if (closeTimer) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
}
const scheduleClose = () => {
  cancelClose()
  closeTimer = setTimeout(() => { openMenu.value = null }, 180)
}
const closeMenu = () => {
  cancelClose()
  openMenu.value = null
}
const toggleMenu = (which) => {
  cancelClose()
  openMenu.value = openMenu.value === which ? null : which
}

// Active-state helpers
const isHomeActive = computed(() => route.path === '/shop' && Object.keys(route.query).length === 0)
const isProductsActive = computed(() => route.path === '/shop' && (route.query.view === 'all' || !! route.query.category_id || !! route.query.store_id || !! route.query.gender_id || !! route.query.search))
const isCategoriesActive = computed(() => route.path === '/shop/categories')
const isBrandsActive = computed(() => route.path === '/shop/brands')
const isHelpActive = computed(() => route.path === '/shop/help')

// Mobile flat nav (no dropdowns there — taps go straight to index pages)
const mobileNavItems = [
  { to: '/shop',            label: 'Inicio' },
  { to: '/shop?view=all',   label: 'Comprar en USA' },
  { to: '/shop/categories', label: 'Categorías' },
  { to: '/shop/brands',     label: 'Marcas' },
  { to: '/shop/help',       label: 'Ayuda' },
]
const isMobileActive = (item) => {
  if (item.to === '/shop')          return isHomeActive.value
  if (item.to === '/shop?view=all') return isProductsActive.value
  if (item.to === '/shop/categories') return isCategoriesActive.value
  if (item.to === '/shop/brands')     return isBrandsActive.value
  if (item.to === '/shop/help')       return isHelpActive.value
  return false
}

// Mega-menu data — pulled from the shared shop-menu composable.
// Composable is client-only and deferred so it doesn't block /shop's
// SSR. After hydration, it auto-fetches on browser idle. We ALSO
// fire ensureLoaded() on first hover/click of either dropdown
// trigger as a belt-and-suspenders for slow connections — by the
// time the user actually opens a dropdown, the data is ready.
const { genders, categories, brands, ensureLoaded: ensureMenuData } = useShopMenuData()

watch(openMenu, (val) => { if (val) ensureMenuData() })

// Cap categories shown in the dropdown — full list lives on /shop/categories
const topCategories = computed(() => categories.value.slice(0, 8))
// Show all brands in the dropdown — there are only ~8 anyway, and they
// have logos worth showing prominently. The /shop/brands page is for
// when we've grown past 12 or so.
const topBrands = computed(() => brands.value.slice(0, 12))

const mobileOpen = ref(false)

// Close on route change
watch(() => route.fullPath, () => {
  mobileOpen.value = false
  closeMenu()
})

// Close on Escape
const onKey = (e) => { if (e.key === 'Escape') closeMenu() }
onMounted(() => { window.addEventListener('keydown', onKey) })
onUnmounted(() => { window.removeEventListener('keydown', onKey); cancelClose() })
</script>
