# Give Velonie (employee + team=shopping) access to the AI search page

Approved approach: mirror it under `/app/shopping/ai-search`, the same pattern
her campaigns / stores / categories already use. Full scope — stats, feed,
thread drawer, CSV export.

- [x] API: mount the four `ai-search` routes the page uses in the `shopping`
      middleware group (`routes/api.php`), pointing at the same
      `SearchEventController`
- [x] App: extract the dashboard from `pages/app/admin/ai-search/index.vue` into
      `components/admin/AiSearchDashboard.vue`, with an `apiBase` prop
- [x] App: `pages/app/admin/ai-search/index.vue` → thin page, admin layout +
      `['auth','admin']`, `api-base="/admin"`
- [x] App: new `pages/app/shopping/ai-search/index.vue` → shopping layout +
      `['auth','shopping']`, `api-base="/shopping"`
- [x] App: nav item added to `components/ShoppingSidebar.vue`
- [x] Verify: `nuxi build` passes, route present in the built manifest, no
      hardcoded `/admin/ai-search` left in the shared component

## Review

Velonie now reaches the dashboard at **`/app/shopping/ai-search`**, in her own
sidebar. `/app/admin/ai-search` is byte-for-byte the same view and stays
admin-only.

**API** (`routes/api.php`) — added `stats`, `events`, `export`, and
`thread/{conversation}` under the existing `Route::middleware('shopping')
->prefix('shopping')` group, hitting the same `SearchEventController`. Only the
four the page actually calls; `queries` and `conversations` stay admin-only.
`ShoppingEmployeeMiddleware` → `User::canManageShopping()` = admin OR
employee+shopping, so admins keep working through either namespace. The
controller has no admin-specific branching and every one of these endpoints is
a GET, so there is nothing to write from her side.

**App** — the 448-line page body moved into
`components/admin/AiSearchDashboard.vue` with one `apiBase` prop (`/admin` or
`/shopping`) feeding all four fetch calls. Both pages are now ~10 lines that
just set layout + middleware and render it, so the two views cannot drift.

Verified with `npx nuxi build`: clean, and `app/shopping/ai-search` is in the
built route manifest.

Not deployed — waiting on the go-ahead. API must ship before the app, since the
page 403s until `/shopping/ai-search/*` exists in production.
