import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CircleAlert, Lock, Trash2 } from 'lucide-react'
import { useLang } from '../context/language'
import { useAuth } from '../context/auth'
import { useCart } from '../context/cart'
import { createOrder } from '../lib/api'
import { errorMessage } from '../lib/errors'
import { formatCents } from '../lib/money'

/**
 * The basket a customer builds across the catalogue, and where they turn it
 * into a quote or an order.
 *
 * Event technology is specified per event, not per product — a single job
 * routinely spans screens, lighting and sound — so this has to be a page of
 * its own rather than a drawer on whichever product page you happened to be
 * looking at.
 */
export default function Quote() {
  const { t, lang } = useLang()
  const { isApproved } = useAuth()
  const cart = useCart()
  const navigate = useNavigate()

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [eventType, setEventType] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [venue, setVenue] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')

  const money = (cents: number | null | undefined) => formatCents(cents, lang)
  const priced = cart.subtotalCents > 0

  async function submit() {
    if (!isApproved) {
      navigate('/login')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const order = await createOrder({
        items: cart.items.map((it) => ({
          slug: it.slug,
          name: it.name,
          mode: it.mode,
          qty: it.qty ?? 1,
          configuration: it.configuration ?? undefined,
        })),
        notes: notes.trim() || undefined,
        event_type: eventType.trim() || undefined,
        event_date: eventDate || undefined,
        venue: venue.trim() || undefined,
        delivery_address: deliveryAddress.trim() || undefined,
      })
      cart.clear()
      navigate('/order-received', { state: { reference: order.reference, type: 'order' } })
    } catch (e) {
      setError(
        errorMessage(
          e,
          t(
            'We could not submit that request. Please try again or email us.',
            'Δεν μπορέσαμε να υποβάλουμε το αίτημα. Δοκιμάστε ξανά ή στείλτε μας email.',
          ),
        ),
      )
      setBusy(false)
    }
  }

  return (
    <>
      <div className="page-head">
        <div className="container">
          <div className="crumb">
            Home / {t('Your order', 'Η παραγγελία σας')}
          </div>
          <div className="eyebrow">{t('Order', 'Παραγγελία')}</div>
          <h1 className="h2 mt8">{t('Your order', 'Η παραγγελία σας')}</h1>
          <p className="muted mt8">
            {t(
              'Screens, lighting and sound in one order. Our team confirms availability and may discount it before invoicing.',
              'Οθόνες, φωτισμός και ήχος σε μία παραγγελία. Η ομάδα μας επιβεβαιώνει τη διαθεσιμότητα και μπορεί να εφαρμόσει έκπτωση.',
            )}
          </p>
        </div>
      </div>

      <section className="section-sm">
        <div className="container">
          {cart.count === 0 ? (
            <div className="panel center" style={{ padding: 40 }}>
              <h3 style={{ fontSize: 18 }}>{t('Your order is empty', 'Η παραγγελία σας είναι κενή')}</h3>
              <p className="muted mt8">
                {t(
                  'Add items from the catalogue to start a request.',
                  'Προσθέστε είδη από τον κατάλογο για να ξεκινήσετε.',
                )}
              </p>
              <Link className="btn btn-primary mt16" to="/catalogue">
                {t('Browse catalogue', 'Δείτε κατάλογο')}
              </Link>
            </div>
          ) : (
            <div className="quote-layout">
              {/* Lines */}
              <div>
                <div className="table-scroll">
                  <table className="tbl">
                    <tbody>
                      <tr>
                        <th>{t('Item', 'Είδος')}</th>
                        <th style={{ width: 110 }}>{t('Qty', 'Ποσότητα')}</th>
                        <th style={{ textAlign: 'right' }}>{t('Line total', 'Σύνολο')}</th>
                        <th />
                      </tr>
                      {cart.items.map((it, i) => (
                        <tr key={`${it.slug}-${i}`}>
                          <td>
                            <b>{it.name}</b>
                            {it.configuration && (
                              <div className="muted" style={{ fontSize: 12 }}>
                                {it.configuration}
                              </div>
                            )}
                            {it.unit_price_cents ? (
                              <div className="muted" style={{ fontSize: 12 }}>
                                {money(it.unit_price_cents)} {t('each', 'ανά μονάδα')}
                              </div>
                            ) : (
                              <div className="muted" style={{ fontSize: 12 }}>
                                {t('Priced on request', 'Κοστολόγηση κατόπιν αιτήματος')}
                              </div>
                            )}
                          </td>
                          <td>
                            <input
                              value={it.qty ?? 1}
                              inputMode="numeric"
                              aria-label={t('Quantity', 'Ποσότητα')}
                              onChange={(e) => cart.setQty(i, parseInt(e.target.value, 10))}
                              style={{
                                width: 72,
                                background: 'var(--input-bg)',
                                border: '1px solid var(--line)',
                                borderRadius: 8,
                                color: 'var(--text)',
                                padding: '7px 9px',
                                fontSize: 14,
                              }}
                            />
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {it.unit_price_cents ? money(it.unit_price_cents * (it.qty ?? 1)) : '—'}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => cart.remove(i)}
                              title={t('Remove', 'Αφαίρεση')}
                            >
                              <Trash2 size={13} aria-hidden />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 16 }}>
                  <Link className="btn btn-ghost btn-sm" to="/catalogue">
                    {t('Add more items', 'Προσθήκη ειδών')}
                  </Link>
                  <button className="btn btn-ghost btn-sm" onClick={cart.clear}>
                    {t('Clear order', 'Καθαρισμός')}
                  </button>
                </div>
              </div>

              {/* Summary + submit */}
              <aside>
                <div className="panel">
                  <h3 style={{ fontSize: 16 }}>{t('Summary', 'Σύνοψη')}</h3>

                  {priced ? (
                    <div className="approved-only mt16" style={{ fontSize: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className="muted">{t('Estimated subtotal', 'Εκτιμώμενο υποσύνολο')}</span>
                        <b>{money(cart.subtotalCents)}</b>
                      </div>
                      <p className="muted mt8" style={{ fontSize: 12.5 }}>
                        {t(
                          'Ex VAT and indicative — our team confirms the final price.',
                          'Χωρίς ΦΠΑ και ενδεικτικό — η ομάδα μας επιβεβαιώνει την τελική τιμή.',
                        )}
                      </p>
                    </div>
                  ) : (
                    <p className="muted mt16" style={{ fontSize: 13 }}>
                      {t(
                        'Our team will price this request and email you a quote.',
                        'Η ομάδα μας θα κοστολογήσει το αίτημα και θα σας στείλει προσφορά.',
                      )}
                    </p>
                  )}

                  <h4 className="head mt24" style={{ fontSize: 12.5, letterSpacing: 1, color: 'var(--grey)' }}>
                    {t('EVENT DETAILS', 'ΣΤΟΙΧΕΙΑ ΕΚΔΗΛΩΣΗΣ')}
                  </h4>
                  <div className="field mt8">
                    <label>{t('Event date', 'Ημερομηνία')}</label>
                    <input
                      type="date"
                      value={eventDate}
                      min={new Date().toISOString().slice(0, 10)}
                      onChange={(e) => setEventDate(e.target.value)}
                    />
                  </div>
                  <div className="field mt16">
                    <label>{t('Event type', 'Τύπος εκδήλωσης')}</label>
                    <input
                      value={eventType}
                      onChange={(e) => setEventType(e.target.value)}
                      placeholder={t('Festival main stage', 'Κύρια σκηνή φεστιβάλ')}
                    />
                  </div>
                  <div className="field mt16">
                    <label>{t('Venue', 'Χώρος')}</label>
                    <input
                      value={venue}
                      onChange={(e) => setVenue(e.target.value)}
                      placeholder={t('Technopolis, Athens', 'Τεχνόπολη, Αθήνα')}
                    />
                  </div>
                  <div className="field mt16">
                    <label>{t('Delivery address', 'Διεύθυνση παράδοσης')}</label>
                    <textarea
                      rows={2}
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      style={{ resize: 'vertical' }}
                    />
                  </div>
                  <div className="field mt16">
                    <label>{t('Notes', 'Σημειώσεις')}</label>
                    <textarea
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={t('Access, timings, anything we should know', 'Πρόσβαση, ώρες, οτιδήποτε χρειάζεται')}
                      style={{ resize: 'vertical' }}
                    />
                  </div>

                  {isApproved ? (
                    <>
                      {/* One button. There used to be two — "Request a
                          quote" and "Submit as an order" — which asked the
                          customer to choose between two routes into the same
                          process: both arrived as a request the team priced
                          and confirmed. */}
                      <button
                        className="btn btn-primary btn-block mt24"
                        disabled={busy}
                        onClick={submit}
                      >
                        {busy ? t('Sending…', 'Αποστολή…') : t('Place order', 'Καταχώρηση παραγγελίας')}
                      </button>
                      <p className="muted mt8" style={{ fontSize: 12 }}>
                        {t(
                          'No payment is taken now. Our team confirms availability and may apply a discount before invoicing — you will never be charged more than the total above without agreeing to it first.',
                          'Δεν γίνεται πληρωμή τώρα. Η ομάδα μας επιβεβαιώνει τη διαθεσιμότητα και μπορεί να εφαρμόσει έκπτωση — δεν θα χρεωθείτε ποτέ περισσότερα από το παραπάνω σύνολο χωρίς τη συγκατάθεσή σας.',
                        )}
                      </p>
                    </>
                  ) : (
                    <div
                      className="notice mt24"
                      style={{ borderColor: 'rgba(31,139,255,.3)' }}
                    >
                      <div className="ic">
                        <Lock size={18} aria-hidden />
                      </div>
                      <div>
                        <b>{t('Sign in to submit', 'Συνδεθείτε για υποβολή')}</b>
                        <span className="muted">
                          {t(
                            ' Approved B2B partners can request quotes and place orders.',
                            ' Εγκεκριμένοι B2B συνεργάτες μπορούν να ζητήσουν προσφορές.',
                          )}
                        </span>
                        <div className="mt8">
                          <Link className="btn btn-primary btn-sm" to="/login">
                            {t('Sign in', 'Σύνδεση')}
                          </Link>{' '}
                          <Link className="btn btn-ghost btn-sm" to="/apply">
                            {t('Apply for access', 'Αίτηση πρόσβασης')}
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}

                  {error && (
                    <div
                      className="notice mt16"
                      style={{ borderColor: 'rgba(185,28,28,.35)', background: 'rgba(185,28,28,.08)' }}
                    >
                      <div className="ic" style={{ color: 'var(--danger)' }}>
                        <CircleAlert size={18} aria-hidden />
                      </div>
                      <div>{error}</div>
                    </div>
                  )}
                </div>
              </aside>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
