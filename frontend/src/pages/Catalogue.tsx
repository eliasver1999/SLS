import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../context/language'
import { useAuth } from '../context/auth'
import ProductCard from '../components/ProductCard'
import { PRODUCTS, type Category, type Product } from '../data/products'
import { fetchProducts } from '../lib/api'
import { CircleCheck, Hourglass, Lock } from 'lucide-react'

type TypeFilter = 'all' | Category
type Placement = 'all' | 'indoor' | 'outdoor'

/** Pitch bands as the trade talks about them, in mm. */
const PITCH_BANDS = [
  { key: 'fine', label: 'P1.5 – P2.6', min: 1.5, max: 2.6 },
  { key: 'mid', label: 'P2.9 – P3.9', min: 2.9, max: 3.9 },
  { key: 'coarse', label: 'P4.8 – P10', min: 4.8, max: 10 },
] as const

type PitchKey = (typeof PITCH_BANDS)[number]['key']

export default function Catalogue() {
  const { t } = useLang()
  const { isApproved } = useAuth()
  const [type, setType] = useState<TypeFilter>('all')
  const [placement, setPlacement] = useState<Placement>('all')
  const [pitch, setPitch] = useState<PitchKey | null>(null)

  // Load from the API; the bundled list is the initial paint + offline fallback.
  const [all, setAll] = useState<Product[]>(PRODUCTS)
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [total, setTotal] = useState(PRODUCTS.length)
  const [loadingMore, setLoadingMore] = useState(false)

  // Refetch when approval changes: the API only includes pricing for approved
  // partners, so signing in has to pull a fresh payload rather than reveal a
  // price the guest response never contained.
  const band = PITCH_BANDS.find((b) => b.key === pitch)

  const params = useMemo(
    () => ({
      category: type === 'all' ? undefined : type,
      placement: placement === 'all' ? undefined : placement,
      pitch_min: band?.min,
      pitch_max: band?.max,
    }),
    [type, placement, band],
  )

  // Filtering happens server-side so it covers the whole catalogue, not just
  // the page already fetched — and so it still holds once "load more" is used.
  useEffect(() => {
    let current = true
    fetchProducts({ ...params, page: 1 })
      .then((res) => {
        if (!current) return
        setAll(res.items)
        setPage(res.page)
        setLastPage(res.lastPage)
        setTotal(res.total)
      })
      .catch(() => {})
    return () => {
      current = false
    }
  }, [params, isApproved])

  async function loadMore() {
    setLoadingMore(true)
    try {
      const res = await fetchProducts({ ...params, page: page + 1 })
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

  const shown = all
  const filtered = type !== 'all' || placement !== 'all' || pitch !== null

  function clearFilters() {
    setType('all')
    setPlacement('all')
    setPitch(null)
  }

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
            <div className="ic" style={{ color: 'var(--warn)' }}>
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
            <div className="ic" style={{ color: 'var(--ok)' }}>
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
            {/* Indoor/outdoor and pitch only classify screens, so these are
                hidden when the selection cannot contain any — better than
                offering a filter that would always return nothing. */}
            {(type === 'all' || type === 'screens') && (
              <>
                <h4>{t('Placement', 'Τοποθέτηση')}</h4>
                <div>
                  {(['all', 'indoor', 'outdoor'] as const).map((key) => (
                    <span
                      key={key}
                      className={`chip${placement === key ? ' on' : ''}`}
                      onClick={() => setPlacement(key)}
                    >
                      {key === 'all'
                        ? t('Any', 'Όλα')
                        : key === 'indoor'
                          ? t('Indoor', 'Εσωτερικό')
                          : t('Outdoor', 'Εξωτερικό')}
                    </span>
                  ))}
                </div>

                <h4>{t('Pixel pitch', 'Pixel pitch')}</h4>
                {PITCH_BANDS.map((b) => (
                  <label
                    key={b.key}
                    className={`check${pitch === b.key ? ' on' : ''}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setPitch(pitch === b.key ? null : b.key)}
                  >
                    <i /> {b.label}
                  </label>
                ))}
              </>
            )}

            {filtered && (
              <button className="btn btn-ghost btn-sm mt16" onClick={clearFilters}>
                {t('Clear filters', 'Καθαρισμός φίλτρων')}
              </button>
            )}
          </aside>

          {/* GRID */}
          <div>
            <div className="muted" style={{ fontSize: 14, marginBottom: 16 }}>
              {t(
                filtered
                  ? `${total} ${total === 1 ? 'match' : 'matches'}`
                  : `Showing ${shown.length} of ${total} products`,
                filtered
                  ? `${total} ${total === 1 ? 'αποτέλεσμα' : 'αποτελέσματα'}`
                  : `Εμφάνιση ${shown.length} από ${total} προϊόντα`,
              )}
            </div>
            {shown.length === 0 ? (
              <div className="panel center" style={{ padding: 36 }}>
                <h3 style={{ fontSize: 17 }}>
                  {t('Nothing matches those filters', 'Κανένα αποτέλεσμα')}
                </h3>
                <p className="muted mt8" style={{ fontSize: 14 }}>
                  {t(
                    'Try widening the pitch range or placement.',
                    'Δοκιμάστε ευρύτερο pixel pitch ή τοποθέτηση.',
                  )}
                </p>
                <button className="btn btn-ghost btn-sm mt16" onClick={clearFilters}>
                  {t('Clear filters', 'Καθαρισμός φίλτρων')}
                </button>
              </div>
            ) : (
              <div className="grid g3">
                {shown.map((p) => (
                  <ProductCard key={p.slug} product={p} />
                ))}
              </div>
            )}
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
