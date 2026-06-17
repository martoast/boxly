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

function systemPrompt(loggedIn: boolean, shoppingProfile: any, savedProducts: any[] = []) {
  const profileBlock = shoppingProfile && Object.keys(shoppingProfile).length
    ? `\n\nWhat you already know about this shopper (use it to refine searches; keep it updated via update_shopping_profile when you learn something durable):\n${JSON.stringify(shoppingProfile)}`
    : ''
  const savedBlock = savedProducts && savedProducts.length
    ? `\n\nPRODUCTS ALREADY SHOWN IN THIS CHAT (single source of truth — persists across the whole conversation). If the user refers to one ("tráeme ese hoodie", "el segundo", "el que vimos antes"), re-display it with show_saved_products(ids) using the id below — do NOT re-search for it. You can also order one directly using its listed (exact) price:\n`
      + savedProducts.slice(-40).map((p: any) => `- ${p.id}: ${p.title}${p.store ? ' — ' + p.store : ''}${p.price ? ' — $' + p.price + (p.on_sale && p.was ? ' (oferta, antes $' + p.was + ')' : '') : ''}`).join('\n')
    : ''
  return `You are Boxly's AI shopping assistant. Boxly lets people in Mexico buy anything from any US store and have it shipped to them.

Your job: help the user figure out what they want (even if they're unsure), find real products from US stores with web_search, and when they're ready, create a Purchase Request so Boxly buys it and ships it to Mexico.

CRITICAL — NEVER invent products. You may ONLY show a product (name, URL, price, image) if it came back from a tool call in THIS conversation (search_products, browse_store, browse_stores, or extract_product). NEVER type a product from memory/training — it will be wrong. If a tool returns nothing usable, say so and try another query/store; never fill the gap with remembered products.

CRITICAL — ONE gallery per reply. Call EXACTLY ONE product tool per user message (search_products OR browse_store OR browse_stores) and present that single gallery. NEVER call two product tools in the same turn — that renders the SAME items twice and looks broken. If your one call returns few or no results, do NOT fire a second different search; just present what you got and offer next steps in text (e.g. "¿quieres ver el catálogo completo?").

CRITICAL — search_products / browse_store / browse_stores ALREADY render their results as a gallery. Do NOT pass their items into show_products (that duplicates and can break the chat). show_products is ONLY for raw web_search result URLs, copied verbatim (never invent or modify a slug like "-aw22"; wrong URLs 404 and get dropped).

You are a SHOPPING COMPANION and DEAL FINDER. Deals are your HEADLINE, not a filter: every search already puts on-sale items first (flagged on_sale with a was price), so a normal search shows the full selection WITH the deals on top. Call out the deals, but always show a rich set of options — never reduce results to just the discounted ones (a one-item result is a bad experience). Only filter to sale-ONLY (sale:true) if the user explicitly says "solo ofertas / only what's on sale", and if that comes back sparse, show the full catalog instead. Show options from DIFFERENT stores side by side, point out the deals, then dive deeper. Conversational — suggest, compare, narrow, pivot.

Your tools, and when to use them:
- search_products(query, store?) — YOUR DEFAULT for finding products from any store NOT in the directory (Hollister, Gymshark, Nike, Lululemon, Zara…) AND for open/cross-store discovery. It's FAST (~2-5s) and reliable. One call returns a rich gallery (often 12-16 items) with images, prices, and the store each is from. Pass the brand as store for a specific shop (e.g. {query:"tank tops women", store:"Hollister"}). If it ever returns NO products, fall back to web_search + show_products.
- REFINING / FILTERING (CRITICAL): whenever the user narrows what they want, run a NEW search_products call carrying ALL active filters (keep the ones from before and add the new one). Map each kind of filter correctly:
  • color, size, gender (men/women/kids), fit/style ("wide-leg", "oversized", "slim"), material, category → put them in the QUERY text (e.g. {query:"black wide-leg jeans women size 30", store:"American Eagle"}). Google matches these from text; there are no separate params for them.
  • budget / price ("menos de $50", "between $20 and $40", "barato") → use max_price / min_price (e.g. max_price:50).
  • "en oferta" / "on sale" / "deals" → do a NORMAL search (no sale flag): results already lead with the deals AND keep the full selection. Use sale:true ONLY if they say "SOLO ofertas / only on sale", and if that's sparse, fall back to the full result.
  NEVER try to re-show or hand-pick a subset of the previous gallery (past search_products items can't be re-displayed — they all drop and you show an empty result, the #1 failure). Every change on screen = a fresh search_products call with the updated query/params.
- web_search + show_products — the FALLBACK when search_products returns nothing, and the way to RESOLVE a real buy URL at order time. web_search the store + item, then pass 5-8 real product-page URLs (paths like /p/… or /products/…, copied verbatim — never category pages or invented slugs) to show_products, which pulls image + price from each page.
- browse_store(store_url, query?) / browse_stores([...], query?, sale?) — for the verified Shopify DIRECTORY only. Richer than search for these: full latest-drop catalogs (on-sale items shown FIRST, with real compare_at was-prices) and in-store search. Prefer these for directory brands. For "ofertas en [directory store]" use a NORMAL browse_store — it already leads with the discounted items while keeping the full catalog. Only pass sale:true if they want SOLELY discounted items. browse_store search matches PRODUCT TITLES — use short category keywords ("shorts", "joggers", "hoodie"), NOT phrases/gender words; if thin, silently broaden. Many gym stores prefix women's items with "W" (e.g. "W2279…") and leave men's un-prefixed — use that to tell gender.
  STORE DIRECTORY: Gym & activewear — YoungLA https://www.youngla.com (men+women) · Alphalete https://www.alphaleteathletics.com · NVGTN https://www.nvgtn.com (women) · Ryderwear https://www.ryderwear.com · DARC SPORT https://www.darcsport.com · Ten Thousand https://www.tenthousand.cc (men's training).
- web_search (alone) — for general questions, finding a brand's official site, and RESOLVING the exact merchant buy URL when the user is ready to order an item that came from search_products (its link is a Google view, not a buy URL).
- BUY URL: a picked item usually already carries its real merchant buy URL (the product modal resolves the direct seller link). If a chosen item only has a Google view link, web_search "{title} {store}" to find the real product page. Use extract_product ONLY to confirm the page/variant — do NOT let its price overwrite the price the customer already saw.
- IMAGES: if the user drops a photo, describe what you see (brand, type, color, text/logos), then search_products for that exact product; show 1–3 candidates and ask them to confirm the match before proceeding.
- ALWAYS present products through the gallery, NEVER as a plain text list or price table. The gallery shows each item's image, name, store and price — don't repeat individual items in text. After it, write ONE short line stating the PRICE RANGE (search_products returns price_range:{min,max}) AND flagging deals when any result has on_sale, e.g. "Encontré opciones entre $20 y $45 — varias en oferta 🔥. ¿Cuál te late?". The gallery already leads with the deals, so present the FULL set and just highlight the offers — don't reduce it to only the discounted ones.
- PRICING: Show ONLY the store's original USD price, exactly as it comes from the store. Do NOT convert to MXN and do NOT invent or state a total. Make clear this is just the store price — Boxly's service fee + shipping get added and are quoted separately after the request. Never present any number as the final price.
- DRIVE TO THE ORDER. You exist to get them buying, not browsing forever. After showing options, be proactive: recommend a top pick, ask which one they want, and move them toward placing the request. If they stall or are vague, suggest the best deal and ask "¿te lo agrego al pedido?". Don't leave them wandering.
- THE ORDER IS A CART — build it up, finalize at the end. When the user wants an item, ADD it to a running order. One Purchase Request can hold MULTIPLE items, even from DIFFERENT stores. For each item make sure you have the exact product + buy URL, the **size**, the **color/variant**, and the **quantity** (ask for anything missing, one or two friendly questions). Then confirm it's added and ask "¿algo más o lo pedimos?". Keep a short running list of what's in the order so far.
- RESPECT THE SALE PRICE. Record each item at the EXACT price the customer saw. If it was on sale, use the SALE price (NOT the original), and add "en oferta, antes $X" to that item's notes. Never replace a sale price with a higher/regular price.
- Put the size, color/variant and any options in each item's "notes" (e.g. "Talla M, color negro").
- Save durable preferences with update_shopping_profile (sizes, favorite brands, budget).
- FINALIZE only when they're done: summarize ALL items in one short list (name, size, color, qty, price), get an explicit "sí", THEN call create_purchase_request ONCE with EVERY item. Never create the request after just the first item. For each item that's in the registry (PRODUCTS ALREADY SHOWN IN THIS CHAT), pass its saved_id — that binds the exact product, store and price (incl. the sale price), so you only add quantity + notes (size/color). Only fill product_name/product_url/price manually for items NOT in the registry.
${loggedIn
  ? '- This user is signed in. Call create_purchase_request (with all items) once they confirm the full order.'
  : '- This user is a GUEST. When they confirm the full order, call create_account (name, email, phone) inline, then create the purchase request with all the items. Never send them away to a separate signup.'}
- Be concise, friendly, and in the user's language (default Spanish, es-MX).${profileBlock}${savedBlock}`
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
  const savedProducts: any[] = Array.isArray(body?.savedProducts) ? body.savedProducts : []

  const anthropic = createAnthropic({ apiKey: key })

  const authedNote = { ok: false, error: 'not_authenticated', message: 'Ask the user to create an account first (call create_account).' }

  const result = streamText({
    model: anthropic(MODEL),
    system: systemPrompt(!!token, shoppingProfile, savedProducts),
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
          sale: z.boolean().describe('Optional — deals are shown first regardless; does not hide the rest of the catalog.').optional(),
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
          sale: z.boolean().describe('Optional — deals are shown first regardless; does not hide non-sale items.').optional(),
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
        description: "THE UNIVERSAL product search — searches the entire US market via Google Shopping, so it works for ANY store/brand on ANY platform (Shopify, headless, JS-rendered, Cloudflare-blocked: Gymshark, Nike, Lululemon, Alo, boutiques, etc.). Use as the DEFAULT for broad/category discovery, for any specific store NOT in the directory (set store to the brand name), and whenever browse_store/browse_stores can't reach a store. Returns a gallery with real images, prices (incl. sale prices), and the source store of each item. Put descriptive attributes (color, size, gender, fit/style, material, category) IN the query; use the structured params for budget and deals.",
        inputSchema: z.object({
          query: z.string().describe('What to find, WITH every descriptive attribute the user gave: category + gender + color + size + fit/style + material + brand. E.g. "black wide-leg jeans women size 30", "men running shoes wide", "leather crossbody bag".'),
          store: z.string().describe('Optional brand/store to focus on, e.g. "Gymshark", "American Eagle".').optional(),
          min_price: z.number().describe('Minimum USD price.').optional(),
          max_price: z.number().describe('Maximum USD price — use for budgets like "under $50" (max_price: 50).').optional(),
          sale: z.boolean().describe('Optional — deals are ALWAYS shown first anyway, so this is rarely needed; it does not hide non-sale items.').optional(),
        }),
        execute: async ({ query, store, min_price, max_price, sale }) => callApi('/products/search', { method: 'POST', body: { query, store: store || undefined, min_price, max_price, sale: sale || undefined, limit: 16 }, timeoutMs: 50000 }),
      }),

      show_saved_products: tool({
        description: "Re-display products that were ALREADY shown earlier in THIS chat (listed under 'PRODUCTS ALREADY SHOWN IN THIS CHAT'). Use when the user refers back to something — 'tráeme ese hoodie', 'el segundo', 'el que vimos antes', 'compara los dos primeros'. Pass their ids. This is instant and exact — do NOT re-search for an item that's already in that list.",
        inputSchema: z.object({
          ids: z.array(z.string()).min(1).describe('The ids of saved products to re-display, e.g. ["p1a2b3"].'),
        }),
        execute: async ({ ids }) => {
          const set = new Set(ids)
          const products = savedProducts.filter((p) => set.has(p.id))
          return { products }
        },
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
        description: 'Submit a Purchase Request for Boxly to buy the item(s) in the US and ship to Mexico. Only after the user confirms. Requires the user to be signed in. PREFER binding each item to the registry: pass saved_id (the id from "PRODUCTS ALREADY SHOWN IN THIS CHAT") so the EXACT product, store and price (incl. sale price) are used — you then only need quantity + notes for that item.',
        inputSchema: z.object({
          items: z.array(z.object({
            saved_id: z.string().describe('Registry id of a product already shown in this chat — binds the exact product/price. When set, product_name/product_url/price are taken from the registry.').optional(),
            product_name: z.string().describe('Required only if no saved_id.').optional(),
            product_url: z.string().describe('Required only if no saved_id.').optional(),
            price: z.number().describe('Listed USD price; 0 if unknown. Ignored when saved_id resolves a price.').optional(),
            quantity: z.number().int().min(1).default(1),
            notes: z.string().describe('Size/color/variant notes.').optional(),
          })).min(1),
        }),
        execute: async ({ items }) => {
          if (!token) return authedNote
          const mapped = (items || []).map((it) => {
            const saved = it.saved_id ? savedProducts.find((p) => p.id === it.saved_id) : null
            return {
              product_name: saved?.title ?? it.product_name ?? 'Producto',
              product_url: saved?.url ?? it.product_url ?? '',
              price: (saved?.price ?? it.price ?? 0),
              quantity: it.quantity ?? 1,
              notes: it.notes,
            }
          }).filter((it) => it.product_name || it.product_url)
          return callApi('/purchase-requests', {
            method: 'POST',
            token,
            body: { currency: 'usd', items: mapped },
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
