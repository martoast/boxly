# AI Campaign Studio — /app/admin/campaigns

Goal: one-button AI that RESEARCHES current sales + reads the knowledge base + past
campaigns, proposes grounded campaign ideas, then narrows (pick → expand → variations
→ refine with comments) to a finished email draft saved into the real campaign system.

## Grounding (what makes ideas real, not generic)
- **Today's date** + a MX/US retail calendar (Prime Day, Hot Sale, Buen Fin, BF/CM,
  back-to-school, Navidad, Día de las Madres…) → knows what's timely.
- **Live web research** (SerpAPI) for current deals at the stores people shop.
- **Knowledge base** (`GET /knowledge`) → what Boxly is, policies, stores.
- **Past campaigns** (`GET /admin/campaigns`, fetched client-side, passed in) → voice
  + what got opens/clicks.

## Style (boxly-campaigns skill)
Plain text, Mexican Spanish informal "tú", subject ≤50 chars, body 3–5 sentences
(<~80 words), single CTA (2–4 words + one URL), no fluff/emojis, 2–3 hero items max.

## Build
- [ ] `server/api/campaigns/ideas.post.ts` — research (SerpAPI) + date/calendar + KB +
      past campaigns → generateObject → 4–6 grounded ideas + the detected "moment".
- [ ] `server/api/campaigns/draft.post.ts` — mode: expand (idea→draft) | variations
      (→3) | refine (draft+comment→draft). Output: {name, subject, body, cta_text,
      cta_url, audience}. Enforces the style rules.
- [ ] `pages/app/admin/campaigns/studio.vue` — the Studio: generate → moment banner +
      idea cards → pick → email-preview draft → variations / comment-refine → audience
      + size preview → "Guardar como borrador" (POST /admin/campaigns) → open it.
- [ ] Entry button on `pages/app/admin/campaigns/index.vue` → Studio.

## Notes
- Server fetches public `/knowledge` + `/products/web-search` (both public). Client
  passes past campaigns (admin-authed). Save via `$customFetch('/admin/campaigns')`.
- Never auto-send. Save as DRAFT; sending stays the deliberate existing step.

## Brian Chesky loop
Headless screenshot each state → design-critic review → iterate.

## Review — built (uncommitted), backend verified
- `server/api/campaigns/ideas.post.ts` ✓ — verified live: detected "Post-4 de julio, antesala
  de Prime Day + back-to-school — 13 jul 2026" and returned 5 grounded ideas across audiences
  (research = 4 SerpAPI queries + KB + past campaigns + date/calendar).
- `server/api/campaigns/draft.post.ts` ✓ — expand/variations/refine; verified expand returns
  clean plain-text es-MX, ≤50 subject, single CTA.
- `pages/app/admin/campaigns/studio.vue` → thin wrapper over `components/CampaignStudio.vue`
  (extracted so a dev preview can render it). Studio flow: generate → moment banner + idea
  cards → pick → email editor + live preview → refine-comment / 3 variaciones → audience+size
  → "Guardar como borrador" (POST /admin/campaigns). Never auto-sends.
- Entry buttons added to campaigns index (desktop + mobile).
- `pages/campaign-studio-preview.vue` — DEV-ONLY public preview (mock data, ?state=ideas|draft)
  for screenshots. **Do not commit / not for prod.**
- Screenshots reviewed: ideas + draft states look premium & on-vision. Brian Chesky pass: pending.

Test live (you're admin): /app/admin/campaigns/studio
