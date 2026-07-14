import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useLang } from '../context/language'
import { useAuth } from '../context/auth'
import { useCart } from '../context/cart'
import { getProduct, type Mode } from '../data/products'
import { createOrder, fetchProduct, type OrderItem } from '../lib/api'

export default function Product() {
  const { t, lang } = useLang()
  const { slug } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const cart = useCart()
  // Seed from the bundled data for instant paint, then refresh from the API.
  const [product, setProduct] = useState(() => getProduct(slug ?? ''))

  const initialMode: Mode =
    params.get('mode') === 'rent' && product?.rent ? 'rent' : product?.buy ? 'buy' : 'rent'
  const [mode, setMode] = useState<Mode>(initialMode)
  const [mainImg, setMainImg] = useState(product?.image ?? '')
  const [qty, setQty] = useState('12')
  const [config, setConfig] = useState('4 × 3 (6 m²)')
  const [busy, setBusy] = useState(false)
  const [addons, setAddons] = useState<Record<string, boolean>>({
    delivery: true,
    setup: true,
    rigging: false,
  })
  const [range, setRange] = useState<{ from: number | null; to: number | null }>({
    from: 12,
    to: 15,
  })

  useEffect(() => {
    if (!slug) return
    fetchProduct(slug)
      .then((p) => {
        setProduct(p)
        setMainImg(p.image)
      })
      .catch(() => {})
  }, [slug])

  // Reset mode/image when navigating to a *different* product (the route reuses
  // this component, so per-product state must be re-derived on slug change).
  useEffect(() => {
    if (!product) return
    const wanted = params.get('mode')
    const next: Mode =
      wanted === 'rent' && product.rent
        ? 'rent'
        : wanted === 'buy' && product.buy
          ? 'buy'
          : (product.modes[0] as Mode)
    setMode(next)
    setMainImg(product.image)
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

  const toggleAddon = (k: string) => setAddons((a) => ({ ...a, [k]: !a[k] }))

  const buyItem = (): OrderItem => ({
    slug: product.slug,
    name: product.name,
    mode: 'buy',
    qty: parseInt(qty, 10) || 1,
    price: product.buy?.price,
  })
  const rentItem = (): OrderItem => ({
    slug: product.slug,
    name: product.name,
    mode: 'rent',
    qty: 1,
    from: range.from ? `${range.from} Aug 2026` : undefined,
    to: range.to ? `${range.to} Aug 2026` : undefined,
    price: product.rent?.price,
  })

  // Place a single-item order/rental request.
  async function submit(type: 'order' | 'rental', item: OrderItem) {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    setBusy(true)
    try {
      const order = await createOrder({ type, items: [item] })
      navigate('/order-received', { state: { reference: order.reference, type } })
    } catch {
      setBusy(false)
    }
  }

  function addToQuote(item: OrderItem) {
    cart.add({ ...item, image: product.image })
    document.getElementById('quote')?.scrollIntoView({ behavior: 'smooth' })
  }

  async function requestQuote() {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    if (cart.count === 0) return
    setBusy(true)
    try {
      const order = await createOrder({ type: 'quote', items: cart.items })
      cart.clear()
      navigate('/order-received', { state: { reference: order.reference, type: 'quote' } })
    } catch {
      setBusy(false)
    }
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

          {/* BUY / RENT */}
          <div>
            <span className="tag" style={{ position: 'static', display: 'inline-block' }}>
              {lang === 'el' ? product.tag.el : product.tag.en}
            </span>
            <h1 className="h2 mt8" style={{ fontSize: 34 }}>
              {product.name}
            </h1>
            <p className="muted mt8">{lang === 'el' ? product.blurb.el : product.blurb.en}</p>

            {product.modes.length > 1 && (
              <div className="toggle mt24">
                {product.buy && (
                  <button
                    className={mode === 'buy' ? 'on' : undefined}
                    onClick={() => setMode('buy')}
                  >
                    {t('Buy', 'Αγορά')}
                  </button>
                )}
                {product.rent && (
                  <button
                    className={mode === 'rent' ? 'on' : undefined}
                    onClick={() => setMode('rent')}
                  >
                    {t('Rent', 'Ενοικίαση')}
                  </button>
                )}
              </div>
            )}

            {/* BUY MODE */}
            {mode === 'buy' && product.buy && (
              <div className="panel mt24">
                <div className="leadtime">
                  ⚙ <span>{lang === 'el' ? product.buy.leadTime.el : product.buy.leadTime.en}</span>
                </div>
                <div className="approved-only">
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                    <span className="price" style={{ fontSize: 30 }}>
                      {product.buy.price}
                    </span>
                    <span className="muted">
                      {lang === 'el' ? product.buy.unit.el : product.buy.unit.en} (24%)
                    </span>
                  </div>
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
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <button
                      className="btn btn-primary"
                      disabled={busy}
                      onClick={() => submit('order', buyItem())}
                    >
                      {busy ? t('Sending…', 'Αποστολή…') : t('Submit order request', 'Υποβολή αιτήματος παραγγελίας')}
                    </button>
                    <button className="btn btn-ghost" onClick={() => addToQuote(buyItem())}>
                      {t('Add to quote', 'Προσθήκη σε προσφορά')}
                    </button>
                  </div>
                  <p className="muted mt16" style={{ fontSize: 13 }}>
                    {t(
                      'No payment on the website — we email a Scope of Work (SOW) to sign, then invoice by bank transfer (IBAN). VAT applies.',
                      'Καμία πληρωμή στον ιστότοπο — σας στέλνουμε Scope of Work (SOW) για υπογραφή και τιμολόγιο για πληρωμή με τραπεζικό έμβασμα (IBAN). Ισχύει ΦΠΑ.',
                    )}
                  </p>
                </div>
                <div className="guest-only">
                  <div className="price-locked">
                    🔒 <span>{t('Sign in for B2B pricing', 'Σύνδεση για B2B τιμές')}</span>
                  </div>
                  <Link className="btn btn-primary mt16" to="/apply">
                    {t('Apply for access', 'Αίτηση πρόσβασης')}
                  </Link>
                </div>
              </div>
            )}

            {/* RENT MODE */}
            {mode === 'rent' && product.rent && (
              <div className="panel mt24">
                <div className="row2">
                  <div className="field">
                    <label>{t('From', 'Από')}</label>
                    <input readOnly value={range.from ? `${range.from} Aug 2026` : ''} />
                  </div>
                  <div className="field">
                    <label>{t('To', 'Έως')}</label>
                    <input readOnly value={range.to ? `${range.to} Aug 2026` : ''} />
                  </div>
                </div>
                <RentalCalendar range={range} onChange={setRange} />
                <div className="approved-only mt16">
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                    <span className="price" style={{ fontSize: 28 }}>
                      {product.rent.price}
                    </span>
                    <span className="muted">
                      {lang === 'el' ? product.rent.unit.el : product.rent.unit.en}
                    </span>
                  </div>
                  <h4
                    style={{
                      fontSize: 13,
                      color: 'var(--grey)',
                      margin: '16px 0 8px',
                      letterSpacing: 1,
                    }}
                  >
                    {t('ADD-ONS', 'ΠΡΟΣΘΕΤΑ')}
                  </h4>
                  <label
                    className={`check${addons.delivery ? ' on' : ''}`}
                    onClick={() => toggleAddon('delivery')}
                  >
                    <i /> <span>{t('Delivery & pickup (Athens)', 'Παράδοση & παραλαβή (Αθήνα)')}</span>
                  </label>
                  <label
                    className={`check${addons.setup ? ' on' : ''}`}
                    onClick={() => toggleAddon('setup')}
                  >
                    <i /> <span>{t('On-site setup & operator', 'Επιτόπου εγκατάσταση & χειριστής')}</span>
                  </label>
                  <label
                    className={`check${addons.rigging ? ' on' : ''}`}
                    onClick={() => toggleAddon('rigging')}
                  >
                    <i /> <span>{t('Rigging & truss', 'Rigging & truss')}</span>
                  </label>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <button
                      className="btn btn-primary mt16"
                      disabled={busy}
                      onClick={() => submit('rental', rentItem())}
                    >
                      {busy ? t('Sending…', 'Αποστολή…') : t('Request booking', 'Αίτημα κράτησης')}
                    </button>
                    <button className="btn btn-ghost mt16" onClick={() => addToQuote(rentItem())}>
                      {t('Add to quote', 'Προσθήκη σε προσφορά')}
                    </button>
                  </div>
                  <p className="muted mt16" style={{ fontSize: 13 }}>
                    {t(
                      'No payment on the website — we confirm your dates by email and invoice by bank transfer (IBAN).',
                      'Καμία πληρωμή στον ιστότοπο — επιβεβαιώνουμε τις ημερομηνίες με email και τιμολογούμε με τραπεζικό έμβασμα (IBAN).',
                    )}
                  </p>
                </div>
                <div className="guest-only mt16">
                  <div className="price-locked">
                    🔒 <span>{t('Sign in to see rental rates', 'Σύνδεση για τιμές ενοικίασης')}</span>
                  </div>
                </div>
              </div>
            )}
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
                    {it.qty} ×{' '}
                    {it.mode === 'rent'
                      ? `${t('Rent', 'Ενοικ.')}${it.from ? ` · ${it.from}–${it.to}` : ''}`
                      : t('Buy', 'Αγορά')}
                  </div>
                </div>
                {it.price && <b className="approved-only">{it.price}</b>}
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
                <button
                  className="btn btn-primary btn-block mt16"
                  disabled={busy}
                  onClick={requestQuote}
                >
                  {busy ? t('Sending…', 'Αποστολή…') : t('Request quote', 'Αίτημα προσφοράς')}
                </button>
                <p className="muted mt8" style={{ fontSize: 12.5, textAlign: 'center' }}>
                  {t(
                    'Submitting sends a request — no payment is taken online.',
                    'Η υποβολή στέλνει αίτημα — δεν γίνεται πληρωμή online.',
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

// Interactive availability calendar (August 2026). Leading days belong to July
// (greyed/out); a few August days are booked (busy) and not selectable. Click a
// day to set the range start, click a later free day to set the end.
type DayRange = { from: number | null; to: number | null }

const LEADING_OUT = [28, 29, 30, 31] // trailing July days shown in the grid
const BUSY = new Set([5, 6, 20, 21, 22]) // booked August days

function RentalCalendar({
  range,
  onChange,
}: {
  range: DayRange
  onChange: (r: DayRange) => void
}) {
  const { t } = useLang()

  const cells: { n: number; out?: boolean }[] = [
    ...LEADING_OUT.map((n) => ({ n, out: true })),
    ...Array.from({ length: 31 }, (_, i) => ({ n: i + 1 })),
  ]

  function pick(day: number) {
    // Reset to a new start if nothing chosen, a full range exists, or the click
    // is before the current start.
    if (range.from == null || range.to != null || day < range.from) {
      onChange({ from: day, to: null })
      return
    }
    if (day === range.from) return
    // Reject a range that spans a booked day.
    for (let d = range.from + 1; d <= day; d++) if (BUSY.has(d)) return
    onChange({ from: range.from, to: day })
  }

  function classFor(n: number, out?: boolean) {
    if (out) return 'd out'
    if (BUSY.has(n)) return 'd busy'
    const { from, to } = range
    if (from != null && (n === from || n === to)) return 'd sel'
    if (from != null && to != null && n > from && n < to) return 'd range'
    return 'd'
  }

  return (
    <div className="cal">
      <div className="top">
        <span>‹</span>
        <span>{t('August 2026', 'Αύγουστος 2026')}</span>
        <span>›</span>
      </div>
      <div className="grid7">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <div className="dow" key={i}>
            {d}
          </div>
        ))}
        {cells.map((c, i) => {
          const selectable = !c.out && !BUSY.has(c.n)
          return (
            <div
              className={classFor(c.n, c.out)}
              key={i}
              onClick={selectable ? () => pick(c.n) : undefined}
              style={selectable ? { cursor: 'pointer' } : undefined}
            >
              {c.n}
            </div>
          )
        })}
      </div>
    </div>
  )
}
