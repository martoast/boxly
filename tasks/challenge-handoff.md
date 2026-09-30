# Challenge hand-off — the shopper passes the store's human check, Boxly goes on by itself

Alex (2026-09-30): when a store shows a human-verification challenge during a cart or quote run (Bath & Body Works /
PerimeterX "Before we continue… Press & Hold to confirm you are a human (and not a bot)"), the agent pauses, the
shopper is asked in the chat to press and hold in the live store browser, and the agent resumes by itself once the
challenge is gone. **The shopper does the human check. Boxly never automates it.** (Plan approved by Alex.)

## Plan
Engine (`~/mcp-servers/computer-use-handoff`, branch `challenge-handoff`):
1. Detect an *interactive* human check (press & hold / confirm you're human) apart from a hard "Access denied".
2. The agent hands the browser to the shopper: `control.requestHelp("challenge")` → `control.changed
   {controller:"customer", reason:"challenge"}` → the existing takeover relay opens.
3. The agent waits without the LLM: reads the page every 2 s (max 180 s); check gone → back to the agent
   (`control.changed {controller:"agent"}`) and continue from a fresh read; shopper hands back → same; timeout →
   blocked (bot_challenge). At most 2 hand-offs per run. A first-page wall still gets the runner's home-page retry first.
4. Relay: `pointer.down {x,y,button}` / `pointer.up {button}` (a real-time hold); purchase guard on the down;
   auto-release after 15 s or when the socket closes.

App (this repo, branch `challenge-handoff`):
5. `useInputRelay`: pointerdown → `pointer.down`, pointerup/cancel/leave → `pointer.up` (a click = quick down+up).
6. `control.changed` with `reason: "challenge"` → the live panel opens by itself (interactive) and the card + panel
   say: "{Tienda} pide confirmar que eres una persona. Mantén presionado el botón «Press & Hold» … después Boxly sigue
   solo." Back to the agent → "¡Listo! Boxly continúa." Mobile: no scroll/callout during the hold.
7. The compact card flags "Necesita tu ayuda".

API: no change (the app reads `control.changed` straight from the engine SSE; `/control` already exists).

## Checklist
- [x] Engine: human-check classifier (`navigation_ready.js` humanCheckSignal + PerimeterX rows/title)
- [x] Engine: `agent_control` requestHelp(reason) / reason
- [x] Engine: fast_agent hand-off at the turn boundary, bounded read-only wait, resume / timeout, ≤2 per run
- [x] Engine: runner passes `challengeHandoff` ("after_real_page" first run, "on" after the wall recovery / find)
- [x] Engine: orchestrator journals the reason; a viewer leaving does not end a challenge hand-off
- [x] Engine: relay pointer.down/up + guard on down + auto-release; index.js `pointer_button` (manual/takeover only)
- [x] Engine tests + live hold smoke (local page: 3 s hold → 3002 ms)
- [x] App: event parsing (`parseControlChange`, closed reason), `nextHelpState`, Spanish copy
- [x] App: useInputRelay down/up, touch-none while interactive
- [x] App: panel auto-opens + prompt; card flags "Necesita tu ayuda"; "¡Listo! Boxly continúa."
- [x] App tests (`test:live`, `test:live-gallery`, `test:cart`) + `npx nuxt build`
- [ ] Deploy (lead): engine first, then app — see Review
- [ ] Live test at BBW with Alex doing the press & hold (lead)

## Review
Engine commit `3c3c145` (branch `challenge-handoff`, from cart-checkout):
- `navigation_ready.js`: PerimeterX "Press & Hold to confirm you are…" rows and the "Access to this page has been
  denied" title are class challenge (they were not before — the live BBW wall was never classified);
  `humanCheckSignal(rows)` = a check a person can pass. "Access Denied" / login walls are not.
- `agent_control.mjs`: `requestHelp("challenge")`, `reason`; change events carry `{controller, reason}`.
- `fast_agent.mjs`: `challengeHandoff` option; `waitForHumanCheck` (reads only, 2 s / 180 s); timeout → report-only
  turn, blocked "bot_challenge"; ≤2 hand-offs. It arms regardless of the capture gate (BBW's check sits on the
  product URL, which counted as a verified product page).
- `cart_preparation_runner.mjs`: first run "after_real_page", wall-recovery rerun and found-product runs "on".
- `session_orchestrator.mjs` / `journal.mjs`: `control.changed {controller, reason?:"challenge"}`; viewer leaving
  doesn't hand a challenge back.
- `input_relay.mjs`, `takeover_driver.mjs`, `service.mjs`, `manual_worker.mjs`, `index.js`,
  `headless_pointer_client.mjs`: real-time hold (pointer_button press/release), guard on the down, release after
  15 s / socket close / relay close; a down+up tap still focuses an editable and counts as a click.

App (this branch): `utils/liveShopping.ts` (parseControlChange, nextHelpState, copy), `utils/liveBrowse.ts`
(pointer.down/up bounds), `composables/useInputRelay.ts` (down/up with pointer capture), `LiveBrowserStage.vue`
(parsed control + reason, touch-none), `LiveBrowserPanel.vue` (prompt / Listo), `LiveBrowserCard.vue` (Necesita tu
ayuda), `ShoppingAssistant.vue` (help state, auto-open).

Deploy order matters: the app now sends `pointer.down`/`pointer.up` for every click (manual browse too), which an old
engine refuses as bad_message — deploy + restart the engine BEFORE the app.
