# Admin AI-search page — make it fast

`/app/admin/ai-search` loads slowly. Alex: "Actividad reciente feels like we're
loading way too much at once", and "remove Mapa de intención — I don't need it
in the UI, we can do that when we run analysis on the searches."

## Measured first, against production (2026-08-06)

| call | time | payload |
|---|---|---|
| `GET /admin/ai-search/stats?days=30` | 1,056 ms | 42.3 KB |
| `GET /admin/ai-search/queries?days=30` (what intent-map calls) | 377 ms | 17.8 KB |
| `GET /admin/ai-search/events?per_page=20` | 320 ms | 30.8 KB |

`stats` payload breakdown — **83% of it is the feed**:

```
recent_questions   27.0 KB  (40 rows)   <- 64% of the whole response
recent_searches     8.0 KB  (30 rows)
top_questions       2.6 KB  (25 rows)   } none of these are
daily               1.8 KB  (30 rows)   } rendered by this page
top_queries         0.8 KB  (25 rows)   }
top_stores          0.7 KB  (25 rows)   }
top_result_stores   0.6 KB  (20 rows)   <- rendered ("Tiendas que mostramos")
TOTAL              42.3 KB
```

And `load()` awaits `stats` before it even starts `loadIntent()`, so the two
round-trips are **serial** — roughly 1.9s before the page settles.

So the slowness is not row rendering. It is one fat serial request plus a second
request for a panel that is being deleted anyway.

## Consumers checked before changing anything

- `/admin/ai-search/stats` → this page **and** `cli/commands/ai-search.js:91`
  (raw dump). So fields must NOT be removed outright — the CLI would lose them.
  Hence `?light=1`: opt-in, default unchanged, CLI untouched.
- `recent_questions` / `recent_searches` / `top_result_stores` → **this page
  only**. Nothing in `cli/` reads them.
- `/admin/ai-search/queries` → only `server/api/intent-map.post.ts`.

## Plan

### api/ — additive only, nothing removed

- [ ] `events()`: include `created_at` in the user payload. The feed shows
      "cliente desde" and the events transform drops it today (it is already
      eager-loaded, just not returned). One line.
- [ ] `events()`: let `type` take a comma-separated list so the feed can ask for
      `search,question` and exclude `product_view`. Single values keep working —
      backward compatible.
- [ ] `stats()`: add `?light=1` which skips the seven blocks this page does not
      render, returning them as empty arrays so the response shape stays stable.
      Default (no param) is byte-for-byte what it is today, so the CLI is safe.

### app/ — the page

- [ ] Delete the whole "Mapa de intención" section: template block,
      `intentMap`/`intentLoading` refs, `loadIntent()`, and its call in `load()`.
      Leave `server/api/intent-map.post.ts` and `AdminIntentMap.vue` on disk —
      Alex wants the analysis capability, just not in the UI, and deleting
      working code that is not in the way is not part of this task.
- [ ] Repoint "Actividad reciente" at `GET /admin/ai-search/events` with real
      server-side pagination (`per_page` / `page`), 15 per page, with prev/next
      and a total count. Drop the client-side merge-and-slice of
      `recent_searches` + `recent_questions`.
- [ ] Call `stats` with `light=1`.
- [ ] Keep the feed's own loading state separate from the page's, so paging
      never blanks the cards or the stores panel.

## Deploy order — matters

The frontend will call `type=search,question`, which today's API rejects with a
422. So: **api/ first, wait for it to actually be live, then app/.** Netlify is
fast, DigitalOcean is not; shipping them together would break the feed for the
length of the API build.

## Review

All done. Measured against **production** after the API deploy landed:

| call | time | payload |
|---|---|---|
| `stats` (full — what the CLI still gets) | 823 ms | 42.3 KB |
| `stats?light=1` (what the page now gets) | 472 ms | **1.0 KB** |
| `events?type=search,question&per_page=15` | 405 ms | **9.4 KB** |

**Page total: ~1,223 ms / 60.1 KB serial → ~472 ms / 10.4 KB parallel.**
Roughly 2.6x faster on ~83% less data.

Verified the CLI is genuinely untouched: the no-param response still returns
`recent_questions` 40 rows, `recent_searches` 30, `top_queries` 25, and the key
set is identical between full and light. Every figure the page renders
(`total_searches`, `total_questions`, `total_product_views`, `view_rate`,
`top_result_stores`) is byte-identical in light mode.

Feed correctness on prod: `total=545`, `last_page=37`, page types are exactly
`["search","question"]` — product views excluded — and `user.created_at` comes
through, so "cliente desde" still renders.

### What changed

- **api/** (`ca8bdc7`) — additive only: comma-separated `type` on `events()`,
  `created_at` in its user payload, `?light=1` on `stats()`.
- **app/** — Mapa de intención removed from the UI (template, refs,
  `loadIntent()`, and the orphaned `AdminIntentMap.vue`). Actividad reciente
  now pages server-side at 15/page with prev/next, a total count, and its own
  spinner so paging never blanks the cards beside it. `stats` and the feed now
  fire in parallel rather than serially.

### Kept deliberately

`server/api/intent-map.post.ts` stays. Alex wants the intent analysis when
running analysis over the searches — just not as a panel on the page. It is
still callable and still admin-gated.

### Deploy order used

api/ first, polled until `type=search,question` stopped returning 422 (live
after ~2 checks), then app/. Shipping them together would have 422'd the feed
for the length of the DigitalOcean build.
