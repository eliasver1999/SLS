import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../context/language'
import ProductCard from '../components/ProductCard'
import { PRODUCTS, type Category, type Product } from '../data/products'
import { fetchProducts } from '../lib/api'
import { CircleCheck, Hourglass, Lock } from 'lucide-react'

type TypeFilter = 'all' | Category

export default function Catalogue() {
  const { t } = useLang()
  const [type, setType] = useState<TypeFilter>('all')

  // Load from the API; the bundled list is the initial paint + offline fallback.
  const [all, setAll] = useState<Product[]>(PRODUCTS)
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [total, setTotal] = useState(PRODUCTS.length)
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    fetchProducts({ page: 1 })
      .then((res) => {
        if (res.items.length) {
          setAll(res.items)
          setPage(res.page)
          setLastPage(res.lastPage)
          setTotal(res.total)
        }
      })
      .catch(() => {})
  }, [])

  async function loadMore() {
    setLoadingMore(true)
    try {
      const res = await fetchProducts({ page: page + 1 })
      setAll((prev) => [...prev, ...res.items])
      setPage(res.page)
      setLastPage(res.lastPage)
      setTotal(res.total)
    } catch {
      /* ignore */
    } finally {
      setLoadingMore(false)
    }
  }

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
          </div>

          {/* auth banners — CSS shows the right one via body[data-auth] */}
          <div className="notice mt16 guest-only guest-strict" style={{ marginTop: 18 }}>
            <div className="ic"><Lock size={18} aria-hidden /></div>
            <div>
              <b>{t('Pricing is hidden for guests.', 'Οι τιμές είναι κρυφές για επισκέπτες.')}</b>
              <span className="muted">
                {t(
                  ' Specs are open to all — register or apply for approved B2B access to see pricing and buy.',
                  ' Οι προδιαγραφές είναι ανοιχτές — εγγραφείτε ή κάντε αίτηση για εγκεκριμένη B2B πρόσβαση.',
                )}
              </span>
              <div className="mt8">
                <Link className="btn btn-primary btn-sm" to="/register">
                  {t('Create an account', 'Δημιουργία λογαριασμού')}
                </Link>{' '}
                <Link className="btn btn-ghost btn-sm" to="/apply">
                  {t('Apply for access', 'Αίτηση πρόσβασης')}
                </Link>
              </div>
            </div>
          </div>
          <div
            className="notice mt16 pending-only"
            style={{
              marginTop: 18,
              borderColor: 'rgba(255,206,84,.35)',
              background: 'rgba(255,206,84,.08)',
            }}
          >
            <div className="ic" style={{ color: '#ffce54' }}>
              <Hourglass size={18} aria-hidden />
            </div>
            <div>
              <b>{t('Your account is pending approval.', 'Ο λογαριασμός σας είναι σε αναμονή έγκρισης.')}</b>
              <span className="muted">
                {t(
                  ' Specs are open — an admin will approve your account shortly, then pricing and ordering unlock.',
                  ' Οι προδιαγραφές είναι ανοιχτές — μόλις εγκριθεί ο λογαριασμός σας ξεκλειδώνουν τιμές και παραγγελίες.',
                )}
              </span>
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
              <CircleCheck size={18} aria-hidden />
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
                `Showing ${shown.length} of ${total} products`,
                `Εμφάνιση ${shown.length} από ${total} προϊόντα`,
              )}
            </div>
            <div className="grid g3">
              {shown.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
            {type === 'all' && page < lastPage && (
              <div style={{ textAlign: 'center', marginTop: 24 }}>
                <button className="btn btn-ghost" onClick={loadMore} disabled={loadingMore}>
                  {loadingMore ? t('Loading…', 'Φόρτωση…') : t('Load more', 'Περισσότερα')}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
