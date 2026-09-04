import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { useLang } from '../context/language'

export default function NotFound() {
  const { t } = useLang()

  return (
    <section className="section">
      <div className="container">
        <div className="form center" style={{ maxWidth: 520, margin: '0 auto' }}>
          <div
            className="ic"
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'rgba(31,139,255,.16)',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 18px',
              color: 'var(--sky)',
            }}
          >
            <Compass size={30} aria-hidden />
          </div>
          <div className="eyebrow center">404</div>
          <h1 className="h2 mt8">{t('Page not found', 'Η σελίδα δεν βρέθηκε')}</h1>
          <p className="muted mt8">
            {t(
              'That link may be out of date. Try the catalogue, or get in touch and we will point you the right way.',
              'Ο σύνδεσμος μπορεί να είναι παλιός. Δείτε τον κατάλογο ή επικοινωνήστε μαζί μας.',
            )}
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 20 }}>
            <Link className="btn btn-primary" to="/catalogue">
              {t('Browse catalogue', 'Δείτε κατάλογο')}
            </Link>
            <Link className="btn btn-ghost" to="/">
              {t('Back to home', 'Αρχική')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
