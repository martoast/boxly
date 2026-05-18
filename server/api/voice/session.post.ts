// server/api/voice/session.post.ts
//
// Mints a 60-second-TTL ephemeral OpenAI Realtime session token for the
// /asistente voice widget. The real OPENAI_API_KEY never leaves the server;
// the client receives only the short-lived token and uses it to do the
// WebRTC SDP exchange directly with OpenAI.
//
// The KB lives as multiple files under `server/assets/kb/` (auto-mounted
// by Nitro as the `assets:server` storage namespace). The files are
// concatenated alphabetically — the numeric filename prefixes
// (`00-persona.md`, `10-service.md`, `20-policies.md`, `30-orders.md`)
// drive the order. Sorted order is important: prompt caching is
// prefix-sensitive, so the byte order across sessions must be stable for
// the prefix to stay cached (~80x cost reduction on cached input).
//
// Editing the KB: add or change any file in server/assets/kb/ and
// redeploy. Most-stable content (persona) is up top so edits to the
// later files (orders, etc.) bust less of the cache.
//
// OPENAI_API_KEY is read from process.env at REQUEST time (runtime), not
// via useRuntimeConfig(). Anything in runtimeConfig that pulls from
// process.env at build time gets baked into the server bundle as a string
// literal, which Netlify's secrets scanner catches and the deploy fails.

let cachedInstructions: string | null = null

async function getInstructions(): Promise<string> {
  if (cachedInstructions) return cachedInstructions
  const storage = useStorage('assets:server')

  // List everything under the kb/ subdirectory and sort alphabetically.
  // Unstorage normalizes path separators to `:`, so keys look like
  // `kb:00-persona.md`. We filter and sort for deterministic order.
  const allKeys = await storage.getKeys()
  const kbKeys = allKeys.filter((k) => /^kb[:/]/.test(k)).sort()

  if (!kbKeys.length) {
    throw createError({
      statusCode: 500,
      statusMessage: 'No voice KB files found under server/assets/kb/',
    })
  }

  const parts = await Promise.all(
    kbKeys.map((k) => storage.getItem<string>(k))
  )

  // Markdown horizontal rule between sections — clean separator the model
  // won't confuse with content.
  cachedInstructions = parts.filter((p): p is string => !!p).join('\n\n---\n\n')
  return cachedInstructions
}

export default defineEventHandler(async () => {
  const openaiApiKey = process.env.OPENAI_API_KEY
  if (!openaiApiKey) {
    throw createError({
      statusCode: 500,
      statusMessage:
        'OPENAI_API_KEY is not set on the server. Add it to .env (local) or to the deploy platform env (prod).',
    })
  }

  const instructions = await getInstructions()

  try {
    // OpenAI Realtime GA — the beta `/v1/realtime/sessions` endpoint was
    // shut down. Use `/v1/realtime/client_secrets` with the new request
    // shape (everything wrapped under `session.*`, with `session.type =
    // "realtime"`, `voice` under `session.audio.output.voice`, and
    // turn-detection / noise-reduction under `session.audio.input.*`).
    // Response is `{ value: "ek_...", expires_at, session: {...} }`.
    const session = await $fetch<Record<string, any>>(
      'https://api.openai.com/v1/realtime/client_secrets',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: {
          // Extend the ephemeral token TTL from the 60s default to 10 min
          // so the client can prefetch it on page mount and have it ready
          // for a near-instant click-to-speak. Max allowed is 7200s.
          expires_after: { anchor: 'created_at', seconds: 600 },
          session: {
            type: 'realtime',
            // gpt-realtime-2 (May 2026): GPT-5-class reasoning, 128K
            // context, parallel tool calls. `reasoning.effort: minimal`
            // keeps time-to-first-audio in the ~1.1s range while still
            // benefiting from the new model's instruction-following and
            // dynamics gains over `gpt-realtime`.
            model: 'gpt-realtime-2',
            reasoning: { effort: 'minimal' },
            instructions,
            audio: {
              input: {
                // `semantic_vad` uses what the visitor actually said (not
                // just silence) to decide their turn is over. `eagerness:
                // low` errs on letting them think — important for
                // Spanish-speaking visitors who pause mid-sentence
                // ("entonces… si mando una caja…"). Bump back to `auto`
                // if turn pickup ever feels sluggish.
                turn_detection: {
                  type: 'semantic_vad',
                  eagerness: 'low',
                  create_response: true,
                  interrupt_response: true,
                },
                noise_reduction: { type: 'near_field' },
              },
              output: {
                // Warm, multilingual voice — handles Mexican Spanish
                // well. Swap to `cedar`, `alloy`, `ash`, `verse`, etc.
                // if you want a different feel.
                voice: 'marin',
              },
            },
          },
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
