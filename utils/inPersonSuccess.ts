// Pure state + copy for the post-payment page /in-person/success?ref=...
// `ref` is an RV-... reservation number (new flow) or a purchase-request / shopping-trip booking
// number (legacy payers still redirected here by the API): those only get "payment received".
export type Lang = 'es' | 'en'
export type Kind = 'notFound' | 'legacy' | 'polling' | 'delayed' | 'confirmed' | 'taken' | 'inactive' | 'login' | 'error'
export type Action = 'pick' | 'whatsapp' | 'detail' | 'home' | 'requests'

export interface SuccessInput {
  ref: string
  reservation?: { status?: string; slot_taken_reason?: string | null; refund_pending?: boolean; amount_usd?: number | string } | null
  errorStatus?: number | null // HTTP status of a failed GET /in-person/reservations/{ref}; 0/undefined = network error
  fetched?: boolean // false before the first request
  tries?: number
  maxTries?: number
}
export interface SuccessView {
  kind: Kind
  reason: 'hour_unavailable' | 'paid_first' | null
  refundPending: boolean
  fetch: boolean // the page must call the API (first time) for this ref
  poll: boolean // the page must fetch again in a moment
  actions: Action[]
}

export const isReservationRef = (ref: string) => /^RV-/i.test(ref)

const ACTIONS: Record<Kind, Action[]> = {
  notFound: ['whatsapp', 'pick'],
  legacy: ['requests', 'whatsapp', 'home'],
  polling: [],
  delayed: ['whatsapp', 'detail'],
  confirmed: ['whatsapp', 'detail', 'home'],
  taken: ['pick', 'whatsapp'],
  inactive: ['pick', 'whatsapp'],
  login: [],
  error: ['whatsapp', 'pick'],
}

export function successView(i: SuccessInput): SuccessView {
  const v = (kind: Kind, extra: Partial<SuccessView> = {}): SuccessView => ({
    kind, reason: null, refundPending: false, fetch: false, poll: false, actions: ACTIONS[kind], ...extra,
  })
  const ref = (i.ref || '').trim()
  if (!ref) return v('notFound')
  if (!isReservationRef(ref)) return v('legacy') // never call the reservations API for these
  if (!i.fetched) return v('polling', { fetch: true })
  if (i.errorStatus !== undefined && i.errorStatus !== null) {
    if (i.errorStatus === 401) return v('login')
    if (i.errorStatus === 404 || i.errorStatus === 403) return v('notFound') // unknown or someone else's reservation
    return v('error')
  }
  const r = i.reservation
  if (!r?.status) return v('error')
  if (r.status === 'confirmed' || r.status === 'completed') return v('confirmed')
  if (r.status === 'slot_taken') {
    return v('taken', { reason: r.slot_taken_reason === 'hour_unavailable' ? 'hour_unavailable' : 'paid_first', refundPending: !!r.refund_pending })
  }
  if (r.status === 'cancelled' || r.status === 'expired') return v('inactive', { refundPending: !!r.refund_pending })
  if (r.status === 'pending_payment') {
    return (i.tries ?? 0) < (i.maxTries ?? 10) ? v('polling', { poll: true }) : v('delayed')
  }
  return v('error')
}

export const loginUrl = (fullPath: string) => `/login?redirect=${encodeURIComponent(fullPath)}`

// Stripe cancel_url (/in-person?cancelled=1, or the legacy /in-person/review?cancelled=1 which redirects there).
export const showCancelledBanner = (q: unknown) => q !== undefined && q !== null && q !== '' && q !== '0' && q !== 'false'

const usd = (n: number | string | null | undefined) => (n === undefined || n === null || n === '' ? '' : `$${Number(n)} USD`)

export function viewCopy(view: SuccessView, lang: string, amount?: number | string | null): { title: string; body: string } {
  const es = lang === 'es'
  const pay = usd(amount)
  switch (view.kind) {
    case 'polling':
      return { title: es ? 'Confirmando tu pago…' : 'Confirming your payment…', body: es ? 'Esto toma unos segundos. No cierres esta página.' : 'This takes a few seconds. Please keep this page open.' }
    case 'delayed':
      return {
        title: es ? 'Seguimos confirmando tu pago' : 'We are still confirming your payment',
        body: es ? 'Tu pago aún no se refleja. No pagues de nuevo: escríbenos por WhatsApp y lo revisamos de inmediato.' : 'Your payment does not show yet. Please do not pay again: message us on WhatsApp and we will check right away.',
      }
    case 'confirmed':
      return {
        title: es ? '¡Reservaste tu horario!' : 'Your time is reserved!',
        body: es
          ? `Tu shopper te contactará por WhatsApp para coordinar lo que buscas. Ya pagaste${pay ? ' ' + pay : ''} para apartar tu horario; las horas trabajadas y el 10% del total de tus compras se cobran al terminar (menos lo ya pagado).`
          : `Your shopper will contact you on WhatsApp to coordinate what you are looking for. You already paid${pay ? ' ' + pay : ''} to hold your time; the hours worked and 10% of the total spent are charged when we finish (minus what you already paid).`,
      }
    case 'taken': {
      const title = view.reason === 'hour_unavailable'
        ? (es ? 'Ese horario ya no está disponible' : 'That time is no longer available')
        : (es ? 'Alguien reservó ese horario justo antes' : 'Someone reserved that time just before you')
      const why = view.reason === 'hour_unavailable'
        ? (es ? 'El horario dejó de estar disponible mientras pagabas.' : 'The time stopped being available while you were paying.')
        : (es ? 'Otra persona completó su pago antes que tú.' : 'Another customer completed their payment before you.')
      const refund = view.refundPending
        ? (es ? `Tu reembolso${pay ? ' de ' + pay : ''} está en proceso: te contactaremos por WhatsApp o correo para confirmarlo.` : `Your refund${pay ? ' of ' + pay : ''} is being processed: we will contact you on WhatsApp or by email to confirm it.`)
        : (es ? `Tu pago${pay ? ' de ' + pay : ''} fue reembolsado; puede tardar unos días en verse en tu tarjeta.` : `Your payment${pay ? ' of ' + pay : ''} was refunded; it can take a few days to show on your card.`)
      return { title, body: `${why} ${refund} ${es ? 'Elige otro horario y con gusto te ayudamos por WhatsApp.' : 'Pick another time, and we are happy to help on WhatsApp.'}` }
    }
    case 'inactive':
      return {
        title: es ? 'Esta reserva ya no está activa' : 'This reservation is no longer active',
        body: view.refundPending
          ? (es ? 'Tu reembolso está en proceso: te contactaremos por WhatsApp o correo para confirmarlo. Puedes elegir un nuevo horario cuando quieras.' : 'Your refund is being processed: we will contact you on WhatsApp or by email to confirm it. You can pick a new time whenever you like.')
          : (es ? 'Puedes elegir un nuevo horario cuando quieras.' : 'You can pick a new time whenever you like.'),
      }
    case 'legacy':
      return {
        title: es ? 'Pago recibido' : 'Payment received',
        body: es ? 'Recibimos tu pago. Puedes ver el avance en tus solicitudes de compra, y si tienes dudas escríbenos por WhatsApp.' : 'We received your payment. You can follow progress in your purchase requests, and message us on WhatsApp with any questions.',
      }
    case 'notFound':
      return { title: es ? 'No encontramos esta reserva' : 'We could not find this reservation', body: es ? 'Si ya pagaste, escríbenos por WhatsApp y lo revisamos de inmediato.' : 'If you already paid, message us on WhatsApp and we will check right away.' }
    case 'login':
      return { title: es ? 'Inicia sesión para ver tu reserva' : 'Sign in to see your reservation', body: es ? 'Te llevamos a iniciar sesión y regresas aquí.' : 'We are taking you to sign in and you will come back here.' }
    default:
      return { title: es ? 'No pudimos confirmar tu reserva' : 'We could not confirm your reservation', body: es ? 'Si ya pagaste, escríbenos por WhatsApp y lo revisamos de inmediato.' : 'If you already paid, message us on WhatsApp and we will check right away.' }
  }
}
