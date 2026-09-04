import { useLang } from '../context/language'
import type { Order } from '../lib/api'
import { statusFlow, statusLabel, STATUS_PILL } from '../lib/orderStatus'
import { Check } from 'lucide-react'

function fmt(iso: string) {
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

/**
 * Visual order tracking: a horizontal stepper of the canonical lifecycle plus a
 * vertical audit trail of every recorded status change (with note + author).
 */
export default function OrderTimeline({ order }: { order: Order }) {
  const { t } = useLang()
  const flow = statusFlow(order.type)
  const cancelled = order.status === 'cancelled'
  const reachedIdx = flow.indexOf(order.status)
  const history = [...(order.status_history ?? [])].reverse() // newest first

  return (
    <div>
      {/* Stepper */}
      {!cancelled && (
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0, marginBottom: 20 }}>
          {flow.map((s, i) => {
            const done = reachedIdx >= 0 && i <= reachedIdx
            const current = i === reachedIdx
            return (
              <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 84 }}>
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 13,
                      border: '2px solid',
                      borderColor: done ? '#48d38a' : 'var(--line)',
                      background: done ? 'rgba(72,211,138,.15)' : 'transparent',
                      color: done ? '#48d38a' : 'var(--grey)',
                      boxShadow: current ? '0 0 0 4px rgba(72,211,138,.12)' : undefined,
                    }}
                  >
                    {done ? <Check size={14} aria-hidden /> : i + 1}
                  </div>
                  <span
                    style={{
                      fontSize: 11.5,
                      textAlign: 'center',
                      color: done ? 'var(--ink, #fff)' : 'var(--grey)',
                      fontWeight: current ? 700 : 400,
                    }}
                  >
                    {statusLabel(s, t)}
                  </span>
                </div>
                {i < flow.length - 1 && (
                  <div
                    style={{
                      width: 34,
                      height: 2,
                      background: reachedIdx > i ? '#48d38a' : 'var(--line)',
                      marginBottom: 18,
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>
      )}

      {cancelled && (
        <div className="notice" style={{ borderColor: 'rgba(255,86,86,.35)', background: 'rgba(255,86,86,.08)', marginBottom: 20 }}>
          <div className="ic" style={{ color: '#ff7a7a' }}>✕</div>
          <div>{t('This order was cancelled.', 'Αυτή η παραγγελία ακυρώθηκε.')}</div>
        </div>
      )}

      {/* Audit trail */}
      <h4 className="head" style={{ fontSize: 12.5, letterSpacing: 1, color: 'var(--grey)', marginBottom: 12 }}>
        {t('HISTORY', 'ΙΣΤΟΡΙΚΟ')}
      </h4>
      {history.length === 0 && (
        <p className="muted" style={{ fontSize: 14 }}>
          {t('No updates yet.', 'Καμία ενημέρωση ακόμη.')}
        </p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {history.map((e, i) => (
          <div key={i} style={{ display: 'flex', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: i === 0 ? '#48d38a' : 'var(--line)',
                  marginTop: 5,
                  flexShrink: 0,
                }}
              />
              {i < history.length - 1 && <div style={{ width: 2, flex: 1, background: 'var(--line)' }} />}
            </div>
            <div style={{ paddingBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span className={`status ${STATUS_PILL[e.status]}`}>{statusLabel(e.status, t)}</span>
                <span className="muted" style={{ fontSize: 12.5 }}>{fmt(e.at)}</span>
                {e.by && <span className="muted" style={{ fontSize: 12.5 }}>· {e.by}</span>}
              </div>
              {e.note && <p style={{ fontSize: 13.5, marginTop: 6 }}>{e.note}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
