# Smart box that flips — unified search + business Q&A

## Goal
Make the `/buscar` box route **per message** by intent:
- **Product query** → today's gallery flow, **unchanged** (`/buscar/resultados`).
- **Question about Boxly** → the box morphs into a **chat thread** that answers.

v1 capabilities: **product search (existing)** + **business Q&A**. No account tools,
no in-chat PR creation (later). Product search stays the polished search-first flow;
the chat only appears when someone asks a question.

## Design

### Intent routing (per message)
1. **Client heuristic first (no network hop)** so product searches stay instant:
   - Spanish question markers → `chat` (¿, cómo, cuánto/cuánta, qué, cuál, cuándo,
     dónde, por qué, puedo/pueden, funciona, sirve, tarda, cuesta, cobran, seguro,
     garantía, "se puede", etc.).
   - Otherwise → `search` (today's default; safe — preserves current behavior).
2. **AI fallback only when ambiguous** → `server/api/intent.post.ts` (Haiku),
   returns `{ mode: 'search'|'chat', query }`. Keeps the common product path
   zero-latency; only fuzzy inputs pay for a classify call.

### Knowledge base = admin-managed WIKI (Karpathy-style)
The KB is NOT hardcoded. It's a wiki of focused markdown articles the admin owns,
stored in the DB and editable in a new admin page. The whole published wiki is fed
into the assistant's system prompt (no retrieval needed at our scale).

**Backend (api/):**
- Migration `knowledge_articles`: id, title, slug (unique), section (nullable),
  content (markdown text), sort_order, is_published (default true), updated_by
  (nullable), timestamps. Mirrors the categories table style.
- Model `KnowledgeArticle`: fillable + casts + boot slug auto-gen + `scopePublished`.
  `CACHE_KEY` constant for the assembled-wiki cache.
- `Admin\AdminKnowledgeController` (index/store/show/update/destroy) — mirrors
  AdminCategoryController; busts the assembled cache on every write.
- `KnowledgeController@index` (PUBLIC, throttled): returns the assembled published
  wiki `{ markdown, articles, updated_at }`, `Cache::remember` 5 min. This is what
  the assistant consumes (nitro has no DB, so it fetches over HTTP).
- `KnowledgeBaseSeeder`: seeds initial articles (Cómo funciona, Precios y comisiones,
  Envíos y entregas, Tu casillero US, Compras presenciales, Métodos de pago, Sobre
  Boxly). Idempotent (updateOrCreate by slug). MUST be run on prod manually.

### Business Q&A (streaming)
- `server/api/ask.post.ts`: `streamText` (uses `ANTHROPIC_MODEL`, default Sonnet 4.6),
  `system` = **fetched wiki markdown** + tone rules. Input `{ messages }`. **No tools in v1.**
  Fetch cached in-memory ~60s; falls back to `server/utils/boxlyKnowledge.ts` (a small
  built-in constant) if the API is unreachable, so the assistant never goes dark.
- Tone rules (in the prompt, not the wiki): concise, warm, plain Mexican Spanish;
  answer ONLY from the wiki; if unknown, say so + point to WhatsApp/support; nudge to
  search a product or start a request when relevant, but **don't force a sale**.

### Admin page — the wiki editor
- `pages/app/admin/knowledge/index.vue`: master–detail. Left = article list grouped
  by section + "Nuevo". Right = editor (title, section, published toggle, markdown
  textarea + live `MarkdownText` preview, save, delete). `layout: 'admin'`,
  `middleware: ['auth','admin']`, `$customFetch('/admin/knowledge')`.
- `AdminSidebar.vue`: add "Base de conocimiento" nav entry (BookOpenIcon).

### SearchLanding.vue — add chat mode
- State: `messages[]` + derived `mode` (hero when empty, thread when chatting).
- Submit (hero box OR thread input): classify →
  - `search`: stash conversation to sessionStorage, `navigateTo` results (unchanged flow).
  - `chat`: append user msg, stream assistant reply (@ai-sdk/vue `Chat` → `/api/ask`),
    render with `MarkdownText`.
- Conversation persists in `sessionStorage` so returning from a product detour restores it.
- Add a couple of question suggestions ("¿Cómo funciona?", "¿Cuánto cobran?").

### Untouched
- `producto.vue`, `SearchResults.vue`, `ResultsGrid.vue`, `/products/*` — no changes.
  The product funnel, analytics, geo-pinning, auth gate all stay as-is.

## Tasks
- [ ] `server/utils/boxlyKnowledge.ts` — knowledge base string
- [ ] `server/api/ask.post.ts` — streaming Q&A endpoint (no tools)
- [ ] `server/api/intent.post.ts` — Haiku classifier (ambiguous-only fallback)
- [ ] `SearchLanding.vue` — heuristic + chat mode + thread UI + sessionStorage persistence
- [ ] Manual test: product query → results (unchanged); question → streamed answer;
      follow-up question; mixed routing; guest + logged-in.

## Fast-follow (not v1)
- Log questions to analytics (`search_events` type `question`) + "Preguntas más comunes" card.
- Account-help tools (track order, my PRs, my casillero address) for logged-in users.
- In-chat PR creation from a pasted link.
- Inline gallery inside the chat thread (vs navigating to results).

## Review (built 2026-06-22)

Shipped the smart-box-that-flips with an admin-managed knowledge wiki.

**API (new):** `knowledge_articles` migration; `KnowledgeArticle` model (slug auto-gen,
`scopePublished`, `CACHE_KEY`); `Admin\AdminKnowledgeController` (CRUD, busts cache on
write); public `KnowledgeController@index` (assembled published wiki, cached 5 min);
`KnowledgeBaseSeeder` (9 starter articles); routes (admin CRUD + public GET /knowledge).

**App (new):** `server/api/ask.post.ts` (streaming Q&A, Sonnet 4.6, grounded ONLY in the
fetched wiki, plain-text stream, 60s wiki cache + `boxlyKnowledge.ts` fallback);
`server/api/intent.post.ts` (Haiku classifier, ambiguous-only); `pages/app/admin/knowledge/
index.vue` (master–detail wiki editor with live markdown preview).
**App (edited):** `SearchLanding.vue` (heuristic + chat mode + thread + sessionStorage
persistence; product path unchanged); `AdminSidebar.vue` ("Base de conocimiento" nav).

**Verified locally:** admin CRUD + draft exclusion + cache-busting on publish; public
assembled endpoint; `/api/ask` streamed an accurate grounded answer (10% comisión, IVA 16%
≥$50, pago tras cotización); `/api/intent` routed ambiguous question→chat, product→search;
`/buscar` + admin page compile (200).

**DEPLOY NOTES (prod, manual):**
1. `php artisan migrate` (migrations don't auto-run on prod).
2. `php artisan db:seed --class='Database\Seeders\KnowledgeBaseSeeder'` (populate the wiki).
3. ANTHROPIC_API_KEY already set (assistant uses it); nitro fetches API_URL/knowledge.

Product search flow, analytics, geo-pinning, auth gate: untouched.
