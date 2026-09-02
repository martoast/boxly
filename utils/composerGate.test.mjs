/**
 * The composer submit gate + the template contract, without a browser.
 *
 * A real computer-use E2E typed a Spanish sentence into the chat composer and
 * could not verify what landed. These rows pin: byte-exact value passthrough
 * (punctuation, accents, spaces, final character), Enter-vs-composition gating,
 * the DOM-snapshot payload rule, and — via source assertions — that the
 * textarea stays native with a stable accessible name and that the parent
 * consumes the explicit payload text.
 *
 *   node --experimental-strip-types utils/composerGate.test.mjs
 */
import { readFileSync } from 'node:fs'
import { createComposerGate } from './composerGate.ts'

let pass = 0
let fail = 0
const check = (name, cond, detail = '') => {
  if (cond) { pass++ } else { fail++; console.error(`FAIL ${name}${detail ? ` — ${detail}` : ''}`) }
}

// The exact class of string the E2E typed: Spanish punctuation, accents,
// interior spaces, and a meaningful final character.
const SPANISH = '¿Tienen ofertas de zapatos para correr New Balance? Quiero ver precio y disponibilidad.'

// ── Byte-exact payload passthrough ──────────────────────────────────────────
{
  const gate = createComposerGate()
  check('payload passes the full Spanish string byte-for-byte', gate.payloadText(SPANISH, 'stale') === SPANISH)
  check('payload keeps the final character', gate.payloadText('hola.', 'hola').endsWith('.'))
  check('payload keeps interior/multiple spaces', gate.payloadText('a  b c ', '') === 'a  b c ')
  check('DOM snapshot beats a stale model value', gate.payloadText('zapatos para correr', 'zapatos para corr') === 'zapatos para correr')
  check('model is the fallback when no DOM value exists (mic branch)', gate.payloadText(undefined, 'desde el modelo') === 'desde el modelo')
  check('no value anywhere yields empty string, never undefined', gate.payloadText(undefined, undefined) === '')
}

// ── Enter decision table ────────────────────────────────────────────────────
{
  const gate = createComposerGate()
  check('plain Enter with text sends', gate.decide({ value: SPANISH }) === 'send')
  check('Shift+Enter is a newline', gate.decide({ shiftKey: true, value: SPANISH }) === 'newline')
  check('busy ignores', gate.decide({ busy: true, value: SPANISH }) === 'ignore')
  check('whitespace-only ignores', gate.decide({ value: '   ' }) === 'ignore')
  check('empty text with attachments sends', gate.decide({ value: '', hasAttachments: true }) === 'send')
  check('event isComposing blocks the send', gate.decide({ eventComposing: true, value: SPANISH }) === 'ignore')
}

// ── Composition state machine: stale composition can never submit early ─────
{
  const gate = createComposerGate()
  gate.compositionStart()
  check('tracked composition blocks even when the event flag is clear (Safari quirk)', gate.decide({ eventComposing: false, value: 'cafe' }) === 'ignore')
  check('composing flag reads true mid-composition', gate.composing === true)
  gate.compositionEnd()
  check('after compositionend the send is allowed', gate.decide({ value: 'café' }) === 'send')
  check('composing flag clears', gate.composing === false)
}

// ── Template/parent contract (source assertions) ────────────────────────────
{
  const composer = readFileSync(new URL('../components/AssistantComposer.vue', import.meta.url), 'utf8')
  check('composer input remains a NATIVE <textarea>', /<textarea[\s>]/.test(composer) && !composer.includes('contenteditable'))
  check('textarea carries the STABLE accessible name', composer.includes('aria-label="Escribe tu mensaje"'))
  check('textarea uses v-model (no controlled :value echo)', /v-model="text"/.test(composer) && !composer.includes(':value="text"'))
  check('composition events are wired to the gate', composer.includes('@compositionstart') && composer.includes('@compositionend'))
  check('Enter is routed through the gate decision', composer.includes('@keydown.enter.exact="onEnter"'))
  check('send payload carries the explicit DOM-snapshot text', composer.includes("emit('send', { text: value, files })"))

  const parent = readFileSync(new URL('../components/ShoppingAssistant.vue', import.meta.url), 'utf8')
  check('parent consumes the payload text', parent.includes('onComposerSend({ text: payloadText, files }'))
  check("parent's ref is only the no-payload fallback", parent.includes("typeof payloadText === 'string' ? payloadText : input.value"))
}

console.log(`${pass} passed, ${fail} failed`)
if (fail > 0) process.exit(1)
