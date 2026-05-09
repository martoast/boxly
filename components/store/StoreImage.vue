<template>
  <!-- Shimmer placeholder — visible while loading, hidden once the
       real image has decoded. Uses transform-translate animation
       (cheap, GPU-accelerated, no repaint). -->
  <div
    v-if="!loaded && !errored"
    class="store-img-shimmer absolute inset-0 overflow-hidden bg-gray-100"
    aria-hidden="true"
  />

  <!-- Fallback for missing/broken images. Subtle gray photo glyph
       so a 404'd src doesn't render as the browser's broken-image icon. -->
  <div
    v-else-if="errored"
    class="absolute inset-0 flex items-center justify-center bg-gray-50 text-gray-300"
    aria-hidden="true"
  >
    <svg class="w-1/3 h-1/3 max-w-12 max-h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
    </svg>
  </div>

  <!-- The actual image. Fades in via opacity transition once decoded.
       Lazy by default; pass priority=true for above-fold images
       (LCP candidates) to load eagerly with high fetch priority. -->
  <img
    v-if="src"
    :src="src"
    :alt="alt"
    :loading="priority ? 'eager' : 'lazy'"
    :fetchpriority="priority ? 'high' : undefined"
    decoding="async"
    @load="onLoad"
    @error="onError"
    :class="[$attrs.class, 'transition-opacity duration-500', loaded ? 'opacity-100' : 'opacity-0']"
  />
</template>

<script setup>
defineOptions({ inheritAttrs: false })

const props = defineProps({
  src: { type: String, default: null },
  alt: { type: String, default: '' },
  // True for hero/above-fold images: skips lazy + sets fetchpriority=high.
  // Use sparingly — only the first paint matters.
  priority: { type: Boolean, default: false },
})

const loaded = ref(false)
const errored = ref(false)

const onLoad = () => { loaded.value = true; errored.value = false }
const onError = () => { errored.value = true; loaded.value = false }

// Reset state when the source changes (e.g. carousel swap, variant change)
watch(() => props.src, () => {
  loaded.value = false
  errored.value = false
})
</script>

<style>
/* Animated shimmer — pure CSS, no image asset, GPU-accelerated.
   Cycles a soft highlight band across the gray container so the user
   perceives motion (= "loading") instead of a dead gray box.
   Single keyframe definition is global by name; component instances
   don't fight each other since the class is locally scoped to the
   container. Defined non-scoped so the keyframe stays accessible. */
@keyframes store-img-shimmer-anim {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(100%);  }
}
.store-img-shimmer::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.55) 50%,
    transparent 100%
  );
  animation: store-img-shimmer-anim 1.4s ease-in-out infinite;
  will-change: transform;
}
</style>
