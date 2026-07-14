import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useLang } from '../context/language'
import { useAuth } from '../context/auth'

type NavItem = { to: string; key: string; en: string; el: string }

const NAV: NavItem[] = [
  { to: '/', key: 'home', en: 'Home', el: 'Αρχική' },
  { to: '/solutions', key: 'solutions', en: 'Solutions', el: 'Λύσεις' },
  { to: '/catalogue', key: 'catalogue', en: 'Catalogue', el: 'Κατάλογος' },
  { to: '/catalogue?mode=rent', key: 'rentals', en: 'Rentals', el: 'Ενοικιάσεις' },
  { to: '/projects', key: 'projects', en: 'Projects', el: 'Έργα' },
  { to: '/about', key: 'about', en: 'About', el: 'Σχετικά' },
  { to: '/contact', key: 'contact', en: 'Contact', el: 'Επικοινωνία' },
]

export default function Header() {
  const { lang, setLang } = useLang()
  const { user, isAdmin, logout } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  // Active nav item by first path segment.
  const activeKey = (() => {
    if (pathname === '/') return 'home'
    if (pathname.startsWith('/solutions')) return 'solutions'
    if (pathname.startsWith('/catalogue')) return 'catalogue'
    if (pathname.startsWith('/projects')) return 'projects'
    if (pathname.startsWith('/about')) return 'about'
    if (pathname.startsWith('/contact')) return 'contact'
    return ''
  })()

  const memberHref = isAdmin ? '/admin' : '/dashboard'

  const onLogout = async () => {
    setOpen(false)
    await logout()
    navigate('/')
  }

  return (
    <header className="header">
      <div className="container">
        <Link className="brand" to="/">
          <img src="/assets/logo.png" alt="SLS" />
        </Link>
        <nav className="nav">
          {NAV.map((n) => (
            <Link
              key={n.key}
              to={n.to}
              className={n.key === activeKey ? 'active' : undefined}
            >
              {lang === 'el' ? n.el : n.en}
            </Link>
          ))}
        </nav>
        <div className="spacer" />
        <div className="actions">
          <div className="lang">
            <button className={lang === 'en' ? 'on' : undefined} onClick={() => setLang('en')}>
              EN
            </button>
            <button className={lang === 'el' ? 'on' : undefined} onClick={() => setLang('el')}>
              ΕΛ
            </button>
          </div>
          {user ? (
            <>
              <Link className="btn btn-ghost btn-sm" to={memberHref}>
                {isAdmin ? (lang === 'el' ? 'Admin' : 'Admin') : lang === 'el' ? 'Πίνακας' : 'Dashboard'}
              </Link>
              <button className="btn btn-primary btn-sm" onClick={onLogout}>
                {lang === 'el' ? 'Αποσύνδεση' : 'Logout'}
              </button>
            </>
          ) : (
            <>
              <Link className="btn btn-ghost btn-sm" to="/login">
                {lang === 'el' ? 'Σύνδεση' : 'Login'}
              </Link>
              <Link className="btn btn-primary btn-sm" to="/apply">
                {lang === 'el' ? 'Γίνετε Συνεργάτης' : 'Become a Partner'}
              </Link>
            </>
          )}
          <button className="burger" aria-label="Menu" onClick={() => setOpen((o) => !o)}>
            ☰
          </button>
        </div>
      </div>

      <div className={`mobile-nav${open ? ' open' : ''}`}>
        {NAV.map((n) => (
          <Link
            key={n.key}
            to={n.to}
            className={n.key === activeKey ? 'active' : undefined}
            onClick={() => setOpen(false)}
          >
            {lang === 'el' ? n.el : n.en}
          </Link>
        ))}
        {user ? (
          <>
            <Link className="btn btn-ghost btn-block" to={memberHref} onClick={() => setOpen(false)}>
              {isAdmin ? 'Admin' : lang === 'el' ? 'Πίνακας' : 'Dashboard'}
            </Link>
            <button className="btn btn-primary btn-block" onClick={onLogout}>
              {lang === 'el' ? 'Αποσύνδεση' : 'Logout'}
            </button>
          </>
        ) : (
          <>
            <Link className="btn btn-ghost btn-block" to="/login" onClick={() => setOpen(false)}>
              {lang === 'el' ? 'Σύνδεση' : 'Login'}
            </Link>
            <Link className="btn btn-primary btn-block" to="/apply" onClick={() => setOpen(false)}>
              {lang === 'el' ? 'Γίνετε Συνεργάτης' : 'Become a Partner'}
            </Link>
          </>
        )}
      </div>
    </header>
  )
}
