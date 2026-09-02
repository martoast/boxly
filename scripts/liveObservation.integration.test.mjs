import { classifyLiveObservation } from './liveObservation.ts'

let reads = 0
const observeFixture = async (pages) => {
  for (const page of pages) {
    reads++
    const state = classifyLiveObservation(page)
    if (state !== 'pending') return state
  }
  return 'pending'
}

const failed = await observeFixture([
  { pageText: 'Agente navegando en la tienda\nLa sesión en vivo no está disponible en este momento.' },
  { pageText: 'still loading' },
])
if (failed !== 'failed' || reads !== 1) throw new Error(`failure did not stop early: ${failed}, reads=${reads}`)

reads = 0
const success = await observeFixture([
  { pageText: 'Conectando con la tienda…' },
  { pageText: 'Producto verificado', candidateCount: 1 },
  { pageText: 'unreachable' },
])
if (success !== 'success' || reads !== 2) throw new Error(`candidate flow changed: ${success}, reads=${reads}`)

reads = 0
const pending = await observeFixture([
  { pageText: 'Conectando…' },
  { pageText: 'Respondiendo' },
])
if (pending !== 'pending' || reads !== 2) throw new Error(`transient state became terminal: ${pending}, reads=${reads}`)

console.log('3 integration fixtures passed')
