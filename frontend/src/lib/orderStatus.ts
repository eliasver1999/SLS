import type { OrderStatus, OrderType } from './api'

// Canonical lifecycle per order type (cancelled is an off-path terminal state).
const FLOW: Record<OrderType, OrderStatus[]> = {
  quote: ['pending', 'quoted', 'confirmed', 'completed'],
  order: ['pending', 'confirmed', 'in_production', 'completed'],
}

export function statusFlow(type: OrderType): OrderStatus[] {
  return FLOW[type] ?? FLOW.order
}

/** CSS pill class used across dashboard/admin (.status ok|wait|blue|rej). */
export const STATUS_PILL: Record<OrderStatus, string> = {
  pending: 'wait',
  // Waiting on the customer, not finished — amber, not green.
  quoted: 'wait',
  confirmed: 'ok',
  in_production: 'blue',
  completed: 'ok',
  cancelled: 'rej',
}

export function statusLabel(s: OrderStatus, t: (en: string, el: string) => string): string {
  return {
    pending: t('Pending', 'Σε αναμονή'),
    quoted: t('Awaiting approval', 'Αναμονή έγκρισης'),
    confirmed: t('Confirmed', 'Επιβεβαιωμένο'),
    in_production: t('In production', 'Σε παραγωγή'),
    completed: t('Completed', 'Ολοκληρώθηκε'),
    cancelled: t('Cancelled', 'Ακυρώθηκε'),
  }[s]
}
