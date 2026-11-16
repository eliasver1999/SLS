import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useLang } from '../context/language'
import { useAuth } from '../context/auth'
import { CatalogueRowList } from '../components/CatalogueRows'
import { PRODUCTS, type Category, type Product } from '../data/products'
import { fetchProducts } from '../lib/api'
import { useMainAction } from '../lib/mainAction'

type TypeFilter = 'all' | Category
type Placement = 'all' | 'indoor' | 'outdoor'

/** Pitch bands as the trade talks about them, in mm. */
const PITCH_BANDS = [
  { key: 'fine', label: 'P1.5 – P2.6', min: 1.5, max: 2.6 },
  { key: 'mid', label: 'P2.9 – P3.9', min: 2.9, max: 3.9 },
  { key: 'coarse', label: 'P4.8 – P10', min: 4.8, max: 10 },
] as const

type PitchKey = (typeof PITCH_BANDS)[number]['key']

const CATEGORIES: Category[] = ['screens', 'lighting', 'sound', 'package']

/**
 * The catalogue.
 *
 * Three stacked coloured notice boxes used to sit above it, one per account
 * state, and the approved one named a company — "Nova Events Ltd (VAT
 * EL123456789)" — that every approved partner saw, whoever they were. There
 * is one line now, and it says only what is true of the person reading it.
 */
export default function Catalogue() {
  const { t } = useLang()
  const { isApproved, user } = useAuth()
  const action = useMainAction()
  const [params, setParams] = useSearchParams()

  const type = (params.get('cat') ?? 'all') as TypeFilter
  const placement = (params.get('placement') ?? 'all') as Placement
  const pitch = (params.get('pitch') as PitchKey | null) ?? null

  const [all, setAll] = useState<Product[]>(PRODUCTS)
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [total, setTotal] = useState(PRODUCTS.length)
  const [loadingMore, setLoadingMore] = useState(false)

  const band = PITCH_BANDS.find((b) => b.key === pitch)

  const query = useMemo(
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
    fetchProducts({ ...query, page: 1 })
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
  }, [query, isApproved])

  async function loadMore() {
    setLoadingMore(true)
    try {
      const res = await fetchProducts({ ...query, page: page + 1 })
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

  const filtered = type !== 'all' || placement !== 'all' || pitch !== null

  const set = (key: string, value: string | null) => {
    const next = new URLSearchParams(params)
    if (value === null || value === 'all') next.delete(key)
    else next.set(key, value)
    setParams(next, { replace: true })
  }

  const label = (c: Category) =>
    ({
      screens: t('Screens', 'Οθόνες'),
      lighting: t('Lighting', 'Φωτισμός'),
      sound: t('Sound', 'Ήχος'),
      package: t('Packages', 'Πακέτα'),
    })[c]

  const priceLine = isApproved
    ? t(
        'Prices are your account’s, ex VAT. Greek VAT of 24% is added on the order.',
        'Οι τιμές είναι του λογαριασμού σας, χωρίς ΦΠΑ. Ο ελληνικός ΦΠΑ 24% προστίθεται στην παραγγελία.',
      )
    : user
      ? t(
          'Your account is waiting for approval. The figures are open to everyone; the prices follow.',
          'Ο λογαριασμός σας περιμένει έγκριση. Τα μεγέθη είναι ανοιχτά για όλους· οι τιμές ακολουθούν.',
        )
      : t(
          'Every figure here is open to everyone. The prices open with an approved trade account.',
          'Κάθε μέγεθος εδώ είναι ανοιχτό για όλους. Οι τιμές ανοίγουν με εγκεκριμένο λογαριασμό χονδρικής.',
        )

  return (
    <>
      {/* One section, two screens: a catalogue is one idea, and a whole
          empty screen of page title before the models is a screen the buyer
          scrolls past. */}
      <section
        className="section"
        id="models"
        data-enter
        style={{ '--h': 2 } as React.CSSProperties}
        aria-labelledby="cat-h"
      >
        <div className="wrap">
          <div className="section-head section-head--row">
            <div>
              <h1 id="cat-h">{t('Catalogue', 'Κατάλογος')}</h1>
              <p>{priceLine}</p>
            </div>
            {!isApproved && (
              <Link className="btn btn--primary" to={action.to}>
                {action.label}
              </Link>
            )}
          </div>

          <div className="grid">
          <div className="span-3">
            <p className="t-label muted">{t('Filter', 'Φίλτρο')}</p>
            <div className="chip-row">
              <button
                type="button"
                className={`pill${type === 'all' ? ' is-on' : ''}`}
                onClick={() => set('cat', null)}
              >
                {t('All', 'Όλα')}
              </button>
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`pill${type === c ? ' is-on' : ''}`}
                  onClick={() => set('cat', c)}
                >
                  {label(c)}
                </button>
              ))}
            </div>

            {/* Indoor/outdoor and pitch only classify screens, so these are
                hidden when the selection cannot contain any — better than
                offering a filter that would always return nothing. */}
            {(type === 'all' || type === 'screens') && (
              <>
                <p className="t-label muted">{t('Placement', 'Τοποθέτηση')}</p>
                <div className="chip-row">
                  {(['all', 'indoor', 'outdoor'] as const).map((key) => (
                    <button
                      key={key}
                      type="button"
                      className={`pill${placement === key ? ' is-on' : ''}`}
                      onClick={() => set('placement', key)}
                    >
                      {key === 'all'
                        ? t('Any', 'Όλα')
                        : key === 'indoor'
                          ? t('Indoor', 'Εσωτερικό')
                          : t('Outdoor', 'Εξωτερικό')}
                    </button>
                  ))}
                </div>

                <p className="t-label muted">{t('Pixel pitch', 'Pixel pitch')}</p>
                <div className="chip-row">
                  {PITCH_BANDS.map((b) => (
                    <button
                      key={b.key}
                      type="button"
                      className={`pill${pitch === b.key ? ' is-on' : ''}`}
                      onClick={() => set('pitch', pitch === b.key ? null : b.key)}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="span-8 start-5">
            {all.length === 0 ? (
              <p className="t-body">
                {t(
                  'Nothing in the catalogue matches that. Widen the pitch band or the placement.',
                  'Τίποτα στον κατάλογο δεν ταιριάζει. Διευρύνετε το pitch ή την τοποθέτηση.',
                )}
              </p>
            ) : (
              <CatalogueRowList items={all} />
            )}

            <p className="t-small muted">
              {filtered
                ? t(`${total} of ${PRODUCTS.length} models`, `${total} από ${PRODUCTS.length} μοντέλα`)
                : t(`${total} models`, `${total} μοντέλα`)}
            </p>

            {page < lastPage && (
              <button className="btn btn--secondary" type="button" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? t('Loading…', 'Φόρτωση…') : t('Show the rest', 'Δείτε τα υπόλοιπα')}
              </button>
            )}
          </div>
          </div>
        </div>
      </section>
    </>
  )
}
