import { streamText, tool, convertToModelMessages, stepCountIs } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { z } from 'zod'

/**
 * AI shopping-assistant chat backend (Phase 2).
 *
 * Streams Claude with:
 *  - web_search (native) for product discovery,
 *  - extract_product (public API) to read a chosen product page,
 *  - authed tools (create_purchase_request / get_profile / list_orders /
 *    update_shopping_profile) that call the Boxly API with the user's bearer
 *    token, and
 *  - create_account: a CLIENT-executed tool (no server execute) so the browser
 *    runs /auth/chat-register itself and gets the SPA session cookie.
 *
 * The frontend (useChat) sends { messages, token?, shoppingProfile? }.
 */

const API_BASE = (process.env.API_URL || 'https://api.boxly.mx').replace(/\/$/, '')
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6'

async function callApi(path: string, opts: { method?: string; body?: any; token?: string } = {}) {
  const headers: Record<string, string> = { Accept: 'application/json', Origin: API_BASE }
  if (opts.body) headers['Content-Type'] = 'application/json'
  if (opts.token) headers['Authorization'] = `Bearer ${opts.token}`
  const res = await fetch(`${API_BASE}${path}`, {
    method: opts.method || 'GET',
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  })
  const text = await res.text()
  let data: any
  try { data = JSON.parse(text) } catch { data = { raw: text } }
  if (!res.ok) return { ok: false, status: res.status, ...(data || {}) }
  return data?.data ?? data
}

function systemPrompt(loggedIn: boolean, shoppingProfile: any) {
  const profileBlock = shoppingProfile && Object.keys(shoppingProfile).length
    ? `\n\nWhat you already know about this shopper (use it to refine searches; keep it updated via update_shopping_profile when you learn something durable):\n${JSON.stringify(shoppingProfile)}`
    : ''
  return `You are Boxly's AI shopping assistant. Boxly lets people in Mexico buy anything from any US store and have it shipped to them.

Your job: help the user figure out what they want (even if they're unsure), find real products from US stores with web_search, and when they're ready, create a Purchase Request so Boxly buys it and ships it to Mexico.

How to work:
- Use web_search to find real, current products + prices from US stores. Confirm a specific product with extract_product when the user picks one (gets accurate title/price/image).
- IMAGES: If the user attaches a photo/screenshot of a product, look at it carefully, describe what you see (brand, type, color, any visible text/logos), then use web_search to find that EXACT product (or the closest match) on a US store. Show 1–3 candidates with image/price and ask the user to confirm which one is right before proceeding. Never assume — confirm the match.
- Always show prices in USD and a rough MXN estimate (~18 MXN per USD) and remind them Boxly adds a small service fee + shipping, quoted after.
- HAND-HOLD the whole way: before creating a Purchase Request you MUST have everything needed to actually buy it — the exact product + URL, the **size**, the **color/variant**, and the **quantity**. If any of these is missing or ambiguous for that product, ASK for it (one or two friendly questions at a time). Don't create the request with missing size/variant.
- When you create the request, put the size, color/variant and any other options in each item's "notes" so Boxly buys exactly the right thing (e.g. notes: "Talla M, color negro").
- Save durable preferences with update_shopping_profile (e.g. their shoe/clothing size, favorite brands, budget) so next time you already know.
- Before creating a Purchase Request, summarize the item(s) — name, size, color, qty, price — and get explicit confirmation.
${loggedIn
  ? '- This user is signed in. Use create_purchase_request to submit once they confirm.'
  : '- This user is a GUEST. The moment they want to place the order, call create_account to collect their name, email, and phone and create their account inline — then create the purchase request. Never send them away to a separate signup.'}
- Be concise, friendly, and in the user's language (default Spanish, es-MX).${profileBlock}`
}

export default defineEventHandler(async (event) => {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) {
    setResponseStatus(event, 503)
    return { error: 'assistant_not_configured', message: 'Missing ANTHROPIC_API_KEY on the server.' }
  }

  const body = await readBody(event)
  const messages = body?.messages ?? []
  const token: string | undefined = body?.token || undefined
  const shoppingProfile = body?.shoppingProfile ?? null

  const anthropic = createAnthropic({ apiKey: key })

  const authedNote = { ok: false, error: 'not_authenticated', message: 'Ask the user to create an account first (call create_account).' }

  const result = streamText({
    model: anthropic(MODEL),
    system: systemPrompt(!!token, shoppingProfile),
    messages: await convertToModelMessages(messages),
    stopWhen: stepCountIs(10),
    onError: ({ error }) => console.error('[assistant] error:', error instanceof Error ? error.message : error),
    tools: {
      web_search: anthropic.tools.webSearch_20250305({ maxUses: 6 }),

      extract_product: tool({
        description: 'Fetch clean details (title, USD price, image, store) from a specific US product URL the user picked.',
        inputSchema: z.object({ url: z.string().describe('The product page URL.') }),
        execute: async ({ url }) => callApi('/products/extract', { method: 'POST', body: { url } }),
      }),

      create_purchase_request: tool({
        description: 'Submit a Purchase Request for Boxly to buy the item(s) in the US and ship to Mexico. Only after the user confirms. Requires the user to be signed in.',
        inputSchema: z.object({
          items: z.array(z.object({
            product_name: z.string(),
            product_url: z.string(),
            price: z.number().describe('Listed USD price; 0 if unknown.').optional(),
            quantity: z.number().int().min(1).default(1),
            notes: z.string().describe('Size/color/variant notes.').optional(),
          })).min(1),
        }),
        execute: async ({ items }) => {
          if (!token) return authedNote
          return callApi('/purchase-requests', {
            method: 'POST',
            token,
            body: {
              currency: 'usd',
              items: items.map((it) => ({
                product_name: it.product_name,
                product_url: it.product_url,
                price: it.price ?? 0,
                quantity: it.quantity ?? 1,
                notes: it.notes,
              })),
            },
          })
        },
      }),

      get_profile: tool({
        description: "Get the signed-in user's profile and Boxly US (casillero) address.",
        inputSchema: z.object({}),
        execute: async () => (token ? callApi('/profile', { token }) : authedNote),
      }),

      list_orders: tool({
        description: "List the signed-in user's orders and their status.",
        inputSchema: z.object({}),
        execute: async () => (token ? callApi('/orders', { token }) : authedNote),
      }),

      update_shopping_profile: tool({
        description: 'Persist durable shopper preferences you learned (sizes, brands, categories, budget, style). Merge-updates.',
        inputSchema: z.object({ profile: z.record(z.string(), z.any()).describe('Partial profile to merge, e.g. {sizes:{shoe:"10 US"}, brands:["Nike"]}.') }),
        execute: async ({ profile }) => (token ? callApi('/me/shopping-profile', { method: 'PUT', token, body: { profile } }) : authedNote),
      }),

      // CLIENT-executed (no execute): the browser runs /auth/chat-register so it
      // gets the SPA session cookie + token, then resumes the conversation.
      create_account: tool({
        description: 'Create the account for a guest who wants to place an order. Collect name, email, and phone first and confirm. The app completes signup and signs them in.',
        inputSchema: z.object({
          name: z.string(),
          email: z.string().email(),
          phone: z.string().describe('E.164, e.g. +5215551234567'),
        }),
      }),
    },
  })

  return result.toUIMessageStreamResponse({
    onError: (error) => (error instanceof Error ? error.message : String(error)),
  })
})
