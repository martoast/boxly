/**
 * Voice-message transcription for the shopping assistant.
 * Browser records a short clip → POSTs it here → OpenAI gpt-4o-mini-transcribe
 * (latest, lower hallucination than whisper-1) → returns text to drop into the
 * chat input. Server-only key; no streaming needed for push-to-talk.
 */
export default defineEventHandler(async (event) => {
  const key = process.env.OPENAI_API_KEY
  if (!key) {
    setResponseStatus(event, 503)
    return { error: 'transcription_not_configured' }
  }

  const parts = await readMultipartFormData(event)
  const audio = parts?.find((p) => p.name === 'audio') || parts?.find((p) => p.filename)
  if (!audio?.data) {
    setResponseStatus(event, 400)
    return { error: 'no_audio' }
  }

  const form = new FormData()
  form.append('file', new Blob([audio.data], { type: audio.type || 'audio/webm' }), audio.filename || 'audio.webm')
  form.append('model', process.env.OPENAI_TRANSCRIBE_MODEL || 'gpt-4o-mini-transcribe')
  // Audience is Mexican Spanish; the hint improves accuracy but the model still
  // handles English product names fine.
  form.append('language', 'es')

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  })

  const data: any = await res.json().catch(() => ({}))
  if (!res.ok) {
    console.error('[transcribe] error:', data?.error?.message || res.status)
    setResponseStatus(event, res.status)
    return { error: data?.error?.message || 'transcription_failed' }
  }

  return { text: data.text ?? '' }
})
