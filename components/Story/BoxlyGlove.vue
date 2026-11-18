<template>
  <!-- One of Boxly's white gloves, centred on the wrist: open, thumb (Erick's thumbs up) or fist (holding / on the hip).
       The left glove is the right one mirrored. -->
  <g :transform="side === 'L' ? 'scale(-1 1)' : undefined">
    <!-- cuff -->
    <ellipse cx="0" cy="8" rx="9" ry="5" fill="#FFFDF6" stroke="#D8D2C2" stroke-width="1.5" />
    <g v-if="pose === 'open'">
      <rect x="-3" y="-30" width="6.5" height="16" rx="3.2" class="g" />
      <rect x="4" y="-28" width="6.5" height="15" rx="3.2" class="g" />
      <rect x="-10" y="-27" width="6.5" height="15" rx="3.2" class="g" />
      <rect x="10.5" y="-22" width="6" height="12" rx="3" class="g" />
      <rect x="-11" y="-18" width="23" height="22" rx="9" class="g" />
      <rect x="-19" y="-12" width="12" height="7" rx="3.5" class="g" transform="rotate(-25 -13 -8)" />
    </g>
    <g v-else-if="pose === 'thumb'">
      <rect x="-12" y="-14" width="25" height="20" rx="9" class="g" />
      <path d="M-11 -6 H10 M-11 0 H10" stroke="#D8D2C2" stroke-width="1.4" />
      <rect x="-9" y="-33" width="9" height="22" rx="4.5" class="g" />
    </g>
    <g v-else>
      <rect x="-12" y="-14" width="25" height="21" rx="9.5" class="g" />
      <path d="M-11 -7 H10 M-11 -1 H10" stroke="#D8D2C2" stroke-width="1.4" />
      <rect x="-15" y="-10" width="9" height="12" rx="4.5" class="g" />
    </g>
  </g>
</template>

<script setup>
defineProps({ pose: { type: String, default: 'open' }, side: { type: String, default: 'R' } })
</script>

<style scoped>
.g { fill: #FFFDF6; stroke: #D8D2C2; stroke-width: 1.5; }
</style>
