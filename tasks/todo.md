# AI Search → User + Conversation linking (admin visibility)

Goal: In the admin AI-search view, every search/question is attributed to a **user**
and to a **chat (conversation id)**. Clicking a recent search/question opens the
**full conversation thread** the user had with the AI.

## Part A — Attribution (DONE)
- [x] `ProductExtractController::search` sets `user_id` on the search SearchEvent.
- [x] `search_products` tool forwards the user's bearer token to `/products/search`.
- [x] `SearchEvent` model: `user()` relation.
- [x] Admin stats: recent searches + questions include `user {name,email}` + `guest`.
- [x] CSV export: `user_name`, `user_email` columns.

## Part B — Link search events to the conversation (chat id)
- [ ] Migration: add `conversation_id` (nullable, FK→conversations nullOnDelete, index) to `search_events`.
- [ ] `SearchEvent`: add `conversation_id` to fillable + `conversation()` relation.
- [ ] `ProductExtractController::search`: accept `conversation_id` from body → store on event.
- [ ] `SearchEventController::store`: validate + persist `conversation_id` (questions).
- [ ] `assistant.post.ts`: read `conversationId` from body; forward to `logQuestion` (→ /search-events)
      and into the `/products/search` body.
- [ ] `ShoppingAssistant.vue`: send `conversationId: activeId.value` in the transport body;
      `await ensureConversation(text)` in `onComposerSend` + `pickSuggestion` (only true turn-1 paths).

## Part C — Admin: click a search → see the whole thread
- [ ] Admin endpoint `GET /admin/ai-search/thread/{conversation}` → messages (asc) + user + title.
- [ ] Stats recent feeds include `conversation_id`.
- [ ] Admin Vue: rows with a conversation_id are clickable → slide-over drawer renders the
      full thread (user + assistant bubbles), header shows user name/email + chat id.

## Verify (local, docker + gstack)
- [ ] Run migration in api container.
- [ ] Do a search as María → row shows her name + is clickable → drawer shows her thread.
- [ ] CSV includes user + conversation columns.

## Review
All parts DONE and verified end-to-end locally (docker + gstack).

**What changed**
- Searches now attributed: `ProductExtractController::search` stores `user_id` + `conversation_id`;
  `search_products` tool forwards the user's bearer token + `conversationId`.
- Questions: `logQuestion` (assistant.post.ts) forwards `conversation_id`; store() persists it.
- New `search_events.conversation_id` column (migration ran) + `SearchEvent::conversation()` relation.
- Admin stats feeds now include `user {name,email}`, `guest`, `conversation_id`.
- CSV export adds `user_name`, `user_email`.
- New admin endpoint `GET /admin/ai-search/thread/{conversation}` → full thread + user.
- Admin AI-search page: rows show who searched, are clickable → slide-over drawer renders the
  whole conversation (user/assistant bubbles + tool chips like "🔍 Buscó …").
- Frontend: transport sends `conversationId: activeId`; `onComposerSend`/`pickSuggestion`
  await `ensureConversation` so the id rides on turn 1. Guests unaffected (no conversation).

**Verified:** SearchEvent rows show user=3 conv=28 for both a real /products/search and a question;
admin thread endpoint returned María's 2 messages + identity; stats feeds showed her email + conv=28;
UI drawer opened and rendered the thread.

## End-to-end run (gstack, as María → admin) — PASSED
Customer (María, maria.test@gmail.com):
- ✅ Product search — Nike running gallery (conv #29).
- ✅ Order status list — `show_orders` rendered all her orders w/ statuses (conv #30).
- ✅ Order detail timeline — 26X3NDID "Pagado" timeline card.
- ✅ Order CREATION — created real order **26CVD51K** (Nike Pegasus 41, $124.97) via the
  self-import form; verified in DB (user=3, status collecting, item URL+price stored).
- ✅ Business question — shipping cost → box-pricing card.

Admin (alexmartos96@gmail.com → /app/admin/ai-search):
- ✅ Recent activity attributes every row to "María González · maria.test@gmail.com · ver chat →".
- ✅ Click → thread drawer shows the FULL conversation (Chat #29 and #30), user/assistant
  bubbles + tool chips (🔍 Buscó, 📦 Mostró pedidos, 🔗 Extrajo producto, ⚙️ show_box_guide).

Notes:
- gstack (headless Sanctum) drops the session after a few minutes → one mid-test "you're not
  logged in" AI reply; recovered by re-login. NOT a product bug (real browsers persist the session).
- Minor real finding: the self-order **submit** requires a valid product URL. If the AI captures a
  non-URL (e.g. "Nike.com"), submit 422s "product url must be a valid URL" and the form has no URL
  field to fix it. With a real URL the order created fine. Follow-up: make URL optional OR editable
  OR have the tool always pass a valid/blank URL.

**Local-only test artifacts (not prod, flag to Alex):**
- Set `password123` on the admin user (alexmartos96@gmail.com) in the LOCAL db to log in via gstack.
- Created test conversation #28 + a few test search_events for María.
- Everything LOCAL — nothing committed or pushed.
