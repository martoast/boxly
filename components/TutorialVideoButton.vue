<template>
  <button
    type="button"
    @click="open"
    class="inline-flex items-center gap-2 pl-1.5 pr-4 py-1.5 rounded-full bg-white text-primary-700 text-sm font-semibold border border-primary-100 hover:bg-primary-50 hover:border-primary-200 transition-all shadow-sm flex-shrink-0"
  >
    <span class="flex items-center justify-center w-7 h-7 rounded-full bg-primary-600 text-white">
      <svg class="w-3.5 h-3.5 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
    </span>
    {{ t.watchTutorial }}
  </button>

  <!--
    Tutorial modal — premium UX, mobile-first. Only opens when the user
    clicks the "Ver tutorial" button (no auto-popup). Closes via the explicit
    X in the header, the "Cerrar" button in the footer, or a swipe-down
    gesture on mobile.
  -->
  <TransitionRoot as="template" :show="showModal">
    <Dialog class="relative z-50" @close="noop">
      <TransitionChild as="template" enter="ease-out duration-300" enter-from="opacity-0" enter-to="opacity-100" leave="ease-in duration-200" leave-from="opacity-100" leave-to="opacity-0">
        <div class="fixed inset-0 bg-gray-900/80 backdrop-blur-md" />
      </TransitionChild>

      <div class="fixed inset-0 z-10 overflow-y-auto">
        <div class="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4">
          <TransitionChild
            as="template"
            enter="ease-out duration-300"
            enter-from="opacity-0 translate-y-8 sm:translate-y-0 sm:scale-95"
            enter-to="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leave-from="opacity-100 translate-y-0 sm:scale-100"
            leave-to="opacity-0 translate-y-8 sm:translate-y-0 sm:scale-95"
          >
            <DialogPanel
              class="w-full sm:max-w-3xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden ring-1 ring-black/5 touch-pan-y"
              :style="{
                transform: dragOffset > 0 ? `translateY(${dragOffset}px)` : '',
                transition: dragging ? 'none' : (isDragSettling ? 'transform 220ms ease-out' : '')
              }"
              @touchstart.passive="onTouchStart"
              @touchmove.passive="onTouchMove"
              @touchend="onTouchEnd"
              @touchcancel="onTouchEnd"
            >
              <!-- Mobile drag handle — purely visual, gives the iOS bottom-sheet feel -->
              <div class="sm:hidden pt-3 pb-1 flex items-center justify-center">
                <div class="w-10 h-1 rounded-full bg-gray-300"></div>
              </div>

              <!-- Header -->
              <div class="flex items-center justify-between gap-3 px-5 sm:px-7 py-4 sm:py-5 border-b border-gray-100">
                <div class="flex items-center gap-3 min-w-0">
                  <span class="hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-primary-50 text-primary-600 flex-shrink-0">
                    <svg class="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  </span>
                  <div class="min-w-0">
                    <p class="text-[10px] font-bold uppercase tracking-widest text-primary-600 leading-none">{{ t.eyebrow }}</p>
                    <DialogTitle class="text-base sm:text-lg font-bold text-gray-900 leading-tight mt-1 truncate">{{ t.modalTitle }}</DialogTitle>
                  </div>
                </div>
                <button
                  type="button"
                  @click="close"
                  :aria-label="t.close"
                  class="flex items-center justify-center w-10 h-10 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 active:bg-gray-200 transition-colors flex-shrink-0"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>

              <!-- Video -->
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

              <!-- Footer — safe-area padding so iOS home-bar doesn't overlap the button -->
              <div
                class="px-5 sm:px-7 py-4 sm:py-5 flex items-center justify-end bg-white border-t border-gray-100"
                style="padding-bottom: max(1rem, env(safe-area-inset-bottom))"
              >
                <button
                  type="button"
                  @click="close"
                  class="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-black active:bg-gray-800 transition-colors shadow-sm min-h-[44px]"
                >{{ t.close }}</button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup>
import { ref } from 'vue'
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'

defineProps({
  // Loom video ID — e.g. "d0b29f8d1eb44727a1fb9799aaf04e61".
  loomId: { type: String, required: true },
})

const { t: createTranslations } = useLanguage()
const t = createTranslations({
  watchTutorial: { es: 'Ver tutorial', en: 'Watch tutorial' },
  eyebrow: { es: 'Guía rápida', en: 'Quick guide' },
  modalTitle: { es: 'Mira cómo funciona', en: 'See how it works' },
  close: { es: 'Cerrar', en: 'Close' },
})

const showModal = ref(false)

const open = () => { showModal.value = true }
const close = () => { showModal.value = false }
// HeadlessUI's @close fires on backdrop tap + Esc — both are accidental on
// mobile (the small "x" miss tap on backdrop kept hiding the video). Force
// explicit closes via the X button, footer button, or swipe-down gesture.
const noop = () => {}

// Swipe-down-to-close — mobile only. Drag the panel down, release past the
// threshold to dismiss; otherwise it springs back.
const dragOffset = ref(0)
const dragging = ref(false)
const isDragSettling = ref(false)
let startY = 0
const DISMISS_THRESHOLD = 120 // px

const onTouchStart = (e) => {
  if (typeof window !== 'undefined' && window.innerWidth >= 640) return // mobile only
  startY = e.touches[0].clientY
  dragging.value = true
  isDragSettling.value = false
  dragOffset.value = 0
}

const onTouchMove = (e) => {
  if (!dragging.value) return
  const delta = e.touches[0].clientY - startY
  // Only allow downward drag, with a soft resistance curve for over-drag feel.
  dragOffset.value = delta > 0 ? delta : 0
}

const onTouchEnd = () => {
  if (!dragging.value) return
  dragging.value = false
  isDragSettling.value = true

  if (dragOffset.value > DISMISS_THRESHOLD) {
    // Fling the panel off the bottom of the screen, then close cleanly.
    dragOffset.value = (typeof window !== 'undefined' ? window.innerHeight : 800)
    setTimeout(() => {
      close()
      dragOffset.value = 0
      isDragSettling.value = false
    }, 220)
  } else {
    // Spring back to rest.
    dragOffset.value = 0
    setTimeout(() => { isDragSettling.value = false }, 220)
  }
}
</script>
