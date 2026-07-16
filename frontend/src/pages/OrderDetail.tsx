import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useLang } from '../context/language'
import OrderTimeline from '../components/OrderTimeline'
import { cancelOrder, fetchOrder, type Order } from '../lib/api'
import { statusLabel, STATUS_PILL } from '../lib/orderStatus'

export default function OrderDetail() {
  const { t } = useLang()
  const { id } = useParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    if (!id) return
    setState('loading')
    fetchOrder(id)
      .then((o) => {
        setOrder(o)
        setState('ready')
      })
      .catch(() => setState('error'))
  }, [id])

  if (state === 'loading') {
    return (
      <div className="container section" style={{ textAlign: 'center' }}>
        <p className="muted">{t('Loading…', 'Φόρτωση…')}</p>
      </div>
    )
  }

  if (state === 'error' || !order) {
    return (
      <div className="container section">
        <h1 className="h2">{t('Order not found', 'Η παραγγελία δεν βρέθηκε')}</h1>
        <p className="muted mt8">
          {t("We couldn't find that order, or it isn't yours.", 'Δεν βρέθηκε η παραγγελία ή δεν σας ανήκει.')}
        </p>
        <Link className="btn btn-primary mt24" to="/dashboard">
          {t('Back to dashboard', 'Πίσω στον πίνακα')}
        </Link>
      </div>
    )
  }

  const typeLabel = { quote: t('Quote', 'Προσφορά'), order: t('Order', 'Παραγγελία') }[order.type]
  const cancellable = order.status === 'pending' || order.status === 'quoted'

  async function onCancel() {
    if (!order) return
    if (!confirm(t('Cancel this request? This cannot be undone.', 'Ακύρωση αυτού του αιτήματος; Δεν αναιρείται.'))) return
    setCancelling(true)
    try {
      setOrder(await cancelOrder(order.id))
    } catch {
      /* ignore */
    } finally {
      setCancelling(false)
    }
  }

  return (
    <>
      <div className="page-head">
        <div className="container">
          <div className="crumb">
            Home / <Link to="/dashboard">{t('Dashboard', 'Πίνακας')}</Link> / {order.reference}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
            <h1 className="h2" style={{ fontSize: 28 }}>
              {typeLabel} {order.reference}
            </h1>
            <span className={`status ${STATUS_PILL[order.status]}`}>{statusLabel(order.status, t)}</span>
          </div>
        </div>
      </div>

      <section className="section-sm">
        <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
          {/* Items + summary */}
          <div className="panel">
            <h3 style={{ fontSize: 16 }}>{t('Items', 'Είδη')}</h3>
            <table className="spec-table mt8">
              <tbody>
                {order.items.map((it, i) => (
                  <tr key={i}>
                    <td>
                      {it.name}
                      {it.qty ? ` × ${it.qty}` : ''}
                    </td>
                    <td style={{ textAlign: 'right' }}>{it.price ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 16 }}>
              <span className="muted">{t('Total (ex VAT)', 'Σύνολο (χ/ΦΠΑ)')}</span>
              <b className="price">{order.total ?? t('To be quoted', 'Προς προσφορά')}</b>
            </div>
            {order.notes && (
              <p className="muted mt16" style={{ fontSize: 13 }}>
                <b>{t('Your notes: ', 'Σημειώσεις σας: ')}</b>
                {order.notes}
              </p>
            )}
            <p className="muted mt16" style={{ fontSize: 12.5 }}>
              {t(
                'No payment is taken online — our team confirms details and invoices by bank transfer (IBAN).',
                'Δεν γίνεται πληρωμή online — η ομάδα μας επιβεβαιώνει και τιμολογεί με τραπεζικό έμβασμα (IBAN).',
              )}
            </p>
            {cancellable && (
              <button className="btn btn-ghost btn-sm mt16" onClick={onCancel} disabled={cancelling}>
                {cancelling ? t('Cancelling…', 'Ακύρωση…') : t('Cancel request', 'Ακύρωση αιτήματος')}
              </button>
            )}
          </div>

          {/* Tracking */}
          <div className="panel">
            <h3 style={{ fontSize: 16, marginBottom: 16 }}>{t('Tracking', 'Παρακολούθηση')}</h3>
            <OrderTimeline order={order} />
          </div>
        </div>
      </section>
    </>
  )
}
