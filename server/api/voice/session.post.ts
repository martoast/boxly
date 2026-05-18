// server/api/voice/session.post.ts
//
// Mints a 60-second-TTL ephemeral OpenAI Realtime session token for the
// /asistente voice widget. The real OPENAI_API_KEY never leaves the server;
// the client receives only the short-lived token and uses it to do the
// WebRTC SDP exchange directly with OpenAI.
//
// The KB lives at `server/assets/boxly-kb.md` (auto-mounted by Nitro as the
// `assets:server` storage namespace). It is loaded once at module init and
// cached for the lifetime of the server process — restart the app (or
// re-deploy) to pick up KB edits.

let cachedInstructions: string | null = null

async function getInstructions(): Promise<string> {
  if (cachedInstructions) return cachedInstructions
  const storage = useStorage('assets:server')
  const raw = await storage.getItem<string>('boxly-kb.md')
  if (!raw) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Voice KB not found at server/assets/boxly-kb.md',
    })
  }
  cachedInstructions = raw
  return cachedInstructions
}

export default defineEventHandler(async () => {
  const { openaiApiKey } = useRuntimeConfig()
  if (!openaiApiKey) {
    throw createError({
      statusCode: 500,
      statusMessage:
        'OPENAI_API_KEY is not set on the server. Add it to .env (local) or to the deploy platform env (prod).',
    })
  }

  const instructions = await getInstructions()

  try {
    const session = await $fetch<Record<string, any>>(
      'https://api.openai.com/v1/realtime/sessions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: {
          model: 'gpt-realtime',
          // Warm, multilingual voice — handles Mexican Spanish well.
          // Swap to `alloy`, `ash`, `verse`, `cedar`, `coral`, etc. if you
          // want a different feel.
          voice: 'marin',
          modalities: ['text', 'audio'],
          instructions,
          // Model-side turn detection. `semantic_vad` lets the model use what
          // the visitor actually said (not just silence) to decide their turn
          // is over; `eagerness: low` errs on letting them think. Interrupts
          // yield immediately when the visitor talks over the assistant.
          turn_detection: {
            type: 'semantic_vad',
            eagerness: 'low',
            create_response: true,
            interrupt_response: true,
          },
          input_audio_noise_reduction: { type: 'near_field' },
        },
      }
    )
    return session
  } catch (err: any) {
    const status = err?.response?.status ?? 502
    const msg =
      err?.data?.error?.message ??
      err?.message ??
      'unknown error from OpenAI'
    throw createError({
      statusCode: status,
      statusMessage: `OpenAI Realtime session create failed: ${msg}`,
    })
  }
})
