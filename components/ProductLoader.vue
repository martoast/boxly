<template>
  <Teleport to="body">
    <Transition name="pl-fade">
      <div v-if="show" class="fixed inset-0 z-[1200] overflow-hidden bg-gradient-to-br from-white via-primary-50/40 to-primary-100/50">
        <!-- drifting gradient blobs -->
        <div class="blob blob-a"></div>
        <div class="blob blob-b"></div>
        <div class="blob blob-c"></div>

        <!-- floating parcels in the background -->
        <span v-for="b in boxes" :key="b.id" class="box" :style="b.style">📦</span>

        <!-- center stage -->
        <div class="relative h-full flex flex-col items-center justify-center px-8 text-center">
          <!-- logo + orbiting ring -->
          <div class="relative w-32 h-32 grid place-items-center">
            <svg class="absolute inset-0 w-full h-full ring-spin" viewBox="0 0 120 120" fill="none">
              <circle cx="60" cy="60" r="54" stroke="currentColor" class="text-primary-200" stroke-width="3" stroke-dasharray="6 10" stroke-linecap="round" />
            </svg>
            <svg class="absolute inset-0 w-full h-full ring-spin-rev" viewBox="0 0 120 120" fill="none">
              <circle cx="60" cy="60" r="44" stroke="currentColor" class="text-primary-400" stroke-width="3" stroke-dasharray="40 160" stroke-linecap="round" />
            </svg>
            <!-- orbiting dots -->
            <span class="orbit"><span class="orbit-dot"></span></span>
            <span class="orbit orbit-2"><span class="orbit-dot orbit-dot-2"></span></span>
            <div class="logo-pulse w-20 h-20 rounded-2xl bg-white shadow-lg shadow-primary-500/20 grid place-items-center">
              <img src="/logo.svg" alt="Boxly" class="w-14 h-14" />
            </div>
          </div>

          <!-- rotating status line -->
          <div class="mt-8 h-7 relative w-full max-w-xs">
            <Transition name="pl-status">
              <p :key="stepIndex" class="absolute inset-x-0 text-[15px] font-semibold text-gray-700 flex items-center justify-center gap-2">
                <span class="text-lg">{{ steps[stepIndex].icon }}</span>
                {{ steps[stepIndex].text }}
              </p>
            </Transition>
          </div>

          <!-- progress bar -->
          <div class="mt-4 w-56 h-1.5 rounded-full bg-primary-100 overflow-hidden">
            <div class="h-full rounded-full bg-gradient-to-r from-primary-400 to-primary-600 transition-[width] duration-300 ease-out" :style="{ width: progress + '%' }"></div>
          </div>
          <p class="mt-3 text-[12px] text-gray-400">Boxly está reuniendo todo el producto…</p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
const props = defineProps({ show: { type: Boolean, default: false } })

const steps = [
  { icon: '🔎', text: 'Encontrando tu producto…' },
  { icon: '🖼️', text: 'Trayendo fotos y detalles…' },
  { icon: '📏', text: 'Revisando tallas y disponibilidad…' },
  { icon: '🏷️', text: 'Calculando el precio de tienda…' },
  { icon: '✨', text: 'Casi listo…' },
]
const stepIndex = ref(0)
const progress = ref(8)

// Decorative floating parcels with randomized but deterministic-per-mount paths.
const boxes = Array.from({ length: 9 }, (_, i) => {
  const left = (i * 11 + 5) % 95
  const delay = (i * 0.7) % 6
  const dur = 7 + (i % 4) * 2
  const size = 18 + (i % 3) * 10
  return {
    id: i,
    style: {
      left: left + '%',
      fontSize: size + 'px',
      animationDelay: `-${delay}s`,
      animationDuration: `${dur}s`,
      opacity: 0.12 + (i % 3) * 0.05,
    },
  }
})

let stepTimer = null
let progTimer = null

function start() {
  if (!import.meta.client) return // never run timers during SSR
  stepIndex.value = 0
  progress.value = 8
  stepTimer = setInterval(() => {
    stepIndex.value = (stepIndex.value + 1) % steps.length
  }, 1300)
  // Ease toward 90% so it always feels alive; the parent completing hides it.
  progTimer = setInterval(() => {
    progress.value = Math.min(90, progress.value + Math.max(1, (90 - progress.value) * 0.12))
  }, 220)
}
function stop() {
  clearInterval(stepTimer); stepTimer = null
  clearInterval(progTimer); progTimer = null
}

watch(() => props.show, (v) => {
  if (v) start()
  else { progress.value = 100; stop() }
}, { immediate: true })
onBeforeUnmount(stop)
</script>

<style scoped>
.pl-fade-enter-from, .pl-fade-leave-to { opacity: 0; }
.pl-fade-enter-active { transition: opacity .2s ease; }
.pl-fade-leave-active { transition: opacity .35s ease; }

.pl-status-enter-from { opacity: 0; transform: translateY(8px); }
.pl-status-leave-to { opacity: 0; transform: translateY(-8px); }
.pl-status-enter-active, .pl-status-leave-active { transition: opacity .3s ease, transform .3s ease; }

/* logo pulse */
.logo-pulse { animation: logo-pulse 1.8s ease-in-out infinite; }
@keyframes logo-pulse {
  0%, 100% { transform: scale(1); box-shadow: 0 10px 25px -8px rgba(99,102,241,.25); }
  50%      { transform: scale(1.06); box-shadow: 0 18px 40px -8px rgba(99,102,241,.45); }
}

/* spinning rings */
.ring-spin { animation: spin 6s linear infinite; }
.ring-spin-rev { animation: spin 3.5s linear infinite reverse; }
@keyframes spin { to { transform: rotate(360deg); } }

/* orbiting dots */
.orbit { position: absolute; inset: 0; animation: spin 2.8s linear infinite; }
.orbit-2 { animation: spin 4.2s linear infinite reverse; }
.orbit-dot { position: absolute; top: -2px; left: 50%; width: 10px; height: 10px; margin-left: -5px; border-radius: 9999px; background: rgb(129 140 248); box-shadow: 0 0 12px rgb(129 140 248); }
.orbit-dot-2 { background: rgb(99 102 241); width: 7px; height: 7px; margin-left: -3.5px; }

/* drifting parcels */
.box { position: absolute; bottom: -10%; animation-name: rise; animation-timing-function: linear; animation-iteration-count: infinite; will-change: transform; }
@keyframes rise {
  0%   { transform: translateY(0) rotate(0deg); }
  100% { transform: translateY(-115vh) rotate(220deg); }
}

/* gradient blobs */
.blob { position: absolute; border-radius: 9999px; filter: blur(60px); opacity: .5; will-change: transform; }
.blob-a { width: 380px; height: 380px; background: rgba(165,180,252,.55); top: -80px; left: -60px; animation: drift-a 14s ease-in-out infinite; }
.blob-b { width: 320px; height: 320px; background: rgba(196,181,253,.5); bottom: -60px; right: -40px; animation: drift-b 16s ease-in-out infinite; }
.blob-c { width: 260px; height: 260px; background: rgba(199,210,254,.55); top: 40%; left: 55%; animation: drift-a 12s ease-in-out infinite reverse; }
@keyframes drift-a { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(40px,30px) scale(1.12); } }
@keyframes drift-b { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-50px,-25px) scale(1.08); } }

@media (prefers-reduced-motion: reduce) {
  .logo-pulse, .ring-spin, .ring-spin-rev, .orbit, .orbit-2, .box, .blob { animation: none; }
}
</style>
