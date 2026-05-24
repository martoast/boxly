<template>
  <button
    type="button"
    @click="open"
    class="inline-flex items-center gap-2 pl-2 pr-4 py-1.5 rounded-full bg-primary-50 text-primary-700 text-sm font-semibold hover:bg-primary-100 transition-colors flex-shrink-0"
  >
    <span class="flex items-center justify-center w-7 h-7 rounded-full bg-primary-600 text-white">
      <svg class="w-3.5 h-3.5 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
    </span>
    {{ t.watchTutorial }}
  </button>

  <!-- Modal — auto-opens on first visit (unless dismissed) and reopens via the
       button above. "No mostrar de nuevo" persists the dismissal via cookie. -->
  <TransitionRoot as="template" :show="showModal">
    <Dialog class="relative z-50" @close="close">
      <TransitionChild as="template" enter="ease-out duration-200" enter-from="opacity-0" enter-to="opacity-100" leave="ease-in duration-150" leave-from="opacity-100" leave-to="opacity-0">
        <div class="fixed inset-0 bg-gray-900/70 backdrop-blur-sm" />
      </TransitionChild>
      <div class="fixed inset-0 z-10 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4">
          <TransitionChild as="template" enter="ease-out duration-200" enter-from="opacity-0 scale-95" enter-to="opacity-100 scale-100" leave="ease-in duration-150" leave-from="opacity-100 scale-100" leave-to="opacity-0 scale-95">
            <DialogPanel class="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div class="relative w-full bg-black" style="aspect-ratio: 16 / 9">
                <iframe
                  v-if="showModal"
                  :src="`https://www.loom.com/embed/${loomId}`"
                  frameborder="0"
                  allowfullscreen
                  allow="autoplay; fullscreen; picture-in-picture"
                  class="absolute inset-0 w-full h-full"
                ></iframe>
              </div>
              <div class="px-5 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white border-t border-gray-100">
                <button type="button" @click="dismissForever" class="text-sm text-gray-500 hover:text-gray-700 underline underline-offset-2 self-start">{{ t.dontShowAgain }}</button>
                <button type="button" @click="close" class="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-black transition-colors self-end sm:self-auto">{{ t.close }}</button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Dialog, DialogPanel, TransitionChild, TransitionRoot } from '@headlessui/vue'

const props = defineProps({
  // Loom video ID — e.g. "d0b29f8d1eb44727a1fb9799aaf04e61".
  loomId: { type: String, required: true },
  // Unique cookie name per page so dismissals are independent.
  cookieName: { type: String, required: true },
})

const { t: createTranslations } = useLanguage()
const t = createTranslations({
  watchTutorial: { es: 'Ver tutorial', en: 'Watch tutorial' },
  dontShowAgain: { es: 'No mostrar de nuevo', en: 'Don’t show again' },
  close: { es: 'Cerrar', en: 'Close' },
})

const dismissed = useCookie(props.cookieName, { default: () => false })
const showModal = ref(false)

const open = () => { showModal.value = true }
const close = () => { showModal.value = false }
const dismissForever = () => {
  dismissed.value = true
  showModal.value = false
}

onMounted(() => {
  if (!dismissed.value) showModal.value = true
})
</script>
