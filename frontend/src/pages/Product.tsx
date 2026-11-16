import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useLang } from '../context/language'
import { useAuth } from '../context/auth'
import { useCart } from '../context/cart'
import { getProduct } from '../data/products'
import { createOrder, fetchProduct, type OrderItem } from '../lib/api'
import { errorMessage } from '../lib/errors'
import { formatCents } from '../lib/money'
import { useProductSchema, useSeo } from '../lib/seo'
import { useMainAction } from '../lib/mainAction'

/**
 * One model.
 *
 * The page is the product plan's shape: the thing big in the hero, its
 * figures as rows, and the order card last, in its own section. The
 * photographs are stand-ins of the same kind of equipment (see
 * REPORT-taste.md); until SLS photographs its own panels, a page that showed
 * a model in three poses of the same stand-in would be three lies, so the
 * figures carry the page and the picture frames it.
 */
export default function Product() {
  const { t, lang } = useLang()
  const { slug } = useParams()
  const navigate = useNavigate()
  const { isApproved } = useAuth()
  const cart = useCart()
  const action = useMainAction()
  // Seed from the bundled data for instant paint, then refresh from the API.
  const [product, setProduct] = useState(() => getProduct(slug ?? ''))

  const [qty, setQty] = useState('12')
  const [config, setConfig] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // An order has to say when and where — the API rejects one that does not.
  const [eventType, setEventType] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [venue, setVenue] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')

  const money = (cents: number) => formatCents(cents, lang)

  // A product is the page people actually share, so it gets its own title,
  // description and share image rather than the site-wide card. The blurb is
  // written for humans first; it happens to be the right length for a search
  // result too.
  useSeo({
    title: product?.name ?? t('Product', 'Προϊόν'),
    description: product
      ? `${product.blurb[lang]} ${t('Trade pricing for approved partners.', 'Τιμές χονδρικής για εγκεκριμένους συνεργάτες.')}`
      : t('Equipment from the SLS catalogue.', 'Εξοπλισμός από τον κατάλογο SLS.'),
    image: product?.image,
    // A slug that matches nothing is a 404 in disguise.
    noindex: !product,
  })
  useProductSchema(product)

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
      .then(setProduct)
      .catch(() => {})
  }, [slug, isApproved])

  if (!product) {
    return (
      <section className="section section--hero">
        <div className="wrap">
          <div className="section-head">
            <h1>{t('No model with that name', 'Δεν υπάρχει μοντέλο με αυτό το όνομα')}</h1>
            <p>
              {t(
                'The catalogue is six models; this is not one of them.',
                'Ο κατάλογος έχει έξι μοντέλα· αυτό δεν είναι ένα από αυτά.',
              )}
            </p>
          </div>
          <Link className="btn btn--primary" to="/catalogue">
            {t('See the catalogue', 'Δείτε τον κατάλογο')}
          </Link>
        </div>
      </section>
    )
  }

  // Narrowed alias so the closures below keep `product` non-optional.
  const p = product

  const item = (): OrderItem => ({
    slug: p.slug,
    name: p.name,
    mode: p.buy ? 'buy' : undefined,
    qty: parseInt(qty, 10) || 1,
    configuration: config.trim() || undefined,
    unit_price_cents: p.buy?.price_cents ?? undefined,
  })

  // Place a single-item order request.
  async function submit() {
    if (!isApproved) {
      navigate('/login')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const order = await createOrder({ items: [item()], ...eventDetails() })
      navigate('/order-received', { state: { reference: order.reference, type: 'order' } })
    } catch (e) {
      setError(
        errorMessage(
          e,
          t(
            'That order did not go through. Try again, or email sales@sls.gr.',
            'Η παραγγελία δεν στάλθηκε. Δοκιμάστε ξανά ή στείλτε email στο sales@sls.gr.',
          ),
        ),
      )
      setBusy(false)
    }
  }

  const second = p.thumbs.find((th) => th !== p.image) ?? p.image

  return (
    <>
      <section className="hero hero--product" data-enter aria-labelledby="p-h">
        <div className="wrap">
          <div className="hero-text hero__in">
            <div className="hero__head">
              <div>
                <h1 id="p-h">{p.name}</h1>
                <p className="hero__lead">{lang === 'el' ? p.blurb.el : p.blurb.en}</p>
              </div>
              <div className="btn-row">
                <a className="btn btn--primary" href="#order">
                  {isApproved
                    ? t('Order this model', 'Παραγγείλτε αυτό το μοντέλο')
                    : action.label}
                </a>
              </div>
            </div>
            <div className="hero__stage">
              <img
                src={p.image}
                width={960}
                height={640}
                alt={t(
                  `${p.name}: equipment of its kind, photographed close`,
                  `${p.name}: εξοπλισμός αυτού του είδους, από κοντά`,
                )}
                style={{ '--ly-pos': '50% 50%' } as React.CSSProperties}
                fetchPriority="high"
                data-source="stand-in"
                data-subject={p.category}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="specs" aria-labelledby="spec-h">
        <div className="wrap grid">
          <div className="span-5">
            <div className="section-head">
              <h2 id="spec-h">{t('Specifications', 'Προδιαγραφές')}</h2>
            </div>
            <ul className="rows rows--spec">
              {p.specTable.map((s, i) => (
                <li key={i}>
                  <span className="rows__name">{lang === 'el' ? s.label.el : s.label.en}</span>
                  <span className="rows__value">{lang === 'el' ? s.value.el : s.value.en}</span>
                </li>
              ))}
              <li>
                <span className="rows__name">{t('Price', 'Τιμή')}</span>
                <span className="rows__value">
                  {p.buy?.price ? (
                    `${p.buy.price} ${lang === 'el' ? p.buy.unit.el : p.buy.unit.en}`
                  ) : p.buy ? (
                    <span className="muted">{t('Partner price', 'Τιμή συνεργάτη')}</span>
                  ) : (
                    <span className="muted">{t('On request', 'Κατόπιν αιτήματος')}</span>
                  )}
                </span>
              </li>
            </ul>
          </div>
          <figure
            className="frame frame--photo span-6 start-7"
            style={{ '--ratio': '100%' } as React.CSSProperties}
          >
            <img
              className="frame__img"
              src={second}
              width={960}
              height={720}
              alt={t('The same kit, from another angle', 'Ο ίδιος εξοπλισμός, από άλλη γωνία')}
              loading="lazy"
              data-source="stand-in"
              data-subject={p.category}
            />
          </figure>
        </div>
      </section>

      <section className="section" id="order" aria-labelledby="ord-h">
        <div className="wrap grid">
          <div className="span-6">
            <div className="section-head">
              <h2 id="ord-h">
                {isApproved
                  ? t('Order this model', 'Παραγγείλτε αυτό το μοντέλο')
                  : t('Ordering this model', 'Παραγγελία αυτού του μοντέλου')}
              </h2>
              <p>
                {p.buy
                  ? lang === 'el'
                    ? p.buy.leadTime.el
                    : p.buy.leadTime.en
                  : t(
                      'Scoped and priced for the event it is going to.',
                      'Κοστολογείται για την εκδήλωση στην οποία πηγαίνει.',
                    )}
              </p>
            </div>

            {isApproved ? (
              <div className="form">
                <div className="field">
                  <label htmlFor="qty">{t('Quantity', 'Ποσότητα')}</label>
                  <input
                    id="qty"
                    inputMode="numeric"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="config">{t('Configuration', 'Διαμόρφωση')}</label>
                  <input
                    id="config"
                    value={config}
                    onChange={(e) => setConfig(e.target.value)}
                    placeholder={t('4 × 3 panels', '4 × 3 panels')}
                  />
                </div>
                <div className="field">
                  <label htmlFor="date">{t('Event date', 'Ημερομηνία εκδήλωσης')}</label>
                  <input
                    id="date"
                    type="date"
                    value={eventDate}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setEventDate(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="etype">{t('Event type', 'Τύπος εκδήλωσης')}</label>
                  <input
                    id="etype"
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    placeholder={t('Festival main stage', 'Κύρια σκηνή φεστιβάλ')}
                  />
                </div>
                <div className="field field--full">
                  <label htmlFor="venue">{t('Venue', 'Χώρος')}</label>
                  <input
                    id="venue"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder={t('Technopolis, Athens', 'Τεχνόπολη, Αθήνα')}
                  />
                </div>
                <div className="field field--full">
                  <label htmlFor="addr">{t('Delivery address', 'Διεύθυνση παράδοσης')}</label>
                  <textarea
                    id="addr"
                    rows={2}
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder={t('Street, city, access notes', 'Οδός, πόλη, σημειώσεις πρόσβασης')}
                  />
                </div>

                <div className="btn-row">
                  <button className="btn btn--primary" type="button" disabled={busy} onClick={submit}>
                    {busy ? t('Sending…', 'Αποστολή…') : t('Place the order', 'Υποβολή παραγγελίας')}
                  </button>
                  <button
                    className="btn btn--secondary"
                    type="button"
                    onClick={() => cart.add({ ...item(), image: p.image })}
                  >
                    {t('Add to the order', 'Προσθήκη στην παραγγελία')}
                  </button>
                </div>

                {error && <p className="form__status">{error}</p>}

                <p className="t-small muted">
                  {t(
                    'SLS reads the order and either accepts it at this price or sends it back repriced. Nothing is charged here: the deposit invoice appears on the order page.',
                    'Η SLS διαβάζει την παραγγελία και είτε την αποδέχεται σε αυτή την τιμή είτε την επιστρέφει επανατιμολογημένη. Δεν χρεώνεται τίποτα εδώ: το τιμολόγιο προκαταβολής εμφανίζεται στη σελίδα της παραγγελίας.',
                  )}
                </p>
              </div>
            ) : (
              <>
                <p className="t-body">
                  {t(
                    'The figures above are open to everyone. The price and the order form open with an approved trade account.',
                    'Τα μεγέθη παραπάνω είναι ανοιχτά για όλους. Η τιμή και η φόρμα παραγγελίας ανοίγουν με εγκεκριμένο λογαριασμό χονδρικής.',
                  )}
                </p>
                <div className="btn-row">
                  <Link className="btn btn--primary" to={action.to}>
                    {action.label}
                  </Link>
                  <Link className="btn btn--secondary" to="/login">
                    {t('Sign in', 'Σύνδεση')}
                  </Link>
                </div>
              </>
            )}
          </div>

          {cart.count > 0 && (
            <div className="span-5 start-8">
              <p className="t-label muted">
                {t('On this order', 'Σε αυτή την παραγγελία')} ({cart.count})
              </p>
              <ul className="rows">
                {cart.items.map((it, i) => (
                  <li key={i}>
                    <span className="rows__name">
                      {it.qty ? `${it.qty} × ` : ''}
                      {it.name}
                    </span>
                    <span className="rows__value">
                      {it.unit_price_cents != null && it.unit_price_cents > 0
                        ? money(it.unit_price_cents * (it.qty ?? 1))
                        : ''}
                    </span>
                    {it.configuration && <p className="t-small muted">{it.configuration}</p>}
                  </li>
                ))}
              </ul>
              <div className="btn-row">
                <Link className="btn btn--secondary" to="/quote">
                  {t('Review the order', 'Έλεγχος παραγγελίας')}
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
