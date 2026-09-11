import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CheckCircle2, RotateCcw } from 'lucide-react'
import { useLang } from '../context/language'
import { useAuth } from '../context/auth'
import { useCart } from '../context/cart'
import OrderTimeline from '../components/OrderTimeline'
import OrderDocuments from '../components/OrderDocuments'
import PaymentDue from '../components/PaymentDue'
import { acceptQuote, cancelOrder, fetchOrder, type Order } from '../lib/api'
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
  const [accepting, setAccepting] = useState(false)
  const [acceptError, setAcceptError] = useState<string | null>(null)
  // An order must say when and where; a quote need not, so a quote that
  // never carried those details collects them at the moment of acceptance.
  // Named for what they are — the page already has an eventDate() date
  // formatter, and a collision here breaks the whole route.
  const [acceptDate, setAcceptDate] = useState('')
  const [acceptVenue, setAcceptVenue] = useState('')

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
  // "Quoted" now means one specific thing: the team needs more than the
  // customer originally agreed to, so the order is waiting on them. A
  // discount never lands here — nobody has to approve paying less.
  const acceptable = order.status === 'quoted'
  const needsEventDetails = !order.event_date || !order.venue
  // Repeating a job only makes sense once the job is over. This used to
  // read `type === 'order' || completed`, which was a real condition while
  // a request could be a quote — every order is type "order" now, so it was
  // always true, and a live job was inviting a duplicate of itself.
  const repeatable = order.status === 'completed' || order.status === 'cancelled'

  async function onAccept() {
    if (!order) return
    setAccepting(true)
    setAcceptError(null)
    try {
      setOrder(
        await acceptQuote(order.id, {
          event_date: acceptDate || undefined,
          venue: acceptVenue.trim() || undefined,
        }),
      )
    } catch (e) {
      setAcceptError(
        errorMessage(e, t('Could not accept that quote.', 'Αδυναμία αποδοχής της προσφοράς.')),
      )
    } finally {
      setAccepting(false)
    }
  }

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
        <div className="container split split-even split-tight">
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
            {/* Before anything is due this explains why there is no
                "pay now" button. Once the team has accepted, it would be
                actively wrong — the deposit is due — so the panel below
                takes over. */}
            {!order.payment.due && (
              <p className="muted mt16" style={{ fontSize: 12.5 }}>
                {t(
                  'No payment is taken online — our team confirms details and invoices by bank transfer (IBAN).',
                  'Δεν γίνεται πληρωμή online — η ομάδα μας επιβεβαιώνει και τιμολογεί με τραπεζικό έμβασμα (IBAN).',
                )}
              </p>
            )}

            {/* The confirmation email asks for a deposit and the completion
                email asks for the balance. Until now the order page said
                nothing about either, so the email was the only place the
                amount and the payment reference existed — and an email is
                exactly the thing people cannot find again. */}
            {order.payment.due && <PaymentDue payment={order.payment} />}
            {/* Accepting turns this very quote into a confirmed order: the
                same record, the same agreed price. It deliberately does not
                send the customer back to the catalogue, because a new
                request is repriced from the catalogue and the negotiated
                rate would be lost without anyone noticing. */}
            {acceptable && (
              <div
                className="notice mt24"
                style={{
                  borderColor: 'var(--ok)',
                  background: 'var(--ok-bg)',
                  alignItems: 'flex-start',
                  display: 'block',
                }}
              >
                <b style={{ fontSize: 14 }}>
                  {t('This order needs your approval', 'Η παραγγελία χρειάζεται την έγκρισή σας')}
                </b>
                <p style={{ fontSize: 13, marginTop: 6, lineHeight: 1.55 }}>
                  {t(
                    `The revised total is ${order.total ?? ''}. We will not proceed until you agree to it — see the note from our team above.`,
                    `Το αναθεωρημένο σύνολο είναι ${order.total ?? ''}. Δεν προχωράμε πριν το εγκρίνετε — δείτε τη σημείωση της ομάδας μας.`,
                  )}
                </p>

                {needsEventDetails && (
                  <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
                    <p className="muted" style={{ fontSize: 12.5 }}>
                      {t(
                        'We just need when and where, so we can schedule crew and delivery.',
                        'Χρειαζόμαστε πότε και πού, για να προγραμματίσουμε συνεργείο και παράδοση.',
                      )}
                    </p>
                    {!order.event_date && (
                      <div className="field" style={{ marginBottom: 0 }}>
                        <label>{t('Event date', 'Ημερομηνία')}</label>
                        <input
                          type="date"
                          value={acceptDate}
                          onChange={(e) => setAcceptDate(e.target.value)}
                        />
                      </div>
                    )}
                    {!order.venue && (
                      <div className="field" style={{ marginBottom: 0 }}>
                        <label>{t('Venue', 'Χώρος')}</label>
                        <input
                          value={acceptVenue}
                          onChange={(e) => setAcceptVenue(e.target.value)}
                          placeholder={t('Technopolis, Athens', 'Τεχνόπολις, Αθήνα')}
                        />
                      </div>
                    )}
                  </div>
                )}

                <button
                  className="btn btn-primary btn-sm mt16"
                  onClick={onAccept}
                  disabled={
                    accepting ||
                    (!order.event_date && !acceptDate) ||
                    (!order.venue && acceptVenue.trim() === '')
                  }
                >
                  <CheckCircle2 size={14} aria-hidden />
                  {accepting
                    ? t('Approving…', 'Έγκριση…')
                    : t('Approve the new total', 'Έγκριση νέου συνόλου')}
                </button>

                {acceptError && (
                  <p style={{ color: 'var(--danger)', fontSize: 13, marginTop: 10 }}>{acceptError}</p>
                )}
              </div>
            )}

            {/* The same rig goes out repeatedly, so repeating a past job
                should not mean rebuilding it item by item. This refills the
                basket rather than cloning the order server-side: the new
                event needs its own date and venue, and the lines get
                repriced from the current catalogue on submit rather than
                carrying last year's prices forward. */}
            {isApproved && repeatable && order.items.length > 0 && (
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
