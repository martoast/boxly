type ObservationInput = {
  pageText?: string
  candidateCount?: number
  completed?: boolean
}

export type ObservationState = 'pending' | 'success' | 'failed'

// Classify only the live-session panel state. Generic loading language is
// deliberately excluded so a transient reconnect/response never ends a run.
export function classifyLiveObservation({ pageText = '', candidateCount = 0, completed = false }: ObservationInput): ObservationState {
  if (candidateCount > 0 || completed) return 'success'
  const lines = String(pageText).split('\n').map((line) => line.trim()).filter(Boolean)
  const terminalFailure = lines.some((line) =>
    /\b(?:la\s+)?sesi[oó]n(?:\s+en\s+vivo)?\s+no\s+est[aá]\s+disponible\b/i.test(line) ||
    /\bsesi[oó]n\s+expirada\b/i.test(line) ||
    /\bno\s+se\s+pudo\s+(?:iniciar|conectar|mantener)\b.*\bsesi[oó]n\b/i.test(line) ||
    /\b(?:error|fall[oó])\b.*\bsesi[oó]n\b/i.test(line)
  )
  // The page is an accumulating transcript: stale loading copy may remain
  // beside the later terminal state, so terminal failure must win.
  if (terminalFailure) return 'failed'
  // Connecting/responding and unknown states are both non-terminal.
  return 'pending'
}
