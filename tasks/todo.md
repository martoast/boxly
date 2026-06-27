# Guest → register gate on the (eventually public) AI search/chat page

## Goal
On a public `/app/search`, a guest can search, but to create a Purchase Request
(or a self-ship order) they must have an account. When a guest hits that gate,
the chat shows a button → `/register?redirect=…` → after signup they land back
in the SAME chat, resumed where they left off, and the action continues.

## Key facts (from audit)
- `/register` ALREADY reads `?redirect=<path>` and navigates there after signup
  (register.vue ~785-793). Login page too. So the round-trip is already supported.
- `/app/search` (`pages/app/search/[[id]].vue`) is currently `middleware: ['auth']`
  — making it public is a SEPARATE change (do when ready to launch publicly).
- Guest chat is IN-MEMORY only (`chat.messages`); guests can't persist to backend.
  A hard redirect to /register LOSES the conversation unless we stash it.
- Existing inline flow: `create_account` tool → inline form → `/auth/chat-register`
  (PASSWORDLESS account, social-login only later) → `/conversations/claim` migrates
  the guest messages. Never leaves the page; no context loss.

## The fork (needs confirmation — see AskUserQuestion)
Redirect-to-full-register (user's described flow, real password account, but loses
+ must restore the in-memory chat) vs keep the inline passwordless form (no context
loss, already built) vs offer both.

## Plan (assuming redirect flow is chosen)
1. **Stash before leaving** — helper to save `{messages (cleaned), pendingIntent, ts}`
   to localStorage (`boxly_guest_resume`, ~30min TTL) right before navigating.
2. **Guest gate in chat** — when a guest triggers assisted purchase / PR, the AI
   surfaces a "Crea tu cuenta para continuar" button (client-rendered, like the
   pendingAccount card) → stash → `navigateTo('/register?redirect=/app/search?resume=1')`.
   Prompt: tell the model that for guests it must call the gate tool, not ask for
   name/email/phone inline.
3. **Resume on return** — on `/app/search` mount, if authenticated AND a fresh
   `boxly_guest_resume` exists: restore messages into the chat, `/conversations/claim`
   them under the new account, clear the stash, and continue the pending action
   (re-send the purchase intent / let the model confirm).
4. **(Later) make the page public** — relax the `auth` middleware on the search page;
   keep authed tools (PR/order/profile) gated server-side (they already are).

## Decisions (confirmed)
- Redirect to full register (email OR Google) + FULL resume & continue.

## Review — built (app only)
**Frontend `components/ShoppingAssistant.vue`:**
- Replaced the inline passwordless account form with a GATE BUTTON. When the
  model calls `create_account` (guest), a card shows "Crea tu cuenta para
  continuar" → `goRegister()`.
- `goRegister()`: stashes the cleaned chat + the last user intent (URLs stripped)
  to localStorage `boxly_guest_resume` (30-min TTL), then
  `navigateTo('/register?redirect=' + enc('/app/search?resume=1'))`.
- `maybeResumeGuest()` (run in `initLoggedIn`, before deep-link open): if a fresh
  stash exists, restore the messages into the chat, rebuild the product registry,
  `/conversations/claim` under the new account, mint the chat token, and re-send
  "Ya creé mi cuenta ✅ <intent>" so the model finishes the order.
- Self-purchase guest branch (`openSelfOrder`) now also routes through
  `goRegister()` instead of bouncing the model.
- Removed dead inline `submitAccount` + `acct` refs.

**Backend `server/api/assistant.post.ts`:**
- `create_account` tool: empty input schema; description says it opens the gate
  (app handles register + return) — model must NOT collect name/email/phone.
- Guest prompt line: call `create_account` the moment a guest confirms an order;
  never call PR/self-order for a guest before the account exists.

**Works with Google sign-in:** the stash is in localStorage (survives the OAuth
round-trip), and register.vue + the Socialite callback both honor `?redirect`
(new Google users detour via complete-profile?redirect=… then land on /app/search).

## Still pending (intentionally NOT done — separate launch step)
- `/app/search` is still `middleware: ['auth']`. To actually let guests in, that
  gate must be relaxed AND the /app layout/nav checked for guest-safety. Bigger
  change with SEO/layout implications — do as a focused follow-up when launching
  the public page. Until then this flow is in place but dormant.
