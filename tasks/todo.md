# Switch LLM provider to Gemini Flash-Lite (cost reduction)

Goal: cut model cost ~10x by moving off Claude Haiku to Gemini Flash-Lite, behind a
reversible provider switch (flip back with one env var). Main chat = Gemini 3.1
Flash-Lite; aux calls = Gemini 2.5 Flash-Lite (cheapest).

## Plan
- [x] Add `@ai-sdk/google` dependency
- [x] Add `GEMINI_API_KEY` to app/.env (gitignored)
- [ ] New `server/utils/aiProvider.ts` — single source of truth for which provider/model
      to use, picked by env. Defaults to Anthropic unless `GEMINI_API_KEY` is set (so
      pushing code never flips prod until env vars are added on Netlify). `AI_PROVIDER`
      forces a choice. Disables Gemini "thinking" (thinkingBudget:0) for cost/speed.
- [ ] Migrate aux calls to the helper (no web_search, lowest risk):
      curate.ts, intent.post.ts, intent-map.post.ts, search.post.ts, title.post.ts, ask.post.ts
- [ ] Migrate main chat (assistant.post.ts): use chatModel(); on Gemini drop the
      Anthropic-only cacheControl and replace the native web_search tool with a
      function tool (Gemini's built-in google_search can't mix with custom tools).
- [ ] API: add `/products/web-search` (SerpAPI engine=google organic) to back the
      Gemini web_search function tool.
- [ ] Test on localhost (free tier), verify tool-calling + gallery still work.

## Review
Done & verified on localhost (Gemini 3.1 Flash-Lite):
- New `server/utils/aiProvider.ts` is the single switch. Provider chosen by env:
  defaults to Anthropic; uses Google when `GEMINI_API_KEY` is set; `AI_PROVIDER`
  forces either way. chatModel()=gemini-3.1-flash-lite-preview, auxModel()=
  gemini-2.5-flash-lite (both env-overridable). Gemini thinking disabled.
- Migrated to the helper: curate.ts, intent, intent-map, search, title, ask, assistant.
- Main chat (assistant.post.ts): on Gemini we drop the Anthropic-only cacheControl
  and swap the native web_search for a function tool backed by the new API route.
- API: added `POST /products/web-search` (SerpAPI google organic, US-pinned, 30-min
  cache) + route. CORS already covers it via `products/*`.
- Test: `busca owala 24oz rosa de target` → 200 in 8.4s, search_products +
  suggest_followups called, 17 products, Target floated to top, correct ES copy.

To go live on PROD (currently still Claude — code change alone does NOT flip it):
1. Deploy the API (so /products/web-search exists; until then the Gemini web_search
   fallback 404s gracefully and the model just uses search_products).
2. On Netlify set `GEMINI_API_KEY` (+ optionally `AI_PROVIDER=google`).
3. Revert anytime with `AI_PROVIDER=anthropic`.
Note: dev points API_URL at the prod API, so web_search fallback won't work locally
until the API is deployed; search_products (the default path) works now.
