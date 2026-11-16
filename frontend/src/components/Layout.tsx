import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Link, Outlet, useLocation } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import RouteSeo from './RouteSeo'
import { runKit } from '../lib/kit'
import { useLang } from '../context/language'
import { useMainAction } from '../lib/mainAction'

/** The storefront. Everything else is the signed-in tooling, which keeps its
 *  own stylesheet scoped under .sls-app (src/sls-app.css). */
const STOREFRONT = ['/', '/solutions', '/catalogue', '/product', '/about', '/ordering', '/contact', '/apply']

const isStorefront = (path: string) =>
  STOREFRONT.some((p) => path === p || (p !== '/' && path.startsWith(`${p}/`)))

/**
 * The phone action bar. The kit wants it as a direct child of <body>
 * (`body > nav.actionbar`), which a React tree cannot produce without a
 * portal: system.js reads it from there to decide when to show it, and
 * system.css sizes the hero around it from the same selector.
 */
function ActionBar() {
  const action = useMainAction()
  return createPortal(
    <nav className="actionbar" aria-label={action.label}>
      <Link className="btn btn--primary" to={action.to}>
        {action.label}
      </Link>
    </nav>,
    document.body,
  )
}

export default function Layout() {
  const { pathname } = useLocation()
  const { lang } = useLang()
  const storefront = isStorefront(pathname)

  // Scroll to top on route change (SPA nav).
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  // The kit's scripts measure and mount against the markup that is in the
  // document now, so they run again whenever the route or the language
  // changes the words they measured.
  useEffect(() => {
    void runKit()
  }, [pathname, lang])

  return (
    <>
      <RouteSeo />
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      {/* Remounted per route: system.js's nav() binds a listener each time
          it runs, and it has to run again for the new page's action bar.
          A fresh node means the old listeners go with the old one. */}
      <Header key={`nav:${pathname}`} />
      <main id="main" className={storefront ? undefined : 'sls-app'}>
        <Outlet />
      </main>
      <Footer />
      {storefront && <ActionBar key={`bar:${pathname}`} />}
    </>
  )
}
