// Ultra-cheap endpoint to WARM the Nitro server function ahead of the first real
// request. The landing hero pings this the moment a visitor engages the search
// box, so by the time they submit, the serverless function is already hot and the
// first /api/assistant call skips the cold-start penalty.
export default defineEventHandler(() => ({ ok: true }))
