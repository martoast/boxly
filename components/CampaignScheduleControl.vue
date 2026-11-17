<template>
  <!-- A draft's send time (2026-11-17): schedule it for any day and hour (central Mexico time), change it, or take it off the schedule. -->
  <div v-if="campaign?.status === 'draft'" class="rounded-2xl border p-4 sm:p-5"
    :class="scheduled ? 'bg-violet-50 border-violet-200' : 'bg-white border-gray-100 shadow-sm'">
    <div class="flex flex-col sm:flex-row sm:items-center gap-3">
      <div class="flex items-center gap-2 min-w-0 flex-1">
        <svg class="w-5 h-5 shrink-0" :class="scheduled ? 'text-violet-600' : 'text-gray-400'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
        </svg>
        <p v-if="scheduled && !editing" class="text-sm text-violet-900">
          {{ t.scheduledFor }} <span class="font-bold">{{ scheduleLabel(campaign.scheduled_at, lang) }}</span>
          <span class="text-violet-700/80"> · {{ t.mxTime }}</span>
        </p>
        <p v-else class="text-sm font-semibold text-gray-800">{{ scheduled ? t.change : t.scheduleSend }}</p>
      </div>
      <div v-if="scheduled && !editing" class="flex gap-2">
        <button type="button" class="px-3 py-2 text-sm font-medium rounded-xl border border-violet-300 text-violet-800 bg-white hover:bg-violet-100" @click="startEdit">{{ t.change }}</button>
        <button type="button" :disabled="busy" class="px-3 py-2 text-sm font-medium rounded-xl border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50" @click="save(null)">{{ t.unschedule }}</button>
      </div>
      <div v-else class="flex flex-wrap items-center gap-2">
        <input v-model="day" type="date" :min="today" class="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
        <input v-model="time" type="time" step="900" class="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
        <button type="button" :disabled="busy || !day || !time" class="px-4 py-2 text-sm font-semibold rounded-xl bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50" @click="save(mxInstant(day, time))">{{ t.schedule }}</button>
        <button v-if="editing" type="button" class="px-3 py-2 text-sm text-gray-600 hover:text-gray-800" @click="editing = false">{{ t.cancel }}</button>
      </div>
    </div>
    <p v-if="error" class="mt-2 text-xs text-red-600">{{ error }}</p>
    <p v-if="!scheduled || editing" class="mt-2 text-xs text-gray-500">{{ t.hint }}</p>
  </div>
</template>

<script setup>
import { isScheduled, scheduleLabel, mxDay, mxTime, mxInstant } from '~/utils/campaignSchedule'

const props = defineProps({
  campaign: { type: Object, default: null },
  apiPrefix: { type: String, default: '/admin' },
})
const emit = defineEmits(['updated'])
const { $customFetch } = useNuxtApp()
const { t: createTranslations, language } = useLanguage()
const lang = computed(() => (language?.value === 'en' ? 'en' : 'es'))
const t = createTranslations({
  scheduledFor: { es: 'Programada para el', en: 'Scheduled for' },
  mxTime: { es: 'hora del centro de México', en: 'central Mexico time' },
  scheduleSend: { es: 'Programar envío', en: 'Schedule send' },
  schedule: { es: 'Programar', en: 'Schedule' },
  change: { es: 'Cambiar fecha', en: 'Change date' },
  unschedule: { es: 'Quitar programación', en: 'Unschedule' },
  cancel: { es: 'Cancelar', en: 'Cancel' },
  hint: { es: 'Se envía sola a esa hora (hora del centro de México). Puedes cambiarla o quitarla mientras sea borrador.', en: 'It sends by itself at that time (central Mexico time). You can change or remove it while it is a draft.' },
  failed: { es: 'No se pudo guardar la programación', en: 'Could not save the schedule' },
})

const scheduled = computed(() => isScheduled(props.campaign))
const today = mxDay(new Date())
const editing = ref(false)
const day = ref('')
const time = ref('09:00')
const busy = ref(false)
const error = ref('')

function startEdit() {
  day.value = mxDay(props.campaign?.scheduled_at) || today
  time.value = mxTime(props.campaign?.scheduled_at) || '09:00'
  editing.value = true
}

async function save(at) {
  busy.value = true
  error.value = ''
  try {
    await $customFetch(`${props.apiPrefix}/campaigns/${props.campaign.id}`, { method: 'PUT', body: { scheduled_at: at } })
    editing.value = false
    emit('updated')
  } catch (e) {
    error.value = e?.data?.message || t.value.failed
  } finally {
    busy.value = false
  }
}
</script>
