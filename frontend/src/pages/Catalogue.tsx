import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { useLang } from '../context/language'
import ProductCard from '../components/ProductCard'
import { PRODUCTS, type Category, type Mode, type Product } from '../data/products'
import { fetchProducts } from '../lib/api'

type TypeFilter = 'all' | Category

export default function Catalogue() {
  const { t } = useLang()
  const [params] = useSearchParams()
  const [mode, setMode] = useState<Mode>(params.get('mode') === 'rent' ? 'rent' : 'buy')
  const [type, setType] = useState<TypeFilter>('all')

  // Load from the API; the bundled list is the initial paint + offline fallback.
  const [all, setAll] = useState<Product[]>(PRODUCTS)
  useEffect(() => {
    fetchProducts()
      .then((p) => p.length && setAll(p))
      .catch(() => {})
  }, [])

  const shown = useMemo(
    () => all.filter((p) => (type === 'all' ? true : p.category === type)),
    [all, type],
  )

  const typeChips: { key: TypeFilter; label: string }[] = [
    { key: 'screens', label: t('Screens', 'Οθόνες') },
    { key: 'lighting', label: t('Lighting', 'Φωτισμός') },
    { key: 'sound', label: t('Sound', 'Ήχος') },
  ]

  return (
    <>
      <div className="page-head">
        <div className="container">
          <div className="crumb">Home / {t('Catalogue', 'Κατάλογος')}</div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            <div>
              <div className="eyebrow">{t('Catalogue', 'Κατάλογος')}</div>
              <h1 className="h2 mt8">{t('Screens, lighting & sound', 'Οθόνες, φωτισμός & ήχος')}</h1>
            </div>
            <div className="toggle">
              <button className={mode === 'buy' ? 'on' : undefined} onClick={() => setMode('buy')}>
                {t('Buy', 'Αγορά')}
              </button>
              <button className={mode === 'rent' ? 'on' : undefined} onClick={() => setMode('rent')}>
                {t('Rent', 'Ενοικίαση')}
              </button>
            </div>
          </div>

          {/* auth banners — CSS shows the right one via body[data-auth] */}
          <div className="notice mt16 guest-only" style={{ marginTop: 18 }}>
            <div className="ic">🔒</div>
            <div>
              <b>{t('Pricing is hidden for guests.', 'Οι τιμές είναι κρυφές για επισκέπτες.')}</b>
              <span className="muted">
                {t(
                  ' Specs are open to all — sign in or apply for approved B2B access to see pricing, buy and rent.',
                  ' Οι προδιαγραφές είναι ανοιχτές — συνδεθείτε ή κάντε αίτηση για εγκεκριμένη B2B πρόσβαση.',
                )}
              </span>
              <div className="mt8">
                <Link className="btn btn-primary btn-sm" to="/apply">
                  {t('Apply for access', 'Αίτηση πρόσβασης')}
                </Link>
              </div>
            </div>
          </div>
          <div
            className="notice mt16 approved-only"
            style={{
              marginTop: 18,
              borderColor: 'rgba(72,211,138,.35)',
              background: 'rgba(72,211,138,.08)',
            }}
          >
            <div className="ic" style={{ color: '#48d38a' }}>
              ✓
            </div>
            <div>
              <b>
                {t(
                  'Pricing unlocked — Nova Events Ltd (VAT EL123456789)',
                  'Τιμές ξεκλειδωμένες — Nova Events Ltd (ΑΦΜ EL123456789)',
                )}
              </b>
              <span className="muted">
                {t(
                  ' B2B net prices shown, VAT added at checkout.',
                  ' Καθαρές B2B τιμές, ΦΠΑ στο ταμείο.',
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      <section className="section-sm">
        <div className="container split">
          {/* FILTERS */}
          <aside className="filters">
            <h4>{t('Type', 'Τύπος')}</h4>
            <div>
              <span
                className={`chip${type === 'all' ? ' on' : ''}`}
                onClick={() => setType('all')}
              >
                {t('All', 'Όλα')}
              </span>
              {typeChips.map((c) => (
                <span
                  key={c.key}
                  className={`chip${type === c.key ? ' on' : ''}`}
                  onClick={() => setType(c.key)}
                >
                  {c.label}
                </span>
              ))}
            </div>
            <h4>{t('Placement', 'Τοποθέτηση')}</h4>
            <div>
              <span className="chip on">Indoor</span>
              <span className="chip">Outdoor</span>
            </div>
            <h4>{t('Mode', 'Λειτουργία')}</h4>
            <div>
              <span
                className={`chip${mode === 'buy' ? ' on' : ''}`}
                onClick={() => setMode('buy')}
              >
                {t('Buy', 'Αγορά')}
              </span>
              <span
                className={`chip${mode === 'rent' ? ' on' : ''}`}
                onClick={() => setMode('rent')}
              >
                {t('Rent', 'Ενοικίαση')}
              </span>
            </div>
            <h4>{t('Pixel pitch', 'Pixel pitch')}</h4>
            <label className="check on">
              <i /> P1.5 – P2.6
            </label>
            <label className="check on">
              <i /> P2.9 – P3.9
            </label>
            <label className="check">
              <i /> P4.8 – P10
            </label>
            <h4>{t('Use case', 'Χρήση')}</h4>
            <label className="check on">
              <i /> <span>{t('Festival / concert', 'Φεστιβάλ / συναυλία')}</span>
            </label>
            <label className="check">
              <i /> <span>{t('Corporate', 'Εταιρικό')}</span>
            </label>
            <label className="check">
              <i /> <span>{t('Retail', 'Λιανική')}</span>
            </label>
          </aside>

          {/* GRID */}
          <div>
            <div className="muted" style={{ fontSize: 14, marginBottom: 16 }}>
              {t(
                `Showing ${shown.length} of 48 products`,
                `Εμφάνιση ${shown.length} από 48 προϊόντα`,
              )}
            </div>
            <div className="grid g3">
              {shown.map((p) => (
                <ProductCard key={p.slug} product={p} mode={mode} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
