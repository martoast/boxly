// composables/useAuthHint.ts
//
// Cheap, client-only "are we *probably* logged in?" hint stored in
// localStorage. NOT authoritative (the server still decides via the
// session cookie), but lets middleware decide where to send the visitor
// without paying for a /user round trip.
//
// Flow:
//   - login success → markLoggedIn()
//   - logout       → markLoggedOut()
//   - 401 from /user during bootstrap → markLoggedOut()
//
// Anonymous visitor clicking "Crear solicitud" on /shop now sees an
// instant client-side redirect to /login instead of waiting ~500ms
// for the API to confirm "yep, you're anonymous."

const HINT_KEY = 'boxly_auth_hint'

export function getAuthHint(): boolean | null {
  if (!import.meta.client) return null
  try {
    const v = window.localStorage.getItem(HINT_KEY)
    if (v === '1') return true
    if (v === '0') return false
    return null
  } catch {
    return null
  }
}

export function markLoggedIn(): void {
  if (!import.meta.client) return
  try { window.localStorage.setItem(HINT_KEY, '1') } catch {}
}

export function markLoggedOut(): void {
  if (!import.meta.client) return
  try { window.localStorage.setItem(HINT_KEY, '0') } catch {}
}
