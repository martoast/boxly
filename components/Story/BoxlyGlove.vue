<template>
  <!-- One of Boxly's puffy white mitts, centred on the wrist, with a cuff ring: open, thumb (Erick's thumbs up: a fat thumb on
       a round fist) or fist (holding / on the hip). The left glove is the right one mirrored. -->
  <g :transform="side === 'L' ? 'scale(-1 1)' : undefined">
    <g v-if="pose === 'open'">
      <ellipse cx="-11" cy="-30" rx="6.5" ry="10" class="g" transform="rotate(-14 -11 -30)" />
      <ellipse cx="0" cy="-34" rx="6.5" ry="11" class="g" />
      <ellipse cx="11" cy="-30" rx="6.5" ry="10" class="g" transform="rotate(14 11 -30)" />
      <ellipse cx="0" cy="-15" rx="17" ry="15" class="g" />
      <ellipse cx="-17" cy="-12" rx="6.5" ry="9" class="g" transform="rotate(-40 -17 -12)" />
    </g>
    <g v-else-if="pose === 'thumb'">
      <circle cx="0" cy="-14" r="16.5" class="g" />
      <path d="M-12 -18 Q-2 -14 8 -19 M-12 -10 Q-2 -6 9 -11" stroke="#E4DECF" stroke-width="2" fill="none" stroke-linecap="round" />
      <rect x="-12" y="-46" width="13" height="28" rx="6.5" class="g" />
    </g>
    <g v-else>
      <circle cx="0" cy="-14" r="16.5" class="g" />
      <path d="M-12 -18 Q-2 -14 8 -19 M-12 -10 Q-2 -6 9 -11" stroke="#E4DECF" stroke-width="2" fill="none" stroke-linecap="round" />
      <ellipse cx="-14" cy="-10" rx="7" ry="8.5" class="g" />
    </g>
    <!-- the cuff ring at the wrist -->
    <ellipse cx="0" cy="2" rx="14" ry="7" fill="#FFFDF6" stroke="#D8D2C2" stroke-width="1.8" />
  </g>
</template>

<script setup>
defineProps({ pose: { type: String, default: 'open' }, side: { type: String, default: 'R' } })
</script>

<style scoped>
.g { fill: #FFFDF6; stroke: #D8D2C2; stroke-width: 1.8; }
</style>
