// Fire-and-forget AI-search usage logging. Never blocks or surfaces errors —
// analytics must not affect the search experience.
export function useSearchLog() {
  const { $customFetch } = useNuxtApp()
  return (payload) => {
    if (!import.meta.client) return
    try {
      $customFetch('/search-events', { method: 'POST', body: payload }).catch(() => {})
    } catch { /* ignore */ }
  }
}
