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

async function callApi(path: string, opts: { method?: string; body?: any; token?: string; timeoutMs?: number } = {}) {
  // No Origin header: this is a server-to-server call. Sending Origin:api.boxly.mx
  // makes Sanctum treat it as a stateful (browser) request and enforce CSRF,
  // which 419s these tokenless public calls. CORS doesn't apply server-side.
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (opts.body) headers['Content-Type'] = 'application/json'
  if (opts.token) headers['Authorization'] = `Bearer ${opts.token}`
  const res = await fetch(`${API_BASE}${path}`, {
    method: opts.method || 'GET',
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    signal: opts.timeoutMs ? AbortSignal.timeout(opts.timeoutMs) : undefined,
  })
  const text = await res.text()
  let data: any
  try { data = JSON.parse(text) } catch { data = { raw: text } }
  if (!res.ok) return { ok: false, status: res.status, ...(data || {}) }
  return data?.data ?? data
}

// Drop tool-call parts that never reached a terminal state (no output) before
// replaying history to the model. A tool_use without a matching tool_result is
// invalid for Anthropic and makes the next turn fail silently — which happens
// if a tool call gets cut off at the end of a stream (e.g. a slow enrichment).
function stripIncompleteToolCalls(messages: any[]) {
  return (messages || []).map((m) => {
    if (m?.role !== 'assistant' || !Array.isArray(m.parts)) return m
    const parts = m.parts.filter((p: any) =>
      typeof p?.type === 'string' && p.type.startsWith('tool-')
        ? p.state === 'output-available' || p.state === 'output-error'
        : true
    )
    return { ...m, parts }
  })
}

function systemPrompt(loggedIn: boolean, shoppingProfile: any) {
  const profileBlock = shoppingProfile && Object.keys(shoppingProfile).length
    ? `\n\nWhat you already know about this shopper (use it to refine searches; keep it updated via update_shopping_profile when you learn something durable):\n${JSON.stringify(shoppingProfile)}`
    : ''
  return `You are Boxly's AI shopping assistant. Boxly lets people in Mexico buy anything from any US store and have it shipped to them.

Your job: help the user figure out what they want (even if they're unsure), find real products from US stores with web_search, and when they're ready, create a Purchase Request so Boxly buys it and ships it to Mexico.

CRITICAL — NEVER invent products. You may ONLY show a product (its name, URL, price or image) if it came back from a tool call in THIS conversation (browse_store, web_search, or extract_product). NEVER type a product name, URL, or price from your own memory/training — it will be wrong and the image will be missing. If a tool returned no usable products, say so and try another query or store; do not fill the gap with remembered products.

CRITICAL — After you call browse_store, do NOT call show_products. browse_store ALREADY renders its results as a gallery for the user; calling show_products afterwards just duplicates it and can break the chat. show_products is ONLY for web_search results (which don't auto-render), and every product_url in it MUST be copied verbatim from a web_search result — never guessed or constructed.

How to work:
- If the user names or links a SPECIFIC store (e.g. "YoungLA", "Gymshark", "Alo", "Chubbies"), you MUST call browse_store with that store's URL to pull its REAL catalog — do NOT use web_search for a named store, browse_store returns real images and prices. Show the latest drop first, then ASK what category or item they want, and call browse_store again with a query (e.g. "joggers") to search within the store. browse_store's results already render as a gallery — present THOSE exact items; do not re-type them into show_products and do not add items it didn't return.
- SEARCH STRATEGY for browse_store queries: the store's search matches PRODUCT TITLES, so use a single short category keyword ("shorts", "joggers", "hoodie", "tank", "tee") — NOT full phrases or gender words like "men's shorts" or "ropa de hombre" (those match almost nothing). If a query returns very few results, silently try a broader keyword and/or the latest drop again before responding — don't make the user watch you say "only found one". Many gym stores (incl. YoungLA) prefix women's items with "W" in the title (e.g. "W2279…") and leave men's items un-prefixed — use that to filter by gender, and tell the user which ones are men's/women's rather than relying on the search term.
- Only use web_search for open/cross-store discovery (the user named no store, or browse_store returned zero products). Then pass up to 6 of the ACTUAL products from the search results (each with its real product_url copied from the result) to show_products so they render with images.
- ALWAYS present products through the gallery (browse_store / show_products), NEVER as a plain text list and NEVER as a price table. The gallery already shows each product's image, name, store and price — do not repeat any of that in your text. After the gallery, write at most ONE short sentence (e.g. "¿Cuál te late?" or a quick tip). No tables, no restating prices.
- Confirm a specific product with extract_product when the user picks one (accurate title/price/image).
- IMAGES: If the user attaches a photo/screenshot of a product, look at it carefully, describe what you see (brand, type, color, any visible text/logos), then use web_search to find that EXACT product (or the closest match) on a US store. Show 1–3 candidates via show_products and ask the user to confirm which one is right before proceeding. Never assume — confirm the match.
- PRICING: Show ONLY the store's original USD price, exactly as it comes from the store. Do NOT convert to MXN and do NOT invent or state a total. Make clear this is just the store price — Boxly's service fee + shipping get added and are quoted separately after the request. Never present any number as the final price.
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
    messages: await convertToModelMessages(stripIncompleteToolCalls(messages)),
    stopWhen: stepCountIs(10),
    onError: ({ error }) => console.error('[assistant] error:', error instanceof Error ? error.message : error),
    tools: {
      web_search: anthropic.tools.webSearch_20250305({ maxUses: 6 }),

      extract_product: tool({
        description: 'Fetch clean details (title, USD price, image, store) from a specific US product URL the user picked.',
        inputSchema: z.object({ url: z.string().describe('The product page URL.') }),
        execute: async ({ url }) => callApi('/products/extract', { method: 'POST', body: { url } }),
      }),

      browse_store: tool({
        description: "Pull REAL products straight from a US store's own catalog (works for Shopify stores like YoungLA, Gymshark, Alo, Chubbies). Use this whenever the user names or links a specific store — show their latest drop, or pass a query to search within that store (e.g. \"joggers\"). Returns products with real images/prices that render as a gallery. If it returns no products the store isn't supported — fall back to web_search.",
        inputSchema: z.object({
          store_url: z.string().describe('Store homepage or any URL on it, e.g. https://www.youngla.com'),
          query: z.string().describe('Optional keyword to search within the store; omit for the latest drop.').optional(),
        }),
        execute: async ({ store_url, query }) => callApi('/products/store-feed', { method: 'POST', body: { url: store_url, query: query || undefined, limit: 12 } }),
      }),

      show_products: tool({
        description: 'Display a visual GALLERY of product recommendations to the user (cards with image, price, link they can tap). ALWAYS use this to present products you found — never just list them as plain text. Provide up to 6 real products, each with a real product_url. The gallery fetches the real image automatically.',
        inputSchema: z.object({
          products: z.array(z.object({
            title: z.string(),
            product_url: z.string().describe('Direct URL to the product page.'),
            price: z.number().describe('USD price if known.').optional(),
            store: z.string().describe('Store/brand name.').optional(),
            reason: z.string().describe('Short note on why it fits (optional).').optional(),
          })).min(1).max(6),
        }),
        execute: async ({ products }) => {
          const enriched = await Promise.all((products || []).map(async (p) => {
            let image: string | null = null
            let price = p.price ?? null
            let store = p.store ?? null
            try {
              const ex: any = await callApi('/products/extract', { method: 'POST', body: { url: p.product_url }, timeoutMs: 8000 })
              if (ex && ex.image) image = ex.image
              if (price == null && ex?.price != null) price = ex.price
              if (!store && ex?.store) store = ex.store
            } catch { /* best-effort image */ }
            return { title: p.title, url: p.product_url, image, price, store, note: p.reason ?? null }
          }))
          return { products: enriched }
        },
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
