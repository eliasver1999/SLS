import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useLang } from '../context/language'
import { useAuth } from '../context/auth'
import { useCart } from '../context/cart'
import { getProduct } from '../data/products'
import { createOrder, fetchProduct, type OrderItem } from '../lib/api'
import { CircleAlert, Clock, Lock, Settings2 } from 'lucide-react'
import { errorMessage } from '../lib/errors'
import { formatCents } from '../lib/money'

export default function Product() {
  const { t, lang } = useLang()
  const { slug } = useParams()
  const navigate = useNavigate()
  const { isApproved } = useAuth()
  const cart = useCart()
  // Seed from the bundled data for instant paint, then refresh from the API.
  const [product, setProduct] = useState(() => getProduct(slug ?? ''))

  const [mainImg, setMainImg] = useState(product?.image ?? '')
  const [qty, setQty] = useState('12')
  const [config, setConfig] = useState('4 × 3 (6 m²)')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // An order has to say when and where — the API rejects one that does not.
  const [eventType, setEventType] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [venue, setVenue] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')

  const money = (cents: number) => formatCents(cents, lang)

  const eventDetails = () => ({
    event_type: eventType.trim() || undefined,
    event_date: eventDate || undefined,
    venue: venue.trim() || undefined,
    delivery_address: deliveryAddress.trim() || undefined,
  })

  // Refetch when approval changes: the API only includes pricing for approved
  // partners, so signing in has to pull a fresh payload rather than reveal a
  // price the guest response never contained.
  useEffect(() => {
    if (!slug) return
    fetchProduct(slug)
      .then((p) => {
        setProduct(p)
        setMainImg(p.image)
      })
      .catch(() => {})
  }, [slug, isApproved])

  // The route reuses this component, so re-derive the image on slug change.
  useEffect(() => {
    if (product) setMainImg(product.image)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.slug])

  if (!product) {
    return (
      <div className="container section">
        <h1 className="h2">{t('Product not found', 'Το προϊόν δεν βρέθηκε')}</h1>
        <Link className="btn btn-primary mt24" to="/catalogue">
          {t('Back to catalogue', 'Πίσω στον κατάλογο')}
        </Link>
      </div>
    )
  }

  // Narrowed alias so the closures below keep `product` non-optional.
  const p = product

  const buyItem = (): OrderItem => ({
    slug: p.slug,
    name: p.name,
    mode: 'buy',
    qty: parseInt(qty, 10) || 1,
    unit_price_cents: p.buy?.price_cents ?? undefined,
  })

  const quoteItem = (): OrderItem => ({
    slug: p.slug,
    name: p.name,
    mode: p.buy ? 'buy' : undefined,
    qty: parseInt(qty, 10) || 1,
    unit_price_cents: p.buy?.price_cents ?? undefined,
  })

  // Place a single-item order request.
  async function submit(item: OrderItem) {
    if (!isApproved) {
      navigate('/login')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const order = await createOrder({ type: 'order', items: [item], ...eventDetails() })
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

  function addToQuote(item: OrderItem) {
    cart.add({ ...item, image: p.image })
    document.getElementById('quote')?.scrollIntoView({ behavior: 'smooth' })
  }


  return (
    <>
      <div className="page-head">
        <div className="container">
          <div className="crumb">
            Home / {t('Catalogue', 'Κατάλογος')} /{' '}
            {t(product.tag.en, product.tag.el)} / {product.name}
          </div>
        </div>
      </div>

      <section className="section-sm">
        <div className="container pd">
          {/* GALLERY */}
          <div className="gallery">
            <div className="main">
              <img src={mainImg} alt={product.name} />
            </div>
            <div className="thumbs">
              {product.thumbs.map((th) => (
                <img
                  key={th}
                  src={th}
                  className={th === mainImg ? 'on' : undefined}
                  onClick={() => setMainImg(th)}
                  alt=""
                />
              ))}
            </div>
            <div className="panel mt24">
              <h3 style={{ fontSize: 16 }}>{t('Full specifications', 'Πλήρεις προδιαγραφές')}</h3>
              <table className="spec-table">
                <tbody>
                  {product.specTable.map((s, i) => (
                    <tr key={i}>
                      <td>{lang === 'el' ? s.label.el : s.label.en}</td>
                      <td>{lang === 'el' ? s.value.el : s.value.en}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* BUY / QUOTE */}
          <div>
            <span className="tag" style={{ position: 'static', display: 'inline-block' }}>
              {lang === 'el' ? product.tag.el : product.tag.en}
            </span>
            <h1 className="h2 mt8" style={{ fontSize: 34 }}>
              {product.name}
            </h1>
            <p className="muted mt8">{lang === 'el' ? product.blurb.el : product.blurb.en}</p>

            <div className="panel mt24">
              {product.buy ? (
                <div className="leadtime">
                  <Clock size={15} aria-hidden />
                  <span>{lang === 'el' ? product.buy.leadTime.el : product.buy.leadTime.en}</span>
                </div>
              ) : (
                <div className="leadtime">
                  <Settings2 size={15} aria-hidden />
                  <span>{t('Scoped and priced per event', 'Κοστολόγηση ανά εκδήλωση')}</span>
                </div>
              )}

              {/* Approved members: pricing + actions */}
              <div className="approved-only">
                {product.buy?.price && (
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                    <span className="price" style={{ fontSize: 30 }}>
                      {product.buy.price}
                    </span>
                    <span className="muted">
                      {lang === 'el' ? product.buy.unit.el : product.buy.unit.en} (24%)
                    </span>
                  </div>
                )}
                <div className="row2 mt16">
                  <div className="field">
                    <label>{t('Quantity (panels)', 'Ποσότητα (panels)')}</label>
                    <input value={qty} onChange={(e) => setQty(e.target.value)} />
                  </div>
                  <div className="field">
                    <label>{t('Configuration', 'Διαμόρφωση')}</label>
                    <input value={config} onChange={(e) => setConfig(e.target.value)} />
                  </div>
                </div>

                <h4 className="head mt24" style={{ fontSize: 13, letterSpacing: 1, color: 'var(--grey)' }}>
                  {t('EVENT DETAILS', 'ΣΤΟΙΧΕΙΑ ΕΚΔΗΛΩΣΗΣ')}
                </h4>
                <div className="row2 mt8">
                  <div className="field">
                    <label>{t('Event date', 'Ημερομηνία')}</label>
                    <input
                      type="date"
                      value={eventDate}
                      min={new Date().toISOString().slice(0, 10)}
                      onChange={(e) => setEventDate(e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label>{t('Event type', 'Τύπος εκδήλωσης')}</label>
                    <input
                      value={eventType}
                      onChange={(e) => setEventType(e.target.value)}
                      placeholder={t('Festival main stage', 'Κύρια σκηνή φεστιβάλ')}
                    />
                  </div>
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
                  <label>
                    {t('Delivery address', 'Διεύθυνση παράδοσης')}{' '}
                    <span className="muted" style={{ fontWeight: 400 }}>
                      {t('(optional)', '(προαιρετικό)')}
                    </span>
                  </label>
                  <textarea
                    rows={2}
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder={t('Street, city, access notes', 'Οδός, πόλη, σημειώσεις πρόσβασης')}
                    style={{ resize: 'vertical' }}
                  />
                </div>
                <p className="muted mt8" style={{ fontSize: 12.5 }}>
                  {t(
                    'The date and venue let us schedule crew and delivery — required for an order, optional for a quote.',
                    'Η ημερομηνία και ο χώρος μας επιτρέπουν να προγραμματίσουμε συνεργείο και παράδοση.',
                  )}
                </p>
                <div className="mt16" />
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {product.buy && (
                    <button
                      className="btn btn-primary"
                      disabled={busy}
                      onClick={() => submit(buyItem())}
                    >
                      {busy ? t('Sending…', 'Αποστολή…') : t('Submit order request', 'Υποβολή αιτήματος παραγγελίας')}
                    </button>
                  )}
                  <button className="btn btn-ghost" onClick={() => addToQuote(quoteItem())}>
                    {t('Add to quote', 'Προσθήκη σε προσφορά')}
                  </button>
                </div>
                {error && (
                  <div
                    className="notice mt16"
                    style={{ borderColor: 'rgba(185, 28, 28, .35)', background: 'rgba(255,86,86,.08)' }}
                  >
                    <div className="ic" style={{ color: 'var(--danger)' }}>
                      <CircleAlert size={18} aria-hidden />
                    </div>
                    <div>{error}</div>
                  </div>
                )}
                <p className="muted mt16" style={{ fontSize: 13 }}>
                  {t(
                    'No payment on the website — we email a Scope of Work (SOW) to sign, then invoice by bank transfer (IBAN). VAT applies.',
                    'Καμία πληρωμή στον ιστότοπο — σας στέλνουμε Scope of Work (SOW) για υπογραφή και τιμολόγιο για πληρωμή με τραπεζικό έμβασμα (IBAN). Ισχύει ΦΠΑ.',
                  )}
                </p>
              </div>

              {/* Guests + pending members: pricing locked */}
              <div className="guest-only">
                <div className="price-locked">
                  <Lock size={14} aria-hidden />
                  <span>{t('Sign in for B2B pricing', 'Σύνδεση για B2B τιμές')}</span>
                </div>
                <div className="guest-strict">
                  <Link className="btn btn-primary mt16" to="/register">
                    {t('Create an account', 'Δημιουργία λογαριασμού')}
                  </Link>{' '}
                  <Link className="btn btn-ghost mt16" to="/apply">
                    {t('Apply for access', 'Αίτηση πρόσβασης')}
                  </Link>
                </div>
                <p className="muted mt16 pending-only" style={{ fontSize: 13 }}>
                  {t(
                    'Your account is pending approval — pricing and ordering unlock once an admin approves you.',
                    'Ο λογαριασμός σας είναι σε αναμονή έγκρισης — τιμές και παραγγελίες ξεκλειδώνουν μετά την έγκριση.',
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* QUOTE DRAWER — reflects the real quote cart */}
      <section className="section-sm" id="quote" style={{ paddingTop: 0 }}>
        <div className="container">
          <h3
            className="head"
            style={{ fontSize: 16, color: 'var(--grey)', letterSpacing: 1, marginBottom: 12 }}
          >
            {t('YOUR QUOTE', 'Η ΠΡΟΣΦΟΡΑ ΣΑΣ')} ({cart.count})
          </h3>
          <div className="drawer" style={{ maxWidth: 520 }}>
            {cart.count === 0 && (
              <p className="muted" style={{ fontSize: 14 }}>
                {t(
                  'Your quote is empty. Use “Add to quote” on any product to build a request.',
                  'Η προσφορά σας είναι κενή. Χρησιμοποιήστε «Προσθήκη σε προσφορά».',
                )}
              </p>
            )}
            {cart.items.map((it, i) => (
              <div className="line" key={i}>
                <img src={it.image ?? product.image} alt="" />
                <div style={{ flex: 1 }}>
                  <b>{it.name}</b>
                  <div className="muted" style={{ fontSize: 13 }}>
                    {it.qty ? `${it.qty} × ` : ''}
                    {t('Buy', 'Αγορά')}
                  </div>
                </div>
                {it.unit_price_cents != null && it.unit_price_cents > 0 && (
                  <b className="approved-only">
                    {money(it.unit_price_cents * (it.qty ?? 1))}
                  </b>
                )}
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ marginLeft: 8 }}
                  onClick={() => cart.remove(i)}
                >
                  ✕
                </button>
              </div>
            ))}
            {cart.count > 0 && (
              <>
                {cart.subtotalCents > 0 && (
                  <div
                    className="approved-only"
                    style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, fontSize: 14 }}
                  >
                    <span className="muted">{t('Estimated subtotal', 'Εκτιμώμενο υποσύνολο')}</span>
                    <b>{money(cart.subtotalCents)}</b>
                  </div>
                )}
                <Link className="btn btn-primary btn-block mt16" to="/quote">
                  {t('Review & submit', 'Έλεγχος & υποβολή')}
                </Link>
                <p className="muted mt8" style={{ fontSize: 12.5, textAlign: 'center' }}>
                  {t(
                    'Set the event details and submit on the next step — no payment is taken online.',
                    'Ορίστε τα στοιχεία της εκδήλωσης στο επόμενο βήμα — δεν γίνεται πληρωμή online.',
                  )}
                </p>
              </>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
