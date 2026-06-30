<template>
  <!-- Rich "we're working on it" loader for the AI search wait (~5-6s). Animates
       the Boxly box logo — floating, a pulsing glow, and motion "speed lines"
       streaking in — with a rotating caption so the pause feels productive and
       exciting instead of a tiny spinner the customer might bail on. -->
  <div class="inline-flex items-center gap-3 bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm">
    <div class="relative w-11 h-11 shrink-0">
      <span class="glow"></span>
      <svg class="box absolute inset-0 w-full h-full" viewBox="0 0 415 387" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <!-- the package body -->
        <path class="body" fill-rule="evenodd" clip-rule="evenodd" d="M237.735 13.4458C242.752 10.1828 248.851 10.1848 253.866 13.4512L395.108 105.43C400.383 108.865 403.655 115.383 403.655 122.456V264.01C403.655 271.084 400.383 277.601 395.108 281.036L253.872 373.011C248.853 376.28 242.751 376.28 237.732 373.012L96.486 281.036C91.2108 277.601 87.939 271.084 87.939 264.01V122.331C87.939 115.255 91.2143 108.734 96.494 105.3L237.735 13.4458Z" fill="#FECD04" stroke="#0C254C" stroke-width="21.3333" stroke-linecap="round"/>
        <!-- 3D seams -->
        <path d="M245.801 213.786V378.277" stroke="#0C254C" stroke-width="21.3333"/>
        <path d="M245.795 213.782L87.939 110.988" stroke="#0C254C" stroke-width="21.3333"/>
        <path d="M403.661 110.988L245.801 213.782" stroke="#0C254C" stroke-width="21.3333"/>
        <!-- motion / speed lines -->
        <path class="streak streak-1" d="M82.3102 159.638L10 159.452" stroke="#0C254C" stroke-width="21.3333" stroke-linecap="round" stroke-linejoin="round"/>
        <path class="streak streak-3" d="M82.2606 240.883L10 239.796" stroke="#0C254C" stroke-width="21.3333" stroke-linecap="round" stroke-linejoin="round"/>
        <path class="streak streak-2" d="M82.3727 200.878L27.3945 200.402" stroke="#0C254C" stroke-width="21.3333" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    <Transition name="cap" mode="out-in">
      <span :key="caption" class="text-sm font-medium text-gray-600 leading-snug">{{ caption }}</span>
    </Transition>
  </div>
</template>

<script setup>
const props = defineProps({
  // Rotating captions; defaults speak to the product-market search.
  messages: {
    type: Array,
    default: () => [
      'Buscando en todo el mercado…',
      'Comparando precios en tiendas de USA…',
      'Filtrando las mejores opciones…',
      'Casi listo…',
    ],
  },
})

const i = ref(0)
const caption = computed(() => props.messages[i.value] || props.messages[0])
let timer = null
onMounted(() => {
  const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (reduce || props.messages.length < 2) return
  timer = setInterval(() => { i.value = (i.value + 1) % props.messages.length }, 1900)
})
onBeforeUnmount(() => { if (timer) clearInterval(timer) })
</script>

<style scoped>
.box { animation: float 2.6s ease-in-out infinite; transform-origin: 50% 55%; }
@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50%      { transform: translateY(-3px) rotate(-4deg); }
}

/* Soft yellow halo that breathes behind the box. */
.glow {
  position: absolute;
  inset: -28%;
  border-radius: 9999px;
  background: radial-gradient(circle, rgba(254, 205, 4, 0.55), rgba(254, 205, 4, 0) 68%);
  filter: blur(2px);
  animation: glowpulse 2.6s ease-in-out infinite;
}
@keyframes glowpulse {
  0%, 100% { transform: scale(0.8);  opacity: 0.45; }
  50%      { transform: scale(1.12); opacity: 0.9; }
}

/* Speed lines streak in from the left, staggered, like the box is zooming. */
.streak {
  stroke-dasharray: 80;
  stroke-dashoffset: 80;
  animation: streak 1.5s ease-in-out infinite;
}
.streak-2 { animation-delay: 0.18s; }
.streak-3 { animation-delay: 0.36s; }
@keyframes streak {
  0%       { stroke-dashoffset: 80; opacity: 0; }
  35%      { stroke-dashoffset: 0;  opacity: 1; }
  70%      { stroke-dashoffset: 0;  opacity: 1; }
  100%     { stroke-dashoffset: -40; opacity: 0; }
}

/* Caption crossfade */
.cap-enter-active, .cap-leave-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.cap-enter-from { opacity: 0; transform: translateY(4px); }
.cap-leave-to   { opacity: 0; transform: translateY(-4px); }

@media (prefers-reduced-motion: reduce) {
  .box, .glow, .streak { animation: none; }
  .streak { stroke-dashoffset: 0; opacity: 1; }
}
</style>
