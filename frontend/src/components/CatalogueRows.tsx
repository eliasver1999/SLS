import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../context/language'
import { useAuth } from '../context/auth'
import { fetchProducts } from '../lib/api'
import { PRODUCTS, type Product } from '../data/products'

/**
 * The catalogue read across: the model and its price on one line, the
 * figures that tell it apart on the line under.
 *
 * Six models in six cards would be six pictures of the same dark panel —
 * SLS has no photograph of its own goods yet, so a card grid would be a grid
 * of stand-ins. As rows they compare, which is what a buyer is doing here.
 * The line under each name is written from the product's own spec table, so
 * it cannot drift from the catalogue.
 *
 * The price is whatever the API returns: it omits `buy.price` for anyone who
 * is not an approved partner, so an absent price is what shows the lock, not
 * a CSS rule.
 */
const FIGURE_LABELS = [
  'Pixel pitch',
  'Brightness',
  'Curve',
  'Panel size',
  'Output',
  'Max SPL',
  'Drivers',
  'Screen',
  'Lights',
  'Sound',
]

function figures(p: Product, el: boolean): string {
  const parts = FIGURE_LABELS.map((label) => p.specTable.find((s) => s.label.en === label))
    .filter((s): s is NonNullable<typeof s> => Boolean(s))
    .map((s) => (el ? s.value.el : s.value.en))

  const lead = p.buy ? (el ? p.buy.leadTime.el : p.buy.leadTime.en) : ''
  return [parts.join(' · '), lead].filter(Boolean).join('. ')
}

export function CatalogueRowList({ items }: { items: Product[] }) {
  const { t, lang } = useLang()

  return (
    <ul className="rows rows--catalogue">
      {items.map((p) => (
        <li key={p.slug}>
          <span className="rows__name">
            <Link to={`/product/${p.slug}`}>{p.name}</Link>
          </span>
          <span className="rows__value">
            {p.buy?.price ? (
              p.buy.price
            ) : p.buy ? (
              <span className="muted">{t('Partner price', 'Τιμή συνεργάτη')}</span>
            ) : (
              <span className="muted">{t('Price on request', 'Τιμή κατόπιν αιτήματος')}</span>
            )}
          </span>
          <p className="t-small muted">{figures(p, lang === 'el')}</p>
        </li>
      ))}
    </ul>
  )
}

/** The whole catalogue, fetched once — the home page's section. */
export default function CatalogueRows() {
  const { isApproved } = useAuth()
  const [items, setItems] = useState<Product[]>(PRODUCTS)

  useEffect(() => {
    fetchProducts()
      .then((res) => res.items.length && setItems(res.items))
      .catch(() => {})
  }, [isApproved])

  return <CatalogueRowList items={items} />
}
