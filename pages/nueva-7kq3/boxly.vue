<template>
  <!-- HIDDEN landing rework (2026-11-18): the team reviews the new scroll story here before it replaces /. noindex, not in
       the sitemap. Step 2 = the Boxly rig test bench (docs/landing-storyboard.md). -->
  <main class="min-h-screen bg-[#F4F7FC] text-[#0C254C]">
    <div class="max-w-3xl mx-auto px-4 py-10">
      <p class="text-xs font-bold tracking-widest text-[#2E6BB7] uppercase">Boxly · página nueva (oculta)</p>
      <h1 class="mt-2 text-3xl font-extrabold">Boxly — prueba del personaje</h1>
      <p class="mt-2 text-gray-600">Los movimientos de Boxly para la nueva página. Toca un botón para verlo.</p>
      <div class="mt-6 grid md:grid-cols-[1fr_220px] gap-6 items-center">
        <div class="rounded-3xl bg-white shadow-sm ring-1 ring-black/5 p-6">
          <div class="mx-auto max-w-[360px]"><BoxlyMascot ref="boxly" /></div>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-1 gap-2">
          <button v-for="m in moves" :key="m.id" type="button" @click="boxly?.play(m.id)"
                  class="rounded-xl bg-[#0C254C] text-white px-4 py-2.5 text-sm font-semibold hover:bg-[#14306A] active:scale-[.98] transition">
            {{ m.label }}
          </button>
        </div>
      </div>
      <p class="mt-6 text-xs text-gray-500">Basado en el diseño de Erick. Cubo cerrado; las cejas llevan el ánimo.</p>
    </div>
  </main>
</template>

<script setup>
import BoxlyMascot from '~/components/Story/BoxlyMascot.vue'

definePageMeta({ layout: 'empty' })
useHead({ title: 'Boxly', meta: [{ name: 'robots', content: 'noindex, nofollow' }] })
const boxly = ref(null)
const moves = [
  { id: 'wave', label: '👋 Saludar' },
  { id: 'scan', label: '📦 Escanear' },
  { id: 'lift', label: '💪 Cargar' },
  { id: 'hmm', label: '🤔 Pensar' },
  { id: 'thumbs', label: '👍 Pulgar arriba + guiño' },
  { id: 'hop', label: '⤴️ Saltar' },
]
</script>
