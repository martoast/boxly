<template>
  <TransitionRoot as="template" :show="isOpen">
    <Dialog as="div" class="relative z-50" @close="handleClose">
      <!-- Backdrop -->
      <TransitionChild
        as="template"
        enter="ease-out duration-300"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="ease-in duration-200"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      </TransitionChild>

      <div class="fixed inset-0 z-10 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <TransitionChild
          as="template"
          enter="ease-out duration-350"
          enter-from="opacity-0 translate-y-full sm:translate-y-6 sm:scale-95"
          enter-to="opacity-100 translate-y-0 sm:scale-100"
          leave="ease-in duration-250"
          leave-from="opacity-100 translate-y-0 sm:scale-100"
          leave-to="opacity-0 translate-y-full sm:translate-y-6 sm:scale-95"
        >
          <DialogPanel class="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">

            <!-- Drag pill -->
            <div class="flex justify-center pt-3 pb-0 sm:hidden">
              <div class="h-1 w-10 rounded-full bg-gray-200" />
            </div>

            <!-- Header -->
            <div class="px-6 pt-5 pb-4 flex items-start justify-between">
              <div>
                <h2 class="text-xl font-extrabold text-gray-900">¿Cómo quieres comprar?</h2>
                <p class="text-sm text-gray-400 mt-0.5">Elige la opción que mejor se adapte a ti</p>
              </div>
              <button
                class="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors shrink-0 ml-3"
                @click="handleClose"
              >
                <svg class="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <!-- Two choice cards -->
            <div class="px-6 pb-6 grid grid-cols-1 gap-3">

              <!-- Option A: Online Purchase -->
              <NuxtLink
                to="/app/purchase-requests/create"
                class="group flex items-start gap-4 p-4 rounded-2xl border-2 border-gray-100 hover:border-primary-200 hover:bg-primary-50/40 active:scale-[0.99] transition-all duration-200 cursor-pointer"
                @click="handleClose"
              >
                <div class="h-12 w-12 rounded-2xl bg-primary-100 flex items-center justify-center shrink-0 group-hover:bg-primary-200 transition-colors">
                  <svg class="h-6 w-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <h3 class="font-bold text-gray-900 text-base">Compra Online</h3>
                    <span class="text-xs font-semibold text-primary-600 bg-primary-50 border border-primary-100 px-2 py-0.5 rounded-full">8% comisión</span>
                  </div>
                  <p class="text-sm text-gray-500 leading-snug">Mándanos el link del producto y nosotros lo compramos con nuestra tarjeta americana.</p>
                </div>
                <svg class="h-5 w-5 text-gray-300 group-hover:text-primary-400 transition-colors shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </NuxtLink>

              <!-- Option B: Personal Shopping -->
              <a
                href="https://wa.me/16195591910?text=Hola%21+Me+gustar%C3%ADa+agendar+un+personal+shopping+en+Las+Americas+Premium+Outlets"
                target="_blank"
                rel="noopener"
                class="group flex items-start gap-4 p-4 rounded-2xl border-2 border-gray-100 hover:border-amber-200 hover:bg-amber-50/40 active:scale-[0.99] transition-all duration-200 text-left"
                @click="handleClose"
              >
                <div class="h-12 w-12 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0 group-hover:bg-amber-200 transition-colors">
                  <svg class="h-6 w-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <h3 class="font-bold text-gray-900 text-base">Personal Shopping</h3>
                    <span class="text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">mín. $600</span>
                  </div>
                  <p class="text-sm text-gray-500 leading-snug">Agendamos una sesión y vamos físicamente a Las Americas Outlets en San Diego a comprar por ti.</p>
                </div>
                <svg class="h-5 w-5 text-gray-300 group-hover:text-amber-400 transition-colors shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </a>

            </div>

            <!-- Footer note -->
            <div class="px-6 pb-6 flex items-center justify-between">
              <p class="text-xs text-gray-400">Envío a México incluido con Boxly</p>
              <label class="flex items-center gap-2 cursor-pointer">
                <div class="relative">
                  <input type="checkbox" v-model="dontShowAgain" class="peer sr-only" />
                  <div class="w-4 h-4 border-2 border-gray-300 rounded peer-checked:border-primary-500 peer-checked:bg-primary-500 transition-all flex items-center justify-center">
                    <svg class="w-2.5 h-2.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                    </svg>
                  </div>
                </div>
                <span class="text-xs text-gray-400">No mostrar de nuevo</span>
              </label>
            </div>

          </DialogPanel>
        </TransitionChild>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup>
import { ref, computed } from 'vue';
import { Dialog, DialogPanel, TransitionChild, TransitionRoot } from '@headlessui/vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false }
});

const emit = defineEmits(['update:modelValue', 'close']);

const onboardingDismissed = useCookie('boxly_assisted_purchase_onboarding_dismissed', {
  maxAge: 60 * 60 * 24 * 365,
  default: () => false
});

const dontShowAgain = ref(false);

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

const handleClose = () => {
  if (dontShowAgain.value) onboardingDismissed.value = true;
  isOpen.value = false;
  emit('close');
};

</script>
