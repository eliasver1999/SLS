import { Link } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { useLang } from '../context/language'
import type { Product } from '../data/products'

/**
 * Product card with auth-gated pricing. The API omits `buy.price` for anyone
 * who is not an approved partner, so an absent price — not a CSS rule — is
 * what drives the locked state. Products with no `buy` at all (per-event
 * packages) are quote-only and show no list price.
 */
export default function ProductCard({ product }: { product: Product }) {
  const { lang, t } = useLang()
  const price = product.buy

  return (
    <Link className="card" to={`/product/${product.slug}`}>
      <div className="thumb">
        <img src={product.image} alt={product.name} />
        <span className="tag">{lang === 'el' ? product.tag.el : product.tag.en}</span>
      </div>
      <div className="body">
        <h3>{product.name}</h3>
        <ul className="specs">
          {product.cardSpecs.map((s, i) => (
            <li key={i}>
              <span>{lang === 'el' ? s.label.el : s.label.en}</span>
              <b>{lang === 'el' ? s.value.el : s.value.en}</b>
            </li>
          ))}
        </ul>
        <div className="foot">
          {price?.price ? (
            <span className="price">
              {price.price}
              <small>{lang === 'el' ? price.unit.el : price.unit.en}</small>
            </span>
          ) : price ? (
            <span className="price-locked">
              <Lock size={13} aria-hidden />
              <span>{t('Sign in for pricing', 'Τιμή με σύνδεση')}</span>
            </span>
          ) : (
            <span className="muted" style={{ fontSize: 13 }}>
              {t('Price on request', 'Τιμή κατόπιν αιτήματος')}
            </span>
          )}
          <span className="btn btn-ghost btn-sm">{t('View', 'Προβολή')}</span>
        </div>
      </div>
    </Link>
  )
}
