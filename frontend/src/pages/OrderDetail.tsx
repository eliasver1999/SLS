import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { RotateCcw } from 'lucide-react'
import { useLang } from '../context/language'
import { useAuth } from '../context/auth'
import { useCart } from '../context/cart'
import OrderTimeline from '../components/OrderTimeline'
import OrderDocuments from '../components/OrderDocuments'
import { cancelOrder, fetchOrder, type Order } from '../lib/api'
import { statusLabel, STATUS_PILL } from '../lib/orderStatus'
import { errorMessage } from '../lib/errors'

export default function OrderDetail() {
  const { t, lang } = useLang()
  const { isApproved } = useAuth()
  const cart = useCart()
  const navigate = useNavigate()
  const { id } = useParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)

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
  const eventDate = (iso: string) =>
    new Date(iso).toLocaleDateString(lang === 'el' ? 'el-GR' : 'en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  const cancellable = order.status === 'pending' || order.status === 'quoted'

  function reorder() {
    if (!order) return
    for (const item of order.items) {
      cart.add({
        slug: item.slug,
        name: item.name,
        mode: item.mode,
        qty: item.qty ?? 1,
        configuration: item.configuration ?? undefined,
        unit_price_cents: item.unit_price_cents,
      })
    }
    navigate('/quote')
  }

  async function onCancel() {
    if (!order) return
    if (!confirm(t('Cancel this request? This cannot be undone.', 'Ακύρωση αυτού του αιτήματος; Δεν αναιρείται.'))) return
    setCancelling(true)
    setCancelError(null)
    try {
      setOrder(await cancelOrder(order.id))
    } catch (e) {
      setCancelError(
        errorMessage(e, t('Could not cancel that request.', 'Αδυναμία ακύρωσης του αιτήματος.')),
      )
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
            {(order.event_date || order.venue || order.event_type) && (
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 16 }}>{t('Event', 'Εκδήλωση')}</h3>
                <table className="spec-table mt8">
                  <tbody>
                    {order.event_type && (
                      <tr>
                        <td className="muted">{t('Type', 'Τύπος')}</td>
                        <td style={{ textAlign: 'right' }}>{order.event_type}</td>
                      </tr>
                    )}
                    {order.event_date && (
                      <tr>
                        <td className="muted">{t('Date', 'Ημερομηνία')}</td>
                        <td style={{ textAlign: 'right' }}>{eventDate(order.event_date)}</td>
                      </tr>
                    )}
                    {order.venue && (
                      <tr>
                        <td className="muted">{t('Venue', 'Χώρος')}</td>
                        <td style={{ textAlign: 'right' }}>{order.venue}</td>
                      </tr>
                    )}
                    {order.delivery_address && (
                      <tr>
                        <td className="muted">{t('Delivery', 'Παράδοση')}</td>
                        <td style={{ textAlign: 'right' }}>{order.delivery_address}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            <h3 style={{ fontSize: 16 }}>{t('Items', 'Είδη')}</h3>
            <table className="spec-table mt8">
              <tbody>
                {order.items.map((it, i) => (
                  <tr key={i}>
                    <td>
                      {it.name}
                      {it.qty ? ` × ${it.qty}` : ''}
                      {it.configuration && (
                        <div className="muted" style={{ fontSize: 12 }}>
                          {it.configuration}
                        </div>
                      )}
                      {it.unit_price && (
                        <div className="muted" style={{ fontSize: 12 }}>
                          {it.unit_price} {t('each', 'ανά μονάδα')}
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>{it.line_total ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {order.total_cents > 0 ? (
              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="muted">{t('Subtotal (ex VAT)', 'Υποσύνολο (χ/ΦΠΑ)')}</span>
                  <span>{order.subtotal}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  <span className="muted">
                    {t('VAT', 'ΦΠΑ')} ({order.vat_percent}%)
                  </span>
                  <span>{order.vat}</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    marginTop: 10,
                    paddingTop: 10,
                    borderTop: '1px solid var(--line)',
                  }}
                >
                  <span>{t('Total', 'Σύνολο')}</span>
                  <b className="price">{order.total}</b>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 16 }}>
                <span className="muted">{t('Total', 'Σύνολο')}</span>
                <b className="price">{t('To be quoted', 'Προς προσφορά')}</b>
              </div>
            )}
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
            {/* The same rig goes out repeatedly, so repeating a past job
                should not mean rebuilding it item by item. This refills the
                basket rather than cloning the order server-side: the new
                event needs its own date and venue, and the lines get
                repriced from the current catalogue on submit rather than
                carrying last year's prices forward. */}
            {isApproved && order.items.length > 0 && (
              <button className="btn btn-ghost btn-sm mt16" style={{ marginRight: 8 }} onClick={reorder}>
                <RotateCcw size={13} aria-hidden />
                {t('Order this again', 'Παραγγείλτε ξανά')}
              </button>
            )}
            {cancellable && (
              <button className="btn btn-ghost btn-sm mt16" onClick={onCancel} disabled={cancelling}>
                {cancelling ? t('Cancelling…', 'Ακύρωση…') : t('Cancel request', 'Ακύρωση αιτήματος')}
              </button>
            )}
            {cancelError && (
              <p style={{ color: 'var(--danger)', fontSize: 13, marginTop: 10 }}>{cancelError}</p>
            )}
          </div>

          {/* Tracking */}
          <div className="panel">
            <h3 style={{ fontSize: 16, marginBottom: 16 }}>{t('Tracking', 'Παρακολούθηση')}</h3>
            <OrderTimeline order={order} />

            <hr style={{ border: 0, borderTop: '1px solid var(--line)', margin: '20px 0' }} />
            <OrderDocuments
              orderId={order.id}
              documents={order.documents ?? []}
              canManage={false}
              onChange={() => fetchOrder(order.id).then(setOrder).catch(() => {})}
            />
          </div>
        </div>
      </section>
    </>
  )
}
