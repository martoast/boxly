import { classifyLiveObservation } from './liveObservation.ts'

let pass = 0
const check = (name, actual, expected) => {
  if (actual === expected) pass++
  else { console.error(`FAIL ${name}: expected ${expected}, got ${actual}`); process.exitCode = 1 }
}

check('live unavailable stops early', classifyLiveObservation({ pageText: 'Agente navegando en la tienda\nLa sesión en vivo no está disponible en este momento.' }), 'failed')
check('session expiry stops early', classifyLiveObservation({ pageText: 'Sesión expirada. Reintentar' }), 'failed')
check('structural connection failure stops early', classifyLiveObservation({ pageText: 'No se pudo conectar con la sesión en vivo.' }), 'failed')
check('candidate wins over an error line', classifyLiveObservation({ pageText: 'La sesión en vivo no está disponible', candidateCount: 1 }), 'success')
check('terminal wins over stale transient copy', classifyLiveObservation({ pageText: 'Conectando…\nBuscando\nLa sesión en vivo no está disponible en este momento.' }), 'failed')
check('candidate plus terminal remains success', classifyLiveObservation({ pageText: 'Producto verificado\nLa sesión en vivo no está disponible', candidateCount: 1 }), 'success')
check('completed state remains success', classifyLiveObservation({ pageText: 'Producto verificado', completed: true }), 'success')
check('connecting remains pending', classifyLiveObservation({ pageText: 'Conectando con la tienda…' }), 'pending')
check('responding remains pending', classifyLiveObservation({ pageText: 'Respondiendo' }), 'pending')
check('no unrelated phrase false-positive', classifyLiveObservation({ pageText: 'La disponibilidad puede cambiar.' }), 'pending')

console.log(`${pass} passed, ${10 - pass} failed`)
