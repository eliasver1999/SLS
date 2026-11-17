import { Link, useLocation } from 'react-router-dom'
import { useLang } from '../context/language'
import { useAuth } from '../context/auth'
import { useMainAction } from '../lib/mainAction'

/**
 * footer.closing — row 1 the dealt close (`close-type`: one line and one big
 * button, the button being the picture), row 2 the dealt footer
 * (`footer-dark`: the one dark band at the end of the page).
 */
type Col = { en: string; el: string; links: { to: string; en: string; el: string }[] }

const COLS: Col[] = [
  {
    en: 'Catalogue',
    el: 'Κατάλογος',
    links: [
      { to: '/catalogue?cat=screens', en: 'LED screens', el: 'LED οθόνες' },
      { to: '/catalogue?cat=lighting', en: 'Lighting', el: 'Φωτισμός' },
      { to: '/catalogue?cat=sound', en: 'Sound', el: 'Ήχος' },
      { to: '/catalogue?cat=package', en: 'Packages', el: 'Πακέτα' },
    ],
  },
  {
    en: 'Ordering',
    el: 'Παραγγελία',
    links: [
      // The main action is already in the nav, the hero, the close and the
      // phone bar; a fifth link to it here is clutter, and the kit's action
      // bar reads any twin of it as a reason to hide itself.
      { to: '/ordering', en: 'How an order runs', el: 'Πώς γίνεται μια παραγγελία' },
      { to: '/dashboard', en: 'Your orders', el: 'Οι παραγγελίες σας' },
      { to: '/contact', en: 'Ask about a job', el: 'Ρωτήστε για μια δουλειά' },
    ],
  },
  {
    en: 'Company',
    el: 'Εταιρεία',
    links: [
      { to: '/about', en: 'About SLS', el: 'Σχετικά με τη SLS' },
      { to: '/solutions', en: 'The three ranges', el: 'Οι τρεις σειρές' },
      { to: '/contact', en: 'Contact', el: 'Επικοινωνία' },
    ],
  },
  {
    en: 'Legal',
    el: 'Νομικά',
    links: [
      { to: '/privacy', en: 'Privacy', el: 'Απόρρητο' },
      // No cookies are set, so this is a storage notice rather than consent.
      { to: '/cookies', en: 'Cookies and storage', el: 'Cookies και αποθήκευση' },
      { to: '/terms', en: 'Terms', el: 'Όροι' },
    ],
  },
]

export default function Footer({ showClose = true }: { showClose?: boolean }) {
  const { lang, t } = useLang()
  const { isApproved } = useAuth()
  const action = useMainAction()
  // On the page the main action leads to, the close would send you to the
  // page you are already reading: it goes, and the footer starts at the links.
  const onActionPage = useLocation().pathname === action.to
  const hasClose = showClose && !onActionPage

  const closeLine = isApproved
    ? t('Order panels, lights and sound', 'Παραγγείλτε panels, φώτα και ήχο')
    : t('See the prices before you plan the job', 'Δείτε τις τιμές πριν σχεδιάσετε τη δουλειά')

  const closeNote = isApproved
    ? t(
        'Made to order in two to five weeks.',
        'Κατά παραγγελία σε δύο έως πέντε εβδομάδες.',
      )
    : t(
        'An approved account sees every price in the catalogue.',
        'Ένας εγκεκριμένος λογαριασμός βλέπει κάθε τιμή στον κατάλογο.',
      )

  return (
    <footer
      className={`footer closing footer--dark ground-inverse${hasClose ? '' : ' closing--bare'}`}
      aria-labelledby={hasClose ? 'close-h' : undefined}
    >
      <div className="wrap">
        {hasClose && (
          <div className="closing__cta close--type">
            <div className="section-head">
              <h2 id="close-h">{closeLine}</h2>
            </div>
            <p className="t-small muted">{closeNote}</p>
            <Link className="btn btn--primary btn--xl" to={action.to}>
              {action.label}
              <svg className="m-arrow" viewBox="0 0 12 12" aria-hidden="true">
                <path className="m-arrow__stem" d="M1 6h8" />
                <path className="m-arrow__head" d="M4.5 2.5 8 6l-3.5 3.5" />
              </svg>
            </Link>
          </div>
        )}

        <div className="closing__links">
          <div className="grid">
            <div className="span-4 stack-5">
              <Link className="nav__logo" to="/">
                <span className="mark mark--initial" aria-hidden="true">
                  S
                </span>
                SLS
              </Link>
              <p className="footer__lede">
                {t(
                  'LED walls, lighting rigs and PA systems, built to order. Athens.',
                  'LED τοίχοι, rig φωτισμού και συστήματα PA, κατά παραγγελία. Αθήνα.',
                )}
              </p>
            </div>
            {COLS.map((c) => (
              <div className="span-2 footer__col" key={c.en}>
                <h4>{lang === 'el' ? c.el : c.en}</h4>
                <ul>
                  {c.links.map((l) => (
                    <li key={l.to + l.en}>
                      <Link to={l.to}>{lang === 'el' ? l.el : l.en}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="footer__legal">
            <span>© 2026 SLS</span>
            <span>
              <a href="mailto:hello@sls.gr">hello@sls.gr</a>
            </span>
            <details className="credits">
              <summary>
                {t(
                  'Photographs: Lumenbuddha, Ville Hyvönen, Junyu-K, Scoreed and Lchader, via Wikimedia Commons',
                  'Φωτογραφίες: Lumenbuddha, Ville Hyvönen, Junyu-K, Scoreed και Lchader, μέσω Wikimedia Commons',
                )}
              </summary>
              <p>
                Moving heads rigged on truss by Lumenbuddha (CC BY-SA 4.0); line array by Ville
                Hyvönen (CC BY-SA 2.0); LED pixels by Junyu-K (CC BY 4.0); moving heads in beam by
                Scoreed (CC BY 2.5); mixing console by Lchader (CC BY-SA 4.0); all via Wikimedia
                Commons.
              </p>
            </details>
          </div>
        </div>
      </div>
    </footer>
  )
}
