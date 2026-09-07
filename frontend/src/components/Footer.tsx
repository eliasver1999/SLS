import { Link } from 'react-router-dom'
import { useLang } from '../context/language'

type Col = { en: string; el: string; links: { to: string; en: string; el: string }[] }

const COLS: Col[] = [
  {
    en: 'Company',
    el: 'Εταιρεία',
    links: [
      { to: '/about', en: 'About', el: 'Σχετικά' },
      { to: '/projects', en: 'Projects', el: 'Έργα' },
      { to: '/contact', en: 'Contact', el: 'Επικοινωνία' },
      { to: '/apply', en: 'Become a Partner', el: 'Γίνετε Συνεργάτης' },
    ],
  },
  {
    en: 'Shop',
    el: 'Κατάστημα',
    links: [
      { to: '/catalogue', en: 'Catalogue', el: 'Κατάλογος' },
      { to: '/product/aurora-p26', en: 'Buy made-to-order', el: 'Αγορά κατά παραγγελία' },
      { to: '/dashboard', en: 'Member area', el: 'Περιοχή μελών' },
    ],
  },
  {
    en: 'Legal',
    el: 'Νομικά',
    links: [
      { to: '/privacy', en: 'Privacy Policy', el: 'Πολιτική Απορρήτου' },
      // No cookies are set, so this is a storage notice rather than consent.
      { to: '/cookies', en: 'Cookies & storage', el: 'Cookies & αποθήκευση' },
      { to: '/terms', en: 'Terms', el: 'Όροι' },
      { to: '/privacy', en: 'GDPR', el: 'GDPR' },
    ],
  },
]

export default function Footer() {
  const { lang, t } = useLang()
  return (
    <footer className="footer">
      <div className="container">
        <div className="cols">
          <div>
            <Link className="brand" to="/">
              <img src="/assets/logo.png" alt="SLS" />
            </Link>
            <p className="muted" style={{ maxWidth: '34ch', fontSize: 14 }}>
              {t(
                'Premium LED screens, lighting and sound — supplied and set up with local accountability.',
                'Premium LED οθόνες, φωτισμός και ήχος — προμήθεια και εγκατάσταση με τοπική υπευθυνότητα.',
              )}
            </p>
            <div className="social">
              <span>f</span>
              <span>in</span>
              <span>ig</span>
              <span>▶</span>
            </div>
          </div>
          {COLS.map((c) => (
            <div key={c.en}>
              <h4>{lang === 'el' ? c.el : c.en}</h4>
              {c.links.map((l, i) => (
                <Link key={i} to={l.to}>
                  {lang === 'el' ? l.el : l.en}
                </Link>
              ))}
            </div>
          ))}
        </div>
        <div className="legal">
          <span>
            {t(
              '© 2026 SLS · Sound · Lights · Screens',
              '© 2026 SLS · Ήχος · Φώτα · Οθόνες',
            )}
          </span>
          <span>
            {t('Athens, Greece · Bilingual EN/ΕΛ', 'Αθήνα, Ελλάδα · Δίγλωσσο EN/ΕΛ')}
          </span>
        </div>
      </div>
    </footer>
  )
}
