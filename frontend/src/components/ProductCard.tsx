import { Link } from 'react-router-dom'
import { useLang } from '../context/language'
import type { Mode, Product } from '../data/products'

/**
 * Product card with auth-gated pricing. Both the locked and the real price are
 * rendered with .guest-only / .approved-only — the ported CSS shows/hides them
 * based on body[data-auth] (kept in sync by AuthProvider).
 */
export default function ProductCard({
  product,
  mode,
}: {
  product: Product
  mode?: Mode
}) {
  const { lang, t } = useLang()
  const effMode: Mode = mode && product[mode] ? mode : product.modes[0]
  const price = product[effMode]

  return (
    <Link className="card" to={`/product/${product.slug}?mode=${effMode}`}>
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
          <span className="price-locked guest-only">
            🔒 <span>{t('Sign in for pricing', 'Τιμή με σύνδεση')}</span>
          </span>
          {price && (
            <span className="price approved-only">
              {price.price}
              <small>{lang === 'el' ? price.unit.el : price.unit.en}</small>
            </span>
          )}
          <span className="btn btn-ghost btn-sm">{t('View', 'Προβολή')}</span>
        </div>
      </div>
    </Link>
  )
}
