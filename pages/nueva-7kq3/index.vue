<template>
  <!-- HIDDEN landing rework (2026-11-18): the new scroll story, reviewed here before it replaces /. noindex, not in the
       sitemap. docs/landing-storyboard.md. The Boxly character bench is at /nueva-7kq3/boxly. -->
  <main class="bg-[#EAF2FC]">
    <StoryStage />
    <section class="bg-white px-5 py-20 text-center text-[#0C254C]">
      <h2 class="text-3xl md:text-4xl font-black">Compra en USA como si vivieras allá.</h2>
      <p class="mt-3 text-gray-600">Precios por tamaño de caja, tiendas, opiniones y preguntas frecuentes llegan en el siguiente paso.</p>
      <NuxtLink to="/register" class="inline-flex mt-6 px-6 py-3 rounded-2xl font-extrabold bg-[#FECD04] text-[#0C254C]">Empieza a comprar →</NuxtLink>
      <p class="mt-10 text-xs text-gray-400">Las marcas mostradas pertenecen a sus respectivos dueños. Boxly no está afiliado con ellas.</p>
    </section>
  </main>
</template>

<script setup>
import StoryStage from '~/components/Story/StoryStage.vue'

definePageMeta({ layout: 'empty' })
useHead({ title: 'Boxly — Compra en cualquier tienda de EE.UU.', meta: [{ name: 'robots', content: 'noindex, nofollow' }] })
</script>
