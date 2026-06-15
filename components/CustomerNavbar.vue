<template>
  <Disclosure
    as="nav"
    class="bg-white border-b border-gray-200 shadow-sm"
    v-slot="{ open }"
  >
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="flex h-16 justify-between">
        <div class="flex">
          <div class="-ml-2 mr-2 flex items-center md:hidden">
            <!-- Mobile menu button -->
            <DisclosureButton
              class="relative inline-flex items-center justify-center rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            >
              <span class="absolute -inset-0.5" />
              <span class="sr-only">Open main menu</span>
              <Bars3Icon
                v-if="!open"
                class="block h-6 w-6"
                aria-hidden="true"
              />
              <XMarkIcon v-else class="block h-6 w-6" aria-hidden="true" />
            </DisclosureButton>
          </div>
          <div class="flex flex-shrink-0 items-center">
            <a
              href="/app/"
              @click.prevent="handleNavigation('/app/')"
              class="flex items-center"
            >
              <!-- Logo -->
              <img src="/logo.svg" class="h-20 w-20 inline-flex items-center justify-center">
            </a>
          </div>
          <div class="hidden md:ml-6 md:flex md:space-x-8">
            <!-- Dashboard -->
            <button
              @click="handleNavigation('/app/')"
              :class="[
                isActiveRoute('/app/') && !isActiveRoute('/app/orders') && !isActiveRoute('/app/account')
                  ? 'border-primary-500 text-gray-900'
                  : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900',
                'inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium transition-colors duration-200',
              ]"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
              </svg>
              {{ t.dashboard }}
            </button>
            
            <!-- Orders Dropdown -->
            <div
              class="relative inline-flex h-full group"
              @mouseenter="showDropdown('orders')"
              @mouseleave="hideDropdown('orders')"
            >
              <button
                type="button"
                @click="handleNavigation('/app/orders')"
                class="inline-flex items-center gap-2 px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200"
                :class="[
                  isActiveRoute('/app/orders')
                    ? 'border-primary-500 text-gray-900'
                    : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900',
                ]"
              >
                <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                </svg>
                <span class="whitespace-nowrap">{{ t.orders }}</span>
                <svg
                  class="w-2.5 h-2.5 flex-shrink-0"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 10 6"
                >
                  <path
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="m1 1 4 4 4-4"
                  />
                </svg>
              </button>
              <div
                v-show="dropdowns.orders"
                class="absolute left-0 top-full mt-1 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
                style="position: absolute; z-index: 99999; width: 250px;"
                role="menu"
                aria-orientation="vertical"
              >
                <div class="py-1" role="none">
                  <a
                    href="/app/orders"
                    @click.prevent="handleNavigation('/app/orders')"
                    class="group flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors duration-200"
                    role="menuitem"
                  >
                    <svg class="w-4 h-4 mr-3 text-gray-400 group-hover:text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                    </svg>
                    <div>
                      <p class="font-medium">{{ t.allOrders }}</p>
                      <p class="text-xs text-gray-500">{{ t.allOrdersDesc }}</p>
                    </div>
                  </a>
                  <div class="border-t border-gray-100 my-1"></div>
                  <button
                    @click="handleCreateOrder"
                    class="group flex items-center w-full px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 transition-colors duration-200"
                    role="menuitem"
                  >
                    <svg class="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                    </svg>
                    {{ t.createNewOrder }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Solicitudes de Compra — dropdown with the two pipelines -->
            <div
              class="relative inline-flex h-full group"
              @mouseenter="showDropdown('purchaseRequests')"
              @mouseleave="hideDropdown('purchaseRequests')"
            >
              <button
                type="button"
                @click="handleNavigation('/app/purchase-requests')"
                class="inline-flex items-center gap-2 px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200"
                :class="[
                  isActiveRoute('/app/purchase-requests')
                    ? 'border-primary-500 text-gray-900'
                    : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900',
                ]"
              >
                <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span class="whitespace-nowrap">{{ t.purchaseRequests }}</span>
                <svg
                  class="w-2.5 h-2.5 flex-shrink-0"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 10 6"
                >
                  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 4 4 4-4"/>
                </svg>
              </button>
              <div
                v-show="dropdowns.purchaseRequests"
                class="absolute left-0 top-full mt-1 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
                style="position: absolute; z-index: 99999; width: 280px;"
                role="menu"
                aria-orientation="vertical"
              >
                <div class="py-1" role="none">
                  <a
                    href="/app/purchase-requests/create/online"
                    @click.prevent="handleNavigation('/app/purchase-requests/create/online')"
                    class="group flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors duration-200"
                    role="menuitem"
                  >
                    <svg class="w-4 h-4 mr-3 text-gray-400 group-hover:text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
                    </svg>
                    <div>
                      <p class="font-medium">{{ t.prOnlineTitle }}</p>
                      <p class="text-xs text-gray-500">{{ t.prOnlineDesc }}</p>
                    </div>
                  </a>
                  <div class="border-t border-gray-100 my-1"></div>
                  <a
                    href="/in-person"
                    @click.prevent="handleNavigation('/in-person')"
                    class="group flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors duration-200"
                    role="menuitem"
                  >
                    <svg class="w-4 h-4 mr-3 text-gray-400 group-hover:text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                    <div>
                      <p class="font-medium">{{ t.prInPersonTitle }}</p>
                      <p class="text-xs text-gray-500">{{ t.prInPersonDesc }}</p>
                    </div>
                  </a>
                </div>
              </div>
            </div>

            <!-- Affiliate Portal (shown only for affiliates) -->
            <button
              v-if="user?.affiliate"
              @click="handleNavigation('/app/affiliate')"
              :class="[
                isActiveRoute('/app/affiliate')
                  ? 'border-primary-500 text-gray-900'
                  : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900',
                'inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium transition-colors duration-200',
              ]"
            >
              <svg class="w-4 h-4 mr-2 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {{ t.affiliatePortal }}
            </button>

          </div>
        </div>
        <div class="flex items-center">
          <div class="hidden md:ml-4 md:flex md:flex-shrink-0 md:items-center">
            <!-- Language Toggle (Desktop) -->
            <div class="mr-3">
              <LanguageToggle />
            </div>

            <!-- Profile dropdown -->
            <Menu as="div" class="relative ml-3">
              <div>
                <MenuButton
                  class="relative flex items-center gap-2 rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 px-3 py-2 hover:bg-gray-50 border border-gray-200"
                >
                  <span class="absolute -inset-1.5" />
                  <span class="sr-only">Open user menu</span>
                  <div class="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <span class="text-primary-600 font-medium">{{ userInitials }}</span>
                  </div>
                  <span class="hidden lg:block text-gray-700">{{ user?.name }}</span>
                  <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                  </svg>
                </MenuButton>
              </div>
              <transition
                enter-active-class="transition ease-out duration-200"
                enter-from-class="transform opacity-0 scale-95"
                enter-to-class="transform opacity-100 scale-100"
                leave-active-class="transition ease-in duration-75"
                leave-from-class="transform opacity-100 scale-100"
                leave-to-class="transform opacity-0 scale-95"
              >
                <MenuItems
                  class="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
                >
                  <div class="px-4 py-2 border-b border-gray-200">
                    <p class="text-sm text-gray-500">{{ t.signedInAs }}</p>
                    <p class="text-sm font-medium text-gray-900 truncate">{{ user?.email }}</p>
                  </div>
                  
                  <!-- Language Toggle in Dropdown (Desktop) -->
                  <div class="px-4 py-3 border-b border-gray-200">
                    <p class="text-xs text-gray-500 mb-2">{{ t.language }}</p>
                    <LanguageToggle />
                  </div>
                  
                  <MenuItem v-slot="{ active }">
                    <a
                      href="/app/account"
                      @click.prevent="handleNavigation('/app/account')"
                      :class="[
                        active ? 'bg-gray-100' : '',
                        'block px-4 py-2 text-sm text-gray-700',
                      ]"
                    >
                      {{ t.myAccount }}
                    </a>
                  </MenuItem>
                  <MenuItem v-if="user?.affiliate" v-slot="{ active }">
                    <a
                      href="/app/affiliate"
                      @click.prevent="handleNavigation('/app/affiliate')"
                      :class="[
                        active ? 'bg-gray-100' : '',
                        'block px-4 py-2 text-sm text-gray-700',
                      ]"
                    >
                      <div class="flex items-center gap-2">
                        <svg class="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {{ t.affiliatePortal }}
                      </div>
                    </a>
                  </MenuItem>
                  <MenuItem v-if="user?.is_admin" v-slot="{ active }">
                    <a
                      href="/app/admin/dashboard"
                      @click.prevent="handleNavigation('/app/admin/dashboard')"
                      :class="[
                        active ? 'bg-gray-100' : '',
                        'block px-4 py-2 text-sm text-gray-700',
                      ]"
                    >
                      {{ t.adminPanel }}
                    </a>
                  </MenuItem>
                 
                  <div class="border-t border-gray-100"></div>
                  <MenuItem v-slot="{ active }">
                    <a
                      href="#"
                      @click.prevent="handleLogout"
                      :class="[
                        active ? 'bg-gray-100' : '',
                        'block px-4 py-2 text-sm text-gray-700',
                      ]"
                    >
                      {{ t.logout }}
                    </a>
                  </MenuItem>
                </MenuItems>
              </transition>
            </Menu>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Mobile menu -->
    <DisclosurePanel class="md:hidden">
      <div class="space-y-1 pb-3 pt-2">
        <!-- Dashboard -->
        <DisclosureButton
          as="button"
          @click="handleNavigation('/app/')"
          :class="[
            isActiveRoute('/app/') && !isActiveRoute('/app/orders') && !isActiveRoute('/app/account')
              ? 'bg-primary-50 border-primary-500 text-primary-600'
              : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900',
            'block border-l-4 py-2 pl-3 pr-4 text-base font-medium sm:pl-5 sm:pr-6 w-full text-left',
          ]"
        >
          <div class="flex items-center">
            <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
            </svg>
            {{ t.dashboard }}
          </div>
        </DisclosureButton>
        
        <!-- Mobile Orders Section -->
        <div class="pl-4">
          <p class="px-3 pt-2 pb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ t.orders }}</p>
          <DisclosureButton
            as="a"
            href="/app/orders"
            @click.prevent="handleNavigation('/app/orders')"
            :class="[
              isActiveRoute('/app/orders') && !isActiveRoute('/app/orders/collecting')
                ? 'bg-primary-50 border-primary-500 text-primary-600'
                : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900',
              'block border-l-4 py-2 pl-6 pr-4 text-base font-medium',
            ]"
          >{{ t.allOrders }}</DisclosureButton>
          
          <DisclosureButton
            as="button"
            @click="handleCreateOrder"
            class="block border-l-4 border-transparent py-2 pl-6 pr-4 text-base font-medium text-primary-600 hover:bg-primary-50 w-full text-left"
          >
            <div class="flex items-center">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              {{ t.createNewOrder }}
            </div>
          </DisclosureButton>
        </div>

        <!-- Mobile Solicitudes de Compra — section header + two pipeline entries -->
        <div class="pl-4 mt-2">
          <p class="px-3 pt-2 pb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ t.purchaseRequests }}</p>
          <DisclosureButton
            as="a"
            href="/app/purchase-requests/create/online"
            @click.prevent="handleNavigation('/app/purchase-requests/create/online')"
            :class="[
              isActiveRoute('/app/purchase-requests/create/online')
                ? 'bg-primary-50 border-primary-500 text-primary-600'
                : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900',
              'block border-l-4 py-2 pl-6 pr-4 text-base font-medium',
            ]"
          >{{ t.prOnlineTitle }}</DisclosureButton>

          <DisclosureButton
            as="a"
            href="/in-person"
            @click.prevent="handleNavigation('/in-person')"
            :class="[
              isActiveRoute('/in-person')
                ? 'bg-primary-50 border-primary-500 text-primary-600'
                : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900',
              'block border-l-4 py-2 pl-6 pr-4 text-base font-medium',
            ]"
          >{{ t.prInPersonTitle }}</DisclosureButton>
        </div>

        <!-- Mobile Affiliate Portal (shown only for affiliates) -->
        <DisclosureButton
          v-if="user?.affiliate"
          as="button"
          @click="handleNavigation('/app/affiliate')"
          :class="[
            isActiveRoute('/app/affiliate')
              ? 'bg-primary-50 border-primary-500 text-primary-600'
              : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900',
            'block border-l-4 py-2 pl-3 pr-4 text-base font-medium sm:pl-5 sm:pr-6 w-full text-left',
          ]"
        >
          <div class="flex items-center">
            <svg class="w-5 h-5 mr-3 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {{ t.affiliatePortal }}
          </div>
        </DisclosureButton>

      </div>
      
      <div class="border-t border-gray-200 pb-3 pt-4">
        <div class="px-4 sm:px-6">
          <div class="flex items-center">
            <div class="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
              <span class="text-primary-600 font-medium text-lg">{{ userInitials }}</span>
            </div>
            <div class="ml-3 flex-1">
              <div class="text-base font-medium text-gray-900">{{ user?.name }}</div>
              <div class="text-sm font-medium text-gray-500">{{ user?.email }}</div>
            </div>
          </div>
          
          <!-- Language Toggle (Mobile) -->
          <div class="mt-3 px-4">
            <p class="text-xs text-gray-500 mb-2">{{ t.language }}</p>
            <LanguageToggle />
          </div>
        </div>
        <div class="mt-3 space-y-1">
          <DisclosureButton
            as="button"
            @click="handleNavigation('/app/account')"
            class="block px-4 py-2 text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 sm:px-6 w-full text-left"
          >{{ t.myAccount }}</DisclosureButton>
          <DisclosureButton
            v-if="user?.affiliate"
            as="button"
            @click="handleNavigation('/app/affiliate')"
            class="block px-4 py-2 text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 sm:px-6 w-full text-left"
          >
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {{ t.affiliatePortal }}
            </div>
          </DisclosureButton>
          <DisclosureButton
            v-if="user?.is_admin"
            as="button"
            @click="handleNavigation('/app/admin/dashboard')"
            class="block px-4 py-2 text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 sm:px-6 w-full text-left"
          >{{ t.adminPanel }}</DisclosureButton>
         
          <DisclosureButton
            as="button"
            @click="handleLogout"
            class="block px-4 py-2 text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 sm:px-6 w-full text-left"
          >{{ t.logout }}</DisclosureButton>
        </div>
      </div>
    </DisclosurePanel>
  </Disclosure>
</template>

<script setup>
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from "@headlessui/vue";
import { Bars3Icon, XMarkIcon } from "@heroicons/vue/24/outline";
import { reactive, computed } from "vue";
import LanguageToggle from '~/components/LanguageToggle.vue';

const { $customFetch } = useNuxtApp();
const user = useUser().value;
const router = useRouter();

// Use the language composable
const { t: createTranslations } = useLanguage();

// Translations
const translations = {
  appName: { es: 'Tu Casillero USA', en: 'Your USA Address' },
  dashboard: { es: 'Panel Principal', en: 'Dashboard' },
  orders: { es: 'Mis Envios', en: 'My Orders' },
  allOrders: { es: 'Todos los Envios', en: 'All Orders' },
  allOrdersDesc: { es: 'Ver historial completo', en: 'View complete history' },
  createNewOrder: { es: 'Crear Nuevo Envio', en: 'Create New Order' },
  purchaseRequests: { es: 'Solicitudes de Compra', en: 'Purchase Requests' },
  prOnlineTitle: { es: 'Compra Online', en: 'Online Purchase' },
  prOnlineDesc: { es: 'Mándanos el link de cualquier tienda USA', en: 'Send us a link from any US store' },
  prInPersonTitle: { es: 'Personal Shopping', en: 'Personal Shopping' },
  prInPersonDesc: { es: 'Vamos por ti a Las Americas Outlets', en: 'We shop for you at Las Americas Outlets' },
  shop: { es: 'Tienda', en: 'Shop' },
  cart: { es: 'Carrito', en: 'Cart' },
  signedInAs: { es: 'Sesión iniciada como', en: 'Signed in as' },
  myAccount: { es: 'Mi Cuenta', en: 'My Account' },
  affiliatePortal: { es: 'Portal de Afiliado', en: 'Affiliate Portal' },
  adminPanel: { es: 'Panel de Admin', en: 'Admin Panel' },
  logout: { es: 'Cerrar Sesión', en: 'Sign out' },
  language: { es: 'Idioma', en: 'Language' }
};

const t = createTranslations(translations);

const userInitials = computed(() => {
  if (!user?.name) return 'U';
  const names = user.name.split(' ');
  return names.map(n => n[0]).join('').toUpperCase().slice(0, 2);
});

const dropdowns = reactive({ orders: false, purchaseRequests: false });
const dropdownTimers = reactive({});

const showDropdown = (key) => {
  if (dropdownTimers[key]) clearTimeout(dropdownTimers[key]);
  dropdowns[key] = true;
};

const hideDropdown = (key) => {
  dropdownTimers[key] = setTimeout(() => {
    dropdowns[key] = false;
  }, 200);
};

const isActiveRoute = (route) => {
  const currentPath = router.currentRoute.value.path;
  if (route === "/app/" && currentPath === "/app/") return true;
  return currentPath.startsWith(route) && (currentPath === route || currentPath.charAt(route.length) === "/");
};

const handleNavigation = async (path) => {
  if (router.currentRoute.value.path === path) {
    window.location.href = path;
  } else {
    await navigateTo(path);
  }
};

const handleCreateOrder = async () => {
  await navigateTo('/app/orders/create');
};

const handleLogout = async () => {
  try {
    await $customFetch("/auth/logout", { method: "POST" });
    useState("user", () => null);
    const csrfCookie = useCookie("XSRF-TOKEN");
    csrfCookie.value = null;
    window.location.href = "/login";
  } catch (error) {
    console.error('Logout error:', error);
  }
};
</script>