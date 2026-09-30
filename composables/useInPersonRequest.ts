// In-person reservation picked on /in-person: the day, the first hour, how many hours and the notes.
// Kept in memory only (nothing is held until the customer pays, so there is nothing to restore).

import { ref } from 'vue'

const date  = ref<string | null>(null)   // 'YYYY-MM-DD', Pacific local
const start = ref<string | null>(null)   // 'HH:MM', Pacific local
const hours = ref(1)
const notes = ref('')

export function useInPersonRequest() {
  function reset() {
    date.value = null
    start.value = null
    hours.value = 1
    notes.value = ''
  }

  return { date, start, hours, notes, reset }
}
