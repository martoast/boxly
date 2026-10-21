<template>
  <!-- Reserve a personal-shopping hour at Las Américas: an intro that sells the session, then
       day -> hour (+ how many hours) -> stores -> what they want -> pay on Stripe.
       Nothing is held until the payment is confirmed (first payment wins), see the API plan. -->
  <section class="min-h-screen bg-gray-50 pb-16">
    <div class="max-w-2xl mx-auto px-4 pt-5 space-y-4">
      <div v-if="showCancelledBanner(route.query.cancelled)" class="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-sm text-amber-900">
        <template v-if="isLegacyCancel(route.query)">{{ t.legacyCancelled }} <NuxtLink to="/app/purchase-requests" class="font-semibold underline">{{ t.legacyLink }}</NuxtLink></template>
        <template v-else>{{ t.cancelled }}</template>
      </div>

      <!-- ============ INTRO ============ -->
      <div>
        <div class="flex items-center gap-2">
          <NuxtLink :to="backTo" class="p-2 -ml-2 hover:bg-gray-100 rounded-lg" :aria-label="t.back">
            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
          </NuxtLink>
          <span class="rounded-full bg-primary-50 px-2.5 py-1 text-[10.5px] sm:text-[11.5px] font-bold uppercase sm:tracking-wide text-primary-700 truncate">{{ t.eyebrow }}</span>
          <div class="ml-auto flex-shrink-0"><TutorialVideoButton loom-id="01640d8214164acd9f21f37c8fdd3cd6" variant="video" /></div>
        </div>
        <h1 class="mt-3 text-[27px] sm:text-[32px] font-extrabold tracking-tight text-gray-900 leading-[1.12]">{{ t.title1 }}<br>{{ t.title2 }}</h1>
        <p class="mt-2.5 text-[15px] text-gray-500 leading-relaxed">{{ t.subtitle }}</p>

        <!-- The photo IS the video entry point. -->
        <TutorialVideoButton loom-id="01640d8214164acd9f21f37c8fdd3cd6" trigger-class="group relative mt-4 block w-full overflow-hidden rounded-3xl text-left">
          <img src="/images/step-inperson-2-shopping.webp" alt="" width="1200" height="896" class="w-full aspect-[4/3] sm:aspect-[16/9] object-cover transition-transform duration-500 group-hover:scale-[1.02]">
          <span class="absolute inset-x-3 bottom-3 flex items-center gap-3 rounded-2xl bg-gray-900/75 backdrop-blur px-3.5 py-3 text-white">
            <span class="grid place-items-center w-10 h-10 rounded-full bg-white text-gray-900 flex-shrink-0">
              <svg class="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </span>
            <span class="flex-1 min-w-0">
              <span class="block text-[15px] font-semibold leading-tight">{{ t.watchTitle }}</span>
              <span class="block text-[12.5px] text-white/75 leading-snug">{{ t.watchSub }}</span>
            </span>
            <svg class="w-4 h-4 text-white/80 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
          </span>
        </TutorialVideoButton>

        <div class="mt-4 grid grid-cols-3 gap-2 text-center">
          <div v-for="f in features" :key="f.label" class="flex flex-col items-center gap-1.5 px-1">
            <svg :class="['w-7 h-7', f.green ? 'text-green-600' : 'text-gray-700']" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" :d="f.icon"/></svg>
            <span class="text-[12.5px] font-medium text-gray-700 leading-tight">{{ f.label }}</span>
          </div>
        </div>
      </div>

      <!-- Stores -->
      <div class="rounded-3xl bg-white border border-gray-100 p-5">
        <h2 class="text-[17px] font-bold text-gray-900">{{ t.storesTitle }}</h2>
        <p class="mt-0.5 text-[13.5px] text-gray-500">{{ t.storesSub }}</p>
        <div class="mt-3.5 grid grid-cols-3 gap-2.5">
          <div v-for="s in FEATURED_STORES" :key="s.name" class="rounded-2xl border border-gray-100 overflow-hidden flex flex-col">
            <img v-if="s.img" :src="s.img" alt="" class="w-full aspect-[4/3] object-cover">
            <span v-else class="grid place-items-center aspect-[4/3] px-1 overflow-hidden"><span class="inline-block scale-[.74] sm:scale-90 whitespace-nowrap" :class="s.mark" :style="s.style">{{ s.wordmark }}</span></span>
            <span class="px-1.5 py-2 text-center text-[12px] font-medium text-gray-700 leading-tight">{{ s.name }}</span>
          </div>
        </div>
        <button v-if="extraStores.length" type="button" class="mt-3.5 w-full text-center text-[14px] font-semibold text-primary-700 hover:text-primary-800" @click="showAllStores = !showAllStores">
          {{ showAllStores ? t.hideStores : t.allStores }} {{ showAllStores ? '↑' : '→' }}
        </button>
        <div v-if="showAllStores" class="mt-3 flex flex-wrap gap-1.5">
          <span v-for="n in extraStores" :key="n" class="rounded-full bg-gray-100 px-2.5 py-1 text-[12.5px] text-gray-700">{{ n }}</span>
        </div>
      </div>

      <!-- How it works -->
      <div class="rounded-3xl bg-white border border-gray-100 p-5">
        <h2 class="text-[17px] font-bold text-gray-900">{{ t.howTitle }}</h2>
        <ol class="mt-4 space-y-4">
          <li v-for="(s, i) in howSteps" :key="i" class="relative flex items-start gap-3">
            <span v-if="i < howSteps.length - 1" class="absolute left-[13px] top-7 -bottom-4 w-0.5 bg-primary-200" aria-hidden="true"></span>
            <span class="relative grid place-items-center w-7 h-7 rounded-full bg-primary-600 text-white text-[13px] font-bold flex-shrink-0">{{ i + 1 }}</span>
            <span class="grid place-items-center w-10 h-10 rounded-full bg-primary-50 text-primary-700 flex-shrink-0 -mt-1.5">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.7" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" :d="s.icon"/></svg>
            </span>
            <span class="min-w-0">
              <span class="block text-[15px] font-semibold text-gray-900 leading-tight">{{ s.title }}</span>
              <span class="block mt-0.5 text-[13.5px] text-gray-500 leading-snug">{{ s.desc }}</span>
            </span>
          </li>
        </ol>
        <button type="button" class="mt-5 w-full rounded-2xl bg-primary-600 hover:bg-primary-700 text-white py-3.5 text-[16px] font-semibold transition-colors" @click="scrollToBooking">
          {{ t.bookCta }} →
        </button>
      </div>

      <!-- ============ BOOKING ============ -->
      <div id="reservar" class="scroll-mt-20 space-y-4">
        <div v-if="error" class="p-4 rounded-2xl bg-red-50 border border-red-200 text-sm text-red-800">{{ error }}</div>

        <div v-if="loading" class="rounded-3xl bg-white border border-gray-100 py-12 text-center text-gray-500 text-sm">{{ t.loading }}</div>

        <!-- No availability: never a dead end -->
        <div v-else-if="days.length === 0" class="rounded-3xl bg-white border border-gray-100 p-8 text-center">
          <p class="text-gray-900 font-semibold">{{ t.noneTitle }}</p>
          <p class="text-sm text-gray-500 mt-1 mb-4">{{ t.noneDesc }}</p>
          <InPersonWhatsApp inline />
        </div>

        <template v-else>
          <!-- 1) day: only the days that have open hours -->
          <div class="rounded-3xl bg-white border border-gray-100 p-5">
            <InPersonStepHead :n="1" :title="t.step1" :sub="t.step1Sub" />
            <div class="mt-4 grid grid-cols-5 gap-2">
              <button v-for="d in visibleDays" :key="d.date" type="button" @click="pickDate(d.date)"
                :class="['py-2.5 rounded-2xl border-2 text-center transition', date === d.date ? 'border-primary-600 bg-primary-50/60 text-primary-800' : 'border-gray-200 bg-white text-gray-800 hover:border-primary-300']">
                <span class="block text-[11px] uppercase font-semibold">{{ fmt(d.date, { weekday: 'short' }).replace('.', '') }}</span>
                <span class="block text-[22px] font-bold leading-tight">{{ fmt(d.date, { day: 'numeric' }) }}</span>
                <span class="block text-[11.5px]">{{ fmt(d.date, { month: 'short' }).replace('.', '') }}</span>
              </button>
            </div>
            <button v-if="openDays.length > DAYS_SHOWN" type="button" class="mt-3.5 w-full inline-flex items-center justify-center gap-1.5 text-[14px] font-semibold text-primary-700 hover:text-primary-800" @click="showAllDays = !showAllDays">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15" rx="2"/><path stroke-linecap="round" d="M3.5 10h17M8 3v4M16 3v4"/></svg>
              {{ showAllDays ? t.fewerDates : t.moreDates }} {{ showAllDays ? '↑' : '→' }}
            </button>
          </div>

          <!-- 2) hour + how many hours -->
          <div class="rounded-3xl bg-white border border-gray-100 p-5">
            <InPersonStepHead :n="2" :title="t.step2" :sub="t.tz" />
            <p v-if="!day" class="mt-3 text-[13.5px] text-gray-400">{{ t.pickDayFirst }}</p>
            <template v-else>
              <div class="mt-4 grid grid-cols-4 gap-2">
                <button v-for="s in day.slots" :key="s.id" type="button" @click="pickSlot(s)"
                  :class="['py-2.5 rounded-2xl border-2 text-center transition', start === s.start_time.substring(0, 5) ? 'border-primary-600 bg-primary-50/60 text-primary-800' : 'border-gray-200 bg-white text-gray-800 hover:border-primary-300']">
                  <span class="block text-[16px] font-bold leading-tight">{{ clock(s.start_time).time }}</span>
                  <span class="block text-[11.5px] text-gray-500">{{ clock(s.start_time).ampm }}</span>
                </button>
              </div>
              <div v-if="slot" class="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-gray-50 px-4 py-3">
                <span class="min-w-0">
                  <span class="block text-[14px] font-semibold text-gray-900">{{ t.howMany }}</span>
                  <span class="block text-[12px] text-gray-500">{{ t.max(maxHours) }}</span>
                </span>
                <span class="flex items-center gap-2 flex-shrink-0">
                  <button type="button" @click="hours--" :disabled="hours <= 1" class="w-9 h-9 rounded-full border border-gray-300 bg-white text-lg font-bold text-gray-700 disabled:opacity-30" :aria-label="t.less">−</button>
                  <span class="text-[18px] font-extrabold text-gray-900 w-8 text-center tabular-nums">{{ hours }}</span>
                  <button type="button" @click="hours++" :disabled="hours >= maxHours" class="w-9 h-9 rounded-full border border-gray-300 bg-white text-lg font-bold text-gray-700 disabled:opacity-30" :aria-label="t.more">+</button>
                </span>
              </div>
            </template>
          </div>

          <!-- 3) stores -->
          <div class="rounded-3xl bg-white border border-gray-100 p-5">
            <InPersonStepHead :n="3" :title="t.step3" :sub="t.step3Sub" />
            <div class="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <button v-for="s in FEATURED_STORES" :key="s.name" type="button" @click="toggleStore(s.name)" :aria-pressed="stores.includes(s.name)"
                :class="['relative rounded-2xl border-2 overflow-hidden text-left transition flex flex-col', stores.includes(s.name) ? 'border-primary-600' : 'border-gray-200 hover:border-primary-300']">
                <img v-if="s.img" :src="s.img" alt="" class="w-full aspect-[16/10] object-cover">
                <span v-else class="grid place-items-center aspect-[16/10] px-2"><span :class="s.mark" :style="s.style">{{ s.wordmark }}</span></span>
                <span class="px-2 py-2 text-center text-[13px] font-semibold text-gray-800 leading-tight">{{ s.name }}</span>
                <span :class="['absolute top-2 right-2 grid place-items-center w-6 h-6 rounded-full border-2 transition', stores.includes(s.name) ? 'bg-primary-600 border-primary-600 text-white' : 'bg-white/90 border-gray-300 text-transparent']">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                </span>
              </button>
            </div>
            <!-- Every other store at the outlets, from the stores table. -->
            <template v-if="extraStores.length">
              <button type="button" class="mt-3.5 w-full text-center text-[14px] font-semibold text-primary-700 hover:text-primary-800" @click="showMoreStorePicks = !showMoreStorePicks">
                {{ showMoreStorePicks ? t.hideStores : t.otherStores }} {{ showMoreStorePicks ? '↑' : '→' }}
              </button>
              <div v-if="showMoreStorePicks" class="mt-3 flex flex-wrap gap-1.5">
                <button v-for="n in extraStores" :key="n" type="button" @click="toggleStore(n)" :aria-pressed="stores.includes(n)"
                  :class="['rounded-full px-3 py-1.5 text-[13px] border transition', stores.includes(n) ? 'bg-primary-600 border-primary-600 text-white' : 'bg-white border-gray-200 text-gray-700 hover:border-primary-300']">{{ n }}</button>
              </div>
            </template>
          </div>

          <!-- 4) what they're looking for -->
          <div class="rounded-3xl bg-white border border-gray-100 p-5">
            <InPersonStepHead :n="4" :title="t.step4" :optional="t.optional" :sub="t.step4Sub" />
            <div class="mt-4 relative">
              <textarea v-model="notes" rows="4" :maxlength="NOTES_MAX" :placeholder="t.notesPlaceholder"
                class="w-full rounded-2xl border-gray-200 text-[15px] placeholder-gray-400 focus:border-primary-500 focus:ring-primary-500 pb-7"></textarea>
              <span class="absolute right-3 bottom-3 text-[11.5px] text-gray-400 tabular-nums">{{ notes.length }}/{{ NOTES_MAX }}</span>
            </div>
            <p class="mt-2 text-[12.5px] text-gray-500">{{ t.photosHint }}</p>
          </div>

          <!-- 5) summary + pay -->
          <div class="rounded-3xl bg-white border border-gray-100 p-5">
            <InPersonStepHead :n="5" :title="t.step5" :sub="t.step5Sub" />
            <p v-if="slot" class="mt-4 text-[14px] text-gray-800 leading-relaxed">{{ t.summary(longDate, formatTime(start, language), formatTime(endTime(start, hours), language), hours) }}</p>
            <div class="mt-3 rounded-2xl border border-gray-200 divide-y divide-gray-100">
              <div class="flex items-center justify-between px-4 py-3 text-[14.5px]">
                <span class="text-gray-700">{{ t.firstHour }}</span>
                <span class="font-bold text-gray-900">{{ rate ? `$${rate} USD` : '—' }}</span>
              </div>
              <div v-if="rate" class="flex items-center justify-between px-4 py-3 text-[14.5px]">
                <span class="text-gray-700">{{ t.extraHours }}</span>
                <span class="font-bold text-gray-900">${{ rate }} USD/h</span>
              </div>
              <div class="flex items-center justify-between px-4 py-3 text-[14.5px]">
                <span class="text-gray-700">{{ t.commission }}</span>
                <span class="font-bold text-gray-900">{{ commission }}%</span>
              </div>
            </div>
            <p class="mt-3 flex items-start gap-2 text-[12.5px] text-gray-500 leading-snug">
              <svg class="w-4 h-4 flex-shrink-0 mt-px" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path stroke-linecap="round" d="M12 11v5M12 8h.01"/></svg>
              {{ t.payNote(rate) }}
            </p>
            <button type="button" @click="submit" :disabled="submitting || !slot"
              class="mt-4 w-full py-3.5 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white text-[16px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {{ submitting ? t.redirecting : slot ? t.confirm : t.pickFirst }}
            </button>
            <p class="mt-2.5 text-center text-[12.5px] text-gray-500">{{ t.afterNote }}</p>
          </div>

          <div class="flex justify-center pt-1"><InPersonWhatsApp inline /></div>
        </template>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { hourOptions, endTime, formatTime, parseDate, readLimits } from '~/utils/inPersonSlots'
import { showCancelledBanner, isLegacyCancel } from '~/utils/inPersonSuccess'

definePageMeta({
  layout: 'app',
  middleware: ['auth', 'customer', 'complete-profile'],
})

const { $customFetch } = useNuxtApp()
const { t: createTranslations, language } = useLanguage()
const route = useRoute()
const { date, start, hours, notes, reset } = useInPersonRequest()

const backTo = computed(() => (typeof route.query.from === 'string' ? route.query.from : '/app/purchase-requests'))

const t = createTranslations({
  back: { es: 'Volver', en: 'Back' },
  eyebrow: { es: 'Shopper en San Diego', en: 'Shopper in San Diego' },
  title1: { es: 'Tu shopper en USA.', en: 'Your shopper in the US.' },
  title2: { es: 'Tú eliges desde México.', en: 'You choose from Mexico.' },
  subtitle: { es: 'Recibe fotos, videos y precios de las tiendas en tiempo real. Elige lo que te gusta por WhatsApp y nosotros compramos por ti.', en: 'Get photos, videos and prices from the stores in real time. Pick what you like on WhatsApp and we buy it for you.' },
  watchTitle: { es: 'Mira cómo funciona', en: 'See how it works' },
  watchSub: { es: 'Un ejemplo real de una sesión de compras', en: 'A real example of a shopping session' },
  featPhotos: { es: 'Fotos y videos en tiempo real', en: 'Live photos and videos' },
  featWhatsApp: { es: 'Por WhatsApp', en: 'Over WhatsApp' },
  featShipping: { es: 'Envíos a México', en: 'Shipping to Mexico' },
  storesTitle: { es: 'Tus tiendas favoritas, en un solo viaje', en: 'Your favourite stores, in one trip' },
  storesSub: { es: 'Las Américas Premium Outlets y tiendas cercanas.', en: 'Las Américas Premium Outlets and nearby stores.' },
  allStores: { es: 'Ver todas las tiendas incluidas', en: 'See every store included' },
  hideStores: { es: 'Ver menos', en: 'Show less' },
  howTitle: { es: 'Así funciona tu sesión de compras', en: 'How your shopping session works' },
  how1Title: { es: 'Reserva tu horario', en: 'Book your time' },
  how1Desc: { es: 'Elige el día y la hora que prefieras.', en: 'Pick the day and time you prefer.' },
  how2Title: { es: 'Tu shopper visita las tiendas', en: 'Your shopper visits the stores' },
  how2Desc: { es: 'Te envía fotos, videos y precios en tiempo real por WhatsApp.', en: 'Sends you photos, videos and prices live on WhatsApp.' },
  how3Title: { es: 'Tú decides qué comprar', en: 'You decide what to buy' },
  how3Desc: { es: 'Confirmas los productos que quieres.', en: 'You confirm the products you want.' },
  how4Title: { es: 'Recibimos y enviamos a México', en: 'We receive and ship to Mexico' },
  how4Desc: { es: 'Nos encargamos del resto.', en: 'We take care of the rest.' },
  bookCta: { es: 'Reservar mi shopper', en: 'Book my shopper' },
  loading: { es: 'Cargando horarios…', en: 'Loading times…' },
  cancelled: { es: 'No se hizo ningún cobro y no se reservó nada. Cuando quieras, elige tu horario de nuevo.', en: 'You were not charged and nothing was reserved. Pick your time again whenever you like.' },
  legacyCancelled: { es: 'Tu solicitud sigue esperando el depósito.', en: 'Your request is still waiting for the deposit.' },
  legacyLink: { es: 'Ver mis solicitudes', en: 'View my requests' },
  noneTitle: { es: 'Por ahora no hay horarios publicados', en: 'No times are published right now' },
  noneDesc: { es: 'Escríbele a tu shopper por WhatsApp y te avisa en cuanto abra horarios.', en: 'Message your shopper on WhatsApp and she will let you know as soon as times open.' },
  step1: { es: 'Elige el día', en: 'Pick the day' },
  step1Sub: { es: 'Mostramos solo las fechas disponibles.', en: 'Only available dates are shown.' },
  moreDates: { es: 'Ver más fechas', en: 'See more dates' },
  fewerDates: { es: 'Ver menos fechas', en: 'Fewer dates' },
  step2: { es: 'Elige la hora', en: 'Pick the time' },
  tz: { es: 'Hora de San Diego (California).', en: 'San Diego time (California).' },
  pickDayFirst: { es: 'Primero elige un día.', en: 'Pick a day first.' },
  howMany: { es: '¿Cuántas horas necesitas?', en: 'How many hours do you need?' },
  less: { es: 'Menos horas', en: 'Fewer hours' },
  more: { es: 'Más horas', en: 'More hours' },
  max: { es: (n) => `máx. ${n} h a partir de esta hora`, en: (n) => `max ${n} h from this time` },
  step3: { es: '¿Qué tiendas quieres visitar?', en: 'Which stores do you want to visit?' },
  step3Sub: { es: 'Puedes seleccionar varias.', en: 'You can pick several.' },
  otherStores: { es: 'Más tiendas de Las Américas', en: 'More stores at Las Américas' },
  step4: { es: 'Cuéntanos qué buscas', en: 'Tell us what you want' },
  optional: { es: 'opcional', en: 'optional' },
  step4Sub: { es: 'Esto ayuda a tu shopper a encontrar mejores opciones.', en: 'This helps your shopper find better options.' },
  notesPlaceholder: { es: 'Ej. tenis Nike talla 9, ropa de gimnasio, perfumes, ofertas, etc.', en: 'E.g. Nike sneakers size 9, gym clothes, perfume, deals, etc.' },
  photosHint: { es: '¿Tienes fotos de referencia? Mándaselas a tu shopper por WhatsApp.', en: 'Have reference photos? Send them to your shopper on WhatsApp.' },
  step5: { es: 'Resumen y precio', en: 'Summary and price' },
  step5Sub: { es: 'El costo de los productos y el envío se confirma después.', en: 'Product and shipping costs are confirmed later.' },
  summary: {
    es: (d, a, b, n) => `${d.charAt(0).toUpperCase() + d.slice(1)}, de ${a} a ${b} (${n} h).`,
    en: (d, a, b, n) => `${d}, ${a} to ${b} (${n} h).`,
  },
  firstHour: { es: 'Reserva (primera hora)', en: 'Booking (first hour)' },
  extraHours: { es: 'Horas adicionales', en: 'Extra hours' },
  commission: { es: 'Comisión por compras', en: 'Commission on purchases' },
  payNote: {
    es: (p) => `Hoy solo pagas${p ? ` $${p} USD` : ''} para apartar tu horario. Las horas extra y la comisión se cobran al terminar la sesión.`,
    en: (p) => `Today you only pay${p ? ` $${p} USD` : ''} to hold your time. Extra hours and the commission are charged when the session ends.`,
  },
  confirm: { es: 'Confirmar reserva', en: 'Confirm booking' },
  pickFirst: { es: 'Elige día y hora para continuar', en: 'Pick a day and time to continue' },
  afterNote: { es: 'Después te conectaremos con tu shopper por WhatsApp para comenzar la sesión.', en: "Afterwards we'll connect you with your shopper on WhatsApp to start the session." },
  redirecting: { es: 'Llevándote a pagar…', en: 'Taking you to pay…' },
  taken: { es: 'Ese horario ya fue reservado, elige otro', en: 'That time was just reserved, pick another' },
  failed: { es: 'No pudimos iniciar el pago. Intenta de nuevo.', en: 'We could not start the payment. Please try again.' },
})

const ICON = {
  camera: 'M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9zM15 13a3 3 0 11-6 0 3 3 0 016 0z',
  chat: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
  truck: 'M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1',
  calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  bag: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z',
  check: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  box: 'M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9',
}
const features = computed(() => [
  { label: t.value.featPhotos, icon: ICON.camera },
  { label: t.value.featWhatsApp, icon: ICON.chat, green: true },
  { label: t.value.featShipping, icon: ICON.truck },
])
const howSteps = computed(() => [
  { title: t.value.how1Title, desc: t.value.how1Desc, icon: ICON.calendar },
  { title: t.value.how2Title, desc: t.value.how2Desc, icon: ICON.bag },
  { title: t.value.how3Title, desc: t.value.how3Desc, icon: ICON.check },
  { title: t.value.how4Title, desc: t.value.how4Desc, icon: ICON.box },
])

// The stores people ask for most, as recognisable tiles. Brand wordmarks are set
// in type (no logo files to keep up to date); the outlets get the photo.
const FEATURED_STORES = [
  { name: 'Las Américas Premium Outlets', img: '/images/lane-in-person.webp' },
  { name: 'Ross', wordmark: 'ROSS', mark: 'text-[26px] font-black tracking-tight', style: 'color:#0b5cab' },
  { name: 'TJ Maxx', wordmark: 'T·J·maxx', mark: 'text-[22px] font-black tracking-tight', style: 'color:#c8102e' },
  { name: 'Marshalls', wordmark: 'Marshalls', mark: 'text-[21px] font-bold italic', style: 'color:#1d3f8f;font-family:Georgia,serif' },
  { name: 'Nike', wordmark: 'NIKE', mark: 'text-[24px] font-black italic tracking-tight text-gray-900' },
  { name: 'adidas', wordmark: 'adidas', mark: 'text-[23px] font-extrabold tracking-tight text-gray-900' },
]
const featuredNames = new Set(FEATURED_STORES.map((s) => s.name.toLowerCase()))
// The rest of the in-person stores (Velonie manages the list in admin).
const storeNames = ref([])
const extraStores = computed(() => storeNames.value.filter((n) => !featuredNames.has(n.toLowerCase())))
const showAllStores = ref(false)
const showMoreStorePicks = ref(false)
const stores = ref([])
function toggleStore(name) {
  stores.value = stores.value.includes(name) ? stores.value.filter((n) => n !== name) : [...stores.value, name]
}
const NOTES_MAX = 500

const days = ref([])
const rate = ref(null) // hourly_rate_usd from the availability API
const commission = ref(10) // commission_percent from the availability API
const capHours = ref(1) // max_hours from the availability API
const loading = ref(true)
const submitting = ref(false)
const error = ref('')

// Customers book up to 4 weeks ahead (Alex 2026-10-02); only the days with open
// hours are shown — the next 5 first, the rest behind "Ver más fechas".
const DAYS_SHOWN = 5
const showAllDays = ref(false)
const openDays = computed(() => days.value.filter((d) => d.slots?.length))
const visibleDays = computed(() => {
  const picked = openDays.value.findIndex((d) => d.date === date.value)
  return showAllDays.value || picked >= DAYS_SHOWN ? openDays.value : openDays.value.slice(0, DAYS_SHOWN)
})
const day = computed(() => days.value.find((d) => d.date === date.value) ?? null)
const slot = computed(() => day.value?.slots.find((s) => s.start_time.substring(0, 5) === start.value) ?? null)
const maxHours = computed(() => hourOptions(slot.value?.max_consecutive_hours, capHours.value).length)
const longDate = computed(() => (date.value ? parseDate(date.value).toLocaleDateString(language.value === 'es' ? 'es-MX' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' }) : ''))

// "13:00" -> { time: '1:00', ampm: 'p.m.' }: the two-line time buttons.
function clock(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number)
  const h12 = h % 12 || 12
  const pm = h >= 12
  return { time: `${h12}:${String(m || 0).padStart(2, '0')}`, ampm: language.value === 'es' ? (pm ? 'p.m.' : 'a.m.') : (pm ? 'PM' : 'AM') }
}
function scrollToBooking() {
  document.getElementById('reservar')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const fmt = (d, opts) => parseDate(d).toLocaleDateString(language.value === 'es' ? 'es-MX' : 'en-US', opts)

function pickDate(d) {
  date.value = d
  start.value = null
  hours.value = 1
}
function pickSlot(s) {
  start.value = s.start_time.substring(0, 5)
  hours.value = Math.min(hours.value, hourOptions(s.max_consecutive_hours, capHours.value).length)
}

async function load() {
  try {
    const res = await $customFetch('/in-person/availability')
    days.value = res?.data ?? []
    ;({ rate: rate.value, maxHours: capHours.value } = readLimits(res))
    if (Number.isFinite(Number(res?.commission_percent))) commission.value = Number(res.commission_percent)
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
  // Drop a pick that is no longer offered.
  // ?date=YYYY-MM-DD (e.g. a link from the team) opens that day when it is offered.
  const wanted = typeof route.query.date === 'string' ? route.query.date : ''
  if (!date.value && wanted && days.value.some((d) => d.date === wanted)) pickDate(wanted)
  if (date.value && !day.value) pickDate(null)
  else if (start.value && !slot.value) start.value = null
}

// The picked stores ride in the notes the team already reads (no API change).
function customerNotes() {
  const parts = []
  if (stores.value.length) parts.push(`${language.value === 'es' ? 'Tiendas' : 'Stores'}: ${stores.value.join(', ')}`)
  if (notes.value.trim()) parts.push(notes.value.trim())
  return parts.join('\n\n')
}

async function loadStores() {
  try {
    const res = await $customFetch('/shopping-trips/in-person-stores')
    storeNames.value = (res?.data?.stores ?? []).map((s) => s?.name).filter(Boolean)
  } catch { /* the featured tiles still work */ }
}

async function submit() {
  submitting.value = true
  error.value = ''
  try {
    const res = await $customFetch('/in-person/reservations', {
      method: 'POST',
      body: { date: date.value, start_time: start.value, hours: hours.value, customer_notes: customerNotes() || undefined },
    })
    if (!res?.checkout_url) throw new Error('no checkout url')
    window.location.href = res.checkout_url
  } catch (e) {
    console.error(e)
    if (e?.statusCode === 422 || e?.status === 422) {
      error.value = t.value.taken
      await load()
    } else {
      error.value = e?.data?.message ?? t.value.failed
    }
    submitting.value = false
  }
}

onMounted(() => {
  reset()
  load()
  loadStores()
})
</script>
