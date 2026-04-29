<template>
  <!-- Mobile top bar -->
  <div class="fixed top-0 left-0 right-0 z-40 flex h-14 items-center justify-between bg-white border-b border-gray-200 px-4 md:hidden">
    <a href="/app/admin/dashboard" @click.prevent="handleNavigation('/app/admin/dashboard')" class="flex items-center">
      <img src="/logo.svg" class="h-10 w-10" />
    </a>
    <button
      @click="mobileOpen = true"
      class="inline-flex items-center justify-center rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
    >
      <span class="sr-only">Open menu</span>
      <Bars3Icon class="h-6 w-6" />
    </button>
  </div>

  <!-- Mobile off-canvas sidebar -->
  <TransitionRoot as="template" :show="mobileOpen">
    <Dialog as="div" class="relative z-50 md:hidden" @close="mobileOpen = false">
      <TransitionChild
        as="template"
        enter="ease-out duration-300"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="ease-in duration-200"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-gray-900/60" />
      </TransitionChild>

      <div class="fixed inset-0 flex">
        <TransitionChild
          as="template"
          enter="transition-transform duration-300 ease-out"
          enter-from="-translate-x-full"
          enter-to="translate-x-0"
          leave="transition-transform duration-200 ease-in"
          leave-from="translate-x-0"
          leave-to="-translate-x-full"
        >
          <DialogPanel class="relative flex w-72 flex-col bg-white shadow-xl">
            <!-- Close button -->
            <div class="absolute right-0 top-0 -mr-12 pt-2">
              <button
                @click="mobileOpen = false"
                class="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              >
                <XMarkIcon class="h-6 w-6 text-white" />
              </button>
            </div>

            <!-- Logo -->
            <div class="flex h-14 items-center px-4 border-b border-gray-200">
              <a href="/app/admin/dashboard" @click.prevent="handleNavigation('/app/admin/dashboard')" class="flex items-center">
                <img src="/logo.svg" class="h-10 w-10" />
              </a>
            </div>

            <!-- Nav items -->
            <nav class="flex-1 overflow-y-auto py-2">
              <a
                v-for="item in navItems"
                :key="item.route"
                :href="item.route"
                @click.prevent="handleMobileNav(item.route)"
                :class="[
                  isActiveRoute(item.route)
                    ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-500'
                    : 'text-gray-700 hover:bg-gray-50 border-l-4 border-transparent',
                  'flex items-center gap-3 px-4 py-2.5 text-sm font-medium'
                ]"
              >
                <component :is="item.icon" class="h-5 w-5 flex-shrink-0" />
                {{ item.label }}
              </a>
            </nav>

            <!-- Profile section -->
            <div class="border-t border-gray-200 p-4">
              <div class="flex items-center gap-3 mb-3">
                <div class="h-9 w-9 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <span class="text-primary-600 font-medium text-sm">{{ userInitials }}</span>
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium text-gray-900 truncate">{{ user?.name }}</p>
                  <p class="text-xs text-gray-500 truncate">{{ user?.email }}</p>
                </div>
                <span class="px-2 py-0.5 text-xs font-medium text-primary-600 bg-primary-50 rounded-full border border-primary-200 flex-shrink-0">
                  {{ t.adminRole }}
                </span>
              </div>
              <div class="flex gap-2">
                <a
                  href="/app/admin/account/"
                  @click.prevent="handleMobileNav('/app/admin/account/')"
                  class="flex-1 text-center text-xs font-medium text-gray-600 hover:text-gray-900 py-1.5 rounded-md hover:bg-gray-100"
                >{{ t.account }}</a>
                <button
                  @click="handleLogout"
                  class="flex-1 text-center text-xs font-medium text-gray-600 hover:text-gray-900 py-1.5 rounded-md hover:bg-gray-100"
                >{{ t.logout }}</button>
              </div>
            </div>
          </DialogPanel>
        </TransitionChild>
      </div>
    </Dialog>
  </TransitionRoot>

  <!-- Desktop/Tablet persistent sidebar -->
  <aside
    :class="[
      'hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:z-30 bg-white border-r border-gray-200 transition-all duration-300',
      collapsed ? 'md:w-20' : 'md:w-64'
    ]"
  >
    <!-- Logo + toggle -->
    <div class="flex h-16 items-center justify-between px-4 border-b border-gray-200">
      <a
        href="/app/admin/dashboard"
        @click.prevent="handleNavigation('/app/admin/dashboard')"
        class="flex items-center overflow-hidden"
      >
        <img v-if="collapsed" src="/box.svg" class="h-8 w-8 flex-shrink-0" />
        <img v-else src="/logo.svg" class="h-12 flex-shrink-0" />
      </a>
      <button
        @click="toggleCollapsed"
        class="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none"
      >
        <ChevronDoubleLeftIcon v-if="!collapsed" class="h-5 w-5" />
        <ChevronDoubleRightIcon v-else class="h-5 w-5" />
      </button>
    </div>

    <!-- Nav items -->
    <nav class="flex-1 overflow-y-auto py-2">
      <div v-for="item in navItems" :key="item.route" class="group relative">
        <a
          :href="item.route"
          @click.prevent="handleNavigation(item.route)"
          :class="[
            isActiveRoute(item.route)
              ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-500'
              : 'text-gray-700 hover:bg-gray-50 border-l-4 border-transparent',
            collapsed ? 'justify-center px-2' : 'px-4',
            'flex items-center gap-3 py-2.5 text-sm font-medium'
          ]"
        >
          <component :is="item.icon" class="h-5 w-5 flex-shrink-0" />
          <span v-if="!collapsed" class="whitespace-nowrap">{{ item.label }}</span>
        </a>
        <!-- Tooltip when collapsed -->
        <div
          v-if="collapsed"
          class="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-50"
        >
          {{ item.label }}
        </div>
      </div>
    </nav>

    <!-- Profile section -->
    <div class="border-t border-gray-200 p-3">
      <template v-if="collapsed">
        <div class="group relative flex justify-center">
          <div class="h-9 w-9 rounded-full bg-primary-100 flex items-center justify-center cursor-default">
            <span class="text-primary-600 font-medium text-sm">{{ userInitials }}</span>
          </div>
          <!-- Tooltip with profile info -->
          <div class="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-50">
            <p class="font-medium">{{ user?.name }}</p>
            <p class="text-gray-300">{{ user?.email }}</p>
          </div>
        </div>
        <div class="mt-2 space-y-1">
          <div class="group relative">
            <a
              href="/app/admin/account/"
              @click.prevent="handleNavigation('/app/admin/account/')"
              class="flex justify-center py-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            >
              <UserCircleIcon class="h-5 w-5" />
            </a>
            <div class="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-50">
              {{ t.account }}
            </div>
          </div>
          <div class="group relative">
            <button
              @click="handleLogout"
              class="flex w-full justify-center py-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            >
              <ArrowRightOnRectangleIcon class="h-5 w-5" />
            </button>
            <div class="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-50">
              {{ t.logout }}
            </div>
          </div>
        </div>
      </template>

      <template v-else>
        <div class="flex items-center gap-3 mb-3">
          <div class="h-9 w-9 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
            <span class="text-primary-600 font-medium text-sm">{{ userInitials }}</span>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium text-gray-900 truncate">{{ user?.name }}</p>
            <p class="text-xs text-gray-500 truncate">{{ user?.email }}</p>
          </div>
          <span class="px-2 py-0.5 text-xs font-medium text-primary-600 bg-primary-50 rounded-full border border-primary-200 flex-shrink-0">
            {{ t.adminRole }}
          </span>
        </div>
        <div class="flex gap-2">
          <a
            href="/app/admin/account/"
            @click.prevent="handleNavigation('/app/admin/account/')"
            class="flex-1 text-center text-xs font-medium text-gray-600 hover:text-gray-900 py-1.5 rounded-md hover:bg-gray-100"
          >{{ t.account }}</a>
          <button
            @click="handleLogout"
            class="flex-1 text-center text-xs font-medium text-gray-600 hover:text-gray-900 py-1.5 rounded-md hover:bg-gray-100"
          >{{ t.logout }}</button>
        </div>
      </template>
    </div>
  </aside>

  <!-- Spacer to push main content -->
  <div :class="['hidden md:block transition-all duration-300 flex-shrink-0', collapsed ? 'md:w-20' : 'md:w-64']" />
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { Dialog, DialogPanel, TransitionChild, TransitionRoot } from '@headlessui/vue';
import {
  Bars3Icon,
  XMarkIcon,
  Squares2X2Icon,
  ShoppingBagIcon,
  CubeIcon,
  ShoppingCartIcon,
  ArchiveBoxIcon,
  UsersIcon,
  BanknotesIcon,
  UserGroupIcon,
  MegaphoneIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/vue/24/outline';

const { $customFetch } = useNuxtApp();
const user = useUser().value;
const router = useRouter();

// Language setup
const { t: createTranslations } = useLanguage();

const translations = {
  dashboard: { es: 'Panel de Control', en: 'Dashboard' },
  orders: { es: 'Órdenes', en: 'Orders' },
  boxes: { es: 'Cajas', en: 'Boxes' },
  purchaseRequests: { es: 'Compra Asistida', en: 'Assisted Purchase' },
  packages: { es: 'Paquetes', en: 'Packages' },
  customers: { es: 'Clientes', en: 'Customers' },
  expenses: { es: 'Gastos', en: 'Expenses' },
  affiliates: { es: 'Afiliados', en: 'Affiliates' },
  campaigns: { es: 'Campañas', en: 'Campaigns' },
  storeProducts: { es: 'Productos Tienda', en: 'Store Products' },
  storeOrders: { es: 'Pedidos Tienda', en: 'Store Orders' },
  sourcePurchases: { es: 'Compras Pendientes', en: 'Pending Purchases' },
  adminRole: { es: 'Administrador', en: 'Administrator' },
  account: { es: 'Cuenta', en: 'Account' },
  logout: { es: 'Cerrar Sesión', en: 'Sign out' },
};

const t = createTranslations(translations);

// Nav items array
const navItems = computed(() => [
  { route: '/app/admin/dashboard', icon: Squares2X2Icon, label: t.value.dashboard },
  { route: '/app/admin/orders', icon: ShoppingBagIcon, label: t.value.orders },
  { route: '/app/admin/boxes', icon: CubeIcon, label: t.value.boxes },
  { route: '/app/admin/purchase-requests', icon: ShoppingCartIcon, label: t.value.purchaseRequests },
  { route: '/app/admin/packages', icon: ArchiveBoxIcon, label: t.value.packages },
  { route: '/app/admin/customers', icon: UsersIcon, label: t.value.customers },
  { route: '/app/admin/products', icon: ArchiveBoxIcon, label: t.value.storeProducts },
  { route: '/app/admin/marketplace-orders', icon: ShoppingBagIcon, label: t.value.storeOrders },
  { route: '/app/admin/source-purchases', icon: ShoppingCartIcon, label: t.value.sourcePurchases },
  { route: '/app/admin/expenses', icon: BanknotesIcon, label: t.value.expenses },
  { route: '/app/admin/affiliates', icon: UserGroupIcon, label: t.value.affiliates },
  { route: '/app/admin/campaigns', icon: MegaphoneIcon, label: t.value.campaigns },
]);

const userInitials = computed(() => {
  if (!user?.name) return 'A';
  const names = user.name.split(' ');
  return names.map(n => n[0]).join('').toUpperCase().slice(0, 2);
});

// Sidebar state
const mobileOpen = ref(false);
const collapsed = ref(false);

// Responsive breakpoint detection
const isTablet = ref(false);

function checkBreakpoint() {
  const width = window.innerWidth;
  isTablet.value = width >= 768 && width < 1024;
}

function getStoredCollapsed() {
  try {
    const stored = localStorage.getItem('admin-sidebar-collapsed');
    if (stored !== null) return stored === 'true';
  } catch {}
  return null;
}

function initCollapsedState() {
  const stored = getStoredCollapsed();
  if (stored !== null) {
    collapsed.value = stored;
  } else {
    // Smart defaults: collapsed on tablet, expanded on desktop
    collapsed.value = isTablet.value;
  }
}

function toggleCollapsed() {
  collapsed.value = !collapsed.value;
  try {
    localStorage.setItem('admin-sidebar-collapsed', String(collapsed.value));
  } catch {}
}

onMounted(() => {
  checkBreakpoint();
  initCollapsedState();
  window.addEventListener('resize', checkBreakpoint);
});

onUnmounted(() => {
  window.removeEventListener('resize', checkBreakpoint);
});

// Navigation
const isActiveRoute = (route) => {
  const currentPath = router.currentRoute.value.path;
  return (
    currentPath.startsWith(route) &&
    (currentPath === route || currentPath.charAt(route.length) === '/')
  );
};

const handleNavigation = async (path) => {
  if (router.currentRoute.value.path === path) {
    window.location.href = path;
  } else {
    await navigateTo(path);
  }
};

const handleMobileNav = async (path) => {
  mobileOpen.value = false;
  await handleNavigation(path);
};

const handleLogout = async () => {
  try {
    await $customFetch('/auth/logout', { method: 'POST' });
    useState('user', () => null);
    useCookie('XSRF-TOKEN').value = null;
    window.location.href = '/login';
  } catch (error) {
    console.error('Logout error:', error);
  }
};
</script>
