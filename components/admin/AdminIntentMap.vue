<template>
  <div>
    <div v-if="!clusters.length" class="py-16 text-center text-sm text-gray-400">
      Aún no hay suficientes consultas para mapear la intención. Aparecerá aquí cuando la gente use el asistente.
    </div>

    <div v-else class="grid lg:grid-cols-3 gap-5">
      <!-- Graph -->
      <div class="lg:col-span-2">
        <svg :viewBox="`0 0 ${W} ${H}`" class="w-full h-auto select-none" role="img" aria-label="Mapa de intención">
          <!-- edges -->
          <line v-for="n in nodes" :key="'e' + n.label" :x1="CX" :y1="CY" :x2="n.x" :y2="n.y"
            :stroke="n.intent === 'shopping' ? '#c7d2fe' : '#a7f3d0'" :stroke-width="selected && selected.label === n.label ? 3 : 1.5" />

          <!-- center -->
          <circle :cx="CX" :cy="CY" r="34" fill="#111827" />
          <text :x="CX" :y="CY - 2" text-anchor="middle" class="fill-white font-bold" style="font-size:13px">Boxly</text>
          <text :x="CX" :y="CY + 13" text-anchor="middle" class="fill-gray-400" style="font-size:9px">{{ total }} consultas</text>

          <!-- cluster nodes -->
          <g v-for="n in nodes" :key="n.label" class="cursor-pointer" @click="select(n)">
            <circle :cx="n.x" :cy="n.y" :r="n.r"
              :fill="n.intent === 'shopping' ? '#6366f1' : '#10b981'"
              :opacity="!selected || selected.label === n.label ? 1 : 0.45"
              :stroke="selected && selected.label === n.label ? '#111827' : 'white'"
              :stroke-width="selected && selected.label === n.label ? 3 : 2" />
            <text :x="n.x" :y="n.y + 1" text-anchor="middle" class="fill-white font-bold pointer-events-none" :style="`font-size:${Math.min(15, n.r * 0.7)}px`">{{ n.emoji }}</text>
            <text :x="n.x" :y="n.y + n.r + 13" text-anchor="middle" class="fill-gray-700 font-semibold pointer-events-none" style="font-size:11px">{{ trunc(n.label) }}</text>
            <text :x="n.x" :y="n.y + n.r + 25" text-anchor="middle" class="fill-gray-400 pointer-events-none" style="font-size:10px">{{ n.total }}</text>
          </g>
        </svg>
        <div class="flex items-center justify-center gap-5 text-xs text-gray-500 mt-1">
          <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full" style="background:#6366f1"></span>Intención de compra</span>
          <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full" style="background:#10b981"></span>Preguntas / aprender</span>
        </div>
      </div>

      <!-- Drill-down -->
      <div class="bg-gray-50 rounded-2xl border border-gray-100 p-4">
        <div v-if="selected">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-lg">{{ selected.emoji }}</span>
            <h3 class="font-bold text-gray-900">{{ selected.label }}</h3>
          </div>
          <p class="text-xs text-gray-400 mb-3">{{ selected.total }} consultas · {{ selected.intent === 'shopping' ? 'compra' : 'pregunta' }}</p>
          <ul class="space-y-1.5 max-h-72 overflow-y-auto">
            <li v-for="(q, i) in selected.queries.slice(0, 20)" :key="i" class="flex items-center justify-between gap-2 text-sm">
              <span class="flex items-center gap-1.5 min-w-0">
                <span class="shrink-0 text-[10px]">{{ q.type === 'question' ? '💬' : '🛍️' }}</span>
                <span class="text-gray-700 truncate">{{ q.q }}</span>
              </span>
              <span class="shrink-0 font-bold text-gray-900">{{ q.c }}</span>
            </li>
          </ul>
        </div>
        <p v-else class="text-sm text-gray-400 py-10 text-center">Toca un tema para ver las consultas reales que la gente hizo.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({ clusters: { type: Array, default: () => [] } })

const W = 820, H = 470, CX = 380, CY = 235, R = 165

const total = computed(() => props.clusters.reduce((s, c) => s + (c.total || 0), 0))
const maxTotal = computed(() => Math.max(1, ...props.clusters.map((c) => c.total || 0)))
const rNode = (t) => 16 + Math.sqrt((t || 0) / maxTotal.value) * 30

function arc(arr, a0, a1) {
  return arr.map((c, i) => {
    const t = arr.length === 1 ? (a0 + a1) / 2 : a0 + (a1 - a0) * i / (arr.length - 1)
    const rad = t * Math.PI / 180
    return { ...c, x: CX + R * Math.cos(rad), y: CY + R * Math.sin(rad), r: rNode(c.total) }
  })
}
const nodes = computed(() => {
  const shop = props.clusters.filter((c) => c.intent === 'shopping')
  const learn = props.clusters.filter((c) => c.intent !== 'shopping')
  return [...arc(shop, 108, 252), ...arc(learn, -72, 72)]
})

const selected = ref(null)
function select(n) { selected.value = n }
function trunc(s) { return (s || '').length > 18 ? (s.slice(0, 17) + '…') : s }

// Default to the biggest theme so the panel isn't empty.
watch(() => props.clusters, () => {
  selected.value = nodes.value.length ? nodes.value.slice().sort((a, b) => b.total - a.total)[0] : null
}, { immediate: true })
</script>
