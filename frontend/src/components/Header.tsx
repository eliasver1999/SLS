import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useLang } from '../context/language'
import { useAuth } from '../context/auth'
import { useCart } from '../context/cart'
import { useMainAction } from '../lib/mainAction'

/**
 * nav-split (dealt): four words on the left, the name on the centre line,
 * the actions on the right. system.js binds the sheet, the Escape key and
 * aria-expanded; nothing here duplicates that.
 *
 * Four words is the recipe's count — they share the left third, and a fifth
 * reaches the name at 1024.
 */
type NavItem = { to: string; key: string; en: string; el: string }

const NAV: NavItem[] = [
  { to: '/catalogue', key: 'catalogue', en: 'Catalogue', el: 'Κατάλογος' },
  { to: '/solutions', key: 'solutions', en: 'Ranges', el: 'Σειρές' },
  { to: '/ordering', key: 'ordering', en: 'Ordering', el: 'Παραγγελία' },
  { to: '/contact', key: 'contact', en: 'Contact', el: 'Επικοινωνία' },
]

export default function Header() {
  const { lang, setLang, t } = useLang()
  const { user, isAdmin, logout } = useAuth()
  const cart = useCart()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const action = useMainAction()

  const activeKey =
    NAV.find((n) => pathname === n.to || pathname.startsWith(`${n.to}/`))?.key ??
    (pathname.startsWith('/product/') ? 'catalogue' : '')

  const onLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <header className="nav nav--split">
      <div className="wrap nav__bar">
        <nav className="nav__links" aria-label={t('Main', 'Κύριο')}>
          {NAV.map((n) => (
            <div className="nav__item" key={n.key}>
              <Link
                className="nav__link"
                to={n.to}
                aria-current={n.key === activeKey ? 'page' : undefined}
              >
                {lang === 'el' ? n.el : n.en}
              </Link>
            </div>
          ))}
        </nav>

        <Link className="nav__logo" to="/">
          <span className="mark mark--initial" aria-hidden="true">
            S
          </span>
          SLS
        </Link>

        <div className="nav__actions">
          <div className="lang-switch" role="group" aria-label={t('Language', 'Γλώσσα')}>
            <button
              type="button"
              className={lang === 'en' ? 'is-on' : undefined}
              aria-pressed={lang === 'en'}
              onClick={() => setLang('en')}
            >
              EN
            </button>
            <button
              type="button"
              className={lang === 'el' ? 'is-on' : undefined}
              aria-pressed={lang === 'el'}
              onClick={() => setLang('el')}
            >
              ΕΛ
            </button>
          </div>

          {cart.count > 0 && (
            <Link className="nav__link" to="/quote">
              {t('Order', 'Παραγγελία')} ({cart.count})
            </Link>
          )}

          {user ? (
            <>
              <Link className="nav__link" to={isAdmin ? '/admin' : '/dashboard'}>
                {isAdmin ? 'Admin' : t('Dashboard', 'Πίνακας')}
              </Link>
              <button className="nav__link" type="button" onClick={onLogout}>
                {t('Sign out', 'Αποσύνδεση')}
              </button>
            </>
          ) : (
            <Link className="nav__link" to="/login">
              {t('Sign in', 'Σύνδεση')}
            </Link>
          )}

          <Link className="btn btn--primary" to={action.to}>
            {action.label}
          </Link>
        </div>

        <button className="nav__toggle" type="button" aria-expanded="false" aria-label={t('Menu', 'Μενού')}>
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path d="M2 5h14M2 13h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </header>
  )
}
