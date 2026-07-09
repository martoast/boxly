# Gate AI search behind authentication

**Decision:** The AI concierge/search is now for authenticated users only. Guests
searching from the landing hero are sent to login/register, then dropped back into
the chat (their query auto-fires once authenticated).

## How it already works (no new plumbing needed)
- `middleware/auth` already redirects guests to `/login?redirect=<fullPath>`.
- `login.vue` + `register.vue` both honor `?redirect=` (and pass it between each
  other), landing the user back at the original URL after auth.
- `ShoppingAssistant` → `initLoggedIn()` → `sendInitialQuery()` reads `?q=` and
  fires it as the first message for authed users. So returning to `/search?q=foo`
  after login auto-sends "foo".

## Todo
- [ ] `app/pages/search/[[id]].vue` — change middleware `auth-soft` → `auth`
      (gates the standalone concierge; guests bounce to login and return with ?q).
      Update the file's header comment to match.
- [ ] Admin: surface each searching user's **account-creation date**.
  - [ ] `api SearchEventController` — include user `created_at` in
        `recentSearches`, `recentQuestions`, and `thread()` user objects
        (eager-load `created_at`).
  - [ ] `app/pages/app/admin/ai-search/index.vue` — show "Cliente desde {date}"
        next to the user in the recent feed + thread header. Keep old guest rows
        visible (historical data from when search was public).

## Out of scope / deliberately skipped
- Server hard-gate on `/api/assistant`: the page gate already blocks all UI
  access; a server 401 adds a rare-failure regression risk. Not worth it.
- `SearchLanding.vue` / `/api/ask` are dead (unused) — left untouched.
- Guest-only code paths in ShoppingAssistant stay (harmless; never fire when
  `user` is always present).

## Review — DONE
**What changed (3 files):**
1. `app/pages/search/[[id]].vue` — middleware `auth-soft` → `auth`. The standalone
   concierge is now authenticated-only. Verified: guest GET `/search?q=nike` → 302
   `/login?redirect=/search?q=nike`; bare `/search` → 302 `/login?redirect=/search`.
   After login/register (both honor `?redirect=`) the user returns and
   `initLoggedIn → sendInitialQuery` auto-fires the `?q` as the first message.
2. `api SearchEventController.php` — added user `created_at` to `recentSearches`,
   `recentQuestions`, and `thread()` (eager-loads now select `created_at`).
   `php -l` clean; verified `created_at` serializes via tinker.
3. `app/pages/app/admin/ai-search/index.vue` — added `fmtDate()` and shows
   "· cliente desde {date}" next to the user in the recent feed + thread header.
   Old guest rows still render as "Invitado" (historical data preserved).

**Coverage check:** all 3 pages that mount `ShoppingAssistant` (`/search`,
`/app/search`, `/app`) now require `auth`. No public entry point into the AI remains.

**Not done (by design):** no server-side 401 on `/api/assistant` (page gate is
airtight; a server gate adds rare-failure regression risk). `/api/ask` +
`SearchLanding.vue` are dead code, untouched.
