# OpenAI GPT-5.6 Luna provider migration

- [x] Add the official OpenAI AI SDK adapter.
- [x] Default the explicit provider/model routing to `openai` / `gpt-5.6-luna` while preserving Google and Anthropic rollback providers.
- [x] Keep OpenAI on provider-compatible options and the custom web-search tool path.
- [x] Add focused provider/model/key/tool-routing tests.
- [x] Run focused tests and the smallest relevant build validation.
- [x] Record review evidence and local environment requirements below.

## Review — OpenAI provider migration (local only)

- Added `@ai-sdk/openai` and centralized OpenAI, Google, and Anthropic model/key routing.
- OpenAI defaults to `OPENAI_CHAT_MODEL=gpt-5.6-luna`; optional `OPENAI_AUX_MODEL` falls back to the chat model.
- Shopping discovery uses the authenticated live-shopping computer-use session; provider-specific search tools are retired.
- Missing selected-provider keys fail closed; the assistant's 503 identifies the required environment variable without including its value.
- Invalid nonblank `AI_PROVIDER` values are rejected instead of silently selecting OpenAI; whitespace-only selected-provider keys are treated as missing.
- Local environment: `AI_PROVIDER=openai`, `OPENAI_API_KEY`, optional `OPENAI_CHAT_MODEL` and `OPENAI_AUX_MODEL`. Rollback values remain `AI_PROVIDER=google` with `GEMINI_API_KEY`, or `AI_PROVIDER=anthropic` with `ANTHROPIC_API_KEY`.
- Evidence: `npm run test:ai-provider` (8/8 passed); `npm run build` (passed, with existing browserslist/chunk-size/duplicate-object-key warnings).

# P1: live shopping slice — Nuxt side only (PLAN, awaiting Alex's approval)

Status: PLAN ONLY — per CLAUDE.md nothing below is implemented until Alex
approves this todo. Scope: ONLY this repo's seams for the approved
architecture in
`/home/alex/mcp-servers/computer-use/docs/REMOTE_SHOPPING_PLATFORM_PLAN.md`
(revision 3, review-passed). The Laravel `/live-shopping/*` routes and the
engine/media plane are separate tracks with their own plans; every item here
that calls them is blocked until they exist. No new npm dependencies —
everything uses native `fetch` streaming and `RTCPeerConnection` (the same
primitives `components/Voice/VoiceAssistant.vue` already uses). NOTE:
native `EventSource` is deliberately NOT used — it cannot send an
`Authorization` header, and viewer tickets must never ride a query string
(URL/proxy/log leakage). SSE is consumed via authenticated `fetch` with an
incremental parser (below).

## What already exists (verified, do not rebuild)

| Piece | Where |
|---|---|
| Chat AI loop + tool belt (Vercel AI SDK `streamText`) | `server/api/assistant.post.ts` (tools at :741; conditional-tool pattern at :645) |
| Persisted tool-part shape `{type:'tool-<name>', toolCallId, state, input, output}` | `assistantPartsFromSteps` :197 / `persistTurn` :236 |
| Gallery rendering allowlist + loaders | `ShoppingAssistant.vue` `GALLERY_TOOLS` :1171, `TOOLS_WITH_LOADER` :1236, render gate :320 |
| Browser WebRTC with server-minted short-lived credential + direct SDP exchange + teardown | `VoiceAssistant.vue` :242-341, :457 |
| Server-to-server Laravel calls (`callApi`, no Origin) | `assistant.post.ts` :24, :160 |

## Rollout flag (off by default)

- [x] `LIVE_SHOPPING_ENABLED` read from `process.env` at REQUEST time inside
      `assistant.post.ts` (never via build-time `runtimeConfig` — the
      voice-session rule, `nuxt.config.ts:193` note). Flag off ⇒ the
      `live_verify` tool is simply absent from `tools` (conditional-spread,
      same pattern as the existing conditional tool at :645) and no prompt
      text mentions it. No client-side flag needed: the panel only renders
      when a `tool-live_verify` part exists in the stream/history.

## Proposed files (exact)

- [x] **`server/api/assistant.post.ts`** (edit, ~25 lines): add `live_verify`
      live-shopping tool — the request body follows the SHARED
      session-create contract being pinned with the Laravel track:
      `objective` (what to find/verify) + exactly ONE normalized store
      descriptor (ONE store in P1) + `conversation_id` for correlation —
      and NO arbitrary callback URL (the results return path is the
      API-side webhook, never client-supplied). `execute` → `callApi('POST
      /live-shopping/sessions', …, token)`,
      returns `{ session_id, store, status }`. Auth-gated: tool included only
      when the flag is on AND a Sanctum token is present. NOT a gallery tool;
      not in `GALLERY_TOOLS`; excluded from `prepareStep`'s post-gallery
      restriction only if the model should still be able to escalate after a
      gallery (default: leave it in `NON_GALLERY_TOOLS` so it can).
- [x] **`utils/liveShopping.ts`** (new, pure logic — testable without Vue):
      an INCREMENTAL SSE frame parser for fetch-streamed bodies (handles
      fragmented chunks, multi-line `data:` fields, comment/heartbeat
      lines; per-frame byte cap — malformed or oversize frames are dropped
      with a counted diagnostic, never crash the stream; tracks the last
      event id for resume), SSE event-envelope validation (closed kind
      enum, bounded fields, unknown kinds dropped), ticket-refresh
      scheduling (refresh at half TTL, never after expiry), reconnect
      backoff sequence (capped), the session state machine (connecting →
      streaming → reconnecting → terminal{completed|failed|cancelled|
      expired}), and the WHEP request builder (POST,
      `Content-Type: application/sdp`, `Authorization: Bearer` ticket).
- [x] **`composables/useLiveSession.ts`** (new): ticket fetch from Laravel
      `GET /live-shopping/sessions/{id}/ticket` (Sanctum cookie via the
      existing `$fetch` plugin), proactive refresh per `utils/liveShopping`,
      SSE via authenticated **fetch streaming** — `Authorization: Bearer
      <ticket>` header, ticket NEVER in the URL — reading the body through
      the incremental parser; on reconnect the request explicitly sends the
      `Last-Event-ID` header from the parser's cursor; capped backoff;
      reactive candidates list + session status.
- [x] **`composables/useWhepViewer.ts`** (new): `RTCPeerConnection` with
      `iceServers` from the ticket (STUN + ephemeral TURN creds),
      `addTransceiver('video', { direction: 'recvonly' })`, SDP POST via the
      request builder (store the `Location` resource URL from the answer
      response), `ontrack` → `<video>`. Recovery on ICE `failed`/`closed`
      is ONE FULL viewer reconnect — `restartIce()` alone is NOT recovery
      without WHEP renegotiation support: DELETE the WHEP resource (when a
      Location URL was provided), close the PC, re-mint the ticket, create
      a NEW PC, POST a NEW offer; if that cycle fails ⇒ honest error card.
      Teardown always: DELETE the WHEP resource when known + close the PC
      (the VoiceAssistant :457 discipline).
- [x] **Lifecycle ownership (both composables)**: one `AbortController`
      per viewer GENERATION owns the SSE fetch, the ticket-refresh timers,
      the WHEP fetches, and every retry timer — unmount or session change
      aborts the lot in one call. Every async completion is
      generation-guarded (captures its generation id and no-ops if a newer
      generation started), so a stale ticket refresh or late SDP answer
      can never mutate the current session's state.
- [x] **`components/Assistant/LiveShoppingPanel.vue`** (new, VIEW-ONLY):
      composes the two composables; renders the `<video>`, a status badge
      (`Agente navegando` — P1 has no takeover CTA), the progressive
      candidate list from SSE, and the error/terminal cards below. Registered
      loader while `part.state !== 'output-available'`.
- [x] **`components/ShoppingAssistant.vue`** (edit, 3 exact registrations):
      1. new `v-else-if` branch for `part.type === 'tool-live_verify' &&
         part.state === 'output-available'` → `<LazyLiveShoppingPanel
         :session="part.output" />` (placed with the other rich parts, near
         the `tool-show_shipment` branch at :372);
      2. `'tool-live_verify'` added to `TOOLS_WITH_LOADER` (:1236);
      3. `'tool-live_results'` added to `GALLERY_TOOLS` (:1171) — the
         webhook-appended TERMINAL results part (distinct type so a session
         handle and a product list never share a shape); `deriveProducts`
         needs nothing (verified tool-name-agnostic).
- [x] **`utils/liveShopping.test.mjs`** (new) + npm script `test:live`
      (`node --experimental-strip-types`, same as `test:feeds`).

## Error / expiry / reconnect UX (honest states, no silent spinners)

- [x] Ticket expiry: proactive refresh at half TTL; a 401 mid-session ⇒ ONE
      re-mint + retry; a second failure ⇒ `Sesión expirada` card with a
      Reintentar button (re-fetches ticket for the SAME session; never
      silently opens a new session).
- [x] SSE drop: `Reconectando…` badge, reconnect with the explicit
      `Last-Event-ID` header, capped backoff; after the cap ⇒ error card,
      candidates already received stay visible.
- [x] WHEP: ICE `failed`/`closed` ⇒ ONE full viewer reconnect (DELETE
      resource → close PC → re-mint ticket → new PC → new offer), then
      error card; stalled video (no frames for N s) ⇒ spinner overlay over
      the last frame, never a blank box.
- [x] Terminal states from SSE: tear down the viewer (DELETE + close),
      show the terminal card WITH the terminal candidates the panel
      already holds from SSE. Do NOT reload/replace the conversation —
      that can race the in-flight AI SDK stream and duplicate parts. The
      webhook-persisted `tool-live_results` part is for the NEXT
      authoritative conversation load (revisit/refresh), where it renders
      as a gallery. (If immediate in-place sync is ever demanded, it must
      be a targeted idempotent merge keyed by message/toolCallId and only
      while chat is idle — explicitly OUT of P1.)
- [x] Unmount/navigation/session-change: the generation's AbortController
      cancels SSE fetch, ticket timers, WHEP fetches, retry timers; DELETE
      the WHEP resource; no leaked connections, no stale completions.

## Focused tests

- [x] `utils/liveShopping.test.mjs` (pure): SSE incremental parser —
      fragmented chunks (frame split across reads), multi-line `data:`
      fields, malformed frames dropped-and-counted, oversize frames
      refused at the byte cap, abort mid-frame, and cursor resume (parser
      reports the exact `Last-Event-ID` to send); envelope validation
      (unknown kind dropped, over-cap fields refused); refresh scheduling
      never schedules past expiry; backoff sequence is capped; state
      machine covers every transition incl. all four terminals; WHEP
      request builder emits the exact method/headers/body and captures the
      Location resource URL.
- [x] **Composable harness** (`composables/liveShopping.harness.test.mjs`):
      the composables' logic factored to accept injected fetch/timers so a
      small node harness (no browser, no new deps) drives the
      hard-to-reach behaviours: terminal event ⇒ full teardown ordering
      (DELETE before close, card shown, no conversation mutation); unmount
      mid-reconnect ⇒ AbortController cancels everything, zero timers
      left; stale-generation ⇒ a late ticket/SDP completion from
      generation N is a no-op after generation N+1 starts; 401 ⇒ exactly
      one re-mint. If factoring for injection fights Vue reactivity, the
      fallback is extracting the orchestration into a plain
      class/function in `utils/` and testing THAT — the Vue wrapper stays
      thin either way.
- [x] Existing `test:feeds` stays green (no shared code touched).

## Acceptance (run before asking for review; engine + Laravel tracks must exist first)

1. Flag OFF (default): tool absent from the belt, `npx nuxi build` clean,
   zero behavioural diff in the assistant.
2. Flag ON + authed: an escalation request triggers `live_verify`; loader →
   panel; the persisted part round-trips through
   `POST /conversations/{id}/messages` in the verified shape.
3. SSE: progressive candidates render; the request carries
   `Authorization: Bearer` (ticket verifiably absent from URL and access
   logs); killing the connection server-side shows `Reconectando…` and
   resumes via the explicit `Last-Event-ID` header without duplicate
   events.
4. WHEP: live video from ONE REAL engine worker plays (fixtures prove the
   protocol; only the real worker closes this gate — platform plan §13);
   glass-to-glass latency measured and recorded, not asserted.
5. Expiry drill: short-TTL ticket streams uninterrupted via proactive
   refresh; a revoked ticket produces one re-mint then the honest error
   card.
6. Terminal: completed session shows the terminal card with its SSE-held
   candidates and does NOT mutate the open conversation; on the next
   authoritative conversation load the `tool-live_results` gallery
   renders and the thread's derived product rail includes the items.
7. Teardown: navigating away aborts everything (no open SSE fetch or
   PeerConnection, no pending timers) and DELETEs the WHEP resource; a
   forced mid-reconnect unmount leaves the same clean state.
8. `npm run test:live` and `npm run test:feeds` green.

## Out of scope for P1 (explicitly)

Takeover/lease UI, multi-store tabs + thumbnails, voice integration, any
Laravel or engine code, any analytics writes from this repo (the assistant's
existing `logQuestion` path is untouched; live-session analytics are the
API track's `source`-segmented SearchEvent).

---

## Review — P1 Nuxt slice implemented 2026-08-31 (local only, NOT deployed)

Implemented after codex-main's REVIEW_PASS froze the v1 contract. **No commit,
no push** — main auto-deploys production, so the working tree holds everything
until coordinator review + Alex's sign-off.

### Contract deltas frozen AFTER the plan (applied)

- Create body is `{conversation_id, objective, store_id}` — `store_id` is a
  flat slug (not a store object) and `conversation_id` is REQUIRED, so the
  tool now also gates on a claimed conversation existing.
- Tool output is the session HANDLE only: `{sessionId, status}` — never
  `output.products`.
- Candidate money is ProductV1 `current_price`/`list_price` objects
  `{amount, currency}`: `candidatePriceText` renders the amount with its
  EXPLICIT currency ("129.99 USD"), never an assumed $/USD, never a raw
  object; unknown/null/malformed money renders nothing (tested).

### Files

| File | Change |
|---|---|
| `utils/liveShopping.ts` | **new** — ALL the pure logic: incremental SSE parser (fragmentation, multi-line data, heartbeats, 64KB frame cap, NUL-id rule, Last-Event-ID cursor), envelope validation (closed kinds, bounded fields, money), state machine, ticket validation + half-TTL refresh, capped backoff, WHEP builders, and the two dependency-injected controllers (session + WHEP viewer) the composables wrap. The plan's testability fallback was taken deliberately: orchestration lives here as plain functions, Vue never touches it. |
| `composables/useLiveSession.ts` | **new** — thin ref wrapper; ticket minting via the existing `$customFetch` Sanctum plugin. |
| `composables/useWhepViewer.ts` | **new** — thin ref wrapper over the WHEP controller. |
| `components/LiveShoppingPanel.vue` | **new** — view-only panel: video + badge, progressive candidates, honest terminal/error cards, Reintentar (same session). Placed at `components/` (flat, repo convention) not `components/Assistant/` — the auto-import prefix trap the mobile pass documented. |
| `components/ShoppingAssistant.vue` | 3 registrations: `tool-live_results` → `GALLERY_TOOLS`, `tool-live_verify` → `TOOLS_WITH_LOADER`, panel branch + loader in the widgets chain. |
| `server/api/assistant.post.ts` | `live_verify` tool, conditional-spread behind `LIVE_SHOPPING_ENABLED` (request-time `process.env`) AND token AND conversationId; `nonGalleryTools` computed per request so escalation stays available post-gallery. |
| `utils/liveShopping.test.mjs` + `composables/liveShopping.harness.test.mjs` | **new** — 75 assertions; `npm run test:live`. |
| `package.json` | the `test:live` script line. |

### Verified

- `npm run test:live` — 50 + 25 pass, 0 fail: parser fragmentation/CRLF/
  oversize/abort/cursor; envelope + money; all state transitions incl. the
  four absorbing terminals; refresh never past expiry; backoff cap; WHEP
  header/body exactness (ticket never in a URL); and the harness: terminal ⇒
  DELETE-before-close with zero timers left, unmount-mid-reconnect aborts
  everything, stale-generation mint/SDP are no-ops, 401 ⇒ exactly one re-mint
  then expired, ICE failure ⇒ ONE full reconnect (DELETE → close → re-mint →
  new PC/offer) then failed.
- `npm run test:feeds` — still green (Best Buy 403 line is the environment's
  missing key, the case passes by design).
- `npm run build` — clean; `LiveShoppingPanel` in the client output,
  flag+tool in the server assistant chunk.

### Rollback / disable evidence

`LIVE_SHOPPING_ENABLED` is unset by default ⇒ `liveShoppingEnabled` is false ⇒
the tool object is `...({})`, `nonGalleryTools === NON_GALLERY_TOOLS`, no
prompt text changes — the assistant belt is behaviourally identical to today.
The panel renders only when a `tool-live_verify` part exists, which only the
tool can create. Disable = unset the env var (no deploy of this code path
even exists until commit). The new files are additive; reverting is deleting
them plus 3 small hunks.

### NOT verified — blocked on other tracks

Acceptance items 2–8 need the Laravel `/live-shopping/*` routes and a real
engine worker (platform plan §13): authed escalation round-trip, real SSE
resume without duplicates, live WHEP video + latency measurement, expiry
drill against a real short-TTL ticket. Fixtures prove the protocol here;
only the real worker closes the gate.

### Round 2 — REVIEW_CHANGES 0084de9b applied (same day)

The invented status/candidate envelope is replaced by the frozen **EventV1**
schema ({schema_version:1,id,session_id,seq,type,occurred_at,payload}; 12
closed types) with full validation: SSE id must equal data.id, session_id must
match the panel's session, seq is a positive integer with duplicate-drop and
GAP detection (a gap forces reconnect + replay from the last ACCEPTED id —
capped at 2 resyncs — instead of silently accepting reordered data), products
dedupe by URL and retention caps at 24. Security boundaries closed: ProductV1
url/image and ticket sse/whep URLs must be https with no credentials (ticket
URLs also no fragment), ticket TTL must be ≤60s and future, ICE servers are
validated, WHEP Location must be SAME-ORIGIN as whep_url or the exchange is
refused (no DELETE/Bearer to foreign origins), SDP answers are bounded. The
parser now bounds memory against endless no-newline lines (discard-through-
boundary, nothing oversized retained). Races fixed: WHEP recovery is
single-flight; POST/DELETE carry the generation signal plus bounded timeouts
(stop's DELETE retires on its own timeout); ticket refresh holds a single
schedule slot. UI truthfulness: create failures render an explicit
unavailable card (never blank), the panel refuses malformed history handles
via validateSessionHandle, worker/media/cancelling events map to honest
badges, and price text is computed once per candidate. live_verify's Zod now
trims/bounds objective (4–500) and pins store_id to the engine slug regex.
Tests rewritten around real EventV1 fixtures: 88 pure + 35 harness = 123
green; test:feeds green; build clean.

### Round 3 — REVIEW_CHANGES 20d55c0a applied (same day, resumed after account migration)

Reconciled against the ACTUAL Laravel code (`boxly-api` working tree:
LiveShoppingController, LiveShoppingEngine, ProductV1, routes/api.php). Most of
the six items were already in the tree from the interrupted pre-migration pass
(public-envelope unwrap, dual-ID handle, POST ticket, headers-don't-reset-the-
budget, strict ProductV1); this round finished and PROVED them:

- Fixed the interrupted rename that broke the wiring: the session controller
  matched EventV1 against `deps.sessionId`, which no longer exists on
  `LiveSessionDeps` (`engineSessionId`) — every event was being rejected, and 18
  harness tests were red. One-line fix in `utils/liveShopping.ts`.
- Harness brought onto the frozen contracts it tests: deps renamed to
  `engineSessionId`, fake mint now returns the REAL Laravel ticket envelope
  `{success:true,data:{…,expires_at:ISO}}`, and `prod()` fixtures are full
  ProductV1 (store/store_id required — strict validation rightly rejected the
  old partial fixtures).
- Item 5's missing proof added: deterministic harness test that repeated
  `200 + empty EOF` burns the finite budget (exactly initial +
  MAX_RECONNECT_ATTEMPTS fetches), lands on `failed`, zero timers left.
- Engine-id bound corrected to LARAVEL'S domain, not a guess:
  `LiveShoppingEngine::boundedId($id, 200)` accepts ≤200 chars / no control
  chars / trimmed, while our regex allowed only 128 from a narrow charset — a
  healthy session Laravel accepted could have rendered "unavailable". Regex now
  mirrors boundedId exactly; tests assert 200-char and interior-space ids pass,
  201/control/untrimmed fail.
- Panel `:key="c.id || c.url"` → `:key="c.url"` (ProductV1 has no `id`).

Verified: `npm run test:live` 113 + 38 = 151 green (was 125 + 18 red);
`test:feeds` green; `npm run build` clean. Cross-checked against Laravel:
create/ticket envelopes vs `present()`/`ticket()`, POST `/sessions/{id}/ticket`
in routes/api.php, ticket TTL ≤60s vs `bad_ticket_lifetime`, status constants
fit the handle's shape bound.

### Round 4 — REVIEW_CHANGES 3ce3fc9c applied (same day): canonical ProductV1 + exact envelopes

codex-main froze the canonical cross-repo ProductV1 (stricter than Laravel's
current boundStrict) and exact create/ticket key sets. Applied:

- **`utils/liveShopping.golden.json`** (new) — the GOLDEN cross-repo fixtures
  (product, wrapped create response, wrapped ticket response, fixed `now`),
  designed to be copied byte-for-byte into the engine and Laravel suites.
  Both local suites import it; validators must accept it exactly.
- **validateProduct** is now the canonical boundary: ALL nine keys present
  (no extras, none missing), title ≤300, url/image https ≤2048 with query
  allowed but FRAGMENT rejected, availability REQUIRED from the closed enum,
  observed_at REQUIRED strict UTC RFC3339 (`^…(\.\d{1,3})?Z$`) parseable and
  ≤5 minutes in the future (clock injected for determinism), money currency
  UPPERCASE-only (lowercase no longer coerced — moneyField change). Returns
  normalized copies; no caller-owned reference survives.
- **parseSessionCreateResponse**: exact 8-key present() key set enforced
  (missing OR extra key rejects) and `status === 'running'` required.
- **validateTicket**: exact 5-key set enforced; ice_servers must be an array.
- Tests updated/added: golden acceptance (product + wrapped ticket), all-nine-
  keys-required sweep, fragment/query URL split, strict observed_at formats +
  5m future boundary (accept at exactly +5m, reject past it), title 300/301,
  lowercase-currency rejection, create status/extra-key/missing-key rejection,
  ticket extra-key/missing-ice_servers/non-array rejection. Harness `prod()`
  upgraded to the full canonical shape.

Verified: test:live 126 + 38 = 164 green; test:feeds green; build clean.

### Build-environment note (not caused by this change)

The repo has no lockfile and `node_modules` was absent; a fresh
`npm install --no-package-lock` hoisted `tailwindcss@4.3.3` (dep of
`@tailwindcss/postcss ^4.0.7`) over the v3 that `@nuxtjs/tailwindcss@6.13.1`
needs, breaking `npm run build` before any of my changes. Locally worked
around with `npm install tailwindcss@3.4.19 --no-save --no-package-lock`
(package.json untouched). Worth flagging: any fresh environment — including
CI/Netlify cache misses — can hit this drift until a lockfile or a pinned
resolution exists.

---
*The completed in-person-shopping record that previously filled this file is
preserved verbatim below.*

---

# In-person shopping: let Velonie start the two-step flow for a customer

**Revised after Alex's correction** — the generic "list every Stripe invoice"
page is dropped. The real need is an interface to *initiate* an in-person
shopping order for a customer and mint the $10/store deposit link.

## What already exists (verified, do not rebuild)

| Step | Status |
|---|---|
| In-person PR object — `source=in_person`, `in_person_store_count`, `deposit_amount_usd`, `shopping_trip_id` (nullable), `awaiting_deposit` status | ✅ exists |
| $10/store rate — `services.in_person.per_store_fee_usd` | ✅ exists |
| Deposit paid → webhook flips PR to `pending_review`, emails customer + shopping team | ✅ exists (`StripeWebhookController::handleInPersonDepositPaid`) |
| Step 2: amount spent + 15% → Stripe invoice on the shopping account → `payment_link` → email | ✅ exists (`AdminPurchaseRequestController::createQuote`, already skips double-charging the deposit) |
| **Velonie creating an in-person PR for a customer** | ❌ missing — `AdminPurchaseRequestController::store` requires `items` and has no in-person branch |
| **A deposit link she can send over WhatsApp** | ❌ missing — only the customer's own self-serve Checkout Session exists, and those expire in ~24h |
| **`in_person` in the PR list source filter** | ❌ missing — only `store` / `assisted` |

So the work is the front half of step 1, not the whole pipeline.

## Design decisions

- **Stripe Payment Link, not a Checkout Session.** Verified against the test
  account: `restrictions.completed_sessions.limit = 1` works, so the link is
  one-time-use but never expires — right for a URL she pastes into WhatsApp.
  A Checkout Session dies in 24h.
- **Webhook needs no new branch.** Stripe copies a Payment Link's metadata onto
  the sessions it creates, so `type=in_person_deposit` arrives at the existing
  handler. I'll add a defensive fallback anyway (if session metadata has no
  `type` but `session.payment_link` is set, read the link's metadata), so it is
  correct whether or not that copy behaviour holds.
- **The $10 becomes a real Stripe product/price**, self-provisioned by
  `lookup_key`, seeded from config the first time. See the caveat below.
- **Store count is a number she types**; picking specific stores is optional.
  She often won't know the exact stores when she sends the reservation.

## API (`api/`)

- [x] Migration: `deposit_payment_link` + `deposit_payment_link_id` on
      `purchase_requests` (nullable), add to `$fillable`. Step 2 already owns
      `payment_link`, so the deposit needs its own column.
- [x] `app/Services/InPersonDeposit.php` — find-or-create product + price by
      `lookup_key`, read the amount back live from Stripe, mint the Payment Link.
- [x] `AdminPurchaseRequestController::storeInPerson()` — customer + store count
      (+ optional trip, stores, budget, notes) → PR in `awaiting_deposit` → link.
- [x] `AdminPurchaseRequestController::createDepositLink()` — remint if lost.
- [x] Routes under the existing `shopping` group (admins pass it too).
- [x] Webhook: metadata fallback + deactivate the link once paid.

## App (`app/`)

- [x] `pages/app/shopping/purchase-requests/create-in-person.vue` — customer
      search, store-count stepper with a live `n × $10` total, optional trip /
      stores / notes, then the link with a copy button.
- [x] `pages/app/shopping/purchase-requests/index.vue` — add `in_person` to the
      source filter, a "Nueva visita en persona" button, and a deposit
      pending/paid badge with copy-link on `awaiting_deposit` rows.
- [x] PR detail — deposit state + link + remint.

## Verify

- [x] Create a PR + link end to end against the local **test** shopping key.
- [x] Replay a `checkout.session.completed` payload through the webhook and
      confirm the PR flips to `pending_review`.
- [x] `npx nuxi build` clean.

## Caveats to raise with Alex

1. **Two sources of truth for the $10.** The customer's self-serve flow
   (`PurchaseRequestController::createDepositCheckout`) builds its line from
   `config('services.in_person.per_store_fee_usd')` with ad-hoc `price_data`.
   The new flow reads the Stripe price. Seeded from the same config so they
   agree today, but editing the price in the Stripe dashboard would move only
   Velonie's side. I'll log a warning on mismatch; unifying them means touching
   the working customer flow, so I'm leaving it unless told otherwise.
2. **No email in v1** — creating the deposit hands her a link to send over
   WhatsApp. There's no existing "here's your deposit link" Mailable and adding
   one is scope she didn't ask for.
3. API must deploy before the app.

---

## Review — built and verified 2026-08-17

All items above are done. What changed, and what I could and couldn't test.

### API

| File | Change |
|---|---|
| `database/migrations/2026_08_17_000000_add_deposit_payment_link_to_purchase_requests.php` | **new** — `deposit_payment_link` + `deposit_payment_link_id`. Step 2 owns `payment_link` and overwrites it, so the deposit needed its own columns or minting the quote would erase the reservation link. |
| `app/Services/InPersonDeposit.php` | **new** — find-or-create the fee product/price by `lookup_key`, mint the Payment Link, retire it once paid. Price is memoised per process so the amount stamped on the PR and the amount on the link are the same lookup. |
| `app/Http/Controllers/AdminPurchaseRequestController.php` | `storeInPerson()`, `createDepositLink()`, `inPersonPerStoreFee()`. Only customer + store count are required — the trip, stores, budget and notes are all optional, because none of that is settled when the request arrives over WhatsApp. |
| `app/Http/Controllers/StripeWebhookController.php` | Payment-link metadata fallback + deactivate the link on payment. |
| `app/Models/PurchaseRequest.php` | two new `$fillable` entries. |
| `routes/api.php` | three routes in the existing `shopping` group. `/in-person` is declared before `/{purchaseRequest}` so it isn't parsed as an id. |

### App

- `pages/app/shopping/purchase-requests/create-in-person.vue` — **new**. Customer
  search → store-count stepper → live total → link, with copy and a prefilled
  WhatsApp message (straight to their number when we have one on file).
- `pages/app/shopping/purchase-requests/index.vue` — "Nueva visita en persona"
  button, `in_person` source filter, `awaiting_deposit` status filter + badge
  colour, inline copy-link on unpaid rows, store count instead of item count on
  in-person rows. Also fixed `getStatusLabel`, which used `replace('_', ' ')` —
  only swaps the first underscore, so `awaiting_deposit` would have rendered as
  "AWAITING DEPOSIT" only by luck of having one. It has one; `pending_review`
  too. Made it `/_/g` anyway since the bug was one status name away.
- `pages/app/shopping/purchase-requests/[id]/index.vue` — deposit banner (unpaid:
  link + copy + remint; paid: one-line receipt) above the existing quote banner.

### Verified

- Find-or-create price: creates once, second call returns the same id (idempotent).
- `createPaymentLink` end to end against the test account — 4 stores → **$40.00**,
  metadata `type=in_person_deposit` + `purchase_request_id` (exactly what
  `StripeWebhookController` dispatches on), `completed_sessions.limit=1`,
  and `deactivatePaymentLink` flips `active` to false.
- Migration `up()` and `down()` against in-memory sqlite.
- `php -l` on every touched PHP file; all three routes present in `route:list`.
- `npx nuxi build` clean, `create-in-person` in the built output.

### NOT verified — needs a real environment

Docker wasn't running, so there is no local database. **The DB round trip is
untested**: creating a PR through `storeInPerson`, and the webhook flipping a
real row to `pending_review`. The Stripe half of both paths is verified; the
Eloquent half is not. Worth doing one real in-person visit end to end in
production before handing the page to Velonie.

### Notes

- Migrations run automatically on the DigitalOcean build, so no manual step.
- API must deploy before the app — the page 403s until the routes exist.
- The $10 still has two sources of truth (see caveat 1 above); a dashboard edit
  would move Velonie's side only, and logs a warning when it does.

---

## Follow-up — silent backfill mode (same day)

Alex: they also need to create these **without** any invoice or email, for
logging old visits that were already paid.

Worth noting first: creation was already email-free. `storeInPerson` sends
nothing, and `AdminPurchaseRequestController::update` — the manual-edit path for
amounts and status — sends nothing either. The only thing that reaches a
customer is the webhook firing on a paid link, and the quote step. So what was
actually missing was the ability to skip the **link** and set the starting
status by hand.

### API — `storeInPerson`

New optional inputs: `create_payment_link` (default true), `status`
(`awaiting_deposit` → `purchased`), `deposit_paid`, `deposit_paid_at`,
`deposit_amount_usd`.

Two rules keep the result coherent regardless of what the client sends:
- A visit logged as past the reservation stage counts its deposit as settled
  unless `deposit_paid` says otherwise.
- A link is **never** minted for a deposit already marked paid, whatever
  `create_payment_link` asked for. A payment request for an already-paid trip is
  the exact thing this feature exists to prevent.

`deposit_amount_usd` overrides the live rate, since an old visit may have been
charged something other than today's $10/store.

### App — create page

A two-card mode picker: **Cobrar la reserva** (default, unchanged behaviour) or
**Solo registrar**. Record mode reveals a status select, a "reserva ya pagada"
checkbox with an optional date, and an amount override, with a line spelling out
that nothing is emailed or charged. A watcher keeps status and the paid checkbox
from contradicting each other. The result panel drops the link, copy and
WhatsApp buttons when there's no link, and says what status it saved as.

Verified: `php -l` clean, `nuxi build` clean. Still no DB locally, so the
backfill path has the same untested Eloquent half as the rest.

Note: record mode still makes one **read-only** Stripe call (the price lookup)
to default the deposit amount — no object is created. Passing
`deposit_amount_usd` skips even that.

---

## Mobile pass on the purchase-request pages (iPhone Safari)

Applied to BOTH namespaces — `/app/admin/purchase-requests/*` and
`/app/shopping/purchase-requests/*` — since they are near-duplicate files.

### The three real defects

1. **Sticky headers slid under the mobile bar.** The sidebar renders a
   `fixed h-14 z-40` top bar on phones; every PR page header was
   `sticky top-0 z-30` inside the scrolling `<main>`. Scroll down and the
   header — back button, request number, actions — disappeared behind the
   logo. Now `sticky top-14 md:top-0 z-30` on all seven headers.

2. **iOS zoomed the page on every field tap.** Safari zooms when a focused
   input is under 16px and never zooms back. These forms use `text-sm`
   (14px) throughout, which is what made the layout "pop" off the side of
   the screen. Fixed in both layouts with a coarse-pointer media query, so
   desktop density is untouched.

3. **The list was a six-column table in an `overflow-x-auto`.** It didn't
   break the page, it did something worse — you had to drag a row sideways
   to see a request's status. Replaced below `md` with
   `components/admin/PurchaseRequestMobileList.vue`: one card per request,
   who + status always visible, whole card is the tap target, checkbox has a
   44pt hit area, and unpaid in-person reservations get a copy-link button
   inline. Status now reads "Por revisar" rather than "PENDING_REVIEW".

### Also

- Header/title blocks get `min-w-0` + `truncate` so a long customer email
  stops pushing the row sideways; name and email stack on phones.
- Bulk action bar stacks; its buttons go full-width on phones.
- Pagination stacks; pager buttons went from 26px tall to a real target.
- Modals get a gutter and `max-h-[90vh]` so the keyboard can't strand them.

### Verified / not verified

- `nuxi build` clean; component present in the built output.
- Caught before shipping: the tag was written `<PurchaseRequestMobileList>`
  but Nuxt auto-imports it as `AdminPurchaseRequestMobileList` — Vue renders
  an unknown tag as a native element and the build says nothing, so the
  mobile list would have silently rendered as an empty box. Now an explicit
  import, matching how `ExpenseModal` is used.
- **Not seen on a real device.** The browser tooling would not give me a
  true mobile viewport, so this is reasoned from the markup and Tailwind
  breakpoints, not observed. Worth a look on an actual iPhone.

---

## Live shopping — constraints-only engine objective

Root cause: the `live_verify.objective` schema currently demonstrates a
verb-first verification sentence. The model copies that example, repeating the
store and adding count/report prose that becomes a poor browser search query.

- [x] Extract one small exported objective-guidance constant for deterministic testing.
- [x] Rewrite the guidance to request only the product and hard constraints;
      explicitly exclude action prose, repeated store name, result counts,
      reporting instructions, and tracking markers.
- [x] Keep the existing wire schema, validation bounds, store slug validation,
      execution body, and public tool result unchanged.
- [x] Add focused tests that pin the guidance and existing validation contract.
- [x] Run only the focused frontend tests and type/build check needed for this slice.
- [ ] Re-run one authenticated local Nuxt → Laravel → engine → store journey,
      using IDs rather than injecting correlation text into the product objective.
- [ ] Verify the conversation persistence and terminal `tool-live_results` path
      against the exact database/container used by the local app.
- [ ] Extend the shared product-gallery normalizer with additive ProductV1
      money, discount, and availability fallbacks while preserving every
      legacy scalar producer.
- [ ] Give product cards real link semantics while preserving the existing
      primary-click modal behavior.
- [ ] Repeat the fresh-load UI check and confirm price, list price/discount,
      availability, and the product URL are exposed to the customer.

### Review

- New `server/utils/liveVerifyContract.ts`: exports
  `LIVE_VERIFY_OBJECTIVE_GUIDANCE` (constraints-only guidance with a good/bad
  example pair; explicitly excludes action verbs, store repetition — store_id
  already identifies the store — result counts with the one-verified-product
  contract stated, reporting instructions, and tracking markers) and
  `liveVerifyInputSchema` (the previous inline z.object moved verbatim except
  the objective description: `.trim().min(4).max(500)` and the
  `^[a-z0-9][a-z0-9_-]{0,39}$` store slug are unchanged and still mirror
  Laravel's `LiveShoppingController::store`). NOT placed in the root
  `utils/liveShopping.ts` on purpose: that file is dependency-free and shared
  with the client bundle via composables; this one imports zod and is
  server-only, under a non-colliding basename.
- `server/api/assistant.post.ts`: `inputSchema: liveVerifyInputSchema` replaces
  the inline object; tool description gains one sentence ("The session verifies
  current price and availability of ONE best-matching product; put only the
  product and its constraints in `objective`."). Execute body, create contract,
  handle result, flag gating: untouched. Note: the tool description sits in the
  Anthropic-cached static prefix, so the first turn per conversation model
  re-bills the prefix once, then caches again.
- Evidence: `node --experimental-strip-types server/utils/liveVerifyContract.test.mjs`
  → 21 passed, 0 failed (guidance pins all five exclusion classes + both
  examples + description wiring; validation table: trim-before-min, 4/500
  objective boundaries, slug case/dot/length/underscore, missing-field
  rejections). `npm run build` → clean (same pre-existing warnings as the
  provider-migration run).
- The two unchecked items (real authenticated UI journey; persistence +
  `tool-live_results` verification) are the coordinator's E2E gate, per the
  bridge instruction accompanying this slice's approval.

---

## Live shopping — persisted ProductV1 gallery rendering

Root cause (found by the reload-persistence E2E): `ProductGallery.vue`'s
normalizer read only legacy scalar `price`/`price_usd`/`was`/`on_sale`, so a
persisted `tool-live_results` ProductV1 card rendered title-only — its
`current_price`/`list_price` money objects and proven `availability` were never
read — and the card was a generic `role="button"` div, not a product link.

- [x] Extract the card mapping into a pure dependency-free `utils/galleryCard.ts`
      (`galleryCardModel`); legacy scalar fields always win, ProductV1 money
      objects are additive fallbacks under the USD-only display rule (mirrors
      Laravel `ProductV1::money`), sale evidence derives only when BOTH values
      came from ProductV1, malformed/string/negative/non-finite amounts map to
      null (never NaN, never a mislabeled currency).
- [x] Render availability explicitly: `in_stock` → visible "Disponible",
      `out_of_stock` → visible "Agotado", `unknown`/absent → silent (the card
      never claims a stock state nobody verified).
- [x] Card is a real `<a :href>` (target=_blank rel=noopener): plain click and
      keyboard Enter still open the in-chat modal via `preventDefault`; a
      MODIFIED click (ctrl/cmd/shift/alt) is left to the browser so native
      new-tab/copy-link works. Middle-click/right-click were never `click`
      events and now get real link behavior too.
- [x] Deterministic tests for legacy shapes, ProductV1, precedence, currencies,
      malformed money, all availability states, and URL fallbacks.
- [x] Run focused tests and the build check.

### Review

- New `utils/galleryCard.ts` (dependency-free — root utils ship to the client
  bundle) + `utils/galleryCard.test.mjs`: 36 passed, 0 failed
  (`node --experimental-strip-types utils/galleryCard.test.mjs`). Rows include
  the exact persisted E2E product (59.99/74.99 USD in_stock → price, was, 20%
  discount badge, "Disponible"), non-USD/mixed-currency safety, scalar-beats-
  object precedence, and the legacy-was/price-without-flag case that must NOT
  grow a badge.
- `components/ProductGallery.vue`: `normalized` now maps through
  `galleryCardModel`; card `div role="button"` → `<a :href>` with
  `onCardClick` (modified-click passthrough, plain-click modal); new stock
  captions. Carousel scrolling, hover-cycle, store chips, discount badges,
  arrows: untouched.
- `npm run build` → clean (same pre-existing warnings).
- Behavior deltas, stated: modified/middle-click on any gallery card now
  navigates to the product URL in a new tab (previously dead); cards with a
  proven stock state show a one-word caption. Everything else byte-identical
  for legacy producers (pinned by the test rows).

---

## P0 AI navigability — semantic login and conversation history

- [x] Give the password reveal control a stable dynamic name, pressed state,
      and explicit relationship to the password input; name the nearby error
      dismiss icon without changing visuals.
- [x] Replace conversation-row click-only div activation with a native button,
      expose the active row with `aria-current`, and keep delete as a separate
      uniquely named action with a bounded title.
- [x] Add focused source-contract tests for the required semantics.
- [x] Replace the inert desktop logout anchor with one native named button,
      give the account MenuButton a stable Spanish name, and clear client user
      state through the existing state ref.
- [x] Run focused tests and a production Nuxt build.
- [x] Run the local headless authenticated semantic matrix without submitting
      a shopping query or touching a store.

### Review

- `pages/login.vue`: password reveal keeps its visuals and now exposes dynamic
  Mostrar/Ocultar text, native pressed state, and `aria-controls=password`;
  the adjacent error-dismiss icon is named `Cerrar error`.
- `components/ConversationsList.vue`: each conversation opens through a native
  button with a bounded unique name and `aria-current=page`; delete remains a
  separate sibling button with the same bounded conversation identity.
- `node utils/aiNavigability.test.mjs` → PASS; composer regression suite →
  24 passed, 0 failed; `npm run build` → clean with pre-existing size/data
  warnings only.
- Authenticated coordinate-free matrix (fresh headless browser, local stack):
  login 13 actions / 10.340s; persisted `c=3` inspection 3 / 3.974s;
  conversation activation (`c=3` → `c=1`) 3 / 2.746s; exact 87-character
  Spanish composer readback 1 / 3.871s with no submit; logout attempt 5 /
  5.077s; protected revisit 2 / 2.433s. The persisted card exposed a native
  named product link, `$59.99 USD`, `$74.99`, and `Disponible`; no retry action
  was present in the terminal thread.
- Logout follow-up: `CustomerNavbar.vue` now exposes `Abrir menú de cuenta`,
  preserves Headless UI expanded state, renders `Cerrar sesión` as one native
  `type="button"` MenuItem binding, and assigns `useState("user").value = null`.
  Logout-only headless gate: open menu 2 actions / 2.607s; `End` menu navigation
  plus one `Enter` activation produced exactly one Laravel `/auth/logout`
  request; login identification 4 actions / 0.941s; protected `c=3` revisit
  denial 3 actions / 2.967s. Final URLs were `/login` and
  `/login?redirect=/app/search?c=3`. No coordinate, direct-API logout, query
  submit, or store action was used.

---

## Chat composer hardening — reliable typing + submit verification

Root cause set (from the real E2E's dropped-characters / NOT-VERIFIED report):
the composer textarea's accessible name was the ROTATING placeholder (AT
re-resolution could never match it twice), Enter ignored IME composition, the
controlled `:value`/emit round-trip left a one-render-stale window, and the
send payload never pinned the visible DOM bytes.

- [x] Stable accessible name: `aria-label="Escribe tu mensaje"` on the native
      textarea (placeholder keeps rotating visually; the AT name no longer does).
- [x] `defineModel('text')` + direct `v-model` (no controlled-prop echo; Vue
      defers v-model updates during IME composition natively).
- [x] Dual composition guards (compositionstart/end state + KeyboardEvent
      .isComposing) — Enter never submits uncommitted IME text; Shift+Enter
      newline, busy/empty gating, mic/attachments/paste untouched.
- [x] Explicit DOM-snapshot submit payload: `emit('send', { text, files })`;
      `ShoppingAssistant.onComposerSend` consumes payload text (ref fallback
      only when a payload has no text) — submitted bytes = visible bytes.
- [x] Pure gate logic in `utils/composerGate.ts` + house-style tests
      (`utils/composerGate.test.mjs`, 24/24) incl. template/parent source
      assertions (native textarea, stable name, v-model, payload consumption).
- [x] `npm run build` clean.
- [ ] Local browser AT-SPI type-and-readback probe of the composer (blocked —
      see evidence; the blocker is the LOGIN page, not the composer).

### Review

- Focused tests: `node --experimental-strip-types utils/composerGate.test.mjs`
  → 24 passed, 0 failed (byte-exact Spanish punctuation/accents passthrough,
  composition matrix, DOM-snapshot payload rule, source assertions).
- Build: `npm run build` clean (same pre-existing warnings).
- AT-SPI probe status (engine-side `probe_boxly_composer.mjs`, headless, no
  submit, no store): could NOT reach the composer because the /login page is
  itself agent-hostile. Findings recorded for the navigability audit:
  1. The password input never receives focus via AT-SPI `grab_focus` — typed
     characters land in the still-focused email field (screenshot-proven:
     "…example.netpassword" appended to the email value).
  2. The password reveal (eye) toggle is INVISIBLE to AT-SPI — it never
     appears in any button listing (SVG-only button pruned from the tree).
  3. AT-SPI-reported bounds on this page sit ~67px below their true screen
     position (email @960,495 vs on-screen ~428), so coordinate fallbacks
     mis-click too.
  4. Chromium exposes neither text nor character count for masked fields, so
     no read-back verification of a password is ever possible — flows must
     expose a deterministic post-input observable (the submit button's
     enabled state works, and did: it stayed [disabled] throughout).
  Credentials themselves are VALID (proved out-of-band: GET /csrf-cookie 204
  + POST /auth/login → 200 for the factory fixture user), so the composer
  probe needs either the coordinator's working authenticated E2E driver or a
  login-page a11y fix (separate slice) before it can run.
- OPERATIONAL NOTE (build/runtime desync): `npm run build` under the RUNNING
  `node .output/server/index.mjs` replaces hashed assets on disk while the
  server keeps serving its in-memory manifest — the app 500s on stale chunk
  refs until the process restarts. Every approved frontend build must be
  paired with the coordinator's Nuxt restart before any browser use.

---

## Async semantics — reviewer corrections

- [x] Cancel the assistant surface's pending status write on every observed
      transition, including alert-owned/silent transitions, and pin the
      streaming-to-error timer race deterministically.
- [x] Replace timestamp-only candidate aggregation with one owned cancellable
      one-second timer in `LiveShoppingPanel`; lifecycle/media/reconnect/error/
      terminal transitions preempt it, and unmount clears every pending write.
- [x] Make malformed/error `tool-live_verify` output a visible `role=alert`
      without a second hidden failure announcement.
- [x] Cover the older-message load lifecycle through the existing single
      assistant announcer and keep its visual spinner decorative for AT.
- [x] Run async, composer, gallery, live-verify, live, and production-build
      verification; record exact evidence below.

### Review

- `ShoppingAssistant.vue` now feeds every watched load/chat/alert transition
  through one `createAnnouncementScheduler` slot. Null transitions clear and
  cancel first, so the deterministic streaming→error test proves a pending
  “Respondiendo…” cannot land after an alert. The same single region owns the
  bounded older-page labels; the spinner is `aria-hidden`, the conversation
  region is busy during the fetch, and failure uses the existing alert toast.
- `LiveShoppingPanel.vue` owns exactly one trailing 1000ms candidate timer.
  Every lifecycle change cancels it; the callback snapshots the latest count
  and generation, then re-checks working lifecycle/count before writing.
  Terminal+count therefore emits terminal only. Unmount cancels the timer and
  invalidates both timer and deferred status writes.
- `tool-live_verify` no longer renders the generic tool-failure alert as well
  as its own card. Strict-handle failure and terminal tool failure share one
  red `role=alert`; the assistant's hidden scheduler observes alert ownership
  and cancels any polite pending write.
- Evidence: async announcements 63/63; composer 24/24; gallery 36/36;
  live-verify contract 21/21; live core 126/126 + harness 38/38; `npm run
  build` passed. Build emitted only the pre-existing stale Browserslist,
  large-chunk, and duplicate-object-key warnings. `git diff --check` passed.

---

## Live shopping — browser events without media (`media_available`), Nuxt slice

Root cause (found by the UI acceptance gate, not by a test): the v1 viewer
ticket couples the EVENTS stream to MEDIA. `engine_service/service.mjs` throws
`media_unavailable` 503 before minting whenever no publisher exists, and the
ticket is the only object carrying `sse_url` + the Bearer the browser needs.
With `mediaPublisher:null` (P1 today — a real publisher is blocked on Alex's
SFU/TURN approval) the customer therefore gets NO progressive candidates at
all, not merely no video. Terminal results still arrive via the signed webhook,
so the product silently degrades from "watch it work" to "wait in silence".

Approved cross-repo fix (codex-main, after an independent A/B assessment):
evolve the single ticket rather than add a second credential. Fable owns the
engine + Laravel halves; this slice is ONLY `/home/alex/boxly`.

- [x] Canonical golden fixture `utils/liveShopping.golden.json`: `ticket_response`
      gains `media_available: true`; new sibling `ticket_response_media_unavailable`
      with `media_available:false, whep_url:null, ice_servers:[]`. Byte-identical
      to the engine/Laravel copies (sha256 agreed with Fable before writing).
- [x] `utils/liveShopping.ts`: `TICKET_DATA_KEYS` gains `media_available` (6-key
      closed set); `ViewerTicket.whepUrl` becomes `string | null` plus
      `mediaAvailable: boolean`; `validateTicket` enforces the biconditional —
      `true` ⇒ validated https whep_url AND 1..8 valid ICE servers; `false` ⇒
      `whep_url === null` AND `ice_servers === []`. Every inconsistent
      combination is REFUSED, never coerced.
- [x] `utils/liveShopping.ts` WHEP controller: refuse to connect when
      `whepUrl` is null (defence in depth behind the panel's gate) — a null URL
      must never reach `buildWhepRequest`.
- [x] `components/LiveShoppingPanel.vue`: SSE always runs on a valid ticket;
      the video element and `viewer.start()` are gated strictly on
      `media_available === true`. `false` renders a CALM, non-alert capability
      line with the live badge still visible — it is not a failure, the agent is
      working. The red `role=alert` path stays reserved for media that was
      PROMISED (`media_available:true`) and then broke.
- [x] Focused tests: golden acceptance for both ticket branches; the full
      inconsistent-combination matrix; SSE opens and candidates render on a
      media-unavailable ticket with ZERO WHEP attempts; refresh/re-mint,
      Last-Event-ID resume, terminal teardown and unmount unchanged.
- [x] Run `npm run test:live` + the other focused suites. NO build, NO restart
      until Fable's engine/Laravel slice and this one are both ready.

### Review

- **`utils/liveShopping.golden.json`** — data objects byte-identical to the
  coordinator-pinned proposal (verified: parsed-equality against
  sha256 `484026c6…` after removing `_comment`). The `_comment` itself was
  REWRITTEN because it was false: it claimed the file is copied byte-for-byte
  into the engine and Laravel suites, and no such copies exist (grep-verified on
  both repos). It now says what is true — only this suite reads the file, the
  other two assert the same shapes in their own tests, and any wire change must
  land in all three in the same change. File sha256 is therefore
  `00fcb303b8d55daf63e986af2173e7fccd6949841b0be038d6f46b724f61f26f`; the
  comment-excluded data hash is
  `2af2b1d285cfd9373cfc8935b8357f4baa5aa12b3ea642da2299d30df4b2f781`.
  NOTE: the fixture key is `ticket_response_no_media` — the name in the actual
  hash-pinned file. Two bridge messages described it as
  `ticket_response_media_unavailable`; the file wins, and both other repos must
  use the file's name.
- **`utils/liveShopping.ts`** — `TICKET_DATA_KEYS` is now the 6-key closed set;
  `ViewerTicket.whepUrl` is `string | null` with a new `mediaAvailable: boolean`;
  `validateTicket` enforces the biconditional and refuses every mixed
  combination (`true` with null/absent whep_url or unreachable ICE, `false` with
  a whep_url, non-empty ice_servers, `undefined`, or `''`). TTL (future, ≤60s),
  the https/no-credentials/no-fragment rules and "ticket never in a URL" are
  untouched. The WHEP controller now short-circuits to a new `unavailable` state
  when `whepUrl` is null, so a null can never reach `buildWhepRequest` even if a
  caller ignores the panel's gate.
- **`components/LiveShoppingPanel.vue`** — video and `viewer.start()` gate on
  `mediaAvailable === true`. `false` renders a calm gray capability row (`Agente
  navegando · Sin video en esta sesión`) with NO alert role and NO red: the
  session is working and its candidates keep arriving. The status badge moved
  out of the video box so losing the video never costs the customer the status
  it was drawn on. The red alert path stays reserved for media that was PROMISED
  and then broke — pinned by a test asserting `failed !== unavailable`.
- **Evidence**: `npm run test:live` → 142 pure + 50 harness, 0 failed (was
  126 + 38). New coverage: both golden ticket branches, the full
  inconsistent-combination matrix, SSE connecting and streaming candidates on a
  media-unavailable ticket with zero PeerConnections / zero WHEP POSTs / nothing
  to tear down / zero timers left, and promised-then-broken media still ending
  in `failed`. Also green and untouched: composerGate 24, galleryCard 36,
  asyncAnnouncements 63, aiNavigability, liveVerifyContract 21, test:ai-provider
  8, test:feeds. `tsc --noEmit --strict` on `utils/liveShopping.ts` → 0 errors.
  `git diff --check` clean.
- **Not run deliberately**: no `npm run build`, no service restart, no commit —
  the coordinator sequences those after both slices are reviewed, and building
  under the running server swaps hashed assets out from under it (the
  build/runtime desync noted earlier in this file).
- **Still open, and it gates calling the live path "working"**: with no
  publisher the customer gets progress but no video, which is the honest state,
  not the intended product. And the engine must be proven NOT to close an
  ESTABLISHED SSE stream when the 60s ticket that opened it expires — otherwise
  the panel will flap between reconnects. That belongs to the engine track.

### UI acceptance gate — outcome 2026-09-01 (local, one journey)

Ran the single authenticated New Balance journey twice; the first attempt was
blocked by a stale `active_slot` (fixture session id=1 held the customer's one
slot since 02:06Z because no scheduler was running, so every create 409'd — the
exact lockout `LiveShoppingReconcile`'s docstring predicts). After the product's
own reconciler released it, the replacement journey created a REAL session
(local id=1002, engine 855f4012…) and the engine performed a genuine browse-only
New Balance run.

PASS: login; composer readback; thread echo; model escalation to `live_verify`
with a constraints-only objective; session create; engine run; signed terminal
webhook → receipt `processed` → `tool-live_results` appended → session terminal
with `active_slot` released; reload persistence; logout (`/auth/logout`, one
request) and protected-route denial (`/login?redirect=/app/search?c=5`).

NOT PROVEN, and not provable in this topology: progressive SSE candidates and
the calm `Sin video en esta sesión` row. The ticket's `sse_url` points at the
engine's PUBLIC origin `https://engine.boxly.test`, which has no DNS entry on
this machine and is unreachable from the browser. The panel therefore reported
`No pudimos mantener la conexión con la sesión en vivo.` — truthful, and the
right thing to show, but it means the browser has NEVER once received a live
event locally. Decoupling the ticket from media was necessary but not
sufficient: the events transport also has to be reachable.

Also unproven: real product cards (link/image/price+currency/availability). The
engine's run ended `store_blocked` at turn 13 — New Balance refused an agent
that had already visited 176 times — so zero candidates existed to render. The
empty `{products: []}` result persisted and rendered as nothing, which is
correct.

---

## Live shopping — a finished session must never be reported as a lost connection

Root cause (found by the SSE gate, correlated against the engine's journal): the
viewer's ONLY terminal signals were an SSE frame or a reconnect. Session 1003
ended `store_blocked` at seq 10, journaled 06:46:15.464Z — **599ms after this
browser's stream had already closed at 06:46:14.865Z**. The engine wrote the
frame correctly (a second observer stream, open on the same service, received it
then clean EOF), but no frame can reach a stream that is already gone. On reload
the panel re-minted, Laravel correctly answered **409 "no longer live"**, the
mint failed, and the controller mapped that to `give_up` → `failed` → *"No
pudimos mantener la conexión con la sesión en vivo."*

The connection was never the problem. The session had finished, and the server
knew it. `failed` was silently doing double duty for two unrelated stories.

- [x] `parseSessionStateResponse` — the authoritative `GET /live-shopping/
      sessions/{id}` parser. Same closed 8-key `present()` set as create, but ANY
      status is legal: create's parser insists on `running` precisely because it
      answers a different question.
- [x] `dieWithAuthority` in the session controller: before ending on a transport
      symptom, ask the server once. A recovered terminal is adopted; anything
      else leaves the honest transport error exactly as it was. ONE request, no
      retry, no loop, only on paths that were already ending the session.
- [x] Track terminal PROVENANCE, not just a reason string. Laravel's `present()`
      has no `error_code`, so an authoritative terminal arrives with reason
      `null` — keying the card on the string would have fallen straight back to
      the connection story for every real session. This was caught by a test, not
      by reading the code.
- [x] `terminalReasonText` — closed mapping; an unknown code still says the
      session ended, never blames the connection, and never echoes the raw
      server code to the customer.
- [x] Focused regressions: 409 hydration, missed-terminal-after-EOF-budget,
      genuine unresolved network error preserved, throwing lookup, dep omitted
      (behaviour identical to before), 9-key payload refused, provenance
      recorded exactly once, transport give-up never authoritative.

### Review

- `utils/liveShopping.ts`: `parseSessionStateResponse`, `terminalReasonText`,
  `dieWithAuthority`, `terminalAuthoritative` provenance + `isTerminalAuthoritative()`.
- `composables/useLiveSession.ts`: default `fetchSession` via `$customFetch`
  (GET, read-only) plus reactive `terminalReason` / `terminalAuthoritative`.
- `components/LiveShoppingPanel.vue`: the `failed` card now branches on
  provenance — a server-confirmed ending tells the true story, a genuine
  transport failure keeps the connection message.
- Evidence: `test:live` **161 pure + 72 harness, 0 failed** (was 142 + 50);
  composerGate 24, galleryCard 36, asyncAnnouncements 63, aiNavigability,
  liveVerifyContract 54, ai-provider 8, feeds — all green. `tsc --strict` on the
  changed file: 0 errors. `git diff --check` clean. No build, no restart, no
  store rerun, no commit.
- NOT done deliberately: no speculative EOF-reconnect logic. The harness did not
  cause the abort (its only navigations were at login and t+391s), but what DID
  end the browser stream at t+57.9s is still unexplained, and guessing at a
  reconnect would be building on an unverified cause.

### Follow-up — `error_code` lockstep (approved 2026-09-01)

The provenance fallback made the panel honest, but it still could not say WHY.
Fable confirmed the reason was in the database the whole time (the result job
persists the engine's `error_code`; the reconciler writes `expired`; slot release
writes `engine_unavailable`) and simply never presented: `present()` exposed 8
keys, and the frozen webhook `assistant_part` carries only products. So a session
the store refused was indistinguishable from one where we dropped the connection.

- [x] `CREATE_DATA_KEYS` gains `error_code` → the closed set is now NINE keys.
      It gates BOTH parsers, so the create response's `error_code: null` must be
      accepted too — the legacy 8-key shape is now REFUSED, which is the point of
      a lockstep rather than tolerated drift.
- [x] `parseSessionCreateResponse`: a `running` session that also claims a reason
      is refused — the server would be asserting two contradictory things.
- [x] `parseSessionStateResponse`: the reason is re-gated here against
      `^[a-z0-9_]{1,40}$` even though Laravel sanitizes at its own boundary,
      because this string SELECTS customer-facing copy. A reason on a non-failed
      session is dropped rather than narrated.
- [x] `terminalReasonText` extended to the real closed vocabularies (engine plane
      + Laravel's own writers + the sanitizer's `failed` literal). Unknown codes
      still say the session ended; NO mapping ever blames the connection; the raw
      code is never echoed.
- [x] Golden fixture: `create_response.data.error_code: null`, new
      `session_state_response_failed` pinning the `store_blocked` branch.
      Comment-excluded data sha256 `5d53b044458e99c55b28dd6caac88f6d2c4d9cab3d398c68c06d8d4f9adffe65`.
- [x] Tests: golden both branches, 9-key exactness (missing AND extra reject),
      hostile/uppercase/overlong/non-string codes gated to null, create-running
      contradictions refused, the full reason→text mapping, and the harness path
      end to end (`store_blocked` reaching the card as the store story).

Evidence: `test:live` **177 pure + 75 harness, 0 failed**; every other focused
suite green; `tsc --strict` clean; `git diff --check` clean. No build, no
restart, no store rerun, no commit. Blocked until Laravel's matching `present()`
change lands — until then the Nuxt parser will reject the live 8-key response,
which is deliberate lockstep behaviour, not a regression.

---

## Live shopping — terminal atomicity, SSE terminal provenance, stable panel key

Three confirmed defects, found by the SSE-abort investigation and Luna's
reproductions. All three could end with a customer told "we lost the connection"
about a session that actually finished.

- [x] **SSE terminal provenance.** The engine ships the reason IN the terminal
      event (`payload.error_code`: `store_blocked`, `worker_error`, …) and the
      controller discarded it. An engine-delivered terminal is now authoritative
      — provenance set, reason re-gated through the SAME `ERROR_CODE_RE` bound as
      the hydration path, `onTerminalReason` fired. The earlier hydration fix
      only covered the mint-failure route, so the COMMON path still blamed the
      connection; this closes it.
- [x] **W3 — terminal committed BEFORE external callbacks.** `deps.onEvent(ev)`
      used to run before `die({terminal})`, so a consumer that synchronously
      called `stop()` inside the terminal event's own dispatch bumped the
      generation and the `alive(gen)` guard — which exists to suppress STALE runs
      — suppressed a terminal that had already arrived on the CURRENT one. A
      terminal lost to its own delivery. Fixed by ORDERING, not by weakening the
      guard: `commitTerminal` clears timers, moves state and records provenance
      in one uninterrupted block under the accepting generation, and only then
      notifies. Afterwards terminals-absorb-everything makes a reentrant
      stop()/start() harmless. Stale-generation safety is untouched.
- [x] **Stable live-panel key.** `ShoppingAssistant.vue`'s widgets loop keyed
      parts by ARRAY INDEX while rendering `LiveShoppingPanel`, which owns an SSE
      connection, a refresh schedule and an AbortController. A part inserted or
      reordered ahead of it mid-turn shifted the key and Vue unmounted/remounted
      the same live session — an abort with the page still open. Now keyed by
      `partKey(part, i)`: `toolCallId` when present, index fallback in its own
      namespace so it can never collide with a tool id.

### Review

- `utils/liveShopping.ts`: new `commitTerminal`; the reader loop commits a
  terminal before `reader.cancel()` and before `onEvent`. Non-terminal event
  flow, `die()`, reconnect, backoff, gap-resync and every `alive()` guard are
  unchanged.
- `components/ShoppingAssistant.vue`: `partKey()` + the widgets loop key. The
  other two part loops render stateless output and were left alone.
- `utils/livePanelKey.test.mjs` (new, wired into `test:live`): extracts the
  SHIPPED `partKey` from the component and runs it, so the test fails if the real
  function changes — insertion ahead of the panel, reorder, two live parts,
  namespace collision, empty/non-string tool ids, and the persisted
  `tool-live_results` part that carries no toolCallId by contract.
- Harness: six new cases, all feeding the terminal BEHIND a progress frame in the
  SAME chunk (the real incident coalesced seq9+seq10, 51ms apart) so ordering is
  proven when the terminal is not the first frame dispatched. Includes the
  reentrant-stop() case and a give-up case asserting the honest connection story
  is still preserved when nothing authoritative exists.
- Evidence: `test:live` → **177 + 94 + 12, 0 failed** (was 177 + 75).
  composerGate 24, galleryCard 36, asyncAnnouncements 63, aiNavigability,
  liveVerifyContract 54, ai-provider 8, feeds — all green. `tsc --strict` on
  `utils/liveShopping.ts`: 0 errors. `npm run build`: exit 0. `git diff --check`
  clean.
- **Build/runtime desync, deliberately left**: the build ran for validation (a
  `.vue` template change needs it), so the running server (pid 2957514) now
  serves a stale manifest. No restart was performed — the coordinator owns that,
  and the app must be restarted before any browser use.

### Mounted-component regression (requested at review)

The logic was proven in isolation but nothing proved the COPY the customer
reads, which is what the whole incident was about. Added
`components/liveShoppingPanel.dom.test.mjs`: it compiles the REAL
`LiveShoppingPanel.vue` with `@vue/compiler-sfc` and renders it through
`vue/server-renderer`, asserting on the resulting DOM.

No new dependencies (vue, @vue/compiler-sfc and @vue/server-renderer are already
installed) and no browser. The component's own `card` computed and its own
template do the work; only `useLiveSession`/`useWhepViewer` are stubbed, because
the controller state is precisely the input under test. `terminalReasonText`,
`validateSessionHandle` and `isTerminal` are the real implementations.

Covers: authoritative terminal with `store_blocked` renders the exact Spanish
store copy and contains no "conexión"; authoritative terminal with a null reason
renders the generic ending; a hostile reason is never echoed into the DOM;
a NON-authoritative give_up still tells the connection story (that honesty must
survive); completed/cancelled read correctly; and a working session shows the
calm no-video row with no failure copy at all.

MUTATION-VERIFIED: reverting the provenance branch in the panel makes this suite
fail 6 assertions, and restoring it returns 15/15 — so the test genuinely
detects the regression rather than passing by construction.

`test:live` is now the four suites: **177 + 94 + 12 + 15, 0 failed**.

### Follow-up — the recovered branch had the same W3 ordering (found in review)

`dieWithAuthority`'s RECOVERED branch still set the reason, fired
`onTerminalReason`, and only then called `die()`/`setState`. A consumer that
synchronously `stop()`s inside that callback bumped the generation and the state
transition was suppressed — the session recorded a reason while its STATUS never
became terminal. W3 verbatim, on the hydration path instead of the SSE path.

- [x] Recovered terminal now routes through `commitTerminal(gen, status,
      errorCode)`. One commit discipline for both paths; the errorCode re-gate is
      idempotent with the one `parseSessionStateResponse` already applied, and
      `clearTimers()` folds in what `die()` was doing.
- [x] Two harness pins: 409 → fetchSession recovers a terminal while
      `onTerminalReason` synchronously `stop()`s → status, reason and provenance
      all survive, status announced, zero timers; plus the same on a recovered
      `cancelled` with no stored reason.

MUTATION-VERIFIED both ways: restoring the pre-fix ordering makes the harness
fail 3 assertions (98/101), and the fix returns 101/101.

`test:live` → **177 + 101 + 12 + 15, 0 failed**.

---

## Local Nuxt fail-fast launcher — stop the environment-loss recurrence

Root cause of a defect that hit twice: the nitro node-server preset does NOT read
`.env` at runtime (only `nuxt dev`/`preview` do), so `node .output/server/index.mjs`
comes up with whatever the shell happened to export. Two restarts lost their
shell and the service started fully functional-looking with NO configuration.
Both times it presented as a PRODUCT bug, never as a config one:

- no API base → the browser resolves `/csrf-cookie` and `/auth/login` against the
  Nuxt origin, gets 404, and nobody can log in;
- no provider credential → every chat turn answers 503;
- `LIVE_SHOPPING_ENABLED` unset → `live_verify` silently disappears from the belt.

A half-configured service is worse than a stopped one, because a stopped service
is obviously stopped.

- [x] `scripts/localEnvContract.ts` — pure, dependency-free, reads nothing from
      the ambient process. `verifyLocalEnv(env)` returns `{ok, missing[],
      invalidProvider, providerKey}`; `refusalMessage(v)` renders the operator
      text. Blank/whitespace/non-string counts as MISSING. The provider→credential
      map mirrors `server/utils/aiProvider.ts::requiredModelKey`. When
      `AI_PROVIDER` is unanswered NO credential is guessed — naming the wrong one
      sends someone to set the wrong variable.
- [x] `scripts/serve-local.mjs` — loads `.env` WITHOUT overriding anything already
      set (the shell stays the source of truth), verifies, and refuses to listen
      with exit 78 (EX_CONFIG) if anything is missing. Also refuses when
      `.output/server/index.mjs` is absent. Imports the server rather than
      spawning it, so the supervisor's pid IS the server's pid.
- [x] `scripts/localEnvContract.test.mjs` (43 assertions, `npm run test:env`).
- [x] `npm run start:local` wired.

### Review — SECRETS

The verdict and the refusal carry NAMES ONLY: no value, no length, no prefix, no
redacted echo. Tests assert a planted credential appears in neither the message
nor the serialized verdict, and that the launcher source never reads a credential
value for logging. Nothing is duplicated into a new file — `.env` stays the only
place a value lives, and the launcher never writes one anywhere.

### Review — evidence (behavioural, not just unit)

| Scenario | Result |
|---|---|
| empty env | REFUSED, exit 78, names all four, did not listen |
| provider selected, credential absent | REFUSED, names `ANTHROPIC_API_KEY` |
| unknown provider (`llama`) | REFUSED, names the valid set, demands no guessed credential |
| blank credential (`"   "`) | REFUSED — looks configured, is not |
| valid config, port 13099 | STARTED, `/login` 200, log line names only, **0** occurrences of the key prefix |

The valid-config run used a spare port so the live service (pid 3956345) was
never touched. `test:env` 43/43; `test:live` 177+101+12+15; every other focused
suite green; `git diff --check` clean.

NOT done: no production, no commit/push/deploy, and the running service was not
restarted onto the launcher — switching the tmux service over is the
coordinator's call.
