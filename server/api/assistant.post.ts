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

// Round-robin merge so a multi-store gallery alternates brands instead of
// showing all of store A then all of store B.
function interleave(arrays: any[][]) {
  const out: any[] = []
  const max = arrays.reduce((m, a) => Math.max(m, a.length), 0)
  for (let i = 0; i < max; i++) for (const a of arrays) if (a[i]) out.push(a[i])
  return out
}

function systemPrompt(loggedIn: boolean, shoppingProfile: any) {
  const profileBlock = shoppingProfile && Object.keys(shoppingProfile).length
    ? `\n\nWhat you already know about this shopper (use it to refine searches; keep it updated via update_shopping_profile when you learn something durable):\n${JSON.stringify(shoppingProfile)}`
    : ''
  return `You are Boxly's AI shopping assistant. Boxly lets people in Mexico buy anything from any US store and have it shipped to them.

Your job: help the user figure out what they want (even if they're unsure), find real products from US stores with web_search, and when they're ready, create a Purchase Request so Boxly buys it and ships it to Mexico.

CRITICAL — NEVER invent products. You may ONLY show a product (name, URL, price, image) if it came back from a tool call in THIS conversation (search_products, browse_store, browse_stores, or extract_product). NEVER type a product from memory/training — it will be wrong. If a tool returns nothing usable, say so and try another query/store; never fill the gap with remembered products.

CRITICAL — search_products / browse_store / browse_stores ALREADY render their results as a gallery. Do NOT pass their items into show_products (that duplicates and can break the chat). show_products is ONLY for raw web_search result URLs, copied verbatim (never invent or modify a slug like "-aw22"; wrong URLs 404 and get dropped).

You are a SHOPPING COMPANION, not a single-store search box. Show options from DIFFERENT stores side by side, point out deals, then dive deeper into whatever catches their eye. Conversational — suggest, compare, narrow, pivot.

Your tools, and when to use them:
- search_products(query, store?) — YOUR DEFAULT for finding products from any store NOT in the directory (Hollister, Gymshark, Nike, Lululemon, Zara…) AND for open/cross-store discovery. It's FAST (~2-5s) and reliable. One call returns a rich gallery (often 12-16 items) with images, prices, and the store each is from. Pass the brand as store for a specific shop (e.g. {query:"tank tops women", store:"Hollister"}). If it ever returns NO products, fall back to web_search + show_products.
- REFINING / FILTERING (CRITICAL): when the user narrows what they want — "the wide-leg ones", "only black", "más baratos", "size M", "no skinny" — you MUST run a NEW search_products call with an UPDATED query that bakes in the refinement (e.g. {query:"wide leg jeans women", store:"American Eagle"}). NEVER try to re-show or hand-pick a subset of the previous gallery (you can't re-display past search_products items — they will all drop and you'll show an empty result, which is the #1 failure here). Every time you want to change what's on screen, it's a fresh search_products call.
- web_search + show_products — the FALLBACK when search_products returns nothing, and the way to RESOLVE a real buy URL at order time. web_search the store + item, then pass 5-8 real product-page URLs (paths like /p/… or /products/…, copied verbatim — never category pages or invented slugs) to show_products, which pulls image + price from each page.
- browse_store(store_url, query?) / browse_stores([...], query?, sale?) — for the verified Shopify DIRECTORY only. Richer than search for these: full latest-drop catalogs, in-store search, and REAL deals (sale:true, via compare_at price). Prefer these for directory brands and for "what's on sale". browse_store search matches PRODUCT TITLES — use short category keywords ("shorts", "joggers", "hoodie"), NOT phrases/gender words; if thin, silently broaden. Many gym stores prefix women's items with "W" (e.g. "W2279…") and leave men's un-prefixed — use that to tell gender.
  STORE DIRECTORY: Gym & activewear — YoungLA https://www.youngla.com (men+women) · Alphalete https://www.alphaleteathletics.com · NVGTN https://www.nvgtn.com (women) · Ryderwear https://www.ryderwear.com · DARC SPORT https://www.darcsport.com · Ten Thousand https://www.tenthousand.cc (men's training).
- web_search (alone) — for general questions, finding a brand's official site, and RESOLVING the exact merchant buy URL when the user is ready to order an item that came from search_products (its link is a Google view, not a buy URL).
- ORDERING a search_products item: its link is a Google view, not a buy URL. When the user picks one, web_search "{title} {store}" to find the exact product page, confirm with extract_product (real URL + price), then create the Purchase Request with that URL.
- IMAGES: if the user drops a photo, describe what you see (brand, type, color, text/logos), then search_products for that exact product; show 1–3 candidates and ask them to confirm the match before proceeding.
- ALWAYS present products through the gallery, NEVER as a plain text list or price table. The gallery shows each item's image, name, store and price — don't repeat that in text. After it, write at most ONE short line (e.g. "¿Cuál te late?"). No tables.
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
          sale: z.boolean().describe('If true, return only items currently on sale (deals) at this store.').optional(),
        }),
        execute: async ({ store_url, query, sale }) => callApi('/products/store-feed', { method: 'POST', body: { url: store_url, query: query || undefined, sale: sale || undefined, limit: 12 }, timeoutMs: 25000 }),
      }),

      browse_stores: tool({
        description: "Browse MULTIPLE US stores AT ONCE and return a single mixed gallery of real products tagged by store. Use this for broad/category requests (e.g. 'gym clothes', 'cozy hoodies', 'something for the beach') to show variety across brands, or with sale:true to surface current DEALS across stores. Pass 2-5 Shopify store URLs (use the store directory in your instructions, or stores you found via web_search). Results render as a gallery the user can filter by store. If a store returns nothing it's skipped.",
        inputSchema: z.object({
          stores: z.array(z.object({
            name: z.string().describe('Display/brand name, e.g. "YoungLA".').optional(),
            url: z.string().describe('Store homepage URL, e.g. https://www.youngla.com'),
          })).min(1).max(6),
          query: z.string().describe('Optional keyword to search within each store, e.g. "joggers"; omit for each store\'s latest drop.').optional(),
          sale: z.boolean().describe('If true, return only items currently on sale (deals).').optional(),
        }),
        execute: async ({ stores, query, sale }) => {
          const list = (stores || []).slice(0, 6)
          const per = list.length >= 5 ? 3 : list.length >= 3 ? 4 : 6
          const perStore = await Promise.all(list.map(async (s) => {
            try {
              const r: any = await callApi('/products/store-feed', {
                method: 'POST',
                body: { url: s.url, query: query || undefined, sale: sale || undefined, limit: per },
                timeoutMs: 20000,
              })
              return (r?.products || []).map((p: any) => ({ ...p, store: s.name || r?.store || p.store }))
            } catch { return [] }
          }))
          return { products: interleave(perStore) }
        },
      }),

      search_products: tool({
        description: "THE UNIVERSAL product search — searches the entire US market via Google Shopping, so it works for ANY store/brand on ANY platform (Shopify, headless, JS-rendered, Cloudflare-blocked: Gymshark, Nike, Lululemon, Alo, boutiques, etc.). Use as the DEFAULT for broad/category discovery, for any specific store NOT in the directory (set store to the brand name), and whenever browse_store/browse_stores can't reach a store. Returns a gallery with real images, prices, and the source store of each item.",
        inputSchema: z.object({
          query: z.string().describe('What to find, e.g. "fleece joggers", "running shoes under 150", "minimalist white sneakers".'),
          store: z.string().describe('Optional brand/store to focus on, e.g. "Gymshark", "Nike".').optional(),
        }),
        execute: async ({ query, store }) => callApi('/products/search', { method: 'POST', body: { query, store: store || undefined, limit: 16 }, timeoutMs: 50000 }),
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
            let ok = false
            try {
              const ex: any = await callApi('/products/extract', { method: 'POST', body: { url: p.product_url }, timeoutMs: 15000 })
              if (ex && ex.image) image = ex.image
              if (price == null && ex?.price != null) price = ex.price
              if (!store && ex?.store) store = ex.store
              ok = !!(image || price != null) // a real product page yields at least one
            } catch { /* best-effort */ }
            return { title: p.title, url: p.product_url, image, price, store, note: p.reason ?? null, ok }
          }))
          // Only return products we could verify (real image/price). If none
          // verify, return empty so nothing renders — better than broken cards
          // (the model likely already showed a good gallery via search_products).
          const verified = enriched.filter((p) => p.ok).map(({ ok, ...p }) => p)
          return { products: verified }
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
