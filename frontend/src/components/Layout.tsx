import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Link, Outlet, useLocation } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import RouteSeo from './RouteSeo'
import { runKit } from '../lib/kit'
import { useLang } from '../context/language'
import { useMainAction } from '../lib/mainAction'

/** The signed-in tooling and the pages still built on its stylesheet, which
 *  is scoped under .sls-app (src/sls-app.css). Everything else is the
 *  storefront — including any address that is not a route, so the 404 page
 *  is drawn in the storefront's system rather than the tooling's. */
const TOOLING = [
  '/dashboard',
  '/profile',
  '/documents',
  '/orders',
  '/admin',
  '/quote',
  '/ui-kit',
  '/sitemap',
]

const isStorefront = (path: string) =>
  !TOOLING.some((p) => path === p || path.startsWith(`${p}/`))

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
      {storefront ? (
        <main id="main">
          <Outlet />
        </main>
      ) : (
        // The kit sizes every `main > section` to the screen and lays its
        // .container out as a column. The tooling's sections are not built for
        // that, so they sit one level down, where those rules do not reach.
        <main id="main" className="sls-app">
          <div className="sls-app__page">
            <Outlet />
          </div>
        </main>
      )}
      {/* Inside the account area the big call to apply or order is noise:
          the footer keeps its links and drops the close. */}
      <Footer showClose={storefront} />
      {storefront && <ActionBar key={`bar:${pathname}`} />}
    </>
  )
}
