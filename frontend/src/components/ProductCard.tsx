import { Link } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { useLang } from '../context/language'
import type { Product } from '../data/products'

/**
 * Product card with auth-gated pricing. Both the locked and the real price are
 * rendered with .guest-only / .approved-only — the CSS shows/hides them based
 * on body[data-auth] (kept in sync by AuthProvider). Products without a buy
 * price (e.g. per-event packages) are quote-only and show no list price.
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
          {price ? (
            <>
              <span className="price-locked guest-only">
                <Lock size={13} aria-hidden />
                <span>{t('Sign in for pricing', 'Τιμή με σύνδεση')}</span>
              </span>
              <span className="price approved-only">
                {price.price}
                <small>{lang === 'el' ? price.unit.el : price.unit.en}</small>
              </span>
            </>
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
